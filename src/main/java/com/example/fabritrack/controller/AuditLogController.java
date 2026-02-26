package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AuditLog;
import com.example.fabritrack.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Read-only API for viewing audit logs. Logs are created by the application
 * when actions occur; they are not created, updated, or deleted via this API.
 */
@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogRepository repository;

    public AuditLogController(AuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * List audit logs with optional filters. Default: newest first, 20 per page.
     */
    @GetMapping
    public Page<AuditLog> findAll(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) AuditLog.AuditAction action,
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("performedAt").descending());
        if (entityName != null && !entityName.isBlank()) {
            return repository.findByEntityNameOrderByPerformedAtDesc(entityName.trim(), pageable);
        }
        if (action != null) {
            return repository.findByActionOrderByPerformedAtDesc(action, pageable);
        }
        if (userId != null) {
            return repository.findByUser_IdOrderByPerformedAtDesc(userId, pageable);
        }
        return repository.findAllByOrderByPerformedAtDesc(pageable);
    }

    /**
     * Get a single audit log entry by id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
