package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByEntityNameOrderByPerformedAtDesc(String entityName, Pageable pageable);

    Page<AuditLog> findByUser_IdOrderByPerformedAtDesc(UUID userId, Pageable pageable);

    Page<AuditLog> findByActionOrderByPerformedAtDesc(AuditLog.AuditAction action, Pageable pageable);

    Page<AuditLog> findAllByOrderByPerformedAtDesc(Pageable pageable);
}
