package com.example.fabritrack.repository;

import com.example.fabritrack.entity.AssetReservation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetReservationRepository extends JpaRepository<AssetReservation, Long> {
}
