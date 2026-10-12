package com.arka.backend.dto;

import com.arka.backend.entity.Booking;
import com.arka.backend.entity.BookingStatus;
import com.arka.backend.entity.Layout;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record BookingResponse(
        Integer id,
        UUID code,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        int hours,
        Layout layout,
        int guests,
        BookingStatus status,
        String tariffName,
        List<Extra> services,
        BigDecimal totalPrice,
        String contactName,
        String contactPhone,
        String contactEmail,
        String comment,
        LocalDateTime createdAt
) {
    public record Extra(String code, String name, BigDecimal price) { }

    public static BookingResponse from(Booking b) {
        List<Extra> extras = b.getExtras().stream()
                .map(e -> new Extra(e.getService().getCode(), e.getService().getName(), e.getPrice()))
                .toList();
        return new BookingResponse(b.getBookingId(), b.getPublicCode(), b.getDate(), b.getStartTime(), b.getEndTime(),
                b.getHours(), b.getLayout(), b.getGuests(), b.getStatus(), b.getTariff().getName(), extras,
                b.getTotalPrice(), b.getContactName(), b.getContactPhone(), b.getContactEmail(), b.getComment(),
                b.getCreatedAt());
    }
}
