package com.example.fabritrack.service;

import com.example.fabritrack.dto.AnomalyAlertResponse;
import com.example.fabritrack.entity.AnomalyAlert;
import com.example.fabritrack.repository.AnomalyAlertRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AnomalyAlertService {

    private final AnomalyAlertRepository repository;

    public AnomalyAlertService(AnomalyAlertRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<AnomalyAlertResponse> findAll(java.util.UUID assetId, AnomalyAlert.Severity severity, Pageable pageable) {
        Page<AnomalyAlert> page;
        if (assetId != null) {
            page = repository.findByAsset_IdOrderByCreatedAtDesc(assetId, pageable);
        } else if (severity != null) {
            page = repository.findBySeverityOrderByCreatedAtDesc(severity, pageable);
        } else {
            page = repository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Optional<AnomalyAlertResponse> findById(Long id) {
        return repository.findById(id).map(this::toResponse);
    }

    private AnomalyAlertResponse toResponse(AnomalyAlert a) {
        return new AnomalyAlertResponse(
                a.getId(),
                a.getReason(),
                a.getSeverity(),
                a.getCreatedAt(),
                a.getAsset() != null ? a.getAsset().getId() : null,
                a.getAsset() != null ? a.getAsset().getAssetTag() : null,
                a.getAsset() != null ? a.getAsset().getName() : null,
                a.getAssetValueAtAlert(),
                a.getMovement() != null ? a.getMovement().getFromLocationName() : null,
                a.getMovement() != null ? a.getMovement().getToLocationName() : null,
                a.getPerformedBy() != null ? a.getPerformedBy().getEmail() : null,
                a.getMovement() != null ? a.getMovement().getId() : null
        );
    }
}
