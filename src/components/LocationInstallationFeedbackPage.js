import { useState, useEffect, useMemo } from "react";
import {
  getLocationInstallationFeedback,
  createLocationInstallationFeedback,
  updateLocationInstallationFeedback,
  deleteLocationInstallationFeedback,
} from "../services/locationInstallationFeedbackService";
import { getLocations } from "../services/locationService";
import { getUsers } from "../services/userService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";

const SATISFACTION_OPTIONS = [
  { value: "", label: "— Not specified —" },
  { value: "VERY_SATISFIED", label: "Very satisfied" },
  { value: "SATISFIED", label: "Satisfied" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "DISSATISFIED", label: "Dissatisfied" },
  { value: "VERY_DISSATISFIED", label: "Very dissatisfied" },
];

const normalizeUserId = (id) => (id == null || id === "" ? "" : String(id));

const emptyForm = (defaultUserId) => ({
  feedbackText: "",
  locationId: "",
  submittedByUserId: normalizeUserId(defaultUserId),
  satisfactionLevel: "",
});

const formatDateTime = (d) => (!d ? "—" : (typeof d === "string" ? d.slice(0, 19).replace("T", " ") : String(d)));

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

const locationLabel = (loc) => loc?.name || loc?.address || (loc?.id != null ? `Location #${loc.id}` : "—");
const userLabel = (u) => (!u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id);

