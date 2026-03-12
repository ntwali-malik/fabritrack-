import React from "react";

const IconTrash = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function DeleteConfirmModal({ open, onClose, onConfirm, title = "Delete?", message = "Are you sure? This action cannot be undone." }) {
  if (!open) return null;
  return (
    <div className="entity-delete-modal-overlay" onClick={onClose}>
      <div className="entity-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="entity-delete-modal-inner">
          <div className="entity-delete-modal-icon">
            <IconTrash />
          </div>
          <h2 className="entity-delete-modal-title">{title}</h2>
          <p className="entity-delete-modal-message">{message}</p>
          <div className="entity-delete-modal-actions">
            <button type="button" className="entity-delete-btn-no" onClick={onClose}>
              No, cancel
            </button>
            <button type="button" className="entity-delete-btn-yes" onClick={onConfirm}>
              Yes, delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
