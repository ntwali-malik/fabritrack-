const DEFAULT_CONTACT = {
  address: "KG 18 Ave, Kigali",
  phone: "+250788601280",
  email: "info@fabritech.rw",
  website: "www.fabritech.rw",
};

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default function ReportHeader({ companyName = "FABRITRACK", contact = DEFAULT_CONTACT }) {
  const c = { ...DEFAULT_CONTACT, ...contact };
  const logoSrc = typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png";

  return (
    <div className="report-header" data-report-header>
      <div className="report-header-top">
        <div className="report-header-brand">
          <img src={logoSrc} alt="" className="report-header-logo" />
        </div>
        <div className="report-header-contact">
          <div className="report-header-contact-item">{c.address}</div>
          <div className="report-header-contact-item">
            <IconPhone />
            <span>{c.phone}</span>
          </div>
          <div className="report-header-contact-item">
            <IconMail />
            <span>{c.email}</span>
          </div>
          <div className="report-header-contact-item">
            <IconGlobe />
            <span>{c.website}</span>
          </div>
        </div>
      </div>
      <div className="report-header-bar">
        <span className="report-header-bar-left" />
        <span className="report-header-bar-right" />
      </div>

      <div className="report-header-company-bottom">{companyName}</div>
    </div>
  );
}
