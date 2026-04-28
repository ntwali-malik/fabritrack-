package com.example.fabritrack.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Removes deprecated location relation from assets table if it still exists.
 */
@Component
@Order(3)
public class AssetLocationRemovalMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public AssetLocationRemovalMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE assets DROP COLUMN IF EXISTS location_id");
        } catch (Exception ignored) {
            // Keep startup alive if DB user lacks DDL rights; run manual SQL in that case.
        }
    }
}
