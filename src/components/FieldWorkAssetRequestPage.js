import { useEffect, useState } from "react";
import {
  getFieldWorkAssetRequests,
  createFieldWorkAssetRequest,
  updateFieldWorkAssetRequest,
  deleteFieldWorkAssetRequest,
} from "../services/fieldWorkAssetRequestService";
import { getAssets } from "../services/assetService";
import { getUsers } from "../services/userService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { required, firstError, filterListByQuery } from "../utils/validation";
import "./EntityPage.css";
import "./FieldWorkAssetRequestPage.css";

const REQUEST_STATUS = ["PENDING", "APPROVED", "PARTIAL", "REJECTED", "FULFILLED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const ITEM_STATUS = ["REQUESTED", "APPROVED", "PARTIALLY_APPROVED", "ISSUED", "RETURNED", "REJECTED"];

const emptyItem = () => ({
  assetId: "",
  quantityRequested: 1,
  quantityApproved: "",
  quantityIssued: "",
  quantityReturned: "",
  requiredForTask: "",
  status: "REQUESTED",
  remarks: "",
});

const emptyForm = (user) => ({
  technicianId: user?.id || "",
  neededByDate: "",
  priority: "MEDIUM",
  status: "PENDING",
  justification: "",
  notes: "",
  items: [emptyItem()],
});

const labelAsset = (a) => a?.name || a?.assetTag || a?.id || "—";
const labelUser = (u) => (!u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id);
const asDate = (v) => (!v ? "—" : String(v).slice(0, 10));

const statusClass = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "pending";
  if (s === "APPROVED") return "approved";
  if (s === "PARTIAL") return "warning";
  if (s === "REJECTED") return "rejected";
  if (s === "FULFILLED") return "completed";
  return "default";
};

