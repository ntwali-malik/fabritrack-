import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  getDepreciationRecords,
  createDepreciationRecord,
  updateDepreciationRecord,
  deleteDepreciationRecord,
} from "../services/depreciationRecordService";
import { getAssets } from "../services/assetService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./EntityPage.css";
import "./DepreciationRecordPage.css";

const METHOD_OPTIONS = [
  { value: "STRAIGHT_LINE", label: "Straight line" },
  { value: "DECLINING_BALANCE", label: "Declining balance" },
];

const emptyForm = () => ({
  year: "",
  method: "STRAIGHT_LINE",
  assetId: "",
});

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const assetLabel = (a) => a?.name || a?.assetTag || a?.id || "—";

export default function DepreciationRecordPage({ user, onDataChange, searchQuery }) {
  const [list, setList] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.querySelector(".shell")?.getAttribute("data-theme") === "dark";
  });

  const notify = (data) => { if (typeof onDataChange === "function") onDataChange(data); };

  const load = () => {
    setLoading(true);
    setError("");
    getDepreciationRecords()
      .then((data) => { setList(data); notify(data); })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    notify(undefined);
    load();
    getAssets().then((a) => setAssets(a || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const shellEl = document.querySelector(".shell");
    if (!shellEl) return undefined;

    const updateTheme = () => {
      setIsDark(shellEl.getAttribute("data-theme") === "dark");
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(shellEl, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      year: row.year != null ? String(row.year) : "",
      method: row.method || "STRAIGHT_LINE",
      assetId: row.asset?.id != null ? String(row.asset.id) : "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setFormError(""); setDeleteConfirm(null); };

  const cancelDelete = () => setDeleteConfirm(null);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.year?.trim()) { setFormError("Year is required."); return; }
    if (!editing && !form.assetId) { setFormError("Select an asset."); return; }
    setSaving(true);
    if (editing) {
      const payload = {
        year: parseInt(form.year, 10),
        method: form.method,
      };
      updateDepreciationRecord(editing.id, payload)
        .then((saved) => {
          setList((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          notify(list.map((x) => (x.id === saved.id ? saved : x)));
          closeModal();
        })
        .catch((e) => setFormError(e.message || "Failed to save"))
        .finally(() => setSaving(false));
    } else {
      const payload = {
        assetId: form.assetId,
        year: parseInt(form.year, 10),
        method: form.method || undefined,
      };
      createDepreciationRecord(payload)
        .then((saved) => {
          setList((prev) => [...prev, saved]);
          notify([...list, saved]);
          closeModal();
        })
        .catch((e) => setFormError(e.message || "Failed to save"))
        .finally(() => setSaving(false));
    }
  };

  const doDelete = () => {
    if (!deleteConfirm) return;
    deleteDepreciationRecord(deleteConfirm)
      .then(() => {
        setList((prev) => prev.filter((x) => x.id !== deleteConfirm));
        notify(list.filter((x) => x.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((e) => setFormError(e.message || "Failed to delete"));
  };

  const filteredList = filterListByQuery(list, searchQuery, ["year", "method", (r) => assetLabel(r.asset)]);

  const currency = (v) =>
    typeof v === "number"
      ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  const analytics = useMemo(() => {
    if (!Array.isArray(list) || list.length === 0) {
      return {
        totalRecords: 0,
        totalAssets: 0,
        totalDep: 0,
        totalDepThisYear: 0,
        totalRemaining: 0,
        yearData: [],
        methodData: [],
      };
    }

    const currentYear = new Date().getFullYear();
    const assetIds = new Set();
    const byYear = new Map();
    const byMethod = new Map();

    let totalDep = 0;
    let totalDepThisYear = 0;
    let totalRemaining = 0;

    for (const r of list) {
      const dep =
        r.depreciationAmount != null
          ? Number(r.depreciationAmount) || 0
          : r.amount != null
          ? Number(r.amount) || 0
          : 0;
      const rem =
        r.remainingValue != null ? Number(r.remainingValue) || 0 : 0;

      totalDep += dep;
      totalRemaining += rem;

      if (r.year === currentYear) {
        totalDepThisYear += dep;
      }

      if (r.asset?.id != null) {
        assetIds.add(r.asset.id);
      }

      if (r.year != null) {
        const y = String(r.year);
        byYear.set(y, (byYear.get(y) || 0) + dep);
      }

      const methodKey = r.method || "Unknown";
      byMethod.set(methodKey, (byMethod.get(methodKey) || 0) + dep);
    }

    const yearData = Array.from(byYear.entries())
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => Number(a.year) - Number(b.year));

    const methodData = Array.from(byMethod.entries()).map(
      ([method, amount]) => ({
        method,
        methodLabel:
          METHOD_OPTIONS.find((m) => m.value === method)?.label || method,
        amount,
      })
    );

    return {
      totalRecords: list.length,
      totalAssets: assetIds.size,
      totalDep,
      totalDepThisYear,
      totalRemaining,
      yearData,
      methodData,
    };
  }, [list]);

  const METHOD_COLORS = ["#1a56ff", "#0e9f6e", "#f97316", "#6366f1", "#0ea5e9"];
  const chartTheme = isDark
    ? {
        grid: "rgba(148,163,184,0.22)",
        tick: "#94a3b8",
        bar: "#3b82f6",
        pieStroke: "#0f172a",
        tooltipBg: "#0f172a",
        tooltipBorder: "rgba(148,163,184,0.35)",
        tooltipText: "#e2e8f0",
      }
    : {
        grid: "#e2e8f0",
        tick: "#94a3b8",
        bar: "#1a56ff",
        pieStroke: "#ffffff",
        tooltipBg: "#ffffff",
        tooltipBorder: "#e2e8f0",
        tooltipText: "#0f172a",
      };

  return (
    <div className="depr-page">
      {analytics.totalRecords > 0 && (
        <div className="entity-analytics">
          <div className="entity-kpi-row">
            <div className="entity-kpi-card">
              <div className="entity-kpi-label">Total depreciation</div>
              <div className="entity-kpi-value">
                {currency(analytics.totalDep)}
              </div>
            </div>
            <div className="entity-kpi-card">
              <div className="entity-kpi-label">Depreciation this year</div>
              <div className="entity-kpi-value">
                {currency(analytics.totalDepThisYear)}
              </div>
            </div>
            <div className="entity-kpi-card">
              <div className="entity-kpi-label">Remaining book value</div>
              <div className="entity-kpi-value">
                {currency(analytics.totalRemaining)}
              </div>
            </div>
            <div className="entity-kpi-card">
              <div className="entity-kpi-label">Assets with records</div>
              <div className="entity-kpi-value">
                {analytics.totalAssets.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="entity-analytics-row">
            <div className="entity-analytics-card">
              <div className="entity-analytics-header">
                <div>
                  <div className="entity-analytics-title">
                    Depreciation by year
                  </div>
                  <div className="entity-analytics-subtitle">
                    Total depreciation per fiscal year
                  </div>
                </div>
              </div>
              <div className="entity-analytics-body">
                {analytics.yearData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220} minWidth={0}>
                    <BarChart
                      data={analytics.yearData}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: chartTheme.tick, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: chartTheme.tick, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => currency(Number(value))}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{
                          background: chartTheme.tooltipBg,
                          border: `1px solid ${chartTheme.tooltipBorder}`,
                          borderRadius: 8,
                          fontSize: 12,
                          color: chartTheme.tooltipText,
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        name="Depreciation"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                        fill={chartTheme.bar}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="entity-analytics-empty">No yearly data</div>
                )}
              </div>
            </div>

            <div className="entity-analytics-card">
              <div className="entity-analytics-header">
                <div>
                  <div className="entity-analytics-title">
                    By depreciation method
                  </div>
                  <div className="entity-analytics-subtitle">
                    Share of total depreciation
                  </div>
                </div>
              </div>
              <div className="entity-analytics-body entity-analytics-body--pie">
                {analytics.methodData.length > 0 ? (
                  <>
                    <div className="entity-analytics-pie">
                      <PieChart width={190} height={190}>
                        <Pie
                          data={analytics.methodData}
                          dataKey="amount"
                          nameKey="methodLabel"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={analytics.methodData.length ? 2 : 0}
                          stroke={chartTheme.pieStroke}
                          strokeWidth={2}
                        >
                          {analytics.methodData.map((entry, index) => (
                            <Cell
                              key={entry.method}
                              fill={
                                METHOD_COLORS[index % METHOD_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            currency(Number(value)),
                            name,
                          ]}
                          contentStyle={{
                            background: chartTheme.tooltipBg,
                            border: `1px solid ${chartTheme.tooltipBorder}`,
                            borderRadius: 8,
                            fontSize: 12,
                            color: chartTheme.tooltipText,
                          }}
                        />
                      </PieChart>
                    </div>
                    <div className="entity-analytics-legend">
                      {analytics.methodData.map((m, index) => {
                        const total = analytics.totalDep || 1;
                        const pct = total
                          ? ((m.amount / total) * 100).toFixed(0)
                          : 0;
                        return (
                          <div
                            key={m.method}
                            className="entity-analytics-legend-item"
                          >
                            <span
                              className="entity-analytics-legend-dot"
                              style={{
                                backgroundColor:
                                  METHOD_COLORS[index % METHOD_COLORS.length],
                              }}
                            />
                            <span className="entity-analytics-legend-label">
                              {m.methodLabel}
                            </span>
                            <span className="entity-analytics-legend-value">
                              {currency(m.amount)} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="entity-analytics-empty">
                    No method breakdown
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="entity-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="entity-add-btn" onClick={openAdd}>Add Depreciation Record</button>
          </div>
        </div>
        {error && <p className="entity-error">{error}</p>}
        {loading ? <p className="entity-loading">Loading…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Year</th>
                  <th>Method</th>
                  <th>Depreciation</th>
                  <th>Remaining value</th>
                  <th>Asset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.id} className="t-row">
                    <td className="td-id">{row.id}</td>
                    <td>{row.year != null ? row.year : "—"}</td>
                    <td><span className="entity-status">{row.method || "—"}</span></td>
                    <td>{row.depreciationAmount != null ? row.depreciationAmount : "—"}</td>
                    <td>{row.remainingValue != null ? row.remainingValue : "—"}</td>
                    <td>{assetLabel(row.asset)}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div className="action-cell">
                        <button type="button" className="action-btn" aria-label="Edit" onClick={() => openEdit(row)}><IconEdit /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && !loading && <tr><td colSpan={7} className="entity-empty">No depreciation records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="entity-modal-overlay" onClick={closeModal}>
          <div className="entity-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="entity-modal-header">
              <h2 className="entity-modal-title">{editing ? "Edit Depreciation Record" : "Add Depreciation Record"}</h2>
              <button type="button" className="entity-modal-close" aria-label="Close" onClick={closeModal}><IconClose /></button>
            </div>
            <form onSubmit={handleSubmit} className="entity-modal-body">
              {formError && <p className="entity-error">{formError}</p>}
              {editing && (
                <p className="entity-toolbar-desc" style={{ marginBottom: 12 }}>
                  Depreciation amount and remaining value are calculated by the backend from the asset (purchase cost, useful life, salvage value). Changing year or method will recalculate them.
                </p>
              )}
              {editing && (
                <div className="entity-form-grid" style={{ marginBottom: 12 }}>
                  <div className="entity-field">
                    <label>Depreciation amount (calculated)</label>
                    <input type="text" readOnly value={editing.depreciationAmount != null ? editing.depreciationAmount : "—"} className="entity-readonly" />
                  </div>
                  <div className="entity-field">
                    <label>Remaining value (calculated)</label>
                    <input type="text" readOnly value={editing.remainingValue != null ? editing.remainingValue : "—"} className="entity-readonly" />
                  </div>
                </div>
              )}
              <div className="entity-form-grid">
                <div className="entity-field entity-field--full">
                  <label>Asset *</label>
                  <select
                    value={form.assetId}
                    onChange={(e) => handleChange("assetId", e.target.value)}
                    required={!editing}
                    disabled={!!editing}
                  >
                    <option value="">Select asset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>{assetLabel(a)}</option>
                    ))}
                  </select>
                  {editing && <span className="entity-field-hint">Asset cannot be changed when editing.</span>}
                </div>
                <div className="entity-field">
                  <label>Year *</label>
                  <input type="number" min="2000" max="2100" value={form.year} onChange={(e) => handleChange("year", e.target.value)} required />
                </div>
                <div className="entity-field">
                  <label>Method</label>
                  <select value={form.method} onChange={(e) => handleChange("method", e.target.value)}>
                    {METHOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="entity-modal-footer">
                {editing && (
                  <button type="button" className="entity-btn entity-btn--danger" onClick={() => setDeleteConfirm(editing.id)}>
                    Delete
                  </button>
                )}
                <button type="button" className="entity-btn entity-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="entity-btn entity-btn--primary" disabled={saving}>{saving ? "Saving…" : editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={doDelete}
        title="Delete depreciation record?"
        message="Are you sure you want to delete this depreciation record? The asset's current value will be updated. This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Depreciation Record Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "year", label: "Year" }, { key: "method", label: "Method" }, { key: "amount", label: "Amount" }, { key: "remainingValue", label: "Remaining value" }, { key: "asset", label: "Asset" }],
          rows: list.map((r) => ({ id: r.id, year: r.year != null ? r.year : "—", method: r.method || "—", amount: r.amount != null ? r.amount : "—", remainingValue: r.remainingValue != null ? r.remainingValue : "—", asset: assetLabel(r.asset) })),
        })}
      />
    </div>
  );
}
