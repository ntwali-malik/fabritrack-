import { useState, useEffect } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportModal from "./ReportModal";
import { filterListByQuery } from "../utils/validation";
import "./UserManagementPage.css";
import "./EntityPage.css";

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  role: "IT",
  department: "",
  phone: "",
  password: "",
  status: "ACTIVE",
});

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "IT", label: "IT" },
  { value: "FINANCE", label: "Finance" },
  { value: "SECURITY", label: "Security" },
];

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

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

const roleLabel = (role) => {
  if (!role) return "—";
  const upper = String(role).toUpperCase();
  const opt = ROLE_OPTIONS.find((r) => r.value === upper);
  return opt ? opt.label : upper.charAt(0) + upper.slice(1).toLowerCase();
};

const statusLabel = (status) => {
  if (!status) return "—";
  const upper = String(status).toUpperCase();
  const opt = STATUS_OPTIONS.find((s) => s.value === upper);
  return opt ? opt.label : upper.charAt(0) + upper.slice(1).toLowerCase();
};

const userDisplayName = (u) => {
  if (!u) return "—";
  if (u.firstName || u.lastName) return [u.firstName, u.lastName].filter(Boolean).join(" ");
  return u.email || u.id || "—";
};

export default function UserManagementPage({ user, searchQuery }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    setError("");
    getUsers()
      .then((list) => {
        setUsers(Array.isArray(list) ? list : []);
      })
      .catch((err) => setError(err.message || "Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAdd = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      role: (u.role || "IT").toUpperCase(),
      department: u.department || "",
      phone: u.phone || "",
      password: "",
      status: u.status || "ACTIVE",
    });
    setFormError("");
    setDeleteConfirm(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormError("");
    setDeleteConfirm(null);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.email?.trim()) {
      setFormError("Email is required.");
      return;
    }
    if (!editingUser && !form.password) {
      setFormError("Password is required when creating a user.");
      return;
    }

    setSaving(true);
    const payload = {
      email: form.email.trim(),
      firstName: form.firstName?.trim() || null,
      lastName: form.lastName?.trim() || null,
      phone: form.phone?.trim() || null,
      role: form.role || "IT",
      department: form.department?.trim() || null,
      status: form.status || "ACTIVE",
    };
    if (form.password) {
      payload.password = form.password;
    }

    const action = editingUser ? updateUser(editingUser.id, payload) : createUser(payload);

    action
      .then((saved) => {
        setUsers((prev) =>
          editingUser ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved]
        );
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to save user"))
      .finally(() => setSaving(false));
  };

  const requestDelete = () => setDeleteConfirm(editingUser?.id ?? null);
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteUser(deleteConfirm)
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm));
        setDeleteConfirm(null);
        closeModal();
      })
      .catch((err) => setFormError(err.message || "Failed to delete user"));
  };

  const filteredUsers = filterListByQuery(users, searchQuery, [
    "email",
    "firstName",
    "lastName",
    "department",
    "role",
    (u) => userDisplayName(u),
  ]);

  return (
    <>
      <div className="card">
        <div className="user-toolbar">
          <span />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" className="report-btn" onClick={() => setReportOpen(true)}>
              Report
            </button>
            <button type="button" className="user-add-btn" onClick={openAdd}>
              Add User
            </button>
          </div>
        </div>
        {error && <p className="user-error">{error}</p>}
        {loading ? (
          <p className="user-loading">Loading users…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="t-row">
                    <td className="td-id">{u.id}</td>
                    <td>{userDisplayName(u)}</td>
                    <td>{u.email || "—"}</td>
                    <td>{roleLabel(u.role)}</td>
                    <td>{u.department || "—"}</td>
                    <td>
                      <span className={`user-status user-status--${(u.status || "").toLowerCase()}`}>
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-cell">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(u)}
                        >
                          <IconEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="user-empty">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="user-modal-overlay" onClick={closeModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h2 className="user-modal-title">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button type="button" className="user-modal-close" aria-label="Close" onClick={closeModal}>
                <IconClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="user-modal-body">
              {formError && <p className="user-error">{formError}</p>}
              <div className="user-form-grid">
                <div className="user-field">
                  <label htmlFor="user-first-name">First name</label>
                  <input
                    id="user-first-name"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleFormChange("firstName", e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="user-field">
                  <label htmlFor="user-last-name">Last name</label>
                  <input
                    id="user-last-name"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleFormChange("lastName", e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="user-field user-field--full">
                  <label htmlFor="user-email">Email *</label>
                  <input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="Email address"
                    required
                  />
                </div>
                <div className="user-field">
                  <label htmlFor="user-role">Role</label>
                  <select
                    id="user-role"
                    value={form.role}
                    onChange={(e) => handleFormChange("role", e.target.value)}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="user-field">
                  <label htmlFor="user-department">Department</label>
                  <input
                    id="user-department"
                    type="text"
                    value={form.department}
                    onChange={(e) => handleFormChange("department", e.target.value)}
                    placeholder="Department"
                  />
                </div>
                <div className="user-field">
                  <label htmlFor="user-phone">Phone</label>
                  <input
                    id="user-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="user-field">
                  <label htmlFor="user-status">Status</label>
                  <select
                    id="user-status"
                    value={form.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="user-field user-field--full">
                  <label htmlFor="user-password">
                    {editingUser ? "Password (leave blank to keep current)" : "Password *"}
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    placeholder={editingUser ? "New password (optional)" : "Initial password"}
                  />
                </div>
              </div>
              <div className="user-modal-footer">
                {editingUser && (
                  <button
                    type="button"
                    className="user-btn user-btn--danger"
                    onClick={requestDelete}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="user-btn user-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="user-btn user-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingUser ? "Update" : "Create"}
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
        title="Delete user?"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportTitle="User Management Report"
        generatedBy={user ? userDisplayName(user) : "—"}
        generatedAt={new Date().toISOString()}
        renderFilters={() => null}
        getReportData={() => ({
          columns: [
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            { key: "department", label: "Department" },
            { key: "status", label: "Status" },
          ],
          rows: users.map((u) => ({
            id: u.id,
            name: userDisplayName(u),
            email: u.email || "—",
            role: roleLabel(u.role),
            department: u.department || "—",
            status: statusLabel(u.status),
          })),
        })}
      />
    </>
  );
}

