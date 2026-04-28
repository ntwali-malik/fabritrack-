package com.example.fabritrack.controller;

import com.example.fabritrack.dto.TechnicianTaskLeaderboardEntry;
import com.example.fabritrack.dto.TechnicianTaskStatusPatch;
import com.example.fabritrack.entity.TechnicianTask;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.TechnicianTaskService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Location-scoped technician tasks and completion leaderboard.
 */
@RestController
@RequestMapping("/api/technician-tasks")
@CrossOrigin(origins = "*")
public class TechnicianTaskController {

    private final TechnicianTaskService taskService;
    private final AuditLogService auditLogService;

    public TechnicianTaskController(TechnicianTaskService taskService, AuditLogService auditLogService) {
        this.taskService = taskService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/leaderboard")
    public List<TechnicianTaskLeaderboardEntry> leaderboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return taskService.leaderboard(from, to);
    }

    @GetMapping
    public List<TechnicianTask> list(
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) UUID assignedToId,
            @RequestParam(required = false) TechnicianTask.TaskStatus status) {
        UUID actorId = requireUserId();
        return taskService.list(actorId, locationId, assignedToId, status);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicianTask> getById(@PathVariable Long id) {
        UUID actorId = requireUserId();
        return ResponseEntity.ok(taskService.getById(id, actorId));
    }

    @PostMapping
    public ResponseEntity<TechnicianTask> create(@RequestBody TechnicianTask body) {
        UUID actorId = requireUserId();
        TechnicianTask saved = taskService.create(body, actorId);
        auditLogService.log(
                "TechnicianTask",
                saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Task created: " + saved.getTitle(),
                null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechnicianTask> update(@PathVariable Long id, @RequestBody TechnicianTask body) {
        UUID actorId = requireUserId();
        TechnicianTask saved = taskService.update(id, body, actorId);
        auditLogService.log(
                "TechnicianTask",
                saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                "Task updated: " + saved.getTitle(),
                null);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TechnicianTask> patchStatus(@PathVariable Long id, @RequestBody TechnicianTaskStatusPatch patch) {
        UUID actorId = requireUserId();
        TechnicianTask saved = taskService.patchStatus(id, patch.status(), actorId);
        auditLogService.log(
                "TechnicianTask",
                saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                "Task status → " + saved.getStatus(),
                null);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        UUID actorId = requireUserId();
        taskService.delete(id, actorId);
        auditLogService.log(
                "TechnicianTask",
                id.toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                "Task deleted",
                null);
        return ResponseEntity.noContent().build();
    }

    private UUID requireUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }
        try {
            return UUID.fromString(auth.getPrincipal().toString());
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid principal.");
        }
    }
}
