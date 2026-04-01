package com.example.fabritrack.controller;

import com.example.fabritrack.dto.CreateDepreciationRequest;
import com.example.fabritrack.dto.UpdateDepreciationRequest;
import com.example.fabritrack.entity.DepreciationRecord;
import com.example.fabritrack.repository.DepreciationRecordRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.DepreciationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/depreciation-records")
@CrossOrigin(origins = "*")
public class DepreciationRecordController {

    private final DepreciationRecordRepository repository;
    private final DepreciationService depreciationService;
    private final AuditLogService auditLogService;

    public DepreciationRecordController(DepreciationRecordRepository repository,
                                        DepreciationService depreciationService,
                                        AuditLogService auditLogService) {
        this.repository = repository;
        this.depreciationService = depreciationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<DepreciationRecord> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepreciationRecord> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a depreciation record. Only assetId, year, and optional method are required;
     * depreciation amount and remaining value are calculated automatically.
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateDepreciationRequest request) {
        if (request == null || request.assetId() == null || request.year() == null) {
            return ResponseEntity.badRequest().body("assetId and year are required");
        }
        try {
            DepreciationRecord saved = depreciationService.createRecord(
                    request.assetId(),
                    request.year(),
                    request.method()
            );
            auditLogService.log("DepreciationRecord", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                    "Depreciation record for asset " + request.assetId() + ", year " + request.year(), null);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Update a depreciation record. If year or method is provided, amount and remaining value are recalculated.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateDepreciationRequest request) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            DepreciationRecord saved = depreciationService.updateRecord(
                    id,
                    request != null ? request.year() : null,
                    request != null ? request.method() : null
            );
            auditLogService.log("DepreciationRecord", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                    "Depreciation record updated", null);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            auditLogService.log("DepreciationRecord", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE, "Depreciation record deleted", null);
            depreciationService.deleteRecord(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
