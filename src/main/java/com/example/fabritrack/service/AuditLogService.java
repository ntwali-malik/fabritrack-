package com.example.fabritrack.service;

import com.example.fabritrack.entity.AuditLog;
import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.AuditLogRepository;
import com.example.fabritrack.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Records audit events when operations occur in the system.
 * Use this from controllers after create/update/delete/assign/move/login etc.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Record an audit event. If user is null, the current authenticated user (from JWT) is used when available.
     *
     * @param entityName e.g. "Asset", "User", "AssetAssignment"
     * @param entityId   id of the affected entity (toString)
     * @param action     CREATE, UPDATE, DELETE, ASSIGN, RETURN, MOVE, LOGIN, LOGOUT
     * @param details    optional description
     * @param user       user who performed the action, or null to use current user
     */
    @Transactional
    public void log(String entityName, String entityId, AuditLog.AuditAction action, String details, User user) {
        User actor = user != null ? user : getCurrentUser();
        AuditLog log = new AuditLog();
        log.setEntityName(entityName != null ? entityName : "Unknown");
        log.setEntityId(entityId != null ? entityId : "");
        log.setAction(action);
        log.setDetails(details);
        log.setUser(actor);
        auditLogRepository.save(log);
    }

    /** Convenience: log with current user. */
    public void log(String entityName, String entityId, AuditLog.AuditAction action, String details) {
        log(entityName, entityId, action, details, null);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return null;
        }
        try {
            UUID userId = UUID.fromString(auth.getPrincipal().toString());
            return userRepository.findById(userId).orElse(null);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
