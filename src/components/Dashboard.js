import { useState, useRef, useEffect, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  getAssets, getAssetCategories, getLocations, getAssetAssignments,
  getAssetMovements, getAssetReservations, getAttachments, getAuditLogs,
  getComments, getDepreciationRecords, getMaintenanceRecords, getNotifications,
  getUsers, getPendingUsers, approveUser, rejectUser,
  markNotificationAsRead, markAllNotificationsAsRead,
} from "../services/api";
import { hasPermission, NAV_PERMISSION, CAP_PERMISSION, getEffectivePermissions } from "../constants/permissions";
import AssetPage from "./AssetPage";
import AssetCategoryPage from "./AssetCategoryPage";
import LocationPage from "./LocationPage";
import AssetAssignmentPage from "./AssetAssignmentPage";
import AssetMovementPage from "./AssetMovementPage";
import AssetReservationPage from "./AssetReservationPage";
import AttachmentPage from "./AttachmentPage";
import AuditLogPage from "./AuditLogPage";
import AnomalyAlertPage from "./AnomalyAlertPage";
import CommentPage from "./CommentPage";
import DepreciationRecordPage from "./DepreciationRecordPage";
import MaintenanceRecordPage from "./MaintenanceRecordPage";
import NotificationPage from "./NotificationPage";
import AssetScanView from "./AssetScanView";
import { getCurrentUser, getMyAvatarBlob } from "../services/userService";
import ProfileModal from "./ProfileModal";
import UserManagementPage from "./UserManagementPage";
import EmployeePage from "./EmployeePage";

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM — "Industrial Precision"
   Syne  → display, numbers, headings (geometric, editorial)
   DM Sans → body, labels, UI text (humanist, legible)
   Colors: brand blues preserved exactly
───────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  /* Brand blues — unchanged */
  --blue:       #1a8fd1;
  --blue-lt:    #3db8f5;
  --blue-dk:    #0e6fa8;
  --blue-deep:  #0d5f96;
  --blue-deeper:#0a4a78;

  /* Sidebar — professional deep navy */
  --sb-bg:      #0b2236;
  --sb-bg2:     #0b2236;
  --sb-line:    rgba(255,255,255,0.07);
  --sb-text:    rgba(255,255,255,0.94);
  --sb-hi:      rgba(255,255,255,0.98);
  --sb-hover:   rgba(255,255,255,0.055);
  --sb-active:  rgba(26,143,209,0.16);
  --sw:         232px;

  /* Content */
  --bg:         #f1f5f9;
  --surface:    #ffffff;
  --surface2:   #f8fafc;
  --border:     #dde6ef;
  --border-lt:  #eaf1f7;

  /* Text */
  --ink:        #0c1f2e;
  --ink2:       #3a566b;
  --ink3:       #6b8699;
  --ink4:       #a0b8c5;

  /* Status */
  --success:    #0b8f63;
  --danger:     #c0392b;

  /* Typography */
  --fd: 'Syne', sans-serif;
  --fb: 'DM Sans', sans-serif;

  --r:    10px;
  --r-lg: 13px;
}

body{
  font-family:var(--fb);
  background:var(--bg);
  color:var(--ink);
  min-height:100vh;
  -webkit-font-smoothing:antialiased;
}

::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

.shell{display:flex;min-height:100vh}

/* ══════════════════════════════
   SIDEBAR
══════════════════════════════ */
.sidebar{
  position:fixed;top:0;left:0;bottom:0;width:var(--sw);
  background:var(--sb-bg);
  border-right:1px solid var(--sb-line);
  display:flex;flex-direction:column;
  z-index:100;overflow:hidden;
}
/* top accent line */
.sidebar::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--blue) 35%,var(--blue-lt) 65%,transparent);
  opacity:.65;z-index:2
}

.sb-brand{
  padding:22px 18px 19px;
  display:flex;align-items:center;gap:11px;
  border-bottom:1px solid var(--sb-line);
  position:relative;z-index:1;
}
.sb-brand-icon{
  width:36px;height:36px;border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;overflow:hidden;
  background:rgba(26,143,209,0.16);
  border:1px solid rgba(26,143,209,0.28);
}
.sb-brand-icon--logo{background:transparent;border:none}
.sb-brand-icon img{width:100%;height:100%;object-fit:contain}
.sb-brand-text{min-width:0}
.sb-brand-name{
  font-family:var(--fd);
  font-size:1.05rem;font-weight:700;
  color:#fff;letter-spacing:-.02em;line-height:1.1
}
.sb-brand-name em{font-style:normal;color:var(--blue-lt)}
.sb-brand-sub{
  font-family:var(--fb);
  font-size:.6rem;font-weight:400;
  color:rgba(255,255,255,.78);
  text-transform:uppercase;letter-spacing:.09em;margin-top:2px
}

.sb-nav{
  flex:1;min-height:0;
  padding:14px 10px 12px;
  display:flex;flex-direction:column;
  overflow-y:auto;gap:1px
}
.sb-nav::-webkit-scrollbar{width:0}

.sb-nav-group{margin-bottom:3px}

.sb-group-trigger{
  display:flex;align-items:center;justify-content:space-between;
  width:100%;border:none;cursor:pointer;
  background:transparent;padding:5px 8px 5px 10px;
  border-radius:6px;transition:background .15s
}
.sb-group-trigger:hover{background:var(--sb-hover)}

.sb-section{
  font-family:var(--fb);
  font-size:.575rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.14em;
  color:rgba(255,255,255,.82)
}
.sb-group-chevron{
  color:rgba(255,255,255,.78);
  transition:transform .22s ease;
  display:flex;align-items:center
}
.sb-nav-group.open .sb-group-chevron{transform:rotate(180deg)}

.sb-nav-group-list-wrap{
  max-height:0;overflow:hidden;
  transition:max-height .28s cubic-bezier(.4,0,.2,1)
}
.sb-nav-group-list{
  display:flex;flex-direction:column;
  padding:3px 0 6px
}

.nav-btn{
  display:flex;align-items:center;gap:9px;
  padding:8px 10px;border:none;background:transparent;
  color:var(--sb-text);
  font-family:var(--fb);font-size:.815rem;font-weight:400;
  cursor:pointer;text-align:left;width:100%;
  border-radius:7px;transition:color .15s,background .15s;
  position:relative
}
.nav-btn:hover{color:var(--sb-hi);background:var(--sb-hover)}
.nav-btn.active{
  color:#fff;background:var(--sb-active);font-weight:500
}
.nav-btn.active::after{
  content:'';position:absolute;
  left:0;top:50%;transform:translateY(-50%);
  width:3px;height:18px;
  background:var(--blue-lt);
  border-radius:0 3px 3px 0
}
.nav-btn svg{flex-shrink:0;opacity:.7;transition:opacity .15s}
.nav-btn:hover svg{opacity:.9}
.nav-btn.active svg{opacity:1;color:var(--blue-lt)}

.nav-badge{
  margin-left:auto;
  font-family:var(--fd);
  font-size:.6rem;font-weight:700;
  background:var(--blue);color:#fff;
  padding:1px 7px;border-radius:20px;line-height:1.7
}

.sb-footer{padding:10px;border-top:1px solid var(--sb-line)}

.sb-user{
  display:flex;align-items:center;gap:10px;
  padding:10px 11px;
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.08);
  border-radius:9px;cursor:pointer;
  transition:background .16s,border-color .16s
}
.sb-user:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.13)}
.sb-user-av{
  width:30px;height:30px;border-radius:7px;
  object-fit:cover;flex-shrink:0;
  border:1px solid rgba(255,255,255,.14)
}
.sb-user-info{flex:1;min-width:0}
.sb-user-name{
  font-family:var(--fb);font-size:.8rem;font-weight:500;
  color:rgba(255,255,255,.88);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
.sb-user-role{font-size:.64rem;color:rgba(255,255,255,.86);margin-top:1px}
.sb-user-cog{
  color:rgba(255,255,255,.24);flex-shrink:0;
  transition:color .15s,transform .35s
}
.sb-user:hover .sb-user-cog{color:rgba(255,255,255,.55);transform:rotate(60deg)}

/* ══════════════════════════════
   MAIN
══════════════════════════════ */
.main{
  flex:1;margin-left:var(--sw);
  display:flex;flex-direction:column;
  min-height:100vh
}

/* ── TOPBAR ── */
.topbar{
  position:sticky;top:0;z-index:50;
  background:rgba(241,245,249,.92);
  backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);
  padding:0 28px;height:58px;
  display:flex;align-items:center;justify-content:space-between;gap:16px
}

