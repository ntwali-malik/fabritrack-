import { useRef, useEffect, useState } from "react";

// ── Animated canvas: moving asset nodes on a grid ──────────────────────────
function TrackingCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Grid nodes
    const cols = 8, rows = 6;
    const nodes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({ r, c, pulse: Math.random() * Math.PI * 2 });
      }
    }

    // Moving assets
    const assets = Array.from({ length: 6 }, (_, i) => ({
      fromNode: Math.floor(Math.random() * nodes.length),
      toNode: Math.floor(Math.random() * nodes.length),
      t: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
      color: ["#00e5ff", "#39ff14", "#ff6b35", "#b388ff", "#00e5ff", "#ffd700"][i],
      trail: [],
    }));

    const getNodePos = (node, w, h) => ({
      x: (node.c + 1) * (w / (cols + 1)),
      y: (node.r + 1) * (h / (rows + 1)),
    });

    let t = 0;
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(0,229,255,0.06)";
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = getNodePos(nodes[r * cols + c], w, h);
          if (c < cols - 1) {
            const p2 = getNodePos(nodes[r * cols + c + 1], w, h);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
          if (r < rows - 1) {
            const p2 = getNodePos(nodes[(r + 1) * cols + c], w, h);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      }

      // Nodes
      t += 0.02;
      nodes.forEach((node) => {
        const { x, y } = getNodePos(node, w, h);
        node.pulse += 0.03;
        const pulse = (Math.sin(node.pulse) + 1) / 2;
        // Outer ring
        ctx.beginPath();
        ctx.arc(x, y, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,229,255,${0.1 + pulse * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${0.3 + pulse * 0.4})`;
        ctx.fill();
      });

      // Moving assets
      assets.forEach((a) => {
        a.t += a.speed;
        if (a.t >= 1) {
          a.t = 0;
          a.fromNode = a.toNode;
          let next;
          do { next = Math.floor(Math.random() * nodes.length); } while (next === a.fromNode);
          a.toNode = next;
          a.trail = [];
        }
        const from = getNodePos(nodes[a.fromNode], w, h);
        const to = getNodePos(nodes[a.toNode], w, h);
        const x = from.x + (to.x - from.x) * a.t;
        const y = from.y + (to.y - from.y) * a.t;

        a.trail.push({ x, y });
        if (a.trail.length > 20) a.trail.shift();

        // Trail
        a.trail.forEach((pt, i) => {
          const alpha = (i / a.trail.length) * 0.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = a.color.replace(")", `,${alpha})`).replace("rgb", "rgba").replace("#", "rgba(").replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}),/, (m, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},`);
          // Simpler: just use a fixed rgba
          ctx.fillStyle = `rgba(0,229,255,${alpha * 0.6})`;
          ctx.fill();
        });

        // Asset dot
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = a.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = a.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Scanning line
      const scanY = ((t * 30) % (h + 40)) - 20;
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, "rgba(0,229,255,0.04)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 20, w, 40);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.85 }}
    />
  );
}

// ── Live stat ticker ────────────────────────────────────────────────────────
function LiveStat({ label, value, unit, color }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const iv = setInterval(() => {
      setDisplay(v => v + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3));
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>
        {display.toLocaleString()}<span style={{ fontSize: "1rem", opacity: 0.6 }}>{unit}</span>
      </div>
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(200,230,255,0.5)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Asset status badge ──────────────────────────────────────────────────────
function StatusBadge({ label, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: 6, padding: "4px 10px", fontSize: "0.72rem",
      fontFamily: "'DM Mono', monospace", color, letterSpacing: "0.05em"
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: color,
        boxShadow: `0 0 6px ${color}`, animation: "blink 1.4s ease-in-out infinite"
      }} />
      {label}
    </span>
  );
}

// ── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, delay }) {
  return (
    <div style={{
      background: "rgba(8,20,40,0.7)", border: `1px solid ${accent}25`,
      borderRadius: 16, padding: "32px 28px", backdropFilter: "blur(12px)",
      transition: "transform 0.3s, box-shadow 0.3s",
      animation: `fadeUp 0.6s ease ${delay}s both`,
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 40px ${accent}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ fontSize: "2.2rem", marginBottom: 16 }}>{icon}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#e8f4ff", marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: "0.88rem", color: "rgba(180,210,240,0.65)", lineHeight: 1.65 }}>{desc}</div>
      <div style={{ marginTop: 16, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: 2 }} />
    </div>
  );
}

