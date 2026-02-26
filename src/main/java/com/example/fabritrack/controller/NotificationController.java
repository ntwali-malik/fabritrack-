package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Notification;
import com.example.fabritrack.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * API for viewing notifications and marking them as read. Notifications are
 * created by the application; this API does not support create/update/delete.
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    /**
     * List notifications. If userId is provided, returns that user's notifications;
     * otherwise returns all (e.g. for admin). Optional filter: unreadOnly.
     */
    @GetMapping
    public List<Notification> findAll(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {
        if (userId != null) {
            if (unreadOnly) {
                return repository.findByUser_IdAndIsReadOrderByCreatedAtDesc(userId, false);
            }
            return repository.findByUser_IdOrderByCreatedAtDesc(userId);
        }
        if (unreadOnly) {
            return repository.findAllByOrderByCreatedAtDesc().stream()
                    .filter(n -> Boolean.FALSE.equals(n.getIsRead()))
                    .toList();
        }
        return repository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get a single notification by id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Notification> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark a notification as read. Idempotent.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return repository.findById(id)
                .map(notification -> {
                    notification.setIsRead(true);
                    return ResponseEntity.ok(repository.save(notification));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark all notifications for the current user as read.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        UUID currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(403).build();
        }
        List<Notification> unread = repository.findByUser_IdAndIsReadOrderByCreatedAtDesc(currentUserId, false);
        unread.forEach(n -> {
            n.setIsRead(true);
            repository.save(n);
        });
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return null;
        }
        try {
            return UUID.fromString(auth.getPrincipal().toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
