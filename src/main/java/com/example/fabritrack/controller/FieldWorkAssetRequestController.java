package com.example.fabritrack.controller;

import com.example.fabritrack.entity.FieldWorkAssetRequest;
import com.example.fabritrack.entity.FieldWorkAssetRequestItem;
import com.example.fabritrack.entity.Notification;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.FieldWorkAssetRequestRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/field-work-asset-requests")
@CrossOrigin(origins = "*")
public class FieldWorkAssetRequestController {

    private final FieldWorkAssetRequestRepository repository;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public FieldWorkAssetRequestController(
            FieldWorkAssetRequestRepository repository,
            UserRepository userRepository,
            AssetRepository assetRepository,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.assetRepository = assetRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<FieldWorkAssetRequest> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FieldWorkAssetRequest> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FieldWorkAssetRequest> create(@RequestBody FieldWorkAssetRequest entity) {
        resolveRelations(entity);
        entity.setStatus(FieldWorkAssetRequest.RequestStatus.PENDING);
        FieldWorkAssetRequest saved = repository.save(entity);
        auditLogService.log(
                "FieldWorkAssetRequest",
                saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Field work asset request created",
                saved.getTechnician()
        );
        notifyOnCreate(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FieldWorkAssetRequest> update(@PathVariable Long id, @RequestBody FieldWorkAssetRequest entity) {
        return repository.findById(id)
                .map(existing -> {
                    FieldWorkAssetRequest.RequestStatus previousStatus = existing.getStatus();
                    entity.setId(id);
                    entity.setRequestedAt(existing.getRequestedAt());
                    resolveRelations(entity);
                    FieldWorkAssetRequest saved = repository.save(entity);
                    auditLogService.log(
                            "FieldWorkAssetRequest",
                            saved.getId().toString(),
                            com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Field work asset request updated (status: " + saved.getStatus() + ")",
                            saved.getTechnician()
                    );
                    if (saved.getStatus() != previousStatus) {
                        notifyOnStatusChange(saved, previousStatus);
                    }
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        auditLogService.log(
                "FieldWorkAssetRequest",
                id.toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                "Field work asset request deleted",
                null
        );
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(FieldWorkAssetRequest entity) {
        if (entity.getTechnician() != null && entity.getTechnician().getId() != null) {
            entity.setTechnician(userRepository.getReferenceById(entity.getTechnician().getId()));
        }

        List<FieldWorkAssetRequestItem> resolvedItems = new ArrayList<>();
        if (entity.getItems() != null) {
            for (FieldWorkAssetRequestItem item : entity.getItems()) {
                if (item.getAsset() != null && item.getAsset().getId() != null) {
                    item.setAsset(assetRepository.getReferenceById(item.getAsset().getId()));
                }
                if (item.getStatus() == null) {
                    item.setStatus(FieldWorkAssetRequestItem.ItemStatus.REQUESTED);
                }
                item.setRequest(entity);
                resolvedItems.add(item);
            }
        }
        entity.setItems(resolvedItems);
    }

    private void notifyOnCreate(FieldWorkAssetRequest saved) {
        if (saved.getTechnician() == null) {
            return;
        }
        notificationService.notifyUser(
                saved.getTechnician(),
                Notification.NotificationType.GENERAL,
                "Asset request submitted",
                String.format(
                        "Your asset request #%d has been submitted and is now PENDING.",
                        saved.getId()
                )
        );
    }

    private void notifyOnStatusChange(FieldWorkAssetRequest saved, FieldWorkAssetRequest.RequestStatus previousStatus) {
        if (saved.getTechnician() == null) {
            return;
        }
        notificationService.notifyUser(
                saved.getTechnician(),
                Notification.NotificationType.GENERAL,
                "Asset request status updated",
                String.format(
                        "Your asset request #%d status changed from %s to %s.",
                        saved.getId(),
                        previousStatus,
                        saved.getStatus()
                )
        );
    }
}
