package com.arka.backend.notification;

import com.arka.backend.entity.Booking;
import com.arka.backend.entity.BookingStatus;
import com.arka.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Напоминание о подтверждённой брони за reminder-hours до начала, один раз */
@Service
public class ReminderJob {

    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final int reminderHours;

    public ReminderJob(BookingRepository bookingRepository, ApplicationEventPublisher events, Clock clock,
                       @Value("${app.booking.reminder-hours}") int reminderHours) {
        this.bookingRepository = bookingRepository;
        this.events = events;
        this.clock = clock;
        this.reminderHours = reminderHours;
    }

    @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT2M")
    @Transactional
    public int sendDueReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime border = now.plusHours(reminderHours);
        int sent = 0;
        LocalDate today = now.toLocalDate();
        for (Booking b : bookingRepository.findByStatusAndReminderSentAtIsNullAndDateBetween(BookingStatus.CONFIRMED, today, border.toLocalDate())) {
            // бронь, сделанную меньше чем за сутки, не дублируем напоминанием сразу после подтверждения письма
            if (b.getStartsAt().isAfter(now) && !b.getStartsAt().isAfter(border) && b.getCreatedAt().isBefore(b.getStartsAt().minusHours(reminderHours))) {
                b.setReminderSentAt(now);
                events.publishEvent(BookingEvent.of(b.getBookingId(), BookingEvent.Type.REMINDER));
                sent++;
            }
        }
        return sent;
    }
}
