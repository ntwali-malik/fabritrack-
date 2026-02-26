package com.example.fabritrack.dto;

import com.example.fabritrack.entity.DepreciationRecord;

import java.util.UUID;

/**
 * Request to create a depreciation record. Amount and remaining value are calculated by the service.
 */
public record CreateDepreciationRequest(
    UUID assetId,
    Integer year,
    DepreciationRecord.DepreciationMethod method
) {
    /** Default method is STRAIGHT_LINE if not provided. */
    public DepreciationRecord.DepreciationMethod method() {
        return method != null ? method : DepreciationRecord.DepreciationMethod.STRAIGHT_LINE;
    }
}
