package com.arka.backend.controller;

import com.arka.backend.dto.BookingRequest;
import com.arka.backend.dto.BookingResponse;
import com.arka.backend.dto.QuoteRequest;
import com.arka.backend.dto.QuoteResponse;
import com.arka.backend.security.CurrentUser;
import com.arka.backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/quote")
    public QuoteResponse quote(@Valid @RequestBody QuoteRequest request) {
        return bookingService.quote(request);
    }

    /** Гость или вошедший клиент; пользователь берётся из токена, а не из тела запроса */
    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request) {
        BookingResponse booking = bookingService.createBooking(request, CurrentUser.emailOrNull());
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @GetMapping("/my")
    public List<BookingResponse> my(Authentication authentication) {
        return bookingService.findMy(authentication.getName());
    }

    @GetMapping("/{code}")
    public BookingResponse byCode(@PathVariable UUID code) {
        return bookingService.findByCode(code);
    }

    @PostMapping("/{code}/cancel")
    public BookingResponse cancel(@PathVariable UUID code) {
        return bookingService.cancelByCode(code);
    }
}
