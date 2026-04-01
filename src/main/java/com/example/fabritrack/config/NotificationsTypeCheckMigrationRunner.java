package com.example.fabritrack.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures the notifications.type check constraint includes THEFT_RISK
 * (used by anomaly/theft detection). The DB may have been created before
 * THEFT_RISK was added to the enum.
 */
@Component
@Order(2)
public class NotificationsTypeCheckMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public NotificationsTypeCheckMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
        } catch (Exception e) {
            // Constraint may not exist (e.g. H2 or different naming)
        }
        try {
            jdbcTemplate.execute(
                "ALTER TABLE notifications ADD CONSTRAINT notifications_type_check " +
                "CHECK (type IN ('ASSIGNMENT', 'MAINTENANCE', 'WARRANTY_EXPIRY', 'RESERVATION', 'AUDIT', 'GENERAL', 'THEFT_RISK'))"
            );
        } catch (Exception e) {
            // Constraint may already exist with correct values; ignore
        }
    }
}
