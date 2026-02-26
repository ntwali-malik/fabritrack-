package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetCategory;
import com.example.fabritrack.repository.AssetCategoryRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-categories")
public class AssetCategoryController {

    private final AssetCategoryRepository repository;
    private final AuditLogService auditLogService;

    public AssetCategoryController(AssetCategoryRepository repository, AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AssetCategory> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetCategory> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AssetCategory> create(@RequestBody AssetCategory entity) {
        AssetCategory saved = repository.save(entity);
        auditLogService.log("AssetCategory", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Category: " + (saved.getName() != null ? saved.getName() : ""), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetCategory> update(@PathVariable Long id, @RequestBody AssetCategory entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    AssetCategory saved = repository.save(entity);
                    auditLogService.log("AssetCategory", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Category: " + (saved.getName() != null ? saved.getName() : ""), null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.findById(id).ifPresent(c ->
                auditLogService.log("AssetCategory", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Category deleted: " + (c.getName() != null ? c.getName() : ""), null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
