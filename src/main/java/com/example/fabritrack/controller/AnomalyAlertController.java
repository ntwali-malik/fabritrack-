package com.example.fabritrack.controller;

import com.example.fabritrack.dto.AnomalyAlertResponse;
import com.example.fabritrack.entity.AnomalyAlert;
import com.example.fabritrack.service.AnomalyAlertService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * API for theft-risk and anomaly alerts (asset recovery, dashboards).
 * ADMIN and SECURITY can list and filter alerts.
 */
@RestController
@RequestMapping("/api/anomaly-alerts")
@CrossOrigin(origins = "*")
public class AnomalyAlertController {

    private final AnomalyAlertService anomalyAlertService;

    public AnomalyAlertController(AnomalyAlertService anomalyAlertService) {
        this.anomalyAlertService = anomalyAlertService;
    }

    /**
     * List anomaly alerts, newest first. Optional filters: assetId, severity.
     */
    @GetMapping
    public Page<AnomalyAlertResponse> findAll(
            @RequestParam(required = false) UUID assetId,
            @RequestParam(required = false) AnomalyAlert.Severity severity,
            @PageableDefault(size = 20) Pageable pageable) {
        return anomalyAlertService.findAll(assetId, severity, pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnomalyAlertResponse> findById(@PathVariable Long id) {
        return anomalyAlertService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
