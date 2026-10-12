package com.arka.backend.service;

import com.arka.backend.entity.Booking;
import com.arka.backend.entity.BookingStatus;
import com.arka.backend.notification.BookingEvent;
import com.arka.backend.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/** Неподтверждённая бронь не должна держать слот вечно: через pending-ttl-hours она снимается */
@Service
public class PendingBookingCleanup {

    private static final Logger log = LoggerFactory.getLogger(PendingBookingCleanup.class);

    private final BookingRepository bookingRepository;
    private final BusyHoursService busyHoursService;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final int pendingTtlHours;

    public PendingBookingCleanup(BookingRepository bookingRepository, BusyHoursService busyHoursService,
                                 ApplicationEventPublisher events, Clock clock,
                                 @Value("${app.booking.pending-ttl-hours}") int pendingTtlHours) {
        this.bookingRepository = bookingRepository;
        this.busyHoursService = busyHoursService;
        this.events = events;
        this.clock = clock;
        this.pendingTtlHours = pendingTtlHours;
    }

    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT1M")
    @Transactional
    public int expireStalePending() {
        LocalDateTime border = LocalDateTime.now(clock).minusHours(pendingTtlHours);
        List<Booking> stale = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.PENDING, border);
        for (Booking b : stale) {
            b.setStatus(BookingStatus.CANCELLED);
            busyHoursService.evict(b.getHall().getHallId(), b.getDate());
            events.publishEvent(BookingEvent.cancelled(b.getBookingId(), BookingEvent.CancelReason.NOT_CONFIRMED));
        }
        if (!stale.isEmpty()) {
            log.info("Снято неподтверждённых броней: {}", stale.size());
        }
        return stale.size();
    }
}
