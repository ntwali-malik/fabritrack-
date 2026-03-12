import { useState, useEffect } from "react";
import { getAuditLogs } from "../services/auditLogService";
import ReportModal from "./ReportModal";
import "./EntityPage.css";
import "./AuditLogPage.css";

const formatDateTime = (d) =>
  !d ? "—" : (typeof d === "string" ? d.slice(0, 19).replace("T", " ") : String(d));

const userLabel = (u) => {
  if (u == null) return "—";
  if (typeof u === "string" || typeof u === "number") return String(u);
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id || "—";
};

const actionClass = (action) => {
  if (!action) return "";
  const u = String(action).toUpperCase();
  if (u === "CREATE" || u === "INSERT") return "audit-action--create";
  if (u === "UPDATE" || u === "MODIFY") return "audit-action--update";
  if (u === "DELETE" || u === "REMOVE") return "audit-action--delete";
  if (u === "ASSIGN" || u === "MOVE") return "audit-action--other";
  if (u === "RETURN") return "audit-action--update";
  if (u === "LOGIN" || u === "LOGOUT") return "audit-action--other";
  return "audit-action--other";
};

const PAGE_SIZE_DEFAULT = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "ASSIGN", label: "Assign" },
  { value: "RETURN", label: "Return" },
  { value: "MOVE", label: "Move" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
];

export default function AuditLogPage({ user, onDataChange }) {
  const [list, setList] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [filterEntityName, setFilterEntityName] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (data) => {
    if (typeof onDataChange === "function") onDataChange(data);
  };

  const load = (pageIndex = 0, overrides = {}) => {
    setLoading(true);
    setError("");
    const size = overrides.size !== undefined ? overrides.size : pageSize;
    const opts = {
      page: pageIndex,
      size,
    };
    const entity = overrides.entityName !== undefined ? overrides.entityName : filterEntityName;
    const action = overrides.action !== undefined ? overrides.action : filterAction;
    if (entity.trim()) opts.entityName = entity.trim();
    if (action.trim()) opts.action = action.trim();
    getAuditLogs(opts)
      .then((result) => {
        setList(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setPage(result.number);
        notify(result.content);
      })
      .catch((e) => setError(e.message || "Failed to load"))
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
  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value) || PAGE_SIZE_DEFAULT;
    setPageSize(newSize);
    load(0, { size: newSize });
  };

  const rows = Array.isArray(list) ? list : [];
  const startItem = totalElements === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="card audit-log-page">
      <div className="entity-toolbar audit-toolbar">
        <div className="audit-toolbar-filters">
          <input
            type="text"
            placeholder="Entity name"
            value={filterEntityName}
            onChange={(e) => setFilterEntityName(e.target.value)}
            className="audit-filter-input"
            aria-label="Filter by entity name"
          />
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(0);
              load(0, { action: e.target.value });
            }}
            className="audit-filter-select"
            aria-label="Filter by action"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button type="button" className="entity-add-btn entity-btn--secondary" onClick={handleFilter} disabled={loading}>
            Filter
          </button>
        </div>
        <div className="audit-toolbar-actions">
          <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
          <button type="button" className="entity-add-btn entity-btn--secondary" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      {error && <p className="entity-error">{error}</p>}
      {loading && rows.length === 0 ? (
        <p className="entity-loading">Loading audit logs…</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Performed at</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{row.entityName || "—"}</td>
                    <td>{row.entityId || "—"}</td>
                    <td>
                      <span className={`entity-status audit-action ${actionClass(row.action)}`}>
                        {row.action || "—"}
                      </span>
                    </td>
                    <td>{row.details || "—"}</td>
                    <td>{formatDateTime(row.performedAt)}</td>
                    <td>{userLabel(row.user)}</td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="entity-empty">
                      No actions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalElements > 0 && (
            <div className="audit-pagination">
              <span className="audit-page-info">
                Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalElements}</strong>
              </span>
              <div className="audit-page-controls">
                <label className="audit-page-size-label">
                  Per page
                  <select
                    className="audit-page-size-select"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    aria-label="Items per page"
                    disabled={loading}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="audit-page-btn" onClick={handlePrev} disabled={page <= 0 || loading}>
                  Previous
                </button>
                <span className="audit-page-num">
                  Page {page + 1} of {totalPages}
                </span>
                <button type="button" className="audit-page-btn" onClick={handleNext} disabled={page >= totalPages - 1 || loading}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Audit Log Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "entityName", label: "Entity" }, { key: "entityId", label: "Entity ID" }, { key: "action", label: "Action" }, { key: "details", label: "Details" }, { key: "performedAt", label: "Performed at" }, { key: "user", label: "User" }],
          rows: rows.map((r) => ({ id: r.id, entityName: r.entityName || "—", entityId: r.entityId || "—", action: r.action || "—", details: r.details || "—", performedAt: formatDateTime(r.performedAt), user: userLabel(r.user) })),
        })}
      />
    </div>
  );
}
