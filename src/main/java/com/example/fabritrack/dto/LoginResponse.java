package com.example.fabritrack.dto;

import com.example.fabritrack.entity.User;

import java.util.List;

public record LoginResponse(String token, User user, List<String> permissions) {
}
