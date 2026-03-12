import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getAssets, createAsset, updateAsset, deleteAsset, getNextAssetTag } from "../services/assetService";
import { getAssetCategories } from "../services/assetCategoryService";
import { getLocations } from "../services/locationService";
import AssetScanView from "./AssetScanView";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./AssetPage.css";

const ASSET_STATUS_OPTIONS = ["AVAILABLE", "IN_USE", "UNDER_MAINTENANCE", "DISPOSED", "RESERVED"];
const DEPARTMENT_OPTIONS = ["HR", "IT", "FINANCE", "OPERATIONS", "MARKETING", "LEGAL", "LOGISTICS", "MANAGEMENT", "SECURITY"];

const ASSET_STATUS_DESCRIPTIONS = {
  AVAILABLE: "Ready to be assigned or used. The asset is in inventory and not currently allocated to anyone.",
  IN_USE: "Currently assigned to a user or in active use. The asset is part of daily operations.",
  UNDER_MAINTENANCE: "Temporarily out of service for repair or servicing. Not available for assignment until maintenance is complete.",
  DISPOSED: "No longer in use. The asset has been written off, sold, or discarded and is removed from active inventory.",
  RESERVED: "Allocated for a specific purpose or user but not yet in use. The asset is held and cannot be assigned to others.",
};

const getStatusLabel = (status) => (status || "").replace(/_/g, " ");

const emptyAssetForm = () => ({
  assetTag: "",
  name: "",
  description: "",
  serialNumber: "",
  purchaseDate: "",
  purchaseCost: "",
  currentValue: "",
  usefulLifeYears: "",
  salvageValue: "",
  status: "AVAILABLE",
  warrantyExpiryDate: "",
  department: "IT",
  supplierName: "",
  supplierEmail: "",
  supplierPhone: "",
  categoryId: "",
  locationId: "",
});

const IconGear = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconQR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h1v1h-1zM16 14h1v1h-1zM14 16h1v1h-1zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h1v1h-1z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

function getAssetScanUrl(asset) {
  try {
    const json = JSON.stringify(asset);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}${window.location.pathname}?v=asset&d=${encodeURIComponent(base64)}`;
  } catch (e) {
    return JSON.stringify(asset);
  }
}

function useMobileScanUrl() {
  const [mobileBaseUrl, setMobileBaseUrl] = useState(null);
  useEffect(() => {
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      setMobileBaseUrl(origin);
      return;
    }
    const port = window.location.port || "3000";
    let cancelled = false;
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {});
    pc.onicecandidate = (e) => {
      if (cancelled || !e.candidate) return;
      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (match && match[1] && !/^127\./.test(match[1])) {
        setMobileBaseUrl(`http://${match[1]}:${port}`);
        pc.close();
      }
    };
    const t = setTimeout(() => {
      pc.close();
      if (!cancelled) setMobileBaseUrl(null);
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      pc.close();
    };
  }, []);
  return mobileBaseUrl;
}

