package com.example.fabritrack.service;

import com.example.fabritrack.entity.Permission;
import com.example.fabritrack.entity.Role;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Maps roles to permissions (Option A: enum-based). Authorization is done by permission;
 * roles are used only to assign a set of permissions to a user.
 */
@Service
public class RolePermissionService {

    private static final Map<Role, Set<Permission>> ROLE_PERMISSIONS = new EnumMap<>(Role.class);

    static {
        // ADMIN: all permissions
        Set<Permission> admin = new HashSet<>(Arrays.asList(Permission.values()));
        ROLE_PERMISSIONS.put(Role.ADMIN, Collections.unmodifiableSet(admin));

        // IT: asset lifecycle, no user management, no depreciation
        ROLE_PERMISSIONS.put(Role.IT, Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
                Permission.ASSET_CATEGORY_MANAGE,
                Permission.LOCATION_MANAGE,
                Permission.ASSET_READ,
                Permission.ASSET_WRITE,
                Permission.ASSIGNMENT_MANAGE,
                Permission.EMPLOYEE_MANAGE,
                Permission.RESERVATION_MANAGE,
                Permission.MAINTENANCE_MANAGE,
                Permission.ATTACHMENT_MANAGE,
                Permission.COMMENT_MANAGE,
                Permission.FIELD_TASK_READ,
                Permission.FIELD_TASK_MANAGE,
                Permission.MOVEMENT_READ,
                Permission.MOVEMENT_WRITE,
                Permission.NOTIFICATION_READ
        ))));

        // TECHNICIAN: read assets and manage locations/installations
        ROLE_PERMISSIONS.put(Role.TECHNICIAN, Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
                Permission.LOCATION_MANAGE,
                Permission.COMMENT_MANAGE,
                Permission.FIELD_TASK_READ,
                Permission.ASSET_READ,
                Permission.NOTIFICATION_READ
        ))));

        // FINANCE: depreciation + asset read only
        ROLE_PERMISSIONS.put(Role.FINANCE, Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
                Permission.ASSET_READ,
                Permission.DEPRECIATION_MANAGE,
                Permission.NOTIFICATION_READ
        ))));

        // SECURITY: audit, anomaly, movements (read+create), high-value bypass
        ROLE_PERMISSIONS.put(Role.SECURITY, Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
                Permission.AUDIT_READ,
                Permission.ANOMALY_READ,
                Permission.MOVEMENT_READ,
                Permission.MOVEMENT_WRITE,
                Permission.NOTIFICATION_READ,
                Permission.HIGH_VALUE_MOVEMENT_BYPASS
        ))));
    }

    /** Returns the set of permission names for the given role. */
    public Set<String> getPermissionNamesForRole(Role role) {
        if (role == null) return Collections.emptySet();
        Set<Permission> perms = ROLE_PERMISSIONS.get(role);
        if (perms == null) return Collections.emptySet();
        Set<String> names = new HashSet<>();
        for (Permission p : perms) {
            names.add(p.name());
        }
        return names;
    }

    /** Returns permissions for the given role. */
    public Set<Permission> getPermissionsForRole(Role role) {
        if (role == null) return Collections.emptySet();
        Set<Permission> perms = ROLE_PERMISSIONS.get(role);
        return perms == null ? Collections.emptySet() : perms;
    }

    /** Returns true if the role has the given permission. */
    public boolean hasPermission(Role role, Permission permission) {
        return permission != null && getPermissionsForRole(role).contains(permission);
    }

    /** Returns all roles that have the given permission (e.g. for notifying anomaly recipients). */
    public Set<Role> getRolesWithPermission(Permission permission) {
        if (permission == null) return Collections.emptySet();
        Set<Role> roles = new HashSet<>();
        for (Map.Entry<Role, Set<Permission>> e : ROLE_PERMISSIONS.entrySet()) {
            if (e.getValue().contains(permission)) {
                roles.add(e.getKey());
            }
        }
        return roles;
    }
}
