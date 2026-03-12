/**
 * FabriTrack API - re-exports all services and auth helpers.
 * Use this for one-stop imports, or import from userService / assetService / apiClient directly.
 */

export { setAuthToken, getAuthToken, BASE_URL, getHeaders, checkResponse } from './apiClient';
export * from './userService';
export * from './assetService';
export * from './assetCategoryService';
export * from './locationService';
export * from './assetAssignmentService';
export * from './employeeService';
export * from './assetMovementService';
export * from './assetReservationService';
export * from './attachmentService';
export * from './auditLogService';
export * from './anomalyAlertService';
export * from './commentService';
export * from './depreciationRecordService';
export * from './maintenanceRecordService';
export * from './notificationService';