const formatSatisfaction = (s) => {
  if (!s) return "—";
  return String(s).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function LocationInstallationFeedbackPage({ user, onDataChange, searchQuery }) {
  const [list, setList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyForm(user?.id));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const isTechnician = String(user?.role || "").toUpperCase() === "TECHNICIAN";
  const currentUserId = normalizeUserId(user?.id);

  const submitterOptions = useMemo(() => {
    const byId = new Map();
    (Array.isArray(users) ? users : []).forEach((u) => {
      if (u?.id != null) byId.set(normalizeUserId(u.id), u);
    });
    if (user?.id != null && !byId.has(currentUserId)) {
      byId.set(currentUserId, user);
    }
    if (editing?.submittedBy?.id != null) {
      const sid = normalizeUserId(editing.submittedBy.id);
      if (!byId.has(sid)) byId.set(sid, editing.submittedBy);
    }
    return Array.from(byId.values());
  }, [users, user, currentUserId, editing]);

  const notify = (data) => {
    if (typeof onDataChange === "function") onDataChange(data);
  };

  const load = () => {
    setLoading(true);
    setError("");
    getLocationInstallationFeedback()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const visible =
          isTechnician && currentUserId
            ? arr.filter((row) => normalizeUserId(row?.submittedBy?.id) === currentUserId)
            : arr;
        setList(visible);
        notify(visible);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();
    getLocations()
      .then((l) => setLocations(Array.isArray(l) ? l : []))
      .catch(() => setLocations([]));
    getUsers()
      .then((u) => setUsers(Array.isArray(u) ? u : []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!modalOpen || editing || !currentUserId) return;
    setForm((f) => (f.submittedByUserId ? f : { ...f, submittedByUserId: currentUserId }));
  }, [modalOpen, editing, currentUserId]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm(currentUserId));
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      feedbackText: row.feedbackText || "",
      locationId: row.location?.id ?? "",
      submittedByUserId: normalizeUserId(row.submittedBy?.id ?? ""),
      satisfactionLevel: row.satisfactionLevel || "",
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

  const cancelDelete = () => setDeleteConfirm(null);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const filteredList = filterListByQuery(list, searchQuery, [
    "feedbackText",
    (r) => locationLabel(r.location),
    (r) => userLabel(r.submittedBy),
    (r) => formatSatisfaction(r.satisfactionLevel),
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.feedbackText?.trim()) {
      setFormError("Comment is required.");
      return;
    }
    if (!form.locationId) {
      setFormError("Select a location.");
      return;
    }
    const submitterId = form.submittedByUserId || currentUserId;
    if (!submitterId) {
      setFormError("Select who submitted this comment.");
      return;
    }
    setSaving(true);
    const payload = {
      feedbackText: form.feedbackText.trim(),
      location: { id: Number(form.locationId) },
      submittedBy: { id: submitterId },
    };
    if (form.satisfactionLevel) {
      payload.satisfactionLevel = form.satisfactionLevel;
    }
    (editing
      ? updateLocationInstallationFeedback(editing.id, payload)
      : createLocationInstallationFeedback(payload)
    )
      .then((saved) => {
        setList((prev) => (editing ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
        notify(editing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved]);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteLocationInstallationFeedback(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete"));
  };

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>
              Report
            </button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>
              Add comment
            </button>
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
                  <th>Location</th>
                  <th>Comment</th>
                  <th>Satisfaction</th>
                  <th>Submitted</th>
                  <th>By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td>{locationLabel(row.location)}</td>
                    <td style={{ maxWidth: 260 }}>{row.feedbackText || "—"}</td>
                    <td>{formatSatisfaction(row.satisfactionLevel)}</td>
                    <td>{formatDateTime(row.submittedAt)}</td>
                    <td>{userLabel(row.submittedBy)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit comment" onClick={() => openEdit(row)}>
                          <IconEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="entity-empty">
                      No comments yet.
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
              <h2 className="entity-modal-title">
                {editing ? "Edit comment" : "Add comment"}
              </h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              <div className="entity-form-grid">
                <div className="entity-field entity-field--full">
                  <label>Comment *</label>
                  <textarea
                    value={form.feedbackText}
                    onChange={(e) => handleChange("feedbackText", e.target.value)}
                    placeholder="Enter your comment (installation notes, issues, follow-up…)"
                    required
                    rows={4}
                  />
                </div>
                <div className="entity-field">
                  <label>Location *</label>
                  <select
                    value={form.locationId}
                    onChange={(e) => handleChange("locationId", e.target.value)}
                    required
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {locationLabel(loc)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="entity-field">
                  {!editing && isTechnician ? (
                    <>
                      <label>Submitted by</label>
                      <input
                        type="text"
                        className="entity-readonly"
                        readOnly
                        value={userLabel(user) || "—"}
                        aria-label="Submitted by (signed-in user)"
                      />
                    </>
                  ) : (
                    <>
                      <label>Submitted by *</label>
                      <select
                        value={form.submittedByUserId}
                        onChange={(e) => handleChange("submittedByUserId", e.target.value)}
                        required
                      >
                        <option value="">Select user</option>
                        {submitterOptions.map((u) => (
                          <option key={normalizeUserId(u.id)} value={normalizeUserId(u.id)}>
                            {userLabel(u)}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
                <div className="entity-field entity-field--full">
                  <label>Overall satisfaction</label>
                  <select
                    value={form.satisfactionLevel}
                    onChange={(e) => handleChange("satisfactionLevel", e.target.value)}
                  >
                    {SATISFACTION_OPTIONS.map((o) => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
                  {saving ? "Saving…" : editing ? "Update" : "Submit"}
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
        title="Delete this comment?"
        message="This removes the comment permanently."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Comment report"
        generatedBy={
          user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"
        }
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [
            { key: "id", label: "ID" },
            { key: "location", label: "Location" },
            { key: "feedbackText", label: "Comment" },
            { key: "satisfactionLevel", label: "Satisfaction" },
            { key: "submittedAt", label: "Submitted" },
            { key: "submittedBy", label: "Submitted by" },
          ],
          rows: list.map((r) => ({
            id: r.id,
            location: locationLabel(r.location),
            feedbackText: (r.feedbackText || "—").slice(0, 120),
            satisfactionLevel: formatSatisfaction(r.satisfactionLevel),
            submittedAt: formatDateTime(r.submittedAt),
            submittedBy: userLabel(r.submittedBy),
          })),
        })}
      />
    </>
  );
}
