package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetReservation;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AssetReservationRepository;
import com.example.fabritrack.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/asset-reservations")
public class AssetReservationController {

    private final AssetReservationRepository repository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    public AssetReservationController(AssetReservationRepository repository,
                                      AssetRepository assetRepository,
                                      UserRepository userRepository) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<AssetReservation> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetReservation> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AssetReservation> create(@RequestBody AssetReservation entity) {
        resolveRelations(entity);
        AssetReservation saved = repository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetReservation> update(@PathVariable Long id, @RequestBody AssetReservation entity) {
        return repository.findById(id)
                .map(existing -> {
                    entity.setId(id);
                    resolveRelations(entity);
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

    private void resolveRelations(AssetReservation entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        if (entity.getUser() != null && entity.getUser().getId() != null) {
            entity.setUser(userRepository.getReferenceById(entity.getUser().getId()));
        }
    }
}
