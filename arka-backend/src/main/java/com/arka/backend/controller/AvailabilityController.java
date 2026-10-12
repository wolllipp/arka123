package com.arka.backend.controller;

import com.arka.backend.dto.AvailabilityDay;
import com.arka.backend.dto.CalendarDay;
import com.arka.backend.service.AvailabilityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    /** Часовые слоты одного дня */
    @GetMapping
    public AvailabilityDay day(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.day(date);
    }

    /** Сводка по дням для календаря */
    @GetMapping("/calendar")
    public List<CalendarDay> calendar(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return availabilityService.calendar(from, to);
    }
}
