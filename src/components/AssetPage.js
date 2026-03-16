import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getAssets, createAsset, updateAsset, deleteAsset, getNextAssetTag } from "../services/assetService";
import { getAssetCategories } from "../services/assetCategoryService";
import { getLocations } from "../services/locationService";
import AssetScanView from "./AssetScanView";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const ASSET_STATUS_OPTIONS = ["AVAILABLE", "IN_USE", "UNDER_MAINTENANCE", "DISPOSED", "RESERVED"];
const DEPARTMENT_OPTIONS   = ["HR","IT","FINANCE","OPERATIONS","MARKETING","LEGAL","LOGISTICS","MANAGEMENT","SECURITY"];

const ASSET_STATUS_DESCRIPTIONS = {
  AVAILABLE:         "Ready to be assigned or used. The asset is in inventory and not currently allocated to anyone.",
  IN_USE:            "Currently assigned to a user or in active use. The asset is part of daily operations.",
  UNDER_MAINTENANCE: "Temporarily out of service for repair or servicing. Not available for assignment until maintenance is complete.",
  DISPOSED:          "No longer in use. The asset has been written off, sold, or discarded and is removed from active inventory.",
  RESERVED:          "Allocated for a specific purpose or user but not yet in use. The asset is held and cannot be assigned to others.",
};

const STATUS_COLORS = {
  AVAILABLE:         { bg:"rgba(11,143,99,0.09)",  text:"#0b7a56",  dot:"#0b8f63" },
  IN_USE:            { bg:"rgba(26,143,209,0.1)",  text:"#0e6fa8",  dot:"#1a8fd1" },
  UNDER_MAINTENANCE: { bg:"rgba(217,119,6,0.1)",   text:"#b45309",  dot:"#d97706" },
  DISPOSED:          { bg:"rgba(100,116,139,0.1)", text:"#475569",  dot:"#64748b" },
  RESERVED:          { bg:"rgba(124,58,237,0.09)", text:"#6d28d9",  dot:"#7c3aed" },
};

const getStatusLabel = (s) => (s || "").replace(/_/g, " ");

const emptyForm = () => ({
  assetTag:"", name:"", description:"", serialNumber:"",
  purchaseDate:"", purchaseCost:"", currentValue:"",
  usefulLifeYears:"", salvageValue:"", status:"AVAILABLE",
  warrantyExpiryDate:"", department:"IT",
  supplierName:"", supplierEmail:"", supplierPhone:"",
  categoryId:"", locationId:"",
});

/* ─────────────────────────────────────────────────────────────
   STYLES — same design system as Dashboard (Syne + DM Sans)
───────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

/* ── Variables (inherit from Dashboard when available) ── */
.ap-root {
  --blue:      #1a8fd1;
  --blue-lt:   #3db8f5;
  --blue-dk:   #0e6fa8;
  --blue-deep: #0d5f96;
  --bg:        #f1f5f9;
  --surface:   #ffffff;
  --surface2:  #f8fafc;
  --border:    #dde6ef;
  --border-lt: #eaf1f7;
  --ink:       #0c1f2e;
  --ink2:      #3a566b;
  --ink3:      #6b8699;
  --ink4:      #a0b8c5;
  --success:   #0b8f63;
  --danger:    #c0392b;
  --warn:      #d97706;
  --fd: 'Syne', sans-serif;
  --fb: 'DM Sans', sans-serif;
  --r:    10px;
  --r-lg: 13px;
  font-family: var(--fb);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

/* ── TOOLBAR ── */
.ap-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 10px;
}
.ap-toolbar-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ap-toolbar-title {
  font-family: var(--fd);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.03em;
}
.ap-toolbar-count {
  font-family: var(--fb);
  font-size: 0.71rem;
  color: var(--ink4);
}
.ap-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Buttons */
.ap-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-family: var(--fb);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
  white-space: nowrap;
}
.ap-btn:active { transform: scale(0.98); }
.ap-btn--ghost {
  background: var(--surface);
  color: var(--ink2);
  border: 1px solid var(--border);
}
.ap-btn--ghost:hover {
  border-color: var(--blue);
  color: var(--blue);
  background: rgba(26,143,209,0.04);
}
.ap-btn--primary {
  background: var(--blue);
  color: #fff;
}
.ap-btn--primary:hover { background: var(--blue-dk); }
.ap-btn--primary:disabled { opacity: 0.55; cursor: not-allowed; }
.ap-btn--danger {
  background: rgba(192,57,43,0.08);
  color: var(--danger);
  border: 1px solid rgba(192,57,43,0.2);
}
.ap-btn--danger:hover { background: var(--danger); color: #fff; border-color: var(--danger); }
.ap-btn--secondary {
  background: var(--surface2);
  color: var(--ink2);
  border: 1px solid var(--border);
}
.ap-btn--secondary:hover { background: var(--bg); }

/* ── TABLE CARD ── */
.ap-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.ap-table-wrap { overflow-x: auto; }
.ap-table {
  width: 100%;
  border-collapse: collapse;
}
.ap-table thead tr {
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
}
.ap-table thead th {
  padding: 11px 15px;
  font-family: var(--fb);
  font-size: 0.61rem;
  font-weight: 600;
  color: var(--ink4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: left;
  white-space: nowrap;
}
.ap-table tbody tr {
  border-bottom: 1px solid var(--border-lt);
  transition: background 0.12s;
  cursor: default;
}
.ap-table tbody tr:last-child { border-bottom: none; }
.ap-table tbody tr:hover { background: var(--surface2); }
.ap-table td {
  padding: 12px 15px;
  font-family: var(--fb);
  font-size: 0.8rem;
  color: var(--ink);
  vertical-align: middle;
}

/* Tag cell */
.ap-td-tag {
  font-family: var(--fd);
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--blue);
  white-space: nowrap;
}
.ap-td-name { font-weight: 500; }
.ap-td-muted { color: var(--ink3); font-size: 0.77rem; }
.ap-td-date { white-space: nowrap; font-size: 0.76rem; color: var(--ink3); }

/* Status badge */
.ap-status-cell { display: flex; align-items: center; gap: 7px; }
.ap-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: var(--fb);
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: capitalize;
}
.ap-status-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Info trigger */
.ap-info-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: default;
}
.ap-info-icon {
  color: var(--ink4);
  display: flex;
  align-items: center;
  transition: color 0.14s;
}
.ap-info-trigger:hover .ap-info-icon { color: var(--blue); }

