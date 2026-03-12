/**
 * Employee API service - /api/employees
 */

import { BASE_URL, getHeaders, checkResponse } from './apiClient';

/**
 * GET /api/employees - List all employees.
 * @returns {Promise<Array>} List of Employee
 */
export function getEmployees() {
  return fetch(`${BASE_URL}/api/employees`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * GET /api/employees/:id
 * @param {string|number} id - Employee id (Long)
 * @returns {Promise<Object>} Employee
 */
export function getEmployeeById(id) {
  return fetch(`${BASE_URL}/api/employees/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * POST /api/employees - Create employee.
 * @param {Object} employee - employeeNumber, firstName, lastName, email?, phone?, department, status?, user?: { id }
 * @returns {Promise<Object>} Created Employee (201)
 */
export function createEmployee(employee) {
  return fetch(`${BASE_URL}/api/employees`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(employee),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * PUT /api/employees/:id - Update employee.
 * @param {string|number} id - Employee id (Long)
 * @param {Object} employee - fields to update
 * @returns {Promise<Object>} Updated Employee
 */
export function updateEmployee(id, employee) {
  return fetch(`${BASE_URL}/api/employees/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(employee),
  })
    .then(checkResponse)
    .then((r) => r.json());
}

/**
 * DELETE /api/employees/:id - Delete employee.
 * @param {string|number} id - Employee id (Long)
 * @returns {Promise<void>} 204 No Content
 */
export function deleteEmployee(id) {
  return fetch(`${BASE_URL}/api/employees/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(checkResponse);
}