export default function AssetPage({ user, onAssetsChange, searchQuery, readOnly }) {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState(emptyAssetForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [qrModalAsset, setQrModalAsset] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportFilterStatus, setReportFilterStatus] = useState("");
  const [reportFilterDepartment, setReportFilterDepartment] = useState("");
  const [nextTagPreview, setNextTagPreview] = useState(null);
  const [nextTagLoading, setNextTagLoading] = useState(false);
  const [statusPopoverAssetId, setStatusPopoverAssetId] = useState(null);
  const [statusPopoverFormOpen, setStatusPopoverFormOpen] = useState(false);
  const mobileBaseUrl = useMobileScanUrl();

  const filteredAssets = filterListByQuery(assets, searchQuery, [
    "assetTag",
    "name",
    "status",
    "department",
    "supplierName",
    "supplierEmail",
    (a) => a.category?.name,
    (a) => a.location?.name,
  ]);

  const notifyAssetsChange = (list) => {
    if (typeof onAssetsChange === "function") onAssetsChange(list);
  };

  useEffect(() => {
    notifyAssetsChange(undefined);
    setLoading(true);
    setError("");
    getAssets()
      .then((list) => {
        setAssets(list);
        notifyAssetsChange(list);
      })
      .catch((err) => setError(err.message || "Failed to load assets"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getAssetCategories().then(setCategories).catch(() => setCategories([]));
    getLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  // When adding an asset, fetch next tag for selected department so it shows in the form
  useEffect(() => {
    if (!modalOpen || editingAsset || !form.department) {
      setNextTagPreview(null);
      return;
    }
    let cancelled = false;
    setNextTagLoading(true);
    setNextTagPreview(null);
    getNextAssetTag(form.department)
      .then((data) => {
        if (!cancelled && data && data.nextTag) setNextTagPreview(data.nextTag);
      })
      .catch(() => {
        if (!cancelled) setNextTagPreview(null);
      })
      .finally(() => {
        if (!cancelled) setNextTagLoading(false);
      });
    return () => { cancelled = true; };
  }, [modalOpen, editingAsset, form.department]);

  const openAdd = () => {
    setEditingAsset(null);
    setForm(emptyAssetForm());
    setFormError("");
    setDeleteConfirm(null);
    setNextTagPreview(null);
    setNextTagLoading(false);
    setModalOpen(true);
  };

  const openEdit = (asset) => {
    setEditingAsset(asset);
    setForm({
      assetTag: asset.assetTag || "",
      name: asset.name || "",
      description: asset.description || "",
      serialNumber: asset.serialNumber || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "",
      purchaseCost: asset.purchaseCost != null ? String(asset.purchaseCost) : "",
      currentValue: asset.currentValue != null ? String(asset.currentValue) : "",
      usefulLifeYears: asset.usefulLifeYears != null ? String(asset.usefulLifeYears) : "",
      salvageValue: asset.salvageValue != null ? String(asset.salvageValue) : "",
      status: asset.status || "AVAILABLE",
      warrantyExpiryDate: asset.warrantyExpiryDate ? asset.warrantyExpiryDate.slice(0, 10) : "",
      department: asset.department || "IT",
      supplierName: asset.supplierName || "",
      supplierEmail: asset.supplierEmail || "",
      supplierPhone: asset.supplierPhone || "",
      categoryId: asset.category?.id != null ? String(asset.category.id) : "",
      locationId: asset.location?.id != null ? String(asset.location.id) : "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAsset(null);
    setFormError("");
    setDeleteConfirm(null);
    setNextTagPreview(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      serialNumber: form.serialNumber?.trim() || null,
      purchaseDate: form.purchaseDate || null,
      purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : null,
      currentValue: form.currentValue ? parseFloat(form.currentValue) : null,
      usefulLifeYears: form.usefulLifeYears ? parseInt(form.usefulLifeYears, 10) : null,
      salvageValue: form.salvageValue ? parseFloat(form.salvageValue) : null,
      status: form.status,
      qrCode: null,
      warrantyExpiryDate: form.warrantyExpiryDate || null,
      department: form.department,
      supplierName: form.supplierName?.trim() || null,
      supplierEmail: form.supplierEmail?.trim() || null,
      supplierPhone: form.supplierPhone?.trim() || null,
    };
    if (editingAsset) {
      payload.assetTag = form.assetTag?.trim() || null;
    }
    if (form.categoryId?.trim()) payload.category = { id: form.categoryId.trim() };
    if (form.locationId?.trim()) payload.location = { id: form.locationId.trim() };
    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name?.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    const payload = buildPayload();
    (editingAsset ? updateAsset(editingAsset.id, payload) : createAsset(payload))
      .then((saved) => {
        const next = editingAsset
          ? assets.map((a) => (a.id === saved.id ? saved : a))
          : [...assets, saved];
        setAssets(next);
        notifyAssetsChange(next);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save asset"))
      .finally(() => setSaving(false));
  };

  const requestDelete = () => setDeleteConfirm(editingAsset?.id ?? null);
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteAsset(deleteConfirm)
      .then(() => {
        const next = assets.filter((a) => a.id !== deleteConfirm);
        setAssets(next);
        notifyAssetsChange(next);
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete asset"));
  };

  return (
    <>
      <div className="card">
        <div className="asset-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>
              Report
            </button>
            {!readOnly && (
            <button type="button" className="asset-add-btn" onClick={openAdd}>
              Add Asset
            </button>
            )}
          </div>
        </div>
        {error && <p className="asset-error">{error}</p>}
        {loading ? (
          <p className="asset-loading">Loading assets…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Supplier</th>
                  <th>Purchase Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="t-row">
                    <td className="td-id">{asset.assetTag || "—"}</td>
                    <td>{asset.name || "—"}</td>
                    <td>
                      <div className="asset-status-cell">
                        <span className={`asset-status-badge ${asset.status || ""}`}>
                          {getStatusLabel(asset.status) || "—"}
                        </span>
                        {asset.status && ASSET_STATUS_DESCRIPTIONS[asset.status] && (
                          <div
                            className="asset-status-info-trigger"
                            onMouseEnter={() => setStatusPopoverAssetId(asset.id)}
                            onMouseLeave={() => setStatusPopoverAssetId(null)}
                          >
                            <span className="asset-status-info-icon" aria-label="Status description">
                              <IconInfo />
                            </span>
                            {statusPopoverAssetId === asset.id && (
                              <div className="asset-status-popover" role="tooltip">
                                <div className="asset-status-popover-title">{getStatusLabel(asset.status)}</div>
                                <p className="asset-status-popover-desc">{ASSET_STATUS_DESCRIPTIONS[asset.status]}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{asset.department || "—"}</td>
                    <td>{asset.supplierName || "—"}</td>
                    <td className="td-date">
                      {asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : "—"}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="View QR Code"
                          onClick={() => setQrModalAsset(asset)}
                          title="View QR Code"
                        >
                          <IconQR />
                        </button>
                        {!readOnly && (
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(asset)}
                        >
                          <IconGear />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAssets.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="asset-empty">
                      {readOnly ? "No assets found." : 'No assets yet. Click "Add Asset" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="asset-modal-overlay" onClick={closeModal}>
          <div className="asset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="asset-modal-header">
              <h2 className="asset-modal-title">{editingAsset ? "Edit Asset" : "Add Asset"}</h2>
              <button type="button" className="asset-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="asset-modal-body">
              {formError && <p className="asset-error">{formError}</p>}
              {editingAsset && (
                <div className="asset-qr-section">
                  <p className="asset-qr-label">Asset QR Code (contains all saved data)</p>
                  <div className="asset-qr-wrap">
                    <QRCodeSVG value={JSON.stringify(editingAsset)} size={160} level="M" />
                  </div>
                </div>
              )}
              <div className="asset-form-sections">
                <section className="asset-form-section">
                  <h3 className="asset-form-section-title">Identification</h3>
                  <div className="asset-form-grid">
                <div className="asset-field">
                  <label htmlFor="asset-dept">Department *</label>
                  <select
                    id="asset-dept"
                    value={form.department}
                    onChange={(e) => handleFormChange("department", e.target.value)}
                  >
                    {DEPARTMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span className="asset-field-hint">
                    {editingAsset ? "Department cannot be changed after creation." : "Select first — asset tag is generated from this (e.g. FB-IT-001)."}
                  </span>
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-tag">Asset Tag</label>
                  {editingAsset ? (
                    <input
                      id="asset-tag"
                      type="text"
                      value={form.assetTag}
                      readOnly
                      className="asset-field-readonly"
                      aria-label="Asset tag (auto-generated, read-only)"
                    />
                  ) : (
                    <input
                      id="asset-tag"
                      type="text"
                      value={nextTagLoading ? "Loading…" : (nextTagPreview || "—")}
                      readOnly
                      disabled
                      className="asset-field-readonly"
                      aria-label="Asset tag generated from department"
                    />
                  )}
                  <span className="asset-field-hint">
                    {editingAsset ? "Cannot be changed." : "Generated from department (e.g. FB-IT-001, FB-HR-002)."}
                  </span>
                </div>
                <div className="asset-field full-width">
                  <label htmlFor="asset-name">Name *</label>
                  <input
                    id="asset-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="e.g. Dell Latitude 5520"
                  />
                </div>
                <div className="asset-field full-width">
                  <label htmlFor="asset-desc">Description</label>
                  <textarea
                    id="asset-desc"
                    value={form.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    placeholder="Optional description of the asset"
                    rows={3}
                  />
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-serial">Serial Number</label>
                  <input
                    id="asset-serial"
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) => handleFormChange("serialNumber", e.target.value)}
                    placeholder="Manufacturer serial"
                  />
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-status" className="asset-field-label-with-info">
                    Status
                    <span
                      className="asset-status-info-wrap"
                      onMouseEnter={() => setStatusPopoverFormOpen(true)}
                      onMouseLeave={() => setStatusPopoverFormOpen(false)}
                    >
                      <span className="asset-status-info-icon" aria-label="Status description">
                        <IconInfo />
                      </span>
                      {statusPopoverFormOpen && form.status && ASSET_STATUS_DESCRIPTIONS[form.status] && (
                        <div className="asset-status-popover asset-status-popover--form" role="tooltip">
                          <div className="asset-status-popover-title">{getStatusLabel(form.status)}</div>
                          <p className="asset-status-popover-desc">{ASSET_STATUS_DESCRIPTIONS[form.status]}</p>
                        </div>
                      )}
                    </span>
                  </label>
                  <select
                    id="asset-status"
                    value={form.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    {ASSET_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{getStatusLabel(opt)}</option>
                    ))}
                  </select>
                </div>
                  </div>
                </section>

                <section className="asset-form-section">
                  <h3 className="asset-form-section-title">Classification</h3>
                  <div className="asset-form-grid">
                    <div className="asset-field">
                      <label htmlFor="asset-category-id">Category</label>
                      <select
                        id="asset-category-id"
                        value={form.categoryId}
                        onChange={(e) => handleFormChange("categoryId", e.target.value)}
                      >
                        <option value="">Select category (optional)</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.name || `Category ${cat.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="asset-field">
                      <label htmlFor="asset-location-id">Location</label>
                      <select
                        id="asset-location-id"
                        value={form.locationId}
                        onChange={(e) => handleFormChange("locationId", e.target.value)}
                      >
                        <option value="">Select location (optional)</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={String(loc.id)}>
                            {loc.name || `Location ${loc.id}`}
                            {loc.building || loc.floor || loc.room
                              ? ` — ${[loc.building, loc.floor, loc.room].filter(Boolean).join(", ")}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="asset-form-section">
                  <h3 className="asset-form-section-title">Purchase & valuation</h3>
                  <div className="asset-form-grid">
                <div className="asset-field">
                  <label htmlFor="asset-purchase-date">Purchase Date</label>
                  <input
                    id="asset-purchase-date"
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => handleFormChange("purchaseDate", e.target.value)}
                  />
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-cost">Purchase Cost</label>
                  <input
                    id="asset-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchaseCost}
                    onChange={(e) => handleFormChange("purchaseCost", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-value">Current Value</label>
                  <input
                    id="asset-value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.currentValue}
                    onChange={(e) => handleFormChange("currentValue", e.target.value)}
                    placeholder="0.00"
                  />
                  {editingAsset && (
                    <span className="asset-field-hint">Backend keeps existing value on update.</span>
                  )}
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-useful-life">Useful life (years)</label>
                  <input
                    id="asset-useful-life"
                    type="number"
                    min="1"
                    step="1"
                    value={form.usefulLifeYears}
                    onChange={(e) => handleFormChange("usefulLifeYears", e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="asset-field">
                  <label htmlFor="asset-salvage">Salvage value</label>
                  <input
                    id="asset-salvage"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.salvageValue}
                    onChange={(e) => handleFormChange("salvageValue", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                  </div>
                </section>

                <section className="asset-form-section">
                  <h3 className="asset-form-section-title">Warranty & supplier</h3>
                  <div className="asset-form-grid">
                <div className="asset-field">
                  <label htmlFor="asset-warranty">Warranty expiry date</label>
                  <input
                    id="asset-warranty"
                    type="date"
                    value={form.warrantyExpiryDate}
                    onChange={(e) => handleFormChange("warrantyExpiryDate", e.target.value)}
                  />
                </div>
                <div className="asset-field full-width asset-supplier-section">
                  <span className="asset-supplier-heading">Supplier (for warranty & support)</span>
                  <div className="asset-supplier-fields">
                    <div className="asset-field">
                      <label htmlFor="asset-supplier-name">Name</label>
                      <input
                        id="asset-supplier-name"
                        type="text"
                        value={form.supplierName}
                        onChange={(e) => handleFormChange("supplierName", e.target.value)}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div className="asset-field">
                      <label htmlFor="asset-supplier-email">Email</label>
                      <input
                        id="asset-supplier-email"
                        type="email"
                        value={form.supplierEmail}
                        onChange={(e) => handleFormChange("supplierEmail", e.target.value)}
                        placeholder="support@supplier.com"
                      />
                    </div>
                    <div className="asset-field">
                      <label htmlFor="asset-supplier-phone">Phone</label>
                      <input
                        id="asset-supplier-phone"
                        type="tel"
                        value={form.supplierPhone}
                        onChange={(e) => handleFormChange("supplierPhone", e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>
                  </div>
                </section>
              </div>
              <div className="asset-modal-footer">
                {editingAsset && (
                  <button
                    type="button"
                    className="asset-btn asset-btn--danger"
                    onClick={requestDelete}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="asset-btn asset-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="asset-btn asset-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingAsset ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal (Yes / No) */}
      {deleteConfirm && (
        <div className="asset-delete-modal-overlay" onClick={cancelDelete}>
          <div className="asset-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="asset-delete-modal-inner">
              <div className="asset-delete-modal-icon">
                <IconTrash />
              </div>
              <h2 className="asset-delete-modal-title">Delete asset?</h2>
              <p className="asset-delete-modal-message">
                Are you sure you want to delete this asset? This action cannot be undone.
              </p>
              <div className="asset-delete-modal-actions">
                <button type="button" className="asset-delete-btn-no" onClick={cancelDelete}>
                  No, cancel
                </button>
                <button type="button" className="asset-delete-btn-yes" onClick={confirmDelete}>
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrModalAsset && (
        <div className="asset-modal-overlay asset-qr-modal-overlay" onClick={() => setQrModalAsset(null)}>
          <div className="asset-qr-modal asset-qr-modal--with-preview" onClick={(e) => e.stopPropagation()}>
                <div className="asset-qr-modal-header">
                  <h3 className="asset-qr-modal-title">QR Code — {qrModalAsset.name || qrModalAsset.assetTag || "Asset"}</h3>
                  <div className="asset-qr-modal-actions">
                    <button type="button" className="asset-btn asset-btn--secondary asset-btn--print" onClick={() => window.print()} title="For a clean print, turn off 'Headers and footers' in the print dialog">
                      Print
                    </button>
                    <button type="button" className="asset-modal-close" aria-label="Close" onClick={() => setQrModalAsset(null)}>
                      <IconClose />
                    </button>
                  </div>
                </div>
            <div className="asset-qr-modal-body">
              <p className="asset-qr-print-hint">Tip: In the print dialog, turn off &quot;Headers and footers&quot; to hide the browser URL and date.</p>
              {/* Shown only when printing: asset name above QR */}
              <div className="asset-qr-print-title" aria-hidden="true">
                {qrModalAsset.name || qrModalAsset.assetTag || "Asset"}
              </div>
              <p className="asset-qr-hint">Scan with your phone. The QR contains a link — when opened on your phone it shows the asset in a clear view (no JSON).</p>
              {window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1") ? (
                <div className="asset-qr-mobile-tip">
                  <strong>To view on phone after scanning:</strong> use the same WiFi and open this app on your computer at{" "}
                  {mobileBaseUrl ? (
                    <a href={mobileBaseUrl} target="_blank" rel="noopener noreferrer" className="asset-qr-mobile-link">{mobileBaseUrl}</a>
                  ) : (
                    <span className="asset-qr-mobile-placeholder">http://YOUR_PC_IP:3000</span>
                  )}
                  {" "}then scan the QR. The phone will open that link and show the asset.
                </div>
              ) : (
                <p className="asset-qr-hint asset-qr-hint--ok">Your phone can open the link after scanning (same network or internet).</p>
              )}
              <div className="asset-qr-wrap asset-qr-wrap--large">
                <QRCodeSVG value={getAssetScanUrl(qrModalAsset)} size={220} level="M" />
              </div>
              <p className="asset-qr-preview-label" style={{ marginTop: 16 }}>Preview</p>
              <div className="asset-qr-preview-wrap">
                <AssetScanView asset={qrModalAsset} showClose={false} preview />
              </div>
            </div>
          </div>
        </div>
      )}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Asset Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => (
          <>
            <div className="entity-field">
              <label>Status</label>
              <select value={reportFilterStatus} onChange={(e) => setReportFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {ASSET_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="entity-field">
              <label>Department</label>
              <select value={reportFilterDepartment} onChange={(e) => setReportFilterDepartment(e.target.value)}>
                <option value="">All departments</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </>
        )}
        getReportData={() => {
          let list = assets;
          if (reportFilterStatus) list = list.filter((a) => (a.status || "").toUpperCase() === reportFilterStatus.toUpperCase());
          if (reportFilterDepartment) list = list.filter((a) => (a.department || "").toUpperCase() === reportFilterDepartment.toUpperCase());
          return {
            columns: [
              { key: "assetTag", label: "Asset Tag" },
              { key: "name", label: "Name" },
              { key: "status", label: "Status" },
              { key: "department", label: "Department" },
              { key: "supplierName", label: "Supplier" },
              { key: "purchaseDate", label: "Purchase Date" },
            ],
            rows: list.map((a) => ({
              assetTag: a.assetTag || "—",
              name: a.name || "—",
              status: a.status || "—",
              department: a.department || "—",
              supplierName: a.supplierName || "—",
              purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : "—",
            })),
          };
        }}
      />
    </>
  );
}