export default function FieldWorkAssetRequestPage({ user, searchQuery, onDataChange, onRequestUpdated }) {
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
  const isTechnician = String(user?.role || "").toUpperCase() === "TECHNICIAN";
  const [list, setList] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(user));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [assetsError, setAssetsError] = useState("");

  const notify = (data) => {
    if (typeof onDataChange === "function") onDataChange(data);
  };

  const load = () => {
    setLoading(true);
    setError("");
    getFieldWorkAssetRequests()
      .then((data) => {
        setList(data || []);
        notify(data || []);
      })
      .catch((e) => setError(e.message || "Failed to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();

    getAssets()
      .then((a) => {
        setAssets(Array.isArray(a) ? a : []);
        setAssetsError("");
      })
      .catch((e) => {
        setAssets([]);
        setAssetsError(e.message || "Could not load assets. You may not have access, or the server is unavailable.");
      });

    if (isTechnician) {
      setUsers([]);
    } else {
      getUsers()
        .then((u) => setUsers(Array.isArray(u) ? u : []))
        .catch(() => setUsers([]));
    }
  }, [isTechnician]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 6000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(user));
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      technicianId: row.technician?.id || "",
      neededByDate: asDate(row.neededByDate) === "—" ? "" : asDate(row.neededByDate),
      priority: row.priority || "MEDIUM",
      status: row.status || "PENDING",
      justification: row.justification || "",
      notes: row.notes || "",
      items: (row.items || []).map((i) => ({
        id: i.id,
        assetId: i.asset?.id || "",
        quantityRequested: i.quantityRequested ?? 1,
        quantityApproved: i.quantityApproved ?? "",
        quantityIssued: i.quantityIssued ?? "",
        quantityReturned: i.quantityReturned ?? "",
        requiredForTask: i.requiredForTask || "",
        status: i.status || "REQUESTED",
        remarks: i.remarks || "",
      })),
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError("");
    setDeleteConfirm(null);
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const setItemField = (idx, name, value) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [name]: value } : it)),
    }));

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (idx) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));

  const toNullableInt = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const findOrigItem = (it) => {
    if (!editing?.items?.length) return null;
    if (it.id) return editing.items.find((i) => i.id === it.id) || null;
    return null;
  };

  const normalizeItem = (it) => {
    const orig = findOrigItem(it);
    const common = {
      ...(it.id ? { id: it.id } : {}),
      asset: { id: it.assetId },
      quantityRequested: Number(it.quantityRequested),
      requiredForTask: it.requiredForTask?.trim() || null,
      remarks: it.remarks?.trim() || null,
    };
    if (isTechnician) {
      return {
        ...common,
        status: orig?.status || "REQUESTED",
        quantityApproved: orig != null ? toNullableInt(orig.quantityApproved) : null,
        quantityIssued: orig != null ? toNullableInt(orig.quantityIssued) : null,
        quantityReturned: orig != null ? toNullableInt(orig.quantityReturned) : null,
      };
    }
    return {
      ...common,
      quantityApproved: toNullableInt(it.quantityApproved),
      quantityIssued: toNullableInt(it.quantityIssued),
      quantityReturned: toNullableInt(it.quantityReturned),
      status: it.status || "REQUESTED",
    };
  };

  const validate = () =>
    firstError([
      () => required(form.technicianId, "Technician"),
      () => required(form.neededByDate, "Needed by date"),
      () => required(form.justification, "Justification"),
      () => (!form.items?.length ? "Add at least one asset item." : null),
      () => form.items.some((it) => !it.assetId) ? "Each item must have an asset." : null,
      () => form.items.some((it) => Number(it.quantityRequested) < 1) ? "Quantity requested must be at least 1." : null,
      () => {
        const ids = form.items.map((it) => it.assetId).filter(Boolean);
        return new Set(ids).size !== ids.length ? "Duplicate assets are not allowed in one request." : null;
      },
    ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    const payload = {
      technician: { id: isTechnician ? user.id : form.technicianId },
      neededByDate: form.neededByDate,
      priority: form.priority,
      status: editing ? (isAdmin ? form.status : editing.status || "PENDING") : "PENDING",
      justification: form.justification.trim(),
      notes: form.notes?.trim() || null,
      items: form.items.map(normalizeItem),
    };

    const statusChanged = editing && String(editing.status || "") !== String(form.status || "");
    setSaving(true);
    (editing
      ? updateFieldWorkAssetRequest(editing.id, payload)
      : createFieldWorkAssetRequest(payload))
      .then((saved) => {
        const next = editing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved];
        setList(next);
        notify(next);
        if (!editing) {
          setSuccessMessage("Asset request created. A notification has been sent.");
        } else if (statusChanged) {
          setSuccessMessage("Asset request updated. Status notification has been sent.");
          if (typeof onRequestUpdated === "function") onRequestUpdated();
        } else {
          setSuccessMessage("Asset request updated.");
        }
        closeModal();
      })
      .catch((er) => setFormError(er.message || "Failed to save request"))
      .finally(() => setSaving(false));
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteFieldWorkAssetRequest(deleteConfirm)
      .then(() => {
        const next = list.filter((x) => x.id !== deleteConfirm);
        setList(next);
        notify(next);
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((er) => setFormError(er.message || "Failed to delete request"));
  };

  const scopedList = isTechnician ? list.filter((r) => r.technician?.id === user?.id) : list;
  const filteredList = filterListByQuery(scopedList, searchQuery, [
    "justification",
    "notes",
    "status",
    "priority",
    (r) => labelUser(r.technician),
    (r) => String(r.items?.length || 0),
  ]);

  const canEditRequest = (row) => !isTechnician || row.technician?.id === user?.id;

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <button type="button" className="entity-add-btn" onClick={openAdd}>
            Add Asset Request
          </button>
        </div>
        {successMessage && <p className="entity-success">{successMessage}</p>}
        {error && <p className="entity-error">{error}</p>}
        {assetsError && <p className="entity-error">{assetsError}</p>}
        {loading ? (
          <p className="entity-loading">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Needed By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Items</th>
                  <th>Justification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{asDate(row.neededByDate)}</td>
                    <td>{row.priority || "—"}</td>
                    <td>
                      <span className={`entity-status request-status request-status--${statusClass(row.status)}`}>
                        {row.status || "—"}
                      </span>
                    </td>
                    <td>{labelUser(row.technician)}</td>
                    <td>{row.items?.length || 0}</td>
                    <td className="req-justify">{row.justification || "—"}</td>
                    <td>
                      <div className="action-cell">
                        {canEditRequest(row) ? (
                          <button type="button" className="action-btn" onClick={() => openEdit(row)}>
                            Edit
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="entity-empty">
                      {isTechnician ? "You have no asset requests yet. Use Add Asset Request to submit one." : "No asset requests yet."}
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
          <div className="entity-modal req-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Asset Request" : "Add Asset Request"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              {assetsError && <p className="entity-error">{assetsError}</p>}
              <div className="req-form-intro">
                <h3>Request Details</h3>
                <p>Fill the required information below, then add one or more requested assets.</p>
              </div>

              <div className="entity-form-grid req-top-grid">
                <div className="entity-field">
                  <label>Technician *</label>
                  {isTechnician ? (
                    <input type="text" className="entity-readonly" readOnly value={labelUser(user)} title="Requests are tied to your account" />
                  ) : (
                    <select value={form.technicianId} onChange={(e) => setField("technicianId", e.target.value)} required>
                      <option value="">Select technician</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {labelUser(u)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="entity-field">
                  <label>Required By Date *</label>
                  <input type="date" value={form.neededByDate} onChange={(e) => setField("neededByDate", e.target.value)} required />
                </div>
                <div className="entity-field">
                  <label>Priority *</label>
                  <select value={form.priority} onChange={(e) => setField("priority", e.target.value)}>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                {editing && (
                  <div className="entity-field">
                    <label>Request Status</label>
                    <select value={form.status} onChange={(e) => setField("status", e.target.value)} disabled={!isAdmin}>
                      {REQUEST_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="entity-field entity-field--full">
                  <label>Reason / Justification *</label>
                  <textarea value={form.justification} onChange={(e) => setField("justification", e.target.value)} rows={2} required />
                </div>
                <div className="entity-field entity-field--full">
                  <label>Additional Notes</label>
                  <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} />
                </div>
              </div>

              <div className="req-items-header">
                <h3>Requested Asset Items</h3>
                <button type="button" className="entity-btn entity-btn--secondary" onClick={addItem}>
                  Add Item
                </button>
              </div>
              <div className="req-items-cards">
                {form.items.map((it, idx) => (
                  <div key={idx} className="req-item-card">
                    <div className="req-item-card-head">
                      <h4>Item #{idx + 1}</h4>
                      <button
                        type="button"
                        className="entity-btn entity-btn--danger req-item-remove"
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="req-item-grid">
                      <div className="entity-field req-span-2">
                        <label>Asset *</label>
                        <select value={it.assetId} onChange={(e) => setItemField(idx, "assetId", e.target.value)} required>
                          <option value="">Select asset</option>
                          {assets.map((a) => (
                            <option key={a.id} value={a.id}>
                              {labelAsset(a)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="entity-field">
                        <label>Quantity Requested *</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantityRequested}
                          onChange={(e) => setItemField(idx, "quantityRequested", e.target.value)}
                          required
                        />
                      </div>

                      {!isTechnician && (
                        <>
                          <div className="entity-field">
                            <label>Item Status</label>
                            <select value={it.status} onChange={(e) => setItemField(idx, "status", e.target.value)}>
                              {ITEM_STATUS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="entity-field">
                            <label>Qty Approved</label>
                            <input type="number" min="0" value={it.quantityApproved} onChange={(e) => setItemField(idx, "quantityApproved", e.target.value)} />
                          </div>

                          <div className="entity-field">
                            <label>Qty Issued</label>
                            <input type="number" min="0" value={it.quantityIssued} onChange={(e) => setItemField(idx, "quantityIssued", e.target.value)} />
                          </div>

                          <div className="entity-field">
                            <label>Qty Returned</label>
                            <input type="number" min="0" value={it.quantityReturned} onChange={(e) => setItemField(idx, "quantityReturned", e.target.value)} />
                          </div>
                        </>
                      )}

                      <div className="entity-field req-span-2">
                        <label>Task / Work Purpose</label>
                        <input type="text" value={it.requiredForTask} onChange={(e) => setItemField(idx, "requiredForTask", e.target.value)} />
                      </div>

                      <div className="entity-field req-span-2">
                        <label>Remarks</label>
                        <input type="text" value={it.remarks} onChange={(e) => setItemField(idx, "remarks", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="entity-modal-footer">
                {editing && !isTechnician && (
                  <button type="button" className="entity-btn entity-btn--danger" onClick={() => setDeleteConfirm(editing.id)}>
                    Delete
                  </button>
                )}
                <button type="button" className="entity-btn entity-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="entity-btn entity-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={doDelete}
        title="Delete asset request?"
        message="Are you sure you want to delete this asset request? This action cannot be undone."
      />
    </>
  );
}
