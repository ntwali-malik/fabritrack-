package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetMovement;
import com.example.fabritrack.repository.AssetMovementRepository;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.AnomalyDetectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/asset-movements")
@CrossOrigin(origins = "*")
public class AssetMovementController {

    private final AssetMovementRepository repository;
    private final AssetRepository assetRepository;
    private final AuditLogService auditLogService;
    private final AnomalyDetectionService anomalyDetectionService;

    public AssetMovementController(AssetMovementRepository repository, AssetRepository assetRepository,
                                   AuditLogService auditLogService,
                                   AnomalyDetectionService anomalyDetectionService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.auditLogService = auditLogService;
        this.anomalyDetectionService = anomalyDetectionService;
    }

    @GetMapping
    public List<AssetMovement> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetMovement> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AssetMovement entity) {
        ResponseEntity<String> validation = validateAndResolveForCreate(entity);
        if (validation != null) return validation;
        AssetMovement saved = repository.save(entity);
        auditLogService.log("AssetMovement", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.MOVE,
                (entity.getFromLocationName() != null && entity.getToLocationName() != null)
                        ? entity.getFromLocationName() + " → " + entity.getToLocationName()
                        : (entity.getReason() != null ? entity.getReason() : "Asset moved"), null);
        anomalyDetectionService.evaluateMovement(saved, auditLogService.getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AssetMovement entity) {
        return repository.findById(id)
                .map(existing -> {
                    // Keep movement chain immutable: route and asset cannot be edited in-place.
                    if (!isSameLocation(existing.getFromLocationName(), entity.getFromLocationName())
                            || !isSameLocation(existing.getToLocationName(), entity.getToLocationName())
                            || !sameAssetId(existing, entity)) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                "Movement route/asset cannot be changed after creation. Create a new movement from the current location."
                        );
                    }

                    if (entity.getMovedAt() != null && entity.getMovedAt().isAfter(LocalDateTime.now().plusMinutes(5))) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Moved time cannot be in the future.");
                    }

                    existing.setReason(entity.getReason() != null ? entity.getReason().trim() : null);
                    existing.setMovedAt(entity.getMovedAt() != null ? entity.getMovedAt() : existing.getMovedAt());
                    AssetMovement saved = repository.save(existing);
                    auditLogService.log("AssetMovement", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.MOVE,
                            "Updated movement", null);
                    anomalyDetectionService.evaluateMovement(saved, auditLogService.getCurrentUser());
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        auditLogService.log("AssetMovement", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE, "Movement record deleted", null);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<String> validateAndResolveForCreate(AssetMovement entity) {
        if (entity.getAsset() == null || entity.getAsset().getId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Asset is required.");
        }

        UUID assetId = entity.getAsset().getId();
        if (!assetRepository.existsById(assetId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Selected asset was not found.");
        }
        entity.setAsset(assetRepository.getReferenceById(assetId));

        String from = normalizeLocation(entity.getFromLocationName());
        String to = normalizeLocation(entity.getToLocationName());
        if (from.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("From location is required.");
        if (to.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("To location is required.");
        if (from.equalsIgnoreCase(to)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("From and To location cannot be the same.");
        }
        entity.setFromLocationName(from);
        entity.setToLocationName(to);

        if (entity.getMovedAt() != null && entity.getMovedAt().isAfter(LocalDateTime.now().plusMinutes(5))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Moved time cannot be in the future.");
        }

        var latestOpt = repository.findTopByAsset_IdOrderByMovedAtDescIdDesc(assetId);
        if (latestOpt.isPresent()) {
            String expectedFrom = normalizeLocation(latestOpt.get().getToLocationName());
            if (!expectedFrom.equalsIgnoreCase(from)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        "Invalid sequence: asset is currently at \"" + latestOpt.get().getToLocationName()
                                + "\". Next move must start from that location."
                );
            }
        }
        return null;
    }

    private String normalizeLocation(String value) {
        if (value == null) return "";
        return value.trim().replaceAll("\\s+", " ");
    }

    private boolean isSameLocation(String a, String b) {
        return normalizeLocation(a).equalsIgnoreCase(normalizeLocation(b));
    }

    private boolean sameAssetId(AssetMovement existing, AssetMovement incoming) {
        UUID existingId = existing.getAsset() != null ? existing.getAsset().getId() : null;
        UUID incomingId = (incoming.getAsset() != null ? incoming.getAsset().getId() : null);
        return existingId != null && existingId.equals(incomingId);
    }
}
