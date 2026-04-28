package com.example.fabritrack.repository;

import com.example.fabritrack.entity.TechnicianTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TechnicianTaskRepository extends JpaRepository<TechnicianTask, Long> {

    List<TechnicianTask> findByAssignedTo_Id(UUID assignedToId);

    List<TechnicianTask> findByLocation_Id(Long locationId);

    @Query("""
        SELECT new com.example.fabritrack.dto.TechnicianTaskLeaderboardEntry(
            u.id, u.firstName, u.lastName, u.email, COUNT(t))
        FROM TechnicianTask t
        JOIN t.assignedTo u
        WHERE t.status = :doneStatus
          AND t.completedAt >= COALESCE(:fromTs, t.completedAt)
          AND t.completedAt <= COALESCE(:toTs, t.completedAt)
        GROUP BY u.id, u.firstName, u.lastName, u.email
        ORDER BY COUNT(t) DESC
        """)
    List<com.example.fabritrack.dto.TechnicianTaskLeaderboardEntry> leaderboardCompleted(
            @Param("doneStatus") TechnicianTask.TaskStatus doneStatus,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs);
}
