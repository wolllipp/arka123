package com.arka.backend.repository;

import com.arka.backend.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HallRepository extends JpaRepository<Hall, Integer> {
    Optional<Hall> findFirstByOrderByHallIdAsc();
}
