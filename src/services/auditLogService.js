/**
 * Audit Log API - /api/audit-logs (read-only).
 * Matches AuditLogController: list with pagination and filters, get by id.
 * Logs are created by the backend when actions occur; no create/update/delete via API.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/** Normalize a single audit log from backend for display */
function normalizeAuditLog(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: row.id,
    entityName: row.entityName ?? row.entityType ?? row.entity ?? '—',
    entityId: row.entityId ?? row.entity_id ?? row.referenceId ?? row.reference_id ?? '—',
    action: row.action ?? row.operation ?? '—',
    details: row.details ?? row.description ?? row.summary ?? '—',
    performedAt: row.performedAt ?? row.performed_at ?? row.timestamp ?? row.createdAt ?? row.created_at ?? row.date,
    user: row.user ?? row.performedBy ?? row.performed_by ?? row.userId,
  };
}

/**
 * Build query string from params (only include defined values).
 * @param {Object} params - { entityName?, action?, userId?, page?, size? }
 */
function buildQuery(params) {
  const p = new URLSearchParams();
  if (params.entityName != null && String(params.entityName).trim() !== '') p.set('entityName', String(params.entityName).trim());
  if (params.action != null && String(params.action).trim() !== '') p.set('action', String(params.action).trim());
  if (params.userId != null && String(params.userId).trim() !== '') p.set('userId', String(params.userId).trim());
  if (params.page != null && params.page >= 0) p.set('page', String(params.page));
  if (params.size != null && params.size > 0) p.set('size', String(params.size));
  const q = p.toString();
  return q ? `?${q}` : '';
}

/**
 * List audit logs with optional filters and pagination.
 * Backend: Page<AuditLog>, default sort by performedAt desc, 20 per page.
 * @param {Object} [options] - { entityName?, action?, userId?, page?, size? }
 *   - action: AuditAction enum string (e.g. CREATE, UPDATE, DELETE)
 *   - page: 0-based page index (default 0)
 *   - size: page size (default 20)
 * @returns {Promise<{ content: Array, totalElements: number, totalPages: number, number: number, size: number }>}
 */
export function getAuditLogs(options = {}) {
  const page = options.page != null ? Number(options.page) : 0;
  const size = options.size != null ? Number(options.size) : 20;
  const query = buildQuery({
    entityName: options.entityName,
    action: options.action,
    userId: options.userId,
    page,
    size,
  });
  const url = `${BASE_URL}/api/audit-logs${query}`;
  return fetch(url, { method: 'GET', headers: getHeaders() })
    .then(checkResponse)
    .then((res) => res.json())
    .then((data) => {
      const content = Array.isArray(data.content) ? data.content : [];
      return {
        content: content.map(normalizeAuditLog).filter(Boolean),
        totalElements: data.totalElements ?? content.length,
        totalPages: data.totalPages ?? 1,
        number: data.number ?? page,
        size: data.size ?? size,
      };
    });
}

/**
 * Get a single audit log by id.
 * @param {string|number} id - Audit log id (Long)
 * @returns {Promise<Object>} Normalized AuditLog
 */
export function getAuditLogById(id) {
  return fetch(`${BASE_URL}/api/audit-logs/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json())
    .then(normalizeAuditLog);
}
