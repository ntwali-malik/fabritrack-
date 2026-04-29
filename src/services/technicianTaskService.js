/**
 * Technician field tasks API — location-scoped work items and completion leaderboard.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

function qs(params) {
  const p = new URLSearchParams();
  if (params == null) return '';
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Backend may return a bare array or a paged / wrapped object. */
function normalizeLeaderboardPayload(data) {
  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) rows = data.content;
    else if (Array.isArray(data.leaderboard)) rows = data.leaderboard;
    else if (Array.isArray(data.data)) rows = data.data;
    else if (Array.isArray(data.rows)) rows = data.rows;
    else if (Array.isArray(data.results)) rows = data.results;
  }
  const mapped = rows.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const completedCount =
      row.completedCount ??
      row.doneCount ??
      row.completedTasks ??
      row.count ??
      row.totalCompleted ??
      (typeof row.completed === 'number' ? row.completed : undefined) ??
      0;
    return {
      ...row,
      userId: row.userId ?? row.user?.id ?? row.id,
      firstName: row.firstName ?? row.user?.firstName,
      lastName: row.lastName ?? row.user?.lastName,
      email: row.email ?? row.user?.email,
      completedCount: Number(completedCount) || 0,
    };
  });
  return mapped.sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0));
}

export function getTechnicianTasks(filters = {}) {
  return fetch(`${BASE_URL}/api/technician-tasks${qs(filters)}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function getTechnicianTaskById(id) {
  return fetch(`${BASE_URL}/api/technician-tasks/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/** @param {{ from?: string, to?: string }} [range] - ISO date-time strings */
export function getTechnicianTaskLeaderboard(range = {}) {
  return fetch(`${BASE_URL}/api/technician-tasks/leaderboard${qs(range)}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json())
    .then(normalizeLeaderboardPayload);
}

export function createTechnicianTask(body) {
  return fetch(`${BASE_URL}/api/technician-tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function updateTechnicianTask(id, body) {
  return fetch(`${BASE_URL}/api/technician-tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function patchTechnicianTaskStatus(id, status) {
  return fetch(`${BASE_URL}/api/technician-tasks/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function deleteTechnicianTask(id) {
  return fetch(`${BASE_URL}/api/technician-tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