.ap-status-popover {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  width: 240px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  box-shadow: 0 8px 28px rgba(12,31,46,0.13), 0 2px 8px rgba(12,31,46,0.06);
  padding: 11px 13px;
  z-index: 500;
  pointer-events: none;
  animation: popIn 0.12s ease;
}
@keyframes popIn {
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.ap-status-popover-title {
  font-family: var(--fd);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 5px;
  text-transform: capitalize;
}
.ap-status-popover-desc {
  font-family: var(--fb);
  font-size: 0.73rem;
  color: var(--ink3);
  line-height: 1.55;
}

/* Action buttons */
.ap-action-cell { display: flex; align-items: center; gap: 4px; }
.ap-action-btn {
  width: 30px; height: 30px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--ink3);
  cursor: pointer;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.14s;
}
.ap-action-btn:hover {
  border-color: var(--blue);
  color: var(--blue);
  background: rgba(26,143,209,0.05);
}

/* Empty / loading states */
.ap-state {
  padding: 36px 20px;
  text-align: center;
  font-family: var(--fb);
  font-size: 0.85rem;
  color: var(--ink4);
}
.ap-error {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(192,57,43,0.06);
  border: 1px solid rgba(192,57,43,0.18);
  border-left: 3px solid var(--danger);
  border-radius: 8px;
  font-family: var(--fb);
  font-size: 0.81rem;
  color: var(--danger);
}

/* ── MODAL OVERLAY ── */
.ap-overlay {
  position: fixed; inset: 0;
  background: rgba(7,25,41,0.55);
  backdrop-filter: blur(6px);
  z-index: 800;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
  animation: mfade 0.18s ease;
}
@keyframes mfade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mrise { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* ── MAIN ASSET MODAL ── */
.ap-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(7,25,41,0.2), 0 4px 16px rgba(7,25,41,0.08);
  width: 100%;
  max-width: 680px;
  margin: auto;
  animation: mrise 0.22s cubic-bezier(0.16,1,0.3,1);
  overflow: hidden;
}

.ap-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 16px;
  border-bottom: 1px solid var(--border-lt);
  background: linear-gradient(to bottom, var(--surface2), var(--surface));
}
.ap-modal-title {
  font-family: var(--fd);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.03em;
}
.ap-modal-close {
  width: 32px; height: 32px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--ink3);
  cursor: pointer;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.14s;
  flex-shrink: 0;
}
.ap-modal-close:hover { border-color: var(--ink3); color: var(--ink); }