.tb-left{display:flex;flex-direction:column;gap:2px}
.tb-page-title{
  font-family:var(--fd);
  font-size:1.05rem;font-weight:600;
  color:var(--ink);letter-spacing:-.03em;line-height:1
}
.tb-crumb{
  font-family:var(--fb);font-size:.66rem;
  color:var(--ink4);display:flex;align-items:center;gap:5px
}
.tb-crumb-home{color:var(--blue)}
.tb-crumb-sep{color:var(--border);font-size:.75rem}

.tb-actions{display:flex;align-items:center;gap:7px}

.tb-search{
  display:flex;align-items:center;gap:7px;
  padding:0 12px;height:36px;
  background:var(--surface);
  border:1px solid var(--border);border-radius:8px;
  transition:border-color .18s,box-shadow .18s
}
.tb-search:focus-within{
  border-color:var(--blue);
  box-shadow:0 0 0 3px rgba(26,143,209,.1)
}
.tb-search input{
  background:transparent;border:none;outline:none;
  font-family:var(--fb);font-size:.78rem;color:var(--ink);width:148px
}
.tb-search input::placeholder{color:var(--ink4)}

.ib{
  position:relative;width:36px;height:36px;
  border:1px solid var(--border);background:var(--surface);
  color:var(--ink3);cursor:pointer;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  transition:border-color .15s,color .15s
}
.ib:hover{border-color:var(--blue);color:var(--blue)}

.ndot{
  position:absolute;top:8px;right:8px;
  width:6px;height:6px;border-radius:50%;
  background:var(--blue);border:2px solid var(--bg)
}

.tb-scan-btn{
  height:36px;padding:0 14px;
  font-family:var(--fb);font-size:.76rem;font-weight:500;
  color:var(--blue);
  background:rgba(26,143,209,.07);
  border:1px solid rgba(26,143,209,.22);
  border-radius:8px;cursor:pointer;white-space:nowrap;
  transition:background .15s,color .15s,border-color .15s
}
.tb-scan-btn:hover{background:var(--blue);color:#fff;border-color:var(--blue)}

.um-wrap{position:relative}
.um-trigger{
  display:flex;align-items:center;gap:8px;
  padding:4px 10px 4px 4px;
  background:var(--surface);
  border:1px solid var(--border);border-radius:30px;cursor:pointer;
  transition:border-color .15s,box-shadow .15s
}
.um-trigger:hover{border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,143,209,.08)}
.um-av{width:26px;height:26px;border-radius:50%;object-fit:cover;border:1px solid var(--border)}
.um-name{font-family:var(--fb);font-size:.78rem;font-weight:500;color:var(--ink);max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.um-drop{
  position:absolute;right:0;top:calc(100% + 7px);min-width:222px;
  background:var(--surface);
  border:1px solid var(--border);border-radius:var(--r-lg);
  box-shadow:0 8px 32px rgba(12,31,46,.12),0 2px 8px rgba(12,31,46,.06);
  padding:5px 0;z-index:200;animation:dropIn .14s ease
}
@keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

.um-head{padding:9px 14px 2px;font-family:var(--fb);font-size:.59rem;color:var(--ink4);text-transform:uppercase;letter-spacing:.1em;font-weight:600}
.um-email{padding:1px 14px 8px;font-family:var(--fb);font-size:.79rem;color:var(--ink);font-weight:500}
.um-meta{padding:0 14px 7px;font-family:var(--fb);font-size:.72rem;color:var(--ink3);line-height:1.7}
.um-meta span{display:block}
.um-div{border:none;border-top:1px solid var(--border-lt);margin:3px 0}
.um-item{
  display:flex;align-items:center;gap:9px;
  width:100%;padding:8px 14px;
  border:none;background:transparent;
  font-family:var(--fb);font-size:.8rem;color:var(--ink3);
  cursor:pointer;text-align:left;
  transition:background .12s,color .12s
}
.um-item:hover{background:var(--surface2);color:var(--ink)}
.um-item--danger:hover{color:var(--danger)}

/* ══════════════════════════════
   NOTIFICATION DROPDOWN
══════════════════════════════ */
.notif-wrap{position:relative}
.notif-drop{
  position:absolute;right:0;top:calc(100% + 7px);
  width:308px;max-width:90vw;
  background:var(--surface);
  border:1px solid var(--border);border-radius:var(--r-lg);
  box-shadow:0 8px 32px rgba(12,31,46,.12),0 2px 8px rgba(12,31,46,.06);
  z-index:200;animation:dropIn .14s ease;
  display:flex;flex-direction:column;overflow:hidden
}
.notif-drop-head{
  padding:13px 15px;border-bottom:1px solid var(--border-lt);
  display:flex;align-items:center;justify-content:space-between
}
.notif-drop-head h3{font-family:var(--fd);font-size:.88rem;font-weight:600;color:var(--ink)}
.notif-mark-all{font-family:var(--fb);font-size:.71rem;color:var(--blue);background:none;border:none;cursor:pointer;padding:0}
.notif-mark-all:hover{text-decoration:underline}
.notif-list{overflow-y:auto;max-height:280px}
.notif-item{display:flex;gap:10px;padding:11px 15px;border-bottom:1px solid var(--border-lt);cursor:pointer;transition:background .12s}
.notif-item:last-child{border-bottom:none}
.notif-item:hover{background:var(--surface2)}
.notif-item.unread{background:rgba(26,143,209,.04)}
.notif-item-dot{width:6px;height:6px;border-radius:50%;background:var(--blue);flex-shrink:0;margin-top:5px}
.notif-item:not(.unread) .notif-item-dot{opacity:0}
.notif-item-body{flex:1;min-width:0}
.notif-item-title{font-family:var(--fb);font-size:.79rem;font-weight:500;color:var(--ink);margin-bottom:2px}
.notif-item-msg{font-size:.73rem;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notif-item-time{font-size:.65rem;color:var(--ink4);margin-top:3px}
.notif-footer{padding:9px 15px;border-top:1px solid var(--border-lt)}
.notif-footer a{font-family:var(--fb);font-size:.76rem;color:var(--blue);text-decoration:none;font-weight:500}
.notif-footer a:hover{text-decoration:underline}
.notif-empty,.notif-loading{padding:24px 15px;font-size:.79rem;color:var(--ink4);text-align:center}

/* ══════════════════════════════
   MODALS
══════════════════════════════ */
.logout-modal-overlay{
  position:fixed;inset:0;
  background:rgba(7,25,41,.6);backdrop-filter:blur(7px);
  z-index:1000;display:flex;align-items:center;justify-content:center;
  padding:20px;animation:mfade .18s ease
}
@keyframes mfade{from{opacity:0}to{opacity:1}}
@keyframes mrise{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}

.logout-modal{
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 24px 64px rgba(7,25,41,.22),0 4px 16px rgba(7,25,41,.08);
  max-width:380px;width:100%;overflow:hidden;
  animation:mrise .22s cubic-bezier(.16,1,.3,1)
}
.logout-modal-inner{padding:32px 28px 12px;text-align:center}
.logout-modal-icon{
  width:48px;height:48px;border-radius:12px;
  background:rgba(26,143,209,.08);border:1px solid rgba(26,143,209,.18);
  color:var(--blue);display:flex;align-items:center;justify-content:center;
  margin:0 auto 18px
}
.logout-modal h2{
  font-family:var(--fd);font-size:1.2rem;font-weight:700;
  color:var(--ink);letter-spacing:-.03em;margin-bottom:8px
}
.logout-modal p{font-family:var(--fb);font-size:.84rem;color:var(--ink3);line-height:1.6;margin-bottom:24px}
.logout-modal-actions{display:flex;gap:9px;padding:0 28px 28px}
.logout-modal-actions button{
  flex:1;padding:10px 0;border-radius:8px;
  font-family:var(--fb);font-size:.83rem;font-weight:500;
  cursor:pointer;border:none;transition:background .15s
}
.logout-modal-btn-no{background:var(--surface2);color:var(--ink);border:1px solid var(--border)}
.logout-modal-btn-no:hover{background:var(--bg)}
.logout-modal-btn-yes{background:var(--blue);color:#fff}
.logout-modal-btn-yes:hover{background:var(--blue-dk)}

.paste-scan-modal{
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 24px 64px rgba(7,25,41,.22);
  max-width:456px;width:100%;overflow:hidden;
  animation:mrise .22s cubic-bezier(.16,1,.3,1)
}
.paste-scan-modal-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:17px 20px;border-bottom:1px solid var(--border-lt)
}
.paste-scan-modal-header h2{font-family:var(--fd);font-size:.98rem;font-weight:600;color:var(--ink);letter-spacing:-.02em}
.paste-scan-close{
  width:30px;height:30px;border:1px solid var(--border);
  background:var(--surface2);color:var(--ink3);cursor:pointer;
  border-radius:7px;display:flex;align-items:center;justify-content:center;
  transition:all .14s
}
.paste-scan-close:hover{border-color:var(--ink3);color:var(--ink)}
.paste-scan-modal-body{padding:20px}
.paste-scan-hint{font-family:var(--fb);font-size:.79rem;color:var(--ink3);margin-bottom:12px;line-height:1.6}
.paste-scan-input{
  width:100%;padding:10px 12px;
  border:1px solid var(--border);border-radius:8px;
  font-size:.78rem;color:var(--ink);background:var(--surface2);
  resize:vertical;min-height:100px;transition:border-color .16s
}
.paste-scan-input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(26,143,209,.1)}
.paste-scan-error{font-size:.76rem;color:var(--danger);margin-top:7px}
.paste-scan-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:14px}
.paste-scan-actions button{
  padding:9px 20px;border-radius:8px;
  font-family:var(--fb);font-size:.81rem;font-weight:500;
  cursor:pointer;border:none;transition:background .14s
}

