import { BASE_URL, getHeaders, checkResponse } from "./apiClient";

export function getFieldWorkAssetRequests() {
  return fetch(`${BASE_URL}/api/field-work-asset-requests`, {
    method: "GET",
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function getFieldWorkAssetRequestById(id) {
  return fetch(`${BASE_URL}/api/field-work-asset-requests/${id}`, {
    method: "GET",
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function createFieldWorkAssetRequest(payload) {
  return fetch(`${BASE_URL}/api/field-work-asset-requests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function updateFieldWorkAssetRequest(id, payload) {
  return fetch(`${BASE_URL}/api/field-work-asset-requests/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

export function deleteFieldWorkAssetRequest(id) {
  return fetch(`${BASE_URL}/api/field-work-asset-requests/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then(checkResponse);
}
