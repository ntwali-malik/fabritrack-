package com.example.fabritrack.entity;

/**
 * Permissions used for authorization. Users receive permissions through their role
 * (see RolePermissionService). Access control checks these, not role names.
 */
public enum Permission {
    USER_MANAGE,
    ASSET_CATEGORY_MANAGE,
    LOCATION_MANAGE,
    ASSET_READ,
    ASSET_WRITE,
    ASSIGNMENT_MANAGE,
    EMPLOYEE_MANAGE,
    RESERVATION_MANAGE,
    MAINTENANCE_MANAGE,
    ATTACHMENT_MANAGE,
    COMMENT_MANAGE,
    MOVEMENT_READ,
    MOVEMENT_WRITE,
    DEPRECIATION_MANAGE,
    AUDIT_READ,
    NOTIFICATION_READ,
    ANOMALY_READ,
    /** Allows moving high-value assets without triggering theft-risk alert. */
    HIGH_VALUE_MOVEMENT_BYPASS,
}
