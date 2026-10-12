package com.arka.backend.notification;

/** Что случилось с бронью — на это подписана рассылка писем */
public record BookingEvent(Integer bookingId, Type type, CancelReason reason) {

    public enum Type { CREATED, CONFIRMED, CANCELLED, REMINDER }

    public enum CancelReason { BY_GUEST, BY_ADMIN, NOT_CONFIRMED }

    public static BookingEvent of(Integer bookingId, Type type) {
        return new BookingEvent(bookingId, type, null);
    }

    public static BookingEvent cancelled(Integer bookingId, CancelReason reason) {
        return new BookingEvent(bookingId, Type.CANCELLED, reason);
    }
}
