package com.arka.backend.service;

import com.arka.backend.dto.AuthResponse;
import com.arka.backend.dto.LoginRequest;
import com.arka.backend.dto.RegisterRequest;
import com.arka.backend.entity.Role;
import com.arka.backend.entity.User;
import com.arka.backend.exceptions.EmailAlreadyUsedException;
import com.arka.backend.exceptions.InvalidCredentialsException;
import com.arka.backend.exceptions.NotFoundException;
import com.arka.backend.repository.RoleRepository;
import com.arka.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Регистрация сразу логинит: в ответе токен */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyUsedException("Пользователь с таким email уже есть");
        }
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role("CLIENT"));
        userRepository.save(user);
        return token(user);
    }

    public AuthResponse login(LoginRequest request) {
        // одинаковая ошибка для «нет пользователя» и «неверный пароль» — не раскрываем, какие email есть в системе
        User user = userRepository.findByEmail(normalize(request.getEmail()))
                .orElseThrow(() -> new InvalidCredentialsException("Неверный email или пароль"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Неверный email или пароль");
        }
        return token(user);
    }

    @Transactional
    public void createAdminIfMissing(String email, String password) {
        String normalized = normalize(email);
        if (userRepository.existsByEmail(normalized)) {
            return;
        }
        User admin = new User();
        admin.setName("Администратор");
        admin.setEmail(normalized);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(role("ADMIN"));
        userRepository.save(admin);
    }

    private AuthResponse token(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().getName());
        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole().getName());
    }

    private Role role(String name) {
        return roleRepository.findByName(name).orElseThrow(() -> new NotFoundException("Роль " + name + " не найдена"));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
