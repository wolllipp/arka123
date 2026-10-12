package com.arka.backend.dto;

import com.arka.backend.entity.User;

public record UserResponse(String name, String email, String phone, String role) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getName(), u.getEmail(), u.getPhone(), u.getRole().getName());
    }
}
