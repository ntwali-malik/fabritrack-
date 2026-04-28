package com.example.fabritrack.service;

import com.example.fabritrack.dto.TechnicianTaskLeaderboardEntry;
import com.example.fabritrack.entity.Permission;
import com.example.fabritrack.entity.Role;
import com.example.fabritrack.entity.TechnicianTask;
import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.LocationRepository;
import com.example.fabritrack.repository.TechnicianTaskRepository;
import com.example.fabritrack.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class TechnicianTaskService {

    private final TechnicianTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final RolePermissionService rolePermissionService;

    public TechnicianTaskService(TechnicianTaskRepository taskRepository,
                                 UserRepository userRepository,
                                 LocationRepository locationRepository,
                                 RolePermissionService rolePermissionService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.rolePermissionService = rolePermissionService;
    }

    public boolean canManageTasks(User actor) {
        return actor != null && rolePermissionService.hasPermission(actor.getRole(), Permission.FIELD_TASK_MANAGE);
    }

    public List<TechnicianTask> list(
            UUID actorId,
            Long locationId,
            UUID assignedToId,
            TechnicianTask.TaskStatus status) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found."));
        List<TechnicianTask> base;
        if (canManageTasks(actor)) {
            base = taskRepository.findAll();
        } else {
            base = taskRepository.findByAssignedTo_Id(actorId);
        }
        return base.stream()
                .filter(t -> locationId == null || (t.getLocation() != null && locationId.equals(t.getLocation().getId())))
                .filter(t -> assignedToId == null || (t.getAssignedTo() != null && assignedToId.equals(t.getAssignedTo().getId())))
                .filter(t -> status == null || status.equals(t.getStatus()))
                .sorted(Comparator
                        .comparingInt(TechnicianTask::priorityRank)
                        .thenComparing(TechnicianTask::getDueAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(TechnicianTask::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public TechnicianTask getById(Long id, UUID actorId) {
        TechnicianTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found."));
        if (!canViewTask(task, actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view this task.");
        }
        return task;
    }

    public TechnicianTask create(TechnicianTask input, UUID actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found."));
        if (!canManageTasks(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to create tasks.");
        }
        if (input.getTitle() == null || input.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required.");
        }
        resolveAndValidate(input, true);
        input.setCreatedBy(actor);
        if (input.getStatus() == null) {
            input.setStatus(TechnicianTask.TaskStatus.PENDING);
        }
        if (input.getPriority() == null) {
            input.setPriority(TechnicianTask.TaskPriority.MEDIUM);
        }
        applyStatusTimestamps(input);
        return taskRepository.save(input);
    }

    public TechnicianTask update(Long id, TechnicianTask input, UUID actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found."));
        if (!canManageTasks(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to update tasks.");
        }
        TechnicianTask existing = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
        if (input.getTitle() == null || input.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required.");
        }
        existing.setTitle(input.getTitle().trim());
        existing.setDescription(input.getDescription());
        existing.setLocation(input.getLocation());
        existing.setAssignedTo(input.getAssignedTo());
        existing.setPriority(input.getPriority() != null ? input.getPriority() : TechnicianTask.TaskPriority.MEDIUM);
        existing.setDueAt(input.getDueAt());
        existing.setStatus(input.getStatus() != null ? input.getStatus() : TechnicianTask.TaskStatus.PENDING);
        resolveAndValidate(existing, false);
        applyStatusTimestamps(existing);
        return taskRepository.save(existing);
    }

    public TechnicianTask patchStatus(Long id, TechnicianTask.TaskStatus newStatus, UUID actorId) {
        if (newStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required.");
        }
        TechnicianTask task = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found."));
        boolean manage = canManageTasks(actor);
        boolean assignee = task.getAssignedTo() != null && actorId.equals(task.getAssignedTo().getId());
        if (!manage && !assignee) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to update this task.");
        }
        task.setStatus(newStatus);
        applyStatusTimestamps(task);
        return taskRepository.save(task);
    }

    public void delete(Long id, UUID actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User not found."));
        if (!canManageTasks(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to delete tasks.");
        }
        if (!taskRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found.");
        }
        taskRepository.deleteById(id);
    }

    public List<TechnicianTaskLeaderboardEntry> leaderboard(LocalDateTime from, LocalDateTime to) {
        return taskRepository.leaderboardCompleted(TechnicianTask.TaskStatus.DONE, from, to);
    }

    private boolean canViewTask(TechnicianTask task, User actor) {
        if (canManageTasks(actor)) {
            return true;
        }
        return task.getAssignedTo() != null && actor.getId().equals(task.getAssignedTo().getId());
    }

    private void resolveAndValidate(TechnicianTask entity, boolean forCreate) {
        if (entity.getLocation() == null || entity.getLocation().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location is required.");
        }
        entity.setLocation(locationRepository.getReferenceById(entity.getLocation().getId()));
        if (entity.getAssignedTo() == null || entity.getAssignedTo().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned technician is required.");
        }
        User assignee = userRepository.findById(entity.getAssignedTo().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned user not found."));
        if (assignee.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tasks may only be assigned to users with TECHNICIAN role.");
        }
        entity.setAssignedTo(assignee);
        if (forCreate && entity.getCreatedBy() != null && entity.getCreatedBy().getId() != null) {
            entity.setCreatedBy(userRepository.getReferenceById(entity.getCreatedBy().getId()));
        }
    }

    private static void applyStatusTimestamps(TechnicianTask task) {
        if (task.getStatus() == TechnicianTask.TaskStatus.DONE) {
            if (task.getCompletedAt() == null) {
                task.setCompletedAt(LocalDateTime.now());
            }
        } else {
            task.setCompletedAt(null);
        }
    }
}
