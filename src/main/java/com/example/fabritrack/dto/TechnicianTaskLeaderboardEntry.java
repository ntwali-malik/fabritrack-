package com.example.fabritrack.dto;

import java.util.UUID;

/**
 * Aggregated completed-task counts per technician (for rankings).
 */
public record TechnicianTaskLeaderboardEntry(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        Long completedCount
) {}
