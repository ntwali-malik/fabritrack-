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

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
            <table className="entity-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="t-row">
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
                          <IconEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="category-empty">
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
              <div className="category-form-intro">
                Fill in the details below to create a clear and reusable asset category.
              </div>
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
                <small className="category-field-hint">Short, specific descriptions make reports easier to read.</small>
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
