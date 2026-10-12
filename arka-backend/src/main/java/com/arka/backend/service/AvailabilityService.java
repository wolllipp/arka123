package com.arka.backend.service;

import com.arka.backend.dto.AvailabilityDay;
import com.arka.backend.dto.CalendarDay;
import com.arka.backend.entity.Booking;
import com.arka.backend.entity.Hall;
import com.arka.backend.exceptions.BookingRuleException;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AvailabilityService {

    private static final int MAX_CALENDAR_DAYS = 62;

    private final HallService hallService;
    private final BusyHoursService busyHoursService;
    private final Clock clock;

    public AvailabilityService(HallService hallService, BusyHoursService busyHoursService, Clock clock) {
        this.hallService = hallService;
        this.busyHoursService = busyHoursService;
        this.clock = clock;
    }

    public AvailabilityDay day(LocalDate date) {
        Hall hall = hallService.getMainHall();
        // занятость берём из кэша, а «прошедшие часы» считаем каждый раз — они зависят от текущего времени
        Set<Integer> busy = new HashSet<>(busyHoursService.busyHours(hall.getHallId(), date));
        LocalDateTime now = LocalDateTime.now(clock);
        boolean inHorizon = inHorizon(hall, date);

        List<AvailabilityDay.Slot> slots = new ArrayList<>();
        for (int h = hall.getOpenTime().getHour(); h < hall.getCloseTime().getHour(); h++) {
            LocalTime start = LocalTime.of(h, 0);
            boolean free = inHorizon && !busy.contains(h) && date.atTime(start).isAfter(now);
            slots.add(new AvailabilityDay.Slot(start, free));
        }
        return new AvailabilityDay(date, hall.getOpenTime(), hall.getCloseTime(), slots);
    }

    public List<CalendarDay> calendar(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BookingRuleException("Дата окончания раньше даты начала");
        }
        if (ChronoUnit.DAYS.between(from, to) >= MAX_CALENDAR_DAYS) {
            throw new BookingRuleException("Период календаря — не больше " + MAX_CALENDAR_DAYS + " дней");
        }
        Hall hall = hallService.getMainHall();
        Map<LocalDate, Set<Integer>> busyByDay = new HashMap<>();
        for (Booking b : busyHoursService.activeBetween(hall.getHallId(), from, to)) {
            Set<Integer> set = busyByDay.computeIfAbsent(b.getDate(), d -> new HashSet<>());
            for (int h = b.getStartTime().getHour(); h < b.getEndTime().getHour(); h++) {
                set.add(h);
            }
        }

        LocalDateTime now = LocalDateTime.now(clock);
        int open = hall.getOpenTime().getHour();
        int close = hall.getCloseTime().getHour();
        List<CalendarDay> days = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (!inHorizon(hall, d)) {
                days.add(new CalendarDay(d, 0, CalendarDay.Status.CLOSED));
                continue;
            }
            Set<Integer> busy = busyByDay.getOrDefault(d, Set.of());
            int total = 0;
            int free = 0;
            for (int h = open; h < close; h++) {
                if (!d.atTime(h, 0).isAfter(now)) continue;
                total++;
                if (!busy.contains(h)) free++;
            }
            // день считается занятым, если не осталось окна на минимальную бронь
            CalendarDay.Status status = total == 0 ? CalendarDay.Status.CLOSED
                    : free == total ? CalendarDay.Status.FREE
                    : longestRun(d, open, close, busy, now) >= hall.getMinHours() ? CalendarDay.Status.PARTIAL
                    : CalendarDay.Status.FULL;
            days.add(new CalendarDay(d, free, status));
        }
        return days;
    }

    boolean inHorizon(Hall hall, LocalDate date) {
        LocalDate today = LocalDate.now(clock);
        return !date.isBefore(today) && !date.isAfter(today.plusDays(hall.getBookingHorizonDays()));
    }

    private int longestRun(LocalDate d, int open, int close, Set<Integer> busy, LocalDateTime now) {
        int best = 0;
        int run = 0;
        for (int h = open; h < close; h++) {
            boolean free = d.atTime(h, 0).isAfter(now) && !busy.contains(h);
            run = free ? run + 1 : 0;
            best = Math.max(best, run);
        }
        return best;
    }
}
