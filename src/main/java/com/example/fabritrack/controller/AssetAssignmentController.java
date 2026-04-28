package com.example.fabritrack.controller;

import com.example.fabritrack.entity.AssetAssignment;
import com.example.fabritrack.entity.Department;
import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.AssetRepository;
import com.example.fabritrack.repository.AssetAssignmentRepository;
import com.example.fabritrack.repository.EmployeeRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.example.fabritrack.entity.AssetAssignment.AssignmentStatus.RETURNED;

@RestController
@RequestMapping("/api/asset-assignments")
@CrossOrigin(origins = "*")
public class AssetAssignmentController {

    private final AssetAssignmentRepository repository;
    private final AssetRepository assetRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AssetAssignmentController(AssetAssignmentRepository repository,
                                     AssetRepository assetRepository,
                                     EmployeeRepository employeeRepository,
                                     UserRepository userRepository,
                                     NotificationService notificationService,
                                     AuditLogService auditLogService) {
        this.repository = repository;
        this.assetRepository = assetRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AssetAssignment> findAll() {
        return repository.findAll();
    }

    /** Get currently assigned assets for movement: by employee or by department (status != RETURNED). */
    @GetMapping("/assigned-assets")
    public ResponseEntity<?> getAssignedAssetsForMovement(
            @RequestParam(required = false) java.util.UUID userId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Department assigneeDepartment) {
        if ((userId != null && employeeId != null)
                || ((userId != null || employeeId != null) && assigneeDepartment != null)) {
            return ResponseEntity.badRequest()
                    .body("Provide exactly one: userId, employeeId, or assigneeDepartment.");
        }
        if (userId == null && employeeId == null && assigneeDepartment == null) {
            return ResponseEntity.badRequest()
                    .body("Provide either userId, employeeId, or assigneeDepartment.");
        }
        List<AssetAssignment> list = userId != null
                ? repository.findByUser_IdAndStatusNot(userId, RETURNED)
                : employeeId != null
                ? repository.findByEmployee_IdAndStatusNot(employeeId, RETURNED)
                : repository.findByAssigneeDepartmentAndStatusNot(assigneeDepartment, RETURNED);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetAssignment> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AssetAssignment entity) {
        ResponseEntity<String> relationError = resolveRelations(entity);
        if (relationError != null) return relationError;
        if (!hasValidAssignee(entity)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Specify exactly one: assign to User or to Department. Send user: { id } or assigneeDepartment: \"DEPARTMENT_NAME\".");
        }
        if (entity.getAsset() != null && entity.getAsset().getId() != null
                && repository.existsByAsset_IdAndStatusNot(entity.getAsset().getId(), RETURNED)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This asset is already assigned and has not been returned. Return it first before assigning to someone else.");
        }
        AssetAssignment saved = repository.save(entity);
        String assigneeDesc = describeAssignee(saved);
        auditLogService.log("AssetAssignment", saved.getId().toString(),
                com.example.fabritrack.entity.AuditLog.AuditAction.ASSIGN,
                saved.getAsset() != null ? "Assigned asset " + saved.getAsset().getName() + " to " + assigneeDesc : "Asset assigned", null);
        User notifyUser = getNotifyUser(saved);
        if (notifyUser != null) {
            notificationService.notifyUser(
                    notifyUser,
                    com.example.fabritrack.entity.Notification.NotificationType.ASSIGNMENT,
                    "Asset assigned",
                    String.format("Asset \"%s\" has been assigned to you (assigned date: %s).",
                            saved.getAsset() != null ? saved.getAsset().getName() : "—",
                            saved.getAssignedDate()));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AssetAssignment entity) {
        return repository.findById(id)
                .map(existing -> {
                    ResponseEntity<String> relationError = resolveRelations(entity);
                    if (relationError != null) return relationError;
                    if (!hasValidAssignee(entity)) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Specify exactly one: assign to User or to Department.");
                    }
                    if (entity.getAsset() != null && entity.getAsset().getId() != null
                            && repository.existsByAsset_IdAndStatusNotAndIdNot(entity.getAsset().getId(), RETURNED, id)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("This asset is already assigned to another person and has not been returned.");
                    }
                    entity.setId(id);
                    AssetAssignment saved = repository.save(entity);
                    com.example.fabritrack.entity.AuditLog.AuditAction action = saved.getStatus() == com.example.fabritrack.entity.AssetAssignment.AssignmentStatus.RETURNED
                            ? com.example.fabritrack.entity.AuditLog.AuditAction.RETURN : com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE;
                    auditLogService.log("AssetAssignment", saved.getId().toString(), action,
                            "Updated assignment" + (saved.getStatus() != null ? " (status: " + saved.getStatus() + ")" : ""), null);
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
                auditLogService.log("AssetAssignment", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Assignment removed", null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<String> resolveRelations(AssetAssignment entity) {
        if (entity.getAsset() != null && entity.getAsset().getId() != null) {
            entity.setAsset(assetRepository.getReferenceById(entity.getAsset().getId()));
        }
        if (entity.getUser() != null && entity.getUser().getId() != null) {
            entity.setUser(userRepository.getReferenceById(entity.getUser().getId()));
            // If user is explicitly provided, user assignment is authoritative.
            entity.setEmployee(null);
        }
        if (entity.getEmployee() != null && entity.getEmployee().getId() != null) {
            entity.setEmployee(employeeRepository.getReferenceById(entity.getEmployee().getId()));
        }
        // assigneeDepartment is enum, set from request body as-is
        return null;
    }

    /** Exactly one of: user / employee (legacy) / assigneeDepartment. */
    private boolean hasValidAssignee(AssetAssignment entity) {
        boolean hasUser = entity.getUser() != null && entity.getUser().getId() != null;
        boolean hasEmployee = entity.getEmployee() != null && entity.getEmployee().getId() != null;
        boolean hasDepartment = entity.getAssigneeDepartment() != null;
        int count = (hasUser ? 1 : 0) + (hasEmployee ? 1 : 0) + (hasDepartment ? 1 : 0);
        return count == 1;
    }

    private String describeAssignee(AssetAssignment a) {
        if (a.getUser() != null) {
            String name = (a.getUser().getFirstName() != null ? a.getUser().getFirstName() + " " : "")
                    + (a.getUser().getLastName() != null ? a.getUser().getLastName() : "");
            return name.isEmpty() ? "user " + a.getUser().getId() : name;
        }
        if (a.getEmployee() != null) {
            String name = (a.getEmployee().getFirstName() != null ? a.getEmployee().getFirstName() + " " : "") + (a.getEmployee().getLastName() != null ? a.getEmployee().getLastName() : "");
            return name.isEmpty() ? "employee " + a.getEmployee().getId() : name;
        }
        if (a.getAssigneeDepartment() != null) return "department " + a.getAssigneeDepartment().name();
        return "—";
    }

    /** User to notify: employee's linked user when assigning to personnel. */
    private User getNotifyUser(AssetAssignment a) {
        if (a.getUser() != null) return a.getUser();
        if (a.getEmployee() != null && a.getEmployee().getUser() != null) return a.getEmployee().getUser();
        return null;
    }
}
