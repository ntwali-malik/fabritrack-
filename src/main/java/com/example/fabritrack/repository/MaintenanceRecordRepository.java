package com.example.fabritrack.repository;

import com.example.fabritrack.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {

    /** Maintenance records scheduled on or before the given date that are not completed/cancelled. */
    List<MaintenanceRecord> findByScheduledDateLessThanEqualAndStatusIn(
            LocalDate date,
            List<MaintenanceRecord.MaintenanceStatus> statuses);
}
