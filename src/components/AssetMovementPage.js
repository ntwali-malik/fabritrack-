import { useState, useEffect } from "react";
import {
  getAssetMovements,
  createAssetMovement,
  updateAssetMovement,
  deleteAssetMovement,
} from "../services/assetMovementService";
import { getAssets } from "../services/assetService";
import { getEmployees } from "../services/employeeService";
import { getAssignedAssetsForMovement } from "../services/assetAssignmentService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";
import "./AssetAssignmentPage.css";

const MOVE_TYPE = {
  ASSET: "asset",
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
  moveType: MOVE_TYPE.ASSET,
  fromLocationName: "",
  toLocationName: "",
  movedAt: "",
  reason: "",
  assetId: "",
  assetIds: [],
  employeeId: "",
  assigneeDepartment: "",
});

const formatDateTime = (d) => {
  if (!d) return "—";
  const s = typeof d === "string" ? d : String(d);
  return s.slice(0, 19).replace("T", " ");
};

const IconGear = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const assetLabel = (a) => (a && (a.name || a.assetTag || a.id)) || "—";
const employeeLabel = (emp) => {
  if (!emp) return "—";
  if (emp.firstName || emp.lastName) return [emp.firstName, emp.lastName].filter(Boolean).join(" ");
  return emp.employeeNumber || emp.email || emp.id || "—";
};

