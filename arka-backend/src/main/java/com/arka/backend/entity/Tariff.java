package com.arka.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tariffs")
public class Tariff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tariff_id")
    private Integer tariffId;
    @Column(name = "code", nullable = false, unique = true)
    private String code;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "min_hours", nullable = false)
    private Integer minHours;
    @Column(name = "base_hours", nullable = false)
    private Integer baseHours;
    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;
    @Column(name = "extra_hour_price", nullable = false)
    private BigDecimal extraHourPrice;

    public Tariff() { }

    public Tariff(Integer tariffId, String code, String name, Integer minHours, Integer baseHours, BigDecimal basePrice, BigDecimal extraHourPrice) {
        this.tariffId = tariffId;
        this.code = code;
        this.name = name;
        this.minHours = minHours;
        this.baseHours = baseHours;
        this.basePrice = basePrice;
        this.extraHourPrice = extraHourPrice;
    }

    /** Стоимость аренды на hours часов по этому тарифу */
    public BigDecimal priceFor(int hours) {
        int extraHours = Math.max(0, hours - baseHours);
        return basePrice.add(extraHourPrice.multiply(BigDecimal.valueOf(extraHours)));
    }

    public Integer getTariffId() {
        return tariffId;
    }

    public void setTariffId(Integer tariffId) {
        this.tariffId = tariffId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMinHours() {
        return minHours;
    }

    public void setMinHours(Integer minHours) {
        this.minHours = minHours;
    }

    public Integer getBaseHours() {
        return baseHours;
    }

    public void setBaseHours(Integer baseHours) {
        this.baseHours = baseHours;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public BigDecimal getExtraHourPrice() {
        return extraHourPrice;
    }

    public void setExtraHourPrice(BigDecimal extraHourPrice) {
        this.extraHourPrice = extraHourPrice;
    }
}
