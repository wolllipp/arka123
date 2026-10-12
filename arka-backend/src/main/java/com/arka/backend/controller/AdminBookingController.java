package com.arka.backend.controller;

import com.arka.backend.dto.BookingResponse;
import com.arka.backend.entity.BookingStatus;
import com.arka.backend.service.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /** Фильтры необязательны: date — один день (сокращение для from=to), from/to — период, q — имя, телефон или email */
    @GetMapping
    public List<BookingResponse> search(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                        @RequestParam(required = false) BookingStatus status,
                                        @RequestParam(required = false) String q) {
        if (date != null) {
            from = date;
            to = date;
        }
        return bookingService.search(from, to, status, q);
    }

    @GetMapping("/stats")
    public BookingService.AdminStats stats() {
        return bookingService.stats();
    }

    @PostMapping("/{id}/confirm")
    public BookingResponse confirm(@PathVariable Integer id) {
        return bookingService.confirm(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(@PathVariable Integer id) {
        return bookingService.cancelByAdmin(id);
    }
}
