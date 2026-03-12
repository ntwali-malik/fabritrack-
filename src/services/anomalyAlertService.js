/**
 * Anomaly / Theft-risk alerts API - /api/anomaly-alerts (read-only).
 * ADMIN and SECURITY can list alerts for asset recovery and theft prevention.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * List anomaly alerts with optional filters and pagination.
 * @param {Object} [options] - { assetId?, severity?, page?, size? }
 *   - assetId: UUID - filter by asset
 *   - severity: 'HIGH' | 'MEDIUM' | 'LOW'
 *   - page: 0-based page index (default 0)
 *   - size: page size (default 20)
 * @returns {Promise<{ content: Array, totalElements: number, totalPages: number, number: number }>}
 */
export function getAnomalyAlerts(options = {}) {
  const params = new URLSearchParams();
  if (options.assetId != null) params.set('assetId', options.assetId);
  if (options.severity != null && String(options.severity).trim() !== '') params.set('severity', String(options.severity).trim());
  if (options.page != null && options.page >= 0) params.set('page', String(options.page));
  if (options.size != null && options.size > 0) params.set('size', String(options.size));
  const query = params.toString();
  const url = query ? `${BASE_URL}/api/anomaly-alerts?${query}` : `${BASE_URL}/api/anomaly-alerts`;

  return fetch(url, { method: 'GET', headers: getHeaders() })
    .then(checkResponse)
    .then((r) => r.json())
    .then((data) => ({
      content: Array.isArray(data.content) ? data.content : [],
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 1,
      number: data.number ?? (options.page ?? 0),
      size: data.size ?? (options.size ?? 20),
    }));
}

/**
 * Get a single anomaly alert by id.
 * @param {string|number} id - Alert id (Long)
 * @returns {Promise<Object>}
 */
export function getAnomalyAlertById(id) {
  return fetch(`${BASE_URL}/api/anomaly-alerts/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * Create one demo/sample alert for presentation (when list is empty).
 * Requires at least one asset in the system. ADMIN or SECURITY only.
 * @returns {Promise<Object>} Created AnomalyAlertResponse
 */
export function createDemoAnomalyAlert() {
  return fetch(`${BASE_URL}/api/anomaly-alerts/demo`, {
    method: 'POST',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}
