/**
 * Asset Reservation API - /api/asset-reservations
 * Create/update: send asset: { id } and user: { id }; backend resolves relations.
 * On create, the backend sends a RESERVATION notification to the reserved user.
 * On update, when status changes, the backend sends a RESERVATION notification to the reserved user
 * with the new status (e.g. "Your reservation for \"X\" has been updated. New status: APPROVED.").
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/asset-reservations - List all asset reservations.
 * @returns {Promise<Array>} List of AssetReservation
 */
export function getAssetReservations() {
  return fetch(`${BASE_URL}/api/asset-reservations`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/asset-reservations/:id
 * @param {string|number} id - Reservation id (Long)
 * @returns {Promise<Object>} AssetReservation
 */
export function getAssetReservationById(id) {
  return fetch(`${BASE_URL}/api/asset-reservations/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/asset-reservations - Create asset reservation.
 * Backend resolves asset/user by id and sends a RESERVATION notification to the user.
 * @param {Object} reservation - startDate, endDate, purpose?, status, asset: { id }, user: { id }
 * @returns {Promise<Object>} Created AssetReservation (201)
 */
export function createAssetReservation(reservation) {
  return fetch(`${BASE_URL}/api/asset-reservations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reservation),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/asset-reservations/:id - Update asset reservation.
 * When status is changed, the backend sends a RESERVATION notification to the reserved user
 * with title "Reservation status updated" and the new status in the message.
 * @param {string|number} id - Reservation id (Long)
 * @param {Object} reservation - startDate, endDate, purpose?, status, asset?: { id }, user?: { id }
 * @returns {Promise<Object>} Updated AssetReservation
 */
export function updateAssetReservation(id, reservation) {
  return fetch(`${BASE_URL}/api/asset-reservations/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(reservation),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/asset-reservations/:id
 * @param {string|number} id - Reservation id (Long)
 * @returns {Promise<void>} 204 No Content
 */
export function deleteAssetReservation(id) {
  return fetch(`${BASE_URL}/api/asset-reservations/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
