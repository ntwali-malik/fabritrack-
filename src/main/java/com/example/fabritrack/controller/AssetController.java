package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Asset;
import com.example.fabritrack.entity.AssetCategory;
import com.example.fabritrack.entity.Location;
import com.example.fabritrack.repository.AssetCategoryRepository;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.LocationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetRepository repository;
    private final AssetCategoryRepository categoryRepository;
    private final LocationRepository locationRepository;

    public AssetController(AssetRepository repository,
                           AssetCategoryRepository categoryRepository,
                           LocationRepository locationRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.locationRepository = locationRepository;
    }

    @GetMapping
    public List<Asset> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> findById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Asset> create(@RequestBody Asset entity) {
        resolveRelations(entity);
        Asset saved = repository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> update(@PathVariable UUID id, @RequestBody Asset entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    entity.setCreatedAt(existing.getCreatedAt());
                    resolveRelations(entity);
                    return ResponseEntity.ok(repository.save(entity));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveRelations(Asset entity) {
        if (entity.getCategory() != null && entity.getCategory().getId() != null) {
            entity.setCategory(categoryRepository.getReferenceById(entity.getCategory().getId()));
        }
        if (entity.getLocation() != null && entity.getLocation().getId() != null) {
            entity.setLocation(locationRepository.getReferenceById(entity.getLocation().getId()));
        }
    }
}
