import React from "react";
import "./AssetScanView.css";

const formatDate = (d) =>
  !d ? "—" : (typeof d === "string" ? d.slice(0, 10) : String(d));
const formatMoney = (n) =>
  n != null && n !== "" ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—";

export function AssetScanView({ asset, onClose, showClose = true, preview = false }) {
  if (!asset || typeof asset !== "object") {
    return (
      <div className={preview ? "asset-scan-view-preview" : "asset-scan-view"}>
        <div className="asset-scan-view-card">
          <p className="asset-scan-view-error">Invalid or missing asset data.</p>
          {showClose && !preview && (
            <button type="button" className="asset-scan-view-close" onClick={onClose} style={{ margin: '0 auto 16px', display: 'block' }}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const rows = [
    { label: "Asset Tag", value: asset.assetTag },
    { label: "Name", value: asset.name },
    { label: "Description", value: asset.description },
    { label: "Serial Number", value: asset.serialNumber },
    { label: "Status", value: asset.status },
    { label: "Department", value: asset.department },
    { label: "Purchase Date", value: formatDate(asset.purchaseDate) },
    { label: "Purchase Cost", value: asset.purchaseCost != null ? formatMoney(asset.purchaseCost) : "—" },
    { label: "Current Value", value: asset.currentValue != null ? formatMoney(asset.currentValue) : "—" },
    { label: "Warranty Expiry", value: formatDate(asset.warrantyExpiryDate) },
    ...(asset.supplierName || asset.supplierEmail || asset.supplierPhone
      ? [{ label: "Supplier", value: [asset.supplierName, asset.supplierEmail, asset.supplierPhone].filter(Boolean).join(" · ") }]
      : []),
    { label: "Category", value: asset.category?.name || "—" },
    {
      label: "Location",
      value: asset.location
        ? [asset.location.name, asset.location.address]
            .filter(Boolean)
            .join(", ") || "—"
        : "—",
    },
  ].filter((r) => r.value !== undefined && r.value !== "");

  return (
    <div className={preview ? "asset-scan-view-preview" : "asset-scan-view"}>
      <div className="asset-scan-view-card">
        <div className="asset-scan-view-header">
          <h1 className="asset-scan-view-title">
            {asset.name || asset.assetTag || "Asset"}
          </h1>
          {showClose && (
            <button
              type="button"
              className="asset-scan-view-close"
              aria-label="Close"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>
        <div className="asset-scan-view-badge-wrap">
          <span className={`asset-scan-view-status ${(asset.status || "").replace(/_/g, "-")}`}>
            {asset.status || "—"}
          </span>
        </div>
        <div className="asset-scan-view-body">
          {rows.map(({ label, value }) => (
            <div key={label} className="asset-scan-view-row">
              <span className="asset-scan-view-label">{label}</span>
              <span className="asset-scan-view-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AssetScanView;
