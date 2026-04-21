import { useState, useEffect, useRef, useCallback } from "react";

const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#07070f;--bg2:#0e0e1c;--bg3:#15152a;
  --text:#f0eeff;--muted:#9898b8;--faint:#50506a;
  --accent:#7c6af7;--accent-light:#b8acff;--accent-dim:rgba(124,106,247,0.1);--accent-border:rgba(124,106,247,0.28);
  --border:#1c1c30;--border2:#262640;
  --high:#f87171;--med:#fbbf24;--low:#34d399;
  --high-bg:rgba(248,113,113,0.09);--med-bg:rgba(251,191,36,0.09);--low-bg:rgba(52,211,153,0.09);
  --book:#f4a261;--course:#48cae4;--app:#a8dadc;--web:#e9c46a;--comm:#c77dff;
}
html,body{height:100%;background:var(--bg);}
body{font-family:'DM Sans',sans-serif;color:var(--text);overflow-x:hidden;-webkit-font-smoothing:antialiased;}
#root{min-height:100vh;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}
.skip-link:focus{position:fixed;left:0;top:0;width:auto;height:auto;overflow:visible;background:var(--accent);color:#fff;padding:8px 16px;z-index:9999;}

@media(prefers-reduced-motion:no-preference){
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.7)}50%{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
  @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-18px)}}
  @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,28px)}}
  @keyframes cursorBlink{0%,49%{opacity:1}50%,99%{opacity:0}100%{opacity:1}}
  @keyframes barGrow{from{width:0}to{width:var(--target-width)}}
  @keyframes hexPop{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
  @keyframes radarDraw{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
  @keyframes countUp{from{opacity:0}to{opacity:1}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
}
button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px;}
textarea:focus{outline:2px solid var(--accent-border);}
.section{animation:fadeUp 0.45s ease both;}
.section:nth-child(2){animation-delay:0.06s;}
.section:nth-child(3){animation-delay:0.12s;}
.section:nth-child(4){animation-delay:0.18s;}
.section:nth-child(5){animation-delay:0.24s;}
.section:nth-child(6){animation-delay:0.3s;}
.section:nth-child(7){animation-delay:0.36s;}
.section:nth-child(8){animation-delay:0.42s;}
.section:nth-child(9){animation-delay:0.48s;}
`;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function useReducedMotion() {
  const [r, setR] = useState(() => typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion:reduce)").matches : false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion:reduce)");
    const h = (e) => setR(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return r;
}

const sc = (s) => s >= 70 ? "var(--low)" : s >= 45 ? "var(--med)" : "var(--high)";
const svc = (s) => s === "high" ? "var(--high)" : s === "medium" ? "var(--med)" : "var(--low)";
const svbg = (s) => s === "high" ? "var(--high-bg)" : s === "medium" ? "var(--med-bg)" : "var(--low-bg)";
const svl = (s) => s === "high" ? "High Risk" : s === "medium" ? "Medium" : "Low Risk";

const Icons = {
  back: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  challenge: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2L16 15H2L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 8v3M9 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  upside: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15V3M3 9l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  needs: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  plan: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6h6M6 9h4M6 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  mindset: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 11.5C6.5 13.5 11.5 13.5 11.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  tools: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M14 4l-4 4M3 15l5-5M10 4a3 3 0 104 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="5" cy="13" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  tips: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2a5 5 0 014 8l-1 1v2H6v-2L5 10a5 5 0 014-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  time: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  money: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>,
  skill: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  external: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 1h3v3M11 1L6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  book: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="1" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h4M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M12 3h2v12H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  course: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 7l4 1.5L6 10V7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="currentColor"/></svg>,
  app: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  web: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M2 8h12M8 2c-1.5 2-2 4-2 6s.5 4 2 6M8 2c1.5 2 2 4 2 6s-.5 4-2 6" stroke="currentColor" strokeWidth="1.2"/></svg>,
  community: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2.5 1.8-4 4-4s4 1.5 4 4M9 13c0-2 1.3-3 3-3s3 1 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 14h14M4 14V9M8 14V5M12 14V7M16 14V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  radar: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><polygon points="9,2 16,7 13,15 5,15 2,7" stroke="currentColor" strokeWidth="1.4" fill="none"/><polygon points="9,5 13,8 11,13 7,13 5,8" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/><path d="M9 9L9 2M9 9L16 7M9 9L13 15M9 9L5 15M9 9L2 7" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/></svg>,
  flag: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 2l10 4-10 4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M2 13V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  resources: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 4h12M3 9h8M3 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="13" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M17 16l-1.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
};

function ScoreRing({ score }) {
  const reduced = useReducedMotion();
  const [anim, setAnim] = useState(reduced ? score : 0);
  const raf = useRef(null);
  const to = useRef(null);
  useEffect(() => {
    if (reduced) { setAnim(score); return; }
    const start = Date.now(), dur = 1600;
    const step = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setAnim(Math.round(e * score));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    to.current = setTimeout(() => { raf.current = requestAnimationFrame(step); }, 200);
    return () => { clearTimeout(to.current); cancelAnimationFrame(raf.current); };
  }, [score, reduced]);
  const r = 52, circ = 2 * Math.PI * r, arc = circ * 0.75;
  const filled = arc * (anim / 100);
  const color = sc(score);
  const label = score >= 70 ? "Achievable" : score >= 45 ? "Challenging" : "Very Hard";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
      role="img" aria-label={`Reality score: ${score}/100 — ${label}`}>
      <svg width="140" height="100" viewBox="0 0 140 100" aria-hidden="true">
        <circle cx="70" cy="75" r={r} fill="none" stroke="var(--border2)" strokeWidth="6"
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" transform="rotate(135 70 75)"/>
        <circle cx="70" cy="75" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          transform="rotate(135 70 75)"
          style={{ transition: reduced ? "none" : "stroke-dasharray 0.03s linear", filter: `drop-shadow(0 0 8px ${color === "var(--low)" ? "#34d39955" : color === "var(--med)" ? "#fbbf2455" : "#f8717155"})` }}/>
        <text x="70" y="72" textAnchor="middle" fill={color} fontSize="32" fontFamily="'DM Sans',sans-serif" fontWeight="600">{anim}</text>
        <text x="70" y="88" textAnchor="middle" fill="var(--faint)" fontSize="8" fontFamily="'DM Sans',sans-serif" letterSpacing="2">REALITY SCORE</text>
      </svg>
      <span style={{ fontSize: "12px", color, fontWeight: "600", letterSpacing: "0.5px" }}>{label}</span>
    </div>
  );
}

// Hexagon chart for severity distribution
function HexagonChart({ challenges }) {
  const reduced = useReducedMotion();
  const high = challenges.filter(c => c.severity === "high").length;
  const med = challenges.filter(c => c.severity === "medium").length;
  const low = challenges.filter(c => c.severity === "low").length;
  const total = challenges.length;
  if (total === 0) return null;

  const hexPath = (cx, cy, size) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
    }
    return `M${pts.join("L")}Z`;
  };

  const items = [
    { count: high, label: "High Risk", color: "var(--high)", bg: "var(--high-bg)", cx: 40, cy: 44 },
    { count: med, label: "Medium", color: "var(--med)", bg: "var(--med-bg)", cx: 110, cy: 44 },
    { count: low, label: "Low Risk", color: "var(--low)", bg: "var(--low-bg)", cx: 75, cy: 88 },
  ];

  return (
    <div style={{ margin: "16px 0 8px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 16px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "2.5px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "16px" }}>Challenge Distribution</div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        <svg width="150" height="130" viewBox="0 0 150 130" aria-hidden="true" style={{ flexShrink: 0 }}>
          {items.map((item, i) => (
            <g key={i} style={{ animation: reduced ? "none" : `hexPop 0.4s ${i * 0.12}s ease both` }}>
              <path d={hexPath(item.cx, item.cy, 30)} fill={item.bg} stroke={item.color} strokeWidth="1.5" opacity="0.9"/>
              <text x={item.cx} y={item.cy - 4} textAnchor="middle" fill={item.color} fontSize="18" fontFamily="'DM Sans',sans-serif" fontWeight="700">{item.count}</text>
              <text x={item.cx} y={item.cy + 12} textAnchor="middle" fill={item.color} fontSize="7.5" fontFamily="'DM Sans',sans-serif" letterSpacing="0.5" opacity="0.8">{item.label.toUpperCase()}</text>
            </g>
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: "var(--faint)", width: "56px", flexShrink: 0 }}>{item.label}</span>
              <div style={{ flex: 1, height: "6px", background: "var(--border2)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: item.color, borderRadius: "3px",
                  width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                  transition: reduced ? "none" : "width 0.8s ease",
                  boxShadow: `0 0 6px ${item.color}66`
                }}/>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "600", color: item.color, width: "20px", textAlign: "right" }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skill difficulty radar/bar chart
function SkillBreakdownChart({ skills }) {
  const reduced = useReducedMotion();
  if (!skills || skills.length === 0) return null;

  return (
    <div style={{ margin: "16px 0 8px", background: "var(--bg2)", border: "1px solid var(--accent-border)", borderRadius: "12px", padding: "20px 16px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "2.5px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "16px" }}>Skill Difficulty Breakdown</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {skills.map((s, i) => {
          const pct = (s.difficulty / 10) * 100;
          const color = s.difficulty >= 8 ? "var(--high)" : s.difficulty >= 5 ? "var(--med)" : "var(--low)";
          return (
            <div key={i} style={{ animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.08}s ease both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{s.skill}</span>
                  {s.description && <span style={{ fontSize: "11px", color: "var(--faint)", marginLeft: "8px" }}>{s.description}</span>}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--faint)" }}>{s.timeWeeks}w</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color }}>{s.difficulty}/10</span>
                </div>
              </div>
              <div style={{ height: "7px", background: "var(--border2)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`,
                  borderRadius: "4px", width: `${pct}%`,
                  transition: reduced ? "none" : `width 0.9s ${i * 0.1}s cubic-bezier(0.22,1,0.36,1)`,
                  boxShadow: `0 0 8px ${color}44`
                }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Radar chart for requirements dimensions
