import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import ReportHeader from "./ReportHeader";
import "./ReportModal.css";

function toSafeFileName(name) {
  return String(name || "report")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ReportModal({
  open,
  onClose,
  reportTitle = "Report",
  generatedBy = "—",
  generatedAt = new Date().toISOString(),
  renderFilters,
  getReportData,
  onDownloadPdf,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previewRef = useRef(null);

  const reportData = useMemo(() => {
    if (typeof getReportData !== "function") {
      return { columns: [], rows: [] };
    }
    const data = getReportData() || {};
    return {
      columns: Array.isArray(data.columns) ? data.columns : [],
      rows: Array.isArray(data.rows) ? data.rows : [],
    };
  }, [getReportData]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, busy]);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const downloadClientPdf = async () => {
    if (!previewRef.current) throw new Error("Report preview is not available.");

    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const imageHeight = (canvas.height * usableWidth) / canvas.width;

    let remaining = imageHeight;
    let y = margin;

    pdf.addImage(imageData, "PNG", margin, y, usableWidth, imageHeight);
    remaining -= pageHeight - margin * 2;

    while (remaining > 0) {
      pdf.addPage();
      y = margin - (imageHeight - remaining);
      pdf.addImage(imageData, "PNG", margin, y, usableWidth, imageHeight);
      remaining -= pageHeight - margin * 2;
    }

    pdf.save(`${toSafeFileName(reportTitle)}.pdf`);
  };

  const handleDownload = async () => {
    setBusy(true);
    setError("");
    try {
      if (typeof onDownloadPdf === "function") {
        try {
          await onDownloadPdf();
        } catch (_) {
          // Backend PDF endpoint may be unavailable in some environments.
          // Fallback to client-side PDF generation for guaranteed download.
          await downloadClientPdf();
        }
      } else {
        await downloadClientPdf();
      }
    } catch (err) {
      setError(err?.message || "Unable to download report.");
    } finally {
      setBusy(false);
    }
  };

  const hasRows = reportData.rows.length > 0;

  return (
    <div className="report-modal-overlay" role="presentation" onClick={!busy ? onClose : undefined}>
      <div
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-label={reportTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="report-modal-header">
          <h3 className="report-modal-title">{reportTitle}</h3>
          <button type="button" className="report-modal-close" onClick={onClose} disabled={busy} aria-label="Close report">
            ✕
          </button>
        </div>

        <div className="report-modal-body">
          <div className="report-modal-filters">{typeof renderFilters === "function" ? renderFilters() : null}</div>

          <div className="report-preview-wrap" ref={previewRef}>
            <ReportHeader generatedBy={generatedBy} generatedAt={generatedAt} />

            <div className="report-preview-table-wrap">
              <table className="report-preview-table">
                <thead>
                  <tr>
                    {reportData.columns.map((column) => (
                      <th key={column.key}>{column.label || column.key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasRows ? (
                    reportData.rows.map((row, index) => (
                      <tr key={`${row.id ?? "row"}-${index}`}>
                        {reportData.columns.map((column) => (
                          <td key={column.key}>{row[column.key] ?? "—"}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={Math.max(reportData.columns.length, 1)}>No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="report-footer">
              Generated by <strong>{generatedBy || "—"}</strong> on{" "}
              <strong>{new Date(generatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</strong>
            </div>
          </div>

          {error ? <div className="entity-error" style={{ marginTop: 12 }}>{error}</div> : null}

          <div className="report-modal-actions">
            <button type="button" className="report-btn" onClick={onClose} disabled={busy}>
              Close
            </button>
            <button type="button" className="report-btn" onClick={handleDownload} disabled={busy || !reportData.columns.length}>
              {busy ? "Preparing..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