.ap-modal-body {
  padding: 20px 22px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
.ap-modal-body::-webkit-scrollbar { width: 4px; }
.ap-modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

/* QR section inside edit modal */
.ap-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border-lt);
  border-radius: var(--r);
  margin-bottom: 18px;
}
.ap-qr-section-label {
  font-family: var(--fb);
  font-size: 0.72rem;
  color: var(--ink3);
  text-align: center;
}
.ap-qr-section svg { display: block; }

/* Form sections */
.ap-form-sections { display: flex; flex-direction: column; gap: 20px; }

.ap-form-section {
  border: 1px solid var(--border-lt);
  border-radius: var(--r);
  overflow: hidden;
}
.ap-form-section-head {
  padding: 10px 15px;
  background: var(--surface2);
  border-bottom: 1px solid var(--border-lt);
  font-family: var(--fd);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ink2);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  font-size: 0.64rem;
  letter-spacing: 0.07em;
}
.ap-form-grid {
  padding: 15px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px 16px;
}
.ap-field { display: flex; flex-direction: column; gap: 5px; }
.ap-field--full { grid-column: 1 / -1; }

.ap-field label {
  font-family: var(--fb);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--ink2);
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 5px;
}

.ap-field input,
.ap-field select,
.ap-field textarea {
  font-family: var(--fb);
  font-size: 0.82rem;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 11px;
  outline: none;
  transition: border-color 0.16s, box-shadow 0.16s;
  width: 100%;
}
.ap-field input:focus,
.ap-field select:focus,
.ap-field textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(26,143,209,0.1);
}
.ap-field input::placeholder,
.ap-field textarea::placeholder { color: var(--ink4); }
.ap-field textarea { resize: vertical; min-height: 72px; line-height: 1.55; }
.ap-field select { cursor: pointer; }

.ap-field-readonly {
  background: var(--surface2) !important;
  color: var(--ink3) !important;
  cursor: default !important;
}
.ap-field-hint {
  font-family: var(--fb);
  font-size: 0.67rem;
  color: var(--ink4);
  line-height: 1.45;
}

/* Supplier sub-group */
.ap-supplier-group {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ap-supplier-label {
  font-family: var(--fb);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ink3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.ap-supplier-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
@media (max-width: 560px) {
  .ap-supplier-fields { grid-template-columns: 1fr; }
  .ap-form-grid { grid-template-columns: 1fr; }
}

/* Status label + info */
.ap-field-label-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Modal footer */
.ap-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 22px 18px;
  border-top: 1px solid var(--border-lt);
  flex-wrap: wrap;
}
.ap-modal-footer-left { margin-right: auto; }

/* ── DELETE CONFIRM MODAL ── */
.ap-delete-overlay {
  position: fixed; inset: 0;
  background: rgba(7,25,41,0.6);
  backdrop-filter: blur(7px);
  z-index: 900;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: mfade 0.18s ease;
}
.ap-delete-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(7,25,41,0.22);
  max-width: 360px; width: 100%;
  overflow: hidden;
  animation: mrise 0.22s cubic-bezier(0.16,1,0.3,1);
  text-align: center;
  padding: 32px 28px 24px;
}
.ap-delete-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(192,57,43,0.08);
  border: 1px solid rgba(192,57,43,0.18);
  color: var(--danger);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}
