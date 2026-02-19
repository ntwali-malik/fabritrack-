package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AssetMovement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetMovementRepository extends JpaRepository<AssetMovement, Long> {
}
