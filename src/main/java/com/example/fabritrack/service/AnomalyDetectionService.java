package com.example.fabritrack.service;

import com.example.fabritrack.entity.*;
import com.example.fabritrack.repository.AnomalyAlertRepository;
import com.example.fabritrack.repository.AssetMovementRepository;
import com.example.fabritrack.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Rule-based theft and anomaly detection. Evaluates asset movements and
 * sends real-time THEFT_RISK notifications to SECURITY/ADMIN when rules trigger.
 */
@Service
public class AnomalyDetectionService {

    private static final Logger log = LoggerFactory.getLogger(AnomalyDetectionService.class);

    /** Roles allowed to move high-value assets without triggering an alert. */
    private static final Set<Role> PRIVILEGED_ROLES = Set.of(Role.ADMIN, Role.SECURITY);

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AssetMovementRepository movementRepository;
    private final AnomalyAlertRepository anomalyAlertRepository;

    /** Allowed movement time window start (e.g. 6 = 06:00). */
    @Value("${app.anomaly.allowed-hour-start:6}")
    private int allowedHourStart;

    /** Allowed movement time window end (e.g. 22 = 22:00). */
    @Value("${app.anomaly.allowed-hour-end:22}")
    private int allowedHourEnd;

    /** Asset value above this threshold is considered high-value (requires privileged role). */
    @Value("${app.anomaly.high-value-threshold:10000}")
    private BigDecimal highValueThreshold;

    /** Max movements for same asset in the last 24 hours before flagging. */
    @Value("${app.anomaly.max-movements-per-asset-24h:5}")
    private int maxMovementsPerAsset24h;

    public AnomalyDetectionService(NotificationService notificationService,
                                   UserRepository userRepository,
                                   AssetMovementRepository movementRepository,
                                   AnomalyAlertRepository anomalyAlertRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.movementRepository = movementRepository;
        this.anomalyAlertRepository = anomalyAlertRepository;
    }

    /**
     * Evaluate a movement and the user who performed it. If any rule triggers,
     * an AnomalyAlert is saved and THEFT_RISK notifications are sent to ADMIN/SECURITY.
     */
    @Transactional
    public void evaluateMovement(AssetMovement movement, User performedBy) {
        if (movement == null || movement.getAsset() == null) return;

        Asset asset = movement.getAsset();
        LocalDateTime movedAt = movement.getMovedAt() != null ? movement.getMovedAt() : LocalDateTime.now();
        List<String> reasons = new ArrayList<>();

        // Rule 1: Movement outside allowed hours
        LocalTime time = movedAt.toLocalTime();
        LocalTime start = LocalTime.of(allowedHourStart, 0);
        LocalTime end = LocalTime.of(allowedHourEnd, 59);
        if (time.isBefore(start) || time.isAfter(end)) {
            reasons.add("Movement outside allowed hours (" + allowedHourStart + ":00–" + allowedHourEnd + ":59): " + time);
        }

        // Rule 2: High-value asset moved by non-privileged user
        BigDecimal value = asset.getCurrentValue() != null ? asset.getCurrentValue() : asset.getPurchaseCost();
        if (value != null && value.compareTo(highValueThreshold) >= 0 && performedBy != null) {
            if (!PRIVILEGED_ROLES.contains(performedBy.getRole())) {
                reasons.add("High-value asset (" + value + ") moved by " + performedBy.getRole() + " (requires ADMIN or SECURITY)");
            }
        }

        // Rule 3: Same asset moved too many times in 24 hours
        LocalDateTime since = movedAt.minusHours(24);
        long count = movementRepository.countByAsset_IdAndMovedAtAfter(asset.getId(), since);
        if (count > maxMovementsPerAsset24h) {
            reasons.add("Asset moved " + count + " times in 24h (max " + maxMovementsPerAsset24h + ")");
        }

        if (reasons.isEmpty()) return;

        String reasonText = String.join("; ", reasons);
        AnomalyAlert.Severity severity = reasons.size() >= 2 || (value != null && value.compareTo(highValueThreshold) >= 0)
                ? AnomalyAlert.Severity.HIGH
                : AnomalyAlert.Severity.MEDIUM;

        AnomalyAlert alert = new AnomalyAlert();
        alert.setReason(reasonText);
        alert.setSeverity(severity);
        alert.setMovement(movement);
        alert.setPerformedBy(performedBy);
        alert.setAsset(asset);
        alert.setAssetValueAtAlert(value);
        anomalyAlertRepository.save(alert);

        String title = "Theft risk / Anomaly: " + asset.getName() + " (" + asset.getAssetTag() + ")";
        String message = reasonText + ". From: " + movement.getFromLocationName() + " → To: " + movement.getToLocationName()
                + (performedBy != null ? ". Performed by: " + performedBy.getEmail() : "");

        List<User> recipients = userRepository.findByRoleInAndStatus(Set.of(Role.ADMIN, Role.SECURITY), User.UserStatus.ACTIVE);
        if (recipients.isEmpty()) {
            log.warn("No ADMIN/SECURITY users to notify for theft risk");
            return;
        }
        notificationService.notifyUsers(recipients, Notification.NotificationType.THEFT_RISK, title, message);
        log.info("Theft risk alert sent: {} to {} user(s)", reasonText, recipients.size());
    }
}
