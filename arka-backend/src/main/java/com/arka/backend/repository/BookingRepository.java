package com.arka.backend.repository;

import com.arka.backend.entity.Booking;
import com.arka.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, Integer> {

    /** Быстрая проверка до вставки — даёт понятную ошибку; от гонок защищает constraint bookings_no_overlap */
    @Query(value = "SELECT * FROM bookings WHERE hall_id = :hallId AND status <> 'CANCELLED' AND tsrange(:date ::date + :startTime ::time, :date ::date + :endTime ::time) && tsrange(date + start_time, date + end_time)", nativeQuery = true)
    List<Booking> findOverlappingBookings(@Param("hallId") Integer hallId, @Param("date") LocalDate date, @Param("startTime") LocalTime startTime, @Param("endTime") LocalTime endTime);

    @Query("SELECT b FROM Booking b WHERE b.hall.hallId = :hallId AND b.date BETWEEN :from AND :to AND b.status <> com.arka.backend.entity.BookingStatus.CANCELLED ORDER BY b.date, b.startTime")
    List<Booking> findActiveBetween(@Param("hallId") Integer hallId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    Optional<Booking> findByPublicCode(UUID publicCode);

    List<Booking> findByUserEmailOrderByDateDescStartTimeDesc(String email);

    @Query("SELECT b FROM Booking b WHERE (:date IS NULL OR b.date = :date) AND (:status IS NULL OR b.status = :status) ORDER BY b.date, b.startTime")
    List<Booking> search(@Param("date") LocalDate date, @Param("status") BookingStatus status);

    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, LocalDateTime createdBefore);

    /** Кандидаты на напоминание: подтверждённые, ещё без напоминания, в ближайшие дни */
    List<Booking> findByStatusAndReminderSentAtIsNullAndDateBetween(BookingStatus status, LocalDate from, LocalDate to);
}
