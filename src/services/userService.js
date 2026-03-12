/**
 * User API service - /api/users
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/users - List all users.
 * @returns {Promise<Array>} List of User
 */
export function getUsers() {
  return fetch(`${BASE_URL}/api/users`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/users/pending - List users pending approval (Admin).
 * @returns {Promise<Array>} List of User with status PENDING_APPROVAL
 */
export function getPendingUsers() {
  return fetch(`${BASE_URL}/api/users/pending`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/users/:id/approve - Approve a pending user (Admin).
 * @param {string} id - User UUID
 * @param {Object} [options] - { role?: string } Role to assign when approving (ADMIN, IT, FINANCE, SECURITY)
 * @returns {Promise<Object>} Updated User
 */
export function approveUser(id, options = {}) {
  return fetch(`${BASE_URL}/api/users/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(options.role != null ? { role: options.role } : {}),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/users/:id/reject - Reject a pending user (Admin).
 * @param {string} id - User UUID
 * @returns {Promise<Object>} Updated User
 */
export function rejectUser(id) {
  return fetch(`${BASE_URL}/api/users/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/users/:id
 * @param {string} id - User UUID
 * @returns {Promise<Object>} User
 */
export function getUserById(id) {
  return fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/users - Create user (admin).
 * @param {Object} user - { email, password, firstName?, lastName?, phone?, status? }
 * @returns {Promise<Object>} Created User
 */
export function createUser(user) {
  return fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(user),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/users/signup - Register new user.
 * Account is created with status PENDING_APPROVAL; no token is returned.
 * User must wait for admin approval before they can log in.
 * @param {Object} user - { email, password, firstName?, lastName?, phone?, role?, department? }
 * @returns {Promise<{ message: string, user: Object }>} SignupResponse
 */
export function signUp(user) {
  return fetch(`${BASE_URL}/api/users/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(user),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/users/login - Login.
 * Returns 403 with { error, code: "PENDING_APPROVAL" | "ACCOUNT_NOT_APPROVED" } if account is not approved.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ token: string, user: Object, permissions: string[] }>} LoginResponse
 */
export function login(credentials) {
  return fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  })
    .then(async (res) => {
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || 'Your account cannot be used to sign in. Please contact an administrator.';
        const err = new Error(msg);
        err.code = body.code;
        err.status = 403;
        err.userStatus = body.status ?? body.code ?? body.user?.status ?? null;
        throw err;
      }
      return checkResponse(res);
    })
    .then((r) => r.json());
}

/**
 * GET /api/users/me - Current user profile and permissions (requires auth).
 * @returns {Promise<{ user: Object, permissions: string[] }>}
 */
export function getCurrentUser() {
  return fetch(`${BASE_URL}/api/users/me`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/users/me - Update current user profile (requires auth).
 * @param {Object} payload - { firstName?, lastName?, email?, phone?, currentPassword?, newPassword? }
 * @returns {Promise<Object>} Updated User (or error body on 4xx)
 */
export function updateProfile(payload) {
  return fetch(`${BASE_URL}/api/users/me`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/users/me/avatar - Upload profile image (requires auth).
 * Allowed: JPEG, PNG, GIF, WebP, max 5 MB.
 * @param {File} file
 * @returns {Promise<Object>} Updated User
 */
export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: 'PUT',
    headers: getHeaders(true, null),
    body: formData,
  })
    .then((res) => {
      if (!res.ok) return res.text().then((t) => { throw new Error(t || `HTTP ${res.status}`); });
      return res.json();
    });
}

/**
 * DELETE /api/users/me/avatar - Remove profile image (requires auth).
 * @returns {Promise<Object>} Updated User
 */
export function deleteAvatar() {
  return fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/users/me/avatar - Fetch current user's avatar as blob (requires auth).
 * Use with URL.createObjectURL(blob) for img src.
 * @returns {Promise<Blob|null>} Image blob or null if 404
 */
export function getMyAvatarBlob() {
  return fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: 'GET',
    headers: getHeaders(),
  }).then((res) => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Avatar: ${res.status}`);
    return res.blob();
  });
}

/**
 * GET /api/users/:id/avatar - Fetch user avatar as blob.
 * @param {string} userId - User UUID
 * @returns {Promise<Blob|null>} Image blob or null if 404
 */
export function getUserAvatarBlob(userId) {
  return fetch(`${BASE_URL}/api/users/${userId}/avatar`, {
    method: 'GET',
    headers: getHeaders(),
  }).then((res) => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Avatar: ${res.status}`);
    return res.blob();
  });
}

/**
 * URL for current user's avatar.
 * @returns {string}
 */
export function getMyAvatarUrl() {
  return `${BASE_URL}/api/users/me/avatar`;
}

/**
 * URL for a user's avatar by id.
 * @param {string} userId - User UUID
 * @returns {string}
 */
export function getUserAvatarUrl(userId) {
  return `${BASE_URL}/api/users/${userId}/avatar`;
}

/**
 * PUT /api/users/:id - Update user by id (admin).
 * @param {string} id - User UUID
 * @param {Object} user - User fields to update (password will be encoded if provided)
 * @returns {Promise<Object>} Updated User
 */
export function updateUser(id, user) {
  return fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(user),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/users/:id - Delete user (admin).
 * @param {string} id - User UUID
 * @returns {Promise<void>}
 */
export function deleteUser(id) {
  return fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
