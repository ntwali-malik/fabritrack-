package com.example.fabritrack.repository;

import com.example.fabritrack.entity.DepreciationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepreciationRecordRepository extends JpaRepository<DepreciationRecord, Long> {
}
