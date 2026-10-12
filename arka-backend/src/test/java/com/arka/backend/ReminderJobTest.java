package com.arka.backend;

import com.arka.backend.entity.Booking;
import com.arka.backend.entity.BookingStatus;
import com.arka.backend.notification.BookingEvent;
import com.arka.backend.notification.ReminderJob;
import com.arka.backend.repository.BookingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.*;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReminderJobTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ApplicationEventPublisher events;

    // «сейчас» — 12 октября 2026, 12:00 по Минску
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-12T09:00:00Z"), ZoneId.of("Europe/Minsk"));

    private Booking booking(int id, LocalDate date, int hour, LocalDateTime createdAt) {
        Booking b = new Booking();
        b.setBookingId(id);
        b.setStatus(BookingStatus.CONFIRMED);
        b.setDate(date);
        b.setStartTime(LocalTime.of(hour, 0));
        b.setEndTime(LocalTime.of(hour + 2, 0));
        b.setCreatedAt(createdAt);
        return b;
    }

    @Test
    void remindsOnlyBookingsStartingWithin24h_andOnlyOnce() {
        LocalDateTime longAgo = LocalDateTime.of(2026, 10, 1, 10, 0);
        Booking tomorrowMorning = booking(1, LocalDate.of(2026, 10, 13), 10, longAgo);   // через 22 ч → напомнить
        Booking tomorrowEvening = booking(2, LocalDate.of(2026, 10, 13), 18, longAgo);   // через 30 ч → рано
        Booking createdToday = booking(3, LocalDate.of(2026, 10, 13), 11, LocalDateTime.of(2026, 10, 12, 11, 0)); // бронь меньше чем за сутки → без напоминания
        when(bookingRepository.findByStatusAndReminderSentAtIsNullAndDateBetween(eq(BookingStatus.CONFIRMED), any(), any()))
                .thenReturn(List.of(tomorrowMorning, tomorrowEvening, createdToday));

        int sent = new ReminderJob(bookingRepository, events, clock, 24).sendDueReminders();

        assertEquals(1, sent);
        assertNotNull(tomorrowMorning.getReminderSentAt(), "отметка — чтобы не напомнить второй раз");
        assertNull(tomorrowEvening.getReminderSentAt());
        assertNull(createdToday.getReminderSentAt());
        verify(events).publishEvent(new BookingEvent(1, BookingEvent.Type.REMINDER, null));
        verifyNoMoreInteractions(events);
    }
}
