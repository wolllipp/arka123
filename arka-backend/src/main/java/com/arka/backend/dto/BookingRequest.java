package com.arka.backend.dto;

import com.arka.backend.entity.Layout;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class BookingRequest {
    @NotNull(message = "Укажите дату")
    private LocalDate date;
    @NotNull(message = "Укажите время начала")
    private LocalTime startTime;
    @NotNull(message = "Укажите время окончания")
    private LocalTime endTime;
    @NotNull(message = "Выберите формат рассадки")
    private Layout layout;
    @NotNull(message = "Укажите число гостей")
    @Min(value = 1, message = "Гостей должно быть хотя бы 1")
    private Integer guests;
    private List<String> services = new ArrayList<>();
    @NotBlank(message = "Укажите имя")
    @Size(max = 100)
    private String contactName;
    @NotBlank(message = "Укажите телефон")
    @Pattern(regexp = "^\\+?[0-9 ()-]{7,20}$", message = "Некорректный телефон")
    private String contactPhone;
    @NotBlank(message = "Укажите email — пришлём подтверждение и напоминание")
    @Email(message = "Некорректный email")
    @Size(max = 255)
    private String contactEmail;
    @Size(max = 1000)
    private String comment;

    public BookingRequest() { }

    public BookingRequest(LocalDate date, LocalTime startTime, LocalTime endTime, Layout layout, Integer guests,
                          List<String> services, String contactName, String contactPhone, String contactEmail) {
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.layout = layout;
        this.guests = guests;
        this.services = services;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
        this.contactEmail = contactEmail;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
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

    public Layout getLayout() {
        return layout;
    }

    public void setLayout(Layout layout) {
        this.layout = layout;
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

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
