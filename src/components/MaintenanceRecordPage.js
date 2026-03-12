import { useState, useEffect } from "react";
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from "../services/maintenanceRecordService";
import { getAssets } from "../services/assetService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";
import "./MaintenanceRecordPage.css";

const TYPE_OPTIONS = [
  { value: "PREVENTIVE", label: "Preventive" },
  { value: "CORRECTIVE", label: "Corrective" },
  { value: "INSPECTION", label: "Inspection" },
];
const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_FILTER_TABS = [
  { value: "", label: "All" },
  ...STATUS_OPTIONS,
];

const emptyForm = () => ({
  type: "PREVENTIVE",
  description: "",
  scheduledDate: "",
  completedDate: "",
  cost: "",
  status: "SCHEDULED",
  assetId: "",
});

const formatDate = (d) => (!d ? "—" : (typeof d === "string" ? d.split("T")[0] : String(d).slice(0, 10)));

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

const assetLabel = (a) => a?.name || a?.assetTag || a?.id || "—";

export default function MaintenanceRecordPage({ user, onDataChange, searchQuery }) {
  const [list, setList] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    getMaintenanceRecords()
      .then((data) => { setList(data); notify(data); })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();
    getAssets().then((a) => setAssets(a || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      type: row.type || "PREVENTIVE",
      description: row.description || "",
      scheduledDate: formatDate(row.scheduledDate) === "—" ? "" : formatDate(row.scheduledDate),
      completedDate: formatDate(row.completedDate) === "—" ? "" : formatDate(row.completedDate),
      cost: row.cost != null ? String(row.cost) : "",
      status: row.status || "SCHEDULED",
      assetId: row.asset?.id ?? "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setFormError(""); setDeleteConfirm(null); };

  const cancelDelete = () => setDeleteConfirm(null);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.assetId) { setFormError("Select an asset."); return; }
    setSaving(true);
    const payload = {
      type: form.type,
      description: form.description?.trim() || null,
      scheduledDate: form.scheduledDate?.trim() || null,
      completedDate: form.completedDate?.trim() || null,
      cost: form.cost ? parseFloat(form.cost) : null,
      status: form.status,
      asset: { id: form.assetId },
    };
    (editing ? updateMaintenanceRecord(editing.id, payload) : createMaintenanceRecord(payload))
      .then((saved) => {
        setList((prev) => (editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
        notify(editing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved]);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteMaintenanceRecord(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  const statusFiltered = statusFilter
    ? list.filter((row) => (row.status || "").toUpperCase() === statusFilter.toUpperCase())
    : list;
  const filteredList = filterListByQuery(statusFiltered, searchQuery, [
    "type",
    "description",
    "status",
    (r) => assetLabel(r.asset),
  ]);

  return (
    <>
      <div className="card maintenance-record-page">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Maintenance Record</button>
          </div>
        </div>
        <div className="maint-status-filter">
          <span className="maint-status-filter-label">Status:</span>
          <div className="maint-status-tabs" role="tablist">
            {STATUS_FILTER_TABS.map((tab) => {
              const count = !tab.value ? list.length : list.filter((r) => (r.status || "").toUpperCase() === tab.value.toUpperCase()).length;
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value || "all"}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`maint-status-tab ${isActive ? "maint-status-tab--active" : ""}`}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  <span className="maint-status-tab-label">{tab.label}</span>
                  <span className="maint-status-tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? <p className="entity-loading">Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Scheduled</th>
                  <th>Completed</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Asset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td><span className="entity-status">{row.type || "—"}</span></td>
                    <td style={{ maxWidth: 200 }}>{row.description || "—"}</td>
                    <td>{formatDate(row.scheduledDate)}</td>
                    <td>{formatDate(row.completedDate)}</td>
                    <td>{row.cost != null ? row.cost : "—"}</td>
                    <td><span className="entity-status">{row.status || "—"}</span></td>
                    <td>{assetLabel(row.asset)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconGear /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="entity-empty">
                      {statusFilter ? `No maintenance records with status "${STATUS_FILTER_TABS.find((t) => t.value === statusFilter)?.label || statusFilter}".` : "No maintenance records yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Maintenance Record" : "Add Maintenance Record"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              <div className="entity-form-grid">
                <div className="entity-field">
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="entity-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="entity-field">
                  <label>Scheduled date</label>
                  <input type="date" value={form.scheduledDate} onChange={(e) => handleChange("scheduledDate", e.target.value)} />
                </div>
                <div className="entity-field">
                  <label>Completed date</label>
                  <input type="date" value={form.completedDate} onChange={(e) => handleChange("completedDate", e.target.value)} />
                </div>
                <div className="entity-field">
                  <label>Cost</label>
                  <input type="number" step="any" value={form.cost} onChange={(e) => handleChange("cost", e.target.value)} />
                </div>
                <div className="entity-field entity-field--full">
                  <label>Asset *</label>
                  <select value={form.assetId} onChange={(e) => handleChange("assetId", e.target.value)} required>
                    <option value="">Select asset</option>
                    {assets.map((a) => <option key={a.id} value={a.id}>{assetLabel(a)}</option>)}
                  </select>
                </div>
                <div className="entity-field entity-field--full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
                </div>
              </div>
              <div className="entity-modal-footer">
                {editing && (
                  <button type="button" className="entity-btn entity-btn--danger" onClick={() => setDeleteConfirm(editing.id)}>
                    Delete
                  </button>
                )}
                <button type="button" className="entity-btn entity-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="entity-btn entity-btn--primary" disabled={saving}>{saving ? "Saving…" : editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={doDelete}
        title="Delete maintenance record?"
        message="Are you sure you want to delete this maintenance record? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Maintenance Record Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "type", label: "Type" }, { key: "description", label: "Description" }, { key: "scheduledDate", label: "Scheduled" }, { key: "completedDate", label: "Completed" }, { key: "cost", label: "Cost" }, { key: "status", label: "Status" }, { key: "asset", label: "Asset" }],
          rows: list.map((r) => ({ id: r.id, type: r.type || "—", description: (r.description || "—").slice(0, 60), scheduledDate: formatDate(r.scheduledDate), completedDate: formatDate(r.completedDate), cost: r.cost != null ? r.cost : "—", status: r.status || "—", asset: assetLabel(r.asset) })),
        })}
      />
    </>
  );
}
