package com.arka.backend.entity;

import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
@Table(name = "halls")
public class Hall {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hall_id")
    private Integer hallId;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "address", nullable = false)
    private String address;
    @Column(name = "area_m2", nullable = false)
    private Integer areaM2;
    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;
    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;
    @Column(name = "min_hours", nullable = false)
    private Integer minHours;
    @Column(name = "booking_horizon_days", nullable = false)
    private Integer bookingHorizonDays;

    public Hall() { }

    public Hall(Integer hallId, String name, LocalTime openTime, LocalTime closeTime, Integer minHours, Integer bookingHorizonDays) {
        this.hallId = hallId;
        this.name = name;
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.minHours = minHours;
        this.bookingHorizonDays = bookingHorizonDays;
    }

    public Integer getHallId() {
        return hallId;
    }

    public void setHallId(Integer hallId) {
        this.hallId = hallId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getAreaM2() {
        return areaM2;
    }

    public void setAreaM2(Integer areaM2) {
        this.areaM2 = areaM2;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }

    public Integer getMinHours() {
        return minHours;
    }

    public void setMinHours(Integer minHours) {
        this.minHours = minHours;
    }

    public Integer getBookingHorizonDays() {
        return bookingHorizonDays;
    }

    public void setBookingHorizonDays(Integer bookingHorizonDays) {
        this.bookingHorizonDays = bookingHorizonDays;
    }
}
