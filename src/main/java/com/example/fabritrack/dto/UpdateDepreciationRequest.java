package com.example.fabritrack.dto;

import com.example.fabritrack.entity.DepreciationRecord;

/**
 * Request to update a depreciation record. If year or method is provided, amount and remaining value are recalculated.
 */
public record UpdateDepreciationRequest(
    Integer year,
    DepreciationRecord.DepreciationMethod method
) {}
