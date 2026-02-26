package com.example.fabritrack.scheduler;

import com.example.fabritrack.entity.Asset;
import com.example.fabritrack.entity.MaintenanceRecord;
import com.example.fabritrack.entity.Notification;
import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.MaintenanceRecordRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Sends notifications to users based on a schedule (e.g. daily):
 * - Warranty expiring soon (e.g. within 30 days)
 * - Maintenance due or overdue
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    /** Notify when warranty expires within this many days. */
    private static final int WARRANTY_WARNING_DAYS = 30;

    private final AssetRepository assetRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public NotificationScheduler(AssetRepository assetRepository,
                                  MaintenanceRecordRepository maintenanceRecordRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService) {
        this.assetRepository = assetRepository;
        this.maintenanceRecordRepository = maintenanceRecordRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * Run daily at 8:00 AM: send warranty expiry and maintenance-due notifications.
     */
    @Scheduled(cron = "${app.notifications.schedule.cron:0 0 8 * * ?}")
    public void sendScheduledNotifications() {
        log.info("Running scheduled notifications");
        sendWarrantyExpiryNotifications();
        sendMaintenanceDueNotifications();
    }

    /**
     * Notify active users about assets whose warranty expires within WARRANTY_WARNING_DAYS.
     */
    protected void sendWarrantyExpiryNotifications() {
        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(WARRANTY_WARNING_DAYS);
        List<Asset> expiring = assetRepository.findByWarrantyExpiryDateBetween(today, until);
        if (expiring.isEmpty()) return;

        List<User> activeUsers = userRepository.findByStatus(User.UserStatus.ACTIVE);
        if (activeUsers.isEmpty()) return;

        for (Asset asset : expiring) {
            String title = "Warranty expiring soon";
            String message = String.format("Asset \"%s\" (%s) warranty expires on %s.",
                    asset.getName(),
                    asset.getAssetTag(),
                    asset.getWarrantyExpiryDate());
            notificationService.notifyUsers(activeUsers, Notification.NotificationType.WARRANTY_EXPIRY, title, message);
        }
        log.info("Sent warranty expiry notifications for {} asset(s) to {} user(s)", expiring.size(), activeUsers.size());
    }

    /**
     * Notify active users about maintenance records that are due or overdue (scheduled date <= today, status SCHEDULED or IN_PROGRESS).
     */
    protected void sendMaintenanceDueNotifications() {
        LocalDate today = LocalDate.now();
        List<MaintenanceRecord.MaintenanceStatus> pending = List.of(
                MaintenanceRecord.MaintenanceStatus.SCHEDULED,
                MaintenanceRecord.MaintenanceStatus.IN_PROGRESS
        );
        List<MaintenanceRecord> due = maintenanceRecordRepository.findByScheduledDateLessThanEqualAndStatusIn(today, pending);
        if (due.isEmpty()) return;

        List<User> activeUsers = userRepository.findByStatus(User.UserStatus.ACTIVE);
        if (activeUsers.isEmpty()) return;

        for (MaintenanceRecord record : due) {
            Asset asset = record.getAsset();
            String assetName = asset != null ? asset.getName() : "Unknown asset";
            String title = "Maintenance due";
            String message = String.format("Maintenance (%s) for \"%s\" was scheduled for %s. Status: %s.",
                    record.getType(),
                    assetName,
                    record.getScheduledDate(),
                    record.getStatus());
            notificationService.notifyUsers(activeUsers, Notification.NotificationType.MAINTENANCE, title, message);
        }
        log.info("Sent maintenance due notifications for {} record(s) to {} user(s)", due.size(), activeUsers.size());
    }
}
