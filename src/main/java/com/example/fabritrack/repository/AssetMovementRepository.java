package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AssetMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AssetMovementRepository extends JpaRepository<AssetMovement, Long> {

    long countByAsset_IdAndMovedAtAfter(UUID assetId, LocalDateTime after);
}
