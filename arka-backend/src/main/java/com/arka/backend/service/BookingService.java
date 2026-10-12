package com.arka.backend.service;

import com.arka.backend.dto.BookingRequest;
import com.arka.backend.dto.BookingResponse;
import com.arka.backend.dto.QuoteRequest;
import com.arka.backend.dto.QuoteResponse;
import com.arka.backend.entity.*;
import com.arka.backend.exceptions.BookingConflictException;
import com.arka.backend.exceptions.BookingRuleException;
import com.arka.backend.exceptions.GlobalExceptionHandler;
import com.arka.backend.exceptions.NotFoundException;
import com.arka.backend.notification.BookingEvent;
import com.arka.backend.repository.BookingRepository;
import com.arka.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final HallService hallService;
    private final PricingService pricingService;
    private final BusyHoursService busyHoursService;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final int freeCancelHours;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository, HallService hallService,
                          PricingService pricingService, BusyHoursService busyHoursService, ApplicationEventPublisher events,
                          Clock clock, @Value("${app.booking.free-cancel-hours}") int freeCancelHours) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.hallService = hallService;
        this.pricingService = pricingService;
        this.busyHoursService = busyHoursService;
        this.events = events;
        this.clock = clock;
        this.freeCancelHours = freeCancelHours;
    }

    public QuoteResponse quote(QuoteRequest request) {
        Hall hall = hallService.getMainHall();
        int hours = validateTime(hall, request.getStartTime(), request.getEndTime());
        return pricingService.quote(hours, request.getGuests(), request.getServices()).toResponse();
    }

    /**
     * Создание брони. Порядок проверок: правила зала → быстрая проверка пересечения (понятная ошибка)
     * → вставка. Если две брони пришли одновременно, вторую отсечёт constraint bookings_no_overlap.
     */
    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userEmail) {
        Hall hall = hallService.getMainHall();
        int hours = validate(hall, request);

        if (!bookingRepository.findOverlappingBookings(hall.getHallId(), request.getDate(), request.getStartTime(), request.getEndTime()).isEmpty()) {
            throw new BookingConflictException("Это время уже занято — выберите другой слот");
        }

        PricingService.Quote quote = pricingService.quote(hours, request.getGuests(), request.getServices());

        Booking booking = new Booking();
        booking.setHall(hall);
        booking.setTariff(quote.tariff());
        booking.setLayout(request.getLayout());
        booking.setGuests(request.getGuests());
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus(BookingStatus.PENDING);
        booking.setContactName(request.getContactName().trim());
        booking.setContactPhone(request.getContactPhone().trim());
        booking.setContactEmail(request.getContactEmail());
        booking.setComment(request.getComment());
        booking.setTotalPrice(quote.total());
        quote.lines().forEach(l -> booking.getExtras().add(new BookingExtra(l.service(), l.price())));
        if (userEmail != null) {
            booking.setUser(userRepository.findByEmail(userEmail).orElse(null));
        }

        try {
            bookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException e) {
            if (GlobalExceptionHandler.isOverlap(e)) {
                throw new BookingConflictException("Это время только что заняли — выберите другой слот");
            }
            throw e;
        }
        busyHoursService.evict(hall.getHallId(), booking.getDate());
        events.publishEvent(BookingEvent.of(booking.getBookingId(), BookingEvent.Type.CREATED));
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse findByCode(UUID code) {
        return BookingResponse.from(getByCode(code));
    }

    /** Отмена гостем по коду: бесплатно не позднее чем за freeCancelHours до начала */
    @Transactional
    public BookingResponse cancelByCode(UUID code) {
        Booking booking = getByCode(code);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingRuleException("Бронь уже отменена");
        }
        if (booking.getStartsAt().minusHours(freeCancelHours).isBefore(LocalDateTime.now(clock))) {
            throw new BookingRuleException("Отменить онлайн можно не позднее чем за " + freeCancelHours + " ч до начала — позвоните администратору");
        }
        return cancel(booking, BookingEvent.CancelReason.BY_GUEST);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> findMy(String email) {
        return bookingRepository.findByUserEmailOrderByDateDescStartTimeDesc(email).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> search(LocalDate from, LocalDate to, BookingStatus status, String q) {
        String query = q == null ? "" : q.trim();
        LocalDate since = from != null ? from : LocalDate.of(2000, 1, 1);
        LocalDate until = to != null ? to : LocalDate.of(2999, 12, 31);
        List<BookingStatus> statuses = status != null ? List.of(status) : List.of(BookingStatus.values());
        return bookingRepository.search(since, until, statuses, query).stream().map(BookingResponse::from).toList();
    }

    /** Сводка для админки: что ждёт подтверждения, что сегодня, что на неделе */
    @Transactional(readOnly = true)
    public AdminStats stats() {
        Hall hall = hallService.getMainHall();
        LocalDate today = LocalDate.now(clock);
        List<Booking> week = bookingRepository.findActiveBetween(hall.getHallId(), today, today.plusDays(6));
        long todayCount = week.stream().filter(b -> b.getDate().equals(today)).count();
        java.math.BigDecimal weekRevenue = week.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getTotalPrice)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        long pending = bookingRepository.countByStatusAndDateGreaterThanEqual(BookingStatus.PENDING, today);
        return new AdminStats(pending, todayCount, week.size(), weekRevenue);
    }

    public record AdminStats(long pending, long today, long week, java.math.BigDecimal weekRevenue) { }

    @Transactional
    public BookingResponse confirm(Integer id) {
        Booking booking = getById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingRuleException("Подтвердить можно только бронь в статусе PENDING");
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        events.publishEvent(BookingEvent.of(booking.getBookingId(), BookingEvent.Type.CONFIRMED));
        return BookingResponse.from(booking);
    }

    /** Администратор может отменить любую активную бронь, без ограничения по времени */
    @Transactional
    public BookingResponse cancelByAdmin(Integer id) {
        Booking booking = getById(id);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingRuleException("Бронь уже отменена");
        }
        return cancel(booking, BookingEvent.CancelReason.BY_ADMIN);
    }

    private BookingResponse cancel(Booking booking, BookingEvent.CancelReason reason) {
        booking.setStatus(BookingStatus.CANCELLED);
        busyHoursService.evict(booking.getHall().getHallId(), booking.getDate());
        events.publishEvent(BookingEvent.cancelled(booking.getBookingId(), reason));
        return BookingResponse.from(booking);
    }

    /** Правила зала; возвращает длительность в часах */
    int validate(Hall hall, BookingRequest request) {
        int hours = validateTime(hall, request.getStartTime(), request.getEndTime());
        LocalDate date = request.getDate();
        LocalDate today = LocalDate.now(clock);

        if (!date.atTime(request.getStartTime()).isAfter(LocalDateTime.now(clock))) {
            throw new BookingRuleException("Нельзя забронировать время в прошлом");
        }
        if (date.isAfter(today.plusDays(hall.getBookingHorizonDays()))) {
            throw new BookingRuleException("Бронирование открыто на " + hall.getBookingHorizonDays() + " дней вперёд");
        }
        Layout layout = request.getLayout();
        if (request.getGuests() > layout.getCapacity()) {
            throw new BookingRuleException("Формат «" + layout.getTitle() + "» вмещает до " + layout.getCapacity() + " гостей");
        }
        return hours;
    }

    int validateTime(Hall hall, LocalTime start, LocalTime end) {
        if (start.getMinute() != 0 || start.getSecond() != 0 || end.getMinute() != 0 || end.getSecond() != 0) {
            throw new BookingRuleException("Бронирование — целыми часами, например 10:00–14:00");
        }
        if (!end.isAfter(start)) {
            throw new BookingRuleException("Время окончания должно быть позже начала");
        }
        if (start.isBefore(hall.getOpenTime()) || end.isAfter(hall.getCloseTime())) {
            throw new BookingRuleException("Зал работает с " + hall.getOpenTime() + " до " + hall.getCloseTime());
        }
        int hours = end.getHour() - start.getHour();
        if (hours < hall.getMinHours()) {
            throw new BookingRuleException("Минимальная бронь — " + hall.getMinHours() + " ч");
        }
        return hours;
    }

    private Booking getByCode(UUID code) {
        return bookingRepository.findByPublicCode(code)
                .orElseThrow(() -> new NotFoundException("Бронь не найдена"));
    }

    private Booking getById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Бронь не найдена"));
    }
}
