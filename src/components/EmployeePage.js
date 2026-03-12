import { useState, useEffect } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employeeService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./AssetAssignmentPage.css";
import "./EntityPage.css";

const DEPARTMENT_OPTIONS = [
  { value: "HR", label: "HR" },
  { value: "IT", label: "IT" },
  { value: "FINANCE", label: "Finance" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "MARKETING", label: "Marketing" },
  { value: "LEGAL", label: "Legal" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "SECURITY", label: "Security" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "TERMINATED", label: "Terminated" },
];

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "IT",
  status: "ACTIVE",
});

const IconGear = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function employeeLabel(emp) {
  if (!emp) return "—";
  if (emp.firstName || emp.lastName) return [emp.firstName, emp.lastName].filter(Boolean).join(" ");
  return emp.employeeNumber || emp.email || emp.id || "—";
}

export default function EmployeePage({ user, onEmployeesChange, searchQuery }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (list) => {
    if (typeof onEmployeesChange === "function") onEmployeesChange(list);
  };

  useEffect(() => {
    notify(undefined);
    setLoading(true);
    setError("");
    getEmployees()
      .then((list) => {
        setEmployees(list || []);
        notify(list || []);
      })
      .catch((err) => setError(err.message || "Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditingEmployee(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department || "IT",
      status: emp.status || "ACTIVE",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEmployee(null);
    setFormError("");
    setDeleteConfirm(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      setFormError("First name and last name are required.");
      return;
    }
    if (!form.department) {
      setFormError("Department is required.");
      return;
    }
    setSaving(true);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      department: form.department,
      status: form.status || "ACTIVE",
    };
    (editingEmployee
      ? updateEmployee(editingEmployee.id, payload)
      : createEmployee(payload))
      .then((saved) => {
        const next = editingEmployee
          ? employees.map((x) => (x.id === saved.id ? saved : x))
          : [...employees, saved];
        setEmployees(next);
        notify(next);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save employee"))
      .finally(() => setSaving(false));
  };

  const requestDelete = () => setDeleteConfirm(editingEmployee?.id ?? null);
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteEmployee(deleteConfirm)
      .then(() => {
        const next = employees.filter((x) => x.id !== deleteConfirm);
        setEmployees(next);
        notify(next);
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete employee"));
  };

  const filteredEmployees = filterListByQuery(employees, searchQuery, [
    "employeeNumber",
    "firstName",
    "lastName",
    "email",
    "department",
    "status",
  ]);

  return (
    <>
      <div className="card">
        <div className="assignment-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="assignment-add-btn" onClick={openAdd}>
              Add Employee
            </button>
          </div>
        </div>
        {error && <p className="assignment-error">{error}</p>}
        {loading ? (
          <p className="assignment-loading">Loading employees…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee #</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="t-row">
                    <td className="td-id">{emp.id}</td>
                    <td>{emp.employeeNumber || "—"}</td>
                    <td>{employeeLabel(emp)}</td>
                    <td>{emp.department || "—"}</td>
                    <td>
                      <span className={`assignment-status assignment-status--${(emp.status || "").toLowerCase()}`}>
                        {emp.status || "—"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(emp)}
                        >
                          <IconGear />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="assignment-empty">
                      No employees yet. Click &quot;Add Employee&quot; to create one. Employees can be assigned assets as personnel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="assignment-modal-overlay" onClick={closeModal}>
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h2 className="assignment-modal-title">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h2>
              <button type="button" className="assignment-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="assignment-modal-body">
              {formError && <p className="assignment-error">{formError}</p>}
              <div className="assignment-form-grid">
                {editingEmployee && (
                  <div className="assignment-field assignment-field--full">
                    <label>Employee number</label>
                    <p className="assignment-readonly-value" aria-readonly>{editingEmployee.employeeNumber || "—"}</p>
                    <span className="entity-field-hint">Auto-generated; cannot be changed.</span>
                  </div>
                )}
                {!editingEmployee && (
                  <div className="assignment-field assignment-field--full">
                    <span className="entity-field-hint">Employee number will be auto-generated (e.g. EMP00001) when you save.</span>
                  </div>
                )}
                <div className="assignment-field">
                  <label htmlFor="emp-status">Status</label>
                  <select
                    id="emp-status"
                    value={form.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="assignment-field">
                  <label htmlFor="emp-first">First name *</label>
                  <input
                    id="emp-first"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                  />
                </div>
                <div className="assignment-field">
                  <label htmlFor="emp-last">Last name *</label>
                  <input
                    id="emp-last"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                  />
                </div>
                <div className="assignment-field assignment-field--full">
                  <label htmlFor="emp-dept">Department *</label>
                  <select
                    id="emp-dept"
                    value={form.department}
                    onChange={(e) => handleFormChange("department", e.target.value)}
                  >
                    {DEPARTMENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="assignment-field assignment-field--full">
                  <label htmlFor="emp-email">Email</label>
                  <input
                    id="emp-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                  />
                </div>
                <div className="assignment-field assignment-field--full">
                  <label htmlFor="emp-phone">Phone</label>
                  <input
                    id="emp-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="assignment-modal-footer">
                {editingEmployee && (
                  <button
                    type="button"
                    className="assignment-btn assignment-btn--danger"
                    onClick={requestDelete}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="assignment-btn assignment-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="assignment-btn assignment-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingEmployee ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete employee?"
        message="Are you sure you want to delete this employee? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Employee Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [
            { key: "id", label: "ID" },
            { key: "employeeNumber", label: "Employee #" },
            { key: "name", label: "Name" },
            { key: "department", label: "Department" },
            { key: "status", label: "Status" },
          ],
          rows: employees.map((e) => ({
            id: e.id,
            employeeNumber: e.employeeNumber || "—",
            name: employeeLabel(e),
            department: e.department || "—",
            status: e.status || "—",
          })),
        })}
      />
    </>
  );
}
