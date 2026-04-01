package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Attachment;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AttachmentRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
@CrossOrigin(origins = "*")
public class AttachmentController {

    private final AttachmentRepository repository;
    private final AssetRepository assetRepository;
    private final AuditLogService auditLogService;

    public AttachmentController(AttachmentRepository repository, AssetRepository assetRepository,
                                AuditLogService auditLogService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Attachment> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Attachment> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Download file content. Returns the stored bytes with Content-Type and Content-Disposition.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        return repository.findById(id)
                .map(att -> {
                    byte[] content = att.getContent();
                    if (content == null || content.length == 0) {
                        return ResponseEntity.notFound().<byte[]>build();
                    }
                    String contentType = att.getContentType() != null && !att.getContentType().isBlank()
                            ? att.getContentType()
                            : MediaType.APPLICATION_OCTET_STREAM_VALUE;
                    String fileName = att.getFileName() != null ? att.getFileName() : "attachment";
                    String encodedFileName = encodeFileName(fileName);
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(contentType));
                    headers.setContentLength(content.length);
                    headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"");
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(content);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create attachment by uploading a file. Required: file, assetId. Optional: fileName (defaults to original filename).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Attachment> create(
            @RequestParam("file") MultipartFile file,
            @RequestParam("assetId") UUID assetId,
            @RequestParam(value = "fileName", required = false) String fileName) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String name = (fileName != null && !fileName.isBlank()) ? fileName.trim() : file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            name = "attachment";
        }
        Attachment entity = new Attachment();
        entity.setFileName(name);
        entity.setContentType(file.getContentType());
        entity.setContentLength(file.getSize());
        try {
            entity.setContent(file.getBytes());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        entity.setAsset(assetRepository.getReferenceById(assetId));
        Attachment saved = repository.save(entity);
        auditLogService.log("Attachment", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Attachment: " + saved.getFileName(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Update attachment. Can replace file and/or metadata. All parts optional except id.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "fileName", required = false) String fileName,
            @RequestParam(value = "assetId", required = false) UUID assetId) {
        return repository.findById(id)
                .map(existing -> {
                    if (fileName != null && !fileName.isBlank()) {
                        existing.setFileName(fileName.trim());
                    }
                    if (assetId != null) {
                        existing.setAsset(assetRepository.getReferenceById(assetId));
                    }
                    if (file != null && !file.isEmpty()) {
                        existing.setContentType(file.getContentType());
                        existing.setContentLength(file.getSize());
                        try {
                            existing.setContent(file.getBytes());
                        } catch (Exception ex) {
                            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                        }
                    }
                    Attachment saved = repository.save(existing);
                    auditLogService.log("Attachment", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE, "Attachment updated", null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.findById(id).ifPresent(a ->
                auditLogService.log("Attachment", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Attachment deleted: " + (a.getFileName() != null ? a.getFileName() : ""), null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static String encodeFileName(String fileName) {
        try {
            return URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()).replace("+", "%20");
        } catch (UnsupportedEncodingException e) {
            return fileName;
        }
    }
}
