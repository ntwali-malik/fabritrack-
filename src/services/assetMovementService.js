/**
 * Asset Movement API - /api/asset-movements
 * Pass asset: { id } in create/update; backend resolves relation.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/asset-movements - List all asset movements.
 * @returns {Promise<Array>} List of AssetMovement
 */
export function getAssetMovements() {
  return fetch(`${BASE_URL}/api/asset-movements`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/asset-movements/:id
 * @param {string|number} id - Movement id (Long)
 * @returns {Promise<Object>} AssetMovement
 */
export function getAssetMovementById(id) {
  return fetch(`${BASE_URL}/api/asset-movements/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/asset-movements - Create asset movement.
 * @param {Object} movement - Movement fields + asset: { id }
 * @returns {Promise<Object>} Created AssetMovement
 */
export function createAssetMovement(movement) {
  return fetch(`${BASE_URL}/api/asset-movements`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(movement),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/asset-movements/:id - Update asset movement.
 * @param {string|number} id - Movement id (Long)
 * @param {Object} movement - Movement fields + asset?: { id }
 * @returns {Promise<Object>} Updated AssetMovement
 */
export function updateAssetMovement(id, movement) {
  return fetch(`${BASE_URL}/api/asset-movements/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(movement),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/asset-movements/:id
 * @param {string|number} id - Movement id (Long)
 * @returns {Promise<void>}
 */
export function deleteAssetMovement(id) {
  return fetch(`${BASE_URL}/api/asset-movements/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
