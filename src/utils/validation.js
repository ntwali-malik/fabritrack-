/**
 * Centralized form validation helpers.
 * Each validator returns an error message string or null if valid.
 */

/**
 * Check that a required value is present (non-empty after trim).
 * @param {string} value - Raw input value
 * @param {string} [fieldName='This field'] - Name used in error message
 * @returns {string|null} Error message or null
 */
export function required(value, fieldName = "This field") {
  if (value == null) return `${fieldName} is required.`;
  const s = String(value).trim();
  return s.length === 0 ? `${fieldName} is required.` : null;
}

/**
 * Check that value looks like a valid email.
 * @param {string} value
 * @param {string} [fieldName='Email']
 * @returns {string|null}
 */
export function email(value, fieldName = "Email") {
  const err = required(value, fieldName);
  if (err) return err;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(value).trim()) ? null : `${fieldName} must be a valid email address.`;
}

/**
 * Check minimum string length (after trim).
 * @param {string} value
 * @param {number} min
 * @param {string} [fieldName='Field']
 * @returns {string|null}
 */
export function minLength(value, min, fieldName = "Field") {
  if (value == null) return `${fieldName} is required.`;
  const s = String(value).trim();
  if (s.length === 0) return `${fieldName} is required.`;
  return s.length >= min ? null : `${fieldName} must be at least ${min} characters.`;
}

/**
 * Check maximum string length.
 * @param {string} value
 * @param {number} max
 * @param {string} [fieldName='Field']
 * @returns {string|null}
 */
export function maxLength(value, max, fieldName = "Field") {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length <= max ? null : `${fieldName} must be at most ${max} characters.`;
}

/**
 * Validate that end date is not before start date (YYYY-MM-DD strings or Date).
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @param {string} [startLabel='Start date']
 * @param {string} [endLabel='End date']
 * @returns {string|null} Error message or null
 */
export function dateRange(startDate, endDate, startLabel = "Start date", endLabel = "End date") {
  if (!startDate || !endDate) return null; // required() handles presence
  const start = typeof startDate === "string" ? new Date(startDate.trim()) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate.trim()) : endDate;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return end < start ? `${endLabel} must be on or after ${startLabel}.` : null;
}

/**
 * Run multiple validators; return first error or null.
 * @param {Array<() => string|null>} validators - Functions that return error or null
 * @returns {string|null}
 */
export function firstError(validators) {
  for (const fn of validators) {
    const err = fn();
    if (err) return err;
  }
  return null;
}

/**
 * Filter a list by a search query (case-insensitive substring match on given string fields).
 * @param {Array<Object>} list - Array of objects
 * @param {string} query - Search string (trimmed; empty = no filter)
 * @param {Array<string|(item => string)>} fields - Keys to search, or getter functions
 * @returns {Array<Object>} Filtered list
 */
export function filterListByQuery(list, query, fields) {
  if (!Array.isArray(list)) return [];
  const q = (query && String(query).trim()) || "";
  if (q.length === 0) return list;
  const lower = q.toLowerCase();
  return list.filter((item) => {
    return fields.some((field) => {
      const val = typeof field === "function" ? field(item) : item[field];
      return val != null && String(val).toLowerCase().includes(lower);
    });
  });
}
