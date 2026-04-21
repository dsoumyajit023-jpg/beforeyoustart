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
  --yt:#ff0000;--yt-bg:rgba(255,0,0,0.08);
  --free:#34d399;--free-bg:rgba(52,211,153,0.09);
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
  @keyframes collapseIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sparkFloat{0%{opacity:0;transform:translateY(0) scale(0)}40%{opacity:1;transform:translateY(-14px) scale(1)}100%{opacity:0;transform:translateY(-28px) scale(0.5)}}
  @keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes glowIn{from{box-shadow:0 0 0 0 rgba(124,106,247,0)}to{box-shadow:0 0 20px 2px rgba(124,106,247,0.15)}}
  @keyframes tooltipIn{from{opacity:0;transform:translateY(4px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
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
.section:nth-child(10){animation-delay:0.54s;}
.section:nth-child(11){animation-delay:0.6s;}
.section:nth-child(12){animation-delay:0.66s;}
.collapse-content{animation:collapseIn 0.2s ease both;}
.section-header-clickable{cursor:pointer;user-select:none;border-radius:8px;padding:4px;margin:-4px;transition:background 0.15s;}
.section-header-clickable:hover{background:rgba(124,106,247,0.05);}
.expandable-card{cursor:pointer;transition:border-color 0.18s,background 0.18s;}
.expandable-card:hover{border-color:var(--accent-border)!important;background:rgba(124,106,247,0.03)!important;}
.plan-step-done{opacity:0.45;}
.plan-step-done .plan-focus{text-decoration:line-through;color:var(--faint)!important;}
.axis-pill{cursor:pointer;transition:background 0.15s,border-color 0.15s,transform 0.15s;}
.axis-pill:hover{transform:translateY(-1px);}
.creative-idea{cursor:pointer;transition:border-color 0.18s,background 0.18s;}
.creative-idea:hover{border-color:rgba(124,106,247,0.4)!important;}
`;

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function detectUserContext() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const locale = navigator.language || "en-US";

  const tzMap = {
    "Asia/Kolkata": { currency: "INR", symbol: "₹", country: "India" },
    "Asia/Calcutta": { currency: "INR", symbol: "₹", country: "India" },
    "Asia/Shanghai": { currency: "CNY", symbol: "¥", country: "China" },
    "Asia/Chongqing": { currency: "CNY", symbol: "¥", country: "China" },
    "Asia/Tokyo": { currency: "JPY", symbol: "¥", country: "Japan" },
    "Asia/Seoul": { currency: "KRW", symbol: "₩", country: "South Korea" },
    "Asia/Singapore": { currency: "SGD", symbol: "S$", country: "Singapore" },
    "Asia/Karachi": { currency: "PKR", symbol: "₨", country: "Pakistan" },
    "Asia/Dhaka": { currency: "BDT", symbol: "৳", country: "Bangladesh" },
    "Asia/Dubai": { currency: "AED", symbol: "AED", country: "UAE" },
    "Asia/Jakarta": { currency: "IDR", symbol: "Rp", country: "Indonesia" },
    "Asia/Bangkok": { currency: "THB", symbol: "฿", country: "Thailand" },
    "Asia/Kuala_Lumpur": { currency: "MYR", symbol: "RM", country: "Malaysia" },
    "Asia/Manila": { currency: "PHP", symbol: "₱", country: "Philippines" },
    "Asia/Ho_Chi_Minh": { currency: "VND", symbol: "₫", country: "Vietnam" },
    "America/New_York": { currency: "USD", symbol: "$", country: "USA" },
    "America/Chicago": { currency: "USD", symbol: "$", country: "USA" },
    "America/Los_Angeles": { currency: "USD", symbol: "$", country: "USA" },
    "America/Denver": { currency: "USD", symbol: "$", country: "USA" },
    "America/Toronto": { currency: "CAD", symbol: "C$", country: "Canada" },
    "America/Vancouver": { currency: "CAD", symbol: "C$", country: "Canada" },
    "America/Sao_Paulo": { currency: "BRL", symbol: "R$", country: "Brazil" },
    "America/Mexico_City": { currency: "MXN", symbol: "MX$", country: "Mexico" },
    "America/Bogota": { currency: "COP", symbol: "COP$", country: "Colombia" },
    "America/Lima": { currency: "PEN", symbol: "S/.", country: "Peru" },
    "America/Buenos_Aires": { currency: "ARS", symbol: "AR$", country: "Argentina" },
    "Europe/London": { currency: "GBP", symbol: "£", country: "UK" },
    "Europe/Berlin": { currency: "EUR", symbol: "€", country: "Germany" },
    "Europe/Paris": { currency: "EUR", symbol: "€", country: "France" },
    "Europe/Madrid": { currency: "EUR", symbol: "€", country: "Spain" },
    "Europe/Rome": { currency: "EUR", symbol: "€", country: "Italy" },
    "Europe/Amsterdam": { currency: "EUR", symbol: "€", country: "Netherlands" },
    "Europe/Stockholm": { currency: "SEK", symbol: "kr", country: "Sweden" },
    "Europe/Moscow": { currency: "RUB", symbol: "₽", country: "Russia" },
    "Europe/Warsaw": { currency: "PLN", symbol: "zł", country: "Poland" },
    "Australia/Sydney": { currency: "AUD", symbol: "A$", country: "Australia" },
    "Australia/Melbourne": { currency: "AUD", symbol: "A$", country: "Australia" },
    "Pacific/Auckland": { currency: "NZD", symbol: "NZ$", country: "New Zealand" },
    "Africa/Lagos": { currency: "NGN", symbol: "₦", country: "Nigeria" },
    "Africa/Cairo": { currency: "EGP", symbol: "E£", country: "Egypt" },
    "Africa/Johannesburg": { currency: "ZAR", symbol: "R", country: "South Africa" },
    "Africa/Nairobi": { currency: "KES", symbol: "KSh", country: "Kenya" },
  };

  let ctx = tzMap[tz];
  if (!ctx) {
    const region = tz.split("/")[0];
    if (region === "America") ctx = { currency: "USD", symbol: "$", country: "Americas" };
    else if (region === "Europe") ctx = { currency: "EUR", symbol: "€", country: "Europe" };
    else if (region === "Asia") ctx = { currency: "USD", symbol: "$", country: "Asia" };
    else if (region === "Africa") ctx = { currency: "USD", symbol: "$", country: "Africa" };
    else if (region === "Australia" || region === "Pacific") ctx = { currency: "AUD", symbol: "A$", country: "Oceania" };
    else ctx = { currency: "USD", symbol: "$", country: "Global" };
  }

  return { ...ctx, timezone: tz, locale };
}

function detectFreeIntent(q) {
  const lower = q.toLowerCase();
  return /\b(free|no cost|zero cost|no money|without money|no budget|bootstrap|no spend|\$0|zero budget|without spending|without investment|for free|completely free|totally free|no investment|without any money|0 budget|on a budget|cant afford|can't afford|no capital)\b/.test(lower);
}

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
const satColor = (s) => s === "high" ? "var(--high)" : s === "low" ? "var(--low)" : "var(--med)";

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
  hexradar: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><polygon points="9,2 16,6 16,12 9,16 2,12 2,6" stroke="currentColor" strokeWidth="1.4" fill="none"/><polygon points="9,5 13,7.5 13,10.5 9,13 5,10.5 5,7.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/></svg>,
  trend: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 13l4-4 3 2 4-5 3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 4h3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  compete: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3" y="11" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="7.5" y="7" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="12" y="4" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  market: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 14l4-5 3 3 3-4 4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 3h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  stat: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="7" y="6" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="12" y="2" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  youtube: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="1" y="4" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7l5 2-5 2V7z" fill="currentColor"/></svg>,
  infra: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2" y="3" width="14" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="14" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="5" r="1" fill="currentColor"/><circle cx="5" cy="11" r="1" fill="currentColor"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronUp: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  freeBadge: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1l1.2 2.4 2.8.4-2 1.95.47 2.75L6 7.25 3.53 8.54 4 5.79 2 3.84l2.8-.4z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.8"/></svg>,
  location: <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M6 1C3.8 1 2 2.8 2 5c0 3 4 7 4 7s4-4 4-7c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.2"/></svg>,
  bulb: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2a5 5 0 014 8l-1 1v2H6v-2L5 10a5 5 0 014-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9 12v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  sparkle: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1l1.2 2.8L11 5l-2.8 1.2L7 9 5.8 6.2 3 5l2.8-1.2z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" opacity="0.8"/><path d="M11 9l.8 1.8L13.6 11l-1.8.8L11 13.6l-.8-1.8L8.4 11l1.8-.8z" stroke="currentColor" strokeWidth="0.9" fill="currentColor" opacity="0.6"/></svg>,
  checkCircle: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function SectionHeader({ icon, title, subtitle, badge, collapsed, onToggle }) {
  const baseStyle = { display: "flex", alignItems: "center", gap: "10px", marginBottom: collapsed ? "0" : "16px" };
  if (onToggle) {
    return (
      <div className="section-header-clickable" style={baseStyle} onClick={onToggle}
        role="button" aria-expanded={!collapsed} tabIndex={0}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && onToggle()}>
        <span style={{ color: "var(--accent)", flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", letterSpacing: "0.2px" }}>{title}</h2>
            {badge && <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1px", color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase" }}>{badge}</span>}
          </div>
          {subtitle && !collapsed && <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "1px" }}>{subtitle}</div>}
        </div>
        <span style={{ color: "var(--faint)", flexShrink: 0, opacity: 0.6 }}>{collapsed ? Icons.chevronDown : Icons.chevronUp}</span>
      </div>
    );
  }
  return (
    <div style={baseStyle}>
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
    { count: med,  label: "Medium",    color: "var(--med)",  bg: "var(--med-bg)",  cx: 110, cy: 44 },
    { count: low,  label: "Low Risk",  color: "var(--low)",  bg: "var(--low-bg)",  cx: 75, cy: 88 },
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
                <div style={{ height: "100%", background: item.color, borderRadius: "3px", width: `${total > 0 ? (item.count / total) * 100 : 0}%`, transition: reduced ? "none" : "width 0.8s ease", boxShadow: `0 0 6px ${item.color}66` }}/>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "600", color: item.color, width: "20px", textAlign: "right" }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
                <div style={{ height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: "4px", width: `${pct}%`, transition: reduced ? "none" : `width 0.9s ${i * 0.1}s cubic-bezier(0.22,1,0.36,1)`, boxShadow: `0 0 8px ${color}44` }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequirementsRadar({ req, score, currency }) {
  const reduced = useReducedMotion();
  if (!req) return null;
  const parseTime = (t) => {
    if (!t) return 5;
    const n = parseInt(t);
    if (isNaN(n)) return 5;
    if (n <= 2) return 2; if (n <= 5) return 4; if (n <= 10) return 6; if (n <= 20) return 8; return 10;
  };
  // Currency-normalized money parsing — converts to rough USD equivalent before scoring
  const CURRENCY_FACTORS = { INR:83, PKR:280, BDT:110, IDR:15600, NGN:1300, KES:130, JPY:150, KRW:1330, VND:24000, MXN:17, BRL:5, ARS:350, EGP:31, THB:35, PHP:56, MYR:4.7, AED:3.67, SGD:1.35 };
  const parseMoney = (m) => {
    if (!m || /free|0\s*—|₹\s*0|$\s*0|€\s*0|£\s*0|\b0\b/i.test(m) || m.toLowerCase().includes("free")) return 1;
    const n = parseInt(m.replace(/[^\d]/g, ""));
    if (isNaN(n)) return 4;
    const factor = CURRENCY_FACTORS[currency] || 1;
    const usd = n / factor;
    if (usd < 50) return 2; if (usd < 500) return 4; if (usd < 2000) return 6; if (usd < 10000) return 8; return 10;
  };
  const dims = [
    { label: "Time",       val: parseTime(req.time),                              color: "var(--accent-light)" },
    { label: "Money",      val: parseMoney(req.money),                            color: "var(--med)" },
    { label: "Skills",     val: Math.min((req.skills?.length || 0) * 2 + 1, 10), color: "var(--low)" },
    { label: "Difficulty", val: Math.round((100 - score) / 10),                  color: "var(--high)" },
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
    return { x: cx + (maxR + 18) * Math.cos(angle), y: cy + (maxR + 18) * Math.sin(angle) };
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

// Context for all possible radar axes across different categories
const AXIS_CONTEXT = {
  "Market Demand":      { icon:"📈", what:"How much genuine demand exists", high:"Strong demand — real buyers already exist", low:"Demand is limited, niche, or still being created" },
  "Competition":        { icon:"⚔️", what:"How crowded and fierce the space is", high:"Very competitive — tough to differentiate", low:"Less competition makes entry easier" },
  "Competition Level":  { icon:"⚔️", what:"How crowded and fierce the space is", high:"Very competitive — tough to differentiate", low:"Less competition makes entry easier" },
  "Skill Gap":          { icon:"🎯", what:"Technical skill required before you can start", high:"Steep learning curve ahead of you", low:"Skill barrier is lower than you think" },
  "Capital Needed":     { icon:"💰", what:"Upfront money required to get started", high:"Significant investment required before any return", low:"Low startup cost — lean launch possible" },
  "Time to Revenue":    { icon:"⏳", what:"How long before money actually comes in", high:"Long runway needed — plan for 12+ months", low:"Faster path to first income" },
  "Execution Risk":     { icon:"⚠️", what:"Failure risk due to poor execution", high:"Hard to recover from mistakes at this stage", low:"More forgiving — you can iterate and adjust" },
  "Habit Difficulty":   { icon:"🔄", what:"How hard it is to build and maintain the required habit", high:"Most people quit within 3 weeks", low:"Easier to sustain once started" },
  "Lifestyle Impact":   { icon:"🌱", what:"How much this changes your daily routine", high:"Major lifestyle overhaul — not just an add-on", low:"Can be integrated without radical changes" },
  "Physical Demand":    { icon:"💪", what:"Physical effort and intensity required", high:"Intense daily physical commitment needed", low:"Gentler approach — sustainable for most" },
  "Cost & Access":      { icon:"💳", what:"Money and resource accessibility", high:"Expensive or hard to access where you are", low:"Mostly affordable and accessible" },
  "Time to Results":    { icon:"📅", what:"When you will see meaningful, visible results", high:"Takes 3–6+ months before real change shows", low:"Faster feedback loop — earlier wins possible" },
  "Consistency Risk":   { icon:"📉", what:"Risk of falling off the plan", high:"High dropout risk — most people stop here", low:"More sustainable and forgiving" },
  "Learning Curve":     { icon:"📚", what:"How hard the skill is to learn from scratch", high:"Complex, deep subject — prepare for frustration", low:"Easier to pick up with self-study" },
  "Time Investment":    { icon:"⏱️", what:"Hours per week this realistically requires", high:"Major time commitment — hard to do part-time", low:"Can fit around existing life" },
  "Cost Barrier":       { icon:"💸", what:"Financial cost to learn effectively", high:"Expensive tools, courses, or setup required", low:"Mostly free or low-cost resources available" },
  "Depth Required":     { icon:"🔬", what:"How deep you need to go before producing real results", high:"Must understand fundamentals deeply first", low:"Can build things while still learning" },
  "Practice Needed":    { icon:"🎻", what:"How much deliberate practice drives results", high:"Requires constant, deliberate daily practice", low:"Results come faster with less practice" },
  "Burnout Risk":       { icon:"🔥", what:"Risk of losing motivation and quitting", high:"High burnout potential — most people stop", low:"Sustainable — easier to keep going" },
  "Tech Complexity":    { icon:"⚙️", what:"Technical complexity of building this", high:"Hard tech — needs strong engineering skills", low:"Buildable with no-code or basic skills" },
  "Time to Launch":     { icon:"🚀", what:"How long before you have something usable to ship", high:"Long build time before any user validation", low:"Faster path to a launchable v1" },
  "Market Fit":         { icon:"🎯", what:"How well your background fits what the market needs", high:"Significant skill or credential gap", low:"Your background is genuinely relevant" },
  "Skill Transfer":     { icon:"🔀", what:"How much of your existing skills apply here", high:"You're starting from scratch — little transfers", low:"Strong overlap with your existing skills" },
  "Financial Risk":     { icon:"⚠️", what:"Money you could lose if this doesn't work", high:"High financial exposure if it fails", low:"Lower financial risk — recoverable" },
  "Network Required":   { icon:"🕸️", what:"How much the right connections matter", high:"Who you know heavily influences success here", low:"Talent and work can overcome lack of network" },
  "Courage Needed":     { icon:"🦁", what:"Emotional and social courage this demands", high:"Significant fear, judgment, or identity risk involved", low:"Lower social and emotional barrier" },
  "Audience Demand":    { icon:"📣", what:"How hungry the audience is for this content/offering", high:"Strong existing demand — people are searching", low:"You need to create the demand yourself" },
  "Saturation":         { icon:"🌊", what:"How crowded the content/creative space is", high:"Extremely saturated — very hard to get noticed", low:"Less saturated — easier to build an audience" },
  "Consistency Needed": { icon:"📆", what:"How often you need to show up to see results", high:"Requires near-daily presence for months", low:"Less frequent posting still compounds" },
  "Discoverability":    { icon:"🔍", what:"How easy it is for your target audience to find you", high:"Algorithm or discovery is very hard to crack", low:"Easier organic discovery in this space" },
};

function IdeaRadar({ axes }) {
  const [open, setOpen] = useState(true);
  const [activeAxis, setActiveAxis] = useState(null);
  const reduced = useReducedMotion();
  if (!axes?.length) return null;
  const cx = 160, cy = 160, r = 110;
  const n = axes.length;
  const angle = (i) => (Math.PI / 2) - (2 * Math.PI * i) / n;
  const pt = (i, radius) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy - radius * Math.sin(angle(i)),
  });
  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = axes.map((a, i) => pt(i, r * (Math.min(100, Math.max(0, a.score)) / 100)));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const dotColor = (score) => score >= 70 ? "var(--low)" : score >= 40 ? "var(--med)" : "var(--high)";
  const activeInfo = activeAxis !== null ? AXIS_CONTEXT[axes[activeAxis]?.axis] : null;
  const activeScore = activeAxis !== null ? axes[activeAxis]?.score : null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.hexradar} title="Idea Landscape Radar" subtitle="Tap any axis pill to understand what it means for you"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
          <svg viewBox="0 0 320 310" width="100%" aria-label="Hexagon radar chart showing scores across 6 dimensions"
            style={{ animation: reduced ? "none" : "radarDraw 0.6s ease" }}>
            <defs>
              <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(124,106,247,0.25)" />
                <stop offset="100%" stopColor="rgba(124,106,247,0.08)" />
              </radialGradient>
            </defs>
            {rings.map((ring) => {
              const pts = axes.map((_, i) => pt(i, r * ring));
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
              return <path key={ring} d={d} fill="none" stroke="var(--border2)" strokeWidth={ring === 1 ? 1.5 : 1} />;
            })}
            {axes.map((_, i) => {
              const outer = pt(i, r);
              return <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="var(--border2)" strokeWidth="1" />;
            })}
            <path d={dataPath} fill="url(#radarFill)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={activeAxis === i ? "7" : "4.5"}
                fill={activeAxis === i ? dotColor(axes[i].score) : "var(--accent)"}
                stroke="var(--bg)" strokeWidth="2"
                style={{ cursor: "pointer", transition: "r 0.15s, fill 0.15s", animation: reduced ? "none" : `hexPop 0.4s ${i*0.07}s ease both` }}
                onClick={() => setActiveAxis(activeAxis === i ? null : i)} />
            ))}
            {axes.map((a, i) => {
              const labelPt = pt(i, r + 24);
              const anchor = labelPt.x < cx - 8 ? "end" : labelPt.x > cx + 8 ? "start" : "middle";
              return (
                <g key={i} style={{ cursor: "pointer" }} onClick={() => setActiveAxis(activeAxis === i ? null : i)}>
                  <text x={labelPt.x.toFixed(1)} y={(labelPt.y - 6).toFixed(1)} textAnchor={anchor}
                    fill={activeAxis === i ? dotColor(a.score) : "var(--muted)"} fontSize="10" fontFamily="'DM Sans',sans-serif">{a.axis}</text>
                  <text x={labelPt.x.toFixed(1)} y={(labelPt.y + 8).toFixed(1)} textAnchor={anchor}
                    fill={activeAxis === i ? dotColor(a.score) : "var(--accent-light)"} fontSize="12" fontWeight="600" fontFamily="'DM Sans',sans-serif">{a.score}</text>
                </g>
              );
            })}
          </svg>

          {/* Axis explanation panel */}
          {activeAxis !== null && activeInfo && (
            <div style={{ padding: "14px 16px", background: "var(--bg3)", border: `1px solid ${dotColor(activeScore)}44`, borderRadius: "10px", marginBottom: "12px", animation: "tooltipIn 0.18s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px" }}>{activeInfo.icon}</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{axes[activeAxis].axis}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: dotColor(activeScore), marginLeft: "auto", padding: "2px 8px", borderRadius: "5px", background: `${dotColor(activeScore)}15` }}>{activeScore}/100</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--faint)", lineHeight: 1.5, marginBottom: "8px" }}>{activeInfo.what}</p>
              <div style={{ fontSize: "12px", color: dotColor(activeScore), lineHeight: 1.5, padding: "8px 12px", background: `${dotColor(activeScore)}0d`, borderRadius: "7px", borderLeft: `2px solid ${dotColor(activeScore)}` }}>
                {activeScore >= 50 ? activeInfo.high : activeInfo.low}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "4px" }}>
            {axes.map((a, i) => {
              const c = dotColor(a.score);
              const isActive = activeAxis === i;
              return (
                <div key={a.axis} className="axis-pill"
                  onClick={() => setActiveAxis(isActive ? null : i)}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", background: isActive ? `${c}18` : "var(--bg3)", borderRadius: "6px", border: `1px solid ${isActive ? c + "55" : "var(--border2)"}` }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: "10px", color: isActive ? "var(--text)" : "var(--faint)" }}>{a.axis}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: c }}>{a.score}</span>
                  {AXIS_CONTEXT[a.axis] && <span style={{ fontSize: "9px", color: "var(--faint)", opacity: 0.6 }}>ⓘ</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendLine({ trend }) {
  const [open, setOpen] = useState(true);
  if (!trend?.points?.length) return null;
  const W = 540, H = 150, pad = { t: 16, r: 16, b: 36, l: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const pts = trend.points;
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const px = (i) => pad.l + (i / (pts.length - 1)) * iW;
  const py = (v) => pad.t + iH - ((v - min) / range) * iH;
  const pathD = pts.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${px(pts.length-1).toFixed(1)},${(pad.t+iH).toFixed(1)} L${px(0).toFixed(1)},${(pad.t+iH).toFixed(1)} Z`;
  const color = trend.direction === "rising" ? "var(--low)" : trend.direction === "falling" ? "var(--high)" : "var(--med)";
  const rgb = trend.direction === "rising" ? "52,211,153" : trend.direction === "falling" ? "248,113,113" : "251,191,36";
  const dirLabel = trend.direction === "rising" ? "Trending Up" : trend.direction === "falling" ? "Declining" : "Stable";
  return (
    <div className="section">
      <SectionHeader icon={Icons.trend} title={trend.label || "Market Demand Trend"} subtitle={`${dirLabel} — based on known market data`}
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-label={`${trend.label} — ${trend.direction} trend`}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`rgba(${rgb},0.28)`} />
                <stop offset="100%" stopColor={`rgba(${rgb},0.01)`} />
              </linearGradient>
            </defs>
            {[min, Math.round((min + max) / 2), max].map((v) => (
              <g key={v}>
                <line x1={pad.l} y1={py(v).toFixed(1)} x2={W-pad.r} y2={py(v).toFixed(1)} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={pad.l-6} y={(py(v)+4).toFixed(1)} textAnchor="end" fill="var(--faint)" fontSize="9" fontFamily="'DM Sans',sans-serif">{v}</text>
              </g>
            ))}
            <path d={areaD} fill="url(#trendGrad)" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((v, i) => <circle key={i} cx={px(i).toFixed(1)} cy={py(v).toFixed(1)} r="3" fill={color} />)}
            {["~2 yrs ago","~1 yr ago","Now"].map((label, i) => {
              const idx = i === 0 ? 0 : i === 1 ? Math.floor(pts.length/2) : pts.length-1;
              return <text key={label} x={px(idx).toFixed(1)} y={H-6} textAnchor="middle" fill="var(--faint)" fontSize="9" fontFamily="'DM Sans',sans-serif">{label}</text>;
            })}
          </svg>
          {trend.trendNote && (
            <p style={{ fontSize: "12px", color: "var(--faint)", marginTop: "12px", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <span style={{ color: "var(--accent-light)", marginRight: "6px" }}>Source:</span>{trend.trendNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MarketSnapshot({ snapshot }) {
  const [open, setOpen] = useState(true);
  if (!snapshot) return null;
  const hasData = snapshot.size || snapshot.growth || snapshot.saturation || snapshot.worstMistake || snapshot.bestRegions?.length;
  if (!hasData) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.market} title="Market Snapshot" subtitle="Ground-level market intelligence"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(snapshot.size || snapshot.growth || snapshot.saturation) && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {snapshot.size && (
                <div style={{ flex: 1, minWidth: "130px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "6px" }}>Market Size</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{snapshot.size}</div>
                </div>
              )}
              {snapshot.growth && (
                <div style={{ flex: 1, minWidth: "90px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "6px" }}>Growth</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--low)" }}>{snapshot.growth}</div>
                </div>
              )}
              {snapshot.saturation && (
                <div style={{ flex: 1, minWidth: "90px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "6px" }}>Saturation</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: satColor(snapshot.saturation), textTransform: "capitalize" }}>{snapshot.saturation}</div>
                </div>
              )}
            </div>
          )}
          {snapshot.bestRegions?.length > 0 && (
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "10px" }}>Best Opportunities Right Now</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {snapshot.bestRegions.map((r, i) => (
                  <span key={i} style={{ padding: "5px 12px", borderRadius: "6px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)", color: "var(--low)", fontSize: "12px", fontWeight: 500 }}>{r}</span>
                ))}
              </div>
            </div>
          )}
          {snapshot.worstMistake && (
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "3px solid var(--high)", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--high)", textTransform: "uppercase", marginBottom: "8px" }}>Most Common Costly Mistake</div>
              <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>{snapshot.worstMistake}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GroundStats({ stats }) {
  const [open, setOpen] = useState(true);
  if (!stats?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.stat} title="Ground-Level Data" subtitle="Verified statistics from trusted sources"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent-border)", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4, marginBottom: "5px" }}>{s.stat}</div>
              <div style={{ fontSize: "11px", color: "var(--accent-light)", fontWeight: 500, marginBottom: "8px" }}>{s.source}</div>
              <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{s.context}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreativeSuggestionsSection({ creativeSuggestion }) {
  const [open, setOpen] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);
  if (!creativeSuggestion?.applicable || !creativeSuggestion?.ideas?.length) return null;
  const effortColors = { low: "var(--low)", medium: "var(--med)", high: "var(--high)" };
  const effortBg    = { low: "var(--low-bg)", medium: "var(--med-bg)", high: "var(--high-bg)" };
  const reduced = useReducedMotion();
  return (
    <div className="section">
      <SectionHeader icon={Icons.bulb} title="Creative Angles" subtitle="Unconventional approaches most people completely miss"
        badge="THINK DIFFERENT" collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {creativeSuggestion.hook && (
            <div style={{ padding: "14px 16px", background: "linear-gradient(135deg, rgba(124,106,247,0.13), rgba(124,106,247,0.04))", border: "1px solid var(--accent-border)", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: "1px" }}>{Icons.sparkle}</span>
              <p style={{ fontSize: "13px", fontStyle: "italic", color: "var(--accent-light)", lineHeight: 1.65 }}>{creativeSuggestion.hook}</p>
            </div>
          )}
          {creativeSuggestion.ideas.map((idea, i) => {
            const isOpen = expandedIdx === i;
            const eColor = effortColors[idea.effort] || "var(--med)";
            return (
              <div key={i} className="creative-idea"
                style={{ background: "var(--bg2)", border: `1px solid ${isOpen ? "rgba(124,106,247,0.35)" : "var(--border)"}`, borderRadius: "12px", overflow: "hidden", animation: reduced ? "none" : `fadeUp 0.3s ${i * 0.07}s ease both` }}
                onClick={() => setExpandedIdx(isOpen ? null : i)}>
                <div style={{ padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: isOpen ? "rgba(124,106,247,0.15)" : "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s", color: "var(--accent)" }}>
                    <span style={{ fontSize: "14px" }}>💡</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{idea.title}</span>
                      {idea.effort && (
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.8px", color: eColor, background: effortBg[idea.effort], border: `1px solid ${eColor}30`, padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase" }}>
                          {idea.effort} effort
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{idea.angle}</p>
                  </div>
                  <span style={{ color: "var(--faint)", flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>{Icons.chevronDown}</span>
                </div>
                {isOpen && (
                  <div className="collapse-content" style={{ padding: "12px 16px 14px", borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7, marginBottom: "12px" }}>{idea.howTo}</p>
                    {idea.whyItWorks && (
                      <div style={{ padding: "10px 14px", background: "rgba(124,106,247,0.07)", borderRadius: "8px", borderLeft: "2px solid var(--accent)" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "5px" }}>Why it works</div>
                        <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{idea.whyItWorks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function YouTubeSection({ videos }) {
  const [open, setOpen] = useState(true);
  if (!videos?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.youtube} title="Watch Before You Start" subtitle="Essential viewing from honest creators"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {videos.map((v, i) => (
            <a key={i}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.searchQuery)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "block" }}>
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseOver={e => e.currentTarget.style.borderColor = "rgba(255,0,0,0.3)"}
                onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "var(--yt-bg)", border: "1px solid rgba(255,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--yt)" }}>
                    {Icons.youtube}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{v.topic}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--yt)", background: "var(--yt-bg)", padding: "2px 7px", borderRadius: "4px", whiteSpace: "nowrap" }}>{v.channel}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.55, marginBottom: "7px" }}>{v.why}</p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--faint)" }}>
                      Search: <span style={{ color: "var(--accent-light)", fontStyle: "italic" }}>{v.searchQuery}</span>
                      <span style={{ opacity: 0.6 }}>{Icons.external}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function InfraPath({ infraPath, isFreeIntent }) {
  const [open, setOpen] = useState(true);
  const [activeTier, setActiveTier] = useState(0);
  if (!infraPath?.applicable || !infraPath?.tiers?.length) return null;

  const tierColors = ["var(--free)", "var(--med)", "var(--accent-light)"];
  const tierBgs = ["var(--free-bg)", "var(--med-bg)", "var(--accent-dim)"];
  const tierBorders = ["rgba(52,211,153,0.25)", "rgba(251,191,36,0.25)", "rgba(124,106,247,0.3)"];

  return (
    <div className="section">
      <SectionHeader icon={Icons.infra} title="Infrastructure Path"
        subtitle={isFreeIntent ? "Start free — scale only when needed" : "Free start → scale as you grow"}
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content">
          {isFreeIntent && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--free-bg)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px", marginBottom: "14px" }}>
              <span style={{ color: "var(--free)" }}>{Icons.freeBadge}</span>
              <span style={{ fontSize: "12px", color: "var(--free)", fontWeight: 500 }}>Free-first mode — showing zero-cost setup as primary path</span>
            </div>
          )}
          {infraPath.context && (
            <p style={{ fontSize: "12px", color: "var(--faint)", marginBottom: "14px", lineHeight: 1.5 }}>{infraPath.context}</p>
          )}
          <div style={{ display: "flex", gap: "7px", marginBottom: "14px", flexWrap: "wrap" }}>
            {infraPath.tiers.map((tier, i) => (
              <button key={i} onClick={() => setActiveTier(i)}
                style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${activeTier === i ? tierBorders[i] : "var(--border)"}`, background: activeTier === i ? tierBgs[i] : "var(--bg2)", color: activeTier === i ? tierColors[i] : "var(--faint)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                <span>{tier.tier}</span>
                <span style={{ fontSize: "10px", fontWeight: 400, opacity: 0.8 }}>{tier.monthlyCost}/mo</span>
              </button>
            ))}
          </div>

          {infraPath.tiers[activeTier] && (() => {
            const tier = infraPath.tiers[activeTier];
            const color = tierColors[activeTier];
            const bg = tierBgs[activeTier];
            const border = tierBorders[activeTier];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {tier.tools?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {tier.tools.map((tool, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "var(--bg2)", border: `1px solid var(--border)`, borderLeft: `3px solid ${color}`, borderRadius: "10px", padding: "12px 14px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            {tool.url ? (
                              <a href={tool.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: "13px", fontWeight: 600, color, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                {tool.name} <span style={{ opacity: 0.6 }}>{Icons.external}</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: "13px", fontWeight: 600, color }}>{tool.name}</span>
                            )}
                            {tool.freeLimit && (
                              <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "4px", background: bg, color, border: `1px solid ${border}`, fontWeight: 500 }}>
                                {tool.freeLimit}
                              </span>
                            )}
                            {tool.controlLevel && (
                              <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "4px", background: "var(--bg3)", color: tool.controlLevel === "full" ? "var(--low)" : tool.controlLevel === "partial" ? "var(--med)" : "var(--high)", border: "1px solid var(--border2)", fontWeight: 500 }}>
                                {tool.controlLevel} control
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{tool.purpose}</p>
                          {tool.note && <p style={{ fontSize: "11px", color: "var(--faint)", lineHeight: 1.5, marginTop: "3px" }}>{tool.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {tier.handles && (
                    <div style={{ flex: 1, minWidth: "140px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px" }}>
                      <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "5px" }}>Handles</div>
                      <p style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }}>{tier.handles}</p>
                    </div>
                  )}
                  {(tier.bestFor || tier.tradeoff) && (
                    <div style={{ flex: 1, minWidth: "140px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 14px" }}>
                      <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--faint)", textTransform: "uppercase", marginBottom: "5px" }}>
                        {tier.tradeoff ? "Trade-off" : "Best For"}
                      </div>
                      <p style={{ fontSize: "12px", color: tier.tradeoff ? "var(--med)" : "var(--text)", lineHeight: 1.5 }}>{tier.tradeoff || tier.bestFor}</p>
                    </div>
                  )}
                </div>
                {tier.upgradeAt && (
                  <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent-border)", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--accent)", textTransform: "uppercase", marginBottom: "5px" }}>Upgrade Signal</div>
                    <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{tier.upgradeAt}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
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

const PHASES = [
  "Reading your exact question…",
  "Detecting what you actually want to achieve…",
  "Cutting through the hype and marketing noise…",
  "Finding the real obstacles no one talks about…",
  "Checking market data and failure statistics…",
  "Calculating your honest reality score…",
  "Building context-appropriate recommendations…",
  "Writing your concrete 30-day action plan…",
  "Almost done — final quality check…",
];

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

function InputPage({ question, setQuestion, depth, setDepth, onSubmit, onBack, error, userCtx, isFreeIntent }) {
  const ref = useRef(null);
  const errRef = useRef(null);
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--accent)", textTransform: "uppercase" }}>Reality Check</div>
            {userCtx && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "6px" }}>
                <span style={{ color: "var(--faint)", opacity: 0.7 }}>{Icons.location}</span>
                <span style={{ fontSize: "10px", color: "var(--faint)" }}>{userCtx.country} · {userCtx.currency}</span>
              </div>
            )}
          </div>
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
          {isFreeIntent && (
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px", background: "var(--free-bg)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px" }}>
              <span style={{ color: "var(--free)", fontSize: "12px" }}>{Icons.freeBadge}</span>
              <span style={{ fontSize: "12px", color: "var(--free)" }}>Free-first mode — expenses hidden, only free tools shown</span>
            </div>
          )}
          {error && <p id="q-err" ref={errRef} tabIndex={-1} style={{ fontSize: "13px", color: "var(--high)", padding: "10px 14px", background: "var(--high-bg)", borderRadius: "8px" }}>{error}</p>}
          {!error && !isFreeIntent && <p id="q-hint" style={{ fontSize: "12px", color: "var(--faint)" }}>Press {hint} to analyze</p>}
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
  const [open, setOpen] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(null);
  if (!challenges?.length) return null;
  const sorted = [...challenges].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));
  return (
    <div className="section">
      <SectionHeader icon={Icons.challenge} title="Key Challenges" subtitle={`${challenges.length} obstacles — tap any to expand`}
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content">
          <HexagonChart challenges={challenges} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {sorted.map((c, i) => {
              const isExp = expandedIdx === i;
              return (
                <div key={i} className="expandable-card"
                  style={{ background: "var(--bg2)", border: `1px solid ${isExp ? svc(c.severity) + "44" : "var(--border)"}`, borderLeft: `3px solid ${svc(c.severity)}`, borderRadius: "12px", overflow: "hidden" }}
                  onClick={() => setExpandedIdx(isExp ? null : i)}
                  role="button" aria-expanded={isExp} tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setExpandedIdx(isExp ? null : i)}>
                  <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{c.title}</span>
                        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.8px", color: svc(c.severity), background: svbg(c.severity), padding: "3px 8px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0 }}>{svl(c.severity)}</span>
                      </div>
                      {!isExp && c.detail && (
                        <p style={{ fontSize: "12px", color: "var(--faint)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.detail}</p>
                      )}
                    </div>
                    <span style={{ color: "var(--faint)", flexShrink: 0, transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "none" }}>{Icons.chevronDown}</span>
                  </div>
                  {isExp && (
                    <div className="collapse-content" style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65, paddingTop: "12px" }}>{c.detail}</p>
                      <div style={{ marginTop: "12px", padding: "8px 12px", background: svbg(c.severity), borderRadius: "7px", display: "flex", alignItems: "center", gap: "7px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: svc(c.severity), textTransform: "uppercase" }}>Risk level:</span>
                        <span style={{ fontSize: "11px", color: svc(c.severity) }}>{c.severity === "high" ? "Needs a plan before you start" : c.severity === "medium" ? "Manageable with preparation" : "Monitor but don't overthink"}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UpsideSection({ opportunities }) {
  const [open, setOpen] = useState(true);
  if (!opportunities?.length) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.upside} title="Real Opportunities" subtitle="Genuine upside if you execute well"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {opportunities.map((o, i) => (
            <Card key={i}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--low)", marginBottom: "7px" }}>{o.title}</div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>{o.detail}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NeedsSection({ req, score, skillBreakdown, isFreeIntent, currency }) {
  const [open, setOpen] = useState(true);
  if (!req) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.needs} title="What You'll Need"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Card style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1, minWidth: "160px" }}>
              <span style={{ color: "var(--accent-light)" }}>{Icons.time}</span>
              <div>
                <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Time</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{req.time}</div>
              </div>
            </Card>
            {!isFreeIntent && req.money && (
              <Card style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1, minWidth: "160px" }}>
                <span style={{ color: "var(--med)" }}>{Icons.money}</span>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Investment</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{req.money}</div>
                </div>
              </Card>
            )}
            {isFreeIntent && (
              <Card style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1, minWidth: "160px", borderColor: "rgba(52,211,153,0.2)" }}>
                <span style={{ color: "var(--free)" }}>{Icons.money}</span>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>Investment</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--free)" }}>Free tools only</div>
                </div>
              </Card>
            )}
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
          <RequirementsRadar req={req} score={score} currency={currency} />
          <SkillBreakdownChart skills={skillBreakdown} />
        </div>
      )}
    </div>
  );
}

function PlanSection({ plan }) {
  const [open, setOpen] = useState(true);
  const [done, setDone] = useState({});
  const reduced = useReducedMotion();
  if (!plan?.length) return null;
  const toggleDone = (i) => setDone(d => ({ ...d, [i]: !d[i] }));
  const completedCount = Object.values(done).filter(Boolean).length;
  return (
    <div className="section">
      <SectionHeader icon={Icons.plan} title="Action Plan"
        subtitle={completedCount > 0 ? `${completedCount}/${plan.length} steps done` : "Tap steps to track progress"}
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {completedCount > 0 && (
            <div style={{ marginBottom: "14px", height: "4px", background: "var(--border2)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(completedCount / plan.length) * 100}%`, background: "var(--low)", borderRadius: "2px", transition: reduced ? "none" : "width 0.5s ease", boxShadow: "0 0 8px var(--low)" }} />
            </div>
          )}
          {plan.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <button onClick={() => toggleDone(i)} aria-label={done[i] ? `Unmark step ${i+1} as done` : `Mark step ${i+1} as done`}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", background: done[i] ? "rgba(52,211,153,0.15)" : "var(--accent-dim)", border: `1px solid ${done[i] ? "rgba(52,211,153,0.4)" : "var(--accent-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: "2px", transition: "all 0.2s" }}>
                  {done[i]
                    ? <span style={{ color: "var(--low)", animation: reduced ? "none" : "checkPop 0.25s ease" }}>{Icons.checkCircle}</span>
                    : <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-light)" }}>{i+1}</span>}
                </button>
                {i < plan.length - 1 && <div style={{ width: "1px", flex: 1, background: done[i] ? "rgba(52,211,153,0.3)" : "var(--border)", margin: "4px 0", transition: "background 0.3s" }}/>}
              </div>
              <div className={done[i] ? "plan-step-done" : ""} style={{ paddingBottom: i < plan.length - 1 ? "20px" : "0", paddingTop: "2px", flex: 1, transition: "opacity 0.2s" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", color: done[i] ? "var(--low)" : "var(--accent)", textTransform: "uppercase", marginBottom: "3px" }}>{p.phase}</div>
                <div className="plan-focus" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "5px" }}>{p.focus}</div>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{p.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MindsetSection({ mindset }) {
  const [open, setOpen] = useState(true);
  if (!mindset) return null;
  return (
    <div className="section">
      <SectionHeader icon={Icons.mindset} title="The Mindset Shift"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content">
          <Card style={{ borderLeft: "3px solid var(--accent-border)" }}>
            <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(15px,3vw,18px)", fontStyle: "italic", lineHeight: 1.75, color: "rgba(240,238,252,0.85)" }}>{mindset}</p>
          </Card>
        </div>
      )}
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
  if (platform) return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(72,202,228,0.12)", color: "var(--course)", border: "1px solid rgba(72,202,228,0.2)", fontWeight: 600, letterSpacing: "0.5px" }}>{platform}</span>;
  if (free === true) return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "var(--free-bg)", color: "var(--free)", fontWeight: 600, border: "1px solid rgba(52,211,153,0.2)" }}>FREE</span>;
  if (free === false) return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "var(--med-bg)", color: "var(--med)", fontWeight: 600 }}>PAID</span>;
  return null;
}

function ResourcesSection({ resources, intent, isFreeIntent }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState(null);
  if (!resources) return null;
  const tabs = [
    { key: "books",       label: "Books",     icon: Icons.book,      color: "var(--book)",   data: resources.books },
    { key: "courses",     label: "Courses",   icon: Icons.course,    color: "var(--course)", data: resources.courses },
    { key: "apps",        label: "Apps",      icon: Icons.app,       color: "var(--app)",    data: resources.apps },
    { key: "websites",    label: "Websites",  icon: Icons.web,       color: "var(--web)",    data: resources.websites },
    { key: "communities", label: "Community", icon: Icons.community, color: "var(--comm)",   data: resources.communities },
  ].filter(t => {
    if (!t.data?.length) return false;
    if (isFreeIntent && (t.key === "books")) return t.data.some(b => b.url);
    return true;
  });
  if (tabs.length === 0) return null;
  const activeTab = tab || tabs[0].key;
  const activeData = tabs.find(t => t.key === activeTab);
  return (
    <div className="section">
      <SectionHeader icon={Icons.resources} title="Resources & Learning" subtitle="Curated for your exact goal"
        collapsed={!open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div className="collapse-content">
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
                  <div style={{ marginBottom: "4px" }}><ResourceLink url={w.url} color="var(--web)">{w.name}</ResourceLink></div>
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
      )}
    </div>
  );
}

function ResultsPage({ results: r, question, onAgain, isFreeIntent, userCtx }) {
  const [copied, setCopied] = useState(false);

  // Context flags — drive which sections are shown
  const isHealth     = r.category === "health";
  const isTech       = r.category === "tech" || r.intent === "build_product";
  const isBusiness   = r.category === "business" || r.intent === "start_business";
  const isLearning   = r.category === "learning" || r.intent === "learn_skill";
  const isCreative   = r.category === "creative" || r.intent === "create_content";
  const isLifeDec    = r.intent === "life_decision";
  const isSocial     = r.category === "social" || r.intent === "social_growth";

  // Market/business data only makes sense for commercial intents
  const showMarketData  = !isHealth && !isLifeDec && !isSocial;
  // Infra path only for tech/digital
  const showInfraPath   = r.infraPath?.applicable && (isTech || isBusiness || isLearning);
  // Trend label context
  const trendLabel = isHealth ? "Interest & Awareness Trend" : isLearning ? "Learning Interest Trend" : "Market Demand Trend";

  const currency = userCtx?.currency || "USD";

  const copyAll = async () => {
    const t = `BeforeUstart Reality Check\n"${question}"\n\nScore: ${r.realityScore}/100\nVerdict: ${r.verdict}\n\nChallenges:\n${(r.challenges||[]).map((c,i)=>`${i+1}. [${c.severity?.toUpperCase()}] ${c.title}: ${c.detail}`).join("\n")}\n\nOpportunities:\n${(r.opportunities||[]).map((o,i)=>`${i+1}. ${o.title}: ${o.detail}`).join("\n")}\n\nTime: ${r.requirements?.time}\n${!isFreeIntent ? `Money: ${r.requirements?.money}\n` : ""}Skills: ${(r.requirements?.skills||[]).join(", ")}\n\nMindset:\n${r.mindset}`;
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.intentLabel || r.category}</span>
          {isFreeIntent && (
            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--free)", background: "var(--free-bg)", padding: "2px 7px", borderRadius: "4px", border: "1px solid rgba(52,211,153,0.2)", whiteSpace: "nowrap" }}>FREE</span>
          )}
        </div>
        <button onClick={copyAll} aria-label={copied ? "Copied" : "Copy results"}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: "7px", padding: "7px 13px", color: copied ? "var(--low)" : "var(--faint)", fontSize: "12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "6px", minHeight: "36px", transition: "color 0.2s" }}>
          {copied ? Icons.check : Icons.copy}
          {copied ? "Copied" : "Copy"}
        </button>
      </header>

      <main id="main-content" style={{ maxWidth: "640px", margin: "0 auto", padding: "28px 20px 80px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <ScoreSection r={r} />
        {r.radarAxes?.length === 6 && <><Divider /><IdeaRadar axes={r.radarAxes} /></>}
        <Divider />
        <ChallengesSection challenges={r.challenges || []} />
        {r.demandTrend?.points?.length > 1 && (
          <><Divider /><TrendLine trend={{ ...r.demandTrend, label: r.demandTrend.label || trendLabel }} /></>
        )}
        <Divider />
        <UpsideSection opportunities={r.opportunities} />
        {showMarketData && r.marketSnapshot && <><Divider /><MarketSnapshot snapshot={r.marketSnapshot} /></>}
        {r.groundStats?.length > 0 && <><Divider /><GroundStats stats={r.groundStats} /></>}
        {r.creativeSuggestion?.applicable && <><Divider /><CreativeSuggestionsSection creativeSuggestion={r.creativeSuggestion} /></>}
        <Divider />
        <NeedsSection req={r.requirements} score={r.realityScore} skillBreakdown={r.skillBreakdown} isFreeIntent={isFreeIntent} currency={currency} />
        {showInfraPath && <><Divider /><InfraPath infraPath={r.infraPath} isFreeIntent={isFreeIntent} /></>}
        <Divider />
        <PlanSection plan={r.plan} />
        <Divider />
        <MindsetSection mindset={r.mindset} />
        {r.youtubeVideos?.length > 0 && <><Divider /><YouTubeSection videos={r.youtubeVideos} /></>}
        <Divider />
        <ResourcesSection resources={r.resources} intent={r.intent} isFreeIntent={isFreeIntent} />
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
  const [isFreeIntent, setIsFreeIntent] = useState(false);
  const [userCtx] = useState(() => {
    try { return detectUserContext(); } catch { return { currency: "USD", symbol: "$", country: "Global", locale: "en-US" }; }
  });
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem("bys_h"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showHist, setShowHist] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("bys_h", JSON.stringify(history)); } catch {}
  }, [history]);

  useEffect(() => {
    setIsFreeIntent(detectFreeIntent(question));
  }, [question]);

  const runCheck = useCallback(async () => {
    if (!question.trim()) return;
    const freeIntent = detectFreeIntent(question);
    setIsFreeIntent(freeIntent);
    setPage("loading"); setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          depth,
          userContext: userCtx,
          isFreeIntent: freeIntent,
        }),
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
  }, [question, depth, userCtx]);

  useEffect(() => {
    const titles = { home: "BeforeUstart — Know Before You Begin", input: "Reality Check — BeforeUstart", loading: "Analyzing… — BeforeUstart", results: results ? `${results.realityScore}/100 — BeforeUstart` : "Results — BeforeUstart" };
    document.title = titles[page] || titles.home;
  }, [page, results]);

  return (
    <>
      <style>{CSS}</style>
      {showHist && <HistoryPanel history={history} onClose={() => setShowHist(false)} />}
      {page === "home" && <HomePage onStart={() => setPage("input")} history={history} onHist={() => setShowHist(true)} />}
      {page === "input" && <InputPage question={question} setQuestion={setQuestion} depth={depth} setDepth={setDepth} onSubmit={runCheck} onBack={() => setPage("home")} error={error} userCtx={userCtx} isFreeIntent={isFreeIntent} />}
      {page === "loading" && <LoadingPage question={question} />}
      {page === "results" && results && <ResultsPage results={results} question={question} isFreeIntent={isFreeIntent} userCtx={userCtx} onAgain={() => { setQuestion(""); setResults(null); setIsFreeIntent(false); setPage("input"); }} />}
    </>
  );
}
