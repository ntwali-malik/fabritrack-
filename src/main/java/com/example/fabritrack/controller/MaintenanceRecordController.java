package com.example.fabritrack.controller;

import com.example.fabritrack.entity.MaintenanceRecord;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.MaintenanceRecordRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance-records")
public class MaintenanceRecordController {

    private final MaintenanceRecordRepository repository;
    private final AssetRepository assetRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public MaintenanceRecordController(MaintenanceRecordRepository repository,
                                       AssetRepository assetRepository,
                                       NotificationService notificationService,
                                       UserRepository userRepository,
                                       AuditLogService auditLogService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<MaintenanceRecord> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecord> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MaintenanceRecord> create(@RequestBody MaintenanceRecord entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        MaintenanceRecord saved = repository.save(entity);
        auditLogService.log("MaintenanceRecord", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                (saved.getType() != null ? saved.getType().toString() : "Maintenance") + " scheduled for asset", null);
        List<com.example.fabritrack.entity.User> activeUsers = userRepository.findByStatus(com.example.fabritrack.entity.User.UserStatus.ACTIVE);
        String assetName = saved.getAsset() != null ? saved.getAsset().getName() : "Unknown asset";
        String title = "Maintenance scheduled";
        String message = String.format("Maintenance (%s) for \"%s\" has been scheduled for %s.",
                saved.getType(), assetName, saved.getScheduledDate());
        notificationService.notifyUsers(activeUsers, com.example.fabritrack.entity.Notification.NotificationType.MAINTENANCE, title, message);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceRecord> update(@PathVariable Long id, @RequestBody MaintenanceRecord entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    if (entity.getAsset() != null && entity.getAsset().getId() != null) {
                        entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
                    }
                    MaintenanceRecord saved = repository.save(entity);
                    auditLogService.log("MaintenanceRecord", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Maintenance record updated", null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        auditLogService.log("MaintenanceRecord", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE, "Maintenance record deleted", null);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
