package com.example.fabritrack.repository;

import com.example.fabritrack.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByUser_IdAndIsReadOrderByCreatedAtDesc(UUID userId, Boolean isRead);

    List<Notification> findAllByOrderByCreatedAtDesc();
}
