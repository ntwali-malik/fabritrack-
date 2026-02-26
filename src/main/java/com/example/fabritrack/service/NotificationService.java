package com.example.fabritrack.service;

import com.example.fabritrack.entity.Notification;
import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Creates and persists notifications for users. Notifications are sent
 * when certain operations occur (assignments, reservations, maintenance)
 * and by scheduled jobs (warranty expiry, maintenance due).
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Send a notification to a single user.
     */
    @Transactional
    public Notification notifyUser(User user, Notification.NotificationType type, String title, String message) {
        if (user == null) return null;
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setIsRead(false);
        return notificationRepository.save(n);
    }

    /**
     * Send the same notification to multiple users (e.g. warranty/maintenance alerts).
     */
    @Transactional
    public void notifyUsers(List<User> users, Notification.NotificationType type, String title, String message) {
        if (users == null || users.isEmpty()) return;
        for (User user : users) {
            notifyUser(user, type, title, message);
        }
    }
}
