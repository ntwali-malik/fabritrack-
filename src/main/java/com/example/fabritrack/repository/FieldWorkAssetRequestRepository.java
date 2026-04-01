package com.example.fabritrack.repository;

import com.example.fabritrack.entity.FieldWorkAssetRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FieldWorkAssetRequestRepository extends JpaRepository<FieldWorkAssetRequest, Long> {

    @Override
    @EntityGraph(attributePaths = {"technician", "items", "items.asset"})
    List<FieldWorkAssetRequest> findAll();

    @EntityGraph(attributePaths = {"technician", "items", "items.asset"})
    Optional<FieldWorkAssetRequest> findById(Long id);
}
