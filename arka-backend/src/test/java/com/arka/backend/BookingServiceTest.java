package com.arka.backend;

import com.arka.backend.dto.BookingRequest;
import com.arka.backend.dto.BookingResponse;
import com.arka.backend.entity.*;
import com.arka.backend.exceptions.BookingConflictException;
import com.arka.backend.exceptions.BookingRuleException;
import com.arka.backend.notification.BookingEvent;
import com.arka.backend.repository.BookingRepository;
import com.arka.backend.repository.UserRepository;
import com.arka.backend.service.BookingService;
import com.arka.backend.service.BusyHoursService;
import com.arka.backend.service.HallService;
import com.arka.backend.service.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.context.ApplicationEventPublisher;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HallService hallService;

    @Mock
    private PricingService pricingService;

    @Mock
    private BusyHoursService busyHoursService;

    @Mock
    private ApplicationEventPublisher events;

    private BookingService bookingService;

    // «сейчас» — 12 октября 2026, 12:00 по Минску
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-12T09:00:00Z"), ZoneId.of("Europe/Minsk"));
    private final Hall hall = new Hall(1, "АРКА 123", LocalTime.of(8, 0), LocalTime.of(23, 0), 2, 90);
    private final Tariff hourly = new Tariff(1, "HOURLY", "Почасовой", 2, 1, new BigDecimal("70.00"), new BigDecimal("70.00"));
    private final LocalDate tomorrow = LocalDate.of(2026, 10, 13);

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, userRepository, hallService, pricingService, busyHoursService, events, clock, 24);
        when(hallService.getMainHall()).thenReturn(hall);
        when(bookingRepository.findOverlappingBookings(any(), any(), any(), any())).thenReturn(List.of());
        when(pricingService.quote(anyInt(), anyInt(), any()))
                .thenReturn(new PricingService.Quote(hourly, 2, new BigDecimal("140.00"), List.of(), new BigDecimal("140.00")));
    }

    private BookingRequest request(LocalDate date, int from, int to, Layout layout, int guests) {
        return new BookingRequest(date, LocalTime.of(from, 0), LocalTime.of(to, 0), layout, guests, List.of(), "Анна", "+375291234567", "anna@example.com");
    }

    @Test
    void createBooking_success_pendingWithServerPrice() {
        BookingResponse b = bookingService.createBooking(request(tomorrow, 10, 12, Layout.LECTURE, 30), null);

        assertEquals(BookingStatus.PENDING, b.status());
        assertEquals(new BigDecimal("140.00"), b.totalPrice());
        assertNotNull(b.code());
        verify(bookingRepository).saveAndFlush(any(Booking.class));
        verify(busyHoursService).evict(1, tomorrow);
        verify(events).publishEvent(argThat((Object e) -> e instanceof BookingEvent be && be.type() == BookingEvent.Type.CREATED));
    }

    @Test
    void createBooking_linksUserFromToken() {
        User user = new User();
        user.setEmail("anna@example.com");
        when(userRepository.findByEmail("anna@example.com")).thenReturn(Optional.of(user));

        bookingService.createBooking(request(tomorrow, 10, 12, Layout.LECTURE, 30), "anna@example.com");

        verify(bookingRepository).saveAndFlush(argThat(b -> b.getUser() == user));
    }

    @Test
    void overlap_conflict() {
        when(bookingRepository.findOverlappingBookings(any(), any(), any(), any())).thenReturn(List.of(new Booking()));
        assertThrows(BookingConflictException.class,
                () -> bookingService.createBooking(request(tomorrow, 10, 12, Layout.LECTURE, 30), null));
        verify(bookingRepository, never()).saveAndFlush(any());
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void pastTime_rejected() {
        // сегодня, 11:00 — уже прошло
        assertThrows(BookingRuleException.class,
                () -> bookingService.createBooking(request(LocalDate.of(2026, 10, 12), 11, 13, Layout.LECTURE, 30), null));
    }

    @Test
    void notFullHour_rejected() {
        BookingRequest r = request(tomorrow, 10, 12, Layout.LECTURE, 30);
        r.setStartTime(LocalTime.of(10, 30));
        assertThrows(BookingRuleException.class, () -> bookingService.createBooking(r, null));
    }

    @Test
    void lessThanMinHours_rejected() {
        assertThrows(BookingRuleException.class,
                () -> bookingService.createBooking(request(tomorrow, 10, 11, Layout.LECTURE, 30), null));
    }

    @Test
    void outsideWorkingHours_rejected() {
        assertThrows(BookingRuleException.class,
                () -> bookingService.createBooking(request(tomorrow, 21, 0, Layout.LECTURE, 30), null));
        assertThrows(BookingRuleException.class,
                () -> bookingService.createBooking(request(tomorrow, 6, 9, Layout.LECTURE, 30), null));
    }

    @Test
    void beyondHorizon_rejected() {
        assertThrows(BookingRuleException.class,
                () -> bookingService.createBooking(request(tomorrow.plusDays(120), 10, 12, Layout.LECTURE, 30), null));
    }

    @Test
    void tooManyGuestsForLayout_rejected() {
        BookingRuleException e = assertThrows(BookingRuleException.class,
                () -> bookingService.createBooking(request(tomorrow, 10, 12, Layout.TABLE, 30), null));
        assertTrue(e.getMessage().contains("24"));
    }

    @Test
    void cancelByCode_lessThan24hBefore_rejected() {
        Booking b = new Booking();
        b.setHall(hall);
        b.setStatus(BookingStatus.PENDING);
        b.setDate(LocalDate.of(2026, 10, 13));
        b.setStartTime(LocalTime.of(10, 0)); // через 22 часа
        UUID code = b.getPublicCode();
        when(bookingRepository.findByPublicCode(code)).thenReturn(Optional.of(b));

        assertThrows(BookingRuleException.class, () -> bookingService.cancelByCode(code));
        assertEquals(BookingStatus.PENDING, b.getStatus());
    }

    @Test
    void confirm_onlyPending() {
        Booking b = new Booking();
        b.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById(5)).thenReturn(Optional.of(b));
        assertThrows(BookingRuleException.class, () -> bookingService.confirm(5));
    }
}
