/**
 * Depreciation Record API - /api/depreciation-records
 * Create: send assetId (UUID), year, optional method. Amount and remaining value are calculated by the backend.
 * Update: send only year and/or method; amount and remaining value are recalculated.
 */

import { BASE_URL, getHeaders } from './apiClient';

function parseErrorResponse(res) {
  return res.text().then((text) => {
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) message = parsed.message;
      else if (typeof parsed === 'string') message = parsed;
    } catch (_) {}
    const err = new Error(message || `HTTP ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  });
}

/**
 * GET /api/depreciation-records - List all depreciation records.
 * @returns {Promise<Array>} List of DepreciationRecord
 */
export function getDepreciationRecords() {
  return fetch(`${BASE_URL}/api/depreciation-records`, {
    method: 'GET',
    headers: getHeaders(),
  }).then((res) => {
    if (!res.ok) return parseErrorResponse(res);
    return res.json();
  });
}

/**
 * GET /api/depreciation-records/:id
 * @param {string|number} id - Depreciation record id (Long)
 * @returns {Promise<Object>} DepreciationRecord
 */
export function getDepreciationRecordById(id) {
  return fetch(`${BASE_URL}/api/depreciation-records/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  }).then((res) => {
    if (!res.ok) return parseErrorResponse(res);
    return res.json();
  });
}

/**
 * POST /api/depreciation-records - Create depreciation record.
 * Backend calculates depreciation amount and remaining value from asset (purchase cost, useful life, salvage value).
 * Request: CreateDepreciationRequest { assetId (UUID), year, method? }. Method defaults to STRAIGHT_LINE.
 * @param {Object} request - { assetId: string (UUID), year: number, method?: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' }
 * @returns {Promise<Object>} Created DepreciationRecord (201)
 */
export function createDepreciationRecord(request) {
  const body = {
    assetId: request.assetId,
    year: request.year,
    ...(request.method && { method: request.method }),
  };
  return fetch(`${BASE_URL}/api/depreciation-records`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) return parseErrorResponse(res);
    return res.json();
  });
}

/**
 * PUT /api/depreciation-records/:id - Update depreciation record.
 * Only year and/or method are sent; backend recalculates amount and remaining value.
 * Request: UpdateDepreciationRequest { year?, method? }
 * @param {string|number} id - Record id (Long)
 * @param {Object} request - { year?: number, method?: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' }
 * @returns {Promise<Object>} Updated DepreciationRecord
 */
export function updateDepreciationRecord(id, request) {
  const body = {};
  if (request.year != null) body.year = request.year;
  if (request.method != null) body.method = request.method;
  return fetch(`${BASE_URL}/api/depreciation-records/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) return parseErrorResponse(res);
    return res.json();
  });
}

/**
 * DELETE /api/depreciation-records/:id
 * Backend updates asset current value to previous remaining value (or purchase cost).
 * @param {string|number} id - Record id (Long)
 * @returns {Promise<void>} 204 No Content
 */
export function deleteDepreciationRecord(id) {
  return fetch(`${BASE_URL}/api/depreciation-records/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then((res) => {
    if (!res.ok) return parseErrorResponse(res);
  });
}
