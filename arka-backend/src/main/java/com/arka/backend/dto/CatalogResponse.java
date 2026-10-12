package com.arka.backend.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

/** Всё, что нужно сайту для формы бронирования, одним запросом */
public record CatalogResponse(
        String hallName,
        String address,
        int areaM2,
        LocalTime open,
        LocalTime close,
        int minHours,
        int bookingHorizonDays,
        List<TariffItem> tariffs,
        List<ServiceItem> services,
        List<LayoutItem> layouts
) {
    public record TariffItem(String code, String name, int minHours, int baseHours, BigDecimal basePrice, BigDecimal extraHourPrice) { }
    public record ServiceItem(String code, String name, BigDecimal price, boolean perPerson, List<String> includedIn) { }
    public record LayoutItem(String code, String title, int capacity) { }
}
