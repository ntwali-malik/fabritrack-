/**
 * Location API service - /api/locations
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/locations - List all locations.
 * @returns {Promise<Array>} List of Location
 */
export function getLocations() {
  return fetch(`${BASE_URL}/api/locations`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/locations/:id
 * @param {string|number} id - Location id (Long)
 * @returns {Promise<Object>} Location
 */
export function getLocationById(id) {
  return fetch(`${BASE_URL}/api/locations/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/locations - Create location.
 * @param {Object} location - Location fields (e.g. name, address, asset?: { id }, etc.)
 * @returns {Promise<Object>} Created Location
 */
export function createLocation(location) {
  return fetch(`${BASE_URL}/api/locations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(location),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/locations/:id - Update location.
 * @param {string|number} id - Location id (Long)
 * @param {Object} location - Location fields to update (asset?: { id } or null)
 * @returns {Promise<Object>} Updated Location
 */
export function updateLocation(id, location) {
  return fetch(`${BASE_URL}/api/locations/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(location),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/locations/:id - Delete location.
 * @param {string|number} id - Location id (Long)
 * @returns {Promise<void>}
 */
export function deleteLocation(id) {
  return fetch(`${BASE_URL}/api/locations/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
