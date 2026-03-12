import { useState, useEffect } from "react";
import { getAnomalyAlerts, createDemoAnomalyAlert } from "../services/anomalyAlertService";
import ReportModal from "./ReportModal";
import "./EntityPage.css";
import "./AnomalyAlertPage.css";

const formatDateTime = (d) =>
  !d ? "—" : (typeof d === "string" ? d.slice(0, 19).replace("T", " ") : String(d));

const PAGE_SIZE = 20;

export default function AnomalyAlertPage({ user, onDataChange, searchQuery }) {
  const [list, setList] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [demoCreating, setDemoCreating] = useState(false);
  const [demoError, setDemoError] = useState("");

  const notify = (data) => {
    if (typeof onDataChange === "function") onDataChange(data);
  };

  const load = (pageIndex = 0) => {
    setLoading(true);
    setError("");
    const opts = { page: pageIndex, size: PAGE_SIZE };
    if (filterSeverity && filterSeverity.trim()) opts.severity = filterSeverity.trim();
    getAnomalyAlerts(opts)
      .then((result) => {
        setList(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setPage(result.number);
        notify(result.content);
      })
      .catch((e) => {
        setError(e.message || "Failed to load alerts");
        setList([]);
        setTotalElements(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load(0);
  }, []);

  const handleRefresh = () => load(0);
  const handleFilter = () => load(0);
  const handlePrev = () => { if (page > 0) load(page - 1); };
  const handleNext = () => { if (page < totalPages - 1) load(page + 1); };

  const handleCreateDemo = () => {
    setDemoError("");
    setDemoCreating(true);
    createDemoAnomalyAlert()
      .then(() => load(0))
      .catch((e) => setDemoError(e.message || "Could not create demo. Ensure you have at least one asset."))
      .finally(() => setDemoCreating(false));
  };

  const filteredList = Array.isArray(list) ? list : [];
  const severityClass = (s) => {
    if (!s) return "";
    const u = String(s).toUpperCase();
    if (u === "HIGH") return "anomaly-severity--high";
    if (u === "MEDIUM") return "anomaly-severity--medium";
    if (u === "LOW") return "anomaly-severity--low";
    return "";
  };

  return (
    <div className="card anomaly-alert-page">
      <div className="entity-toolbar">
        <div className="audit-toolbar-actions">
          <div className="audit-filters">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="audit-filter-select"
            >
              <option value="">All severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button type="button" className="entity-add-btn entity-btn--secondary" onClick={handleFilter} disabled={loading}>
              Filter
            </button>
          </div>
          <button type="button" className="report-btn" onClick={() => setReportOpen(true)} style={{ marginLeft: 8 }}>Report</button>
          <button type="button" className="entity-add-btn entity-btn--secondary" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      {error && <p className="entity-error">{error}</p>}
      {loading && filteredList.length === 0 ? (
        <p className="entity-loading">Loading theft & anomaly alerts…</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Asset</th>
                  <th>Reason</th>
                  <th>From → To</th>
                  <th>Performed by</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>
                      <span className={`entity-status anomaly-severity ${severityClass(row.severity)}`}>
                        {row.severity || "—"}
                      </span>
                    </td>
                    <td>
                      {row.assetName || "—"}
                      {row.assetTag && <span className="anomaly-asset-tag"> ({row.assetTag})</span>}
                    </td>
                    <td style={{ maxWidth: 280 }}>{row.reason || "—"}</td>
                    <td>
                      {row.fromLocation || "—"} → {row.toLocation || "—"}
                    </td>
                    <td>{row.performedByEmail || "—"}</td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="entity-empty">
                      <div className="anomaly-empty-box">
                        <span className="anomaly-empty-title">No theft or anomaly alerts yet</span>
                        <p className="anomaly-empty-desc">
                          Alerts are created automatically when asset movements trigger security rules:
                        </p>
                        <ul className="anomaly-empty-list">
                          <li>Movement outside business hours (e.g. after 22:00 or before 06:00)</li>
                          <li>High-value asset moved by a user who is not ADMIN or SECURITY</li>
                          <li>Same asset moved more than 2 times in 24 hours</li>
                        </ul>
                        <p className="anomaly-empty-hint">
                          Go to <strong>Movements</strong>, record a movement for an asset (log in as IT or FINANCE and move an asset with value ≥ 1 to trigger an alert), or create a demo alert below to see the screen for your presentation.
                        </p>
                        {demoError && <p className="entity-error" style={{ marginTop: 12 }}>{demoError}</p>}
                        <button
                          type="button"
                          className="entity-add-btn"
                          onClick={handleCreateDemo}
                          disabled={demoCreating}
                          style={{ marginTop: 16 }}
                        >
                          {demoCreating ? "Creating…" : "Create demo alert"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="audit-pagination">
              <button type="button" className="audit-page-btn" onClick={handlePrev} disabled={page <= 0 || loading}>
                Previous
              </button>
              <span className="audit-page-info">
                Page {page + 1} of {totalPages} ({totalElements} total)
              </span>
              <button type="button" className="audit-page-btn" onClick={handleNext} disabled={page >= totalPages - 1 || loading}>
                Next
              </button>
            </div>
          )}
        </>
      )}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Theft & Anomaly Alerts Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [
            { key: "id", label: "ID" },
            { key: "createdAt", label: "Time" },
            { key: "severity", label: "Severity" },
            { key: "assetName", label: "Asset" },
            { key: "assetTag", label: "Tag" },
            { key: "reason", label: "Reason" },
            { key: "fromLocation", label: "From" },
            { key: "toLocation", label: "To" },
            { key: "performedByEmail", label: "Performed by" },
          ],
          rows: filteredList.map((r) => ({
            id: r.id,
            createdAt: formatDateTime(r.createdAt),
            severity: r.severity || "—",
            assetName: r.assetName || "—",
            assetTag: r.assetTag || "—",
            reason: (r.reason || "—").slice(0, 80),
            fromLocation: r.fromLocation || "—",
            toLocation: r.toLocation || "—",
            performedByEmail: r.performedByEmail || "—",
          })),
        })}
      />
    </div>
  );
}
