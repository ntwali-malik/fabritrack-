package com.example.fabritrack.dto;

/**
 * Optional body when approving a pending user. Admin can set the user's role at approval time.
 */
public record ApproveUserRequest(String role) {
}
