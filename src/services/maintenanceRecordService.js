/**
 * Maintenance Record API - /api/maintenance-records
 * Create/update: send asset: { id }; backend resolves relation.
 * On create, the backend sends a MAINTENANCE notification to all active users.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/maintenance-records - List all maintenance records.
 * @returns {Promise<Array>} List of MaintenanceRecord
 */
export function getMaintenanceRecords() {
  return fetch(`${BASE_URL}/api/maintenance-records`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/maintenance-records/:id
 * @param {string|number} id - Maintenance record id (Long)
 * @returns {Promise<Object>} MaintenanceRecord
 */
export function getMaintenanceRecordById(id) {
  return fetch(`${BASE_URL}/api/maintenance-records/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/maintenance-records - Create maintenance record.
 * Backend resolves asset by id and notifies all active users (MAINTENANCE type).
 * @param {Object} record - type, description?, scheduledDate?, completedDate?, cost?, status, asset: { id }
 * @returns {Promise<Object>} Created MaintenanceRecord (201)
 */
export function createMaintenanceRecord(record) {
  return fetch(`${BASE_URL}/api/maintenance-records`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(record),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/maintenance-records/:id - Update maintenance record.
 * @param {string|number} id - Record id (Long)
 * @param {Object} record - type, description?, scheduledDate?, completedDate?, cost?, status, asset?: { id }
 * @returns {Promise<Object>} Updated MaintenanceRecord
 */
export function updateMaintenanceRecord(id, record) {
  return fetch(`${BASE_URL}/api/maintenance-records/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(record),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/maintenance-records/:id
 * @param {string|number} id - Record id (Long)
 * @returns {Promise<void>} 204 No Content
 */
export function deleteMaintenanceRecord(id) {
  return fetch(`${BASE_URL}/api/maintenance-records/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
