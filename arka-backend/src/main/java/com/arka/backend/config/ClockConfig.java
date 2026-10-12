package com.arka.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/** Время зала — минское; через Clock правила «не в прошлом» легко тестировать */
@Configuration
public class ClockConfig {
    @Bean
    public Clock clock() {
        return Clock.system(ZoneId.of("Europe/Minsk"));
    }
}
