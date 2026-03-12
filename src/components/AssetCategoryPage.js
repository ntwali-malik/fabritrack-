import { useState, useEffect } from "react";
import {
  getAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
} from "../services/assetCategoryService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./AssetCategoryPage.css";
import "./EntityPage.css";

const emptyForm = () => ({ name: "", description: "" });

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

export default function AssetCategoryPage({ user, onCategoriesChange, searchQuery }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const notify = (list) => {
    if (typeof onCategoriesChange === "function") onCategoriesChange(list);
  };

  useEffect(() => {
    notify(undefined);
    setLoading(true);
    setError("");
    getAssetCategories()
      .then((list) => {
        setCategories(list);
        notify(list);
      })
      .catch((err) => setError(err.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormError("");
    setDeleteConfirm(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name?.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
    };
    (editingCategory
      ? updateAssetCategory(editingCategory.id, payload)
      : createAssetCategory(payload))
      .then((saved) => {
        const next = editingCategory
          ? categories.map((c) => (c.id === saved.id ? saved : c))
          : [...categories, saved];
        setCategories(next);
        notify(next);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save category"))
      .finally(() => setSaving(false));
  };

  const requestDelete = () => setDeleteConfirm(editingCategory?.id ?? null);
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteAssetCategory(deleteConfirm)
      .then(() => {
        const next = categories.filter((c) => c.id !== deleteConfirm);
        setCategories(next);
        notify(next);
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete category"));
  };

  const filteredCategories = filterListByQuery(categories, searchQuery, ["name", "description"]);

  return (
    <>
      <div className="card">
        <div className="category-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>Report</button>
            <button type="button" className="category-add-btn" onClick={openAdd}>
              Add Category
            </button>
          </div>
        </div>
        {error && <p className="category-error">{error}</p>}
        {loading ? (
          <p className="category-loading">Loading categories…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="t-row">
                    <td className="td-id">{cat.id}</td>
                    <td>{cat.name || "—"}</td>
                    <td className="td-addr">{cat.description || "—"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(cat)}
                        >
                          <IconGear />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="category-empty">
                      No categories yet. Click &quot;Add Category&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="category-modal-overlay" onClick={closeModal}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-header">
              <h2 className="category-modal-title">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button type="button" className="category-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="category-modal-body">
              {formError && <p className="category-error">{formError}</p>}
              <div className="category-field">
                <label htmlFor="category-name">Name *</label>
                <input
                  id="category-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div className="category-field">
                <label htmlFor="category-desc">Description</label>
                <textarea
                  id="category-desc"
                  value={form.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Optional description"
                  rows={4}
                />
              </div>
              <div className="category-modal-footer">
                {editingCategory && (
                  <button
                    type="button"
                    className="category-btn category-btn--danger"
                    onClick={requestDelete}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="category-btn category-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="category-btn category-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete category?"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="Asset Category Report"
        generatedBy={user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "—" : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [{ key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "description", label: "Description" }],
          rows: categories.map((c) => ({ id: c.id, name: c.name || "—", description: c.description || "—" })),
        })}
      />
    </>
  );
}
