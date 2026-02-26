package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetReservation;
import com.example.fabritrack.entity.Notification;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AssetReservationRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-reservations")
public class AssetReservationController {

    private final AssetReservationRepository repository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public AssetReservationController(AssetReservationRepository repository,
                                      AssetRepository assetRepository,
                                      UserRepository userRepository,
                                      NotificationService notificationService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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
        String assetName = (saved.getAsset() != null) ? saved.getAsset().getName() : "-";
        String message = String.format(
                "Your reservation for \"%s\" from %s to %s has been created. Status: %s.",
                assetName,
                saved.getStartDate(),
                saved.getEndDate(),
                saved.getStatus());
        notificationService.notifyUser(
                saved.getUser(),
                Notification.NotificationType.RESERVATION,
                "Reservation created",
                message);
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
