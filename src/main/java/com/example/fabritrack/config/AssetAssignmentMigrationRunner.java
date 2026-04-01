package com.example.fabritrack.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time migration: allow null in asset_assignments.user_id now that
 * assignment is by employee or department only.
 */
@Component
@Order(1)
public class AssetAssignmentMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public AssetAssignmentMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE asset_assignments ALTER COLUMN user_id DROP NOT NULL");
        } catch (Exception e) {
            // Column may already be nullable or not exist; ignore
        }
    }
}
