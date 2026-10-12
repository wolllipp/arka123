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

    /**
     * Поиск для админки. Параметры всегда заданы (границы — крайние даты, статусы — список, q — пустая строка):
     * с null PostgreSQL не может определить тип параметра в «? IS NULL».
     */
    @Query("""
            SELECT b FROM Booking b
            WHERE b.date BETWEEN :from AND :to
              AND b.status IN :statuses
              AND (:q = '' OR lower(b.contactName) LIKE lower(concat('%', :q, '%'))
                           OR lower(b.contactEmail) LIKE lower(concat('%', :q, '%'))
                           OR b.contactPhone LIKE concat('%', :q, '%'))
            ORDER BY b.date, b.startTime""")
    List<Booking> search(@Param("from") LocalDate from, @Param("to") LocalDate to,
                         @Param("statuses") java.util.Collection<BookingStatus> statuses, @Param("q") String q);

    long countByStatusAndDateGreaterThanEqual(BookingStatus status, LocalDate from);

    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, LocalDateTime createdBefore);

    /** Кандидаты на напоминание: подтверждённые, ещё без напоминания, в ближайшие дни */
    List<Booking> findByStatusAndReminderSentAtIsNullAndDateBetween(BookingStatus status, LocalDate from, LocalDate to);
}
