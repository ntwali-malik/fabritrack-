/**
 * Permission names used for authorization. Must match backend Permission enum.
 * Use hasPermission(permissions, permissionName) to check access.
 */
export const PERMISSIONS = {
  USER_MANAGE: 'USER_MANAGE',
  ASSET_CATEGORY_MANAGE: 'ASSET_CATEGORY_MANAGE',
  LOCATION_MANAGE: 'LOCATION_MANAGE',
  ASSET_READ: 'ASSET_READ',
  ASSET_WRITE: 'ASSET_WRITE',
  ASSIGNMENT_MANAGE: 'ASSIGNMENT_MANAGE',
  EMPLOYEE_MANAGE: 'EMPLOYEE_MANAGE',
  RESERVATION_MANAGE: 'RESERVATION_MANAGE',
  MAINTENANCE_MANAGE: 'MAINTENANCE_MANAGE',
  ATTACHMENT_MANAGE: 'ATTACHMENT_MANAGE',
  COMMENT_MANAGE: 'COMMENT_MANAGE',
  MOVEMENT_READ: 'MOVEMENT_READ',
  MOVEMENT_WRITE: 'MOVEMENT_WRITE',
  DEPRECIATION_MANAGE: 'DEPRECIATION_MANAGE',
  AUDIT_READ: 'AUDIT_READ',
  NOTIFICATION_READ: 'NOTIFICATION_READ',
  ANOMALY_READ: 'ANOMALY_READ',
  HIGH_VALUE_MOVEMENT_BYPASS: 'HIGH_VALUE_MOVEMENT_BYPASS',
};

/**
 * @param {string[]} permissions - User's permission list (from login/me)
 * @param {string} permission - Permission name to check
 * @returns {boolean}
 */
export function hasPermission(permissions, permission) {
  if (!Array.isArray(permissions) || !permission) return false;
  return permissions.includes(permission);
}

/**
 * Nav item id -> required permission (view access)
 */
export const NAV_PERMISSION = {
  dashboard: null, // always shown when logged in
  asset: 'ASSET_READ',
  'asset-category': 'ASSET_CATEGORY_MANAGE',
  location: 'LOCATION_MANAGE',
  'asset-assignment': 'ASSIGNMENT_MANAGE',
  employee: 'EMPLOYEE_MANAGE',
  'asset-movement': 'MOVEMENT_READ',
  'asset-reservation': 'RESERVATION_MANAGE',
  attachment: 'ATTACHMENT_MANAGE',
  'audit-log': 'AUDIT_READ',
  'anomaly-alert': 'ANOMALY_READ',
  comment: 'COMMENT_MANAGE',
  depreciation: 'DEPRECIATION_MANAGE',
  maintenance: 'MAINTENANCE_MANAGE',
  notification: 'NOTIFICATION_READ',
  'user-management': 'USER_MANAGE',
};

/**
 * Dashboard capability -> required permission
 */
export const CAP_PERMISSION = {
  assets: 'ASSET_READ',
  categories: 'ASSET_CATEGORY_MANAGE',
  locations: 'LOCATION_MANAGE',
  assignments: 'ASSIGNMENT_MANAGE',
  movements: 'MOVEMENT_READ',
  reservations: 'RESERVATION_MANAGE',
  attachments: 'ATTACHMENT_MANAGE',
  auditLogs: 'AUDIT_READ',
  comments: 'COMMENT_MANAGE',
  depreciation: 'DEPRECIATION_MANAGE',
  maintenance: 'MAINTENANCE_MANAGE',
  users: 'USER_MANAGE',
  notifications: 'NOTIFICATION_READ',
};

/** All permission names (must match backend Permission enum). */
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Permissions per role when API doesn't return permissions (fallback).
 * Must match backend RolePermissionService.
 */
const ROLE_PERMISSIONS = {
  ADMIN: ALL_PERMISSIONS,
  IT: [
    PERMISSIONS.ASSET_CATEGORY_MANAGE,
    PERMISSIONS.LOCATION_MANAGE,
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.ASSET_WRITE,
    PERMISSIONS.ASSIGNMENT_MANAGE,
    PERMISSIONS.EMPLOYEE_MANAGE,
    PERMISSIONS.RESERVATION_MANAGE,
    PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.ATTACHMENT_MANAGE,
    PERMISSIONS.COMMENT_MANAGE,
    PERMISSIONS.MOVEMENT_READ,
    PERMISSIONS.MOVEMENT_WRITE,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  FINANCE: [
    PERMISSIONS.ASSET_READ,
    PERMISSIONS.DEPRECIATION_MANAGE,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  SECURITY: [
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.ANOMALY_READ,
    PERMISSIONS.MOVEMENT_READ,
    PERMISSIONS.MOVEMENT_WRITE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.HIGH_VALUE_MOVEMENT_BYPASS,
  ],
};

/**
 * Get permissions for a role (fallback when API doesn't return permissions).
 * @param {string} role - Role name e.g. 'ADMIN', 'IT', 'FINANCE', 'SECURITY'
 * @returns {string[]}
 */
export function getPermissionsForRole(role) {
  if (!role || typeof role !== 'string') return [];
  const key = role.toUpperCase();
  return ROLE_PERMISSIONS[key] || ROLE_PERMISSIONS.ADMIN || [];
}

/**
 * Get effective permissions: use user.permissions if present, else derive from user.role.
 * @param {{ permissions?: string[], role?: string }} user
 * @returns {string[]}
 */
export function getEffectivePermissions(user) {
  if (!user) return [];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }
  return getPermissionsForRole(user.role);
}