// ── Main LandingPage ────────────────────────────────────────────────────────
export default function LandingPage({ onLoginClick }) {
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #040d1a; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes scanPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes counterRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes heroEntry {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-title { animation: heroEntry 0.9s cubic-bezier(.16,1,.3,1) 0.2s both; }
        .hero-sub   { animation: heroEntry 0.9s cubic-bezier(.16,1,.3,1) 0.4s both; }
        .hero-cta   { animation: heroEntry 0.9s cubic-bezier(.16,1,.3,1) 0.55s both; }
        .hero-stats { animation: heroEntry 0.9s cubic-bezier(.16,1,.3,1) 0.7s both; }

        button { cursor: pointer; font-family: inherit; }
        a { text-decoration: none; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#040d1a", color: "#e8f4ff", fontFamily: "'Inter', sans-serif" }}>

        {/* ── HEADER ── */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: scrolled ? "rgba(4,13,26,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,229,255,0.1)" : "1px solid transparent",
          transition: "all 0.3s"
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#00e5ff,#0078b4)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
                boxShadow: "0 0 16px rgba(0,229,255,0.4)"
              }}>⬡</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
                Fabri<span style={{ color: "#00e5ff" }}>track</span>
              </span>
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[["About", aboutRef], ["Contact", contactRef]].map(([label, ref]) => (
                <button key={label} onClick={() => scrollTo(ref)} style={{
                  background: "none", border: "none", color: "rgba(200,230,255,0.6)",
                  fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.02em",
                  transition: "color 0.2s", padding: "4px 0"
                }}
                  onMouseEnter={e => e.target.style.color = "#00e5ff"}
                  onMouseLeave={e => e.target.style.color = "rgba(200,230,255,0.6)"}
                >{label}</button>
              ))}
              <button onClick={onLoginClick} style={{
                background: "linear-gradient(135deg,#00e5ff20,#0078b420)",
                border: "1px solid #00e5ff50", color: "#00e5ff",
                padding: "8px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                letterSpacing: "0.03em", transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.target.style.background = "rgba(0,229,255,0.15)"; e.target.style.boxShadow = "0 0 20px rgba(0,229,255,0.2)"; }}
                onMouseLeave={e => { e.target.style.background = "linear-gradient(135deg,#00e5ff20,#0078b420)"; e.target.style.boxShadow = "none"; }}
              >Log in</button>
            </nav>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "120px 32px 80px" }}>
          {/* Animated canvas background */}
          <TrackingCanvas />

          {/* Dark vignette */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, #040d1a 100%)", pointerEvents: "none" }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 10, maxWidth: 740, textAlign: "center" }}>

            {/* Eyebrow */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              <StatusBadge label="LIVE TRACKING" color="#00e5ff" />
              <StatusBadge label="SYSTEM ONLINE" color="#39ff14" />
            </div>

            <h1 className="hero-title" style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em",
              marginBottom: 24
            }}>
              Every asset,<br />
              <span style={{ color: "#00e5ff", textShadow: "0 0 40px rgba(0,229,255,0.5)" }}>tracked in real time.</span>
            </h1>

            <p className="hero-sub" style={{
              fontSize: "1.1rem", color: "rgba(180,210,240,0.7)", lineHeight: 1.7, marginBottom: 40, maxWidth: 540, margin: "0 auto 40px"
            }}>
              Fabritrack gives your organization full visibility over inventory, assignments, movements, and maintenance — with security-grade audit trails.
            </p>

            <div className="hero-cta" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
              <button onClick={onLoginClick} style={{
                background: "linear-gradient(135deg,#00e5ff,#0078b4)",
                border: "none", color: "#040d1a", padding: "14px 34px",
                borderRadius: 10, fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.02em",
                boxShadow: "0 0 30px rgba(0,229,255,0.4)", transition: "all 0.2s"
              }}
                onMouseEnter={e => e.target.style.boxShadow = "0 0 50px rgba(0,229,255,0.6)"}
                onMouseLeave={e => e.target.style.boxShadow = "0 0 30px rgba(0,229,255,0.4)"}
              >Get started →</button>
              <button onClick={() => scrollTo(aboutRef)} style={{
                background: "transparent", border: "1px solid rgba(0,229,255,0.3)",
                color: "rgba(200,230,255,0.8)", padding: "14px 28px",
                borderRadius: 10, fontSize: "0.95rem", fontWeight: 500, transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.target.style.borderColor = "rgba(0,229,255,0.7)"; e.target.style.color = "#00e5ff"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(0,229,255,0.3)"; e.target.style.color = "rgba(200,230,255,0.8)"; }}
              >See how it works</button>
            </div>

            {/* Live stats */}
            <div className="hero-stats" style={{
              display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap",
              padding: "24px 40px", background: "rgba(0,229,255,0.04)",
              border: "1px solid rgba(0,229,255,0.12)", borderRadius: 14, backdropFilter: "blur(10px)"
            }}>
              <LiveStat label="Assets tracked" value={12847} unit="" color="#00e5ff" />
              <div style={{ width: 1, background: "rgba(0,229,255,0.15)" }} />
              <LiveStat label="Active users" value={348} unit="" color="#39ff14" />
              <div style={{ width: 1, background: "rgba(0,229,255,0.15)" }} />
              <LiveStat label="Movements today" value={2103} unit="" color="#b388ff" />
            </div>
          </div>
        </section>

        {/* ── ABOUT / FEATURES ── */}
        <section ref={aboutRef} style={{ padding: "100px 32px", position: "relative", background: "linear-gradient(180deg, #040d1a 0%, #050f20 100%)" }}>
          {/* Subtle grid bg */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
            {/* Section label */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#00e5ff", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                — What we do —
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Built for operations teams<br />
                <span style={{ color: "rgba(180,210,240,0.4)" }}>who can't afford to lose track.</span>
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <FeatureCard icon="📡" title="Real-time asset tracking" desc="Monitor every asset's location, status, and history across all your sites. GPS + QR + RFID support." accent="#00e5ff" delay={0} />
              <FeatureCard icon="🗂" title="Smart inventory management" desc="Categorize, tag, and organize thousands of items. Bulk import, custom fields, and rich filters." accent="#39ff14" delay={0.1} />
              <FeatureCard icon="🔄" title="Assignments & movements" desc="Assign assets to staff, record check-outs and returns, and trace every transfer with a timestamped audit log." accent="#b388ff" delay={0.2} />
              <FeatureCard icon="🔧" title="Maintenance scheduling" desc="Set recurring maintenance, get alerts before deadlines, and track repair history to minimize downtime." accent="#ff6b35" delay={0.3} />
              <FeatureCard icon="🛡" title="Security & audit trails" desc="Immutable logs, theft detection alerts, and role-based access ensure accountability at every level." accent="#ffd700" delay={0.4} />
              <FeatureCard icon="📊" title="Analytics & reporting" desc="Depreciation tracking, utilization reports, and dashboards that surface insights before problems arise." accent="#ff4f9a" delay={0.5} />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: "100px 32px", background: "#040d1a" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#b388ff", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              — Workflow —
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 60 }}>
              From intake to retirement,<br />
              <span style={{ color: "#b388ff" }}>nothing slips through.</span>
            </h2>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { num: "01", title: "Add your assets", desc: "Import via CSV, scan barcodes, or add manually. Set categories, serial numbers, and locations.", color: "#00e5ff" },
                { num: "02", title: "Assign & deploy", desc: "Assign to people or locations. Assets check out and in with every movement logged automatically.", color: "#39ff14" },
                { num: "03", title: "Monitor in real time", desc: "The dashboard shows live status, current holders, and anomalies the moment they occur.", color: "#b388ff" },
                { num: "04", title: "Maintain & secure", desc: "Automated maintenance alerts, depreciation tracking, and theft flags keep your fleet in order.", color: "#ff6b35" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start", padding: "32px 0", borderBottom: i < 3 ? "1px solid rgba(0,229,255,0.07)" : "none", textAlign: "left" }}>
                  <div style={{
                    flexShrink: 0, width: 52, height: 52, borderRadius: 12,
                    background: `${step.color}15`, border: `1px solid ${step.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", fontWeight: 500, color: step.color
                  }}>{step.num}</div>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: 8, color: "#e8f4ff" }}>{step.title}</div>
                    <div style={{ fontSize: "0.9rem", color: "rgba(180,210,240,0.6)", lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section ref={contactRef} style={{ padding: "100px 32px", background: "linear-gradient(180deg, #040d1a, #030b17)" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#ff6b35", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
              — Get in touch —
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20 }}>
              Questions? We're here.
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(180,210,240,0.6)", lineHeight: 1.7, marginBottom: 48 }}>
              Reach out to our team or contact your system administrator for access and onboarding support.
            </p>

            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { label: "Email", value: "support@fabritrack.com", icon: "✉", href: "mailto:support@fabritrack.com", color: "#00e5ff" },
                { label: "Admin support", value: "Contact your administrator", icon: "🔐", href: null, color: "#b388ff" },
              ].map((item) => (
                <div key={item.label} style={{
                  flex: "1 1 220px", background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)",
                  borderRadius: 14, padding: "28px 24px", backdropFilter: "blur(10px)"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>{item.icon}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(180,210,240,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                  {item.href
                    ? <a href={item.href} style={{ color: item.color, fontWeight: 600, fontSize: "0.9rem" }}>{item.value}</a>
                    : <span style={{ color: "rgba(180,210,240,0.6)", fontSize: "0.9rem" }}>{item.value}</span>
                  }
                </div>
              ))}
            </div>

            <button onClick={onLoginClick} style={{
              marginTop: 48, background: "linear-gradient(135deg,#00e5ff,#0078b4)",
              border: "none", color: "#040d1a", padding: "16px 40px",
              borderRadius: 10, fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em",
              boxShadow: "0 0 30px rgba(0,229,255,0.35)", transition: "all 0.2s"
            }}
              onMouseEnter={e => e.target.style.boxShadow = "0 0 50px rgba(0,229,255,0.55)"}
              onMouseLeave={e => e.target.style.boxShadow = "0 0 30px rgba(0,229,255,0.35)"}
            >Start tracking your assets →</button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: "28px 32px", borderTop: "1px solid rgba(0,229,255,0.08)", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "rgba(180,210,240,0.3)", letterSpacing: "0.05em" }}>
            © {new Date().getFullYear()} Fabritrack — Asset Tracking & Management
          </div>
        </footer>

      </div>
    </>
  );
}