/* ══════════════════════════════
   PAGE / DASHBOARD
══════════════════════════════ */
.page{padding:22px 28px 36px}
.page.page--dashboard{
  flex:1;min-height:0;overflow:hidden;
  display:flex;flex-direction:column;
  padding:20px 28px 24px
}
.page--dashboard .dashboard-home{
  flex:1;min-height:0;
  display:flex;flex-direction:column;gap:18px
}

/* ── KPI ── */
.kpi-row{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(158px,1fr));
  gap:12px
}
.kpi-card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--r-lg);padding:20px 20px 18px;
  display:flex;flex-direction:column;gap:10px;
  position:relative;overflow:hidden;
  transition:box-shadow .2s,border-color .2s,transform .2s;
  cursor:default
}
.kpi-card:hover{
  transform:translateY(-2px);
  border-color:rgba(26,143,209,.28);
  box-shadow:0 8px 24px rgba(12,31,46,.09)
}
/* left accent stripe */
.kpi-card::before{
  content:'';position:absolute;
  left:0;top:16px;bottom:16px;width:3px;
  border-radius:0 3px 3px 0
}
.kpi-card:nth-child(1)::before{background:var(--blue)}
.kpi-card:nth-child(2)::before{background:var(--blue-dk)}
.kpi-card:nth-child(3)::before{background:var(--blue-deep)}
.kpi-card:nth-child(4)::before{background:var(--blue-lt)}

.kpi-top{display:flex;align-items:center;justify-content:space-between}
.kpi-icon{
  width:34px;height:34px;border-radius:9px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  background:var(--surface2);border:1px solid var(--border-lt);color:var(--blue)
}
.kpi-value{
  font-family:var(--fd);font-size:2.1rem;font-weight:700;
  letter-spacing:-.05em;line-height:1;color:var(--ink)
}
.kpi-label{
  font-family:var(--fb);font-size:.71rem;font-weight:500;
  color:var(--ink3);text-transform:uppercase;letter-spacing:.06em
}

/* ── CHART ROW ── */
.dashboard-chart-row{
  display:flex;align-items:stretch;gap:13px;
  flex:1;min-height:0
}
.db-chart-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-lg);
  display:flex;flex-direction:column;overflow:hidden;
  transition:box-shadow .2s
}
.db-chart-card:hover{box-shadow:0 6px 20px rgba(12,31,46,.07)}
.db-chart-card--pie{flex:0 0 278px}
.db-chart-card--bar{flex:1}

.db-chart-header{
  display:flex;align-items:center;gap:11px;
  padding:15px 18px 12px;
  border-bottom:1px solid var(--border-lt);flex-shrink:0
}
.db-chart-header-icon{
  width:34px;height:34px;border-radius:9px;
  background:var(--surface2);border:1px solid var(--border-lt);
  color:var(--blue);display:flex;align-items:center;justify-content:center;flex-shrink:0
}
.db-chart-title{
  font-family:var(--fd);font-size:.88rem;font-weight:600;
  color:var(--ink);letter-spacing:-.02em
}
.db-chart-sub{font-family:var(--fb);font-size:.67rem;color:var(--ink4);margin-top:1px}

/* pie */
.db-pie-wrap{
  flex:1;min-height:0;
  display:flex;flex-direction:column;align-items:center;
  padding:16px 18px 12px;position:relative
}
.db-pie-center{
  position:absolute;left:50%;transform:translateX(-50%);
  top:61px;text-align:center;pointer-events:none
}
.db-pie-center-val{
  font-family:var(--fd);font-size:1.65rem;font-weight:700;
  color:var(--ink);letter-spacing:-.04em;line-height:1
}
.db-pie-center-lbl{
  font-family:var(--fb);font-size:.59rem;font-weight:500;
  color:var(--ink4);text-transform:uppercase;letter-spacing:.08em;margin-top:3px
}
.db-pie-legend{
  display:flex;flex-direction:column;gap:6px;
  padding-top:10px;width:100%;flex-shrink:0
}
.db-pie-leg-row{
  display:flex;align-items:center;gap:9px;
  padding:6px 9px;border-radius:7px;
  border:1px solid var(--border-lt);background:var(--surface2);
  transition:border-color .14s
}
.db-pie-leg-row:hover{border-color:var(--border)}
.db-pie-leg-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.db-pie-leg-name{
  flex:1;font-family:var(--fb);font-size:.71rem;color:var(--ink3);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize
}
.db-pie-leg-count{font-family:var(--fd);font-size:.82rem;font-weight:600;color:var(--ink)}
.db-pie-leg-pct{font-family:var(--fb);font-size:.65rem;color:var(--ink4);margin-left:2px}

/* bar */
.db-bar-wrap{flex:1;min-height:0;padding:12px 18px 18px}

/* ── SECTION LABEL ── */
.db-section-label{
  font-family:var(--fb);font-size:.62rem;font-weight:600;
  text-transform:uppercase;letter-spacing:.1em;color:var(--ink4);
  display:flex;align-items:center;gap:10px;flex-shrink:0
}
.db-section-label::after{content:'';flex:1;height:1px;background:var(--border-lt)}

