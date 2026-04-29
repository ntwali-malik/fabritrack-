import { useState, useEffect, useMemo } from "react";
import {
  getTechnicianTasks,
  getTechnicianTaskLeaderboard,
  createTechnicianTask,
  updateTechnicianTask,
  patchTechnicianTaskStatus,
  deleteTechnicianTask,
} from "../services/technicianTaskService";
import { getLocations } from "../services/locationService";
import { getUsers } from "../services/userService";
import { hasPermission, PERMISSIONS, getEffectivePermissions } from "../constants/permissions";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";

const STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const formatEnum = (s) =>
  !s ? "—" : String(s).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const locationLabel = (loc) => loc?.name || loc?.address || (loc?.id != null ? `#${loc.id}` : "—");
const userLabel = (u) => (!u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id);

const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const s = typeof iso === "string" ? iso : String(iso);
  return s.length >= 16 ? s.slice(0, 16) : s;
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

const emptyForm = () => ({
  title: "",
  description: "",
  locationId: "",
  assignedToId: "",
  priority: "MEDIUM",
  status: "PENDING",
  dueAt: "",
});

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

export default function TechnicianTaskPage({ user, onDataChange, searchQuery }) {
  const perms = useMemo(() => getEffectivePermissions(user), [user]);
  const canManage = hasPermission(perms, PERMISSIONS.FIELD_TASK_MANAGE);
  const isTechnician = String(user?.role || "").toUpperCase() === "TECHNICIAN";
  const canReadTasks = hasPermission(perms, PERMISSIONS.FIELD_TASK_READ);
  const canAddTask = canManage || (isTechnician && canReadTasks);
  const showLeaderboard = !isTechnician || canManage;
  const canChangeStatus = (row) => canManage || (isTechnician && sameId(row?.assignedTo?.id, user?.id));

  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [locations, setLocations] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const notify = (data) => {
    if (typeof onDataChange === "function") onDataChange(data);
  };

  const loadTasks = () => {
    setLoading(true);
    setError("");
    const q = {};
    if (filterLocation) q.locationId = filterLocation;
    if (filterStatus) q.status = filterStatus;
    if (isTechnician && user?.id != null) q.assignedToId = user.id;
    getTechnicianTasks(q)
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const mine =
          isTechnician && user?.id != null
            ? arr.filter((t) => sameId(t?.assignedTo?.id, user.id))
            : arr;
        setTasks(mine);
        notify(mine);
      })
      .catch((e) => setError(e.message || "Failed to load tasks"))
      .finally(() => setLoading(false));
  };

  const loadLeaderboard = () => {
    if (!showLeaderboard) return;
    setLbLoading(true);
    getTechnicianTaskLeaderboard()
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLbLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    if (showLeaderboard) loadLeaderboard();
    getLocations()
      .then((l) => setLocations(Array.isArray(l) ? l : []))
      .catch(() => setLocations([]));
    getUsers()
      .then((u) => {
        const list = Array.isArray(u) ? u : [];
        setTechnicians(list.filter((x) => String(x.role || "").toUpperCase() === "TECHNICIAN"));
      })
      .catch(() => setTechnicians([]));
  }, [showLeaderboard]);

  useEffect(() => {
    loadTasks();
  }, [filterLocation, filterStatus]);

  useEffect(() => {
    const timer = setInterval(() => loadTasks(), 30000);
    return () => clearInterval(timer);
  }, [filterLocation, filterStatus, isTechnician, user?.id]);

  const openAdd = () => {
    setEditing(null);
    const base = emptyForm();
    if (!canManage && isTechnician && user?.id != null) {
      base.assignedToId = String(user.id);
    }
    setForm(base);
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title || "",
      description: row.description || "",
      locationId: row.location?.id ?? "",
      assignedToId: row.assignedTo?.id ?? "",
      priority: row.priority || "MEDIUM",
      status: row.status || "PENDING",
      dueAt: toDatetimeLocal(row.dueAt),
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

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const filteredTasks = filterListByQuery(tasks, searchQuery, [
    "title",
    "description",
    (r) => locationLabel(r.location),
    (r) => userLabel(r.assignedTo),
    (r) => formatEnum(r.status),
    (r) => formatEnum(r.priority),
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title?.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!form.locationId) {
      setFormError("Select a location.");
      return;
    }
    const assigneeId = !canManage && isTechnician && user?.id != null ? String(user.id) : form.assignedToId;
    if (!assigneeId) {
      setFormError(canManage ? "Select a technician." : "Could not determine assignee.");
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      location: { id: Number(form.locationId) },
      assignedTo: { id: assigneeId },
      priority: form.priority,
      status: form.status,
    };
    if (form.dueAt) {
      payload.dueAt = new Date(form.dueAt).toISOString();
    }
    setSaving(true);
    (editing ? updateTechnicianTask(editing.id, payload) : createTechnicianTask(payload))
      .then((saved) => {
        setTasks((prev) => (editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
        loadLeaderboard();
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const onStatusInline = (row, status) => {
    patchTechnicianTaskStatus(row.id, status)
      .then((saved) => {
        setTasks((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
        loadLeaderboard();
      })
      .catch((err) => setError(err.message || "Could not update status"));
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteTechnicianTask(deleteConfirm)
      .then(() => {
        setTasks((prev) => prev.filter((x) => x.id !== deleteConfirm));
        loadLeaderboard();
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete"));
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="entity-toolbar">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <select
              className="entity-field"
              style={{ minWidth: 160, padding: "8px 10px", borderRadius: 8 }}
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              aria-label="Filter by location"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {locationLabel(loc)}
                </option>
              ))}
            </select>
            <select
              className="entity-field"
              style={{ minWidth: 140, padding: "8px 10px", borderRadius: 8 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatEnum(s)}
                </option>
              ))}
            </select>
          </div>
          {canAddTask && (
            <button type="button" className="entity-add-btn" onClick={openAdd}>
              New task
            </button>
          )}
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? (
          <p className="entity-loading">Loading tasks…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td style={{ maxWidth: 200 }}>
                      <strong>{row.title}</strong>
                      {row.description && (
                        <div style={{ fontSize: ".78rem", color: "var(--ink3)", marginTop: 4 }}>{row.description}</div>
                      )}
                    </td>
                    <td>{locationLabel(row.location)}</td>
                    <td>{userLabel(row.assignedTo)}</td>
                    <td>{formatEnum(row.priority)}</td>
                    <td>
                      {canChangeStatus(row) ? (
                        <select
                          value={row.status || "PENDING"}
                          onChange={(e) => onStatusInline(row, e.target.value)}
                          style={{ fontSize: ".8rem", padding: "4px 8px", borderRadius: 6 }}
                          aria-label="Update status"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatEnum(s)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: ".82rem", color: "var(--ink2)" }}>{formatEnum(row.status)}</span>
                      )}
                    </td>
                    <td>{row.dueAt ? toDatetimeLocal(row.dueAt).replace("T", " ") : "—"}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell" style={{ display: "flex", gap: 6 }}>
                        {canManage && (
                          <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}>
                            <IconEdit />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="entity-empty">
                      No tasks match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showLeaderboard && (
        <div className="card">
          <div className="entity-toolbar">
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Technician leaderboard</h3>
          </div>
          {lbLoading ? (
            <p className="entity-loading">Loading rankings…</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Technician</th>
                    <th>Email</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr key={row.userId || i} className="t-row">
                      <td className="td-id">{i + 1}</td>
                      <td>{[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}</td>
                      <td>{row.email || "—"}</td>
                      <td>
                        <strong>{row.completedCount ?? 0}</strong>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={4} className="entity-empty">
                        No completed tasks recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && ((editing && canManage) || (!editing && canAddTask)) && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit task" : "Create task"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              <div className="entity-form-grid">
                <div className="entity-field entity-field--full">
                  <label>Title *</label>
                  <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
                </div>
                <div className="entity-field entity-field--full">
                  <label>Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
                </div>
                <div className="entity-field">
                  <label>Location *</label>
                  <select value={form.locationId} onChange={(e) => handleChange("locationId", e.target.value)} required>
                    <option value="">Select</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {locationLabel(loc)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="entity-field">
                  <label>Technician *</label>
                  {!canManage && isTechnician ? (
                    <>
                      <input type="text" readOnly value={userLabel(user)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)" }} />
                      <small style={{ display: "block", marginTop: 4, color: "var(--ink3)", fontSize: ".75rem" }}>
                        Tasks you create are assigned to you.
                      </small>
                    </>
                  ) : (
                    <select
                      value={form.assignedToId}
                      onChange={(e) => handleChange("assignedToId", e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      {technicians.map((u) => (
                        <option key={u.id} value={u.id}>
                          {userLabel(u)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="entity-field">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => handleChange("priority", e.target.value)}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {formatEnum(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="entity-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {formatEnum(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="entity-field entity-field--full">
                  <label>Due</label>
                  <input
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={(e) => handleChange("dueAt", e.target.value)}
                  />
                </div>
              </div>
              <div className="entity-modal-footer">
                {editing && (
                  <button
                    type="button"
                    className="entity-btn entity-btn--danger"
                    onClick={() => setDeleteConfirm(editing.id)}
                  >
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
        title="Delete this task?"
        message="This permanently removes the task record."
      />
    </>
  );
}
