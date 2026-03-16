import { useState, useEffect } from "react";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../services/locationService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./LocationPage.css";
import "./EntityPage.css";

const emptyForm = () => ({ name: "", building: "", floor: "", room: "" });

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

export default function LocationPage({ user, onLocationsChange, searchQuery }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (list) => {
    if (typeof onLocationsChange === "function") onLocationsChange(list);
  };

  useEffect(() => {
    notify(undefined);
    setLoading(true);
    setError("");
    getLocations()
      .then((list) => {
        setLocations(list);
        notify(list);
      })
      .catch((err) => setError(err.message || "Failed to load locations"))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditingLocation(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditingLocation(loc);
    setForm({
      name: loc.name || "",
      building: loc.building || "",
      floor: loc.floor || "",
      room: loc.room || "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLocation(null);
    setFormError("");
    setDeleteConfirm(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name?.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      building: form.building?.trim() || null,
      floor: form.floor?.trim() || null,
      room: form.room?.trim() || null,
    };
    (editingLocation
      ? updateLocation(editingLocation.id, payload)
      : createLocation(payload))
      .then((saved) => {
        const next = editingLocation
          ? locations.map((l) => (l.id === saved.id ? saved : l))
          : [...locations, saved];
        setLocations(next);
        notify(next);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save location"))
      .finally(() => setSaving(false));
  };

  const requestDelete = () => setDeleteConfirm(editingLocation?.id ?? null);
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteLocation(deleteConfirm)
      .then(() => {
        const next = locations.filter((l) => l.id !== deleteConfirm);
        setLocations(next);
        notify(next);
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete location"));
  };

  const filteredLocations = filterListByQuery(locations, searchQuery, ["name", "building", "floor", "room"]);

  return (
    <>
      <div className="card">
        <div className="location-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="location-add-btn" onClick={openAdd}>
              Add Location
            </button>
          </div>
        </div>
        {error && <p className="location-error">{error}</p>}
        {loading ? (
          <p className="location-loading">Loading locations…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>Room</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="t-row">
                    <td className="td-id">{loc.id}</td>
                    <td>{loc.name || "—"}</td>
                    <td>{loc.building || "—"}</td>
                    <td>{loc.floor || "—"}</td>
                    <td>{loc.room || "—"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(loc)}
                        >
                          <IconEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLocations.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="location-empty">
                      No locations yet. Click &quot;Add Location&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="location-modal-overlay" onClick={closeModal}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="location-modal-header">
              <h2 className="location-modal-title">
                {editingLocation ? "Edit Location" : "Add Location"}
              </h2>
              <button type="button" className="location-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="location-modal-body">
              {formError && <p className="location-error">{formError}</p>}
              <div className="location-form-grid">
                <div className="location-field">
                  <label htmlFor="location-name">Name *</label>
                  <input
                    id="location-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Location name"
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-building">Building</label>
                  <input
                    id="location-building"
                    type="text"
                    value={form.building}
                    onChange={(e) => handleFormChange("building", e.target.value)}
                    placeholder="e.g. Block A"
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-floor">Floor</label>
                  <input
                    id="location-floor"
                    type="text"
                    value={form.floor}
                    onChange={(e) => handleFormChange("floor", e.target.value)}
                    placeholder="e.g. 2nd"
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-room">Room</label>
                  <input
                    id="location-room"
                    type="text"
                    value={form.room}
                    onChange={(e) => handleFormChange("room", e.target.value)}
                    placeholder="e.g. 201"
                  />
                </div>
              </div>
              <div className="location-modal-footer">
                {editingLocation && (
                  <button
                    type="button"
                    className="location-btn location-btn--danger"
                    onClick={requestDelete}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="location-btn location-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="location-btn location-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingLocation ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete location?"
        message="Are you sure you want to delete this location? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Location Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "building", label: "Building" }, { key: "floor", label: "Floor" }, { key: "room", label: "Room" }],
          rows: locations.map((l) => ({ id: l.id, name: l.name || "—", building: l.building || "—", floor: l.floor || "—", room: l.room || "—" })),
        })}
      />
    </>
  );
}