/* ── QUICK CARDS ── */
.db-quick-row{display:flex;flex-wrap:wrap;gap:10px;flex-shrink:0}
.db-quick-card{
  flex:1;min-width:108px;padding:14px 16px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-lg);
  display:flex;align-items:center;gap:13px;
  cursor:pointer;text-decoration:none;color:inherit;
  transition:border-color .18s,box-shadow .18s,transform .18s
}
.db-quick-card:hover{
  border-color:var(--blue);
  box-shadow:0 4px 14px rgba(12,31,46,.07);
  transform:translateY(-1px);color:inherit
}
.db-quick-icon{
  width:38px;height:38px;border-radius:9px;
  background:var(--surface2);border:1px solid var(--border-lt);
  color:var(--blue);display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:background .18s,border-color .18s
}
.db-quick-card:hover .db-quick-icon{background:var(--blue);color:#fff;border-color:var(--blue)}
.db-quick-val{
  font-family:var(--fd);font-size:1.4rem;font-weight:700;
  color:var(--ink);letter-spacing:-.04em;line-height:1
}
.db-quick-lbl{
  font-family:var(--fb);font-size:.67rem;font-weight:500;
  color:var(--ink3);margin-top:2px;
  text-transform:uppercase;letter-spacing:.05em
}

/* ── SHORTCUTS ── */
.db-shortcuts{display:flex;flex-wrap:wrap;gap:7px;flex-shrink:0}
.db-shortcut{
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 14px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:8px;
  font-family:var(--fb);font-size:.79rem;font-weight:500;
  color:var(--ink2);cursor:pointer;
  transition:border-color .15s,background .15s,color .15s;
  text-decoration:none
}
.db-shortcut:hover{border-color:var(--blue);background:rgba(26,143,209,.05);color:var(--blue)}

/* ── ALERT ── */
.dashboard-alert{
  padding:11px 16px;
  background:rgba(26,143,209,.05);
  border:1px solid rgba(26,143,209,.2);
  border-left:3px solid var(--blue);
  border-radius:8px;
  font-family:var(--fb);font-size:.8rem;color:var(--ink2);
  flex-shrink:0
}
.dashboard-alert a{color:var(--blue);font-weight:500;text-decoration:none}
.dashboard-alert a:hover{text-decoration:underline}

/* ══════════════════════════════
   INNER PAGE SHARED STYLES
══════════════════════════════ */
.tbl-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;margin-bottom:14px}
.tbl-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.tabs{display:flex;gap:2px;background:var(--surface2);padding:3px;border-radius:9px;border:1px solid var(--border)}
.tab{padding:6px 13px;border:none;background:transparent;color:var(--ink3);font-family:var(--fb);font-size:.75rem;font-weight:500;cursor:pointer;border-radius:6px;transition:all .14s}
.tab:hover{color:var(--ink)}
.tab.active{background:var(--surface);color:var(--ink);font-weight:600;box-shadow:0 1px 4px rgba(12,31,46,.08)}
.tbl-wrap{overflow-x:auto;border-radius:9px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse}
thead tr{background:var(--surface2)}
thead th{padding:10px 14px;text-align:left;font-family:var(--fb);font-size:.61rem;font-weight:600;color:var(--ink4);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border);white-space:nowrap}
.tr{background:var(--surface);transition:background .12s;cursor:pointer}
.tr:hover:not(.sel){background:var(--surface2)}
.tr.sel{background:rgba(26,143,209,.05)}
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
.sbadge.p{background:rgba(26,143,209,.1);color:var(--blue-dk)}
.sbadge.d{background:rgba(11,143,99,.1);color:var(--success)}
.sbadge.c{background:rgba(26,143,209,.1);color:var(--blue-dk)}
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
.ct{background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:9px 12px;font-family:var(--fb);font-size:12px;color:var(--ink);box-shadow:0 4px 16px rgba(12,31,46,.1)}
.ct-lbl{color:var(--ink4);margin-bottom:3px;font-family:var(--fb);font-size:10px;text-transform:uppercase;letter-spacing:.07em;font-weight:600}

/* ══════════════════════════════
   PENDING APPROVALS MODAL
══════════════════════════════ */
.pending-approvals-modal{max-width:540px!important;padding:0!important}
.pending-approvals-modal .logout-modal-inner{display:none}
.pam-header{
  display:flex;align-items:center;gap:14px;
  padding:20px 22px;border-bottom:1px solid var(--border-lt)
}
.pam-header-icon{
  width:44px;height:44px;border-radius:11px;
  background:var(--blue);color:#fff;
  display:flex;align-items:center;justify-content:center;flex-shrink:0
}
.pam-header-text{flex:1;min-width:0}
.pam-title{font-family:var(--fd);font-size:1.1rem;font-weight:700;color:var(--ink);letter-spacing:-.03em;margin:0 0 3px}
.pam-sub{font-family:var(--fb);font-size:.77rem;color:var(--ink3);margin:0}
.pam-badge{
  flex-shrink:0;min-width:28px;height:28px;padding:0 10px;
  background:var(--blue);color:#fff;border-radius:999px;
  font-family:var(--fd);font-size:.79rem;font-weight:700;
  display:flex;align-items:center;justify-content:center
}
.pam-close{width:34px;height:34px;border:1px solid var(--border);background:var(--surface2);color:var(--ink3);cursor:pointer;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .14s}
.pam-close:hover{border-color:var(--ink3);color:var(--ink)}
.pam-body{padding:16px 22px 22px;max-height:65vh;overflow-y:auto}
.pam-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.pam-item{
  display:flex;align-items:center;gap:13px;
  padding:13px 14px;
  background:var(--surface2);border:1px solid var(--border-lt);
  border-radius:11px;transition:border-color .16s
}
.pam-item:hover{border-color:var(--border)}
.pam-avatar{
  width:42px;height:42px;border-radius:10px;
  background:rgba(26,143,209,.09);border:1px solid rgba(26,143,209,.14);
  color:var(--blue);font-family:var(--fd);font-size:.98rem;font-weight:700;
  display:flex;align-items:center;justify-content:center;flex-shrink:0
}
.pam-item-info{flex:1;min-width:0}
.pam-item-name{display:block;font-family:var(--fb);font-weight:500;color:var(--ink);font-size:.86rem;margin-bottom:2px}
.pam-item-email{display:block;font-size:.75rem;color:var(--ink3);margin-bottom:6px}
.pam-item-meta{display:flex;flex-wrap:wrap;gap:5px}
.pam-item-dept{font-family:var(--fb);font-size:.64rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--blue-dk);background:rgba(26,143,209,.08);border:1px solid rgba(26,143,209,.14);padding:3px 8px;border-radius:5px}
.pam-item-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;flex-wrap:wrap}
.pam-role-select{padding:7px 10px;border-radius:7px;border:1px solid var(--border);background:var(--surface);color:var(--ink);font-family:var(--fb);font-size:.77rem;font-weight:500;cursor:pointer;min-width:100px;transition:border-color .14s}
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
.kpi-card{animation:fadeUp .36s cubic-bezier(.16,1,.3,1) both}
.kpi-card:nth-child(1){animation-delay:.04s}
.kpi-card:nth-child(2){animation-delay:.09s}
.kpi-card:nth-child(3){animation-delay:.14s}
.kpi-card:nth-child(4){animation-delay:.19s}
.db-chart-card{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) .22s both}
.db-quick-card{animation:fadeUp .36s cubic-bezier(.16,1,.3,1) both}
.db-quick-card:nth-child(1){animation-delay:.3s}
.db-quick-card:nth-child(2){animation-delay:.35s}
.db-quick-card:nth-child(3){animation-delay:.4s}
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
  Dashboard:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Asset:    ()=><Ic d={["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z","M3.27 6.96 12 12.01 20.73 6.96","M12 22.08V12"]}/>,
  Category: ()=><Ic d={["M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z","M12 11v6","M9 14h6"]}/>,
  Location: ()=><Ic d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z","M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"]}/>,
  Assign:   ()=><Ic d={["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2","M8 2h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z","M12 11v6","M9 14h6"]}/>,
  Move:     ()=><Ic d={["M5 12h14","M12 5l7 7-7 7"]}/>,
  Reserve:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Attach:   ()=><Ic d={["M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"]}/>,
  Audit:    ()=><Ic d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]}/>,
  Alert:    ()=><Ic d={["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"]}/>,
  Comment:  ()=><Ic d={["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"]}/>,
  Deprec:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Maint:    ()=><Ic d={["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"]}/>,
  Notif:    ()=><Ic d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]}/>,
  User:     ()=><Ic d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"]}/>,
  Search:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bell:     ()=><Ic d={["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"]}/>,
  Settings: ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout:   ()=><Ic d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]}/>,
  CDown:    ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="6 9 12 15 18 9"/></svg>,
  Eye:      ()=><Ic size={13} d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8","M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"]}/>,
  Edit:     ()=><Ic size={13} d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]}/>,
  Trash:    ()=><Ic size={13} d={["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"]}/>,
};

