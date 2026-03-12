/**
 * Notification API - /api/notifications
 * Notifications are created by the application (e.g. on asset assignment).
 * This API supports listing, get-by-id, and marking as read only (no create/update/delete).
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/notifications - List notifications.
 * @param {Object} [options] - Optional filters
 * @param {string} [options.userId] - UUID; if provided, returns that user's notifications only (otherwise all, e.g. admin)
 * @param {boolean} [options.unreadOnly=false] - If true, return only unread notifications
 * @returns {Promise<Array>} List of Notification
 */
export function getNotifications(options = {}) {
  const params = new URLSearchParams();
  if (options.userId != null) params.set('userId', options.userId);
  if (options.unreadOnly === true) params.set('unreadOnly', 'true');
  const query = params.toString();
  const url = query ? `${BASE_URL}/api/notifications?${query}` : `${BASE_URL}/api/notifications`;
  return fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/notifications/:id - Get a single notification by id.
 * @param {string|number} id - Notification id (Long)
 * @returns {Promise<Object>} Notification
 */
export function getNotificationById(id) {
  return fetch(`${BASE_URL}/api/notifications/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PATCH /api/notifications/:id/read - Mark a notification as read. Idempotent.
 * @param {string|number} id - Notification id (Long)
 * @returns {Promise<Object>} Updated Notification
 */
export function markNotificationAsRead(id) {
  return fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PATCH /api/notifications/read-all - Mark all notifications for the current user as read.
 * Uses the authenticated user from the token; returns 403 if not authenticated.
 * @returns {Promise<void>} 204 No Content
 */
export function markAllNotificationsAsRead() {
  return fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: getHeaders(),
  }).then(checkResponse);
}
