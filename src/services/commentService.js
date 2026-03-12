/**
 * Comment API - /api/comments
 * Pass asset: { id } and user: { id } in create/update; backend resolves relations.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/comments - List all comments.
 * @returns {Promise<Array>} List of Comment
 */
export function getComments() {
  return fetch(`${BASE_URL}/api/comments`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/comments/:id
 * @param {string|number} id - Comment id (Long)
 * @returns {Promise<Object>} Comment
 */
export function getCommentById(id) {
  return fetch(`${BASE_URL}/api/comments/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/comments - Create comment.
 * @param {Object} comment - Comment fields + asset: { id }, user: { id }
 * @returns {Promise<Object>} Created Comment
 */
export function createComment(comment) {
  return fetch(`${BASE_URL}/api/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(comment),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/comments/:id - Update comment.
 * @param {string|number} id - Comment id (Long)
 * @param {Object} comment - Comment fields + asset?: { id }, user?: { id }
 * @returns {Promise<Object>} Updated Comment
 */
export function updateComment(id, comment) {
  return fetch(`${BASE_URL}/api/comments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(comment),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/comments/:id
 * @param {string|number} id - Comment id (Long)
 * @returns {Promise<void>}
 */
export function deleteComment(id) {
  return fetch(`${BASE_URL}/api/comments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