/* ─── NAV CONFIG ─── */
const NAV = [
  { id:"dashboard",          label:"Dashboard",       IC:I.Dashboard },
  { id:"asset",              label:"Assets",          IC:I.Asset },
  { id:"asset-category",     label:"Categories",      IC:I.Category },
  { id:"location",           label:"Locations",       IC:I.Location },
  { id:"asset-assignment",   label:"Assignments",     IC:I.Assign },
  { id:"employee",           label:"Employees",       IC:I.User },
  { id:"asset-movement",     label:"Movements",       IC:I.Move },
  { id:"asset-reservation",  label:"Reservations",    IC:I.Reserve },
  { id:"attachment",         label:"Attachments",     IC:I.Attach },
  { id:"audit-log",          label:"Audit Logs",      IC:I.Audit },
  { id:"anomaly-alert",      label:"Theft & Anomaly", IC:I.Alert },
  { id:"comment",            label:"Comments",        IC:I.Comment },
  { id:"depreciation",       label:"Depreciation",    IC:I.Deprec },
  { id:"maintenance",        label:"Maintenance",     IC:I.Maint },
  { id:"notification",       label:"Notifications",   IC:I.Notif },
  { id:"user-management",    label:"User Management", IC:I.User },
];
const NAV_GROUPS = [
  { label:"Overview",              ids:["dashboard"] },
  { label:"Assets & Inventory",    ids:["asset","asset-category","location","asset-assignment","asset-movement","asset-reservation","attachment"] },
  { label:"Security & Compliance", ids:["audit-log","anomaly-alert"] },
  { label:"Records & Activity",    ids:["comment","depreciation","maintenance"] },
  { label:"People",                ids:["employee"] },
  { label:"Account",               ids:["notification","user-management"] },
];
const PAGE_LABELS = {
  dashboard:"Dashboard", asset:"Assets","asset-category":"Asset Categories",
  location:"Locations","asset-assignment":"Asset Assignments", employee:"Employees",
  "asset-movement":"Asset Movements","asset-reservation":"Asset Reservations",
  attachment:"Attachments","audit-log":"Audit Logs",
  "anomaly-alert":"Theft & Anomaly Alerts", comment:"Comments",
  depreciation:"Depreciation Records", maintenance:"Maintenance Records",
  notification:"Notifications","user-management":"User Management",
};
const ASSET_STATUS_COLORS = { AVAILABLE:"#1a8fd1",IN_USE:"#3db8f5",UNDER_MAINTENANCE:"#0e6fa8",RESERVED:"#0d5f96",DISPOSED:"#64748b" };
const BAR_COLORS = ["#1a8fd1","#3db8f5","#0e6fa8","#0d5f96","#1178b8","#0d9668"];

function getNavItemsForPermissions(p) {
  return NAV.filter(n => { const r = NAV_PERMISSION[n.id]; return r == null || hasPermission(p, r); });
}
function getDashboardCapsFromPermissions(p) {
  const c = {};
  for (const [k,v] of Object.entries(CAP_PERMISSION)) c[k] = v ? hasPermission(p,v) : true;
  c.notifications = true; return c;
}

const BrandIcon = () => (
  <img src={`${process.env.PUBLIC_URL||''}/logo-w.png`} alt="Fabritrack" width="36" height="36" style={{objectFit:"contain"}} />
);

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ct">
      <div className="ct-lbl">{label}</div>
      {payload.map((p,i) => <div key={i} style={{color:p.color||p.fill,fontWeight:600,fontSize:".8rem"}}>{p.name}: {p.value}</div>)}
    </div>
  );
};

