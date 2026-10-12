package com.arka.backend.dto;

import java.time.LocalDate;

/** День в календаре: FREE — свободен весь, PARTIAL — частично, FULL — занят, CLOSED — недоступен (прошлое/за горизонтом) */
public record CalendarDay(LocalDate date, int freeHours, Status status) {
    public enum Status { FREE, PARTIAL, FULL, CLOSED }
}
