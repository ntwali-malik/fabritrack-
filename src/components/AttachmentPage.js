import { useState, useEffect } from "react";
import {
  getAttachments,
  createAttachment,
  updateAttachment,
  deleteAttachment,
  downloadAttachmentFile,
} from "../services/attachmentService";
import { getAssets } from "../services/assetService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";

const emptyForm = () => ({ file: null, fileName: "", assetId: "" });

const formatDateTime = (d) => (!d ? "—" : (typeof d === "string" ? d.slice(0, 19).replace("T", " ") : String(d)));

const formatSize = (bytes) => {
  if (bytes == null) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

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
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const assetLabel = (a) => a?.name || a?.assetTag || a?.id || "—";

export default function AttachmentPage({ user, onDataChange, searchQuery }) {
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
  const [downloadingId, setDownloadingId] = useState(null);

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    getAttachments()
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
      file: null,
      fileName: row.fileName || "",
      assetId: row.asset?.id ?? "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setFormError(""); setDeleteConfirm(null); };

  const cancelDelete = () => setDeleteConfirm(null);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    setForm((p) => ({ ...p, file, fileName: file ? file.name : p.fileName }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.assetId) { setFormError("Select an asset."); return; }
    if (!editing && !form.file) { setFormError("Select a file to upload."); return; }
    if (editing && !form.file && !form.fileName?.trim()) { setFormError("File name is required."); return; }
    const fileName = form.fileName?.trim() || (form.file && form.file.name) || "attachment";
    setSaving(true);
    if (editing) {
      updateAttachment(editing.id, {
        file: form.file || undefined,
        fileName: form.file ? form.file.name : fileName,
        assetId: form.assetId,
      })
        .then((saved) => {
          setList((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          notify(list.map((x) => (x.id === saved.id ? saved : x)));
          closeModal();
        })
        .catch((e) => setFormError(e.message || "Failed to update"))
        .finally(() => setSaving(false));
    } else {
      createAttachment(form.file, form.assetId, fileName)
        .then((saved) => {
          setList((prev) => [...prev, saved]);
          notify([...list, saved]);
          closeModal();
        })
        .catch((e) => setFormError(e.message || "Failed to upload"))
        .finally(() => setSaving(false));
    }
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteAttachment(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  const handleDownload = (id, fileName) => {
    setDownloadingId(id);
    downloadAttachmentFile(id)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "attachment";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {})
      .finally(() => setDownloadingId(null));
  };

  const filteredList = filterListByQuery(list, searchQuery, ["fileName", "contentType", (r) => assetLabel(r.asset)]);

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Attachment</button>
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? <p className="entity-loading">Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>File name</th>
                  <th>Size</th>
                  <th>Uploaded at</th>
                  <th>Asset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{row.fileName || "—"}</td>
                    <td>{formatSize(row.contentLength)}</td>
                    <td>{formatDateTime(row.uploadedAt)}</td>
                    <td>{assetLabel(row.asset)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Download"
                          onClick={() => handleDownload(row.id, row.fileName)}
                          disabled={downloadingId === row.id}
                          title="Download"
                        >
                          {downloadingId === row.id ? "…" : <IconDownload />}
                        </button>
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconEdit /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && <tr><td colSpan={6} className="entity-empty">No attachments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Attachment" : "Add Attachment"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              <div className="entity-form-grid">
                <div className="entity-field entity-field--full">
                  <label>File {editing ? "(optional – pick new to replace)" : "*"}</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required={!editing}
                  />
                  {editing && form.file && <span style={{ fontSize: "0.85rem", color: "var(--dim)" }}>New file: {form.file.name}</span>}
                </div>
                <div className="entity-field entity-field--full">
                  <label>File name</label>
                  <input
                    type="text"
                    value={form.fileName}
                    onChange={(e) => handleChange("fileName", e.target.value)}
                    placeholder={form.file ? form.file.name : "Display name"}
                  />
                </div>
                <div className="entity-field entity-field--full">
                  <label>Asset *</label>
                  <select value={form.assetId} onChange={(e) => handleChange("assetId", e.target.value)} required>
                    <option value="">Select asset</option>
                    {assets.map((a) => <option key={a.id} value={a.id}>{assetLabel(a)}</option>)}
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
                <button type="submit" className="entity-btn entity-btn--primary" disabled={saving}>{saving ? "Saving…" : editing ? "Update" : "Upload"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={doDelete}
        title="Delete attachment?"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Attachment Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "fileName", label: "File name" }, { key: "contentLength", label: "Size" }, { key: "uploadedAt", label: "Uploaded at" }, { key: "asset", label: "Asset" }],
          rows: list.map((r) => ({ id: r.id, fileName: r.fileName || "—", contentLength: formatSize(r.contentLength), uploadedAt: formatDateTime(r.uploadedAt), asset: assetLabel(r.asset) })),
        })}
      />
    </>
  );
}