/* ─────────────────────────────────
   COMPONENT
───────────────────────────────── */
export default function Dashboard({ user, onLogout }) {
  const [nav, setNav]         = useState("dashboard");
  const [openGroups, setOG]   = useState({});
  const [umOpen, setUm]       = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const umRef    = useRef(null);
  const notifRef = useRef(null);

  const [notifOpen, setNO]          = useState(false);
  const [headerNotifs, setHN]       = useState([]);
  const [headerNL, setHNL]          = useState(false);
  const [logoutOpen, setLO]         = useState(false);
  const [profileUser, setPU]        = useState(null);
  const [avatarUrl, setAU]          = useState(null);
  const [profileOpen, setPO]        = useState(false);
  const [avatarKey, setAK]          = useState(0);
  const [scanOpen, setScanOpen]     = useState(false);
  const [scannedAsset, setScanned]  = useState(null);
  const [scanJson, setScanJson]     = useState("");
  const [scanErr, setScanErr]       = useState("");
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [unread, setUnread]         = useState(null);
  const [pending, setPending]       = useState([]);
  const [pendingRoles, setPR]       = useState({});
  const [pamOpen, setPAM]           = useState(false);

  const [,setAC]=useState(null);const [,setCC]=useState(null);const [,setLC]=useState(null);
  const [,setAsC]=useState(null);const [,setMvC]=useState(null);const [,setRsC]=useState(null);
  const [,setAtC]=useState(null);const [,setAuC]=useState(null);const [,setCmC]=useState(null);
  const [,setDpC]=useState(null);const [,setMnC]=useState(null);const [,setNtC]=useState(null);

  const loadStats = () => {
    setLoading(true);
    const perms = getEffectivePermissions(user);
    const can = {
      assets:hasPermission(perms,CAP_PERMISSION.assets), categories:hasPermission(perms,CAP_PERMISSION.categories),
      locations:hasPermission(perms,CAP_PERMISSION.locations), assignments:hasPermission(perms,CAP_PERMISSION.assignments),
      movements:hasPermission(perms,CAP_PERMISSION.movements), reservations:hasPermission(perms,CAP_PERMISSION.reservations),
      attachments:hasPermission(perms,CAP_PERMISSION.attachments), auditLogs:hasPermission(perms,CAP_PERMISSION.auditLogs),
      comments:hasPermission(perms,CAP_PERMISSION.comments), depreciation:hasPermission(perms,CAP_PERMISSION.depreciation),
      maintenance:hasPermission(perms,CAP_PERMISSION.maintenance), users:hasPermission(perms,CAP_PERMISSION.users),
    };
    const unreadP = user?.id ? getNotifications({userId:user.id,unreadOnly:true}) : getNotifications({unreadOnly:true});
    Promise.all([
      can.assets?getAssets():Promise.resolve([]),
      can.categories?getAssetCategories():Promise.resolve([]),
      can.locations?getLocations():Promise.resolve([]),
      can.assignments?getAssetAssignments():Promise.resolve([]),
      can.movements?getAssetMovements():Promise.resolve([]),
      can.reservations?getAssetReservations():Promise.resolve([]),
      can.attachments?getAttachments():Promise.resolve([]),
      can.auditLogs?getAuditLogs({page:0,size:1}):Promise.resolve({content:[],totalElements:0}),
      can.comments?getComments():Promise.resolve([]),
      can.depreciation?getDepreciationRecords():Promise.resolve([]),
      can.maintenance?getMaintenanceRecords():Promise.resolve([]),
      getNotifications(), unreadP,
      can.users?getUsers():Promise.resolve([]),
    ]).then(([assets,cats,locs,asns,mvs,res,ats,aus,cms,dep,mnt,notifs,unr,usrs]) => {
      setStats({
        assets:assets?.length||0, categories:cats?.length||0, locations:locs?.length||0,
        assignments:asns?.length||0, movements:mvs?.length||0, reservations:res?.length||0,
        attachments:ats?.length||0, auditLogs:aus?.totalElements??aus?.content?.length??0,
        comments:cms?.length||0, depreciation:dep?.length||0, maintenance:mnt?.length||0,
        notifications:notifs?.length||0, users:usrs?.length||0,
        assetsList:Array.isArray(assets)?assets:[],
      });
      setUnread(unr?.length||0);
    }).catch(()=>setStats(null))
      .finally(()=>{ setLoading(false); if(can.users) getPendingUsers().then(setPending).catch(()=>setPending([])); else setPending([]); });
  };

  useEffect(()=>{ if(nav==="dashboard") loadStats(); },[nav]);

  useEffect(()=>{ if(!umOpen) return; const h=e=>{ if(umRef.current&&!umRef.current.contains(e.target)) setUm(false); }; document.addEventListener("click",h); return()=>document.removeEventListener("click",h); },[umOpen]);
  useEffect(()=>{ if(!notifOpen) return; const h=e=>{ if(notifRef.current&&!notifRef.current.contains(e.target)) setNO(false); }; document.addEventListener("click",h); return()=>document.removeEventListener("click",h); },[notifOpen]);
  useEffect(()=>{ if(!user?.id) return; getCurrentUser().then(r=>setPU(r?.user??null)).catch(()=>{}); },[user?.id]);
  useEffect(()=>{ if(!user?.id) return; getMyAvatarBlob().then(b=>{ if(b) setAU(URL.createObjectURL(b)); }).catch(()=>{}); return()=>setAU(p=>{ if(p) URL.revokeObjectURL(p); return null; }); },[user?.id,avatarKey]);

  const loadHeaderNotifs = () => {
    if(!user?.id){setHN([]);return;} setHNL(true);
    getNotifications({userId:user.id}).then(l=>setHN(Array.isArray(l)?l.slice(0,15):[])).catch(()=>setHN([])).finally(()=>setHNL(false));
  };
  const handleBell = () => { const n=!notifOpen; setNO(n); if(n) loadHeaderNotifs(); };
  const markRead = id => { markNotificationAsRead(id).then(()=>{ setHN(p=>p.map(n=>n.id===id?{...n,read:true}:n)); setUnread(c=>c>0?c-1:0); }).catch(()=>{}); };
  const markAllRead = () => { markAllNotificationsAsRead().then(()=>{ setHN(p=>p.map(n=>({...n,read:true}))); setUnread(0); loadStats(); }).catch(()=>{}); };
  const confirmLogout = () => { setLO(false); localStorage.removeItem("fabritrack_token"); localStorage.removeItem("fabritrack_user"); sessionStorage.clear(); onLogout?.(); };

  const handleScanView = () => {
    try { const d=JSON.parse(scanJson.trim()); if(d&&typeof d==="object"){ setScanned(d); setScanErr(""); setScanOpen(false); } else setScanErr("Invalid JSON."); }
    catch { setScanErr("Invalid JSON. Paste the exact text from your QR scanner."); }
  };

  const cu = user||{firstName:"Admin",email:"admin@fabritrack.com"};
  const du = profileUser||cu;
  const fullName = [du.firstName,du.lastName].filter(Boolean).join(" ")||"Admin";
  const roleLabel = du.role ? String(du.role).replace(/_/g," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()) : "Administrator";
  const deptLabel = du.department ? String(du.department).replace(/_/g," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()) : null;
  const defAvatar = du?.email
    ? `https://i.pravatar.cc/80?u=${encodeURIComponent(du.email)}`
    : "https://i.pravatar.cc/80?u=fabritrack-default";
  const perms    = getEffectivePermissions(user||du);
  const navItems = useMemo(()=>getNavItemsForPermissions(perms),[perms]);
  const navGroups = useMemo(()=>NAV_GROUPS.map(g=>({label:g.label,items:navItems.filter(n=>g.ids.includes(n.id))})).filter(g=>g.items.length>0),[navItems]);
  const allowedIds = useMemo(()=>navItems.map(n=>n.id),[navItems]);
  const caps = useMemo(()=>getDashboardCapsFromPermissions(perms),[perms]);

  useEffect(()=>{
    setOG(prev=>{
      const next={};
      const activeLabel=navGroups.find(g=>g.items.some(i=>i.id===nav))?.label;
      navGroups.forEach((g,idx)=>{ next[g.label]=Object.hasOwn(prev,g.label)?prev[g.label]:idx===0; });
      if(activeLabel) next[activeLabel]=true;
      return next;
    });
  },[navGroups,nav]);

  useEffect(()=>{ if(allowedIds.length&&!allowedIds.includes(nav)) setNav(allowedIds[0]); },[allowedIds,nav]);

  const assetsList = stats?.assetsList??[];
  const pieData = useMemo(()=>{ const m={}; assetsList.forEach(a=>{ const s=a.status||"Unknown"; m[s]=(m[s]||0)+1; }); return Object.entries(m).map(([name,value])=>({name,value,color:ASSET_STATUS_COLORS[name]||"#64748b"})); },[assetsList]);
  const barData = useMemo(()=>{ const m={}; assetsList.forEach(a=>{ const d=a.department||"Unassigned"; m[d]=(m[d]||0)+1; }); return Object.entries(m).map(([dept,assets])=>({dept,assets})).sort((a,b)=>b.assets-a.assets).slice(0,6); },[assetsList]);

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        {/* ══ SIDEBAR ══ */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-brand-icon sb-brand-icon--logo"><BrandIcon/></div>
            <div className="sb-brand-text">
              <div className="sb-brand-name">Fabri<em>track</em></div>
              <div className="sb-brand-sub">Asset Platform</div>
            </div>
          </div>
          <nav className="sb-nav">
            {navGroups.map(group=>(
              <div key={group.label} className={`sb-nav-group${openGroups[group.label]?" open":""}`}
                onMouseEnter={()=>setOG(p=>({...p,[group.label]:true}))}
                onMouseLeave={()=>setOG(p=>({...p,[group.label]:group.items.some(i=>i.id===nav)}))}>
                <button type="button" className="sb-group-trigger"
                  onClick={()=>setOG(p=>({...p,[group.label]:!p[group.label]}))}
                  aria-expanded={Boolean(openGroups[group.label])}>
                  <span className="sb-section">{group.label}</span>
                  <span className="sb-group-chevron"><I.CDown/></span>
                </button>
                <div className="sb-nav-group-list-wrap" style={{maxHeight:openGroups[group.label]?`${group.items.length*42+16}px`:"0px"}}>
                  <div className="sb-nav-group-list">
                    {group.items.map(({id,label,IC})=>(
                      <button key={id} type="button" className={`nav-btn${nav===id?" active":""}`} onClick={()=>setNav(id)}>
                        <IC/><span>{label}</span>
                        {id==="notification"&&unread>0&&<span className="nav-badge">{unread>99?"99+":unread}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </nav>
          <div className="sb-footer">
            <div className="sb-user" onClick={()=>setPO(true)} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&setPO(true)}>
              <img src={avatarUrl||defAvatar} alt="" className="sb-user-av"/>
              <div className="sb-user-info">
                <div className="sb-user-name">{fullName}</div>
                <div className="sb-user-role">{roleLabel}</div>
              </div>
              <span className="sb-user-cog"><I.Settings/></span>
            </div>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div className="main">
          <header className="topbar">
            <div className="tb-left">
              <div className="tb-page-title">{PAGE_LABELS[nav]||"Dashboard"}</div>
              <div className="tb-crumb">
                <span className="tb-crumb-home">Home</span>
                <span className="tb-crumb-sep">›</span>
                <span>{PAGE_LABELS[nav]||"Dashboard"}</span>
              </div>
            </div>
            <div className="tb-actions">
              <div className="tb-search">
                <I.Search/>
                <input placeholder="Search…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} aria-label="Search"/>
              </div>
              <button type="button" className="tb-scan-btn" onClick={()=>{ setScanOpen(true); setScanned(null); setScanJson(""); setScanErr(""); }}>
                Scan data
              </button>
              <div className="notif-wrap" ref={notifRef}>
                <button type="button" className="ib" onClick={e=>{ e.stopPropagation(); handleBell(); }} aria-label="Notifications">
                  <I.Bell/>{unread>0&&<span className="ndot"/>}
                </button>
                {notifOpen&&(
                  <div className="notif-drop">
                    <div className="notif-drop-head">
                      <h3>Notifications</h3>
                      {headerNotifs.some(n=>!n.read)&&<button type="button" className="notif-mark-all" onClick={markAllRead}>Mark all read</button>}
                    </div>
                    {headerNL?<div className="notif-loading">Loading…</div>:
                     headerNotifs.length===0?<div className="notif-empty">No notifications</div>:(
                      <>
                        <div className="notif-list">
                          {headerNotifs.map(n=>(
                            <div key={n.id} className={`notif-item${n.read?"":" unread"}`} onClick={()=>{ if(!n.read) markRead(n.id); }}>
                              <span className="notif-item-dot"/>
                              <div className="notif-item-body">
                                <div className="notif-item-title">{n.title||"Notification"}</div>
                                <div className="notif-item-msg">{n.message||""}</div>
                                <div className="notif-item-time">{n.createdAt?new Date(n.createdAt).toLocaleString():""}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="notif-footer">
                          <a href="#notification" onClick={e=>{ e.preventDefault(); setNO(false); setNav("notification"); }}>View all →</a>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="um-wrap" ref={umRef}>
                <button className="um-trigger" onClick={e=>{ e.stopPropagation(); setUm(o=>!o); }}>
                  <img src={avatarUrl||defAvatar} alt="" className="um-av"/>
                  <span className="um-name">{fullName}</span>
                  <I.CDown/>
                </button>
                {umOpen&&(
                  <div className="um-drop">
                    <div className="um-head">Signed in as</div>
                    <div className="um-email">{du.email||"admin@fabritrack.com"}</div>
                    <div className="um-meta">
                      <span><strong>Name:</strong> {fullName}</span>
                      {roleLabel&&<span><strong>Role:</strong> {roleLabel}</span>}
                      {deptLabel&&<span><strong>Dept:</strong> {deptLabel}</span>}
                      {du.phone&&<span><strong>Phone:</strong> {du.phone}</span>}
                    </div>
                    <hr className="um-div"/>
                    <button type="button" className="um-item" onClick={()=>{ setUm(false); setPO(true); }}><I.Settings/>Profile settings</button>
                    <button type="button" className="um-item um-item--danger" onClick={()=>{ setUm(false); setLO(true); }}><I.Logout/>Sign out</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className={`page${nav==="dashboard"?" page--dashboard":""}`}>
            {nav==="dashboard"?(
              <div className="dashboard-home">

                {/* KPI */}
                <div className="kpi-row">
                  {[
                    {key:"assets",cap:"assets",Icon:I.Asset,label:"Total Assets",value:stats?.assets},
                    {key:"assignments",cap:"assignments",Icon:I.Assign,label:"Assignments",value:stats?.assignments},
                    {key:"movements",cap:"movements",Icon:I.Move,label:"Movements",value:stats?.movements},
                    {key:"notifications",cap:"notifications",Icon:I.Notif,label:"Unread Alerts",value:unread},
                  ].filter(({cap})=>caps[cap]).map(({key,Icon,label,value})=>(
                    <div className="kpi-card" key={key}>
                      <div className="kpi-top"><div className="kpi-icon"><Icon size={16}/></div></div>
                      <div className="kpi-value">{loading?"—":(value??"—")}</div>
                      <div className="kpi-label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                {caps.assets&&(
                  <div className="dashboard-chart-row">
                    <div className="db-chart-card db-chart-card--pie">
                      <div className="db-chart-header">
                        <div className="db-chart-header-icon"><I.Asset size={16}/></div>
                        <div>
                          <div className="db-chart-title">Asset Status</div>
                          <div className="db-chart-sub">By lifecycle state</div>
                        </div>
                      </div>
                      <div className="db-pie-wrap">
                        <div className="db-pie-center">
                          <div className="db-pie-center-val">{loading?"—":(stats?.assets??"—")}</div>
                          <div className="db-pie-center-lbl">total</div>
                        </div>
                        <PieChart width={144} height={115}>
                          <Pie data={pieData} cx={70} cy={54} innerRadius={31} outerRadius={49} dataKey="value" strokeWidth={2} stroke="#fff" paddingAngle={pieData.length?2:0}>
                            {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Pie>
                          <Tooltip contentStyle={{background:"#fff",border:"1px solid #dde6ef",borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontSize:12,boxShadow:"0 4px 16px rgba(12,31,46,.1)"}}
                            formatter={(v,n)=>{ const t=pieData.reduce((s,e)=>s+e.value,0); const p=t?((v/t)*100).toFixed(0):0; return [`${v} (${p}%)`,(n||"").replace(/_/g," ")]; }}/>
                        </PieChart>
                        <div className="db-pie-legend">
                          {pieData.length?pieData.slice(0,5).map(({name,value,color})=>{
                            const t=pieData.reduce((s,e)=>s+e.value,0); const p=t?((value/t)*100).toFixed(0):0;
                            return(
                              <div className="db-pie-leg-row" key={name}>
                                <span className="db-pie-leg-dot" style={{background:color}}/>
                                <span className="db-pie-leg-name">{name.replace(/_/g," ")}</span>
                                <span className="db-pie-leg-count">{value}</span>
                                <span className="db-pie-leg-pct">{p}%</span>
                              </div>
                            );
                          }):<span style={{fontSize:".77rem",color:"var(--ink4)"}}>No data</span>}
                        </div>
                      </div>
                    </div>

                    <div className="db-chart-card db-chart-card--bar">
                      <div className="db-chart-header">
                        <div className="db-chart-header-icon"><I.Location size={16}/></div>
                        <div>
                          <div className="db-chart-title">By Department</div>
                          <div className="db-chart-sub">Asset distribution</div>
                        </div>
                      </div>
                      <div className="db-bar-wrap">
                        {barData.length>0?(
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{top:8,right:8,left:-16,bottom:0}}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#eaf1f7" vertical={false}/>
                              <XAxis dataKey="dept" tick={{fill:"#a0b8c5",fontSize:11,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                              <YAxis tick={{fill:"#a0b8c5",fontSize:11,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                              <Tooltip content={<CT/>}/>
                              <Bar dataKey="assets" name="Assets" radius={[6,6,0,0]} maxBarSize={30}>
                                {barData.map((_,i)=><Cell key={i} fill={BAR_COLORS[i%BAR_COLORS.length]}/>)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ):(
                          <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--ink4)",fontSize:".82rem"}}>No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick stats */}
                {(caps.categories||caps.locations||caps.maintenance)&&(
                  <>
                    <div className="db-section-label">Quick stats</div>
                    <div className="db-quick-row">
                      {caps.categories&&<button type="button" className="db-quick-card" onClick={()=>setNav("asset-category")}>
                        <div className="db-quick-icon"><I.Category size={17}/></div>
                        <div><div className="db-quick-val">{loading?"—":(stats?.categories??"—")}</div><div className="db-quick-lbl">Categories</div></div>
                      </button>}
                      {caps.locations&&<button type="button" className="db-quick-card" onClick={()=>setNav("location")}>
                        <div className="db-quick-icon"><I.Location size={17}/></div>
                        <div><div className="db-quick-val">{loading?"—":(stats?.locations??"—")}</div><div className="db-quick-lbl">Locations</div></div>
                      </button>}
                      {caps.maintenance&&<button type="button" className="db-quick-card" onClick={()=>setNav("maintenance")}>
                        <div className="db-quick-icon"><I.Maint size={17}/></div>
                        <div><div className="db-quick-val">{loading?"—":(stats?.maintenance??"—")}</div><div className="db-quick-lbl">Maintenance</div></div>
                      </button>}
                    </div>
                  </>
                )}

                <div className="db-section-label">Quick access</div>
                <div className="db-shortcuts">
                  {caps.assets&&<button type="button" className="db-shortcut" onClick={()=>setNav("asset")}><I.Asset size={14}/>Assets</button>}
                  {caps.assignments&&<button type="button" className="db-shortcut" onClick={()=>setNav("asset-assignment")}><I.Assign size={14}/>Assignments</button>}
                  {caps.movements&&<button type="button" className="db-shortcut" onClick={()=>setNav("asset-movement")}><I.Move size={14}/>Movements</button>}
                  <button type="button" className="db-shortcut" onClick={()=>setNav("notification")}><I.Notif size={14}/>Notifications</button>
                  {caps.auditLogs&&<button type="button" className="db-shortcut" onClick={()=>setNav("audit-log")}><I.Audit size={14}/>Audit logs</button>}
                </div>

                {caps.users&&pending.length>0&&(
                  <div className="dashboard-alert">
                    <strong>{pending.length}</strong> user{pending.length!==1?"s":""} awaiting approval —{" "}
                    <a href="#pending" onClick={e=>{ e.preventDefault(); setPAM(true); }}>Review now</a>
                  </div>
                )}
              </div>
            ):(
              <>
                {nav==="asset"&&<AssetPage user={user} searchQuery={searchQ} onAssetsChange={l=>setAC(l?.length??null)} readOnly={!hasPermission(getEffectivePermissions(user),"ASSET_WRITE")}/>}
                {nav==="asset-category"&&<AssetCategoryPage user={user} searchQuery={searchQ} onCategoriesChange={l=>setCC(l?.length??null)}/>}
                {nav==="location"&&<LocationPage user={user} searchQuery={searchQ} onLocationsChange={l=>setLC(l?.length??null)}/>}
                {nav==="asset-assignment"&&<AssetAssignmentPage user={user} searchQuery={searchQ} onAssignmentsChange={l=>setAsC(l?.length??null)}/>}
                {nav==="employee"&&<EmployeePage user={user} searchQuery={searchQ} onEmployeesChange={()=>{}}/>}
                {nav==="asset-movement"&&<AssetMovementPage user={user} searchQuery={searchQ} onDataChange={l=>setMvC(l?.length??null)}/>}
                {nav==="asset-reservation"&&<AssetReservationPage user={user} searchQuery={searchQ} onDataChange={l=>setRsC(l?.length??null)} onReservationUpdated={loadHeaderNotifs}/>}
                {nav==="attachment"&&<AttachmentPage user={user} searchQuery={searchQ} onDataChange={l=>setAtC(l?.length??null)}/>}
                {nav==="audit-log"&&<AuditLogPage user={user} onDataChange={l=>setAuC(l?.length??null)}/>}
                {nav==="anomaly-alert"&&<AnomalyAlertPage user={user} searchQuery={searchQ} onDataChange={()=>{}}/>}
                {nav==="comment"&&<CommentPage user={user} searchQuery={searchQ} onDataChange={l=>setCmC(l?.length??null)}/>}
                {nav==="depreciation"&&<DepreciationRecordPage user={user} searchQuery={searchQ} onDataChange={l=>setDpC(l?.length??null)}/>}
                {nav==="maintenance"&&<MaintenanceRecordPage user={user} searchQuery={searchQ} onDataChange={l=>setMnC(l?.length??null)}/>}
                {nav==="notification"&&<NotificationPage user={user} searchQuery={searchQ} onDataChange={l=>{ setNtC(l?.length??null); setUnread(l?l.filter(n=>!n.isRead).length:null); }}/>}
                {nav==="user-management"&&<UserManagementPage user={user} searchQuery={searchQ}/>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      {logoutOpen&&(
        <div className="logout-modal-overlay" onClick={()=>setLO(false)}>
          <div className="logout-modal" onClick={e=>e.stopPropagation()}>
            <div className="logout-modal-inner">
              <div className="logout-modal-icon"><I.Logout size={20}/></div>
              <h2>Sign out?</h2>
              <p>You'll need to sign in again to access your dashboard.</p>
              <div className="logout-modal-actions">
                <button type="button" className="logout-modal-btn-no" onClick={()=>setLO(false)}>Cancel</button>
                <button type="button" className="logout-modal-btn-yes" onClick={confirmLogout}>Sign out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending approvals */}
      {pamOpen&&(
        <div className="logout-modal-overlay" onClick={()=>setPAM(false)}>
          <div className="logout-modal pending-approvals-modal" onClick={e=>e.stopPropagation()}>
            <header className="pam-header">
              <div className="pam-header-icon"><I.User/></div>
              <div className="pam-header-text">
                <h2 className="pam-title">Pending approvals</h2>
                <p className="pam-sub">Approve or reject new user sign-ups</p>
              </div>
              <span className="pam-badge">{pending.length}</span>
              <button type="button" className="pam-close" aria-label="Close" onClick={()=>setPAM(false)}>✕</button>
            </header>
            <div className="pam-body">
              <ul className="pam-list">
                {pending.map(u=>{
                  const name=[u.firstName,u.lastName].filter(Boolean).join(" ")||u.email||"User";
                  return(
                    <li key={u.id} className="pam-item">
                      <div className="pam-avatar">{(name.charAt(0)||"?").toUpperCase()}</div>
                      <div className="pam-item-info">
                        <span className="pam-item-name">{name}</span>
                        <span className="pam-item-email">{u.email}</span>
                        {u.department&&<div className="pam-item-meta"><span className="pam-item-dept">{String(u.department).replace(/_/g," ")}</span></div>}
                      </div>
                      <div className="pam-item-actions">
                        <select className="pam-role-select" value={pendingRoles[u.id]||"IT"} onChange={e=>setPR(p=>({...p,[u.id]:e.target.value}))} aria-label="Assign role">
                          <option value="ADMIN">Admin</option><option value="IT">IT</option>
                          <option value="FINANCE">Finance</option><option value="SECURITY">Security</option>
                        </select>
                        <button type="button" className="pam-btn pam-btn--approve"
                          onClick={()=>approveUser(u.id,{role:pendingRoles[u.id]||"IT"})
                            .then(()=>{ setPR(p=>{ const n={...p}; delete n[u.id]; return n; }); return getPendingUsers(); })
                            .then(l=>{ setPending(l||[]); loadStats(); if(!(l?.length)) setPAM(false); })
                            .catch(()=>setPending([]))}>Approve</button>
                        <button type="button" className="pam-btn pam-btn--reject"
                          onClick={()=>rejectUser(u.id).then(()=>getPendingUsers())
                            .then(l=>{ setPending(l||[]); loadStats(); if(!(l?.length)) setPAM(false); })
                            .catch(()=>setPending([]))}>Reject</button>
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
      {profileOpen&&(
        <ProfileModal user={du} currentAvatarUrl={avatarUrl} defaultAvatar={defAvatar}
          onClose={()=>setPO(false)}
          onSave={updated=>{ setPU(updated); setUm(false); }}
          onAvatarChange={()=>setAK(k=>k+1)}/>
      )}

      {/* Paste scan */}
      {scanOpen&&!scannedAsset&&(
        <div className="logout-modal-overlay" onClick={()=>setScanOpen(false)}>
          <div className="paste-scan-modal" onClick={e=>e.stopPropagation()}>
            <div className="paste-scan-modal-header">
              <h2>View scanned data</h2>
              <button type="button" className="paste-scan-close" aria-label="Close" onClick={()=>setScanOpen(false)}>✕</button>
            </div>
            <div className="paste-scan-modal-body">
              <p className="paste-scan-hint">Paste the JSON text from your QR scanner to view asset details.</p>
              <textarea className="paste-scan-input" placeholder="Paste JSON here…" value={scanJson} onChange={e=>{ setScanJson(e.target.value); setScanErr(""); }} rows={5}/>
              {scanErr&&<p className="paste-scan-error">{scanErr}</p>}
              <div className="paste-scan-actions">
                <button type="button" className="logout-modal-btn-no" onClick={()=>setScanOpen(false)}>Cancel</button>
                <button type="button" className="logout-modal-btn-yes" onClick={handleScanView}>View asset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {scannedAsset&&<AssetScanView asset={scannedAsset} onClose={()=>setScanned(null)}/>}
    </>
  );
}