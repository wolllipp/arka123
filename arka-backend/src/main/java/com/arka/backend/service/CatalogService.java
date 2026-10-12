package com.arka.backend.service;

import com.arka.backend.dto.CatalogResponse;
import com.arka.backend.entity.Hall;
import com.arka.backend.entity.Layout;
import com.arka.backend.repository.ExtraServiceRepository;
import com.arka.backend.repository.TariffRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class CatalogService {

    private final HallService hallService;
    private final TariffRepository tariffRepository;
    private final ExtraServiceRepository extraServiceRepository;

    public CatalogService(HallService hallService, TariffRepository tariffRepository, ExtraServiceRepository extraServiceRepository) {
        this.hallService = hallService;
        this.tariffRepository = tariffRepository;
        this.extraServiceRepository = extraServiceRepository;
    }

    public CatalogResponse catalog() {
        Hall hall = hallService.getMainHall();
        var tariffs = tariffRepository.findAllByOrderByMinHoursAsc().stream()
                .map(t -> new CatalogResponse.TariffItem(t.getCode(), t.getName(), t.getMinHours(), t.getBaseHours(), t.getBasePrice(), t.getExtraHourPrice()))
                .toList();
        var services = extraServiceRepository.findAll().stream()
                .map(s -> new CatalogResponse.ServiceItem(s.getCode(), s.getName(), s.getPrice(), s.isPerPerson(),
                        s.getIncludedIn() == null ? List.of() : Arrays.asList(s.getIncludedIn().split(","))))
                .toList();
        var layouts = Arrays.stream(Layout.values())
                .map(l -> new CatalogResponse.LayoutItem(l.name(), l.getTitle(), l.getCapacity()))
                .toList();
        return new CatalogResponse(hall.getName(), hall.getAddress(), hall.getAreaM2(), hall.getOpenTime(), hall.getCloseTime(),
                hall.getMinHours(), hall.getBookingHorizonDays(), tariffs, services, layouts);
    }
}
