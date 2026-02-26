package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetAssignment;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AssetAssignmentRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-assignments")
public class AssetAssignmentController {

    private final AssetAssignmentRepository repository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AssetAssignmentController(AssetAssignmentRepository repository,
                                     AssetRepository assetRepository,
                                     UserRepository userRepository,
                                     NotificationService notificationService,
                                     AuditLogService auditLogService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AssetAssignment> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetAssignment> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AssetAssignment> create(@RequestBody AssetAssignment entity) {
        resolveRelations(entity);
        AssetAssignment saved = repository.save(entity);
        auditLogService.log("AssetAssignment", saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.ASSIGN,
                saved.getAsset() != null ? "Assigned asset " + saved.getAsset().getName() + " to user" : "Asset assigned", null);
        notificationService.notifyUser(
                saved.getUser(),
                com.example.fabritrack.entity.Notification.NotificationType.ASSIGNMENT,
                "Asset assigned",
                String.format("Asset \"%s\" has been assigned to you (assigned date: %s).",
                        saved.getAsset() != null ? saved.getAsset().getName() : "—",
                        saved.getAssignedDate()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetAssignment> update(@PathVariable Long id, @RequestBody AssetAssignment entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    resolveRelations(entity);
                    AssetAssignment saved = repository.save(entity);
                    com.example.fabritrack.entity.AuditLog.AuditAction action = saved.getStatus() == com.example.fabritrack.entity.AssetAssignment.AssignmentStatus.RETURNED
                            ? com.example.fabritrack.entity.AuditLog.AuditAction.RETURN : com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE;
                    auditLogService.log("AssetAssignment", saved.getId().toString(), action,
                            "Updated assignment" + (saved.getStatus() != null ? " (status: " + saved.getStatus() + ")" : ""), null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.findById(id).ifPresent(a ->
                auditLogService.log("AssetAssignment", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Assignment removed", null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(AssetAssignment entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        if (entity.getUser() != null && entity.getUser().getId() != null) {
            entity.setUser(userRepository.getReferenceById(entity.getUser().getId()));
        }
    }
}
