package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetMovement;
import com.example.fabritrack.repository.AssetMovementRepository;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.AnomalyDetectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<AssetMovement> create(@RequestBody AssetMovement entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        AssetMovement saved = repository.save(entity);
        auditLogService.log("AssetMovement", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.MOVE,
                (entity.getFromLocationName() != null && entity.getToLocationName() != null)
                        ? entity.getFromLocationName() + " → " + entity.getToLocationName()
                        : (entity.getReason() != null ? entity.getReason() : "Asset moved"), null);
        anomalyDetectionService.evaluateMovement(saved, auditLogService.getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetMovement> update(@PathVariable Long id, @RequestBody AssetMovement entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    if (entity.getAsset() != null && entity.getAsset().getId() != null) {
                        entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
                    }
                    AssetMovement saved = repository.save(entity);
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
}
