package com.arka.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record QuoteResponse(
        String tariffCode,
        String tariffName,
        int hours,
        BigDecimal rentPrice,
        List<Line> services,
        BigDecimal total
) {
    /** included = услуга входит в тариф, price = 0 */
    public record Line(String code, String name, BigDecimal price, boolean included) { }
}
