package com.example.fabritrack.config;

import com.example.fabritrack.entity.Department;
import com.example.fabritrack.entity.LocationInstallationFeedback;
import com.example.fabritrack.entity.Role;
import com.example.fabritrack.entity.TechnicianTask;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Aligns PostgreSQL CHECK constraints with {@link Role}, {@link Department}, and
 * {@link LocationInstallationFeedback.SatisfactionLevel}, and {@link TechnicianTask} enums.
 * Hibernate {@code ddl-auto=update} does not rewrite existing checks, so older DBs can
 * reject new enum values (e.g. TECHNICIAN, TECHNICAL).
 */
@Component
@Order(3)
public class PostgresEnumCheckConstraintsRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final Environment environment;

    public PostgresEnumCheckConstraintsRunner(JdbcTemplate jdbcTemplate, Environment environment) {
        this.jdbcTemplate = jdbcTemplate;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        String url = environment.getProperty("spring.datasource.url", "");
        if (!url.contains("postgresql")) {
            return;
        }

        String roles = sqlInList(Arrays.stream(Role.values()).map(Enum::name).toList());
        String departments = sqlInList(Arrays.stream(Department.values()).map(Enum::name).toList());

        tryExecute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        dropChecksMatchingColumn("users", "role");
        tryExecute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (" + roles + "))");

        tryExecute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_check");
        dropChecksMatchingColumn("users", "department");
        tryExecute("ALTER TABLE users ADD CONSTRAINT users_department_check CHECK (department IN (" + departments + "))");

        tryExecute("ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_department_check");
        dropChecksMatchingColumn("assets", "department");
        tryExecute("ALTER TABLE assets ADD CONSTRAINT assets_department_check CHECK (department IN (" + departments + "))");

        tryExecute("ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_check");
        dropChecksMatchingColumn("employees", "department");
        tryExecute("ALTER TABLE employees ADD CONSTRAINT employees_department_check CHECK (department IN (" + departments + "))");

        tryExecute("ALTER TABLE asset_assignments DROP CONSTRAINT IF EXISTS asset_assignments_assignee_department_check");
        dropChecksMatchingColumn("asset_assignments", "assignee_department");
        tryExecute(
            "ALTER TABLE asset_assignments ADD CONSTRAINT asset_assignments_assignee_department_check CHECK ("
                + "assignee_department IS NULL OR assignee_department IN (" + departments + "))"
        );

        String satisfactionLevels = sqlInList(
            Arrays.stream(LocationInstallationFeedback.SatisfactionLevel.values()).map(Enum::name).toList());
        tryExecute(
            "ALTER TABLE location_installation_feedback DROP CONSTRAINT IF EXISTS location_installation_feedback_satisfaction_level_check");
        dropChecksMatchingColumn("location_installation_feedback", "satisfaction_level");
        tryExecute(
            "ALTER TABLE location_installation_feedback ADD CONSTRAINT location_installation_feedback_satisfaction_level_check CHECK ("
                + "satisfaction_level IS NULL OR satisfaction_level IN (" + satisfactionLevels + "))"
        );

        String taskStatuses = sqlInList(Arrays.stream(TechnicianTask.TaskStatus.values()).map(Enum::name).toList());
        String taskPriorities = sqlInList(Arrays.stream(TechnicianTask.TaskPriority.values()).map(Enum::name).toList());
        tryExecute("ALTER TABLE technician_tasks DROP CONSTRAINT IF EXISTS technician_tasks_status_check");
        dropChecksMatchingColumn("technician_tasks", "status");
        tryExecute("ALTER TABLE technician_tasks ADD CONSTRAINT technician_tasks_status_check CHECK (status IN (" + taskStatuses + "))");
        tryExecute("ALTER TABLE technician_tasks DROP CONSTRAINT IF EXISTS technician_tasks_priority_check");
        dropChecksMatchingColumn("technician_tasks", "priority");
        tryExecute("ALTER TABLE technician_tasks ADD CONSTRAINT technician_tasks_priority_check CHECK (priority IN (" + taskPriorities + "))");
    }

    private static String sqlInList(java.util.List<String> values) {
        return values.stream()
            .map(v -> "'" + v.replace("'", "''") + "'")
            .collect(Collectors.joining(", "));
    }

    private void dropChecksMatchingColumn(String table, String column) {
        String sql =
            "DO $$ DECLARE r record; BEGIN "
                + "FOR r IN ("
                + "  SELECT c.conname FROM pg_constraint c "
                + "  JOIN pg_class t ON c.conrelid = t.oid "
                + "  JOIN pg_namespace n ON t.relnamespace = n.oid "
                + "  WHERE c.contype = 'c' AND n.nspname = current_schema() AND t.relname = '" + table + "' "
                + "  AND pg_get_constraintdef(c.oid) ILIKE '%" + column + "%'"
                + ") LOOP "
                + "  EXECUTE format('ALTER TABLE " + table + " DROP CONSTRAINT %I', r.conname); "
                + "END LOOP; END $$;";
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ignored) {
            // Table missing or not PostgreSQL
        }
    }

    private void tryExecute(String ddl) {
        try {
            jdbcTemplate.execute(ddl);
        } catch (Exception ignored) {
            // Table/constraint missing or already satisfied; ignore
        }
    }
}
