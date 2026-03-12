import React, { useState, useEffect } from 'react';
import { updateProfile, uploadAvatar, deleteAvatar } from '../services/userService';
import './ProfileModal.css';

const ACCEPT_AVATAR = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_AVATAR_MB = 5;

function ProfileModal({ user, currentAvatarUrl, defaultAvatar, onClose, onSave, onAvatarChange }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError('');
  };

  const handlePasswordChange = (field, value) => {
    setPassword((p) => ({ ...p, [field]: value }));
    setError('');
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_AVATAR_MB} MB.`);
      return;
    }
    const type = file.type?.toLowerCase() || '';
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type)) {
      setError('Use JPEG, PNG, GIF, or WebP.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
    setError('');
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let updated = { ...user };

      const profilePayload = {
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      };
      if (password.newPassword) {
        if (!password.currentPassword) {
          setError('Enter your current password to set a new one.');
          setSaving(false);
          return;
        }
        profilePayload.currentPassword = password.currentPassword;
        profilePayload.newPassword = password.newPassword;
      }
      if (Object.keys(profilePayload).some((k) => profilePayload[k] !== undefined)) {
        updated = await updateProfile(profilePayload);
      }

      if (removeAvatar) {
        updated = await deleteAvatar();
        onAvatarChange?.();
      } else if (avatarFile) {
        updated = await uploadAvatar(avatarFile);
        onAvatarChange?.();
      }

      onSave?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatarDisplay = avatarPreview || (removeAvatar ? null : currentAvatarUrl) || defaultAvatar;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Profile settings</h2>
          <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="profile-modal-form">
          {error && (
            <div className="profile-modal-error" role="alert">
              {error}
            </div>
          )}

          <section className="profile-modal-section">
            <h3>Profile photo</h3>
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrap">
                <img src={avatarDisplay} alt="" className="profile-avatar-img" />
              </div>
              <div className="profile-avatar-actions">
                <label className="profile-avatar-btn">
                  <input
                    type="file"
                    accept={ACCEPT_AVATAR}
                    onChange={handleAvatarSelect}
                    className="profile-avatar-input"
                  />
                  Choose photo
                </label>
                {(currentAvatarUrl || avatarFile) && !removeAvatar && (
                  <button type="button" className="profile-avatar-remove" onClick={handleRemoveAvatar}>
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="profile-modal-section">
            <h3>Personal info</h3>
            <div className="profile-field-row">
              <label className="profile-label">First name</label>
              <input
                type="text"
                className="profile-input"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="profile-field-row">
              <label className="profile-label">Last name</label>
              <input
                type="text"
                className="profile-input"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="profile-field-row">
              <label className="profile-label">Email</label>
              <input
                type="email"
                className="profile-input"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email"
              />
            </div>
            <div className="profile-field-row">
              <label className="profile-label">Phone</label>
              <input
                type="tel"
                className="profile-input"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Phone (optional)"
              />
            </div>
          </section>

          <section className="profile-modal-section">
            <h3>Change password (optional)</h3>
            <div className="profile-field-row">
              <label className="profile-label">Current password</label>
              <input
                type="password"
                className="profile-input"
                value={password.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
            <div className="profile-field-row">
              <label className="profile-label">New password</label>
              <input
                type="password"
                className="profile-input"
                value={password.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
              />
            </div>
          </section>

          <div className="profile-modal-actions">
            <button type="button" className="profile-btn profile-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="profile-btn profile-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
