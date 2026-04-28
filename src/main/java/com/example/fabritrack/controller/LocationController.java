package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Location;
import com.example.fabritrack.entity.Role;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.LocationRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "*")
public class LocationController {

    private final LocationRepository repository;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final AuditLogService auditLogService;

    public LocationController(LocationRepository repository,
                              UserRepository userRepository,
                              AssetRepository assetRepository,
                              AuditLogService auditLogService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.assetRepository = assetRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Location> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Location> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Location entity) {
        ResponseEntity<String> validation = resolveInstallerAndValidate(entity);
        if (validation != null) {
            return validation;
        }
        Location saved = repository.save(entity);
        auditLogService.log("Location", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Location: " + (saved.getName() != null ? saved.getName() : ""), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Location entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    ResponseEntity<String> validation = resolveInstallerAndValidate(entity);
                    if (validation != null) {
                        return validation;
                    }
                    Location saved = repository.save(entity);
                    auditLogService.log("Location", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Location: " + (saved.getName() != null ? saved.getName() : ""), null);
                    return ResponseEntity.<Object>ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.findById(id).ifPresent(l ->
                auditLogService.log("Location", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Location deleted: " + (l.getName() != null ? l.getName() : ""), null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<String> resolveInstallerAndValidate(Location entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            if (!assetRepository.existsById(entity.getAsset().getId())) {
                return ResponseEntity.badRequest().body("asset not found");
            }
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        } else {
            entity.setAsset(null);
        }

        if (entity.getInstalledBy() == null || entity.getInstalledBy().getId() == null) {
            entity.setInstalledBy(null);
            return null;
        }
        UUID installerId = entity.getInstalledBy().getId();
        var userOpt = userRepository.findById(installerId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("installedBy user not found");
        }
        var user = userOpt.get();
        if (user.getRole() != Role.TECHNICIAN) {
            return ResponseEntity.badRequest().body("installedBy user must have TECHNICIAN role");
        }
        entity.setInstalledBy(user);
        return null;
    }
}
