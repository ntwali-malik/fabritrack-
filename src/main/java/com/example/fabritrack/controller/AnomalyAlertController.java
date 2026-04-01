package com.example.fabritrack.controller;

import com.example.fabritrack.dto.AnomalyAlertResponse;
import com.example.fabritrack.entity.AnomalyAlert;
import com.example.fabritrack.service.AnomalyAlertService;
import com.example.fabritrack.service.AnomalyDetectionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
    private final AnomalyDetectionService anomalyDetectionService;

    public AnomalyAlertController(AnomalyAlertService anomalyAlertService,
                                  AnomalyDetectionService anomalyDetectionService) {
        this.anomalyAlertService = anomalyAlertService;
        this.anomalyDetectionService = anomalyDetectionService;
    }

    /**
     * Create one demo/sample alert for presentation. Use when the list is empty to show the feature.
     * Requires at least one asset in the system. Returns 201 with the created alert or 400 if no data.
     */
    @PostMapping("/demo")
    public ResponseEntity<AnomalyAlertResponse> createDemoAlert() {
        AnomalyAlert created = anomalyDetectionService.createDemoAlert();
        if (created == null) {
            return ResponseEntity.badRequest().build();
        }
        return anomalyAlertService.findById(created.getId())
                .map(r -> ResponseEntity.status(HttpStatus.CREATED).body(r))
                .orElse(ResponseEntity.status(HttpStatus.CREATED).build());
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
