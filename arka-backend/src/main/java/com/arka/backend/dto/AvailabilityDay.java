package com.arka.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Часовые слоты дня: free = можно забронировать */
public record AvailabilityDay(LocalDate date, LocalTime open, LocalTime close, List<Slot> slots) {
    public record Slot(LocalTime start, boolean free) { }
}
