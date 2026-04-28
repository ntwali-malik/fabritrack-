package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AssetAssignment;
import com.example.fabritrack.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, Long> {

    /** True if the asset has any assignment with status different from the given one (e.g. status NOT RETURNED). */
    boolean existsByAsset_IdAndStatusNot(UUID assetId, AssetAssignment.AssignmentStatus status);

    /** True if the asset has another assignment (excluding the given id) with status different from the given one. */
    boolean existsByAsset_IdAndStatusNotAndIdNot(UUID assetId, AssetAssignment.AssignmentStatus status, Long id);

    /** Active assignments for an employee (for movement: move this person's assigned assets). */
    List<AssetAssignment> findByEmployee_IdAndStatusNot(Long employeeId, AssetAssignment.AssignmentStatus status);

    /** Active assignments for a user (current model: assign directly to users). */
    List<AssetAssignment> findByUser_IdAndStatusNot(UUID userId, AssetAssignment.AssignmentStatus status);

    /** Active assignments for a department (for movement: move this department's assigned assets). */
    List<AssetAssignment> findByAssigneeDepartmentAndStatusNot(Department assigneeDepartment, AssetAssignment.AssignmentStatus status);

    /** Remove all assignment rows for an asset before deleting it. */
    void deleteByAsset_Id(UUID assetId);
}
