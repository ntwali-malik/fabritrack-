import { useState, useEffect } from "react";
import {
  getAssetReservations,
  createAssetReservation,
  updateAssetReservation,
  deleteAssetReservation,
} from "../services/assetReservationService";
import { getAssets } from "../services/assetService";
import { getUsers } from "../services/userService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { required, dateRange, firstError, filterListByQuery } from "../utils/validation";
import "./EntityPage.css";
import "./AssetReservationPage.css";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

const emptyForm = () => ({
  startDate: "",
  endDate: "",
  purpose: "",
  status: "PENDING",
  assetId: "",
  userId: "",
});

const formatDate = (d) => (!d ? "—" : (typeof d === "string" ? d.split("T")[0] : String(d).slice(0, 10)));

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const assetLabel = (a) => a?.name || a?.assetTag || a?.id || "—";
const userLabel = (u) => (!u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id);

/** CSS class suffix for reservation status (e.g. pending, approved) */
const reservationStatusClass = (status) => {
  if (!status) return "default";
  const s = String(status).toUpperCase();
  if (s === "PENDING") return "pending";
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "CANCELLED") return "cancelled";
  if (s === "COMPLETED") return "completed";
  return "default";
};

export default function AssetReservationPage({ user, onDataChange, onReservationUpdated, searchQuery }) {
  const [list, setList] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    getAssetReservations()
      .then((data) => { setList(data); notify(data); })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();
    Promise.all([getAssets(), getUsers()]).then(([a, u]) => {
      setAssets(a || []);
      setUsers(u || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 6000);
    return () => clearTimeout(t);
  }, [successMessage]);

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
      startDate: formatDate(row.startDate) === "—" ? "" : formatDate(row.startDate),
      endDate: formatDate(row.endDate) === "—" ? "" : formatDate(row.endDate),
      purpose: row.purpose || "",
      status: row.status || "PENDING",
      assetId: row.asset?.id ?? "",
      userId: row.user?.id ?? "",
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
    setSuccessMessage("");
    const err = firstError([
      () => required(form.startDate, "Start date"),
      () => required(form.endDate, "End date"),
      () => dateRange(form.startDate, form.endDate, "Start date", "End date"),
      () => form.assetId ? null : "Select an asset.",
      () => form.userId ? null : "Select a user.",
    ]);
    if (err) { setFormError(err); return; }
    setSaving(true);
    const payload = {
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      purpose: form.purpose?.trim() || null,
      status: form.status,
      asset: { id: form.assetId },
      user: { id: form.userId },
    };
    const previousStatus = editing?.status;
    const statusChanged = editing && previousStatus != null && String(form.status) !== String(previousStatus);
    (editing ? updateAssetReservation(editing.id, payload) : createAssetReservation(payload))
      .then((saved) => {
        setList((prev) => (editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
        notify(editing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved]);
        if (statusChanged) {
          setSuccessMessage("Reservation updated. The user has been notified of the new status.");
          if (typeof onReservationUpdated === "function") onReservationUpdated();
        } else if (!editing) {
          setSuccessMessage("Reservation created. The user has been notified.");
          if (typeof onReservationUpdated === "function") onReservationUpdated();
        }
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteAssetReservation(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  const filteredList = filterListByQuery(list, searchQuery, [
    "purpose",
    "status",
    (r) => assetLabel(r.asset),
    (r) => userLabel(r.user),
  ]);

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Reservation</button>
          </div>
        </div>
        {successMessage && <p className="entity-success">{successMessage}</p>}
        {error && <p className="entity-error">{error}</p>}
        {loading ? <p className="entity-loading">Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Asset</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td>{formatDate(row.startDate)}</td>
                    <td>{formatDate(row.endDate)}</td>
                    <td>{row.purpose || "—"}</td>
                    <td><span className={`entity-status reservation-status reservation-status--${reservationStatusClass(row.status)}`}>{row.status || "—"}</span></td>
                    <td>{assetLabel(row.asset)}</td>
                    <td>{userLabel(row.user)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconEdit /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && <tr><td colSpan={7} className="entity-empty">No reservations yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Reservation" : "Add Reservation"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              <div className="entity-form-grid">
                <div className="entity-field">
                  <label>Start date *</label>
                  <input type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} required />
                </div>
                <div className="entity-field">
                  <label>End date *</label>
                  <input type="date" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} required />
                </div>
                <div className="entity-field entity-field--full">
                  <label>Purpose</label>
                  <input type="text" value={form.purpose} onChange={(e) => handleChange("purpose", e.target.value)} />
                </div>
                <div className="entity-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="entity-field">
                  <label>Asset *</label>
                  <select value={form.assetId} onChange={(e) => handleChange("assetId", e.target.value)} required>
                    <option value="">Select asset</option>
                    {assets.map((a) => <option key={a.id} value={a.id}>{assetLabel(a)}</option>)}
                  </select>
                </div>
                <div className="entity-field">
                  <label>User *</label>
                  <select value={form.userId} onChange={(e) => handleChange("userId", e.target.value)} required>
                    <option value="">Select user</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{userLabel(u)}</option>)}
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
        title="Delete reservation?"
        message="Are you sure you want to delete this reservation? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Asset Reservation Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "startDate", label: "Start" }, { key: "endDate", label: "End" }, { key: "purpose", label: "Purpose" }, { key: "status", label: "Status" }, { key: "asset", label: "Asset" }, { key: "user", label: "User" }],
          rows: list.map((r) => ({ id: r.id, startDate: formatDate(r.startDate), endDate: formatDate(r.endDate), purpose: r.purpose || "—", status: r.status || "—", asset: assetLabel(r.asset), user: userLabel(r.user) })),
        })}
      />
    </>
  );
}
