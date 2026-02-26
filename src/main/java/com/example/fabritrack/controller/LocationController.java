package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Location;
import com.example.fabritrack.repository.LocationRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationRepository repository;
    private final AuditLogService auditLogService;

    public LocationController(LocationRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
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
    public ResponseEntity<Location> create(@RequestBody Location entity) {
        Location saved = repository.save(entity);
        auditLogService.log("Location", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Location: " + (saved.getName() != null ? saved.getName() : ""), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Location> update(@PathVariable Long id, @RequestBody Location entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    Location saved = repository.save(entity);
                    auditLogService.log("Location", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Location: " + (saved.getName() != null ? saved.getName() : ""), null);
                    return ResponseEntity.ok(saved);
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
}
