package com.arka.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/** Услуга внутри брони с ценой на момент бронирования */
@Embeddable
public class BookingExtra {
    @ManyToOne(optional = false)
    @JoinColumn(name = "service_id")
    private ExtraService service;
    @Column(name = "price", nullable = false)
    private BigDecimal price;

    public BookingExtra() { }

    public BookingExtra(ExtraService service, BigDecimal price) {
        this.service = service;
        this.price = price;
    }

    public ExtraService getService() {
        return service;
    }

    public void setService(ExtraService service) {
        this.service = service;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
}
