package com.example.fabritrack.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "depreciation_records")
public class DepreciationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    private DepreciationMethod method;

    private BigDecimal depreciationAmount;
    private BigDecimal remainingValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    public enum DepreciationMethod {
        STRAIGHT_LINE, DECLINING_BALANCE, UNITS_OF_PRODUCTION
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public DepreciationMethod getMethod() { return method; }
    public void setMethod(DepreciationMethod method) { this.method = method; }

    public BigDecimal getDepreciationAmount() { return depreciationAmount; }
    public void setDepreciationAmount(BigDecimal depreciationAmount) { this.depreciationAmount = depreciationAmount; }

    public BigDecimal getRemainingValue() { return remainingValue; }
    public void setRemainingValue(BigDecimal remainingValue) { this.remainingValue = remainingValue; }

    public Asset getAsset() { return asset; }
    public void setAsset(Asset asset) { this.asset = asset; }
}
