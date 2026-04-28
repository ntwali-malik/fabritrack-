package com.example.fabritrack.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import java.time.LocalDateTime;

/**
 * Captures post-installation feedback from a user for a specific {@link Location}.
 * Used to record satisfaction and qualitative notes about the installation work.
 */
@Entity
@Table(name = "location_installation_feedback")
public class LocationInstallationFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Narrative feedback on the installation (quality, issues, follow-up needs, etc.). */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedbackText;

    /** When the feedback was submitted; set automatically on create. */
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    /** Structured satisfaction indicator; optional if only free-text feedback is provided. */
    @Enumerated(EnumType.STRING)
    @Column(name = "satisfaction_level")
    private SatisfactionLevel satisfactionLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_user_id", nullable = false)
    @NotFound(action = NotFoundAction.IGNORE)
    private User submittedBy;

    public enum SatisfactionLevel {
        VERY_SATISFIED,
        SATISFIED,
        NEUTRAL,
        DISSATISFIED,
        VERY_DISSATISFIED
    }

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public SatisfactionLevel getSatisfactionLevel() { return satisfactionLevel; }
    public void setSatisfactionLevel(SatisfactionLevel satisfactionLevel) { this.satisfactionLevel = satisfactionLevel; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }
}
