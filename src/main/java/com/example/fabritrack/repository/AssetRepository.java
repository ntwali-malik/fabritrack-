package com.example.fabritrack.repository;

import com.example.fabritrack.entity.Asset;
import com.example.fabritrack.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    /** Assets whose warranty expires on or before the given date (e.g. within next N days). */
    List<Asset> findByWarrantyExpiryDateBetween(LocalDate from, LocalDate to);

    List<Asset> findByWarrantyExpiryDateBefore(LocalDate date);

    /** Used to compute the next asset tag sequence for a department (e.g. IT-001, IT-002). */
    Optional<Asset> findTopByDepartmentOrderByAssetTagDesc(Department department);

}
