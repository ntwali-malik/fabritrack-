package com.example.fabritrack.controller;

import com.example.fabritrack.entity.Employee;
import com.example.fabritrack.repository.EmployeeRepository;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.AuditLogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeRepository repository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public EmployeeController(EmployeeRepository repository, UserRepository userRepository, AuditLogService auditLogService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<Employee> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> findById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Employee entity) {
        resolveUser(entity);
        if (entity.getEmployeeNumber() == null || entity.getEmployeeNumber().isBlank()) {
            entity.setEmployeeNumber("EMP" + String.format("%05d", repository.getNextEmployeeSequence()));
        } else if (repository.existsByEmployeeNumber(entity.getEmployeeNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("An employee with this employee number already exists.");
        }
        if (entity.getStatus() == null) {
            entity.setStatus(Employee.EmployeeStatus.ACTIVE);
        }
        Employee saved = repository.save(entity);
        auditLogService.log("Employee", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Employee: " + (saved.getFirstName() != null ? saved.getFirstName() + " " + (saved.getLastName() != null ? saved.getLastName() : "") : saved.getEmployeeNumber()), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Employee entity) {
        return repository.findById(id)
                .map(existing -> {
                    resolveUser(entity);
                    if (entity.getEmployeeNumber() != null && !entity.getEmployeeNumber().isBlank()
                            && repository.existsByEmployeeNumberAndIdNot(entity.getEmployeeNumber(), id)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("An employee with this employee number already exists.");
                    }
                    entity.setId(id);
                    if (entity.getEmployeeNumber() == null || entity.getEmployeeNumber().isBlank()) {
                        entity.setEmployeeNumber(existing.getEmployeeNumber());
                    }
                    if (entity.getStatus() == null) entity.setStatus(existing.getStatus());
                    Employee saved = repository.save(entity);
                    auditLogService.log("Employee", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Employee: " + (saved.getFirstName() != null ? saved.getFirstName() + " " + (saved.getLastName() != null ? saved.getLastName() : "") : saved.getEmployeeNumber()), null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.findById(id).ifPresent(e ->
                auditLogService.log("Employee", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Employee deleted: " + (e.getEmployeeNumber() != null ? e.getEmployeeNumber() : ""), null));
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void resolveUser(Employee entity) {
        if (entity.getUser() != null && entity.getUser().getId() != null) {
            entity.setUser(userRepository.getReferenceById(entity.getUser().getId()));
        }
    }
}
