package com.arka.backend.repository;

import com.arka.backend.entity.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TariffRepository extends JpaRepository<Tariff, Integer> {
    List<Tariff> findAllByOrderByMinHoursAsc();
}
