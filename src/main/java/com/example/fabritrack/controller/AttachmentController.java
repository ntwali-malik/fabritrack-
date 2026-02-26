package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Attachment;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AttachmentRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentRepository repository;
    private final AssetRepository assetRepository;
    private final AuditLogService auditLogService;

    public AttachmentController(AttachmentRepository repository, AssetRepository assetRepository,
                                AuditLogService auditLogService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Attachment> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attachment> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Attachment> create(@RequestBody Attachment entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        Attachment saved = repository.save(entity);
        auditLogService.log("Attachment", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Attachment: " + (saved.getFileName() != null ? saved.getFileName() : ""), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Attachment> update(@PathVariable Long id, @RequestBody Attachment entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setUploadedAt(existing.getUploadedAt());
                    if (entity.getAsset() != null && entity.getAsset().getId() != null) {
                        entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
                    }
                    Attachment saved = repository.save(entity);
                    auditLogService.log("Attachment", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE, "Attachment updated", null);
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
                auditLogService.log("Attachment", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Attachment deleted: " + (a.getFileName() != null ? a.getFileName() : ""), null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