function RequirementsRadar({ req, score }) {
  const reduced = useReducedMotion();
  if (!req) return null;

  // Parse time to a 0-10 scale
  const parseTime = (t) => {
    if (!t) return 5;
    const n = parseInt(t);
    if (isNaN(n)) return 5;
    if (n <= 2) return 2; if (n <= 5) return 4; if (n <= 10) return 6; if (n <= 20) return 8; return 10;
  };
  const parseMoney = (m) => {
    if (!m || m.toLowerCase().includes("minimal") || m.includes("0")) return 1;
    const n = parseInt(m.replace(/[$,]/g, ""));
    if (isNaN(n)) return 4;
    if (n < 100) return 2; if (n < 500) return 4; if (n < 2000) return 6; if (n < 10000) return 8; return 10;
  };

  const dims = [
    { label: "Time", val: parseTime(req.time), color: "var(--accent-light)" },
    { label: "Money", val: parseMoney(req.money), color: "var(--med)" },
    { label: "Skills", val: Math.min((req.skills?.length || 0) * 2 + 1, 10), color: "var(--low)" },
    { label: "Difficulty", val: Math.round((100 - score) / 10), color: "var(--high)" },
  ];

  const cx = 80, cy = 80, maxR = 55;
  const total = dims.length;
  const pts = dims.map((d, i) => {
    const angle = (2 * Math.PI * i / total) - Math.PI / 2;
    const r = (d.val / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const gridLevels = [0.3, 0.6, 1.0];
  const labelPts = dims.map((d, i) => {
    const angle = (2 * Math.PI * i / total) - Math.PI / 2;
    const r = maxR + 18;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <div style={{ margin: "16px 0 8px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 16px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "2.5px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "16px" }}>Requirements Overview</div>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true" style={{ flexShrink: 0, animation: reduced ? "none" : "radarDraw 0.6s ease" }}>
          {gridLevels.map((lv, li) => {
            const gpts = dims.map((_, i) => {
              const angle = (2 * Math.PI * i / total) - Math.PI / 2;
              const r = lv * maxR;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            }).join(" ");
            return <polygon key={li} points={gpts} fill="none" stroke="var(--border2)" strokeWidth="1" opacity={0.8 - li * 0.2}/>;
          })}
          {dims.map((_, i) => {
            const angle = (2 * Math.PI * i / total) - Math.PI / 2;
            return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke="var(--border)" strokeWidth="1"/>;
          })}
          <polygon points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1.5" opacity="0.9"/>
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={dims[i].color}/>)}
          {labelPts.map((p, i) => (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="var(--muted)" fontSize="9.5" fontFamily="'DM Sans',sans-serif">{dims[i].label}</text>
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          {dims.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: d.color, flexShrink: 0 }}/>
              <span style={{ fontSize: "12px", color: "var(--muted)", flex: 1 }}>{d.label}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: d.color }}>{d.val}/10</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dots() {
  const reduced = useReducedMotion();
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }} role="status" aria-label="Loading">
      {[0,1,2].map(i => (
        <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)",
          display: "block", animation: reduced ? "none" : `pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>
      ))}
    </div>
  );
}

const PHASES = ["Analyzing your idea…","Detecting your intent…","Cutting through the hype…","Finding real obstacles…","Weighing the risks…","Calculating reality score…","Searching for best resources…","Building your 30-day plan…","Almost done…"];

function LoadingPage({ question }) {
  const [ph, setPh] = useState(0);
  const [prog, setProg] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    const pi = setInterval(() => setPh(p => (p+1) % PHASES.length), 1700);
    const pgi = setInterval(() => setProg(p => Math.min(p + Math.random() * 2.5, 91)), 180);
    return () => { clearInterval(pi); clearInterval(pgi); };
  }, []);
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
        <div style={{ padding: "20px 24px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", width: "100%", animation: reduced ? "none" : "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "10px" }}>Analyzing</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "17px", fontStyle: "italic", color: "var(--text)", lineHeight: 1.5, opacity: 0.9 }}>
            "{question.length > 85 ? question.slice(0, 85) + "…" : question}"
          </div>
        </div>
        <Dots />
        <div aria-live="polite" aria-atomic="true" key={ph} style={{ fontSize: "13px", color: "var(--muted)", animation: reduced ? "none" : "fadeIn 0.4s ease" }}>{PHASES[ph]}</div>
        <div style={{ width: "100%", height: "1px", background: "var(--border)", borderRadius: "1px", overflow: "hidden" }}
          role="progressbar" aria-valuenow={Math.round(prog)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ height: "100%", width: `${prog}%`, background: "var(--accent)", transition: "width 0.3s ease" }}/>
        </div>
      </div>
    </main>
  );
}

const DEPTHS = [
  { id: "quick", label: "Quick", desc: "3–4 challenges" },
  { id: "standard", label: "Standard", desc: "5–6 challenges" },
  { id: "deep", label: "Deep Dive", desc: "7–8 challenges" },
];

function InputPage({ question, setQuestion, depth, setDepth, onSubmit, onBack, error }) {
  const ref = useRef(null);
  const errRef = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => { if (error) errRef.current?.focus(); }, [error]);
  const can = !!question.trim();
  const hint = isMac ? "Cmd+Enter" : "Ctrl+Enter";
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
      <div style={{ width: "100%", maxWidth: "540px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", padding: "0", alignSelf: "flex-start", minHeight: "44px" }}>
          {Icons.back} Back
        </button>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "12px" }}>Reality Check</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(26px,6vw,36px)", fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
            What are you thinking of <em style={{ color: "var(--accent-light)", fontStyle: "italic" }}>starting?</em>
          </h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="q" style={{ fontSize: "13px", color: "var(--muted)" }}>Describe your idea</label>
          <textarea id="q" ref={ref} value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (isMac ? e.metaKey : e.ctrlKey) && can) onSubmit(); }}
            maxLength={600}
            aria-describedby={error ? "q-err" : "q-hint"}
            placeholder="e.g. I want to learn Python, start a dropshipping store, become a YouTuber, get to 10% body fat..."
            style={{ width: "100%", minHeight: "120px", padding: "14px 16px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "10px", color: "var(--text)", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6, resize: "vertical" }}/>
          {error && <p id="q-err" ref={errRef} tabIndex={-1} style={{ fontSize: "13px", color: "var(--high)", padding: "10px 14px", background: "var(--high-bg)", borderRadius: "8px" }}>{error}</p>}
          {!error && <p id="q-hint" style={{ fontSize: "12px", color: "var(--faint)" }}>Press {hint} to analyze</p>}
        </div>
        <div>
          <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "10px" }}>Analysis depth</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {DEPTHS.map(d => (
              <button key={d.id} onClick={() => setDepth(d.id)}
                style={{ flex: 1, padding: "10px 12px", background: depth === d.id ? "var(--accent-dim)" : "var(--bg2)", border: `1px solid ${depth === d.id ? "var(--accent-border)" : "var(--border)"}`, borderRadius: "8px", color: depth === d.id ? "var(--accent-light)" : "var(--muted)", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Sans',sans-serif", textAlign: "center", transition: "all 0.15s" }}>
                <div style={{ fontWeight: 600, marginBottom: "2px" }}>{d.label}</div>
                <div style={{ fontSize: "10px", opacity: 0.7 }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <button onClick={onSubmit} disabled={!can}
          style={{ padding: "16px 32px", background: can ? "var(--accent-dim)" : "transparent", border: `1px solid ${can ? "var(--accent-border)" : "var(--border)"}`, borderRadius: "10px", color: can ? "var(--accent-light)" : "var(--faint)", fontSize: "14px", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: can ? "pointer" : "default", transition: "all 0.2s", minHeight: "52px", opacity: can ? 1 : 0.5 }}>
          Get reality check →
        </button>
      </div>
    </main>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px", ...style }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--border)", margin: "2px 0" }}/>;
}

function SectionHeader({ icon, title, subtitle, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
      <span style={{ color: "var(--accent)", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", letterSpacing: "0.2px" }}>{title}</h2>
          {badge && <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1px", color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase" }}>{badge}</span>}
        </div>
        {subtitle && <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "1px" }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function ScoreSection({ r }) {
  return (
    <div className="section">
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <ScoreRing score={r.realityScore} />
        <div style={{ flex: 1, minWidth: "200px", paddingTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "18px" }}>{r.categoryEmoji}</span>
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--faint)", textTransform: "uppercase" }}>{r.intentLabel || r.category}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: sc(r.realityScore), marginTop: "2px" }}>{r.scoreLabel}</div>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(15px,3vw,18px)", fontStyle: "italic", lineHeight: 1.7, color: "rgba(240,238,252,0.88)" }}>{r.verdict}</p>
          {r.timeToCompetence && (
            <div style={{ marginTop: "12px", padding: "8px 12px", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", borderRadius: "8px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--accent)", textTransform: "uppercase" }}>Time to competence: </span>
              <span style={{ fontSize: "12px", color: "var(--accent-light)", fontWeight: 600 }}>{r.timeToCompetence}</span>
            </div>
          )}
        </div>
      </div>
      {r.successFactors?.length > 0 && (
        <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "7px" }}>
          {r.successFactors.map((f, i) => (
            <span key={i} style={{ padding: "4px 11px", borderRadius: "99px", background: "var(--low-bg)", border: "1px solid rgba(52,211,153,0.2)", color: "var(--low)", fontSize: "11px" }}>{f}</span>
          ))}
        </div>
      )}
      {r.redFlags?.length > 0 && (
        <div style={{ marginTop: "10px", padding: "12px 14px", background: "var(--high-bg)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ color: "var(--high)" }}>{Icons.flag}</span>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "var(--high)", textTransform: "uppercase" }}>Red Flags</span>
          </div>
          <ul style={{ paddingLeft: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
            {r.redFlags.map((f, i) => (
              <li key={i} style={{ fontSize: "12px", color: "rgba(248,113,113,0.85)", lineHeight: 1.5, display: "flex", gap: "7px" }}>
                <span style={{ flexShrink: 0 }}>·</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChallengesSection({ challenges }) {
  if (!challenges?.length) return null;
  const sorted = [...challenges].sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 };
    return o[a.severity] - o[b.severity];
  });
  return (
    <div className="section">
      <SectionHeader icon={Icons.challenge} title="Key Challenges" subtitle={`${challenges.length} obstacles to expect`} />
      <HexagonChart challenges={challenges} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
        {sorted.map((c, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${svc(c.severity)}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{c.title}</span>
              <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.8px", color: svc(c.severity), background: svbg(c.severity), padding: "3px 8px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0 }}>{svl(c.severity)}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{c.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UpsideSection({ opportunities }) {
  if (!opportunities?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.upside} title="Real Opportunities" subtitle="Genuine upside if you execute well" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {opportunities.map((o, i) => (
          <Card key={i}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--low)", marginBottom: "7px" }}>{o.title}</div>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{o.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NeedsSection({ req, score, skillBreakdown }) {
  if (!req) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.needs} title="What You'll Need" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Card style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1, minWidth: "160px" }}>
            <span style={{ color: "var(--accent-light)" }}>{Icons.time}</span>
            <div>
              <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Time</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{req.time}</div>
            </div>
          </Card>
          <Card style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1, minWidth: "160px" }}>
            <span style={{ color: "var(--med)" }}>{Icons.money}</span>
            <div>
              <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Investment</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{req.money}</div>
            </div>
          </Card>
        </div>
        {req.skills?.length > 0 && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ color: "var(--low)" }}>{Icons.skill}</span>
              <span style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Skills needed</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {req.skills.map((s, i) => (
                <span key={i} style={{ padding: "5px 12px", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent-light)", fontSize: "12px", fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </Card>
        )}
        <RequirementsRadar req={req} score={score} />
        <SkillBreakdownChart skills={skillBreakdown} />
      </div>
    </div>
  );
}

function PlanSection({ plan }) {
  if (!plan?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.plan} title="30-Day Action Plan" subtitle="Your concrete first steps" />
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {plan.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--accent-light)", marginTop: "2px" }}>{i+1}</div>
              {i < plan.length - 1 && <div style={{ width: "1px", flex: 1, background: "var(--border)", margin: "4px 0" }}/>}
            </div>
            <div style={{ paddingBottom: i < plan.length - 1 ? "20px" : "0", paddingTop: "2px", flex: 1 }}>
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "3px" }}>{p.phase}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "5px" }}>{p.focus}</div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{p.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MindsetSection({ mindset }) {
  if (!mindset) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.mindset} title="The Mindset Shift" />
      <Card style={{ borderLeft: "3px solid var(--accent-border)" }}>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(15px,3vw,18px)", fontStyle: "italic", lineHeight: 1.75, color: "rgba(240,238,252,0.85)" }}>{mindset}</p>
      </Card>
    </div>
  );
}

function ResourceLink({ url, children, color }) {
  if (!url) return <span style={{ color: "var(--faint)", fontSize: "12px" }}>{children}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: color || "var(--accent-light)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
      {children} <span style={{ opacity: 0.6 }}>{Icons.external}</span>
    </a>
  );
}

function ResourceBadge({ free, platform }) {
  if (platform) {
    return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(72,202,228,0.12)", color: "var(--course)", border: "1px solid rgba(72,202,228,0.2)", fontWeight: 600, letterSpacing: "0.5px" }}>{platform}</span>;
  }
  if (free === true) return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "var(--low-bg)", color: "var(--low)", fontWeight: 600 }}>FREE</span>;
  if (free === false) return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "var(--med-bg)", color: "var(--med)", fontWeight: 600 }}>PAID</span>;
  return null;
}

function ResourcesSection({ resources, intent }) {
  const [tab, setTab] = useState(null);
  if (!resources) return null;

  const tabs = [
    { key: "books", label: "Books", icon: Icons.book, color: "var(--book)", data: resources.books },
    { key: "courses", label: "Courses", icon: Icons.course, color: "var(--course)", data: resources.courses },
    { key: "apps", label: "Apps", icon: Icons.app, color: "var(--app)", data: resources.apps },
    { key: "websites", label: "Websites", icon: Icons.web, color: "var(--web)", data: resources.websites },
    { key: "communities", label: "Community", icon: Icons.community, color: "var(--comm)", data: resources.communities },
  ].filter(t => t.data?.length > 0);

  if (tabs.length === 0) return null;

  const activeTab = tab || tabs[0].key;
  const activeData = tabs.find(t => t.key === activeTab);

  return (
    <div className="section">
      <SectionHeader icon={Icons.resources} title="Resources & Learning" subtitle="Curated for your exact goal" />
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "8px", border: `1px solid ${activeTab === t.key ? t.color + "44" : "var(--border)"}`, background: activeTab === t.key ? t.color + "14" : "var(--bg2)", color: activeTab === t.key ? t.color : "var(--faint)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
            <span>{t.icon}</span>{t.label}
            <span style={{ fontSize: "10px", opacity: 0.7 }}>({t.data.length})</span>
          </button>
        ))}
      </div>
      {activeData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activeData.key === "books" && activeData.data.map((b, i) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "5px" }}>
                <div>
                  <ResourceLink url={b.url} color="var(--book)">{b.title}</ResourceLink>
                  {b.author && <span style={{ fontSize: "11px", color: "var(--faint)", marginLeft: "6px" }}>by {b.author}</span>}
                </div>
                <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", background: "rgba(244,162,97,0.12)", color: "var(--book)", flexShrink: 0, fontWeight: 600 }}>BOOK</span>
              </div>
              {b.why && <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{b.why}</p>}
            </Card>
          ))}
          {activeData.key === "courses" && activeData.data.map((c, i) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "5px" }}>
                <ResourceLink url={c.url} color="var(--course)">{c.name}</ResourceLink>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                  <ResourceBadge platform={c.platform} />
                  <ResourceBadge free={c.free} />
                </div>
              </div>
              {c.why && <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{c.why}</p>}
            </Card>
          ))}
          {activeData.key === "apps" && activeData.data.map((a, i) => (
            <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>
                  <ResourceLink url={a.url} color="var(--app)">{a.name}</ResourceLink>
                  <ResourceBadge free={a.free} />
                </div>
                {a.purpose && <p style={{ fontSize: "12px", color: "var(--faint)", lineHeight: 1.4 }}>{a.purpose}</p>}
              </div>
            </Card>
          ))}
          {activeData.key === "websites" && activeData.data.map((w, i) => (
            <Card key={i}>
              <div style={{ marginBottom: "4px" }}>
                <ResourceLink url={w.url} color="var(--web)">{w.name}</ResourceLink>
              </div>
              {w.why && <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{w.why}</p>}
            </Card>
          ))}
          {activeData.key === "communities" && activeData.data.map((c, i) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "4px" }}>
                <ResourceLink url={c.url} color="var(--comm)">{c.name}</ResourceLink>
                {c.platform && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", background: "rgba(199,125,255,0.12)", color: "var(--comm)", fontWeight: 600, flexShrink: 0 }}>{c.platform}</span>}
              </div>
              {c.why && <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{c.why}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsPage({ results: r, question, onAgain }) {
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const copyAll = async () => {
    const t = `BeforeUstart Reality Check\n"${question}"\n\nScore: ${r.realityScore}/100\nVerdict: ${r.verdict}\n\nChallenges:\n${(r.challenges||[]).map((c,i)=>`${i+1}. [${c.severity?.toUpperCase()}] ${c.title}: ${c.detail}`).join("\n")}\n\nOpportunities:\n${(r.opportunities||[]).map((o,i)=>`${i+1}. ${o.title}: ${o.detail}`).join("\n")}\n\nTime: ${r.requirements?.time}\nMoney: ${r.requirements?.money}\nSkills: ${(r.requirements?.skills||[]).join(", ")}\n\nMindset:\n${r.mindset}`;
    try { await navigator.clipboard.writeText(t); }
    catch {
      const el = document.createElement("textarea");
      el.value = t; el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(7,7,15,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <button onClick={onAgain} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", minHeight: "44px", minWidth: "44px" }}>
          {Icons.back} New check
        </button>
        <span style={{ fontSize: "12px", color: "var(--faint)", flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.intentLabel || r.category}</span>
        <button onClick={copyAll} aria-label={copied ? "Copied" : "Copy results"}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: "7px", padding: "7px 13px", color: copied ? "var(--low)" : "var(--faint)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "6px", minHeight: "36px", transition: "color 0.2s" }}>
          {copied ? Icons.check : Icons.copy}
          {copied ? "Copied" : "Copy"}
        </button>
      </header>

      <main id="main-content" style={{ maxWidth: "640px", margin: "0 auto", padding: "28px 20px 80px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <ScoreSection r={r} />
        <Divider />
        <ChallengesSection challenges={r.challenges || []} />
        <Divider />
        <UpsideSection opportunities={r.opportunities} />
        <Divider />
        <NeedsSection req={r.requirements} score={r.realityScore} skillBreakdown={r.skillBreakdown} />
        <Divider />
        <PlanSection plan={r.plan} />
        <Divider />
        <MindsetSection mindset={r.mindset} />
        <Divider />
        <ResourcesSection resources={r.resources} intent={r.intent} />
      </main>
    </div>
  );
}

function HistoryPanel({ history, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = panelRef.current?.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!els?.length) return;
        const first = els[0], last = els[els.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", h);
    return () => { document.removeEventListener("keydown", h); prev?.focus(); };
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}/>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Past checks"
        style={{ position: "relative", width: "300px", maxWidth: "90vw", height: "100%", background: "var(--bg2)", borderLeft: "1px solid var(--border)", padding: "24px", overflowY: "auto", animation: "slideIn 0.25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Past checks</span>
          <button ref={closeRef} onClick={onClose} aria-label="Close panel"
            style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: "20px", lineHeight: 1, minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {history.length === 0
          ? <p style={{ color: "var(--faint)", fontSize: "13px" }}>No checks yet.</p>
          : <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.map(h => (
                <div key={h.id} style={{ padding: "12px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.4, flex: 1 }}>{h.question}</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: sc(h.score), flexShrink: 0 }}>{h.score}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--faint)" }}>{h.date}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

function HomePage({ onStart, history, onHist }) {
  const reduced = useReducedMotion();
  const TITLE = "BeforeUstart";
  const [typed, setTyped] = useState(reduced ? TITLE.length : 0);
  const [showCursor, setShowCursor] = useState(!reduced);
  const [showLabel, setShowLabel] = useState(reduced);
  const [showSub, setShowSub] = useState(reduced);
  const [showBadges, setShowBadges] = useState(reduced);
  const [showBtn, setShowBtn] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const timers = [];
    timers.push(setTimeout(() => setShowLabel(true), 200));
    TITLE.split("").forEach((_, i) => {
      timers.push(setTimeout(() => setTyped(i + 1), 480 + i * 62));
    });
    const doneAt = 480 + (TITLE.length - 1) * 62;
    timers.push(setTimeout(() => setShowSub(true), doneAt + 280));
    timers.push(setTimeout(() => setShowBadges(true), doneAt + 520));
    timers.push(setTimeout(() => setShowCursor(false), doneAt + 700));
    timers.push(setTimeout(() => setShowBtn(true), doneAt + 820));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const BADGES = ["No sugarcoating", "Smart detection", "Honest by design"];

  const tr = (show, delay = "0s") => ({
    opacity: show ? 1 : 0,
    transform: show ? "translateY(0)" : "translateY(14px)",
    transition: reduced ? "none" : `opacity 0.55s ${delay} ease, transform 0.55s ${delay} ease`,
  });

  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 24px" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "15%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(124,106,247,0.12) 0%,transparent 70%)", filter: "blur(60px)", animation: reduced ? "none" : "orb1 10s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,rgba(124,106,247,0.07) 0%,transparent 70%)", filter: "blur(60px)", animation: reduced ? "none" : "orb2 13s ease-in-out infinite" }}/>
      </div>

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "560px" }}>
        <div style={{ marginBottom: "20px", ...tr(showLabel) }}>
          <span style={{ fontSize: "10px", letterSpacing: "5px", color: "var(--faint)", textTransform: "uppercase" }}>A Reality Check Tool</span>
        </div>

        <h1 aria-label="BeforeUstart" style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(52px,14vw,88px)", fontWeight: 400, letterSpacing: "-2px", lineHeight: 1, marginBottom: "28px", display: "flex", alignItems: "baseline" }}>
          <span>{TITLE.slice(0, typed)}</span>
          {showCursor && (
            <span aria-hidden="true" style={{ display: "inline-block", width: "3px", height: "0.82em", background: "var(--accent-light)", marginLeft: "4px", verticalAlign: "baseline", borderRadius: "1px", animation: reduced ? "none" : "cursorBlink 0.85s step-start infinite" }} />
          )}
        </h1>

        <p style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 300, lineHeight: 1.75, maxWidth: "400px", marginBottom: "32px", ...tr(showSub) }}>
          Before you leap — know what you're actually jumping into. Detects your intent. Recommends books, courses, and tools. No fluff. Just reality.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "40px" }}>
          {BADGES.map((b, i) => (
            <span key={b} style={{
              padding: "9px 18px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)", fontSize: "13px", color: "var(--muted)", fontWeight: 400,
              display: "inline-flex", alignItems: "center", gap: "7px",
              opacity: showBadges ? 1 : 0, transform: showBadges ? "translateY(0)" : "translateY(10px)",
              transition: reduced ? "none" : `opacity 0.5s ${i * 0.1}s ease, transform 0.5s ${i * 0.1}s ease`,
            }}>
              {b}<span aria-hidden="true" style={{ color: "var(--accent)", fontSize: "7px" }}>&#9670;</span>
            </span>
          ))}
        </div>

        <div style={{ ...tr(showBtn) }}>
          <button onClick={onStart}
            style={{ width: "100%", padding: "18px 40px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "14px", color: "var(--accent-light)", fontSize: "15px", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", minHeight: "56px", letterSpacing: "0.2px" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent-border)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "transparent"; }}>
            Ask the real question &rarr;
          </button>
          {history.length > 0 && (
            <button onClick={onHist} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "var(--faint)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", letterSpacing: "1px", textTransform: "uppercase", minHeight: "44px" }}>
              {history.length} past check{history.length !== 1 ? "s" : ""} &rarr;
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState("standard");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem("bys_h"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showHist, setShowHist] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("bys_h", JSON.stringify(history)); } catch {}
  }, [history]);

  const runCheck = useCallback(async () => {
    if (!question.trim()) return;
    setPage("loading"); setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), depth }),
      });
      let errData;
      if (!res.ok) {
        try { errData = await res.json(); } catch {}
        throw new Error(errData?.error || `Error ${res.status}`);
      }
      const parsed = await res.json();
      const entry = {
        id: crypto.randomUUID(),
        question: question.length > 70 ? question.slice(0, 70) + "…" : question,
        score: parsed.realityScore,
        category: parsed.category,
        date: new Date().toLocaleDateString(),
      };
      setHistory(h => [entry, ...h].slice(0, 10));
      setResults(parsed); setPage("results");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setPage("input");
    }
  }, [question, depth]);

  useEffect(() => {
    const titles = { home: "BeforeUstart — Know Before You Begin", input: "Reality Check — BeforeUstart", loading: "Analyzing… — BeforeUstart", results: results ? `${results.realityScore}/100 — BeforeUstart` : "Results — BeforeUstart" };
    document.title = titles[page] || titles.home;
  }, [page, results]);

  return (
    <>
      <style>{CSS}</style>
      {showHist && <HistoryPanel history={history} onClose={() => setShowHist(false)} />}
      {page === "home" && <HomePage onStart={() => setPage("input")} history={history} onHist={() => setShowHist(true)} />}
      {page === "input" && <InputPage question={question} setQuestion={setQuestion} depth={depth} setDepth={setDepth} onSubmit={runCheck} onBack={() => setPage("home")} error={error} />}
      {page === "loading" && <LoadingPage question={question} />}
      {page === "results" && results && <ResultsPage results={results} question={question} onAgain={() => { setQuestion(""); setResults(null); setPage("input"); }} />}
    </>
  );
}
