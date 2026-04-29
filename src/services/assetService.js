/**
 * Asset API service - /api/assets
 * Asset id is UUID. Category is sent as { id } (Long); backend resolves relations.
 * On create: backend sets currentValue from purchaseCost when purchaseCost is not null.
 * On update: backend preserves createdAt and currentValue from existing asset.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/assets - List all assets.
 * @returns {Promise<Array>} List of Asset
 */
export function getAssets() {
  return fetch(`${BASE_URL}/api/assets`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/assets/:id - Get asset by id.
 * @param {string} id - Asset UUID
 * @returns {Promise<Object>} Asset
 */
export function getAssetById(id) {
  return fetch(`${BASE_URL}/api/assets/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/assets/next-tag?department=IT - Get next asset tag for department (preview before create).
 * @param {string} department - Department code (e.g. IT, HR)
 * @returns {Promise<{ nextTag: string }>}
 */
export function getNextAssetTag(department) {
  if (!department || !department.trim()) return Promise.resolve({ nextTag: '' });
  const params = new URLSearchParams({ department: department.trim() });
  return fetch(`${BASE_URL}/api/assets/next-tag?${params}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/assets - Create asset.
 * Backend resolves category by id. If purchaseCost is set, backend sets currentValue = purchaseCost.
 * @param {Object} asset - assetTag, name, description?, serialNumber?, purchaseDate?, purchaseCost?, currentValue?, usefulLifeYears?, salvageValue?, status?, warrantyExpiryDate?, department, category?: { id }
 * @returns {Promise<Object>} Created Asset (201)
 */
export function createAsset(asset) {
  return fetch(`${BASE_URL}/api/assets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(asset),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/assets/:id - Update asset.
 * Backend preserves createdAt and currentValue from existing asset; resolves category by id.
 * @param {string} id - Asset UUID
 * @param {Object} asset - Asset fields (category?: { id }). currentValue is ignored (backend keeps existing).
 * @returns {Promise<Object>} Updated Asset
 */
export function updateAsset(id, asset) {
  return fetch(`${BASE_URL}/api/assets/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(asset),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/assets/:id
 * @param {string} id - Asset UUID
 * @returns {Promise<void>} 204 No Content
 */
export function deleteAsset(id) {
  return fetch(`${BASE_URL}/api/assets/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
