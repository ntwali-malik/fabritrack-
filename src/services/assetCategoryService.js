/**
 * Asset Category API service - /api/asset-categories
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/asset-categories - List all asset categories.
 * @returns {Promise<Array>} List of AssetCategory
 */
export function getAssetCategories() {
  return fetch(`${BASE_URL}/api/asset-categories`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/asset-categories/:id
 * @param {string|number} id - Category id (Long)
 * @returns {Promise<Object>} AssetCategory
 */
export function getAssetCategoryById(id) {
  return fetch(`${BASE_URL}/api/asset-categories/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/asset-categories - Create asset category.
 * @param {Object} category - AssetCategory fields (e.g. name, description)
 * @returns {Promise<Object>} Created AssetCategory
 */
export function createAssetCategory(category) {
  return fetch(`${BASE_URL}/api/asset-categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(category),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/asset-categories/:id - Update asset category.
 * @param {string|number} id - Category id (Long)
 * @param {Object} category - AssetCategory fields to update
 * @returns {Promise<Object>} Updated AssetCategory
 */
export function updateAssetCategory(id, category) {
  return fetch(`${BASE_URL}/api/asset-categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(category),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/asset-categories/:id - Delete asset category.
 * @param {string|number} id - Category id (Long)
 * @returns {Promise<void>}
 */
export function deleteAssetCategory(id) {
  return fetch(`${BASE_URL}/api/asset-categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
