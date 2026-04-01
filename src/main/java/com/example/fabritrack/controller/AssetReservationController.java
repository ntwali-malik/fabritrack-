package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetReservation;
import com.example.fabritrack.entity.Notification;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AssetReservationRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-reservations")
@CrossOrigin(origins = "*")
public class AssetReservationController {

    private final AssetReservationRepository repository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AssetReservationController(AssetReservationRepository repository,
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
    public List<AssetReservation> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetReservation> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AssetReservation> create(@RequestBody AssetReservation entity) {
        resolveRelations(entity);
        AssetReservation saved = repository.save(entity);
        auditLogService.log("AssetReservation", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Reservation created" + (saved.getAsset() != null ? " for " + saved.getAsset().getName() : ""), null);
        String assetName = (saved.getAsset() != null) ? saved.getAsset().getName() : "-";
        String message = String.format(
                "Your reservation for \"%s\" from %s to %s has been created. Status: %s.",
                assetName,
                saved.getStartDate(),
                saved.getEndDate(),
                saved.getStatus());
        notificationService.notifyUser(
                saved.getUser(),
                Notification.NotificationType.RESERVATION,
                "Reservation created",
                message);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetReservation> update(@PathVariable Long id, @RequestBody AssetReservation entity) {
        return repository.findById(id)
                .map(existing -> {
                    AssetReservation.ReservationStatus previousStatus = existing.getStatus();
                    entity.setId(id);
                    resolveRelations(entity);
                    AssetReservation saved = repository.save(entity);
                    auditLogService.log("AssetReservation", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Reservation updated (status: " + (saved.getStatus() != null ? saved.getStatus() : "") + ")", null);
                    if (entity.getStatus() != null && !entity.getStatus().equals(previousStatus)) {
                        String assetName = (saved.getAsset() != null) ? saved.getAsset().getName() : "asset";
                        String message = String.format(
                                "Your reservation for \"%s\" (%s to %s) has been updated. New status: %s.",
                                assetName,
                                saved.getStartDate(),
                                saved.getEndDate(),
                                saved.getStatus());
                        notificationService.notifyUser(
                                saved.getUser(),
                                Notification.NotificationType.RESERVATION,
                                "Reservation status updated",
                                message);
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
        auditLogService.log("AssetReservation", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE, "Reservation deleted", null);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(AssetReservation entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        if (entity.getUser() != null && entity.getUser().getId() != null) {
            entity.setUser(userRepository.getReferenceById(entity.getUser().getId()));
        }
    }
}
