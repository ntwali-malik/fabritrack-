package com.example.fabritrack.repository;

import com.example.fabritrack.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}
