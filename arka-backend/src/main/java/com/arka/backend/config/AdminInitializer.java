package com.arka.backend.config;

import com.arka.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Первый администратор из переменных окружения — без пароля в миграциях и коде */
@Component
public class AdminInitializer implements ApplicationRunner {

    private final AuthService authService;
    private final String email;
    private final String password;

    public AdminInitializer(AuthService authService, @Value("${admin.email:}") String email, @Value("${admin.password:}") String password) {
        this.authService = authService;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!email.isBlank() && !password.isBlank()) {
            authService.createAdminIfMissing(email, password);
        }
    }
}
