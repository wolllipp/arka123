package com.arka.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Arrays;

@Entity
@Table(name = "extra_services")
public class ExtraService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    private Integer serviceId;
    @Column(name = "code", nullable = false, unique = true)
    private String code;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "price", nullable = false)
    private BigDecimal price;
    @Column(name = "per_person", nullable = false)
    private boolean perPerson;
    @Column(name = "included_in")
    private String includedIn;

    public ExtraService() { }

    public ExtraService(Integer serviceId, String code, String name, BigDecimal price, boolean perPerson, String includedIn) {
        this.serviceId = serviceId;
        this.code = code;
        this.name = name;
        this.price = price;
        this.perPerson = perPerson;
        this.includedIn = includedIn;
    }

    /** Входит ли услуга в тариф бесплатно */
    public boolean isIncludedIn(String tariffCode) {
        return includedIn != null && Arrays.asList(includedIn.split(",")).contains(tariffCode);
    }

    public Integer getServiceId() {
        return serviceId;
    }

    public void setServiceId(Integer serviceId) {
        this.serviceId = serviceId;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public boolean isPerPerson() {
        return perPerson;
    }

    public void setPerPerson(boolean perPerson) {
        this.perPerson = perPerson;
    }

    public String getIncludedIn() {
        return includedIn;
    }

    public void setIncludedIn(String includedIn) {
        this.includedIn = includedIn;
    }
}
