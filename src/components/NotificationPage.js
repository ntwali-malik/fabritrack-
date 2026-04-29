import { useState, useEffect, useMemo } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";
import "./NotificationPage.css";

const formatDateTime = (d) => (!d ? "—" : (typeof d === "string" ? d.slice(0, 19).replace("T", " ") : String(d)));

const userLabel = (u) => (!u ? "—" : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id);

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const DEFAULT_PAGE_SIZE = 5;

/** CSS class suffix for notification type (e.g. reservation, assignment) */
const notificationTypeClass = (type) => {
  if (!type) return "default";
  const t = String(type).toUpperCase();
  if (t === "RESERVATION") return "reservation";
  if (t === "ASSIGNMENT") return "assignment";
  if (t === "MAINTENANCE") return "maintenance";
  if (t === "THEFT_RISK") return "theft-risk";
  return "default";
};

export default function NotificationPage({ user, onDataChange, searchQuery }) {
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    const opts = { unreadOnly };
    if (user?.id && !isAdmin) opts.userId = user.id;
    getNotifications(opts)
      .then((data) => { setList(data || []); notify(data); })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();
  }, [unreadOnly, user?.id, isAdmin]);

  const handleMarkAsRead = (id) => {
    setMarkingId(id);
    markNotificationAsRead(id)
      .then((updated) => {
        const next = list.map((x) => (x.id === updated.id ? updated : x));
        setList(next);
        notify(next);
      })
      .catch(() => setError("Failed to mark as read"))
      .finally(() => setMarkingId(null));
  };

  const handleMarkAllAsRead = () => {
    setMarkingAll(true);
    markAllNotificationsAsRead()
      .then(() => load())
      .catch((e) => setError(e.message || "Failed to mark all as read"))
      .finally(() => setMarkingAll(false));
  };

  const unreadCount = list.filter((n) => !n.isRead).length;

  const filteredList = useMemo(
    () => filterListByQuery(list, searchQuery, ["title", "message", "type", (n) => userLabel(n.user)]),
    [list, searchQuery]
  );

  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedList = useMemo(
    () => filteredList.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredList, currentPage, pageSize]
  );

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalPages, page]);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value) || DEFAULT_PAGE_SIZE;
    setPageSize(newSize);
    setPage(0);
  };
  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <>
      <div className="card">
        <div className="entity-toolbar">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "#64748b" }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            {unreadCount > 0 && (
              <button
                type="button"
                className="entity-add-btn"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
              >
                {markingAll ? "Updating…" : "Mark all as read"}
              </button>
            )}
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? (
          <p className="entity-loading">Loading…</p>
        ) : (
          <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Type</th>
                  <th>Read</th>
                  <th>Created</th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td>{row.title || "—"}</td>
                    <td style={{ maxWidth: 200 }}>{row.message || "—"}</td>
                    <td><span className={`entity-status notification-type notification-type--${notificationTypeClass(row.type)}`}>{row.type || "—"}</span></td>
                    <td>{row.isRead ? "Yes" : "No"}</td>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>{userLabel(row.user)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        {!row.isRead && (
                          <button
                            type="button"
                            className="entity-btn entity-btn--primary"
                            style={{ padding: "6px 12px", fontSize: "0.8125rem" }}
                            onClick={() => handleMarkAsRead(row.id)}
                            disabled={markingId === row.id}
                          >
                            {markingId === row.id ? "…" : "Mark read"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="entity-empty">
                      {unreadOnly ? "No unread notifications." : "No notifications yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalItems > 0 && (
            <div className="notification-pagination">
              <span className="notification-page-info">
                Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong>
              </span>
              <div className="notification-page-controls">
                <label className="notification-page-size-label">
                  Per page
                  <select
                    className="notification-page-size-select"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    aria-label="Items per page"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="notification-page-btn"
                  onClick={handlePrev}
                  disabled={currentPage <= 0}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="notification-page-num">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="notification-page-btn"
                  onClick={handleNext}
                  disabled={currentPage >= totalPages - 1}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Notification Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "title", label: "Title" }, { key: "message", label: "Message" }, { key: "type", label: "Type" }, { key: "isRead", label: "Read" }, { key: "createdAt", label: "Created" }, { key: "user", label: "User" }],
          rows: list.map((r) => ({ id: r.id, title: r.title || "—", message: (r.message || "—").slice(0, 60), type: r.type || "—", isRead: r.isRead ? "Yes" : "No", createdAt: formatDateTime(r.createdAt), user: userLabel(r.user) })),
        })}
      />
    </>
  );
}
