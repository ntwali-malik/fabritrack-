package com.example.fabritrack.dto;

import com.example.fabritrack.entity.AnomalyAlert;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for anomaly/theft-risk alerts (avoids lazy-load in API).
 */
public record AnomalyAlertResponse(
    Long id,
    String reason,
    AnomalyAlert.Severity severity,
    LocalDateTime createdAt,
    UUID assetId,
    String assetTag,
    String assetName,
    BigDecimal assetValueAtAlert,
    String fromLocation,
    String toLocation,
    String performedByEmail,
    Long movementId
) {}
