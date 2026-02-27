package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AnomalyAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnomalyAlertRepository extends JpaRepository<AnomalyAlert, Long> {

    Page<AnomalyAlert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AnomalyAlert> findByAsset_IdOrderByCreatedAtDesc(java.util.UUID assetId, Pageable pageable);

    Page<AnomalyAlert> findBySeverityOrderByCreatedAtDesc(AnomalyAlert.Severity severity, Pageable pageable);
}
