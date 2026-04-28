package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AssetReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AssetReservationRepository extends JpaRepository<AssetReservation, Long> {

    /** Remove all reservation rows for an asset before deleting it. */
    void deleteByAsset_Id(UUID assetId);
}
