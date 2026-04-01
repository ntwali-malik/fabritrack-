package com.example.fabritrack.dto;

import com.example.fabritrack.entity.User;

import java.util.List;

/** Response for GET /api/users/me: current user and their permissions. */
public record MeResponse(User user, List<String> permissions) {
}
