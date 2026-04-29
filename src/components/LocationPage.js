import { useState, useEffect } from "react";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../services/locationService";
import { getAssets } from "../services/assetService";
import { getUsers } from "../services/userService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./LocationPage.css";
import "./EntityPage.css";

const emptyForm = () => ({
  name: "",
  address: "",
  installationDate: "",
  installedByUserId: "",
  assetId: "",
  amount: "",
  paymentDate: "",
  paymentStatus: "PENDING",
});

const labelPerson = (u) =>
  !u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id || "—";

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
  const isTechnician = String(user?.role || "").toUpperCase() === "TECHNICIAN";
  const [locations, setLocations] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assets, setAssets] = useState([]);
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

  useEffect(() => {
    getUsers()
      .then((list) => {
        const users = Array.isArray(list) ? list : [];
        setTechnicians(users.filter((u) => String(u?.role || "").toUpperCase() === "TECHNICIAN"));
      })
      .catch(() => setTechnicians([]));

    getAssets()
      .then((list) => setAssets(Array.isArray(list) ? list : []))
      .catch(() => setAssets([]));
  }, []);

  const openAdd = () => {
    setEditingLocation(null);
    const next = emptyForm();
    if (isTechnician && user?.id) {
      next.installedByUserId = String(user.id);
      next.paymentStatus = "PENDING";
    }
    setForm(next);
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditingLocation(loc);
    setForm({
      name: loc.name || "",
      address: loc.address || "",
      installationDate: loc.installationDate ? String(loc.installationDate).slice(0, 10) : "",
      installedByUserId: loc.installedBy?.id ? String(loc.installedBy.id) : "",
      assetId: loc.asset?.id ? String(loc.asset.id) : "",
      amount: loc.amount != null ? String(loc.amount) : "",
      paymentDate: loc.paymentDate ? String(loc.paymentDate).slice(0, 10) : "",
      paymentStatus: loc.paymentStatus || "PENDING",
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
    const installerId = form.installedByUserId || (isTechnician && user?.id ? String(user.id) : "");
    const paymentStatus =
      isTechnician && editingLocation
        ? editingLocation.paymentStatus || "PENDING"
        : isTechnician
          ? "PENDING"
          : form.paymentStatus || "PENDING";
    const payload = {
      name: form.name.trim(),
      address: form.address?.trim() || null,
      installationDate: form.installationDate || null,
      amount: form.amount !== "" ? Number(form.amount) : null,
      paymentDate: form.paymentDate || null,
      paymentStatus,
      installedBy: installerId ? { id: installerId } : null,
      asset: form.assetId ? { id: form.assetId } : null,
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

  const installedByReadonlyLabel = () => {
    if (!form.installedByUserId) return labelPerson(user);
    const t = technicians.find((x) => String(x.id) === String(form.installedByUserId));
    if (t) return labelPerson(t);
    const ib = editingLocation?.installedBy;
    if (ib && String(ib.id) === String(form.installedByUserId)) {
      return [ib.firstName, ib.lastName].filter(Boolean).join(" ") || ib.email || String(form.installedByUserId);
    }
    if (user && String(user.id) === String(form.installedByUserId)) return labelPerson(user);
    return String(form.installedByUserId);
  };

  const filteredLocations = filterListByQuery(locations, searchQuery, [
    "name",
    "address",
    "paymentStatus",
    (l) => l.asset?.name || l.asset?.assetTag || "",
    (l) => (l.installedBy ? [l.installedBy.firstName, l.installedBy.lastName, l.installedBy.email].filter(Boolean).join(" ") : ""),
  ]);

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
            <table className="entity-data-table">
              <thead>
                <tr>
                  <th>Name/Client Name</th>
                  <th>Address</th>
                  <th>Asset</th>
                  <th>Installed By</th>
                  <th>Install Date</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="t-row">
                    <td>{loc.name || "—"}</td>
                    <td>{loc.address || "—"}</td>
                    <td>{loc.asset ? (loc.asset.name || loc.asset.assetTag || "—") : "—"}</td>
                    <td>{loc.installedBy ? [loc.installedBy.firstName, loc.installedBy.lastName].filter(Boolean).join(" ") || loc.installedBy.email || "—" : "—"}</td>
                    <td>{loc.installationDate || "—"}</td>
                    <td>{loc.paymentStatus || "—"}</td>
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
                    <td colSpan={7} className="location-empty">
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
              <div className="location-form-intro">
                Capture location and installation/payment details in a clear, consistent format.
              </div>
              <div className="location-form-grid">
                <div className="location-field">
                  <label htmlFor="location-name">Name/Client Name *</label>
                  <input
                    id="location-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Location name"
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-building">Address</label>
                  <input
                    id="location-building"
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFormChange("address", e.target.value)}
                    placeholder="Address"
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-floor">Installation Date</label>
                  <input
                    id="location-floor"
                    type="date"
                    value={form.installationDate}
                    onChange={(e) => handleFormChange("installationDate", e.target.value)}
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-room">Installed By (Technician)</label>
                  {isTechnician ? (
                    <>
                      <input
                        id="location-room"
                        type="text"
                        readOnly
                        value={installedByReadonlyLabel()}
                        title="Filled automatically with your account"
                      />
                      <small className="location-field-hint">Recorded as the logged-in technician.</small>
                    </>
                  ) : (
                    <select
                      id="location-room"
                      value={form.installedByUserId}
                      onChange={(e) => handleFormChange("installedByUserId", e.target.value)}
                    >
                      <option value="">Select technician</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {[t.firstName, t.lastName].filter(Boolean).join(" ") || t.email || t.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="location-field">
                  <label htmlFor="location-asset">Asset</label>
                  <select
                    id="location-asset"
                    value={form.assetId}
                    onChange={(e) => handleFormChange("assetId", e.target.value)}
                  >
                    <option value="">Select asset (optional)</option>
                    {assets.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name || a.assetTag || a.id}
                        {a.assetTag ? ` (${a.assetTag})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="location-field">
                  <label htmlFor="location-amount">Amount</label>
                  <input
                    id="location-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-payment-date">Payment Date</label>
                  <input
                    id="location-payment-date"
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => handleFormChange("paymentDate", e.target.value)}
                  />
                </div>
                <div className="location-field">
                  <label htmlFor="location-payment-status">Payment Status</label>
                  {isTechnician ? (
                    <>
                      <input
                        id="location-payment-status"
                        type="text"
                        readOnly
                        value={form.paymentStatus === "PAID" ? "Paid" : "Pending"}
                        title={editingLocation ? "Only finance can change payment status" : "New locations start as Pending until finance confirms payment"}
                      />
                      <small className="location-field-hint">
                        {editingLocation
                          ? "Shown for your reference. Finance updates this when payment is confirmed."
                          : "Saved as Pending. Finance will update this after payment is confirmed."}
                      </small>
                    </>
                  ) : (
                    <>
                      <select
                        id="location-payment-status"
                        value={form.paymentStatus}
                        onChange={(e) => handleFormChange("paymentStatus", e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                      </select>
                      <small className="location-field-hint">Use Paid only after payment is fully confirmed.</small>
                    </>
                  )}
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
          columns: [
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "address", label: "Address" },
            { key: "asset", label: "Asset" },
            { key: "installedBy", label: "Installed By" },
            { key: "installationDate", label: "Installation Date" },
            { key: "amount", label: "Amount" },
            { key: "paymentDate", label: "Payment Date" },
            { key: "paymentStatus", label: "Payment Status" },
          ],
          rows: locations.map((l) => ({
            id: l.id,
            name: l.name || "—",
            address: l.address || "—",
            asset: l.asset ? (l.asset.name || l.asset.assetTag || "—") : "—",
            installedBy: l.installedBy ? [l.installedBy.firstName, l.installedBy.lastName].filter(Boolean).join(" ") || l.installedBy.email || "—" : "—",
            installationDate: l.installationDate || "—",
            amount: l.amount != null ? String(l.amount) : "—",
            paymentDate: l.paymentDate || "—",
            paymentStatus: l.paymentStatus || "—",
          })),
        })}
      />
    </>
  );
}
