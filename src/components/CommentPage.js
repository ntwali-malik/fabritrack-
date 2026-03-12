import { useState, useEffect } from "react";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../services/commentService";
import { getAssets } from "../services/assetService";
import { getUsers } from "../services/userService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";

const emptyForm = () => ({ message: "", assetId: "", userId: "" });

const formatDateTime = (d) => (!d ? "—" : (typeof d === "string" ? d.slice(0, 19).replace("T", " ") : String(d)));

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
const userLabel = (u) => (!u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id);

export default function CommentPage({ user, onDataChange, searchQuery }) {
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
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    getComments()
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
      message: row.message || "",
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

  const filteredList = filterListByQuery(list, searchQuery, ["message", (r) => assetLabel(r.asset), (r) => userLabel(r.user)]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.message?.trim()) { setFormError("Message is required."); return; }
    if (!form.assetId) { setFormError("Select an asset."); return; }
    if (!form.userId) { setFormError("Select a user."); return; }
    setSaving(true);
    const payload = {
      message: form.message.trim(),
      asset: { id: form.assetId },
      user: { id: form.userId },
    };
    (editing ? updateComment(editing.id, payload) : createComment(payload))
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
    deleteComment(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Comment</button>
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? <p className="entity-loading">Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Message</th>
                  <th>Created at</th>
                  <th>Asset</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td style={{ maxWidth: 280 }}>{row.message || "—"}</td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>{assetLabel(row.asset)}</td>
                    <td>{userLabel(row.user)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconGear /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && <tr><td colSpan={6} className="entity-empty">No comments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Comment" : "Add Comment"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              <div className="entity-form-grid">
                <div className="entity-field entity-field--full">
                  <label>Message *</label>
                  <textarea value={form.message} onChange={(e) => handleChange("message", e.target.value)} required />
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
        title="Delete comment?"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Comment Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "message", label: "Message" }, { key: "createdAt", label: "Created at" }, { key: "asset", label: "Asset" }, { key: "user", label: "User" }],
          rows: list.map((r) => ({ id: r.id, message: (r.message || "—").slice(0, 80), createdAt: formatDateTime(r.createdAt), asset: assetLabel(r.asset), user: userLabel(r.user) })),
        })}
      />
    </>
  );
}
