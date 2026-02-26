package com.example.fabritrack.service;

import com.example.fabritrack.entity.Asset;
import com.example.fabritrack.entity.DepreciationRecord;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.DepreciationRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.UUID;

/**
 * Calculates and persists depreciation. Current value is derived from
 * depreciation (or purchase cost); amounts are computed, not entered manually.
 */
@Service
public class DepreciationService {

    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final AssetRepository assetRepository;
    private final DepreciationRecordRepository depreciationRecordRepository;

    public DepreciationService(AssetRepository assetRepository,
                               DepreciationRecordRepository depreciationRecordRepository) {
        this.assetRepository = assetRepository;
        this.depreciationRecordRepository = depreciationRecordRepository;
    }

    /**
     * Current value for an asset: latest depreciation remaining value, or purchase cost if no depreciation yet.
     */
    public BigDecimal getCurrentValue(Asset asset) {
        if (asset == null) return null;
        Optional<DepreciationRecord> latest = depreciationRecordRepository.findTopByAsset_IdOrderByYearDesc(asset.getId());
        if (latest.isPresent()) {
            return latest.get().getRemainingValue();
        }
        return asset.getPurchaseCost();
    }

    /**
     * Create a depreciation record for the given asset and year. Amount and remaining value are calculated.
     * Updates asset.currentValue to the new remaining value.
     *
     * @param assetId asset id
     * @param year    fiscal year for the record
     * @param method  depreciation method (default STRAIGHT_LINE)
     * @return the saved record
     * @throws IllegalArgumentException if asset not found or missing required depreciation fields
     */
    @Transactional
    public DepreciationRecord createRecord(UUID assetId, Integer year, DepreciationRecord.DepreciationMethod method) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetId));
        if (year == null) {
            throw new IllegalArgumentException("Year is required");
        }
        DepreciationRecord.DepreciationMethod m = method != null ? method : DepreciationRecord.DepreciationMethod.STRAIGHT_LINE;

        BigDecimal depreciationAmount;
        BigDecimal remainingValue;

        if (m == DepreciationRecord.DepreciationMethod.STRAIGHT_LINE) {
            var result = computeStraightLine(asset, year);
            depreciationAmount = result.depreciationAmount();
            remainingValue = result.remainingValue();
        } else if (m == DepreciationRecord.DepreciationMethod.DECLINING_BALANCE) {
            var result = computeDecliningBalance(asset, year);
            depreciationAmount = result.depreciationAmount();
            remainingValue = result.remainingValue();
        } else {
            throw new IllegalArgumentException("Unsupported method: " + m + ". Use STRAIGHT_LINE or DECLINING_BALANCE.");
        }

        DepreciationRecord record = new DepreciationRecord();
        record.setAsset(asset);
        record.setYear(year);
        record.setMethod(m);
        record.setDepreciationAmount(depreciationAmount);
        record.setRemainingValue(remainingValue);

        DepreciationRecord saved = depreciationRecordRepository.save(record);
        asset.setCurrentValue(remainingValue);
        assetRepository.save(asset);
        return saved;
    }

    /**
     * Recalculate amount and remaining value for an existing record and update asset current value.
     */
    @Transactional
    public DepreciationRecord updateRecord(Long recordId, Integer year, DepreciationRecord.DepreciationMethod method) {
        DepreciationRecord existing = depreciationRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Depreciation record not found: " + recordId));
        Asset asset = existing.getAsset();
        if (asset == null) {
            throw new IllegalArgumentException("Depreciation record has no asset");
        }
        int y = year != null ? year : existing.getYear();
        DepreciationRecord.DepreciationMethod m = method != null ? method : existing.getMethod();

        BigDecimal depreciationAmount;
        BigDecimal remainingValue;
        if (m == DepreciationRecord.DepreciationMethod.STRAIGHT_LINE) {
            var result = computeStraightLine(asset, y);
            depreciationAmount = result.depreciationAmount();
            remainingValue = result.remainingValue();
        } else if (m == DepreciationRecord.DepreciationMethod.DECLINING_BALANCE) {
            var result = computeDecliningBalance(asset, y);
            depreciationAmount = result.depreciationAmount();
            remainingValue = result.remainingValue();
        } else {
            throw new IllegalArgumentException("Unsupported method: " + m);
        }

        existing.setYear(y);
        existing.setMethod(m);
        existing.setDepreciationAmount(depreciationAmount);
        existing.setRemainingValue(remainingValue);
        DepreciationRecord saved = depreciationRecordRepository.save(existing);
        asset.setCurrentValue(remainingValue);
        assetRepository.save(asset);
        return saved;
    }

    private record DepreciationResult(BigDecimal depreciationAmount, BigDecimal remainingValue) {}

    private DepreciationResult computeStraightLine(Asset asset, int recordYear) {
        BigDecimal cost = asset.getPurchaseCost();
        if (cost == null) {
            throw new IllegalArgumentException("Asset must have purchase cost for depreciation");
        }
        Integer usefulLife = asset.getUsefulLifeYears();
        if (usefulLife == null || usefulLife <= 0) {
            throw new IllegalArgumentException("Asset must have useful life (years) for depreciation");
        }
        BigDecimal salvage = nullToZero(asset.getSalvageValue());
        int purchaseYear = asset.getPurchaseDate() != null ? asset.getPurchaseDate().getYear() : recordYear;
        int yearsSincePurchase = recordYear - purchaseYear;
        if (yearsSincePurchase < 0) {
            throw new IllegalArgumentException("Record year cannot be before purchase year");
        }

        BigDecimal depreciable = cost.subtract(salvage).setScale(SCALE, ROUNDING);
        BigDecimal annualDepreciation = depreciable.divide(BigDecimal.valueOf(usefulLife), SCALE, ROUNDING);
        BigDecimal accumulatedSoFar = annualDepreciation.multiply(BigDecimal.valueOf(yearsSincePurchase));
        BigDecimal bookValueAtStart = cost.subtract(accumulatedSoFar).setScale(SCALE, ROUNDING);

        BigDecimal depreciationThisYear = annualDepreciation;
        if (yearsSincePurchase >= usefulLife) {
            depreciationThisYear = BigDecimal.ZERO;
        } else if (yearsSincePurchase == usefulLife - 1) {
            depreciationThisYear = bookValueAtStart.subtract(salvage).max(BigDecimal.ZERO).setScale(SCALE, ROUNDING);
        }

        BigDecimal remainingValue = bookValueAtStart.subtract(depreciationThisYear).setScale(SCALE, ROUNDING);
        if (remainingValue.compareTo(salvage) < 0) {
            remainingValue = salvage;
        }
        return new DepreciationResult(depreciationThisYear, remainingValue);
    }

    private DepreciationResult computeDecliningBalance(Asset asset, int recordYear) {
        BigDecimal cost = asset.getPurchaseCost();
        if (cost == null) {
            throw new IllegalArgumentException("Asset must have purchase cost for depreciation");
        }
        Integer usefulLife = asset.getUsefulLifeYears();
        if (usefulLife == null || usefulLife <= 0) {
            throw new IllegalArgumentException("Asset must have useful life (years) for depreciation");
        }
        BigDecimal salvage = nullToZero(asset.getSalvageValue());
        int purchaseYear = asset.getPurchaseDate() != null ? asset.getPurchaseDate().getYear() : recordYear;
        int yearsSincePurchase = recordYear - purchaseYear;
        if (yearsSincePurchase < 0) {
            throw new IllegalArgumentException("Record year cannot be before purchase year");
        }

        double rate = 2.0 / usefulLife;
        BigDecimal bookValue = cost;
        for (int i = 0; i < yearsSincePurchase; i++) {
            BigDecimal dep = bookValue.multiply(BigDecimal.valueOf(rate)).setScale(SCALE, ROUNDING);
            bookValue = bookValue.subtract(dep).setScale(SCALE, ROUNDING);
            if (bookValue.compareTo(salvage) < 0) {
                bookValue = salvage;
                break;
            }
        }
        BigDecimal depreciationThisYear = bookValue.multiply(BigDecimal.valueOf(rate)).setScale(SCALE, ROUNDING);
        BigDecimal remainingValue = bookValue.subtract(depreciationThisYear).setScale(SCALE, ROUNDING);
        if (remainingValue.compareTo(salvage) < 0) {
            depreciationThisYear = bookValue.subtract(salvage).setScale(SCALE, ROUNDING);
            remainingValue = salvage;
        }
        return new DepreciationResult(depreciationThisYear, remainingValue);
    }

    /**
     * Delete a depreciation record and update the asset's current value to the previous remaining value (or purchase cost).
     */
    @Transactional
    public void deleteRecord(Long recordId) {
        DepreciationRecord record = depreciationRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Depreciation record not found: " + recordId));
        Asset asset = record.getAsset();
        depreciationRecordRepository.delete(record);
        if (asset != null) {
            BigDecimal newCurrent = getCurrentValue(asset);
            asset.setCurrentValue(newCurrent);
            assetRepository.save(asset);
        }
    }

    private static BigDecimal nullToZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
