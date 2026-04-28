package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AssetMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AssetMovementRepository extends JpaRepository<AssetMovement, Long> {

    long countByAsset_IdAndMovedAtAfter(UUID assetId, LocalDateTime after);

    /** Latest known location transition for an asset (used for movement chain validation). */
    Optional<AssetMovement> findTopByAsset_IdOrderByMovedAtDescIdDesc(UUID assetId);

    /** Remove all movement history rows for an asset before deleting it. */
    void deleteByAsset_Id(UUID assetId);
}
