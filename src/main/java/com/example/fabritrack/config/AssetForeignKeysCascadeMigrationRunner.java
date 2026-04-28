package com.example.fabritrack.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures asset child-table foreign keys use ON DELETE CASCADE.
 * This allows deleting an asset without manually deleting each dependent row.
 */
@Component
@Order(4)
public class AssetForeignKeysCascadeMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public AssetForeignKeysCascadeMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureCascade("asset_assignments", "fk_asset_assignments_asset");
        ensureCascade("asset_movements", "fk_asset_movements_asset");
        ensureCascade("asset_reservations", "fk_asset_reservations_asset");
        ensureCascade("maintenance_records", "fk_maintenance_records_asset");
        ensureCascade("depreciation_records", "fk_depreciation_records_asset");
        ensureCascade("attachments", "fk_attachments_asset");
        ensureCascade("anomaly_alerts", "fk_anomaly_alerts_asset");
        ensureCascade("field_work_asset_request_items", "fk_field_work_asset_request_items_asset");
    }

    private void ensureCascade(String tableName, String newConstraintName) {
        try {
            // Drop the current FK on <table>.asset_id -> assets(id), regardless of its generated name.
            jdbcTemplate.execute(
                    "DO $$ " +
                    "DECLARE fk_name text; " +
                    "BEGIN " +
                    "  SELECT c.conname INTO fk_name " +
                    "  FROM pg_constraint c " +
                    "  JOIN pg_class t ON t.oid = c.conrelid " +
                    "  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey) " +
                    "  WHERE c.contype = 'f' " +
                    "    AND t.relname = '" + tableName + "' " +
                    "    AND a.attname = 'asset_id' " +
                    "    AND c.confrelid = 'assets'::regclass " +
                    "  LIMIT 1; " +
                    "  IF fk_name IS NOT NULL THEN " +
                    "    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', '" + tableName + "', fk_name); " +
                    "  END IF; " +
                    "END $$;"
            );

            // Recreate FK with ON DELETE CASCADE.
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " " +
                    "ADD CONSTRAINT " + newConstraintName + " " +
                    "FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE"
            );
        } catch (Exception ignored) {
            // Keep startup alive if DB user lacks DDL rights or constraint already matches.
        }
    }
}
