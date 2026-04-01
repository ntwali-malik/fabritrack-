package com.example.fabritrack.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Backfill migration for the locations table after Location entity redesign.
 * Keeps startup resilient when the DB schema is behind the code.
 */
@Component
@Order(2)
public class LocationMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public LocationMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS address varchar(255)");
            jdbcTemplate.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS installation_date date");
            jdbcTemplate.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS installed_by_user_id uuid");
            jdbcTemplate.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS amount double precision");
            jdbcTemplate.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS payment_date date");
            jdbcTemplate.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS payment_status varchar(20)");
            jdbcTemplate.execute("UPDATE locations SET payment_status = 'PENDING' WHERE payment_status IS NULL");
            jdbcTemplate.execute("ALTER TABLE locations ALTER COLUMN payment_status SET NOT NULL");
            jdbcTemplate.execute(
                    "DO $$ " +
                    "BEGIN " +
                    "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_locations_installed_by_user') THEN " +
                    "    ALTER TABLE locations " +
                    "    ADD CONSTRAINT fk_locations_installed_by_user " +
                    "    FOREIGN KEY (installed_by_user_id) REFERENCES users(id); " +
                    "  END IF; " +
                    "END $$;"
            );
        } catch (Exception ignored) {
            // Keep startup alive if DB user lacks DDL rights; run manual SQL in that case.
        }
    }
}
