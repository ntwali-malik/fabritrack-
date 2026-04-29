import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  getAssets, getAssetCategories, getLocations, getAssetAssignments,
  getAssetMovements, getAssetReservations, getAttachments, getAuditLogs,
  getLocationInstallationFeedback, getTechnicianTasks, getTechnicianTaskLeaderboard, getDepreciationRecords, getMaintenanceRecords, getNotifications,
  getUsers, getPendingUsers, approveUser, rejectUser,
  markNotificationAsRead, markAllNotificationsAsRead,
} from "../services/api";
import { hasPermission, NAV_PERMISSION, CAP_PERMISSION, getEffectivePermissions, PERMISSIONS } from "../constants/permissions";
import AssetPage from "./AssetPage";
import AssetCategoryPage from "./AssetCategoryPage";
import LocationPage from "./LocationPage";
import AssetAssignmentPage from "./AssetAssignmentPage";
import AssetMovementPage from "./AssetMovementPage";
import AssetReservationPage from "./AssetReservationPage";
import FieldWorkAssetRequestPage from "./FieldWorkAssetRequestPage";
import AttachmentPage from "./AttachmentPage";
import AuditLogPage from "./AuditLogPage";
import LocationInstallationFeedbackPage from "./LocationInstallationFeedbackPage";
import TechnicianTaskPage from "./TechnicianTaskPage";
import DepreciationRecordPage from "./DepreciationRecordPage";
import MaintenanceRecordPage from "./MaintenanceRecordPage";
import NotificationPage from "./NotificationPage";
import AssetScanView from "./AssetScanView";
import { getCurrentUser, getMyAvatarBlob } from "../services/userService";
import ProfileModal from "./ProfileModal";
import UserManagementPage from "./UserManagementPage";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --blue:       #1e40af;
  --blue-lt:    #3b82f6;
  --blue-dk:    #1e3a8a;

  /* Professional sidebar - dark slate */
  --sb-bg:      #0f172a;
  --sb-bg2:     #1e293b;
  --sb-line:    rgba(255,255,255,0.06);
  --sb-text:    rgba(148,163,184,0.9);
  --sb-hi:      #ffffff;
  --sb-hover:   rgba(255,255,255,0.05);
  --sb-active:  rgba(59,130,246,0.12);
  --sb-accent:  #3b82f6;
  --sb-accent2: #60a5fa;
  --sw:         264px;

  --bg:         #f0f4f8;
  --surface:    #ffffff;
  --surface2:   #f8fafc;
  --surface3:   #e2e8f0;
  --border:     rgba(30, 64, 175, 0.12);
  --border-lt:  rgba(30, 64, 175, 0.08);

  --ink:        #0f172a;
  --ink2:       #1e293b;
  --ink3:       #475569;
  --ink4:       #64748b;

  --success:    #16a34a;
  --danger:     #dc2626;
  --warning:    #d97706;

  --fd: 'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --fb: 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;

  --r:    12px;
  --r-lg: 16px;
  --r-xl: 20px;

  --shadow-sm:  0 1px 3px rgba(30,64,175,0.06);
  --shadow-md:  0 4px 20px rgba(30,64,175,0.08);
  --shadow-lg:  0 8px 32px rgba(30,64,175,0.12);
}

body{
  font-family:var(--fb);
  background:var(--bg);
  color:var(--ink);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.3);border-radius:10px}
::-webkit-scrollbar-thumb:hover{background:rgba(148,163,184,0.6)}

.shell{display:flex;min-height:100vh}
.shell, .shell *{
  transition:background-color .22s ease,border-color .22s ease,color .22s ease,box-shadow .22s ease,fill .22s ease,stroke .22s ease;
}

/* Full dashboard theming driven by toggle */
.shell[data-theme="dark"]{
  --bg:#0b1220;
  --surface:#111827;
  --surface2:#1f2937;
  --surface3:#334155;
  --border:rgba(148,163,184,0.2);
  --border-lt:rgba(148,163,184,0.14);
  --ink:#e5e7eb;
  --ink2:#cbd5e1;
  --ink3:#94a3b8;
  --ink4:#64748b;
  --shadow-sm:0 1px 4px rgba(2,6,23,0.35);
  --shadow-md:0 10px 30px rgba(2,6,23,0.4);
  --shadow-lg:0 18px 40px rgba(2,6,23,0.45);
}