.ap-delete-title {
  font-family: var(--fd);
  font-size: 1.15rem; font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.ap-delete-msg {
  font-family: var(--fb);
  font-size: 0.84rem;
  color: var(--ink3);
  line-height: 1.6;
  margin-bottom: 24px;
}
.ap-delete-actions { display: flex; gap: 9px; justify-content: center; }
.ap-delete-actions button {
  flex: 1; padding: 10px 0;
  border-radius: 8px;
  font-family: var(--fb); font-size: 0.84rem; font-weight: 500;
  cursor: pointer; border: none; transition: background 0.15s;
}
.ap-delete-btn-cancel { background: var(--surface2); color: var(--ink); border: 1px solid var(--border) !important; }
.ap-delete-btn-cancel:hover { background: var(--bg); }
.ap-delete-btn-confirm { background: var(--danger); color: #fff; }
.ap-delete-btn-confirm:hover { opacity: 0.88; }

/* ── QR MODAL ── */
.ap-qr-overlay {
  position: fixed; inset: 0;
  background: rgba(7,25,41,0.6);
  backdrop-filter: blur(7px);
  z-index: 900;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
  animation: mfade 0.18s ease;
}
.ap-qr-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(7,25,41,0.22);
  width: 100%;
  max-width: 540px;
  margin: auto;
  overflow: hidden;
  animation: mrise 0.22s cubic-bezier(0.16,1,0.3,1);
}
.ap-qr-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 17px 20px;
  border-bottom: 1px solid var(--border-lt);
  background: var(--surface2);
}
.ap-qr-modal-title {
  font-family: var(--fd);
  font-size: 0.95rem; font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.02em;
}
.ap-qr-modal-header-actions {
  display: flex; align-items: center; gap: 8px;
}
.ap-qr-modal-body {
  padding: 20px 22px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.ap-qr-hint {
  font-family: var(--fb);
  font-size: 0.77rem;
  color: var(--ink3);
  text-align: center;
  line-height: 1.55;
  max-width: 400px;
}
.ap-qr-hint--ok { color: var(--success); }

.ap-qr-mobile-tip {
  background: rgba(26,143,209,0.05);
  border: 1px solid rgba(26,143,209,0.2);
  border-radius: 9px;
  padding: 11px 14px;
  font-family: var(--fb);
  font-size: 0.77rem;
  color: var(--ink2);
  line-height: 1.55;
  text-align: center;
  max-width: 420px;
}
.ap-qr-mobile-link {
  color: var(--blue); font-weight: 500; text-decoration: none;
}
.ap-qr-mobile-link:hover { text-decoration: underline; }
.ap-qr-mobile-placeholder { color: var(--ink3); font-style: italic; }

.ap-qr-wrap {
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border-lt);
  border-radius: var(--r);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Print title — shown only when printing */
.ap-qr-print-title {
  display: none;
  font-family: var(--fd);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ink);
  text-align: center;
  margin-bottom: 8px;
}

.ap-qr-print-hint {
  font-family: var(--fb);
  font-size: 0.73rem;
  color: var(--ink4);
  text-align: center;
}

.ap-qr-preview-label {
  font-family: var(--fb);
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--ink4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  align-self: flex-start;
}
.ap-qr-preview-wrap {
  width: 100%;
  border: 1px solid var(--border-lt);
  border-radius: var(--r);
  overflow: hidden;
}

/* @print */
@media print {
  .ap-qr-print-hide { display: none !important; }
  .ap-qr-print-title { display: block !important; }
  .ap-qr-modal-body { padding: 20px; }
}
`;

/* ─────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconQR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h1v1h-1zM16 14h1v1h-1zM14 16h1v1h-1zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h1v1h-1z"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconTrash = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const IconInfo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);
const IconReport = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconPrint = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   MOBILE SCAN URL HOOK
───────────────────────────────────────────────────────────── */
function useMobileScanUrl() {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) { setUrl(origin); return; }
    const port = window.location.port || "3000";
    let cancelled = false;
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => {});
    pc.onicecandidate = e => {
      if (cancelled || !e.candidate) return;
      const m = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (m && m[1] && !/^127\./.test(m[1])) { setUrl(`http://${m[1]}:${port}`); pc.close(); }
    };
    const t = setTimeout(() => { pc.close(); if (!cancelled) setUrl(null); }, 4000);
    return () => { cancelled = true; clearTimeout(t); pc.close(); };
  }, []);
  return url;
}

