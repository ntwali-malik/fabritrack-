package com.example.fabritrack.repository;

import com.example.fabritrack.entity.DepreciationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepreciationRecordRepository extends JpaRepository<DepreciationRecord, Long> {

    /** Latest depreciation record for an asset (by year descending). Used for current value and next-year calculation. */
    Optional<DepreciationRecord> findTopByAsset_IdOrderByYearDesc(UUID assetId);
}
