package com.example.fabritrack.controller;

import com.example.fabritrack.entity.LocationInstallationFeedback;
import com.example.fabritrack.repository.LocationInstallationFeedbackRepository;
import com.example.fabritrack.repository.LocationRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/location-installation-feedback")
@CrossOrigin(origins = "*")
public class LocationInstallationFeedbackController {

    private final LocationInstallationFeedbackRepository repository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public LocationInstallationFeedbackController(LocationInstallationFeedbackRepository repository,
                                                  LocationRepository locationRepository,
                                                  UserRepository userRepository,
                                                  AuditLogService auditLogService) {
        this.repository = repository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<LocationInstallationFeedback> list(
            @RequestParam(required = false) Long locationId) {
        if (locationId != null) {
            return repository.findByLocation_IdOrderBySubmittedAtDesc(locationId);
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationInstallationFeedback> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LocationInstallationFeedback> create(@RequestBody LocationInstallationFeedback entity) {
        resolveRelations(entity);
        LocationInstallationFeedback saved = repository.save(entity);
        auditLogService.log(
                "LocationInstallationFeedback",
                saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Location installation feedback submitted for location id "
                    + (saved.getLocation() != null ? saved.getLocation().getId() : ""),
                null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationInstallationFeedback> update(@PathVariable Long id,
                                                             @RequestBody LocationInstallationFeedback entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setSubmittedAt(existing.getSubmittedAt());
                    resolveRelations(entity);
                    LocationInstallationFeedback saved = repository.save(entity);
                    auditLogService.log(
                            "LocationInstallationFeedback",
                            saved.getId().toString(),
                            com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Location installation feedback updated",
                            null);
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
                "LocationInstallationFeedback",
                id.toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                "Location installation feedback deleted",
                null);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(LocationInstallationFeedback entity) {
        if (entity.getLocation() != null && entity.getLocation().getId() != null) {
            entity.setLocation(locationRepository.getReferenceById(entity.getLocation().getId()));
        }
        if (entity.getSubmittedBy() != null && entity.getSubmittedBy().getId() != null) {
            entity.setSubmittedBy(userRepository.getReferenceById(entity.getSubmittedBy().getId()));
        }
    }
}
