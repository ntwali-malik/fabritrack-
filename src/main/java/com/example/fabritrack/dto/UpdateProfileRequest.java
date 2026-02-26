package com.example.fabritrack.dto;

/**
 * Request body for updating the current user's profile.
 * Only provided fields are applied; password change requires both current and new password.
 */
public record UpdateProfileRequest(
        String firstName,
        String lastName,
        String email,
        String phone,
        String currentPassword,
        String newPassword
) {}
