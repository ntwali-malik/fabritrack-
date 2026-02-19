package com.example.fabritrack.dto;

import com.example.fabritrack.entity.User;

public record LoginResponse(String token, User user) {
}
