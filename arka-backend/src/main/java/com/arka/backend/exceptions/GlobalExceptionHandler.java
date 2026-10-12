package com.arka.backend.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BookingConflictException.class)
    public ResponseEntity<?> handleBookingConflict(BookingConflictException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(EmailAlreadyUsedException.class)
    public ResponseEntity<?> handleEmailUsed(EmailAlreadyUsedException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    /** Две брони прошли проверку одновременно — вторую отсёк constraint в БД */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException e) {
        if (isOverlap(e)) {
            return error(HttpStatus.CONFLICT, "Это время уже занято — выберите другой слот");
        }
        log.warn("Data integrity violation", e);
        return error(HttpStatus.CONFLICT, "Данные противоречат ограничениям системы");
    }

    @ExceptionHandler(BookingRuleException.class)
    public ResponseEntity<?> handleRule(BookingRuleException e) {
        return error(HttpStatus.valueOf(422), e.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<?> handleCredentials(InvalidCredentialsException e) {
        return error(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("error", "Проверьте заполнение полей", "fields", fields));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<?> handleUnreadable(Exception e) {
        return error(HttpStatus.BAD_REQUEST, "Некорректный формат данных");
    }

    public static boolean isOverlap(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t.getMessage() != null && t.getMessage().contains("bookings_no_overlap")) {
                return true;
            }
        }
        return false;
    }

    private ResponseEntity<?> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
