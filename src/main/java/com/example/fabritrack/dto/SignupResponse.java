package com.example.fabritrack.dto;

import com.example.fabritrack.entity.User;

/**
 * Returned after signup when admin approval is required.
 * No token is issued until an admin approves the account.
 */
public record SignupResponse(String message, User user) {
    public static final String MESSAGE = "Registration submitted. An administrator will review your account. You will be able to sign in after approval.";
}
