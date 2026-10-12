package com.arka.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** Расчёт цены без создания брони — для суммы в календаре на сайте */
public class QuoteRequest {
    @NotNull(message = "Укажите время начала")
    private LocalTime startTime;
    @NotNull(message = "Укажите время окончания")
    private LocalTime endTime;
    @NotNull(message = "Укажите число гостей")
    @Min(value = 1, message = "Гостей должно быть хотя бы 1")
    private Integer guests;
    private List<String> services = new ArrayList<>();

    public QuoteRequest() { }

    public QuoteRequest(LocalTime startTime, LocalTime endTime, Integer guests, List<String> services) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.guests = guests;
        this.services = services;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Integer getGuests() {
        return guests;
    }

    public void setGuests(Integer guests) {
        this.guests = guests;
    }

    public List<String> getServices() {
        return services;
    }

    public void setServices(List<String> services) {
        this.services = services == null ? new ArrayList<>() : services;
    }
}
