package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Comment;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.CommentRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentRepository repository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public CommentController(CommentRepository repository,
                             AssetRepository assetRepository,
                             UserRepository userRepository,
                             AuditLogService auditLogService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Comment> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Comment> create(@RequestBody Comment entity) {
        resolveRelations(entity);
        Comment saved = repository.save(entity);
        auditLogService.log("Comment", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Comment on asset", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comment> update(@PathVariable Long id, @RequestBody Comment entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    resolveRelations(entity);
                    Comment saved = repository.save(entity);
                    auditLogService.log("Comment", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE, "Comment updated", null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        auditLogService.log("Comment", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE, "Comment deleted", null);
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(Comment entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        if (entity.getUser() != null && entity.getUser().getId() != null) {
            entity.setUser(userRepository.getReferenceById(entity.getUser().getId()));
        }
    }
}
