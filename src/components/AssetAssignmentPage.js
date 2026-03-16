import { useState, useEffect } from "react";
import {
  getAssetAssignments,
  createAssetAssignment,
  updateAssetAssignment,
  deleteAssetAssignment,
} from "../services/assetAssignmentService";
import { getAssets } from "../services/assetService";
import { getEmployees } from "../services/employeeService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./AssetAssignmentPage.css";
import "./EntityPage.css";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "RETURNED", label: "Returned" },
  { value: "OVERDUE", label: "Overdue" },
];

const ASSIGNEE_TYPE = {
  PERSONNEL: "personnel",
  DEPARTMENT: "department",
};

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

const emptyForm = () => ({
  assignedDate: "",
  returnDate: "",
  status: "ACTIVE",
  assetId: "",
  assetIds: [],
  assigneeType: ASSIGNEE_TYPE.PERSONNEL,
  employeeId: "",
  assigneeDepartment: "",
});

const formatDate = (d) => {
  if (!d) return "—";
  if (typeof d === "string") return d.split("T")[0] || d;
  return "—";
};

const todayISO = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function AssetAssignmentPage({ user, onAssignmentsChange, searchQuery }) {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const notify = (list) => {
    if (typeof onAssignmentsChange === "function") onAssignmentsChange(list);
  };

  const loadAssignments = () => {
    setLoading(true);
    setError("");
    getAssetAssignments()
      .then((list) => {
        setAssignments(list);
        notify(list);
      })
      .catch((err) => setError(err.message || "Failed to load asset assignments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    loadAssignments();
    Promise.all([getAssets(), getEmployees()])
      .then(([assetList, employeeList]) => {
        setAssets(assetList || []);
        setEmployees(employeeList || []);
      })
      .catch(() => {});
  }, []);

  const openAdd = () => {
    setEditingAssignment(null);
    setForm({
      assignedDate: todayISO(),
      returnDate: addDaysISO(7),
      status: "ACTIVE",
      assetId: "",
      assetIds: [],
      assigneeType: ASSIGNEE_TYPE.PERSONNEL,
      employeeId: "",
      assigneeDepartment: "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditingAssignment(a);
    const assigneeType = a.employee?.id != null
      ? ASSIGNEE_TYPE.PERSONNEL
      : a.assigneeDepartment != null
        ? ASSIGNEE_TYPE.DEPARTMENT
        : ASSIGNEE_TYPE.PERSONNEL;
    setForm({
      assignedDate: formatDate(a.assignedDate) === "—" ? "" : formatDate(a.assignedDate),
      returnDate: formatDate(a.returnDate) === "—" ? "" : formatDate(a.returnDate),
      status: a.status || "ACTIVE",
      assetId: a.asset?.id ?? "",
      assetIds: a.asset?.id ? [a.asset.id] : [],
      assigneeType,
      employeeId: a.employee?.id ?? "",
      assigneeDepartment: a.assigneeDepartment ?? "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAssignment(null);
    setFormError("");
    setDeleteConfirm(null);
    setAlertMessage(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (form.assigneeType === ASSIGNEE_TYPE.PERSONNEL) {
      if (!form.assetId) {
        setFormError("Please select an asset.");
        return;
      }
      if (!form.employeeId) {
        setFormError("Please select personnel (employee).");
        return;
      }
    } else {
      const ids = Array.isArray(form.assetIds) ? form.assetIds : [];
      if (ids.length === 0) {
        setFormError("Please select at least one asset for the department.");
        return;
      }
      if (!form.assigneeDepartment) {
        setFormError("Please select a department.");
        return;
      }
    }
    const assignedDate = form.assignedDate?.trim() || todayISO();
    const returnDate = form.returnDate?.trim() || (editingAssignment ? null : addDaysISO(7));
    setSaving(true);
    // Edit flow or personnel assignment – single asset
    if (editingAssignment || form.assigneeType === ASSIGNEE_TYPE.PERSONNEL) {
      const payload = {
        assignedDate,
        returnDate: returnDate || null,
        status: form.status,
        asset: { id: form.assetId },
      };
      if (form.assigneeType === ASSIGNEE_TYPE.PERSONNEL && form.employeeId) {
        payload.employee = { id: form.employeeId };
      } else if (form.assigneeType === ASSIGNEE_TYPE.DEPARTMENT && form.assigneeDepartment) {
        payload.assigneeDepartment = form.assigneeDepartment;
      }
      (editingAssignment
        ? updateAssetAssignment(editingAssignment.id, payload)
        : createAssetAssignment(payload))
        .then((saved) => {
          const next = editingAssignment
            ? assignments.map((x) => (x.id === saved.id ? saved : x))
            : [...assignments, saved];
          setAssignments(next);
          notify(next);
          closeModal();
        })
        .catch((err) => {
          const msg = err.message || "Failed to save assignment";
          if (err.status === 409 || (msg && msg.toLowerCase().includes("already assigned"))) {
            setAlertMessage(msg);
            setFormError("");
          } else {
            setFormError(msg);
          }
        })
        .finally(() => setSaving(false));
      return;
    }

    // New department assignment – multi-asset create
    const deptIds = Array.isArray(form.assetIds) ? form.assetIds : [];
    const basePayload = {
      assignedDate,
      returnDate: returnDate || null,
      status: form.status,
      assigneeDepartment: form.assigneeDepartment,
    };
    Promise.all(
      deptIds.map((id) =>
        createAssetAssignment({
          ...basePayload,
          asset: { id },
        }),
      ),
    )
      .then((savedList) => {
        const next = [...assignments, ...savedList];
        setAssignments(next);
        notify(next);
        closeModal();
      })
      .catch((err) => {
        const msg =
          err && err.message
            ? err.message
            : "One or more selected assets are already assigned and must be returned before assigning again.";
        setAlertMessage(msg);
        setFormError("");
      })
      .finally(() => setSaving(false));
  };

  const requestDelete = () => setDeleteConfirm(editingAssignment?.id ?? null);
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteAssetAssignment(deleteConfirm)
      .then(() => {
        const next = assignments.filter((x) => x.id !== deleteConfirm);
        setAssignments(next);
        notify(next);
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete assignment"));
  };

  const assetLabel = (asset) => asset?.name || asset?.assetTag || asset?.id || "—";
  const employeeLabel = (emp) => {
    if (!emp) return "—";
    if (emp.firstName || emp.lastName) return [emp.firstName, emp.lastName].filter(Boolean).join(" ");
    return emp.employeeNumber || emp.email || emp.id || "—";
  };
  const assigneeLabel = (a) => {
    if (a.employee?.id != null) return employeeLabel(a.employee);
    if (a.assigneeDepartment) return `Department: ${a.assigneeDepartment}`;
    return "—";
  };

  const filteredAssignments = filterListByQuery(assignments, searchQuery, [
    "status",
    (a) => assetLabel(a.asset),
    (a) => assigneeLabel(a),
    (a) => a.assigneeDepartment,
  ]);

  return (
    <>
      <div className="card">
        <div className="assignment-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="assignment-add-btn" onClick={openAdd}>
              Add Assignment
            </button>
          </div>
        </div>
        {error && <p className="assignment-error">{error}</p>}
        {loading ? (
          <p className="assignment-loading">Loading asset assignments…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Assigned date</th>
                  <th>Return date</th>
                  <th>Status</th>
                  <th>Asset</th>
                  <th>Assigned to</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="t-row">
                    <td className="td-id">{a.id}</td>
                    <td>{formatDate(a.assignedDate)}</td>
                    <td>{formatDate(a.returnDate)}</td>
                    <td>
                      <span className={`assignment-status assignment-status--${(a.status || "").toLowerCase()}`}>
                        {a.status || "—"}
                      </span>
                    </td>
                    <td>{assetLabel(a.asset)}</td>
                    <td>{assigneeLabel(a)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(a)}
                        >
                          <IconEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAssignments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="assignment-empty">
                      No assignments yet. Click &quot;Add Assignment&quot; to create one.
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
                {editingAssignment ? "Edit Assignment" : "Add Assignment"}
              </h2>
              <button type="button" className="assignment-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="assignment-modal-body">
              {formError && <p className="assignment-error">{formError}</p>}
              <div className="assignment-form-grid">
                <div className="assignment-field assignment-field--full">
                  <label className="assignment-label-block">Assign to</label>
                  <div className="assignee-toggle">
                    <div className="assignee-toggle-track">
                      <div
                        className="assignee-toggle-thumb"
                        style={{ transform: form.assigneeType === ASSIGNEE_TYPE.DEPARTMENT ? "translateX(100%)" : "translateX(0)" }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        className={`assignee-toggle-option ${form.assigneeType === ASSIGNEE_TYPE.PERSONNEL ? "assignee-toggle-option--active" : ""}`}
                        onClick={() => handleFormChange("assigneeType", ASSIGNEE_TYPE.PERSONNEL)}
                      >
                        <span className="assignee-toggle-icon assignee-toggle-icon--personnel" aria-hidden>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <span className="assignee-toggle-label">Personnel</span>
                        <span className="assignee-toggle-desc">Assign to an employee</span>
                      </button>
                      <button
                        type="button"
                        className={`assignee-toggle-option ${form.assigneeType === ASSIGNEE_TYPE.DEPARTMENT ? "assignee-toggle-option--active" : ""}`}
                        onClick={() => handleFormChange("assigneeType", ASSIGNEE_TYPE.DEPARTMENT)}
                      >
                        <span className="assignee-toggle-icon assignee-toggle-icon--dept" aria-hidden>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </span>
                        <span className="assignee-toggle-label">Department</span>
                        <span className="assignee-toggle-desc">Assign to a department</span>
                      </button>
                    </div>
                  </div>
                </div>
                {form.assigneeType === ASSIGNEE_TYPE.PERSONNEL ? (
                  <div className="assignment-field assignment-field--full">
                    <label htmlFor="assignment-employee">Personnel (Employee) *</label>
                    <select
                      id="assignment-employee"
                      value={form.employeeId}
                      onChange={(e) => handleFormChange("employeeId", e.target.value)}
                      required={form.assigneeType === ASSIGNEE_TYPE.PERSONNEL}
                    >
                      <option value="">Select employee</option>
                      {employees.filter((e) => e.status === "ACTIVE" || !e.status).map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {employeeLabel(emp)}
                          {emp.employeeNumber ? ` (${emp.employeeNumber})` : ""}
                          {emp.department ? ` · ${emp.department}` : ""}
                        </option>
                      ))}
                    </select>
                    {employees.length === 0 && (
                      <span className="entity-field-hint">No employees yet. Add employees first to assign to personnel.</span>
                    )}
                  </div>
                ) : (
                  <div className="assignment-field assignment-field--full">
                    <label htmlFor="assignment-department">Department *</label>
                    <select
                      id="assignment-department"
                      value={form.assigneeDepartment}
                      onChange={(e) => handleFormChange("assigneeDepartment", e.target.value)}
                      required={form.assigneeType === ASSIGNEE_TYPE.DEPARTMENT}
                    >
                      <option value="">Select department</option>
                      {DEPARTMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="entity-field-hint">Asset will be assigned to the department (shared use).</span>
                  </div>
                )}
                <div className="assignment-field">
                  <label htmlFor="assignment-assigned-date">Assigned date</label>
                  <input
                    id="assignment-assigned-date"
                    type="date"
                    value={form.assignedDate}
                    onChange={(e) => handleFormChange("assignedDate", e.target.value)}
                  />
                  {!editingAssignment && (
                    <span className="entity-field-hint">Default: today</span>
                  )}
                </div>
                <div className="assignment-field">
                  <label htmlFor="assignment-return-date">Return date</label>
                  <input
                    id="assignment-return-date"
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => handleFormChange("returnDate", e.target.value)}
                  />
                  {!editingAssignment && (
                    <span className="entity-field-hint">Default: 7 days from today</span>
                  )}
                </div>
                <div className="assignment-field">
                  <label htmlFor="assignment-status">Status</label>
                  <select
                    id="assignment-status"
                    value={form.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {form.assigneeType === ASSIGNEE_TYPE.DEPARTMENT && !editingAssignment ? (
                  <div className="assignment-field assignment-field--full">
                    <label>Assets for department *</label>
                    <div className="assignment-asset-multi">
                      {assets.map((asset) => {
                        const checked =
                          Array.isArray(form.assetIds) && form.assetIds.includes(asset.id);
                        return (
                          <label
                            key={asset.id}
                            className={`assignment-asset-pill${
                              checked ? " assignment-asset-pill--selected" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={asset.id}
                              checked={checked}
                              onChange={(e) => {
                                const id = e.target.value;
                                const isChecked = e.target.checked;
                                setForm((prev) => {
                                  const prevIds = Array.isArray(prev.assetIds)
                                    ? prev.assetIds
                                    : [];
                                  return {
                                    ...prev,
                                    assetIds: isChecked
                                      ? [...prevIds, id]
                                      : prevIds.filter((x) => x !== id),
                                  };
                                });
                              }}
                            />
                            <span className="assignment-asset-pill-main">
                              {assetLabel(asset)}
                            </span>
                          </label>
                        );
                      })}
                      {assets.length === 0 && (
                        <span className="entity-field-hint">
                          No assets available to assign to this department.
                        </span>
                      )}
                    </div>
                    <span className="entity-field-hint">
                      Select one or more assets to assign to the department.
                    </span>
                  </div>
                ) : (
                  <div className="assignment-field assignment-field--full">
                    <label htmlFor="assignment-asset">Asset *</label>
                    <select
                      id="assignment-asset"
                      value={form.assetId}
                      onChange={(e) => handleFormChange("assetId", e.target.value)}
                      required
                    >
                      <option value="">Select asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {assetLabel(asset)}
                        </option>
                      ))}
                    </select>
                    <span className="entity-field-hint">
                      An asset already assigned (not returned) cannot be assigned to another until
                      returned.
                    </span>
                  </div>
                )}
              </div>
              <div className="assignment-modal-footer">
                {editingAssignment && (
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
                  {saving ? "Saving…" : editingAssignment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="assignment-alert-overlay" onClick={() => setAlertMessage(null)}>
          <div className="assignment-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-alert-icon-wrap">
              <svg className="assignment-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="assignment-alert-title">Cannot assign asset</h3>
            <p className="assignment-alert-message">{alertMessage}</p>
            <div className="assignment-alert-actions">
              <button type="button" className="assignment-btn assignment-btn--primary" onClick={() => setAlertMessage(null)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete assignment?"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Asset Assignment Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "assignedDate", label: "Assigned date" }, { key: "returnDate", label: "Return date" }, { key: "status", label: "Status" }, { key: "asset", label: "Asset" }, { key: "assignedTo", label: "Assigned to" }],
          rows: assignments.map((a) => ({ id: a.id, assignedDate: formatDate(a.assignedDate), returnDate: formatDate(a.returnDate), status: a.status || "—", asset: assetLabel(a.asset), assignedTo: assigneeLabel(a) })),
        })}
      />
    </>
  );
}
