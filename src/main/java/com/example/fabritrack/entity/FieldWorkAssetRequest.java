package com.example.fabritrack.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "field_work_asset_requests")
public class FieldWorkAssetRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(nullable = false)
    private LocalDate neededByDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<FieldWorkAssetRequestItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RequestStatus.PENDING;
        }
    }

    public enum RequestPriority {
        LOW, MEDIUM, HIGH, URGENT
    }

    public enum RequestStatus {
        PENDING, APPROVED, PARTIAL, REJECTED, FULFILLED
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getTechnician() {
        return technician;
    }

    public void setTechnician(User technician) {
        this.technician = technician;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDate getNeededByDate() {
        return neededByDate;
    }

    public void setNeededByDate(LocalDate neededByDate) {
        this.neededByDate = neededByDate;
    }

    public RequestPriority getPriority() {
        return priority;
    }

    public void setPriority(RequestPriority priority) {
        this.priority = priority;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public String getJustification() {
        return justification;
    }

    public void setJustification(String justification) {
        this.justification = justification;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<FieldWorkAssetRequestItem> getItems() {
        return items;
    }

    public void setItems(List<FieldWorkAssetRequestItem> items) {
        this.items = items;
    }
}
