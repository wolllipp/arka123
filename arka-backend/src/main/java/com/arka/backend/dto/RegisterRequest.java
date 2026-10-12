package com.arka.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank(message = "Укажите имя")
    @Size(max = 100)
    private String name;
    @NotBlank(message = "Укажите email")
    @Email(message = "Некорректный email")
    private String email;
    @Size(max = 30)
    private String phone;
    @NotBlank(message = "Укажите пароль")
    @Size(min = 8, max = 100, message = "Пароль — от 8 символов")
    private String password;

    public RegisterRequest() { }

    public RegisterRequest(String name, String email, String phone, String password) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
