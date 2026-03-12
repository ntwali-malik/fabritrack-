import { useState, useEffect } from "react";
import {
  getDepreciationRecords,
  createDepreciationRecord,
  updateDepreciationRecord,
  deleteDepreciationRecord,
} from "../services/depreciationRecordService";
import { getAssets } from "../services/assetService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";

const METHOD_OPTIONS = [
  { value: "STRAIGHT_LINE", label: "Straight line" },
  { value: "DECLINING_BALANCE", label: "Declining balance" },
];

const emptyForm = () => ({
  year: "",
  method: "STRAIGHT_LINE",
  assetId: "",
});

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

export default function DepreciationRecordPage({ user, onDataChange, searchQuery }) {
  const [list, setList] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    getDepreciationRecords()
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
      year: row.year != null ? String(row.year) : "",
      method: row.method || "STRAIGHT_LINE",
      assetId: row.asset?.id != null ? String(row.asset.id) : "",
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
    if (!form.year?.trim()) { setFormError("Year is required."); return; }
    if (!editing && !form.assetId) { setFormError("Select an asset."); return; }
    setSaving(true);
    if (editing) {
      const payload = {
        year: parseInt(form.year, 10),
        method: form.method,
      };
      updateDepreciationRecord(editing.id, payload)
        .then((saved) => {
          setList((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          notify(list.map((x) => (x.id === saved.id ? saved : x)));
          closeModal();
        })
        .catch((e) => setFormError(e.message || "Failed to save"))
        .finally(() => setSaving(false));
    } else {
      const payload = {
        assetId: form.assetId,
        year: parseInt(form.year, 10),
        method: form.method || undefined,
      };
      createDepreciationRecord(payload)
        .then((saved) => {
          setList((prev) => [...prev, saved]);
          notify([...list, saved]);
          closeModal();
        })
        .catch((e) => setFormError(e.message || "Failed to save"))
        .finally(() => setSaving(false));
    }
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteDepreciationRecord(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  const filteredList = filterListByQuery(list, searchQuery, ["year", "method", (r) => assetLabel(r.asset)]);

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Depreciation Record</button>
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? <p className="entity-loading">Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Year</th>
                  <th>Method</th>
                  <th>Depreciation</th>
                  <th>Remaining value</th>
                  <th>Asset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{row.year != null ? row.year : "—"}</td>
                    <td><span className="entity-status">{row.method || "—"}</span></td>
                    <td>{row.depreciationAmount != null ? row.depreciationAmount : "—"}</td>
                    <td>{row.remainingValue != null ? row.remainingValue : "—"}</td>
                    <td>{assetLabel(row.asset)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconGear /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && <tr><td colSpan={7} className="entity-empty">No depreciation records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Depreciation Record" : "Add Depreciation Record"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              {editing && (
                <p className="entity-toolbar-desc" style={{ marginBottom: 12 }}>
                  Depreciation amount and remaining value are calculated by the backend from the asset (purchase cost, useful life, salvage value). Changing year or method will recalculate them.
                </p>
              )}
              {editing && (
                <div className="entity-form-grid" style={{ marginBottom: 12 }}>
                  <div className="entity-field">
                    <label>Depreciation amount (calculated)</label>
                    <input type="text" readOnly value={editing.depreciationAmount != null ? editing.depreciationAmount : "—"} className="entity-readonly" />
                  </div>
                  <div className="entity-field">
                    <label>Remaining value (calculated)</label>
                    <input type="text" readOnly value={editing.remainingValue != null ? editing.remainingValue : "—"} className="entity-readonly" />
                  </div>
                </div>
              )}
              <div className="entity-form-grid">
                <div className="entity-field entity-field--full">
                  <label>Asset *</label>
                  <select
                    value={form.assetId}
                    onChange={(e) => handleChange("assetId", e.target.value)}
                    required={!editing}
                    disabled={!!editing}
                  >
                    <option value="">Select asset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>{assetLabel(a)}</option>
                    ))}
                  </select>
                  {editing && <span className="entity-field-hint">Asset cannot be changed when editing.</span>}
                </div>
                <div className="entity-field">
                  <label>Year *</label>
                  <input type="number" min="2000" max="2100" value={form.year} onChange={(e) => handleChange("year", e.target.value)} required />
                </div>
                <div className="entity-field">
                  <label>Method</label>
                  <select value={form.method} onChange={(e) => handleChange("method", e.target.value)}>
                    {METHOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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
        title="Delete depreciation record?"
        message="Are you sure you want to delete this depreciation record? The asset's current value will be updated. This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Depreciation Record Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "year", label: "Year" }, { key: "method", label: "Method" }, { key: "amount", label: "Amount" }, { key: "remainingValue", label: "Remaining value" }, { key: "asset", label: "Asset" }],
          rows: list.map((r) => ({ id: r.id, year: r.year != null ? r.year : "—", method: r.method || "—", amount: r.amount != null ? r.amount : "—", remainingValue: r.remainingValue != null ? r.remainingValue : "—", asset: assetLabel(r.asset) })),
        })}
      />
    </>
  );
}
