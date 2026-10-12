package com.arka.backend.service;

import com.arka.backend.entity.Booking;
import com.arka.backend.repository.BookingRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Занятые часы дня — самый частый запрос сайта (календарь), поэтому он кэшируется в Redis.
 * Отдельный бин, чтобы @Cacheable работал через прокси, а не через self-invocation.
 */
@Service
public class BusyHoursService {

    public static final String CACHE = "availability";

    private final BookingRepository bookingRepository;

    public BusyHoursService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Cacheable(value = CACHE, key = "#hallId + ':' + #date")
    public ArrayList<Integer> busyHours(Integer hallId, LocalDate date) {
        ArrayList<Integer> hours = new ArrayList<>();
        for (Booking b : bookingRepository.findActiveBetween(hallId, date, date)) {
            for (int h = b.getStartTime().getHour(); h < b.getEndTime().getHour(); h++) {
                hours.add(h);
            }
        }
        return hours;
    }

    @CacheEvict(value = CACHE, key = "#hallId + ':' + #date")
    public void evict(Integer hallId, LocalDate date) {
        // только инвалидация кэша
    }

    /** Для календаря на месяц: один запрос в БД вместо 30 */
    public List<Booking> activeBetween(Integer hallId, LocalDate from, LocalDate to) {
        return bookingRepository.findActiveBetween(hallId, from, to);
    }
}
