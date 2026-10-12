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

    @GetMapping
    public List<BookingResponse> search(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                        @RequestParam(required = false) BookingStatus status) {
        return bookingService.search(date, status);
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
