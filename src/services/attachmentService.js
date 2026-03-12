/**
 * Attachment API - /api/attachments
 * Stores real file content in the database. Create/update use multipart/form-data.
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/attachments - List all attachments (metadata only, no file content).
 * @returns {Promise<Array>} List of Attachment
 */
export function getAttachments() {
  return fetch(`${BASE_URL}/api/attachments`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/attachments/:id - Get attachment metadata by id.
 * @param {string|number} id - Attachment id (Long)
 * @returns {Promise<Object>} Attachment (no content field)
 */
export function getAttachmentById(id) {
  return fetch(`${BASE_URL}/api/attachments/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * Download attachment file. Returns blob; use to create object URL or trigger download.
 * @param {string|number} id - Attachment id (Long)
 * @returns {Promise<Blob>} File blob
 */
export function downloadAttachmentFile(id) {
  return fetch(`${BASE_URL}/api/attachments/${id}/file`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(checkResponse).then((r) => r.blob());
}

/**
 * Create attachment by uploading a file.
 * @param {File} file - The file to upload
 * @param {string} assetId - UUID of the asset
 * @param {string} [fileName] - Optional display name (defaults to file.name)
 * @returns {Promise<Object>} Created Attachment
 */
export function createAttachment(file, assetId, fileName) {
  const form = new FormData();
  form.append('file', file);
  form.append('assetId', assetId);
  if (fileName != null && String(fileName).trim() !== '') {
    form.append('fileName', String(fileName).trim());
  }
  return fetch(`${BASE_URL}/api/attachments`, {
    method: 'POST',
    headers: getHeaders(true, null), // no Content-Type so browser sets multipart boundary
    body: form,
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * Update attachment. Can replace file and/or change fileName or assetId.
 * @param {string|number} id - Attachment id (Long)
 * @param {Object} options - { file?: File, fileName?: string, assetId?: string }
 * @returns {Promise<Object>} Updated Attachment
 */
export function updateAttachment(id, options = {}) {
  const form = new FormData();
  if (options.file != null) {
    form.append('file', options.file);
  }
  if (options.fileName != null && String(options.fileName).trim() !== '') {
    form.append('fileName', String(options.fileName).trim());
  }
  if (options.assetId != null && String(options.assetId).trim() !== '') {
    form.append('assetId', String(options.assetId).trim());
  }
  return fetch(`${BASE_URL}/api/attachments/${id}`, {
    method: 'PUT',
    headers: getHeaders(true, null),
    body: form,
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/attachments/:id
 * @param {string|number} id - Attachment id (Long)
 * @returns {Promise<void>}
 */
export function deleteAttachment(id) {
  return fetch(`${BASE_URL}/api/attachments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
