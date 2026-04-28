package com.example.fabritrack.repository;

import com.example.fabritrack.entity.LocationInstallationFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationInstallationFeedbackRepository extends JpaRepository<LocationInstallationFeedback, Long> {

    List<LocationInstallationFeedback> findByLocation_IdOrderBySubmittedAtDesc(Long locationId);
}
