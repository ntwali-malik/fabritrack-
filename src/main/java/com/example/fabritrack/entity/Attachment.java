package com.example.fabritrack.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    /** File bytes – declare before contentLength so Hibernate binds in correct order (bytea before bigint). */
    @Lob
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(columnDefinition = "BYTEA")
    @JsonIgnore
    private byte[] content;

    /** MIME type (e.g. application/pdf, image/png). */
    private String contentType;

    /** File size in bytes. */
    private Long contentLength;

    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getContentLength() { return contentLength; }
    public void setContentLength(Long contentLength) { this.contentLength = contentLength; }

    public byte[] getContent() { return content; }
    public void setContent(byte[] content) { this.content = content; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public Asset getAsset() { return asset; }
    public void setAsset(Asset asset) { this.asset = asset; }
}
