/**
 * Shared API client for FabriTrack backend.
 * Base URL: REACT_APP_API_BASE_URL in .env (e.g. http://localhost:8080) or same origin.
 * In development, defaults to http://localhost:8080 when env is not set.
 */

const envBase = process.env.REACT_APP_API_BASE_URL;
export const BASE_URL =
  envBase && envBase.trim() !== ''
    ? envBase.trim().replace(/\/$/, '')
    : (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function getHeaders(includeAuth = true, contentType = 'application/json') {
  const h = {
    ...(contentType && { 'Content-Type': contentType }),
  };
  if (includeAuth && authToken) {
    h['Authorization'] = `Bearer ${authToken}`;
  }
  return h;
}

export function checkResponse(res) {
  if (!res.ok) {
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
  return res;
}