export default function AssetMovementPage({ user, onDataChange, searchQuery }) {
  const [list, setList] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [assignedAssignments, setAssignedAssignments] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    getAssetMovements()
      .then((data) => { setList(data); notify(data); })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();
    Promise.all([getAssets(), getEmployees()])
      .then(([a, e]) => {
        setAssets(a || []);
        setEmployees(e || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    if (form.moveType === MOVE_TYPE.PERSONNEL && form.employeeId) {
      setLoadingAssigned(true);
      setAssignedAssignments([]);
      getAssignedAssetsForMovement({ employeeId: Number(form.employeeId) })
        .then((data) => setAssignedAssignments(Array.isArray(data) ? data : []))
        .catch(() => setAssignedAssignments([]))
        .finally(() => setLoadingAssigned(false));
    } else if (form.moveType === MOVE_TYPE.DEPARTMENT && form.assigneeDepartment) {
      setLoadingAssigned(true);
      setAssignedAssignments([]);
      getAssignedAssetsForMovement({ assigneeDepartment: form.assigneeDepartment })
        .then((data) => setAssignedAssignments(Array.isArray(data) ? data : []))
        .catch(() => setAssignedAssignments([]))
        .finally(() => setLoadingAssigned(false));
    } else {
      setAssignedAssignments([]);
    }
  }, [modalOpen, form.moveType, form.employeeId, form.assigneeDepartment]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setAssignedAssignments([]);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      ...emptyForm(),
      moveType: MOVE_TYPE.ASSET,
      fromLocationName: row.fromLocationName || "",
      toLocationName: row.toLocationName || "",
      movedAt: row.movedAt ? String(row.movedAt).slice(0, 19) : "",
      reason: row.reason || "",
      assetId: row.asset?.id ?? "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setAssignedAssignments([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError("");
    setDeleteConfirm(null);
    setAssignedAssignments([]);
  };

  const cancelDelete = () => setDeleteConfirm(null);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (field === "moveType") {
      setForm((p) => ({ ...p, employeeId: "", assigneeDepartment: "", assetIds: [], assetId: "" }));
    }
    if (field === "employeeId" || field === "assigneeDepartment") {
      setForm((p) => ({ ...p, assetIds: [] }));
    }
  };

  const toggleAssetId = (assetId) => {
    setForm((prev) => {
      const ids = Array.isArray(prev.assetIds) ? prev.assetIds : [];
      const has = ids.includes(assetId);
      return { ...prev, assetIds: has ? ids.filter((x) => x !== assetId) : [...ids, assetId] };
    });
  };

  const filteredList = filterListByQuery(list, searchQuery, [
    "fromLocationName",
    "toLocationName",
    "reason",
    (r) => assetLabel(r.asset),
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    const from = form.fromLocationName?.trim();
    const to = form.toLocationName?.trim();
    if (!from) { setFormError("From location is required."); return; }
    if (!to) { setFormError("To location is required."); return; }

    const basePayload = {
      fromLocationName: from,
      toLocationName: to,
      movedAt: form.movedAt || null,
      reason: form.reason?.trim() || null,
    };

    if (editing) {
      if (!form.assetId) { setFormError("Select an asset."); return; }
      setSaving(true);
      updateAssetMovement(editing.id, { ...basePayload, asset: { id: form.assetId } })
        .then((saved) => {
          setList((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          notify(list.map((x) => (x.id === saved.id ? saved : x)));
          closeModal();
        })
        .catch((err) => setFormError(err.message || "Failed to update"))
        .finally(() => setSaving(false));
      return;
    }

    if (form.moveType === MOVE_TYPE.ASSET) {
      if (!form.assetId) { setFormError("Select an asset."); return; }
      setSaving(true);
      createAssetMovement({ ...basePayload, asset: { id: form.assetId } })
        .then((saved) => {
          setList((prev) => [...prev, saved]);
          notify([...list, saved]);
          closeModal();
        })
        .catch((err) => setFormError(err.message || "Failed to create movement"))
        .finally(() => setSaving(false));
      return;
    }

    const assetIds = Array.isArray(form.assetIds) ? form.assetIds : [];
    if (assetIds.length === 0) {
      setFormError(form.moveType === MOVE_TYPE.PERSONNEL
        ? "Select at least one assigned asset to move."
        : "Select at least one assigned asset to move.");
      return;
    }

    setSaving(true);
    Promise.all(
      assetIds.map((assetId) => createAssetMovement({ ...basePayload, asset: { id: assetId } })),
    )
      .then((savedList) => {
        setList((prev) => [...prev, ...savedList]);
        notify([...list, ...savedList]);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to create one or more movements"))
      .finally(() => setSaving(false));
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteAssetMovement(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  const isAssetMode = form.moveType === MOVE_TYPE.ASSET;
  const isPersonnelMode = form.moveType === MOVE_TYPE.PERSONNEL;
  const isDepartmentMode = form.moveType === MOVE_TYPE.DEPARTMENT;
  const showSingleAsset = isAssetMode || editing;

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Movement</button>
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? (
          <p className="entity-loading">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Moved at</th>
                  <th>Reason</th>
                  <th>Asset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{row.fromLocationName || "—"}</td>
                    <td>{row.toLocationName || "—"}</td>
                    <td>{formatDateTime(row.movedAt)}</td>
                    <td>{row.reason || "—"}</td>
                    <td>{assetLabel(row.asset)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconGear /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && (
                  <tr><td colSpan={7} className="entity-empty">No movements yet. Click &quot;Add Movement&quot; to create one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Movement" : "Add Movement"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}

              {!editing && (
                <div className="assignment-field assignment-field--full" style={{ marginBottom: 16 }}>
                  <label className="assignment-label-block">Move by</label>
                  <div className="assignee-toggle">
                    <div className="assignee-toggle-track">
                      <div
                        className="assignee-toggle-thumb"
                        style={{
                          width: "calc(33.333% - 6px)",
                          transform: isPersonnelMode ? "translateX(100%)" : isDepartmentMode ? "translateX(200%)" : "translateX(0)",
                        }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        className={`assignee-toggle-option ${isAssetMode ? "assignee-toggle-option--active" : ""}`}
                        onClick={() => handleChange("moveType", MOVE_TYPE.ASSET)}
                      >
                        <span className="assignee-toggle-icon assignee-toggle-icon--personnel" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                          </svg>
                        </span>
                        <span className="assignee-toggle-label">Asset</span>
                        <span className="assignee-toggle-desc">Any asset</span>
                      </button>
                      <button
                        type="button"
                        className={`assignee-toggle-option ${isPersonnelMode ? "assignee-toggle-option--active" : ""}`}
                        onClick={() => handleChange("moveType", MOVE_TYPE.PERSONNEL)}
                      >
                        <span className="assignee-toggle-icon assignee-toggle-icon--personnel" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <span className="assignee-toggle-label">Personnel</span>
                        <span className="assignee-toggle-desc">Employee&apos;s assigned assets</span>
                      </button>
                      <button
                        type="button"
                        className={`assignee-toggle-option ${isDepartmentMode ? "assignee-toggle-option--active" : ""}`}
                        onClick={() => handleChange("moveType", MOVE_TYPE.DEPARTMENT)}
                      >
                        <span className="assignee-toggle-icon assignee-toggle-icon--dept" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </span>
                        <span className="assignee-toggle-label">Department</span>
                        <span className="assignee-toggle-desc">Department&apos;s assigned assets</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isPersonnelMode && !editing && (
                <div className="assignment-field assignment-field--full" style={{ marginBottom: 12 }}>
                  <label htmlFor="movement-employee">Employee *</label>
                  <select
                    id="movement-employee"
                    value={form.employeeId}
                    onChange={(e) => handleChange("employeeId", e.target.value)}
                  >
                    <option value="">Select employee</option>
                    {(employees || []).filter((e) => e.status === "ACTIVE" || !e.status).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {employeeLabel(emp)}
                        {emp.employeeNumber ? ` (${emp.employeeNumber})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isDepartmentMode && !editing && (
                <div className="assignment-field assignment-field--full" style={{ marginBottom: 12 }}>
                  <label htmlFor="movement-department">Department *</label>
                  <select
                    id="movement-department"
                    value={form.assigneeDepartment}
                    onChange={(e) => handleChange("assigneeDepartment", e.target.value)}
                  >
                    <option value="">Select department</option>
                    {DEPARTMENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {(isPersonnelMode || isDepartmentMode) && !editing && (form.employeeId || form.assigneeDepartment) && (
                <div className="assignment-field assignment-field--full" style={{ marginBottom: 16 }}>
                  <label>Assigned assets to move *</label>
                  {loadingAssigned ? (
                    <p className="entity-field-hint">Loading assigned assets…</p>
                  ) : assignedAssignments.length === 0 ? (
                    <p className="entity-field-hint">No assigned assets for this selection. Assign assets first from the Assignments page.</p>
                  ) : (
                    <div className="assignment-asset-multi">
                      {assignedAssignments.map((a) => {
                        const asset = a.asset;
                        if (!asset || !asset.id) return null;
                        const checked = Array.isArray(form.assetIds) && form.assetIds.includes(asset.id);
                        return (
                          <label
                            key={a.id}
                            className={`assignment-asset-pill${checked ? " assignment-asset-pill--selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAssetId(asset.id)}
                            />
                            <span className="assignment-asset-pill-main">{assetLabel(asset)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="entity-form-grid">
                <div className="entity-field">
                  <label htmlFor="movement-from">From location *</label>
                  <input id="movement-from" type="text" value={form.fromLocationName} onChange={(e) => handleChange("fromLocationName", e.target.value)} required />
                </div>
                <div className="entity-field">
                  <label htmlFor="movement-to">To location *</label>
                  <input id="movement-to" type="text" value={form.toLocationName} onChange={(e) => handleChange("toLocationName", e.target.value)} required />
                </div>
                <div className="entity-field">
                  <label htmlFor="movement-movedAt">Moved at</label>
                  <input id="movement-movedAt" type="datetime-local" value={form.movedAt} onChange={(e) => handleChange("movedAt", e.target.value)} />
                </div>
                <div className="entity-field">
                  <label htmlFor="movement-reason">Reason</label>
                  <input id="movement-reason" type="text" value={form.reason} onChange={(e) => handleChange("reason", e.target.value)} />
                </div>
                {showSingleAsset && (
                  <div className="entity-field entity-field--full">
                    <label htmlFor="movement-asset">Asset *</label>
                    <select id="movement-asset" value={form.assetId} onChange={(e) => handleChange("assetId", e.target.value)} required={showSingleAsset}>
                      <option value="">Select asset</option>
                      {assets.map((a) => <option key={a.id} value={a.id}>{assetLabel(a)}</option>)}
                    </select>
                    {isAssetMode && !editing && (
                      <span className="entity-field-hint">Move any asset (assigned or unassigned).</span>
                    )}
                  </div>
                )}
              </div>

              <div className="entity-modal-footer">
                {editing && (
                  <button type="button" className="entity-btn entity-btn--danger" onClick={() => setDeleteConfirm(editing.id)}>
                    Delete
                  </button>
                )}
                <button type="button" className="entity-btn entity-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="entity-btn entity-btn--primary" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Update"
                      : (isPersonnelMode || isDepartmentMode) && (form.assetIds || []).length > 0
                        ? `Move ${form.assetIds.length} asset(s)`
                        : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={doDelete}
        title="Delete movement?"
        message="Are you sure you want to delete this movement? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Asset Movement Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "fromLocationName", label: "From" }, { key: "toLocationName", label: "To" }, { key: "movedAt", label: "Moved at" }, { key: "reason", label: "Reason" }, { key: "asset", label: "Asset" }],
          rows: list.map((r) => ({ id: r.id, fromLocationName: r.fromLocationName || "—", toLocationName: r.toLocationName || "—", movedAt: formatDateTime(r.movedAt), reason: r.reason || "—", asset: assetLabel(r.asset) })),
        })}
      />
    </>
  );
}
