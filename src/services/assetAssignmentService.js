/**
 * Asset Assignment API service - /api/asset-assignments
 * Create/update: send asset: { id } and exactly one of:
 *   - user: { id } for personnel assignment (system user)
 *   - assigneeDepartment: "DEPARTMENT_NAME" for department assignment
 * Backend resolves relations. On create, notification is sent to the assigned user when applicable.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/asset-assignments - List all asset assignments.
 * @returns {Promise<Array>} List of AssetAssignment
 */
export function getAssetAssignments() {
  return fetch(`${BASE_URL}/api/asset-assignments`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/asset-assignments/:id
 * @param {string|number} id - Assignment id (Long)
 * @returns {Promise<Object>} AssetAssignment
 */
export function getAssetAssignmentById(id) {
  return fetch(`${BASE_URL}/api/asset-assignments/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/asset-assignments - Create asset assignment.
 * Backend resolves asset/user by id and sends an ASSIGNMENT notification to the user.
 * @param {Object} assignment - assignedDate, returnDate?, status, asset: { id }, user: { id }
 * @returns {Promise<Object>} Created AssetAssignment (201)
 */
export function createAssetAssignment(assignment) {
  return fetch(`${BASE_URL}/api/asset-assignments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(assignment),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/asset-assignments/:id - Update asset assignment.
 * @param {string|number} id - Assignment id (Long)
 * @param {Object} assignment - assignedDate, returnDate?, status, asset?: { id }, user?: { id }
 * @returns {Promise<Object>} Updated AssetAssignment
 */
export function updateAssetAssignment(id, assignment) {
  return fetch(`${BASE_URL}/api/asset-assignments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(assignment),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/asset-assignments/:id - Delete asset assignment.
 * @param {string|number} id - Assignment id (Long)
 * @returns {Promise<void>} 204 No Content
 */
export function deleteAssetAssignment(id) {
  return fetch(`${BASE_URL}/api/asset-assignments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}

/**
 * GET /api/asset-assignments/assigned-assets - Active assignments for movement (by personnel or department).
 * Use for "Move by Personnel" or "Move by Department" to list assets that can be moved.
 * @param {{ userId?: string, employeeId?: string|number, assigneeDepartment?: string }} params - Exactly one of userId, employeeId (legacy), or assigneeDepartment
 * @returns {Promise<Array>} List of AssetAssignment (each includes asset, user, assigneeDepartment)
 */
export function getAssignedAssetsForMovement(params) {
  const { userId, employeeId, assigneeDepartment } = params || {};
  const search = new URLSearchParams();
  if (userId != null && userId !== '') search.set('userId', String(userId));
  if (employeeId != null) search.set('employeeId', String(employeeId));
  if (assigneeDepartment != null) search.set('assigneeDepartment', assigneeDepartment);
  const qs = search.toString();
  if (!qs) return Promise.resolve([]);
  return fetch(`${BASE_URL}/api/asset-assignments/assigned-assets?${qs}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}
