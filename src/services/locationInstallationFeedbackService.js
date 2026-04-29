/**
 * Location comments API (installation feedback) — UI label: Comment.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * @param {{ locationId?: number|string }} [params] - omit or empty for all records
 * @returns {Promise<Array>}
 */
export function getLocationInstallationFeedback(params = {}) {
  const q =
    params.locationId != null && params.locationId !== ''
      ? `?locationId=${encodeURIComponent(params.locationId)}`
      : '';
  return fetch(`${BASE_URL}/api/location-installation-feedback${q}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function getLocationInstallationFeedbackById(id) {
  return fetch(`${BASE_URL}/api/location-installation-feedback/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function createLocationInstallationFeedback(body) {
  return fetch(`${BASE_URL}/api/location-installation-feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function updateLocationInstallationFeedback(id, body) {
  return fetch(`${BASE_URL}/api/location-installation-feedback/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function deleteLocationInstallationFeedback(id) {
  return fetch(`${BASE_URL}/api/location-installation-feedback/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
