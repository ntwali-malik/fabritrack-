import React from "react";
import "./SessionTimeoutModal.css";

/**
 * Modal shown when session is about to expire due to inactivity.
 * Shows countdown in seconds; "Stay logged in" resets the session.
 */
export default function SessionTimeoutModal({ open, countdownSeconds, onStayLoggedIn }) {
  if (!open) return null;

  return (
    <div className="session-timeout-overlay" role="dialog" aria-modal="true" aria-labelledby="session-timeout-title">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 id="session-timeout-title" className="session-timeout-title">Session timeout</h2>
        <p className="session-timeout-message">
          You have been inactive. You will be signed out and returned to the login page in{" "}
          <strong className="session-timeout-count">{countdownSeconds}</strong>{" "}
          {countdownSeconds === 1 ? "second" : "seconds"}.
        </p>
        <div className="session-timeout-actions">
          <button
            type="button"
            className="session-timeout-btn session-timeout-btn--primary"
            onClick={onStayLoggedIn}
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}
