package com.arka.backend.service;

import com.arka.backend.entity.Hall;
import com.arka.backend.exceptions.NotFoundException;
import com.arka.backend.repository.HallRepository;
import org.springframework.stereotype.Service;

@Service
public class HallService {

    private final HallRepository hallRepository;

    public HallService(HallRepository hallRepository) {
        this.hallRepository = hallRepository;
    }

    /** Сейчас зал один — АРКА 123 */
    public Hall getMainHall() {
        return hallRepository.findFirstByOrderByHallIdAsc()
                .orElseThrow(() -> new NotFoundException("Зал не настроен"));
    }
}