.shell[data-theme="dark"] .sidebar{
  background:linear-gradient(180deg,#0b1220 0%,#0f172a 100%);
  border-right:1px solid rgba(148,163,184,0.24);
}
.shell[data-theme="dark"] .sidebar::before{
  background:radial-gradient(ellipse at 60% 0%,rgba(99,102,241,0.2) 0%,transparent 70%);
}
.shell[data-theme="dark"] .sb-brand{border-bottom-color:rgba(148,163,184,0.2)}
.shell[data-theme="dark"] .sb-brand-name{color:#f8fafc}
.shell[data-theme="dark"] .sb-brand-sub{color:rgba(148,163,184,0.82)}
.shell[data-theme="dark"] .sb-profile{
  background:rgba(255,255,255,0.05);
  border-color:rgba(148,163,184,0.24);
}
.shell[data-theme="dark"] .sb-profile:hover{
  background:rgba(99,102,241,0.18);
  border-color:rgba(129,140,248,0.5);
}
.shell[data-theme="dark"] .sb-profile-name{color:#e2e8f0}
.shell[data-theme="dark"] .sb-profile-email{color:#94a3b8}
.shell[data-theme="dark"] .sb-group-trigger:hover{background:rgba(255,255,255,0.08)}
.shell[data-theme="dark"] .sb-section{color:#94a3b8}
.shell[data-theme="dark"] .sb-nav-group.has-active .sb-section{color:#c7d2fe}
.shell[data-theme="dark"] .sb-group-line{background:rgba(148,163,184,0.26)}
.shell[data-theme="dark"] .sb-group-pill{
  background:rgba(148,163,184,0.16);
  color:#cbd5e1;
}
.shell[data-theme="dark"] .sb-group-chevron{color:#94a3b8}
.shell[data-theme="dark"] .nav-btn{color:#cbd5e1}
.shell[data-theme="dark"] .nav-btn:hover{
  color:#fff;
  background:rgba(148,163,184,0.14);
}
.shell[data-theme="dark"] .nav-btn.active{
  color:#fff;
  background:linear-gradient(90deg,rgba(99,102,241,0.28),rgba(99,102,241,0.12));
}
.shell[data-theme="dark"] .nav-btn .nav-icon-wrap{background:rgba(148,163,184,0.18)}
.shell[data-theme="dark"] .sb-footer{border-top-color:rgba(148,163,184,0.2)}
.shell[data-theme="dark"] .sb-theme-toggle{
  background:rgba(2,6,23,0.5);
  border-color:rgba(148,163,184,0.2);
}
.shell[data-theme="dark"] .sb-theme-btn{color:#cbd5e1}
.shell[data-theme="dark"] .sb-theme-btn.active{
  color:#e0e7ff;
  background:linear-gradient(135deg,rgba(99,102,241,0.42),rgba(139,92,246,0.34));
  border-color:rgba(129,140,248,0.45);
}
.shell[data-theme="dark"] .sb-version{color:#94a3b8}

/* Main content dark refinements */
.shell[data-theme="dark"] .tb-page-title{color:#f1f5f9}
.shell[data-theme="dark"] .tb-search{
  background:#111827;
  border-color:rgba(148,163,184,0.2);
}
.shell[data-theme="dark"] .tb-search input{color:#e5e7eb}
.shell[data-theme="dark"] .tb-search input::placeholder{color:#94a3b8}
.shell[data-theme="dark"] .ib,
.shell[data-theme="dark"] .um-trigger{
  background:#111827;
  border-color:rgba(148,163,184,0.2);
  color:#94a3b8;
}
.shell[data-theme="dark"] .db-chart-card:not(.chart-status),
.shell[data-theme="dark"] .stat-card,
.shell[data-theme="dark"] .db-stat-card,
.shell[data-theme="dark"] .tbl-card{
  background:#111827;
  border-color:rgba(148,163,184,0.2);
}
.shell[data-theme="dark"] .db-chart-header{border-bottom-color:rgba(148,163,184,0.18)}
.shell[data-theme="dark"] .db-pie-leg-row{
  background:#0f172a;
  border-color:rgba(148,163,184,0.2);
}
/* Intake trend card + inner chart: themed via .chart-status--light / --dark (matches React darkMode) */
.db-chart-card.chart-status.chart-status--light{
  background:linear-gradient(180deg,#ffffff 0%,#f5f9ff 100%);
  border-color:rgba(37,99,235,0.22);
  box-shadow:0 12px 34px rgba(30,64,175,0.12);
}
.db-chart-card.chart-status.chart-status--light::before{
  background:radial-gradient(circle,rgba(59,130,246,0.18) 0%,rgba(59,130,246,0) 70%);
}
.db-chart-card.chart-status.chart-status--light .db-chart-header{
  background:linear-gradient(180deg,rgba(239,246,255,0.95),rgba(247,251,255,0.9));
  border-bottom-color:rgba(37,99,235,0.16);
}
.db-chart-card.chart-status.chart-status--light .db-chart-title{color:#0f172a}
.db-chart-card.chart-status.chart-status--light .db-chart-sub{color:#475569}
.db-chart-card.chart-status.chart-status--dark{
  overflow:visible;
  background:linear-gradient(180deg,#0f172a 0%,#111827 100%);
  border-color:rgba(129,140,248,0.3);
  box-shadow:0 16px 34px rgba(2,6,23,0.5);
}
.db-chart-card.chart-status.chart-status--dark::before{
  background:radial-gradient(circle,rgba(99,102,241,0.28) 0%,rgba(99,102,241,0) 72%);
}
.db-chart-card.chart-status.chart-status--dark .db-chart-header{
  background:linear-gradient(180deg,rgba(30,41,59,0.86),rgba(15,23,42,0.8));
  border-bottom-color:rgba(129,140,248,0.24);
}
.db-chart-card.chart-status.chart-status--dark .db-chart-title{color:#f1f5f9}
.db-chart-card.chart-status.chart-status--dark .db-chart-sub{color:#94a3b8}
.db-chart-card.chart-status.chart-status--dark .db-chart-header-select{
  background-color:#111827;
  border-color:rgba(129,140,248,0.35);
  color:#c7d2fe;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c7d2fe' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
}
.db-chart-card.chart-status.chart-status--dark .db-chart-header-select:hover{border-color:#818cf8}
.db-chart-card.chart-status.chart-status--dark .db-chart-header-select:focus{box-shadow:0 0 0 3px rgba(129,140,248,0.22)}
.db-chart-card.chart-status.chart-status--light .db-chart-header-select{
  background-color:#ffffff;
  border-color:rgba(37,99,235,0.28);
  color:#1e3a8a;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
}
.db-bar-wrap.db-bar-wrap--trend-light{
  background:linear-gradient(180deg,rgba(248,251,255,0.92),rgba(255,255,255,0.95));
}
.db-bar-wrap.db-bar-wrap--trend-dark{
  background:linear-gradient(180deg,rgba(15,23,42,0.55),rgba(17,24,39,0.35));
}
.db-trend-canvas--light{
  background:linear-gradient(165deg,#ffffff 0%,#f4f8ff 55%,#eef4ff 100%);
  border:1px solid rgba(30,64,175,0.12);
}
.db-trend-canvas--dark{
  background:linear-gradient(165deg,#1e293b 0%,#0f172a 100%);
  border:1px solid rgba(148,163,184,0.22);
}
.db-trend-meta--light .db-trend-chip{
  background:#eef4ff;
  border:1px solid rgba(30,64,175,0.16);
  color:#1e3a8a;
  box-shadow:0 2px 8px rgba(30,64,175,0.08);
}
.db-trend-meta--light .db-trend-chip-dot{background:#2563eb}
.db-trend-meta--light .db-trend-chip--peak{
  background:linear-gradient(135deg,rgba(37,99,235,0.1),rgba(14,165,233,0.08));
  border-color:rgba(37,99,235,0.28);
  color:#1e3a8a
}
.db-trend-meta--dark .db-trend-chip{
  background:#0f172a;
  border:1px solid rgba(129,140,248,0.32);
  color:#c7d2fe;
  box-shadow:none;
}
.db-trend-meta--dark .db-trend-chip-dot{background:#818cf8}
.db-trend-meta--dark .db-trend-chip--peak{
  background:rgba(30,41,59,0.9);
  border-color:rgba(129,140,248,0.35);
  color:#c7d2fe
}
.ct--trend-light{
  padding:10px 13px;
  border-radius:12px;
  font-family:var(--fb);
  font-size:12px;
  background:#ffffff;
  border:1px solid rgba(30,64,175,0.18);
  color:#0f172a;
  box-shadow:0 10px 28px rgba(30,64,175,0.16);
}
.ct--trend-light .ct-lbl{color:var(--blue-dk)}
.ct--trend-light .ct-trend-val{color:#0f172a}
.ct--trend-dark{
  padding:10px 13px;
  border-radius:12px;
  font-family:var(--fb);
  font-size:12px;
  background:#1e293b;
  border:1px solid rgba(148,163,184,0.35);
  color:#e2e8f0;
  box-shadow:0 10px 28px rgba(2,6,23,0.45);
}
.ct--trend-dark .ct-lbl{color:#a5b4fc}
.ct--trend-dark .ct-trend-val{color:#e2e8f0}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  *, *::before, *::after{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;scroll-behavior:auto!important}
}

.sb-backdrop{
  position:fixed;inset:0;
  background:rgba(15, 23, 42, 0.4);
  backdrop-filter:blur(4px);
  z-index:90;
  opacity:0;
  pointer-events:none;
  transition:opacity .2s ease;
}
.sb-backdrop.open{opacity:1;pointer-events:auto}

/* ══════════════════════════════
   SIDEBAR — Premium
   ══════════════════════════════ */
.sidebar{
  position:fixed;top:0;left:0;bottom:0;width:var(--sw);
  display:flex;flex-direction:column;
  z-index:100;overflow:hidden;
  background:linear-gradient(180deg,#f8fbff 0%,#eef4ff 100%);
  border-right:1px solid rgba(30,64,175,0.15);
}
.sidebar::before{
  content:'';position:absolute;top:0;left:0;right:0;height:280px;
  background:radial-gradient(ellipse at 60% 0%,rgba(59,130,246,0.16) 0%,transparent 70%);
  pointer-events:none;z-index:0;
}
.sb-brand{
  padding:20px 18px 16px;
  display:flex;align-items:center;gap:11px;flex-shrink:0;
  position:relative;z-index:1;
  border-bottom:1px solid rgba(30,64,175,0.12);
}
.sb-brand-icon{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 0 20px rgba(99,102,241,0.35);
}
.sb-brand-icon--logo{background:linear-gradient(135deg,#6366f1,#8b5cf6)}
.sb-brand-icon img{width:100%;height:100%;object-fit:contain}
.sb-brand-name{
  font-family:var(--fd);
  font-size:.95rem;font-weight:700;
  color:#0f172a;letter-spacing:-.03em;line-height:1.2;
}
.sb-brand-name em{
  font-style:normal;
  background:linear-gradient(90deg,#818cf8,#c084fc);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.sb-brand-sub{
  font-size:.55rem;color:rgba(51,65,85,0.72);
  text-transform:uppercase;letter-spacing:.15em;font-weight:600;margin-top:2px;
}
.sb-profile{
  margin:12px 12px 0;
  padding:11px 12px;
  display:flex;align-items:center;gap:10px;
  border-radius:12px;cursor:pointer;flex-shrink:0;
  background:rgba(255,255,255,0.7);
  border:1px solid rgba(30,64,175,0.16);
  transition:all .2s ease;position:relative;z-index:1;
}
.sb-profile:hover{background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.32)}
.sb-profile-av{
  width:34px;height:34px;border-radius:9px;
  object-fit:cover;flex-shrink:0;
  background:linear-gradient(135deg,#6366f1,#a855f7);
  box-shadow:0 0 12px rgba(99,102,241,0.4);
  border:none;
}
.sb-profile-info{text-align:left;min-width:0;flex:1}
.sb-profile-name{
  font-family:var(--fd);font-size:.8rem;font-weight:600;
  color:#0f172a;letter-spacing:-.02em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.sb-profile-email{
  font-size:.62rem;color:#334155;margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  display:flex;align-items:center;gap:5px;
}
.sb-online-dot{
  width:5px;height:5px;border-radius:50%;
  background:#22d3ee;box-shadow:0 0 6px rgba(34,211,238,0.6);flex-shrink:0;
}
.sb-nav{
  flex:1;min-height:0;
  padding:10px 8px 6px;
  display:flex;flex-direction:column;
  gap:1px;
  overflow:hidden;
  position:relative;z-index:1;
}
.sb-nav-group{
  border-radius:10px;overflow:hidden;
  flex-shrink:0;margin-bottom:2px;
}
.sb-nav-group.has-active{background:rgba(99,102,241,0.05)}
.sb-nav-group.has-active{background:rgba(59,130,246,0.12)}
.sb-group-trigger{
  display:flex;align-items:center;justify-content:space-between;
  width:100%;border:none;cursor:pointer;
  background:transparent;
  padding:7px 10px 7px 9px;
  border-radius:10px;
  transition:background .15s ease;gap:7px;
}
.sb-group-trigger:hover{background:rgba(59,130,246,0.08)}
.sb-nav-group.has-active .sb-group-trigger{background:rgba(59,130,246,0.14)}
.sb-nav-group.has-active .sb-group-trigger:hover{background:rgba(59,130,246,0.2)}
.sb-group-trigger-left{display:flex;align-items:center;gap:7px;flex:1;min-width:0}
.sb-section{
  font-size:.56rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.14em;
  color:#334155;
  white-space:nowrap;transition:color .15s;flex-shrink:0;
}
.sb-nav-group.has-active .sb-section{color:#1e3a8a}
.sb-group-trigger:hover .sb-section{color:#0f172a}
.sb-group-line{
  flex:1;height:1px;
  background:rgba(30,64,175,0.16);
  transition:background .2s;
}
.sb-nav-group.has-active .sb-group-line{background:rgba(59,130,246,0.5)}
.sb-group-pill{
  font-size:.54rem;font-weight:700;
  padding:2px 6px;border-radius:20px;
  background:rgba(30,64,175,0.1);
  color:#334155;
  flex-shrink:0;transition:all .15s;
}
.sb-nav-group.open .sb-group-pill{opacity:0;pointer-events:none}
.sb-nav-group.has-active .sb-group-pill{
  background:rgba(59,130,246,0.2);color:#1e3a8a;
}
.sb-group-chevron{
  width:13px;height:13px;
  display:flex;align-items:center;justify-content:center;
  color:#64748b;
  transition:transform .25s cubic-bezier(.4,0,.2,1),color .15s ease;
  flex-shrink:0;
}
.sb-nav-group.open .sb-group-chevron{transform:rotate(180deg);color:#1e3a8a}
.sb-group-trigger:hover .sb-group-chevron{color:#334155}
.sb-nav-group-body{
  display:flex;flex-direction:column;gap:1px;
  padding:2px 4px 4px 4px;
  max-height:0;overflow:hidden;
  transition:max-height .3s cubic-bezier(.4,0,.2,1);
}
.sb-nav-group.open .sb-nav-group-body{max-height:500px}
.nav-btn{
  display:flex;align-items:center;gap:9px;
  padding:7px 10px;
  border:none;background:transparent;
  color:#334155;
  font-size:.775rem;font-weight:500;
  cursor:pointer;text-align:left;width:100%;
  border-radius:8px;
  transition:all .15s;
  position:relative;flex-shrink:0;min-height:34px;
  box-sizing:border-box;
}
.nav-btn .nav-btn-label{
  min-width:0;flex:1;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.nav-btn:hover{color:#0f172a;background:rgba(59,130,246,0.12)}
.nav-btn.active{
  color:#0f172a;font-weight:600;
  background:linear-gradient(90deg,rgba(59,130,246,0.2),rgba(59,130,246,0.07));
}
.nav-btn.active::before{
  content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
  width:3px;height:18px;
  background:linear-gradient(180deg,#818cf8,#6366f1);
  border-radius:0 3px 3px 0;
}
.nav-btn .nav-icon-wrap{
  width:27px;height:27px;min-width:27px;
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  background:rgba(30,64,175,0.1);
  transition:all .15s;
}
.nav-btn:hover .nav-icon-wrap{background:rgba(59,130,246,0.2)}
.nav-btn.active .nav-icon-wrap{
  background:rgba(59,130,246,0.24);
  box-shadow:0 0 10px rgba(59,130,246,0.2);
}
.nav-btn svg{flex-shrink:0;opacity:.85}
.nav-btn:hover svg,.nav-btn.active svg{opacity:1}
.nav-badge{
  margin-left:auto;
  font-size:.57rem;font-weight:700;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;padding:2px 7px;border-radius:20px;
  box-shadow:0 0 8px rgba(99,102,241,0.4);
}
.sb-footer{
  padding:8px 12px 16px;
  border-top:1px solid rgba(30,64,175,0.14);
  flex-shrink:0;display:flex;flex-direction:column;gap:10px;
  position:relative;z-index:1;
}
.sb-footer .sb-profile{margin:0}
.sb-theme-toggle{
  display:flex;
  background:rgba(255,255,255,0.76);
  border:1px solid rgba(30,64,175,0.14);
  border-radius:10px;padding:3px;gap:2px;
}
.sb-theme-btn{
  flex:1;padding:6px 8px;border:none;
  background:transparent;
  color:#334155;
  font-size:.67rem;font-weight:600;cursor:pointer;border-radius:8px;transition:all .18s;
}
.sb-theme-btn:hover{transform:translateY(-1px)}
.sb-theme-btn:active{transform:translateY(0) scale(.98)}
.sb-theme-btn.active{
  background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2));
  color:#1e3a8a;border:1px solid rgba(59,130,246,0.28);
}
.sb-version{
  text-align:center;font-size:.55rem;
  color:#475569;letter-spacing:.08em;
}

.sb-user{
  display:flex;align-items:center;gap:10px;
  padding:11px 12px;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:16px;cursor:pointer;
  transition:all .25s ease
}
.sb-user:hover{
  border-color:rgba(255,255,255,0.25);
  background:rgba(255,255,255,0.1)
}
.sb-user-av-wrap{position:relative;flex-shrink:0}
.sb-user-av{
  width:34px;height:34px;border-radius:10px;
  object-fit:cover;
  border:1px solid rgba(255,255,255,0.2);
  display:block
}
.sb-user .sb-online-dot{
  position:absolute;bottom:-2px;right:-2px;
  width:9px;height:9px;border-radius:50%;
  background:#22c55e;
  border:2px solid var(--sb-bg)
}
.sb-user-info{flex:1;min-width:0}
.sb-user-name{font-size:.84rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-user-role{font-size:.625rem;color:rgba(255,255,255,0.7);margin-top:2px}
.sb-user-cog{color:rgba(255,255,255,0.6);flex-shrink:0;transition:all .3s ease}
.sb-user:hover .sb-user-cog{color:#fff;transform:rotate(90deg)}

/* ══════════════════════════════
   MAIN
══════════════════════════════ */
.main{
  flex:1;margin-left:var(--sw);
  display:flex;flex-direction:column;
  min-height:100vh;
  background:var(--bg);
  padding:12px 16px 14px;
}

/* ── HEADER (healthcare design) ── */
.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  flex-wrap:wrap;
  margin-bottom:10px;
}

.tb-left{display:flex;align-items:center;gap:12px;min-width:0}
.tb-page-title{
  font-family:var(--fd);
  font-size:1.42rem;font-weight:800;
  color:var(--ink);letter-spacing:-.04em;line-height:1.2
}

.tb-center{
  flex:1;
  max-width:420px;
  margin:0 auto;
}
.tb-search{
  display:flex;align-items:center;gap:12px;
  padding:10px 16px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:10px;
  transition:border-color .2s,box-shadow .2s
}
.tb-search:focus-within{
  border-color:var(--blue);
  box-shadow:0 0 0 3px rgba(59,130,246,.1)
}
.tb-search input{
  flex:1;
  background:transparent;border:none;outline:none;
  font-size:.875rem;font-weight:500;color:var(--ink);
}
.tb-search input::placeholder{color:var(--ink4)}

.tb-actions{display:flex;align-items:center;gap:10px}

.tb-menu{
  width:40px;height:40px;
  border:1px solid var(--border);
  background:var(--surface);
  color:var(--ink3);
  cursor:pointer;border-radius:12px;
  display:none;align-items:center;justify-content:center;
  transition:all .15s
}
.tb-menu:hover{border-color:var(--blue);color:var(--blue)}

.tb-add-btn{
  height:40px;padding:0 18px;
  font-size:.8125rem;font-weight:600;
  color:#fff;
  background:var(--blue);
  border:none;
  border-radius:8px;
  cursor:pointer;
  display:inline-flex;align-items:center;gap:8px;
  transition:background .15s,opacity .15s
}
.tb-add-btn:hover{
  background:var(--blue-dk);
  opacity:.95
}

.ib{
  position:relative;width:40px;height:40px;
  border:1px solid var(--border);background:var(--surface);
  color:var(--ink3);cursor:pointer;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  transition:border-color .15s,color .15s,background .15s
}
.ib:hover{
  border-color:var(--border);
  background:var(--surface2);
  color:var(--ink2)
}

.ndot{
  position:absolute;top:6px;right:6px;
  width:8px;height:8px;border-radius:50%;
  background:var(--danger);border:2px solid var(--surface)
}

.um-wrap{position:relative}
.um-trigger{
  display:flex;align-items:center;gap:10px;
  padding:4px 4px 4px 12px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:10px;
  cursor:pointer;
  transition:border-color .15s,box-shadow .15s
}
.um-trigger:hover{border-color:var(--ink4)}
.um-av{
  width:32px;height:32px;
  border-radius:8px;
  object-fit:cover;
  border:1px solid var(--border-lt)
}
.um-name{
  font-family:var(--fb);font-size:.8125rem;font-weight:500;
  color:var(--ink);max-width:120px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
.um-trigger .chevron{
  color:var(--ink4);transition:transform .2s ease;flex-shrink:0
}
.um-wrap.open .um-trigger .chevron{transform:rotate(180deg);color:var(--ink3)}

.um-drop{
  position:absolute;right:0;top:calc(100% + 8px);
  min-width:240px;max-width:320px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 10px 40px rgba(15,23,42,0.12),0 0 1px rgba(15,23,42,0.08);
  padding:8px 0;
  z-index:200;
  animation:dropIn .2s ease
}
@keyframes dropIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
@keyframes mfade{from{opacity:0}to{opacity:1}}
@keyframes mrise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.um-head{
  padding:8px 16px 4px;
  font-size:.625rem;font-weight:600;
  color:var(--ink4);text-transform:uppercase;letter-spacing:.1em
}
.um-email{
  padding:0 16px 12px;
  font-size:.8125rem;font-weight:500;color:var(--ink)
}
.um-meta{
  padding:0 16px 12px;
  font-size:.75rem;color:var(--ink3);line-height:1.6
}
.um-meta span{display:block}
.um-div{
  border:none;border-top:1px solid var(--border-lt);margin:0
}
.um-item{
  display:flex;align-items:center;gap:10px;
  width:100%;padding:10px 16px;
  border:none;background:transparent;
  font-size:.8125rem;font-weight:500;color:var(--ink2);
  cursor:pointer;text-align:left;
  transition:background .12s,color .12s
}
.um-item:hover{background:var(--surface2);color:var(--ink)}
.um-item--danger:hover{color:var(--danger);background:rgba(220,38,38,0.06)}

/* ══════════════════════════════
   NOTIFICATION DROPDOWN
══════════════════════════════ */
.notif-wrap{position:relative}
.notif-drop{
  position:absolute;right:0;top:calc(100% + 8px);
  width:360px;max-width:90vw;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:12px;
  box-shadow:0 10px 40px rgba(15,23,42,0.12),0 0 1px rgba(15,23,42,0.08);
  z-index:200;animation:dropIn .2s ease;
  display:flex;flex-direction:column;overflow:hidden
}
.notif-drop-head{
  padding:16px 20px;
  border-bottom:1px solid var(--border-lt);
  display:flex;align-items:center;justify-content:space-between
}
.notif-drop-head h3{
  font-size:.9375rem;font-weight:600;color:var(--ink);letter-spacing:-.02em
}
.notif-mark-all{
  font-size:.75rem;font-weight:500;color:var(--blue);
  background:none;border:none;cursor:pointer;padding:0;
  transition:opacity .15s
}
.notif-mark-all:hover{opacity:.8}
.notif-list{overflow-y:auto;max-height:320px}
.notif-item{
  display:flex;gap:12px;
  padding:14px 20px;
  border-bottom:1px solid var(--border-lt);
  cursor:pointer;
  transition:background .12s
}
.notif-item:last-child{border-bottom:none}
.notif-item:hover{background:var(--surface2)}
.notif-item.unread{background:rgba(59,130,246,0.04)}
.notif-item-dot{
  width:6px;height:6px;border-radius:50%;
  background:var(--blue);flex-shrink:0;margin-top:6px
}
.notif-item:not(.unread) .notif-item-dot{opacity:0}
.notif-item-body{flex:1;min-width:0}
.notif-item-title{font-size:.8125rem;font-weight:500;color:var(--ink);margin-bottom:2px}
.notif-item-msg{font-size:.75rem;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notif-item-time{font-size:.6875rem;color:var(--ink4);margin-top:4px}
.notif-footer{
  padding:12px 20px;
  border-top:1px solid var(--border-lt);
  background:var(--surface2)
}
.notif-footer a{
  font-size:.8125rem;font-weight:500;color:var(--blue);
  text-decoration:none;transition:opacity .15s
}
.notif-footer a:hover{opacity:.85}
.notif-empty,.notif-loading{
  padding:40px 20px;font-size:.8125rem;color:var(--ink4);text-align:center
}

/* ══════════════════════════════
   MODALS
══════════════════════════════ */
.logout-modal-overlay{
  position:fixed;inset:0;
  background:rgba(15,23,42,0.5);backdrop-filter:blur(6px);
  z-index:1000;display:flex;align-items:center;justify-content:center;
  padding:20px;animation:mfade .2s ease
}

.logout-modal{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 24px 48px rgba(15,23,42,0.12),0 0 1px rgba(15,23,42,0.08);
  max-width:400px;width:100%;overflow:hidden;
  animation:mrise .25s ease
}
.logout-modal-inner{padding:32px 28px 12px;text-align:center}
.logout-modal-icon{
  width:50px;height:50px;border-radius:14px;
  background:rgba(26,143,209,.07);border:1px solid rgba(26,143,209,.15);
  color:var(--blue);display:flex;align-items:center;justify-content:center;
  margin:0 auto 18px
}
.logout-modal h2{
  font-family:var(--fd);font-size:1.2rem;font-weight:700;
  color:var(--ink);letter-spacing:-.035em;margin-bottom:8px
}
.logout-modal p{font-family:var(--fb);font-size:.84rem;color:var(--ink3);line-height:1.6;margin-bottom:24px}
.logout-modal-actions{display:flex;gap:9px;padding:0 28px 28px}
.logout-modal-actions button{
  flex:1;padding:10px 0;border-radius:9px;
  font-family:var(--fb);font-size:.83rem;font-weight:500;
  cursor:pointer;border:none;transition:all .15s
}
.logout-modal-btn-no{background:var(--surface2);color:var(--ink);border:1px solid var(--border)}
.logout-modal-btn-no:hover{background:var(--surface3)}
.logout-modal-btn-yes{background:var(--blue);color:#fff;box-shadow:0 2px 8px rgba(26,143,209,0.3)}
.logout-modal-btn-yes:hover{background:var(--blue-dk);box-shadow:0 4px 12px rgba(26,143,209,0.35)}

.paste-scan-modal{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 24px 48px rgba(15,23,42,0.12),0 0 1px rgba(15,23,42,0.08);
  max-width:480px;width:100%;overflow:hidden;
  animation:mrise .25s ease
}
.paste-scan-modal-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 24px;border-bottom:1px solid var(--border-lt)
}
.paste-scan-modal-header h2{font-family:var(--fd);font-size:.95rem;font-weight:600;color:var(--ink);letter-spacing:-.025em}
.paste-scan-close{
  width:28px;height:28px;border:1px solid var(--border);
  background:var(--surface2);color:var(--ink3);cursor:pointer;
  border-radius:7px;display:flex;align-items:center;justify-content:center;
  transition:all .14s
}
.paste-scan-close:hover{border-color:var(--ink3);color:var(--ink)}
.paste-scan-modal-body{padding:20px}
.paste-scan-hint{font-family:var(--fb);font-size:.79rem;color:var(--ink3);margin-bottom:12px;line-height:1.65}
.paste-scan-input{
  width:100%;padding:10px 12px;
  border:1px solid var(--border);border-radius:9px;
  font-size:.78rem;color:var(--ink);background:var(--surface2);
  resize:vertical;min-height:100px;transition:border-color .16s
}
.paste-scan-input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,143,209,.1)}
.paste-scan-error{font-size:.76rem;color:var(--danger);margin-top:7px}
.paste-scan-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:14px}
.paste-scan-actions button{
  padding:9px 20px;border-radius:8px;
  font-family:var(--fb);font-size:.81rem;font-weight:500;
  cursor:pointer;border:none;transition:all .14s
}

/* ══════════════════════════════
   PAGE / DASHBOARD
══════════════════════════════ */
.page{padding:24px 0 40px}
.page.page--dashboard{
  flex:1;min-height:0;
  padding:8px 0 12px
}

/* ── DASHBOARD LAYOUT ── */
.dashboard-home{
  display:flex;flex-direction:column;gap:8px
}

/* ── WELCOME HERO ── */
.db-hero{
  background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%);
  border-radius:var(--r-xl);
  padding:28px 30px;
  display:flex;align-items:center;justify-content:space-between;
  position:relative;overflow:hidden;
  border:1px solid var(--border);
  box-shadow:var(--shadow-sm)
}
/* clean hero (no glow) */
.db-hero::before,.db-hero::after,.db-hero-blob2{content:none;display:none}
.db-hero-text{position:relative;z-index:1}
.db-hero-greeting{
  font-size:.71rem;font-weight:600;
  color:var(--ink4);text-transform:uppercase;letter-spacing:.14em;margin-bottom:6px;
  display:flex;align-items:center;gap:6px
}
.db-hero-greeting::before{
  content:'';width:16px;height:1.5px;
  background:linear-gradient(90deg,rgba(37,99,235,0.9),transparent)
}
.db-hero-title{
  font-size:1.5rem;font-weight:700;
  color:var(--ink);letter-spacing:-.04em;line-height:1.15;margin-bottom:5px
}
.db-hero-title span{color:var(--blue)}
.db-hero-sub{
  font-size:.8rem;color:var(--ink3);line-height:1.55;
  display:flex;align-items:center;gap:7px
}
.db-hero-sub-dot{width:3px;height:3px;border-radius:50%;background:rgba(61,184,245,0.4)}
.db-hero-stats{
  display:flex;gap:8px;position:relative;z-index:1;flex-shrink:0
}
.db-hero-stat{
  padding:16px 22px;
  border-radius:var(--r-lg);text-align:center;min-width:96px;
  position:relative;overflow:hidden;
  transition:transform .2s ease,box-shadow .2s ease
}
.db-hero-stat:hover{transform:translateY(-2px)}
.db-hero-stat:nth-child(1){
  background:rgba(37,99,235,0.06);
  border:1px solid rgba(37,99,235,0.18);
  box-shadow:none
}
.db-hero-stat:nth-child(2){
  background:rgba(217,119,6,0.06);
  border:1px solid rgba(217,119,6,0.18);
  box-shadow:none
}
.db-hero-stat::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(15,23,42,0.03) 0%,transparent 60%);
  pointer-events:none
}
.db-hero-stat-val{
  font-size:1.75rem;font-weight:700;
  letter-spacing:-.05em;line-height:1
}
.db-hero-stat:nth-child(1) .db-hero-stat-val{color:var(--blue)}
.db-hero-stat:nth-child(2) .db-hero-stat-val{color:var(--warning)}
.db-hero-stat-lbl{
  font-size:.6rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.1em;margin-top:5px;color:rgba(255,255,255,0.38)
}
.db-hero-stat-lbl{color:var(--ink4)}

/* ── STAT CARDS (healthcare design) ── */
.db-stats-row{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:8px;
  align-items:stretch;
  margin-bottom:6px
}
@media (max-width:1100px){.db-stats-row{grid-template-columns:repeat(2,1fr)}}
@media (max-width:560px){.db-stats-row{grid-template-columns:1fr}}

.stat-card{
  background:var(--surface);
  border-radius:12px;
  padding:12px;
  border:1px solid var(--border);
  position:relative;
  height:100%;
  min-height:92px;
  overflow:hidden;
  transition:border-color .15s,box-shadow .15s
}
.stat-card:hover{border-color:var(--ink4);box-shadow:0 4px 16px rgba(15,23,42,0.06)}
.stat-card-val{
  font-family:var(--fd);
  font-size:1.38rem;font-weight:800;
  color:var(--blue);
  letter-spacing:-.05em;
  line-height:1.1;
  display:flex;align-items:center;gap:8px
}
.stat-card-val .stat-dot{
  width:8px;height:8px;border-radius:50%
}
.stat-card-val .stat-dot.red{background:#dc2626}
.stat-card-val .stat-dot.blue{background:var(--blue)}
.stat-card-val .stat-dot.green{background:#16a34a}
.stat-card-lbl{font-size:.8rem;color:var(--ink4);margin-top:6px;font-weight:500}
.stat-card-lbl{font-size:.68rem;margin-top:3px}
.stat-card-badge{
  position:absolute;
  top:8px;right:8px;
  font-size:.62rem;font-weight:600;
  padding:3px 7px;
  border-radius:999px
}
.stat-card-badge.green{background:#dcfce7;color:#16a34a}
.stat-card-badge.red{background:#fee2e2;color:#dc2626}
.stat-card-badge.orange{background:#ffedd5;color:#d97706}
.stat-card-icon{
  position:absolute;bottom:8px;right:8px;
  width:26px;height:26px;
  border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  color:var(--ink4);
  opacity:0.5
}

/* Legacy kpi-card (for compatibility) */
.kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:16px}
.kpi-card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  padding:20px;
  display:flex;flex-direction:column;gap:10px;
  position:relative;overflow:hidden;
  box-shadow:var(--shadow-sm);
  transition:all .2s;cursor:default
}
.kpi-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--r-lg) var(--r-lg) 0 0}
.kpi-card:nth-child(1)::before{background:linear-gradient(90deg,var(--blue),var(--blue-lt))}
.kpi-card:nth-child(2)::before{background:linear-gradient(90deg,#0ea5a0,#2dd4c9)}
.kpi-card:nth-child(3)::before{background:linear-gradient(90deg,#7c3aed,#a78bfa)}
.kpi-card:nth-child(4)::before{background:linear-gradient(90deg,#d97706,#f59e0b)}
.kpi-top{display:flex;align-items:center;justify-content:space-between}
.kpi-icon{
  width:38px;height:38px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0
}
.kpi-card:nth-child(1) .kpi-icon{background:rgba(30,64,175,0.1);color:var(--blue)}
.kpi-card:nth-child(2) .kpi-icon{background:rgba(14,165,160,0.1);color:#0ea5a0}
.kpi-card:nth-child(3) .kpi-icon{background:rgba(124,58,237,0.1);color:#7c3aed}
.kpi-card:nth-child(4) .kpi-icon{background:rgba(217,119,6,0.1);color:#d97706}
.kpi-value{font-size:2rem;font-weight:700;letter-spacing:-.05em;line-height:1;color:var(--ink)}
.kpi-label{font-size:.7rem;font-weight:600;color:var(--ink4);text-transform:uppercase;letter-spacing:.08em}
.kpi-bar{height:3px;border-radius:4px;background:var(--border-lt);overflow:hidden;margin-top:4px}
.kpi-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,currentColor,transparent);transition:width .6s ease}

/* ── CHART + STATS GRID (healthcare design) ── */
.db-upper-grid{
  display:grid;
  grid-template-columns:1fr 1.4fr;
  gap:10px;
  align-items:stretch;
  margin-bottom:8px
}
@media (max-width:980px){.db-upper-grid{grid-template-columns:1fr}}

/* Line/Area chart card */
.db-chart-card.chart-status{
  min-height:236px;
  position:relative;
  overflow:visible;
  background:linear-gradient(180deg,#ffffff 0%,#f5f9ff 100%);
  border:1px solid rgba(37,99,235,0.22);
  box-shadow:0 12px 34px rgba(30,64,175,0.12)
}
.db-chart-card.chart-status::before{
  content:'';
  position:absolute;inset:auto -40px -80px auto;
  width:220px;height:220px;border-radius:50%;
  background:radial-gradient(circle,rgba(59,130,246,0.18) 0%,rgba(59,130,246,0) 70%);
  pointer-events:none;
}
.db-chart-card.chart-status .db-chart-header{
  background:linear-gradient(180deg,rgba(239,246,255,0.95),rgba(247,251,255,0.9));
  border-bottom:1px solid rgba(37,99,235,0.16);
  padding:12px 14px 10px;
}
.db-chart-card.chart-status .db-chart-title{font-size:1rem;font-weight:800}
.db-chart-card.chart-status .db-chart-sub{font-size:.68rem;color:#475569}
.db-chart-header-select{
  margin-left:auto;
  padding:8px 34px 8px 12px;
  border:1px solid rgba(37,99,235,0.28);
  border-radius:10px;
  background-color:#ffffff;
  font-size:.78rem;font-weight:700;
  color:#1e3a8a;
  cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 10px center;
  transition:border-color .15s,box-shadow .15s,transform .15s
}
.db-chart-header-select:hover{border-color:#3b82f6;transform:translateY(-1px)}
.db-chart-header-select:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.14)}

/* ── ASSET CARDS GRID (patient-style) ── */
.db-cards-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  align-items:stretch;
  gap:14px
}
@media (max-width:1100px){.db-cards-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:640px){.db-cards-grid{grid-template-columns:1fr}}

.asset-card{
  background:var(--surface);
  border-radius:12px;
  padding:14px;
  border:1px solid var(--border);
  height:100%;
  min-height:212px;
  display:flex;flex-direction:column;
  transition:border-color .15s,box-shadow .15s;
  cursor:pointer
}
.asset-card:hover{border-color:var(--ink4);box-shadow:0 4px 16px rgba(15,23,42,0.06)}
.asset-card-head{
  display:flex;align-items:center;gap:12px;
  margin-bottom:10px
}
.asset-card-av{
  width:48px;height:48px;
  border-radius:50%;
  background:linear-gradient(135deg,var(--blue) 0%,var(--blue-lt) 100%);
  display:flex;align-items:center;justify-content:center;
  color:#fff;
  font-family:var(--fd);
  font-size:1.1rem;font-weight:700;
  flex-shrink:0
}
.asset-card-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.asset-card-name{font-weight:600;font-size:.95rem;color:var(--ink);line-height:1.2}
.asset-card-email{font-size:.75rem;color:var(--ink4);margin-top:2px}
.asset-card-actions{
  display:flex;gap:6px;margin-bottom:10px
}
.asset-card-action-btn{
  padding:6px 12px;
  border:1px solid var(--border);
  background:var(--surface2);
  border-radius:8px;
  font-size:.75rem;font-weight:500;
  color:var(--ink3);
  cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
  transition:all .15s
}
.asset-card-action-btn:hover{border-color:var(--blue);color:var(--blue)}
.asset-card-details{
  display:flex;flex-direction:column;gap:8px;
  padding-top:9px;
  border-top:1px solid var(--border-lt);
  flex:1;
  font-size:.74rem;
  color:var(--ink3)
}
.asset-card-detail-row{display:flex;justify-content:space-between;align-items:center}
.asset-card-detail-row strong{color:var(--ink);font-weight:500}
.asset-card-status{
  margin-top:8px;
  padding:4px 10px;
  border-radius:999px;
  font-size:.68rem;font-weight:600;
  text-align:center;
  align-self:flex-start
}
.asset-card-status.purple{background:#f3e8ff;color:#7c3aed}
.asset-card-status.green{background:#dcfce7;color:#16a34a}
.asset-card-status.blue{background:#dbeafe;color:var(--blue)}
.asset-card-status.amber{background:#fef3c7;color:#d97706}
.asset-card-status.gray{background:#f1f5f9;color:#64748b}
.asset-card-expand{
  margin-top:auto;
  width:28px;height:28px;
  border-radius:50%;
  border:1px solid var(--border);
  background:var(--surface2);
  color:var(--blue);
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  align-self:center;
  transition:all .15s
}
.asset-card-expand:hover{background:var(--blue);color:#fff;border-color:var(--blue)}

/* ── TWO COL LAYOUT ── */
.db-two-col{
  display:grid;
  grid-template-columns:280px 1fr;
  gap:16px;
  align-items:stretch
}

/* ── PIE CARD ── */
.db-chart-card{
  background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);
  border:1px solid rgba(30,64,175,0.14);
  border-radius:14px;
  display:flex;flex-direction:column;
  overflow:hidden;
  box-shadow:0 8px 28px rgba(30,64,175,0.08);
  transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease
}
.db-chart-card:hover{
  border-color:rgba(59,130,246,0.34);
  box-shadow:0 14px 34px rgba(30,64,175,0.14);
  transform:translateY(-2px)
}

.db-chart-header{
  display:flex;align-items:center;gap:11px;
  padding:12px 14px 10px;
  border-bottom:1px solid rgba(30,64,175,0.1);
  flex-shrink:0
}
.db-chart-header-icon{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,rgba(30,64,175,0.13),rgba(59,130,246,0.12));
  border:1px solid rgba(30,64,175,0.16);
  color:var(--blue);display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)
}
.db-chart-title{
  font-size:.9rem;font-weight:700;
  color:var(--ink);letter-spacing:-.025em
}
.db-chart-sub{font-family:var(--fb);font-size:.68rem;color:var(--ink3);margin-top:1px}

.db-pie-wrap{
  flex:1;
  display:flex;flex-direction:column;align-items:stretch;
  padding:10px 12px 12px;
  position:relative
}
.db-pie-visual{
  position:relative;width:100%;min-height:200px;
  flex-shrink:0
}
.db-pie-center{
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-54%);
  text-align:center;pointer-events:none;z-index:1
}
.db-pie-center-val{
  font-family:var(--fd);font-size:1.8rem;font-weight:800;
  color:var(--ink);letter-spacing:-.05em;line-height:1
}
.db-pie-center-lbl{
  font-family:var(--fb);font-size:.58rem;font-weight:500;
  color:var(--ink4);text-transform:uppercase;letter-spacing:.09em;margin-top:3px
}
.db-pie-legend{
  display:flex;flex-direction:column;gap:5px;
  padding-top:8px;width:100%;flex-shrink:0
}
.db-pie-leg-row{
  display:flex;align-items:center;gap:9px;
  padding:7px 10px;border-radius:9px;
  border:1px solid rgba(30,64,175,0.12);background:#f8fbff;
  transition:border-color .14s,background .14s,transform .14s
}
.db-pie-leg-row:hover{
  border-color:rgba(59,130,246,0.35);
  background:#eef5ff;
  transform:translateX(2px)
}
.db-pie-leg-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 1px rgba(15,23,42,0.06) inset}
.shell[data-theme="dark"] .db-pie-leg-dot{box-shadow:0 0 0 1px rgba(0,0,0,0.25) inset}
.db-pie-leg-name{
  flex:1;font-family:var(--fb);font-size:.71rem;color:var(--ink2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize
}
.db-pie-leg-count{font-family:var(--fd);font-size:.85rem;font-weight:700;color:var(--blue-dk)}
.db-pie-leg-pct{
  font-family:var(--fb);font-size:.62rem;color:var(--ink4);margin-left:2px;
  background:#e8f0ff;border:1px solid rgba(30,64,175,0.12);padding:2px 6px;border-radius:999px
}

/* ── BAR CARD ── */
.db-bar-wrap{
  flex:1;min-height:0;padding:8px 10px 10px;
  background:linear-gradient(180deg,rgba(248,251,255,0.85),rgba(255,255,255,0.85))
}
.db-bar-wrap--trend{
  display:flex;flex-direction:column;gap:2px;
  min-height:248px;height:auto;padding-bottom:12px
}
.db-trend-canvas{
  flex:0 0 auto;
  min-height:216px;
  height:216px;
  padding:6px 10px 4px 8px;
  overflow:visible;
  border-radius:12px;
  box-sizing:border-box;
}
.db-trend-canvas .recharts-wrapper,
.db-trend-canvas .recharts-surface{
  background-color:transparent!important;
}
.db-trend-meta{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  margin:0 0 4px;
}
.db-trend-chip{
  display:inline-flex;align-items:center;gap:6px;
  padding:4px 10px;border-radius:999px;
  background:#eef4ff;border:1px solid rgba(30,64,175,0.16);
  color:#1e3a8a;font-size:.66rem;font-weight:700;
  box-shadow:0 2px 8px rgba(30,64,175,0.08);
}
.db-trend-chip-dot{
  width:6px;height:6px;border-radius:50%;background:#2563eb;
}
.db-trend-chip--peak{
  background:linear-gradient(135deg,rgba(37,99,235,0.1),rgba(14,165,233,0.08));
  border-color:rgba(37,99,235,0.28);
  color:#1e3a8a
}

/* ── BOTTOM GRID ── */
.db-bottom-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  align-items:stretch;
  gap:6px
}

.db-stat-card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  padding:10px 12px;
  display:flex;align-items:center;gap:14px;
  min-height:74px;
  height:100%;
  cursor:pointer;
  box-shadow:var(--shadow-sm);
  transition:box-shadow .2s,border-color .2s,transform .2s;
  position:relative;overflow:hidden
}
.db-stat-card::before{
  content:'';
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(26,143,209,0) 60%,rgba(26,143,209,0.025) 100%);
  opacity:0;transition:opacity .2s
}
.db-stat-card:hover::before{opacity:1}
.db-stat-card:hover{
  border-color:rgba(26,143,209,0.3);
  box-shadow:var(--shadow-md);
  transform:translateY(-2px)
}
.db-stat-icon{
  width:44px;height:44px;border-radius:12px;
  background:rgba(26,143,209,0.07);
  border:1px solid rgba(26,143,209,0.13);
  color:var(--blue);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  transition:background .2s,border-color .2s,box-shadow .2s,color .2s
}
.db-stat-card:hover .db-stat-icon{
  background:var(--blue);color:#fff;border-color:var(--blue);
  box-shadow:0 4px 14px rgba(26,143,209,0.35)
}
.db-stat-info{flex:1;min-width:0}
.db-stat-val{
  font-size:1.55rem;font-weight:700;
  color:var(--ink);letter-spacing:-.04em;line-height:1
}
.db-stat-lbl{
  font-family:var(--fb);font-size:.67rem;font-weight:600;
  color:var(--ink4);margin-top:3px;
  text-transform:uppercase;letter-spacing:.07em
}
.db-stat-arrow{
  color:var(--ink4);flex-shrink:0;
  opacity:0.4;transition:opacity .2s,transform .2s,color .2s
}
.db-stat-card:hover .db-stat-arrow{
  opacity:1;color:var(--blue);transform:translateX(3px)
}

/* ── QUICK ACCESS STRIP ── */
.db-quick-strip{
  display:flex;gap:8px;flex-wrap:wrap
}
.db-quick-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:8px 14px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  font-size:.8125rem;font-weight:500;
  color:var(--ink2);cursor:pointer;
  transition:border-color .15s,color .15s,background .15s;
  text-decoration:none
}
.db-quick-btn:hover{
  border-color:var(--ink4);
  background:var(--surface2);
  color:var(--ink)
}
.db-quick-btn svg{opacity:0.8}
.db-quick-btn:hover svg{opacity:1}

/* ── TECHNICIAN WORKBENCH (home) ── */
.db-tech-bench{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
  margin-bottom:10px
}
@media (max-width:640px){.db-tech-bench{grid-template-columns:1fr}}
.db-tech-bench-card{
  display:flex;align-items:flex-start;gap:12px;
  padding:14px 16px;
  text-align:left;
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  background:var(--surface);
  cursor:pointer;
  box-shadow:var(--shadow-sm);
  transition:border-color .15s,box-shadow .15s,transform .15s
}
.db-tech-bench-card:hover{
  border-color:rgba(37,99,235,0.35);
  box-shadow:var(--shadow-md);
  transform:translateY(-1px)
}
.db-tech-bench-card--primary{
  border-color:rgba(37,99,235,0.35);
  background:linear-gradient(135deg,rgba(37,99,235,0.06),rgba(14,165,233,0.05));
  box-shadow:0 4px 18px rgba(37,99,235,0.1)
}
.db-tech-bench-card--primary:hover{
  border-color:#2563eb;
  box-shadow:0 8px 24px rgba(37,99,235,0.14)
}
.db-tech-bench-icon{
  width:42px;height:42px;min-width:42px;
  border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(37,99,235,0.08);
  border:1px solid rgba(37,99,235,0.16);
  color:var(--blue)
}
.db-tech-bench-card--primary .db-tech-bench-icon{
  background:rgba(37,99,235,0.14);
  border-color:rgba(37,99,235,0.28);
  color:#1d4ed8
}
.db-tech-bench-text{display:flex;flex-direction:column;gap:3px;min-width:0}
.db-tech-bench-text strong{font-family:var(--fd);font-size:.9rem;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.db-tech-bench-text span{font-size:.75rem;color:var(--ink3);line-height:1.45}
.shell[data-theme="dark"] .db-tech-bench-card{
  background:#111827;
  border-color:rgba(148,163,184,0.2)
}
.shell[data-theme="dark"] .db-tech-bench-card--primary{
  background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(14,165,233,0.08));
  border-color:rgba(129,140,248,0.35)
}
.shell[data-theme="dark"] .db-tech-bench-text strong{color:#f1f5f9}
.shell[data-theme="dark"] .db-tech-bench-text span{color:#94a3b8}
.shell[data-theme="dark"] .db-tech-bench-icon{
  background:rgba(99,102,241,0.15);
  border-color:rgba(129,140,248,0.3);
  color:#93c5fd
}

/* Technician completion ranking (admin / field-task managers) */
.db-task-rank{
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  background:var(--surface);
  box-shadow:var(--shadow-sm);
  padding:16px 18px 14px;
  margin-bottom:14px
}
.db-task-rank-head{
  display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;
  margin-bottom:12px
}
.db-task-rank-title{font-family:var(--fd);font-size:.95rem;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.db-task-rank-sub{font-size:.75rem;color:var(--ink3)}
.db-task-rank-rows{display:flex;flex-direction:column;gap:8px}
.db-task-rank-row{
  display:grid;
  grid-template-columns:36px 1fr auto;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-radius:10px;
  border:1px solid var(--border);
  background:var(--surface2)
}
.db-task-rank-row--top{
  border-color:rgba(37,99,235,0.28);
  background:linear-gradient(135deg,rgba(37,99,235,0.06),rgba(14,165,233,0.04))
}
.db-task-rank-num{
  font-family:var(--fd);font-weight:800;font-size:.85rem;color:var(--blue);
  text-align:center
}
.db-task-rank-name{font-size:.84rem;font-weight:600;color:var(--ink);min-width:0}
.db-task-rank-email{font-size:.72rem;color:var(--ink3);margin-top:2px;overflow:hidden;text-overflow:ellipsis}
.db-task-rank-count{font-family:var(--fd);font-weight:700;font-size:.9rem;color:var(--ink)}
.db-task-rank-count span{font-size:.68rem;font-weight:600;color:var(--ink3);margin-left:4px}
.db-task-rank-empty{font-size:.8rem;color:var(--ink3);padding:12px;text-align:center}
.shell[data-theme="dark"] .db-task-rank{background:#111827;border-color:rgba(148,163,184,0.2)}
.shell[data-theme="dark"] .db-task-rank-title{color:#f1f5f9}
.shell[data-theme="dark"] .db-task-rank-row{background:#0f172a;border-color:rgba(148,163,184,0.18)}
.shell[data-theme="dark"] .db-task-rank-row--top{
  border-color:rgba(129,140,248,0.35);
  background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(14,165,233,0.06))
}
.db-task-rank-rows--scroll{max-height:min(360px,50vh);overflow-y:auto;padding-right:4px}

/* ── ALERT BANNER (amber/warning) ── */
@keyframes alertPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.25)}
  50%{box-shadow:0 0 0 5px rgba(245,158,11,0)}
}
.dashboard-alert{
  display:flex;align-items:center;gap:14px;
  padding:14px 20px;
  background:rgba(217,119,6,0.06);
  border:1px solid rgba(217,119,6,0.22);
  border-radius:var(--r-lg);
  animation:fadeUp .3s ease
}
.dashboard-alert-icon{
  width:36px;height:36px;border-radius:10px;
  background:rgba(217,119,6,0.12);border:1px solid rgba(217,119,6,0.22);
  color:var(--warning);display:flex;align-items:center;justify-content:center;flex-shrink:0;
  animation:alertPulse 2.5s ease infinite
}
.dashboard-alert-text{
  flex:1;font-size:.81rem;color:var(--ink2);line-height:1.5
}
.dashboard-alert a{color:var(--warning);font-weight:650;text-decoration:none}
.dashboard-alert a:hover{text-decoration:underline}

/* ── SECTION LABEL ── */
.db-section-label{
  font-family:var(--fb);font-size:.62rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.12em;color:var(--ink4);
  display:flex;align-items:center;gap:10px;margin-bottom:-6px
}
.db-section-label::after{content:'';flex:1;height:1px;background:var(--border-lt)}

/* ══════════════════════════════
   CHART TOOLTIP
══════════════════════════════ */
.ct{
  background:#ffffff;
  border:1px solid rgba(30,64,175,0.18);border-radius:12px;
  padding:10px 13px;
  font-family:var(--fb);font-size:12px;color:var(--ink);
  box-shadow:0 10px 28px rgba(30,64,175,0.16)
}
.ct-lbl{color:var(--blue-dk);margin-bottom:4px;font-family:var(--fb);font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.ct--trend .ct-trend-val{font-family:var(--fb);font-size:.8125rem;font-weight:600;color:var(--ink);line-height:1.35}

/* ══════════════════════════════
   INNER PAGES (shared)
══════════════════════════════ */
.tbl-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;margin-bottom:14px;box-shadow:var(--shadow-sm)}
.tbl-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.tabs{display:flex;gap:0;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)}
.tab{padding:8px 16px;border:none;background:transparent;color:var(--ink3);font-size:.8125rem;font-weight:500;cursor:pointer;border-radius:8px;transition:all .15s}
.tab:hover{color:var(--ink2)}
.tab.active{background:var(--surface);color:var(--ink);font-weight:600;box-shadow:0 1px 3px rgba(15,23,42,0.06)}
.tbl-wrap{overflow-x:auto;border-radius:10px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse}
thead tr{background:var(--surface2)}
thead th{padding:10px 14px;text-align:left;font-family:var(--fb);font-size:.6rem;font-weight:600;color:var(--ink4);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border);white-space:nowrap}
.tr{background:var(--surface);transition:background .12s;cursor:pointer}
.tr:hover:not(.sel){background:var(--surface2)}
.tr.sel{background:rgba(26,143,209,.04)}
tbody td{padding:11px 14px;font-family:var(--fb);font-size:.79rem;color:var(--ink);border-bottom:1px solid var(--border-lt);vertical-align:middle}
tbody tr:last-child td{border-bottom:none}
.td-id{font-family:var(--fd);font-weight:600;color:var(--blue);font-size:.74rem}
.nm-cell{display:flex;align-items:center;gap:9px;white-space:nowrap}
.row-av{width:28px;height:28px;border-radius:7px;object-fit:cover;border:1px solid var(--border)}
.td-nm{font-weight:500}
.td-addr{font-size:.71rem;color:var(--ink3);max-width:180px;line-height:1.35}
.td-date{white-space:nowrap;font-size:.71rem;color:var(--ink3)}
.td-price{font-family:var(--fd);font-weight:600;white-space:nowrap}
.sbadge{display:inline-flex;align-items:center;gap:4px;font-family:var(--fb);font-size:.67rem;font-weight:500;padding:3px 9px;border-radius:20px;white-space:nowrap}
.sbadge.p{background:rgba(26,143,209,.09);color:var(--blue-dk)}
.sbadge.d{background:rgba(11,143,99,.09);color:var(--success)}
.sbadge.c{background:rgba(26,143,209,.09);color:var(--blue-dk)}
.sdot{width:4px;height:4px;border-radius:50%;background:currentColor}
.act-cell{display:flex;align-items:center;gap:3px}
.act-btn{width:27px;height:27px;border:none;background:transparent;color:var(--ink4);cursor:pointer;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.act-btn:hover{background:var(--surface2);color:var(--ink)}
.tbl-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:12px}
.showing{font-family:var(--fb);font-size:.71rem;color:var(--ink3)}
.showing strong{color:var(--ink);font-weight:600}
.pagi{display:flex;align-items:center;gap:4px}
.pb{min-width:30px;height:30px;padding:0 6px;border:1px solid var(--border);background:var(--surface);color:var(--ink3);font-family:var(--fd);font-size:.75rem;font-weight:500;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:all .12s}
.pb:hover:not(:disabled){border-color:var(--blue);color:var(--blue)}
.pb:disabled{opacity:.3;cursor:not-allowed}
.pb.cur{background:var(--blue);border-color:var(--blue);color:#fff}
.date-chip{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border:1px solid var(--border);border-radius:7px;font-family:var(--fb);font-size:.71rem;color:var(--ink3);background:var(--surface2)}

/* ══════════════════════════════
   PENDING APPROVALS MODAL
══════════════════════════════ */
.pending-approvals-modal{max-width:560px!important;padding:0!important;border-radius:16px}
.pending-approvals-modal .logout-modal-inner{display:none}
.pam-header{
  display:flex;align-items:center;gap:16px;
  padding:20px 24px;border-bottom:1px solid var(--border-lt)
}
.pam-header-icon{
  width:44px;height:44px;border-radius:12px;
  background:var(--blue);color:#fff;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 4px 12px rgba(26,143,209,0.3)
}
.pam-header-text{flex:1;min-width:0}
.pam-title{font-family:var(--fd);font-size:1.1rem;font-weight:700;color:var(--ink);letter-spacing:-.03em;margin:0 0 3px}
.pam-sub{font-family:var(--fb);font-size:.77rem;color:var(--ink3);margin:0}
.pam-badge{
  flex-shrink:0;min-width:28px;height:28px;padding:0 10px;
  background:var(--blue);color:#fff;border-radius:999px;
  font-family:var(--fd);font-size:.79rem;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 2px 8px rgba(26,143,209,0.3)
}
.pam-close{width:32px;height:32px;border:1px solid var(--border);background:var(--surface2);color:var(--ink3);cursor:pointer;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .14s}
.pam-close:hover{border-color:var(--ink3);color:var(--ink)}
.pam-body{padding:16px 22px 22px;max-height:65vh;overflow-y:auto}
.pam-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.pam-item{
  display:flex;align-items:center;gap:13px;
  padding:13px 14px;
  background:var(--surface2);border:1px solid var(--border-lt);
  border-radius:12px;transition:border-color .16s
}
.pam-item:hover{border-color:rgba(26,143,209,0.2)}
.pam-avatar{
  width:42px;height:42px;border-radius:11px;
  background:rgba(26,143,209,.09);border:1px solid rgba(26,143,209,.16);
  color:var(--blue);font-family:var(--fd);font-size:.98rem;font-weight:700;
  display:flex;align-items:center;justify-content:center;flex-shrink:0
}
.pam-item-info{flex:1;min-width:0}
.pam-item-name{display:block;font-family:var(--fb);font-weight:500;color:var(--ink);font-size:.86rem;margin-bottom:2px}
.pam-item-email{display:block;font-size:.75rem;color:var(--ink3);margin-bottom:6px}
.pam-item-meta{display:flex;flex-wrap:wrap;gap:5px}
.pam-item-dept{font-family:var(--fb);font-size:.64rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--blue-dk);background:rgba(26,143,209,.08);border:1px solid rgba(26,143,209,.14);padding:3px 8px;border-radius:5px}
.pam-item-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;flex-wrap:wrap}
.pam-role-select{
  padding:8px 32px 8px 12px;
  border-radius:8px;
  border:1px solid var(--border);
  background-color:var(--surface);
  font-size:.8125rem;font-weight:500;color:var(--ink);
  cursor:pointer;min-width:120px;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 10px center;
  transition:border-color .15s
}
.pam-role-select:hover{border-color:var(--ink4)}
.pam-role-select:focus{outline:none;border-color:var(--blue)}
.pam-btn{padding:8px 14px;border-radius:7px;font-family:var(--fb);font-size:.78rem;font-weight:500;cursor:pointer;border:none;transition:opacity .14s}
.pam-btn--approve{background:var(--success);color:#fff}
.pam-btn--approve:hover{opacity:.85}
.pam-btn--reject{background:var(--danger);color:#fff}
.pam-btn--reject:hover{opacity:.85}
.pam-empty{padding:30px 22px;text-align:center;color:var(--ink3);font-size:.87rem}

/* ══════════════════════════════
   ANIMATIONS
══════════════════════════════ */
@keyframes fadeUp{
  from{opacity:0;transform:translateY(10px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes fadeIn{
  from{opacity:0}to{opacity:1}
}

.db-hero{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) .04s both}
.kpi-card{animation:fadeUp .38s cubic-bezier(.16,1,.3,1) both}
.kpi-card:nth-child(1){animation-delay:.1s}
.kpi-card:nth-child(2){animation-delay:.15s}
.kpi-card:nth-child(3){animation-delay:.2s}
.kpi-card:nth-child(4){animation-delay:.25s}
.db-two-col{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) .3s both}
.db-bottom-grid .db-stat-card{animation:fadeUp .36s cubic-bezier(.16,1,.3,1) both}
.db-bottom-grid .db-stat-card:nth-child(1){animation-delay:.38s}
.db-bottom-grid .db-stat-card:nth-child(2){animation-delay:.43s}
.db-bottom-grid .db-stat-card:nth-child(3){animation-delay:.48s}
.db-quick-strip{animation:fadeUp .35s cubic-bezier(.16,1,.3,1) .5s both}

/* ══════════════════════════════
   RESPONSIVE
══════════════════════════════ */
@media (max-width: 980px){
  :root{--sw: 264px}
  .tb-menu{display:flex}
  .tb-center{display:none}
  .main{margin-left:0;padding:16px}
  .topbar{margin-bottom:20px;flex-direction:column;align-items:flex-start}
  .page{padding:0}
  .db-two-col{grid-template-columns:1fr}
  .db-bottom-grid{grid-template-columns:1fr}
  .db-upper-grid{grid-template-columns:1fr}
}

@media (max-width: 560px){
  .tb-search{display:none!important}
  .tb-center{display:none}
  .db-hero{padding:20px 18px;flex-direction:column;align-items:flex-start;gap:14px}
  .db-hero-stats{width:100%}
  .db-hero-stat{flex:1;min-width:0;width:100%}
}
`;

/* ─── ICONS ─── */
const Ic = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    {[].concat(d).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  Menu: () => <Ic d={["M4 6h16","M4 12h16","M4 18h16"]} />,
  Dashboard: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  Asset: () => <Ic d={["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.27 6.96 12 12.01 20.73 6.96", "M12 22.08V12"]} />,
  Category: () => <Ic d={["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z", "M12 11v6", "M9 14h6"]} />,
  Location: () => <Ic d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"]} />,
  Assign: () => <Ic d={["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", "M8 2h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z", "M12 11v6", "M9 14h6"]} />,
  Move: () => <Ic d={["M5 12h14", "M12 5l7 7-7 7"]} />,
  Reserve: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Attach: () => <Ic d={["M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"]} />,
  Audit: () => <Ic d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} />,
  Alert: () => <Ic d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"]} />,
  Task: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Comment: () => <Ic d={["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"]} />,
  Deprec: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Maint: () => <Ic d={["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"]} />,
  Notif: () => <Ic d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"]} />,
  User: () => <Ic d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"]} />,
  Search: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Bell: () => <Ic d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"]} />,
  Settings: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  Logout: () => <Ic d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />,
  CDown: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="6 9 12 15 18 9" /></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Eye: () => <Ic size={13} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8", "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"]} />,
  Edit: () => <Ic size={13} d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />,
  Trash: () => <Ic size={13} d={["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]} />,
};

/* ─── NAV CONFIG ─── */
const NAV = [
  { id: "dashboard", label: "Dashboard", IC: I.Dashboard },
  { id: "asset", label: "Assets", IC: I.Asset },
  { id: "asset-category", label: "Categories", IC: I.Category },
  { id: "location", label: "Locations", IC: I.Location },
  { id: "technician-tasks", label: "Technician tasks", IC: I.Task },
  { id: "asset-assignment", label: "Assignments", IC: I.Assign },
  { id: "asset-movement", label: "Movements", IC: I.Move },
  { id: "asset-reservation", label: "Reservations", IC: I.Reserve },
  { id: "field-work-asset-request", label: "Asset Requests", IC: I.Reserve },
  { id: "attachment", label: "Attachments", IC: I.Attach },
  { id: "audit-log", label: "Audit Logs", IC: I.Audit },
  { id: "installation-feedback", label: "Installation feedback", IC: I.Comment },
  { id: "depreciation", label: "Depreciation", IC: I.Deprec },
  { id: "maintenance", label: "Maintenance", IC: I.Maint },
  { id: "notification", label: "Notifications", IC: I.Notif },
  { id: "user-management", label: "User Management", IC: I.User },
];
const NAV_GROUPS = [
  { label: "Overview", ids: ["dashboard"] },
  { label: "Assets & Inventory", ids: ["asset", "asset-category", "location", "technician-tasks", "asset-assignment", "asset-movement", "asset-reservation", "field-work-asset-request", "attachment"] },
  { label: "Security & Compliance", ids: ["audit-log"] },
  { label: "Records & Activity", ids: ["installation-feedback", "depreciation", "maintenance"] },
  { label: "Account", ids: ["notification", "user-management"] },
];
const PAGE_LABELS = {
  dashboard: "Dashboard", asset: "Assets", "asset-category": "Asset Categories",
  location: "Locations", "asset-assignment": "Asset Assignments",
  "asset-movement": "Asset Movements", "asset-reservation": "Asset Reservations",
  "field-work-asset-request": "Field Work Asset Requests",
  attachment: "Attachments", "audit-log": "Audit Logs",
  "installation-feedback": "Installation feedback",
  "technician-tasks": "Technician tasks",
  depreciation: "Depreciation Records", maintenance: "Maintenance Records",
  notification: "Notifications", "user-management": "User Management",
};
const ASSET_STATUS_COLORS = {
  AVAILABLE: "#2563eb",
  IN_USE: "#0d9488",
  UNDER_MAINTENANCE: "#d97706",
  RESERVED: "#7c3aed",
  DISPOSED: "#64748b",
};

function getNavItemsForPermissions(p, currentUser) {
  const isTech = String(currentUser?.role || "").toUpperCase() === "TECHNICIAN";
  return NAV.filter((n) => {
    if (isTech && (n.id === "installation-feedback" || n.id === "technician-tasks")) return true;
    const r = NAV_PERMISSION[n.id];
    return r == null || hasPermission(p, r);
  });
}
function getDashboardCapsFromPermissions(p, currentUser) {
  const c = {};
  const isTech = String(currentUser?.role || "").toUpperCase() === "TECHNICIAN";
  for (const [k, v] of Object.entries(CAP_PERMISSION)) c[k] = v ? hasPermission(p, v) : true;
  c.notifications = true;
  if (isTech) {
    c.comments = true;
    c.technicianTasks = true;
  }
  return c;
}

const BrandIcon = () => (
  <img src={`${process.env.PUBLIC_URL || ''}/logo-w.png`} alt="Fabritrack" width="34" height="34" style={{ objectFit: "contain" }} />
);

const TrendTooltip = ({ active, payload, label, dark }) => {
  if (!active || !payload?.length) return null;
  const c = Number(payload[0]?.value) || 0;
  return (
    <div className={`ct ct--trend ${dark ? "ct--trend-dark" : "ct--trend-light"}`}>
      <div className="ct-lbl">{label}</div>
      <div className="ct-trend-val">
        {c === 0 ? "No assets added this month" : `${c} asset${c !== 1 ? "s" : ""} added`}
      </div>
    </div>
  );
};

/* ─────────────────────────────────
   COMPONENT
───────────────────────────────── */
export default function Dashboard({ user, onLogout }) {
  const [nav, setNav] = useState("dashboard");
  const [openGroups, setOG] = useState({});
  const [sbOpen, setSbOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [umOpen, setUm] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const umRef = useRef(null);
  const notifRef = useRef(null);

  const [notifOpen, setNO] = useState(false);
  const [headerNotifs, setHN] = useState([]);
  const [headerNL, setHNL] = useState(false);
  const [logoutOpen, setLO] = useState(false);
  const [profileUser, setPU] = useState(null);
  const [avatarUrl, setAU] = useState(null);
  const [profileOpen, setPO] = useState(false);
  const [avatarKey, setAK] = useState(0);
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedAsset, setScanned] = useState(null);
  const [scanJson, setScanJson] = useState("");
  const [scanErr, setScanErr] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(null);
  const [pending, setPending] = useState([]);
  const [pendingRoles, setPR] = useState({});
  const [pamOpen, setPAM] = useState(false);
  const trendGradId = useId().replace(/:/g, "");

  const [, setAC] = useState(null); const [, setCC] = useState(null); const [, setLC] = useState(null);
  const [, setAsC] = useState(null); const [, setMvC] = useState(null); const [, setRsC] = useState(null);
  const [, setAtC] = useState(null); const [, setAuC] = useState(null); const [, setCmC] = useState(null);
  const [, setDpC] = useState(null); const [, setMnC] = useState(null); const [, setNtC] = useState(null);

  const loadStats = () => {
    setLoading(true);
    const perms = getEffectivePermissions(user);
    const isTechRole = String(user?.role || "").toUpperCase() === "TECHNICIAN";
    const can = {
      assets: hasPermission(perms, CAP_PERMISSION.assets), categories: hasPermission(perms, CAP_PERMISSION.categories),
      locations: hasPermission(perms, CAP_PERMISSION.locations), assignments: hasPermission(perms, CAP_PERMISSION.assignments),
      movements: hasPermission(perms, CAP_PERMISSION.movements), reservations: hasPermission(perms, CAP_PERMISSION.reservations),
      attachments: hasPermission(perms, CAP_PERMISSION.attachments), auditLogs: hasPermission(perms, CAP_PERMISSION.auditLogs),
      comments: isTechRole || hasPermission(perms, CAP_PERMISSION.comments),
      technicianTasks: isTechRole || hasPermission(perms, CAP_PERMISSION.technicianTasks),
      depreciation: hasPermission(perms, CAP_PERMISSION.depreciation),
      maintenance: hasPermission(perms, CAP_PERMISSION.maintenance), users: hasPermission(perms, CAP_PERMISSION.users),
    };
    const canSeeTechLeaderboard = can.technicianTasks;
    const unreadP = user?.id ? getNotifications({ userId: user.id, unreadOnly: true }) : getNotifications({ unreadOnly: true });
    Promise.all([
      can.assets ? getAssets() : Promise.resolve([]),
      can.categories ? getAssetCategories() : Promise.resolve([]),
      can.locations ? getLocations() : Promise.resolve([]),
      can.assignments ? getAssetAssignments() : Promise.resolve([]),
      can.movements ? getAssetMovements() : Promise.resolve([]),
      can.reservations ? getAssetReservations() : Promise.resolve([]),
      can.attachments ? getAttachments() : Promise.resolve([]),
      can.auditLogs ? getAuditLogs({ page: 0, size: 1 }) : Promise.resolve({ content: [], totalElements: 0 }),
      can.comments ? getLocationInstallationFeedback() : Promise.resolve([]),
      can.technicianTasks ? getTechnicianTasks() : Promise.resolve([]),
      can.depreciation ? getDepreciationRecords() : Promise.resolve([]),
      can.maintenance ? getMaintenanceRecords() : Promise.resolve([]),
      getNotifications(), unreadP,
      can.users ? getUsers() : Promise.resolve([]),
      canSeeTechLeaderboard ? getTechnicianTaskLeaderboard().catch(() => []) : Promise.resolve([]),
    ]).then(([assets, cats, locs, asns, mvs, res, ats, aus, cms, ttasks, dep, mnt, notifs, unr, usrs, techLb]) => {
      const taskList = Array.isArray(ttasks) ? ttasks : [];
      const openTasks = taskList.filter(
        (t) => t && t.status !== "DONE" && t.status !== "CANCELLED"
      ).length;
      setStats({
        assets: assets?.length || 0, categories: cats?.length || 0, locations: locs?.length || 0,
        assignments: asns?.length || 0, movements: mvs?.length || 0, reservations: res?.length || 0,
        attachments: ats?.length || 0, auditLogs: aus?.totalElements ?? aus?.content?.length ?? 0,
        installationFeedback: cms?.length || 0,
        technicianTasksOpen: openTasks,
        depreciation: dep?.length || 0, maintenance: mnt?.length || 0,
        notifications: notifs?.length || 0, users: usrs?.length || 0,
        assetsList: Array.isArray(assets) ? assets : [],
        technicianLeaderboard: canSeeTechLeaderboard && Array.isArray(techLb) ? techLb : [],
      });
      setUnread(unr?.length || 0);
    }).catch(() => setStats(null))
      .finally(() => { setLoading(false); if (can.users) getPendingUsers().then(setPending).catch(() => setPending([])); else setPending([]); });
  };

  useEffect(() => { if (nav === "dashboard") loadStats(); }, [nav]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const refreshUnread = () => {
      getNotifications({ userId: user.id, unreadOnly: true })
        .then((rows) => setUnread(Array.isArray(rows) ? rows.length : 0))
        .catch(() => { });
    };
    refreshUnread();
    const timer = setInterval(refreshUnread, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 980px)");
    if (!mq) return;
    const apply = () => {
      const m = mq.matches;
      setIsMobile(m);
      setSbOpen(!m);
    };
    apply();
    const onChange = () => apply();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  useEffect(() => { if (!umOpen) return; const h = e => { if (umRef.current && !umRef.current.contains(e.target)) setUm(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [umOpen]);
  useEffect(() => { if (!notifOpen) return; const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNO(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [notifOpen]);
  useEffect(() => { if (!user?.id) return; getCurrentUser().then(r => setPU(r?.user ?? null)).catch(() => { }); }, [user?.id]);
  useEffect(() => { if (!user?.id) return; getMyAvatarBlob().then(b => { if (b) setAU(URL.createObjectURL(b)); }).catch(() => { }); return () => setAU(p => { if (p) URL.revokeObjectURL(p); return null; }); }, [user?.id, avatarKey]);

  const loadHeaderNotifs = () => {
    if (!user?.id) { setHN([]); return; } setHNL(true);
    getNotifications({ userId: user.id }).then(l => setHN(Array.isArray(l) ? l.slice(0, 15) : [])).catch(() => setHN([])).finally(() => setHNL(false));
  };
  const handleBell = () => { const n = !notifOpen; setNO(n); if (n) loadHeaderNotifs(); };
  const markRead = id => { markNotificationAsRead(id).then(() => { setHN(p => p.map(n => n.id === id ? { ...n, read: true } : n)); setUnread(c => c > 0 ? c - 1 : 0); }).catch(() => { }); };
  const markAllRead = () => { markAllNotificationsAsRead().then(() => { setHN(p => p.map(n => ({ ...n, read: true }))); setUnread(0); loadStats(); }).catch(() => { }); };
  const confirmLogout = () => { setLO(false); localStorage.removeItem("fabritrack_token"); localStorage.removeItem("fabritrack_user"); sessionStorage.clear(); onLogout?.(); };

  const handleScanView = () => {
    try { const d = JSON.parse(scanJson.trim()); if (d && typeof d === "object") { setScanned(d); setScanErr(""); setScanOpen(false); } else setScanErr("Invalid JSON."); }
    catch { setScanErr("Invalid JSON. Paste the exact text from your QR scanner."); }
  };

  const cu = user || { firstName: "Admin", email: "admin@fabritrack.com" };
  const du = profileUser || cu;
  const fullName = [du.firstName, du.lastName].filter(Boolean).join(" ") || "Admin";
  const roleLabel = du.role ? String(du.role).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : "Administrator";
  const deptLabel = du.department ? String(du.department).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : null;
  const defAvatar = du?.email
    ? `https://i.pravatar.cc/80?u=${encodeURIComponent(du.email)}`
    : "https://i.pravatar.cc/80?u=fabritrack-default";
  const perms = getEffectivePermissions(user || du);
  const navItems = useMemo(() => getNavItemsForPermissions(perms, user || du), [perms, user, du]);
  const navGroups = useMemo(() => {
    const byId = new Map(navItems.map(n => [n.id, n]));
    return NAV_GROUPS.map(g => ({
      label: g.label,
      items: g.ids.map(id => byId.get(id)).filter(Boolean),
    })).filter(g => g.items.length > 0);
  }, [navItems]);
  const allowedIds = useMemo(() => navItems.map(n => n.id), [navItems]);
  const caps = useMemo(() => getDashboardCapsFromPermissions(perms, user || du), [perms, user, du]);

  useEffect(() => {
    const activeGroupLabel = navGroups.find(g =>
      g.items.some(i => i.id === nav)
    )?.label;
    if (activeGroupLabel) {
      setOG(prev => ({ ...prev, [activeGroupLabel]: true }));
    }
  }, [nav, navGroups]);

  const toggleGroup = (label) => {
    setOG(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => { if (allowedIds.length && !allowedIds.includes(nav)) setNav(allowedIds[0]); }, [allowedIds, nav]);

  const assetsList = stats?.assetsList ?? [];
  const pieData = useMemo(() => {
    const m = {};
    assetsList.forEach(a => {
      const s = a.status || "Unknown";
      m[s] = (m[s] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value, color: ASSET_STATUS_COLORS[name] || "#64748b" }))
      .sort((a, b) => b.value - a.value);
  }, [assetsList]);
  const barData = useMemo(() => { const m = {}; assetsList.forEach(a => { const d = a.department || "Unassigned"; m[d] = (m[d] || 0) + 1; }); return Object.entries(m).map(([dept, assets]) => ({ dept, assets })).sort((a, b) => b.assets - a.assets).slice(0, 6); }, [assetsList]);
  const [trendRange, setTrendRange] = useState("yearly");
  const lineChartData = useMemo(() => {
    const bucketCount = trendRange === "monthly" ? 6 : 12;
    const now = new Date();
    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (bucketCount - 1 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        month: d.toLocaleString(undefined, { month: "short" }),
        shortYear: String(d.getFullYear()).slice(-2),
        count: 0,
      };
    });
    const byKey = new Map(buckets.map(b => [b.key, b]));

    assetsList.forEach(a => {
      const rawDate = a?.createdAt || a?.purchaseDate || a?.acquiredAt || a?.updatedAt;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = byKey.get(key);
      if (bucket) bucket.count += 1;
    });

    return buckets.map(b => ({
      month: `${b.month} ${b.shortYear}`,
      count: b.count,
    }));
  }, [assetsList, trendRange]);
  const trendTotal = useMemo(() => lineChartData.reduce((s, p) => s + (p.count || 0), 0), [lineChartData]);
  const trendPeakInfo = useMemo(() => {
    const peak = lineChartData.reduce((m, p) => Math.max(m, p.count || 0), 0);
    if (peak <= 0) return { peak: 0, months: [] };
    const months = lineChartData.filter(p => (p.count || 0) === peak).map(p => p.month);
    return { peak, months };
  }, [lineChartData]);
  const trendPeak = trendPeakInfo.peak;
  const criticalCount = useMemo(() => pieData.find(p => (p.name || "").toUpperCase().includes("MAINTENANCE"))?.value || 0, [pieData]);
  const inUseCount = useMemo(() => pieData.find(p => (p.name || "").toUpperCase().includes("USE") || (p.name || "").toUpperCase().includes("ASSIGNED"))?.value || stats?.assignments || 0, [pieData, stats?.assignments]);
  const reservedCount = useMemo(() => pieData.find(p => (p.name || "").toUpperCase().includes("RESERVED"))?.value || 0, [pieData]);
  const displayAssets = useMemo(() => assetsList.slice(0, 6), [assetsList]);

  // Get first name for greeting
  const firstName = du.firstName || fullName.split(" ")[0] || "Admin";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isTechnician = String(du.role || user?.role || "").toUpperCase() === "TECHNICIAN";

  return (
    <>
      <style>{css}</style>
      <div className={`shell${darkMode ? " shell--dark" : ""}`} data-theme={darkMode ? "dark" : "light"}>

        <div className={`sb-backdrop${isMobile && sbOpen ? " open" : ""}`} onClick={() => setSbOpen(false)} />

        {/* ══ SIDEBAR ══ */}
        <aside
          className="sidebar"
          style={{
            transform: !isMobile || sbOpen ? "translateX(0)" : "translateX(calc(-1 * (var(--sw) + 24px)))",
            transition: "transform .22s cubic-bezier(.16,1,.3,1)",
          }}
          aria-hidden={!sbOpen}
        >
          <div className="sb-brand">
            <div className="sb-brand-icon sb-brand-icon--logo"><BrandIcon /></div>
            <div className="sb-brand-text">
              <div className="sb-brand-name">Fabri<em>track</em></div>
              <div className="sb-brand-sub">Asset Platform</div>
            </div>
          </div>
          <nav className="sb-nav">
            {navGroups.map(group => {
              const isOpen = Boolean(openGroups[group.label]);
              const hasActive = group.items.some(i => i.id === nav);
              return (
                <div
                  key={group.label}
                  className={`sb-nav-group${isOpen ? " open" : ""}${hasActive ? " has-active" : ""}`}
                >
                  <button
                    type="button"
                    className="sb-group-trigger"
                    onClick={() => toggleGroup(group.label)}
                    aria-expanded={isOpen}
                  >
                    <span className="sb-group-trigger-left">
                      <span className="sb-section">{group.label}</span>
                      <span className="sb-group-line" />
                      <span className="sb-group-pill">{group.items.length}</span>
                    </span>
                    <span className="sb-group-chevron">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  <div className="sb-nav-group-body">
                    {group.items.map(({ id, label, IC }) => (
                      <button
                        key={id}
                        type="button"
                        className={`nav-btn${nav === id ? " active" : ""}`}
                        onClick={() => { setNav(id); if (isMobile) setSbOpen(false); }}
                      >
                        <span className="nav-icon-wrap"><IC /></span>
                        <span className="nav-btn-label">{label}</span>
                        {id === "notification" && unread > 0 && (
                          <span className="nav-badge">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="sb-footer">
            <div
              className="sb-profile"
              onClick={() => setPO(true)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setPO(true)}
            >
              <img src={avatarUrl || defAvatar} alt="" className="sb-profile-av" />
              <div className="sb-profile-info">
                <div className="sb-profile-name">{fullName}</div>
                <div className="sb-profile-email">
                  <span className="sb-online-dot" />
                  Online · {roleLabel}
                </div>
              </div>
            </div>
            <div className="sb-theme-toggle">
              <button
                type="button"
                className={`sb-theme-btn${!darkMode ? " active" : ""}`}
                onClick={() => setDarkMode(false)}
              >
                ☀ Light
              </button>
              <button
                type="button"
                className={`sb-theme-btn${darkMode ? " active" : ""}`}
                onClick={() => setDarkMode(true)}
              >
                ☾ Dark
              </button>
            </div>
            <div className="sb-version">Fabritrack · v2.4.1</div>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div className="main">
          <header className="topbar">
            <div className="tb-left">
              <button type="button" className="tb-menu" onClick={() => setSbOpen(o => !o)} aria-label="Toggle menu">
                <I.Menu />
              </button>
              <div className="tb-page-title">{PAGE_LABELS[nav] || "Dashboard"}</div>
            </div>
            <div className="tb-center">
              <div className="tb-search">
                <I.Search />
                <input placeholder={nav === "dashboard" ? "Search Assets…" : "Search…"} value={searchQ} onChange={e => setSearchQ(e.target.value)} aria-label="Search" />
              </div>
            </div>
            <div className="tb-actions">
              {caps.assets && (
                <button type="button" className="tb-add-btn" onClick={() => setNav("asset")}>
                  <I.Plus />
                  <span>Add Asset</span>
                </button>
              )}
              <button type="button" className="ib" onClick={() => { setScanOpen(true); setScanned(null); setScanJson(""); setScanErr(""); }} title="Scan QR data">
                <I.Asset size={18} />
              </button>
              <div className="notif-wrap" ref={notifRef}>
                <button type="button" className="ib" onClick={e => { e.stopPropagation(); handleBell(); }} aria-label="Notifications">
                  <I.Bell />{unread > 0 && <span className="ndot" />}
                </button>
                {notifOpen && (
                  <div className="notif-drop">
                    <div className="notif-drop-head">
                      <h3>Notifications</h3>
                      {headerNotifs.some(n => !n.read) && <button type="button" className="notif-mark-all" onClick={markAllRead}>Mark all read</button>}
                    </div>
                    {headerNL ? <div className="notif-loading">Loading…</div> :
                      headerNotifs.length === 0 ? <div className="notif-empty">No notifications</div> : (
                        <>
                          <div className="notif-list">
                            {headerNotifs.map(n => (
                              <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`} onClick={() => { if (!n.read) markRead(n.id); }}>
                                <span className="notif-item-dot" />
                                <div className="notif-item-body">
                                  <div className="notif-item-title">{n.title || "Notification"}</div>
                                  <div className="notif-item-msg">{n.message || ""}</div>
                                  <div className="notif-item-time">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="notif-footer">
                            <a href="#notification" onClick={e => { e.preventDefault(); setNO(false); setNav("notification"); }}>View all →</a>
                          </div>
                        </>
                      )}
                  </div>
                )}
              </div>
              <div className={`um-wrap${umOpen ? " open" : ""}`} ref={umRef}>
                <button className="um-trigger" onClick={e => { e.stopPropagation(); setUm(o => !o); }}>
                  <img src={avatarUrl || defAvatar} alt="" className="um-av" />
                  <span className="um-name">{fullName}</span>
                  <span className="chevron"><I.CDown /></span>
                </button>
                {umOpen && (
                  <div className="um-drop">
                    <div className="um-head">Signed in as</div>
                    <div className="um-email">{du.email || "admin@fabritrack.com"}</div>
                    <div className="um-meta">
                      <span><strong>Name:</strong> {fullName}</span>
                      {roleLabel && <span><strong>Role:</strong> {roleLabel}</span>}
                      {deptLabel && <span><strong>Dept:</strong> {deptLabel}</span>}
                      {du.phone && <span><strong>Phone:</strong> {du.phone}</span>}
                    </div>
                    <hr className="um-div" />
                    <button type="button" className="um-item" onClick={() => { setUm(false); setPO(true); }}><I.Settings />Profile settings</button>
                    <button type="button" className="um-item um-item--danger" onClick={() => { setUm(false); setLO(true); }}><I.Logout />Sign out</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className={`page${nav === "dashboard" ? " page--dashboard" : ""}`}>
            {nav === "dashboard" ? (
              <div className="dashboard-home">

                {isTechnician && (
                  <>
                    <div className="db-section-label" style={{ marginTop: 2 }}>Technician</div>
                    <div className="db-tech-bench">
                      <button type="button" className="db-tech-bench-card db-tech-bench-card--primary" onClick={() => setNav("installation-feedback")}>
                        <div className="db-tech-bench-icon"><I.Comment size={20} /></div>
                        <div className="db-tech-bench-text">
                          <strong>Installation feedback</strong>
                          <span>Post-install notes per location{!loading && stats?.installationFeedback != null ? ` · ${stats.installationFeedback} recorded` : ""}</span>
                        </div>
                      </button>
                      {caps.technicianTasks && (
                        <button type="button" className="db-tech-bench-card" onClick={() => setNav("technician-tasks")}>
                          <div className="db-tech-bench-icon"><I.Task /></div>
                          <div className="db-tech-bench-text">
                            <strong>My tasks</strong>
                            <span>Add tasks, update status on your assignments{!loading && stats?.technicianTasksOpen != null ? ` · ${stats.technicianTasksOpen} open` : ""}</span>
                          </div>
                        </button>
                      )}
                      {caps.locations && (
                        <button type="button" className="db-tech-bench-card" onClick={() => setNav("location")}>
                          <div className="db-tech-bench-icon"><I.Location size={20} /></div>
                          <div className="db-tech-bench-text">
                            <strong>Locations</strong>
                            <span>View and update location and installation details</span>
                          </div>
                        </button>
                      )}
                      {caps.assets && (
                        <button type="button" className="db-tech-bench-card" onClick={() => setNav("asset")}>
                          <div className="db-tech-bench-icon"><I.Asset size={20} /></div>
                          <div className="db-tech-bench-text">
                            <strong>Assets</strong>
                            <span>Browse assets (read-only if you cannot edit)</span>
                          </div>
                        </button>
                      )}
                      <button type="button" className="db-tech-bench-card" onClick={() => setNav("notification")}>
                        <div className="db-tech-bench-icon"><I.Notif size={20} /></div>
                        <div className="db-tech-bench-text">
                          <strong>Notifications</strong>
                          <span>Alerts and messages for your account</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {/* ── STAT CARDS (healthcare design) ── */}
                <div className="db-stats-row">
                  {caps.assets && (
                    <div className="stat-card">
                      <div className="stat-card-val">{loading ? "—" : (stats?.assets ?? 0).toLocaleString()}</div>
                      <div className="stat-card-lbl">Total Assets</div>
                      <span className="stat-card-badge green">+{stats?.assets ? Math.min(20, Math.max(5, Math.floor(stats.assets / 50))) : 0}%</span>
                      <div className="stat-card-icon"><I.Asset size={18} /></div>
                    </div>
                  )}
                  {caps.assets && (
                    <div className="stat-card">
                      <div className="stat-card-val"><span className="stat-dot red" />{loading ? "—" : criticalCount}</div>
                      <div className="stat-card-lbl">Critical</div>
                      <span className="stat-card-badge green">+10%</span>
                      <div className="stat-card-icon"><I.Alert size={18} /></div>
                    </div>
                  )}
                  {caps.assignments && (
                    <div className="stat-card">
                      <div className="stat-card-val"><span className="stat-dot blue" />{loading ? "—" : inUseCount}</div>
                      <div className="stat-card-lbl">Assigned</div>
                      <span className="stat-card-badge orange">-4%</span>
                      <div className="stat-card-icon"><I.Assign size={18} /></div>
                    </div>
                  )}
                  {caps.assets && (
                    <div className="stat-card">
                      <div className="stat-card-val"><span className="stat-dot blue" />{loading ? "—" : reservedCount}</div>
                      <div className="stat-card-lbl">Reserved</div>
                      <span className="stat-card-badge red">-5%</span>
                      <div className="stat-card-icon"><I.Reserve size={18} /></div>
                    </div>
                  )}
                </div>

                {/* ── UPPER GRID: Pie + Line Chart ── */}
                {caps.assets && (
                  <div className="db-upper-grid">
                    <div className="db-chart-card">
                      <div className="db-chart-header">
                        <div className="db-chart-header-icon"><I.Asset size={15} /></div>
                        <div>
                          <div className="db-chart-title">Asset Status</div>
                          <div className="db-chart-sub">By lifecycle state</div>
                        </div>
                      </div>
                      <div className="db-pie-wrap">
                        <div className="db-pie-visual">
                          <ResponsiveContainer width="100%" height={200} minWidth={0}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius="48%"
                                outerRadius="78%"
                                dataKey="value"
                                strokeWidth={2.5}
                                stroke={darkMode ? "#111827" : "#ffffff"}
                                paddingAngle={pieData.length > 1 ? 2.5 : 0}
                              >
                                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  background: darkMode ? "#1e293b" : "#fff",
                                  border: darkMode ? "1px solid rgba(148,163,184,0.35)" : "1px solid #dde6ef",
                                  borderRadius: 12,
                                  fontFamily: "'DM Sans',sans-serif",
                                  fontSize: 12,
                                  boxShadow: "0 8px 24px rgba(11,30,45,.14)",
                                }}
                                formatter={(v, n) => {
                                  const t = pieData.reduce((s, e) => s + e.value, 0);
                                  const p = t ? ((v / t) * 100).toFixed(0) : 0;
                                  return [`${v} (${p}%)`, (n || "").replace(/_/g, " ")];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="db-pie-center" aria-hidden>
                            <div className="db-pie-center-val">{loading ? "—" : (stats?.assets ?? "—")}</div>
                            <div className="db-pie-center-lbl">total</div>
                          </div>
                        </div>
                        <div className="db-pie-legend">
                          {pieData.length ? pieData.slice(0, 5).map(({ name, value, color }) => {
                            const t = pieData.reduce((s, e) => s + e.value, 0); const p = t ? ((value / t) * 100).toFixed(0) : 0;
                            return (
                              <div className="db-pie-leg-row" key={name}>
                                <span className="db-pie-leg-dot" style={{ background: color }} />
                                <span className="db-pie-leg-name">{name.replace(/_/g, " ")}</span>
                                <span className="db-pie-leg-count">{value}</span>
                                <span className="db-pie-leg-pct">{p}%</span>
                              </div>
                            );
                          }) : <span style={{ fontSize: ".75rem", color: "var(--ink4)" }}>No data</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`db-chart-card chart-status ${darkMode ? "chart-status--dark" : "chart-status--light"}`}>
                      <div className="db-chart-header">
                        <div className="db-chart-header-icon"><I.Asset size={15} /></div>
                        <div>
                          <div className="db-chart-title">Asset Intake Trend</div>
                          <div className="db-chart-sub">Monthly additions</div>
                        </div>
                        <select className="db-chart-header-select" value={trendRange} onChange={e => setTrendRange(e.target.value)}>
                          <option value="yearly">12 Months</option>
                          <option value="monthly">6 Months</option>
                        </select>
                      </div>
                      <div className={`db-bar-wrap db-bar-wrap--trend ${darkMode ? "db-bar-wrap--trend-dark" : "db-bar-wrap--trend-light"}`}>
                        <div className={`db-trend-meta ${darkMode ? "db-trend-meta--dark" : "db-trend-meta--light"}`}>
                          <span className="db-trend-chip"><span className="db-trend-chip-dot" aria-hidden />Assets added: {trendTotal}</span>
                          <span className="db-trend-chip db-trend-chip--peak" title={trendPeak > 0 ? `${trendPeak} in ${trendPeakInfo.months.join(", ")}` : ""}>
                            {trendPeak <= 0
                              ? "Peak: no data in range"
                              : trendPeakInfo.months.length === 1
                                ? `Peak: ${trendPeakInfo.months[0]} (${trendPeak} added)`
                                : `Peak: ${trendPeakInfo.months.join(" · ")} (${trendPeak} each)`}
                          </span>
                        </div>
                        {lineChartData.length > 0 ? (
                          <div className={`db-trend-canvas ${darkMode ? "db-trend-canvas--dark" : "db-trend-canvas--light"}`}>
                            <ResponsiveContainer width="100%" height={216} minWidth={0}>
                              <BarChart data={lineChartData} margin={{ top: 8, right: 10, left: 8, bottom: 4 }} barCategoryGap="18%" style={{ background: "transparent" }}>
                                <defs>
                                  <linearGradient id={trendGradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="55%" stopColor="#2563eb" />
                                    <stop offset="100%" stopColor="#1e40af" />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 5" stroke={darkMode ? "rgba(148,163,184,0.2)" : "rgba(37,99,235,0.12)"} vertical={false} />
                                <XAxis
                                  dataKey="month"
                                  interval={0}
                                  tick={{ fill: darkMode ? "#94a3b8" : "#334155", fontSize: 10, fontWeight: 600 }}
                                  axisLine={false}
                                  tickLine={false}
                                  angle={-34}
                                  textAnchor="end"
                                  height={54}
                                  tickMargin={4}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  width={44}
                                  tickMargin={8}
                                  tick={{ fill: darkMode ? "#94a3b8" : "#475569", fontSize: 11, fontWeight: 600, textAnchor: "end" }}
                                  axisLine={false}
                                  tickLine={false}
                                  domain={[0, (max) => (max <= 0 ? 1 : max + Math.max(1, Math.ceil(max * 0.15)))]}
                                />
                                <Tooltip
                                  content={(props) => <TrendTooltip {...props} dark={darkMode} />}
                                  cursor={{ fill: darkMode ? "rgba(99,102,241,0.12)" : "rgba(37,99,235,0.06)" }}
                                />
                                <Bar dataKey="count" name="Added" radius={[8, 8, 2, 2]} maxBarSize={40} animationDuration={700}>
                                  {lineChartData.map((e, i) => (
                                    <Cell
                                      key={i}
                                      fill={e.count > 0 ? `url(#${trendGradId})` : "transparent"}
                                      stroke={e.count > 0 ? (darkMode ? "rgba(129,140,248,0.45)" : "rgba(37,99,235,0.22)") : "none"}
                                      strokeWidth={e.count > 0 ? 1 : 0}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink4)", fontSize: ".82rem" }}>No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── QUICK STATS ── */}
                {(caps.categories || caps.locations || caps.maintenance || caps.comments || caps.technicianTasks) && (
                  <>
                    <div className="db-section-label">Quick stats</div>
                    <div className="db-bottom-grid">
                      {caps.categories && (
                        <div className="db-stat-card" role="button" tabIndex={0} onClick={() => setNav("asset-category")} onKeyDown={e => e.key === "Enter" && setNav("asset-category")}>
                          <div className="db-stat-icon"><I.Category size={18} /></div>
                          <div className="db-stat-info">
                            <div className="db-stat-val">{loading ? "—" : (stats?.categories ?? "—")}</div>
                            <div className="db-stat-lbl">Categories</div>
                          </div>
                          <span className="db-stat-arrow"><Ic d="M9 18l6-6-6-6" size={15} /></span>
                        </div>
                      )}
                      {caps.locations && (
                        <div className="db-stat-card" role="button" tabIndex={0} onClick={() => setNav("location")} onKeyDown={e => e.key === "Enter" && setNav("location")}>
                          <div className="db-stat-icon"><I.Location size={18} /></div>
                          <div className="db-stat-info">
                            <div className="db-stat-val">{loading ? "—" : (stats?.locations ?? "—")}</div>
                            <div className="db-stat-lbl">Locations</div>
                          </div>
                          <span className="db-stat-arrow"><Ic d="M9 18l6-6-6-6" size={15} /></span>
                        </div>
                      )}
                      {caps.maintenance && (
                        <div className="db-stat-card" role="button" tabIndex={0} onClick={() => setNav("maintenance")} onKeyDown={e => e.key === "Enter" && setNav("maintenance")}>
                          <div className="db-stat-icon"><I.Maint size={18} /></div>
                          <div className="db-stat-info">
                            <div className="db-stat-val">{loading ? "—" : (stats?.maintenance ?? "—")}</div>
                            <div className="db-stat-lbl">Maintenance</div>
                          </div>
                          <span className="db-stat-arrow"><Ic d="M9 18l6-6-6-6" size={15} /></span>
                        </div>
                      )}
                      {caps.comments && (
                        <div className="db-stat-card" role="button" tabIndex={0} onClick={() => setNav("installation-feedback")} onKeyDown={e => e.key === "Enter" && setNav("installation-feedback")}>
                          <div className="db-stat-icon"><I.Comment size={18} /></div>
                          <div className="db-stat-info">
                            <div className="db-stat-val">{loading ? "—" : (stats?.installationFeedback ?? "—")}</div>
                            <div className="db-stat-lbl">Installation feedback</div>
                          </div>
                          <span className="db-stat-arrow"><Ic d="M9 18l6-6-6-6" size={15} /></span>
                        </div>
                      )}
                      {caps.technicianTasks && (
                        <div className="db-stat-card" role="button" tabIndex={0} onClick={() => setNav("technician-tasks")} onKeyDown={e => e.key === "Enter" && setNav("technician-tasks")}>
                          <div className="db-stat-icon"><I.Task /></div>
                          <div className="db-stat-info">
                            <div className="db-stat-val">{loading ? "—" : (stats?.technicianTasksOpen ?? "—")}</div>
                            <div className="db-stat-lbl">Open tasks</div>
                          </div>
                          <span className="db-stat-arrow"><Ic d="M9 18l6-6-6-6" size={15} /></span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {caps.technicianTasks && (
                  <>
                    <div className="db-section-label">Technician performance</div>
                    <div className="db-task-rank">
                      <div className="db-task-rank-head">
                        <div>
                          <div className="db-task-rank-title">Completed tasks ranking</div>
                        </div>
                        <button type="button" className="db-quick-btn" style={{ margin: 0 }} onClick={() => setNav("technician-tasks")}>
                          <I.Task /> Open tasks
                        </button>
                      </div>
                      {loading ? (
                        <div className="db-task-rank-empty">Loading…</div>
                      ) : (stats?.technicianLeaderboard?.length ?? 0) === 0 ? (
                        <div className="db-task-rank-empty">No completed tasks yet.</div>
                      ) : (
                        <div className="db-task-rank-rows db-task-rank-rows--scroll">
                          {stats.technicianLeaderboard.map((row, i) => {
                            const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email || "—";
                            return (
                              <div
                                key={row.userId ?? row.email ?? i}
                                className={`db-task-rank-row${i === 0 ? " db-task-rank-row--top" : ""}`}
                              >
                                <div className="db-task-rank-num">{i + 1}</div>
                                <div className="db-task-rank-name" style={{ minWidth: 0 }}>
                                  {name}
                                  {row.email && (
                                    <div className="db-task-rank-email">{row.email}</div>
                                  )}
                                </div>
                                <div className="db-task-rank-count">
                                  {row.completedCount ?? 0}
                                  <span>done</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── QUICK ACCESS ── */}
                <div className="db-section-label">Quick access</div>
                <div className="db-quick-strip">
                  {caps.assets && <button type="button" className="db-quick-btn" onClick={() => setNav("asset")}><I.Asset size={14} />Assets</button>}
                  {caps.assignments && <button type="button" className="db-quick-btn" onClick={() => setNav("asset-assignment")}><I.Assign size={14} />Assignments</button>}
                  {caps.movements && <button type="button" className="db-quick-btn" onClick={() => setNav("asset-movement")}><I.Move size={14} />Movements</button>}
                  {caps.comments && <button type="button" className="db-quick-btn" onClick={() => setNav("installation-feedback")}><I.Comment size={14} />Installation feedback</button>}
                  {caps.technicianTasks && <button type="button" className="db-quick-btn" onClick={() => setNav("technician-tasks")}><I.Task />Technician tasks</button>}
                  <button type="button" className="db-quick-btn" onClick={() => setNav("notification")}><I.Notif size={14} />Notifications</button>
                  {caps.auditLogs && <button type="button" className="db-quick-btn" onClick={() => setNav("audit-log")}><I.Audit size={14} />Audit logs</button>}
                </div>

                {/* ── PENDING ALERT ── */}
                {caps.users && pending.length > 0 && (
                  <div className="dashboard-alert">
                    <div className="dashboard-alert-icon"><I.User size={17} /></div>
                    <div className="dashboard-alert-text">
                      <strong>{pending.length}</strong> user{pending.length !== 1 ? "s" : ""} awaiting approval —{" "}
                      <a href="#pending" onClick={e => { e.preventDefault(); setPAM(true); }}>Review now →</a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {nav === "asset" && <AssetPage user={user} searchQuery={searchQ} onAssetsChange={l => setAC(l?.length ?? null)} readOnly={!hasPermission(getEffectivePermissions(user), "ASSET_WRITE")} darkMode={darkMode} />}
                {nav === "asset-category" && <AssetCategoryPage user={user} searchQuery={searchQ} onCategoriesChange={l => setCC(l?.length ?? null)} />}
                {nav === "location" && <LocationPage user={user} searchQuery={searchQ} onLocationsChange={l => setLC(l?.length ?? null)} />}
                {nav === "technician-tasks" && <TechnicianTaskPage user={user} searchQuery={searchQ} onDataChange={() => loadStats()} />}
                {nav === "asset-assignment" && <AssetAssignmentPage user={user} searchQuery={searchQ} onAssignmentsChange={l => setAsC(l?.length ?? null)} />}
                {nav === "asset-movement" && <AssetMovementPage user={user} searchQuery={searchQ} onDataChange={l => setMvC(l?.length ?? null)} />}
                {nav === "asset-reservation" && <AssetReservationPage user={user} searchQuery={searchQ} onDataChange={l => setRsC(l?.length ?? null)} onReservationUpdated={loadHeaderNotifs} />}
                {nav === "field-work-asset-request" && <FieldWorkAssetRequestPage user={user} searchQuery={searchQ} onDataChange={() => { }} onRequestUpdated={loadHeaderNotifs} />}
                {nav === "attachment" && <AttachmentPage user={user} searchQuery={searchQ} onDataChange={l => setAtC(l?.length ?? null)} />}
                {nav === "audit-log" && <AuditLogPage user={user} onDataChange={l => setAuC(l?.length ?? null)} darkMode={darkMode} />}
                {nav === "installation-feedback" && <LocationInstallationFeedbackPage user={user} searchQuery={searchQ} onDataChange={l => setCmC(l?.length ?? null)} />}
                {nav === "depreciation" && <DepreciationRecordPage user={user} searchQuery={searchQ} onDataChange={l => setDpC(l?.length ?? null)} />}
                {nav === "maintenance" && <MaintenanceRecordPage user={user} searchQuery={searchQ} onDataChange={l => setMnC(l?.length ?? null)} />}
                {nav === "notification" && <NotificationPage user={user} searchQuery={searchQ} onDataChange={l => { setNtC(l?.length ?? null); setUnread(l ? l.filter(n => !n.isRead).length : null); }} />}
                {nav === "user-management" && <UserManagementPage user={user} searchQuery={searchQ} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      {logoutOpen && (
        <div className="logout-modal-overlay" onClick={() => setLO(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-inner">
              <div className="logout-modal-icon"><I.Logout size={20} /></div>
              <h2>Sign out?</h2>
              <p>You'll need to sign in again to access your dashboard.</p>
              <div className="logout-modal-actions">
                <button type="button" className="logout-modal-btn-no" onClick={() => setLO(false)}>Cancel</button>
                <button type="button" className="logout-modal-btn-yes" onClick={confirmLogout}>Sign out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending approvals */}
      {pamOpen && (
        <div className="logout-modal-overlay" onClick={() => setPAM(false)}>
          <div className="logout-modal pending-approvals-modal" onClick={e => e.stopPropagation()}>
            <header className="pam-header">
              <div className="pam-header-icon"><I.User /></div>
              <div className="pam-header-text">
                <h2 className="pam-title">Pending approvals</h2>
                <p className="pam-sub">Approve or reject new user sign-ups</p>
              </div>
              <span className="pam-badge">{pending.length}</span>
              <button type="button" className="pam-close" aria-label="Close" onClick={() => setPAM(false)}>✕</button>
            </header>
            <div className="pam-body">
              <ul className="pam-list">
                {pending.map(u => {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "User";
                  return (
                    <li key={u.id} className="pam-item">
                      <div className="pam-avatar">{(name.charAt(0) || "?").toUpperCase()}</div>
                      <div className="pam-item-info">
                        <span className="pam-item-name">{name}</span>
                        <span className="pam-item-email">{u.email}</span>
                        {u.department && <div className="pam-item-meta"><span className="pam-item-dept">{String(u.department).replace(/_/g, " ")}</span></div>}
                      </div>
                      <div className="pam-item-actions">
                        <select className="pam-role-select" value={pendingRoles[u.id] || "IT"} onChange={e => setPR(p => ({ ...p, [u.id]: e.target.value }))} aria-label="Assign role">
                          <option value="ADMIN">Admin</option><option value="IT">IT</option>
                          <option value="TECHNICIAN">Technician</option>
                          <option value="FINANCE">Finance</option><option value="SECURITY">Security</option>
                        </select>
                        <button type="button" className="pam-btn pam-btn--approve"
                          onClick={() => approveUser(u.id, { role: pendingRoles[u.id] || "IT" })
                            .then(() => { setPR(p => { const n = { ...p }; delete n[u.id]; return n; }); return getPendingUsers(); })
                            .then(l => { setPending(l || []); loadStats(); if (!(l?.length)) setPAM(false); })
                            .catch(() => setPending([]))}>Approve</button>
                        <button type="button" className="pam-btn pam-btn--reject"
                          onClick={() => rejectUser(u.id).then(() => getPendingUsers())
                            .then(l => { setPending(l || []); loadStats(); if (!(l?.length)) setPAM(false); })
                            .catch(() => setPending([]))}>Reject</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Profile */}
      {profileOpen && (
        <ProfileModal user={du} currentAvatarUrl={avatarUrl} defaultAvatar={defAvatar}
          onClose={() => setPO(false)}
          onSave={updated => { setPU(updated); setUm(false); }}
          onAvatarChange={() => setAK(k => k + 1)} />
      )}

      {/* Paste scan */}
      {scanOpen && !scannedAsset && (
        <div className="logout-modal-overlay" onClick={() => setScanOpen(false)}>
          <div className="paste-scan-modal" onClick={e => e.stopPropagation()}>
            <div className="paste-scan-modal-header">
              <h2>View scanned data</h2>
              <button type="button" className="paste-scan-close" aria-label="Close" onClick={() => setScanOpen(false)}>✕</button>
            </div>
            <div className="paste-scan-modal-body">
              <p className="paste-scan-hint">Paste the JSON text from your QR scanner to view asset details.</p>
              <textarea className="paste-scan-input" placeholder="Paste JSON here…" value={scanJson} onChange={e => { setScanJson(e.target.value); setScanErr(""); }} rows={5} />
              {scanErr && <p className="paste-scan-error">{scanErr}</p>}
              <div className="paste-scan-actions">
                <button type="button" className="logout-modal-btn-no" onClick={() => setScanOpen(false)}>Cancel</button>
                <button type="button" className="logout-modal-btn-yes" onClick={handleScanView}>View asset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {scannedAsset && <AssetScanView asset={scannedAsset} onClose={() => setScanned(null)} />}
    </>
  );
}