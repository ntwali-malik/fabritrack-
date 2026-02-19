package com.example.fabritrack.controller;

import com.example.fabritrack.entity.DepreciationRecord;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.DepreciationRecordRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/depreciation-records")
public class DepreciationRecordController {

    private final DepreciationRecordRepository repository;
    private final AssetRepository assetRepository;

    public DepreciationRecordController(DepreciationRecordRepository repository,
                                        AssetRepository assetRepository) {
        this.repository = repository;
        this.assetRepository = assetRepository;
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

    @PostMapping
    public ResponseEntity<DepreciationRecord> create(@RequestBody DepreciationRecord entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        DepreciationRecord saved = repository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepreciationRecord> update(@PathVariable Long id, @RequestBody DepreciationRecord entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    if (entity.getAsset() != null && entity.getAsset().getId() != null) {
                        entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
                    }
                    return ResponseEntity.ok(repository.save(entity));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
