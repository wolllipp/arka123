package com.arka.backend.service;

import com.arka.backend.dto.QuoteResponse;
import com.arka.backend.entity.ExtraService;
import com.arka.backend.entity.Tariff;
import com.arka.backend.exceptions.BookingRuleException;
import com.arka.backend.repository.ExtraServiceRepository;
import com.arka.backend.repository.TariffRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

/**
 * Цена считается только на сервере: клиент присылает часы, гостей и услуги,
 * а сумму, которую показал сайт, сервер не принимает на веру.
 */
@Service
public class PricingService {

    private final TariffRepository tariffRepository;
    private final ExtraServiceRepository extraServiceRepository;

    public PricingService(TariffRepository tariffRepository, ExtraServiceRepository extraServiceRepository) {
        this.tariffRepository = tariffRepository;
        this.extraServiceRepository = extraServiceRepository;
    }

    public Quote quote(int hours, int guests, Collection<String> serviceCodes) {
        Tariff tariff = bestTariff(hours);
        BigDecimal rent = tariff.priceFor(hours);

        Set<String> codes = new LinkedHashSet<>(serviceCodes == null ? List.of() : serviceCodes);
        List<ExtraService> services = codes.isEmpty() ? List.of() : extraServiceRepository.findByCodeIn(codes);
        if (services.size() != codes.size()) {
            Set<String> known = new HashSet<>();
            services.forEach(s -> known.add(s.getCode()));
            codes.removeAll(known);
            throw new BookingRuleException("Неизвестная услуга: " + String.join(", ", codes));
        }

        List<Line> lines = new ArrayList<>();
        BigDecimal total = rent;
        for (ExtraService s : services) {
            boolean included = s.isIncludedIn(tariff.getCode());
            BigDecimal price = included ? BigDecimal.ZERO
                    : s.isPerPerson() ? s.getPrice().multiply(BigDecimal.valueOf(guests)) : s.getPrice();
            lines.add(new Line(s, price, included));
            total = total.add(price);
        }
        return new Quote(tariff, hours, rent, lines, total);
    }

    /** Самый выгодный тариф из тех, что подходят по минимальному числу часов */
    Tariff bestTariff(int hours) {
        return tariffRepository.findAllByOrderByMinHoursAsc().stream()
                .filter(t -> hours >= t.getMinHours())
                .min(Comparator.comparing((Tariff t) -> t.priceFor(hours)))
                .orElseThrow(() -> new BookingRuleException("Нет тарифа для " + hours + " ч"));
    }

    public record Line(ExtraService service, BigDecimal price, boolean included) { }

    public record Quote(Tariff tariff, int hours, BigDecimal rent, List<Line> lines, BigDecimal total) {
        public QuoteResponse toResponse() {
            List<QuoteResponse.Line> out = lines.stream()
                    .map(l -> new QuoteResponse.Line(l.service().getCode(), l.service().getName(), l.price(), l.included()))
                    .toList();
            return new QuoteResponse(tariff.getCode(), tariff.getName(), hours, rent, out, total);
        }
    }
}
