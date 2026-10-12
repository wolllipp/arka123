package com.arka.backend.repository;

import com.arka.backend.entity.ExtraService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExtraServiceRepository extends JpaRepository<ExtraService, Integer> {
    List<ExtraService> findByCodeIn(Collection<String> codes);
}
