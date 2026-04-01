package com.example.fabritrack.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(
        name = "field_work_asset_request_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_request_asset_unique", columnNames = {"request_id", "asset_id"})
        }
)
public class FieldWorkAssetRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonBackReference
    private FieldWorkAssetRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(nullable = false)
    private Integer quantityRequested;

    private Integer quantityApproved;
    private Integer quantityIssued;
    private Integer quantityReturned;

    private String requiredForTask;
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status;

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = ItemStatus.REQUESTED;
        }
    }

    public enum ItemStatus {
        REQUESTED, APPROVED, PARTIALLY_APPROVED, ISSUED, RETURNED, REJECTED
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FieldWorkAssetRequest getRequest() {
        return request;
    }

    public void setRequest(FieldWorkAssetRequest request) {
        this.request = request;
    }

    public Asset getAsset() {
        return asset;
    }

    public void setAsset(Asset asset) {
        this.asset = asset;
    }

    public Integer getQuantityRequested() {
        return quantityRequested;
    }

    public void setQuantityRequested(Integer quantityRequested) {
        this.quantityRequested = quantityRequested;
    }

    public Integer getQuantityApproved() {
        return quantityApproved;
    }

    public void setQuantityApproved(Integer quantityApproved) {
        this.quantityApproved = quantityApproved;
    }

    public Integer getQuantityIssued() {
        return quantityIssued;
    }

    public void setQuantityIssued(Integer quantityIssued) {
        this.quantityIssued = quantityIssued;
    }

    public Integer getQuantityReturned() {
        return quantityReturned;
    }

    public void setQuantityReturned(Integer quantityReturned) {
        this.quantityReturned = quantityReturned;
    }

    public String getRequiredForTask() {
        return requiredForTask;
    }

    public void setRequiredForTask(String requiredForTask) {
        this.requiredForTask = requiredForTask;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public ItemStatus getStatus() {
        return status;
    }

    public void setStatus(ItemStatus status) {
        this.status = status;
    }
}
