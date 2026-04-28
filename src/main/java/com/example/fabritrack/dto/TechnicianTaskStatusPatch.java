package com.example.fabritrack.dto;

import com.example.fabritrack.entity.TechnicianTask;

/**
 * Request body for PATCH .../status (technician progress updates).
 */
public record TechnicianTaskStatusPatch(TechnicianTask.TaskStatus status) {}
