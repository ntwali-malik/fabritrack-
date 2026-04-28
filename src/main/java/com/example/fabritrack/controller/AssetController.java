package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Asset;
import com.example.fabritrack.entity.Department;
import com.example.fabritrack.repository.AssetCategoryRepository;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetRepository repository;
    private final AssetCategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    public AssetController(AssetRepository repository,
                           AssetCategoryRepository categoryRepository,
                           AuditLogService auditLogService) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Asset> findAll() {
        return repository.findAll();
    }

    /** Returns the next asset tag for the given department (e.g. FB-IT-001, FB-FIN-001). Used by frontend to preview before create. */
    @GetMapping("/next-tag")
    public ResponseEntity<?> getNextTag(@RequestParam String department) {
        if (department == null || department.isBlank()) {
            return ResponseEntity.badRequest().body("Department is required.");
        }
        try {
            Department dept = Department.valueOf(department.trim().toUpperCase());
            String nextTag = generateNextAssetTag(dept);
            return ResponseEntity.ok(java.util.Map.of("nextTag", nextTag));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid department: " + department);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> findById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Asset entity) {
        if (entity.getDepartment() == null) {
            return ResponseEntity.badRequest().body("Department is required to generate asset tag.");
        }
        resolveRelations(entity);
        // Always generate tag in FB-DEPTCODE-NNN format (e.g. FB-IT-001, FB-FIN-001); ignore any client-supplied value
        entity.setAssetTag(generateNextAssetTag(entity.getDepartment()));
        if (entity.getPurchaseCost() != null) {
            entity.setCurrentValue(entity.getPurchaseCost());
        }
        Asset saved = repository.save(entity);
        auditLogService.log("Asset", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Created asset: " + (saved.getName() != null ? saved.getName() : saved.getAssetTag()), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> update(@PathVariable UUID id, @RequestBody Asset entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    entity.setCurrentValue(existing.getCurrentValue());
                    entity.setAssetTag(existing.getAssetTag()); // keep tag immutable after creation
                    resolveRelations(entity);
                    Asset saved = repository.save(entity);
                    auditLogService.log("Asset", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Updated asset: " + (saved.getName() != null ? saved.getName() : saved.getAssetTag()), null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.findById(id).ifPresent(a ->
                auditLogService.log("Asset", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Deleted asset: " + (a.getName() != null ? a.getName() : a.getAssetTag()), null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(Asset entity) {
        if (entity.getCategory() != null && entity.getCategory().getId() != null) {
            entity.setCategory(categoryRepository.getReferenceById(entity.getCategory().getId()));
        }
    }

    /** Asset tag format: FB-DEPTCODE-NNN (e.g. FB-IT-001, FB-FIN-002). */
    private static final String ASSET_TAG_PREFIX = "FB-";
    private static final String ASSET_TAG_NUMBER_FORMAT = "%03d";

    private String getDepartmentTagCode(Department department) {
        // Shortcodes keep the tag readable while still being deterministic.
        return switch (department) {
            case FINANCE -> "FIN";
            case TECHNICAL -> "TECH";
            default -> department.name();
        };
    }

    private List<String> getDepartmentTagPrefixesForSequence(Department department) {
        // Support legacy tags that used the full enum name (e.g. FB-FINANCE-001) so numbering
        // doesn't reset if older assets already exist.
        String primaryPrefix = ASSET_TAG_PREFIX + getDepartmentTagCode(department) + "-";
        String legacyPrefix = ASSET_TAG_PREFIX + department.name() + "-";
        if (primaryPrefix.equals(legacyPrefix)) {
            return List.of(primaryPrefix);
        }
        return List.of(primaryPrefix, legacyPrefix);
    }

    private String generateNextAssetTag(Department department) {
        String outputPrefix = ASSET_TAG_PREFIX + getDepartmentTagCode(department) + "-";
        Optional<Asset> top = repository.findTopByDepartmentOrderByAssetTagDesc(department);
        int nextNum = 1;
        if (top.isPresent() && top.get().getAssetTag() != null) {
            String tag = top.get().getAssetTag();
            for (String prefix : getDepartmentTagPrefixesForSequence(department)) {
                if (!tag.startsWith(prefix)) continue;

                String numPart = tag.substring(prefix.length()).trim();
                if (!numPart.isEmpty()) {
                    try {
                        int n = Integer.parseInt(numPart);
                        if (n >= 0) nextNum = n + 1;
                    } catch (NumberFormatException ignored) {
                        // use 1
                    }
                }
                break;
            }
        }
        return outputPrefix + String.format(ASSET_TAG_NUMBER_FORMAT, nextNum);
    }
}
