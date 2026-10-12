package com.arka.backend;

import com.arka.backend.entity.ExtraService;
import com.arka.backend.entity.Tariff;
import com.arka.backend.exceptions.BookingRuleException;
import com.arka.backend.repository.ExtraServiceRepository;
import com.arka.backend.repository.TariffRepository;
import com.arka.backend.service.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class PricingServiceTest {

    @Mock
    private TariffRepository tariffRepository;

    @Mock
    private ExtraServiceRepository extraServiceRepository;

    @InjectMocks
    private PricingService pricingService;

    private final ExtraService projector = new ExtraService(1, "PROJECTOR", "Проектор", new BigDecimal("20.00"), false, "HALF_DAY,DAY");
    private final ExtraService coffee = new ExtraService(3, "COFFEE_BREAK", "Кофе-брейк", new BigDecimal("12.00"), true, null);

    @BeforeEach
    void tariffs() {
        when(tariffRepository.findAllByOrderByMinHoursAsc()).thenReturn(List.of(
                new Tariff(1, "HOURLY", "Почасовой", 2, 1, new BigDecimal("70.00"), new BigDecimal("70.00")),
                new Tariff(2, "HALF_DAY", "Полдня", 4, 4, new BigDecimal("250.00"), new BigDecimal("62.00")),
                new Tariff(3, "DAY", "Целый день", 10, 10, new BigDecimal("550.00"), new BigDecimal("55.00"))
        ));
    }

    @Test
    void twoHours_hourlyTariff() {
        PricingService.Quote q = pricingService.quote(2, 10, List.of());
        assertEquals("HOURLY", q.tariff().getCode());
        assertEquals(new BigDecimal("140.00"), q.total());
    }

    @Test
    void fiveHours_halfDayIsCheaperThanHourly() {
        // почасовой: 5 × 70 = 350, полдня: 250 + 62 = 312
        PricingService.Quote q = pricingService.quote(5, 10, List.of());
        assertEquals("HALF_DAY", q.tariff().getCode());
        assertEquals(new BigDecimal("312.00"), q.total());
    }

    @Test
    void elevenHours_dayTariffWithExtraHour() {
        PricingService.Quote q = pricingService.quote(11, 10, List.of());
        assertEquals("DAY", q.tariff().getCode());
        assertEquals(new BigDecimal("605.00"), q.total());
    }

    @Test
    void projectorIncludedInHalfDay_coffeeChargedPerGuest() {
        when(extraServiceRepository.findByCodeIn(any())).thenReturn(List.of(projector, coffee));

        PricingService.Quote q = pricingService.quote(4, 20, List.of("PROJECTOR", "COFFEE_BREAK"));

        // 250 аренда + 0 проектор (входит) + 12 × 20 кофе-брейк
        assertEquals(new BigDecimal("490.00"), q.total());
        assertTrue(q.lines().stream().anyMatch(l -> l.service().getCode().equals("PROJECTOR") && l.included()));
    }

    @Test
    void projectorPaidInHourly() {
        when(extraServiceRepository.findByCodeIn(any())).thenReturn(List.of(projector));
        PricingService.Quote q = pricingService.quote(2, 10, List.of("PROJECTOR"));
        assertEquals(new BigDecimal("160.00"), q.total());
    }

    @Test
    void unknownService_rejected() {
        when(extraServiceRepository.findByCodeIn(any())).thenReturn(List.of(projector));
        BookingRuleException e = assertThrows(BookingRuleException.class,
                () -> pricingService.quote(2, 10, List.of("PROJECTOR", "HELICOPTER")));
        assertTrue(e.getMessage().contains("HELICOPTER"));
    }

    @Test
    void duplicateServiceCodes_countedOnce() {
        when(extraServiceRepository.findByCodeIn(Set.of("PROJECTOR"))).thenReturn(List.of(projector));
        PricingService.Quote q = pricingService.quote(2, 10, List.of("PROJECTOR", "PROJECTOR"));
        assertEquals(1, q.lines().size());
    }
}