function getAssetScanUrl(asset) {
  try {
    const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(asset))));
    return `${window.location.origin}${window.location.pathname}?v=asset&d=${encodeURIComponent(base64)}`;
  } catch { return JSON.stringify(asset); }
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function AssetPage({ user, onAssetsChange, searchQuery, readOnly }) {
  const [assets, setAssets]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingAsset, setEditing]  = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");
  const [deleteConfirm, setDelConf] = useState(null);

  const [qrAsset, setQrAsset]       = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [rStatus, setRStatus]       = useState("");
  const [rDept, setRDept]           = useState("");

  const [nextTag, setNextTag]       = useState(null);
  const [nextTagLoading, setNTL]    = useState(false);
  const [statusPop, setStatusPop]   = useState(null);
  const [formStatusPop, setFSP]     = useState(false);

  const mobileUrl = useMobileScanUrl();

  const filtered = filterListByQuery(assets, searchQuery, [
    "assetTag","name","status","department","supplierName","supplierEmail",
    a => a.category?.name, a => a.location?.name,
  ]);

  const notify = (list) => { if (typeof onAssetsChange === "function") onAssetsChange(list); };

  /* Load */
  useEffect(() => {
    notify(undefined); setLoading(true); setError("");
    getAssets()
      .then(list => { setAssets(list); notify(list); })
      .catch(e => setError(e.message || "Failed to load assets"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    getAssetCategories().then(setCategories).catch(() => setCategories([]));
    getLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  /* Next tag */
  useEffect(() => {
    if (!modalOpen || editingAsset || !form.department) { setNextTag(null); return; }
    let cancelled = false; setNTL(true); setNextTag(null);
    getNextAssetTag(form.department)
      .then(d => { if (!cancelled && d?.nextTag) setNextTag(d.nextTag); })
      .catch(() => { if (!cancelled) setNextTag(null); })
      .finally(() => { if (!cancelled) setNTL(false); });
    return () => { cancelled = true; };
  }, [modalOpen, editingAsset, form.department]);

  /* Modal helpers */
  const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormError(""); setDelConf(null); setModalOpen(true); };
  const openEdit = a => {
    setEditing(a);
    setForm({
      assetTag: a.assetTag||"", name: a.name||"", description: a.description||"",
      serialNumber: a.serialNumber||"",
      purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0,10) : "",
      purchaseCost: a.purchaseCost != null ? String(a.purchaseCost) : "",
      currentValue: a.currentValue != null ? String(a.currentValue) : "",
      usefulLifeYears: a.usefulLifeYears != null ? String(a.usefulLifeYears) : "",
      salvageValue: a.salvageValue != null ? String(a.salvageValue) : "",
      status: a.status||"AVAILABLE",
      warrantyExpiryDate: a.warrantyExpiryDate ? a.warrantyExpiryDate.slice(0,10) : "",
      department: a.department||"IT",
      supplierName: a.supplierName||"", supplierEmail: a.supplierEmail||"", supplierPhone: a.supplierPhone||"",
      categoryId: a.category?.id != null ? String(a.category.id) : "",
      locationId: a.location?.id != null ? String(a.location.id) : "",
    });
    setFormError(""); setDelConf(null); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setFormError(""); setDelConf(null); setNextTag(null); };
  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const buildPayload = () => {
    const p = {
      name: form.name.trim(), description: form.description?.trim()||null,
      serialNumber: form.serialNumber?.trim()||null, purchaseDate: form.purchaseDate||null,
      purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : null,
      currentValue: null,
      usefulLifeYears: form.usefulLifeYears ? parseInt(form.usefulLifeYears,10) : null,
      salvageValue: form.salvageValue ? parseFloat(form.salvageValue) : null,
      status: form.status, qrCode: null, warrantyExpiryDate: form.warrantyExpiryDate||null,
      department: form.department,
      supplierName: form.supplierName?.trim()||null, supplierEmail: form.supplierEmail?.trim()||null,
      supplierPhone: form.supplierPhone?.trim()||null,
    };
    if (editingAsset) p.assetTag = form.assetTag?.trim()||null;
    if (form.categoryId?.trim()) p.category = { id: form.categoryId.trim() };
    if (form.locationId?.trim()) p.location  = { id: form.locationId.trim() };
    return p;
  };

  const handleSubmit = e => {
    e.preventDefault(); setFormError("");
    if (!form.name?.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    (editingAsset ? updateAsset(editingAsset.id, buildPayload()) : createAsset(buildPayload()))
      .then(saved => {
        const next = editingAsset ? assets.map(a => a.id === saved.id ? saved : a) : [...assets, saved];
        setAssets(next); notify(next); closeModal();
      })
      .catch(e => setFormError(e.message || "Failed to save asset"))
      .finally(() => setSaving(false));
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteAsset(deleteConfirm)
      .then(() => {
        const next = assets.filter(a => a.id !== deleteConfirm);
        setAssets(next); notify(next); setDelConf(null); closeModal();
      })
      .catch(e => setFormError(e.message || "Failed to delete asset"));
  };

  /* ── RENDER ── */
  return (
    <>
      <style>{css}</style>
      <div className="ap-root">

        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-toolbar-left">
            <div className="ap-toolbar-title">Assets</div>
            <div className="ap-toolbar-count">
              {loading ? "Loading…" : `${filtered.length} asset${filtered.length !== 1 ? "s" : ""}${searchQuery ? " found" : ""}`}
            </div>
          </div>
          <div className="ap-toolbar-right">
            <button type="button" className="ap-btn ap-btn--ghost" onClick={() => setReportOpen(true)}>
              <IconReport /> Report
            </button>
            {!readOnly && (
              <button type="button" className="ap-btn ap-btn--primary" onClick={openAdd}>
                <IconPlus /> Add Asset
              </button>
            )}
          </div>
        </div>

        {error && <div className="ap-error">{error}</div>}

        {/* Table */}
        <div className="ap-card">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Supplier</th>
                  <th>Purchase Date</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="ap-state">Loading assets…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="ap-state">
                      {readOnly ? "No assets found." : 'No assets yet. Click "Add Asset" to get started.'}
                    </td>
                  </tr>
                ) : filtered.map(asset => {
                  const sc = STATUS_COLORS[asset.status] || STATUS_COLORS.DISPOSED;
                  return (
                    <tr key={asset.id}>
                      <td className="ap-td-tag">{asset.assetTag || "—"}</td>
                      <td className="ap-td-name">{asset.name || "—"}</td>
                      <td>
                        <div className="ap-status-cell">
                          <span
                            className="ap-status-badge"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            <span className="ap-status-dot" style={{ background: sc.dot }} />
                            {getStatusLabel(asset.status) || "—"}
                          </span>
                          {asset.status && ASSET_STATUS_DESCRIPTIONS[asset.status] && (
                            <div
                              className="ap-info-trigger"
                              onMouseEnter={() => setStatusPop(asset.id)}
                              onMouseLeave={() => setStatusPop(null)}
                            >
                              <span className="ap-info-icon"><IconInfo /></span>
                              {statusPop === asset.id && (
                                <div className="ap-status-popover">
                                  <div className="ap-status-popover-title">{getStatusLabel(asset.status)}</div>
                                  <p className="ap-status-popover-desc">{ASSET_STATUS_DESCRIPTIONS[asset.status]}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="ap-td-muted">{asset.department || "—"}</td>
                      <td className="ap-td-muted">{asset.supplierName || "—"}</td>
                      <td className="ap-td-date">{asset.purchaseDate ? asset.purchaseDate.slice(0,10) : "—"}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="ap-action-cell">
                          <button type="button" className="ap-action-btn" aria-label="View QR" title="View QR Code" onClick={() => setQrAsset(asset)}>
                            <IconQR />
                          </button>
                          {!readOnly && (
                            <button type="button" className="ap-action-btn" aria-label="Edit" title="Edit asset" onClick={() => openEdit(asset)}>
                              <IconEdit />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ════ ADD / EDIT MODAL ════ */}
      {modalOpen && (
        <div className="ap-overlay" onClick={closeModal}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-header">
              <div className="ap-modal-title">{editingAsset ? "Edit Asset" : "New Asset"}</div>
              <button type="button" className="ap-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ap-modal-body">
                {formError && <div className="ap-error">{formError}</div>}

                {/* QR in edit mode */}
                {editingAsset && (
                  <div className="ap-qr-section">
                    <div className="ap-qr-section-label">Asset QR Code (contains all saved data)</div>
                    <QRCodeSVG value={JSON.stringify(editingAsset)} size={140} level="M" />
                  </div>
                )}

                <div className="ap-form-sections">

                  {/* Identification */}
                  <div className="ap-form-section">
                    <div className="ap-form-section-head">Identification</div>
                    <div className="ap-form-grid">
                      <div className="ap-field">
                        <label htmlFor="f-dept">Department *</label>
                        <select id="f-dept" value={form.department} onChange={e => set("department", e.target.value)}>
                          {DEPARTMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <span className="ap-field-hint">
                          {editingAsset ? "Cannot be changed after creation." : "Asset tag is generated from this (e.g. FB-IT-001)."}
                        </span>
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-tag">Asset Tag</label>
                        <input
                          id="f-tag"
                          className="ap-field-readonly"
                          value={editingAsset ? form.assetTag : (nextTagLoading ? "Loading…" : (nextTag || "—"))}
                          readOnly disabled={!editingAsset}
                        />
                        <span className="ap-field-hint">
                          {editingAsset ? "Cannot be changed." : "Auto-generated from department."}
                        </span>
                      </div>
                      <div className="ap-field ap-field--full">
                        <label htmlFor="f-name">Name *</label>
                        <input id="f-name" type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Dell Latitude 5520" />
                      </div>
                      <div className="ap-field ap-field--full">
                        <label htmlFor="f-desc">Description</label>
                        <textarea id="f-desc" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional description" rows={3} />
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-serial">Serial Number</label>
                        <input id="f-serial" type="text" value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} placeholder="Manufacturer serial" />
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-status" className="ap-field-label-info">
                          Status
                          <div
                            className="ap-info-trigger"
                            onMouseEnter={() => setFSP(true)}
                            onMouseLeave={() => setFSP(false)}
                            style={{ position: "relative" }}
                          >
                            <span className="ap-info-icon"><IconInfo /></span>
                            {formStatusPop && form.status && ASSET_STATUS_DESCRIPTIONS[form.status] && (
                              <div className="ap-status-popover" style={{ bottom: "calc(100% + 6px)" }}>
                                <div className="ap-status-popover-title">{getStatusLabel(form.status)}</div>
                                <p className="ap-status-popover-desc">{ASSET_STATUS_DESCRIPTIONS[form.status]}</p>
                              </div>
                            )}
                          </div>
                        </label>
                        <select id="f-status" value={form.status} onChange={e => set("status", e.target.value)}>
                          {ASSET_STATUS_OPTIONS.map(o => <option key={o} value={o}>{getStatusLabel(o)}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="ap-form-section">
                    <div className="ap-form-section-head">Classification</div>
                    <div className="ap-form-grid">
                      <div className="ap-field">
                        <label htmlFor="f-cat">Category</label>
                        <select id="f-cat" value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
                          <option value="">Select category</option>
                          {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name || `Category ${c.id}`}</option>)}
                        </select>
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-loc">Location</label>
                        <select id="f-loc" value={form.locationId} onChange={e => set("locationId", e.target.value)}>
                          <option value="">Select location</option>
                          {locations.map(l => (
                            <option key={l.id} value={String(l.id)}>
                              {l.name || `Location ${l.id}`}
                              {l.building || l.floor || l.room ? ` — ${[l.building,l.floor,l.room].filter(Boolean).join(", ")}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Purchase & Valuation */}
                  <div className="ap-form-section">
                    <div className="ap-form-section-head">Purchase & Valuation</div>
                    <div className="ap-form-grid">
                      <div className="ap-field">
                        <label htmlFor="f-pdate">Purchase Date</label>
                        <input id="f-pdate" type="date" value={form.purchaseDate} onChange={e => set("purchaseDate", e.target.value)} />
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-cost">Purchase Cost</label>
                        <input id="f-cost" type="number" step="0.01" min="0" value={form.purchaseCost} onChange={e => set("purchaseCost", e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-val">Current Value</label>
                        <input
                          id="f-val"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.currentValue}
                          placeholder="Auto"
                          className="ap-field-readonly"
                          readOnly
                          disabled
                        />
                        <span className="ap-field-hint">Auto-calculated by the system.</span>
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-life">Useful Life (years)</label>
                        <input id="f-life" type="number" min="1" step="1" value={form.usefulLifeYears} onChange={e => set("usefulLifeYears", e.target.value)} placeholder="e.g. 5" />
                      </div>
                      <div className="ap-field">
                        <label htmlFor="f-salv">Salvage Value</label>
                        <input id="f-salv" type="number" step="0.01" min="0" value={form.salvageValue} onChange={e => set("salvageValue", e.target.value)} placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  {/* Warranty & Supplier */}
                  <div className="ap-form-section">
                    <div className="ap-form-section-head">Warranty & Supplier</div>
                    <div className="ap-form-grid">
                      <div className="ap-field">
                        <label htmlFor="f-warr">Warranty Expiry</label>
                        <input id="f-warr" type="date" value={form.warrantyExpiryDate} onChange={e => set("warrantyExpiryDate", e.target.value)} />
                      </div>
                      <div className="ap-field ap-field--full">
                        <div className="ap-supplier-group">
                          <span className="ap-supplier-label">Supplier contact (for warranty & support)</span>
                          <div className="ap-supplier-fields">
                            <div className="ap-field">
                              <label htmlFor="f-sname">Name</label>
                              <input id="f-sname" type="text" value={form.supplierName} onChange={e => set("supplierName", e.target.value)} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="ap-field">
                              <label htmlFor="f-semail">Email</label>
                              <input id="f-semail" type="email" value={form.supplierEmail} onChange={e => set("supplierEmail", e.target.value)} placeholder="support@supplier.com" />
                            </div>
                            <div className="ap-field">
                              <label htmlFor="f-sphone">Phone</label>
                              <input id="f-sphone" type="tel" value={form.supplierPhone} onChange={e => set("supplierPhone", e.target.value)} placeholder="+1 234 567 8900" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="ap-modal-footer">
                {editingAsset && (
                  <div className="ap-modal-footer-left">
                    <button type="button" className="ap-btn ap-btn--danger" onClick={() => setDelConf(editingAsset.id)}>
                      Delete
                    </button>
                  </div>
                )}
                <button type="button" className="ap-btn ap-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="ap-btn ap-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingAsset ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ DELETE CONFIRM ════ */}
      {deleteConfirm && (
        <div className="ap-delete-overlay" onClick={() => setDelConf(null)}>
          <div className="ap-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-delete-icon"><IconTrash /></div>
            <div className="ap-delete-title">Delete asset?</div>
            <p className="ap-delete-msg">This action cannot be undone. The asset and all associated data will be permanently removed.</p>
            <div className="ap-delete-actions">
              <button type="button" className="ap-delete-btn-cancel" onClick={() => setDelConf(null)}>Cancel</button>
              <button type="button" className="ap-delete-btn-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ QR MODAL ════ */}
      {qrAsset && (
        <div className="ap-qr-overlay" onClick={() => setQrAsset(null)}>
          <div className="ap-qr-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-qr-modal-header">
              <div className="ap-qr-modal-title">
                QR Code — {qrAsset.name || qrAsset.assetTag || "Asset"}
              </div>
              <div className="ap-qr-modal-header-actions">
                <button type="button" className="ap-btn ap-btn--ghost ap-qr-print-hide"
                  onClick={() => window.print()}
                  title="Turn off Headers and footers in the print dialog for a cleaner result">
                  <IconPrint /> Print
                </button>
                <button type="button" className="ap-modal-close ap-qr-print-hide" aria-label="Close" onClick={() => setQrAsset(null)}>
                  <IconClose />
                </button>
              </div>
            </div>

            <div className="ap-qr-modal-body">
              <p className="ap-qr-print-hint ap-qr-print-hide">
                Tip: In the print dialog, turn off "Headers and footers" to hide the browser URL and date.
              </p>

              {/* Print-only title */}
              <div className="ap-qr-print-title" aria-hidden="true">
                {qrAsset.name || qrAsset.assetTag || "Asset"}
              </div>

              <p className="ap-qr-hint ap-qr-print-hide">
                Scan with your phone. The QR contains a link — opening it shows the asset in a clear view.
              </p>

              {(window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")) ? (
                <div className="ap-qr-mobile-tip ap-qr-print-hide">
                  <strong>To view on phone:</strong> connect to the same WiFi, open{" "}
                  {mobileUrl
                    ? <a href={mobileUrl} target="_blank" rel="noopener noreferrer" className="ap-qr-mobile-link">{mobileUrl}</a>
                    : <span className="ap-qr-mobile-placeholder">http://YOUR_PC_IP:3000</span>
                  }{" "}
                  on your computer, then scan the QR.
                </div>
              ) : (
                <p className="ap-qr-hint ap-qr-hint--ok ap-qr-print-hide">
                  Your phone can open the link after scanning.
                </p>
              )}

              <div className="ap-qr-wrap">
                <QRCodeSVG value={getAssetScanUrl(qrAsset)} size={210} level="M" />
              </div>

              <p className="ap-qr-preview-label ap-qr-print-hide">Preview</p>
              <div className="ap-qr-preview-wrap ap-qr-print-hide">
                <AssetScanView asset={qrAsset} showClose={false} preview />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ REPORT ════ */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Asset Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => (
          <>
            <div className="ap-field">
              <label>Status</label>
              <select value={rStatus} onChange={e => setRStatus(e.target.value)}>
                <option value="">All statuses</option>
                {ASSET_STATUS_OPTIONS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label>Department</label>
              <select value={rDept} onChange={e => setRDept(e.target.value)}>
                <option value="">All departments</option>
                {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </>
        )}
        getReportData={() => {
          let list = assets;
          if (rStatus) list = list.filter(a => (a.status||"").toUpperCase() === rStatus.toUpperCase());
          if (rDept)   list = list.filter(a => (a.department||"").toUpperCase() === rDept.toUpperCase());
          return {
            columns: [
              { key:"assetTag",     label:"Asset Tag" },
              { key:"name",         label:"Name" },
              { key:"status",       label:"Status" },
              { key:"department",   label:"Department" },
              { key:"supplierName", label:"Supplier" },
              { key:"purchaseDate", label:"Purchase Date" },
            ],
            rows: list.map(a => ({
              assetTag:     a.assetTag     || "—",
              name:         a.name         || "—",
              status:       a.status       || "—",
              department:   a.department   || "—",
              supplierName: a.supplierName || "—",
              purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0,10) : "—",
            })),
          };
        }}
      />
    </>
  );
}