import { useState, useEffect, useRef, useCallback } from "react";

const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#08080f;--bg2:rgba(255,255,255,0.03);--bg3:rgba(255,255,255,0.06);
  --text:#f0eefc;--muted:rgba(240,238,252,0.45);--faint:rgba(240,238,252,0.2);
  --accent:#9b7fff;--accent-dim:rgba(155,127,255,0.12);--accent-border:rgba(155,127,255,0.3);
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.15);
  --high:#ff6b6b;--med:#ffc06b;--low:#6bffb8;
}
html,body{height:100%;background:var(--bg);}
body{font-family:'DM Sans',sans-serif;color:var(--text);overflow-x:hidden;-webkit-font-smoothing:antialiased;}
#root{min-height:100vh;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(155,127,255,0.2);border-radius:2px;}

.skip-link{
  position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;
  background:var(--accent);color:#fff;padding:8px 16px;font-family:'DM Sans',sans-serif;
  font-size:14px;z-index:9999;border-radius:0 0 8px 0;
}
.skip-link:focus{position:fixed;left:0;top:0;width:auto;height:auto;overflow:visible;}

@media (prefers-reduced-motion: no-preference) {
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pulse{0%,100%{opacity:0.25;transform:scale(0.75)}50%{opacity:1;transform:scale(1)}}
  @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.1)}}
  @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,40px) scale(0.9)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
}

.fade-up{animation:fadeUp 0.8s ease both;}
.fade-in{animation:fadeIn 0.4s ease both;}
.slide-in{animation:slideIn 0.3s ease both;}

button:focus-visible,a:focus-visible,[tabindex="0"]:focus-visible{
  outline:2px solid var(--accent);outline-offset:3px;border-radius:4px;
}

textarea:focus{
  outline:2px solid var(--accent-border);outline-offset:0;
}

@media (max-width:480px){
  .tab-label{display:none;}
}
`;

const sc = (s) => (s >= 70 ? "#6bffb8" : s >= 45 ? "#ffc06b" : "#ff6b6b");
const svc = (s) => (s === "high" ? "#ff6b6b" : s === "medium" ? "#ffc06b" : "#6bffb8");
const svl = (s) => (s === "high" ? "HIGH" : s === "medium" ? "MED" : "LOW");

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function ScoreGauge({ score, label }) {
  const [anim, setAnim] = useState(0);
  const raf = useRef(null);
  const timeout = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setAnim(score);
      return;
    }
    const start = Date.now(), dur = 1800;
    const step = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setAnim(Math.round(e * score));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    timeout.current = setTimeout(() => { raf.current = requestAnimationFrame(step); }, 350);
    return () => {
      clearTimeout(timeout.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [score, reduced]);

  const r = 72, cx = 105, cy = 105, circ = 2 * Math.PI * r;
  const arc75 = circ * 0.75, filled = arc75 * (anim / 100);
  const color = sc(score);
  return (
    <div style={{ textAlign: "center" }} role="img" aria-label={`Reality score: ${score} out of 100. ${label}`}>
      <svg width="210" height="155" viewBox="0 0 210 155" style={{ overflow: "visible" }} aria-hidden="true">
        <defs>
          <filter id="g"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"
          strokeDasharray={`${arc75} ${circ - arc75}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`} filter="url(#g)"
          style={{ transition: reduced ? "none" : "stroke-dasharray 0.04s linear" }}/>
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="48"
          fontFamily="'DM Serif Display',serif" style={{ filter: `drop-shadow(0 0 14px ${color}55)` }}>
          {anim}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="rgba(240,238,252,0.28)" fontSize="9"
          fontFamily="DM Sans,sans-serif" letterSpacing="2.5">REALITY SCORE</text>
      </svg>
      <div style={{ fontSize: "13px", color, fontWeight: 500, marginTop: "-8px", letterSpacing: "0.3px" }}>{label}</div>
    </div>
  );
}

function Dots() {
  const reduced = useReducedMotion();
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }} role="status" aria-label="Loading">
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)",
          animation: reduced ? "none" : `pulse 1.4s ${i * 0.22}s ease-in-out infinite` }}/>
      ))}
    </div>
  );
}

const PHASES = [
  "Analyzing your idea…", "Cutting through the hype…", "Finding real obstacles…",
  "Weighing the risks…", "Calculating reality score…", "Building your 30-day plan…",
  "Being brutally honest…", "Almost done…"
];

function LoadingPage({ question }) {
  const [ph, setPh] = useState(0);
  const [prog, setProg] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    const pi = setInterval(() => setPh(p => (p + 1) % PHASES.length), 1700);
    const pgi = setInterval(() => setProg(p => Math.min(p + Math.random() * 2.5, 91)), 180);
    return () => { clearInterval(pi); clearInterval(pgi); };
  }, []);
  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: "480px", textAlign: "center", display: "flex",
        flexDirection: "column", gap: "28px", alignItems: "center" }}>
        <div style={{ padding: "20px 26px", background: "var(--bg2)", border: "0.5px solid var(--border)",
          borderRadius: "16px", width: "100%", animation: reduced ? "none" : "fadeUp 0.4s ease both" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--accent)", opacity: 0.65,
            textTransform: "uppercase", marginBottom: "10px" }}>checking</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "18px", fontStyle: "italic",
            color: "var(--text)", lineHeight: 1.45, opacity: 0.9 }}>
            "{question.length > 90 ? question.slice(0, 90) + "…" : question}"
          </div>
        </div>
        <Dots />
        <div aria-live="polite" aria-atomic="true" key={ph} style={{ fontSize: "13px", color: "var(--muted)", letterSpacing: "0.4px",
          animation: reduced ? "none" : "fadeIn 0.4s ease both" }}>{PHASES[ph]}</div>
        <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.06)",
          borderRadius: "1px", overflow: "hidden" }} role="progressbar" aria-valuenow={Math.round(prog)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ height: "100%", width: `${prog}%`,
            background: "linear-gradient(90deg,var(--accent),#c4b2ff)",
            transition: "width 0.3s ease", boxShadow: "0 0 10px rgba(155,127,255,0.5)" }}/>
        </div>
        <div style={{ fontSize: "11px", color: "var(--faint)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
          honest answers only
        </div>
      </div>
    </main>
  );
}

function Btn({ children, onClick, variant = "ghost", disabled, style = {} }) {
  const base = {
    fontFamily: "'DM Sans',sans-serif", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: "100px", fontSize: "14px", transition: "all 0.2s",
    opacity: disabled ? 0.4 : 1, border: "0.5px solid", minHeight: "44px", ...style
  };
  const v = {
    ghost: { padding: "16px 36px", background: "transparent",
      borderColor: "rgba(155,127,255,0.38)", color: "rgba(155,127,255,0.9)" },
    primary: { padding: "16px 36px", background: "rgba(155,127,255,0.14)",
      borderColor: "rgba(155,127,255,0.4)", color: "#c4b2ff" },
    subtle: { padding: "9px 18px", background: "transparent",
      borderColor: "var(--border2)", color: "var(--muted)" },
    nav: { padding: "7px 14px", background: "none", border: "none",
      color: "var(--faint)", fontSize: "13px" }
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} aria-disabled={disabled}
      style={{ ...base, ...v[variant] }}>
      {children}
    </button>
  );
}

function BackBtn({ onClick, label = "back" }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: "var(--faint)",
      fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center",
      gap: "6px", fontFamily: "'DM Sans',sans-serif", transition: "color 0.2s",
      minHeight: "44px", minWidth: "44px" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M11 7H3M6 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}

function SLabel({ children }) {
  return <div style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--faint)",
    textTransform: "uppercase", marginBottom: "12px" }}>{children}</div>;
}

function HomePage({ onStart, history, onHist }) {
  const [chars, setChars] = useState([]);
  const text = "BeforeUstart";
  const reduced = useReducedMotion();
  useEffect(() => {
    const arr = text.split("").map(c => ({ c, v: false }));
    setChars(arr);
    if (reduced) {
      setChars(arr.map(ch => ({ ...ch, v: true })));
      return;
    }
    arr.forEach((_, i) => setTimeout(() =>
      setChars(p => p.map((ch, j) => j === i ? { ...ch, v: true } : ch)), 500 + i * 55));
  }, [reduced]);

  const pills = ["No sugarcoating ◆", "Honest by design ◆", "100% free ◆", "Powered by Claude ◆"];

  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative",
      overflow: "hidden", padding: "40px 24px" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "15%", left: "10%", width: "550px", height: "550px",
          borderRadius: "50%", background: "radial-gradient(circle,rgba(100,60,220,0.16) 0%,transparent 70%)",
          filter: "blur(50px)", animation: reduced ? "none" : "orb1 9s ease-in-out infinite" }}/>
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "420px", height: "420px",
          borderRadius: "50%", background: "radial-gradient(circle,rgba(180,100,255,0.1) 0%,transparent 70%)",
          filter: "blur(50px)", animation: reduced ? "none" : "orb2 11s ease-in-out infinite" }}/>
      </div>

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "580px", width: "100%" }}>
        <p style={{ fontSize: "11px", letterSpacing: "4px", color: "var(--muted)", textTransform: "uppercase",
          marginBottom: "28px", animation: reduced ? "none" : "fadeUp 0.8s 0.3s ease both", opacity: reduced ? 1 : 0 }}>
          A reality check tool
        </p>

        <div style={{ marginBottom: "22px", lineHeight: 1, overflow: "hidden" }}>
          <h1 style={{ fontFamily: "'DM Serif Display',serif",
            fontSize: "clamp(52px,12vw,100px)", fontWeight: 400, letterSpacing: "-2px" }}>
            {chars.map((ch, i) => (
              <span key={i} style={{ display: "inline-block",
                opacity: ch.v ? 1 : 0, transform: ch.v ? "translateY(0)" : "translateY(20px)",
                transition: reduced ? "none" : "opacity 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
                {ch.c}
              </span>
            ))}
          </h1>
        </div>

        <p style={{ fontSize: "clamp(14px,2vw,16px)", color: "var(--muted)", fontWeight: 300,
          lineHeight: 1.75, maxWidth: "400px", margin: "0 auto 36px",
          animation: reduced ? "none" : "fadeUp 0.8s 1.6s ease both", opacity: reduced ? 1 : 0 }}>
          Before you leap — know what you're actually jumping into.
          No fluff. No motivation. Just reality.
        </p>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap",
          marginBottom: "48px", animation: reduced ? "none" : "fadeUp 0.8s 1.85s ease both", opacity: reduced ? 1 : 0 }}
          aria-hidden="true">
          {pills.map(p => (
            <span key={p} style={{ padding: "5px 13px", borderRadius: "100px",
              background: "var(--bg2)", border: "0.5px solid var(--border)",
              fontSize: "12px", color: "var(--faint)" }}>{p}</span>
          ))}
        </div>

        <div style={{ animation: reduced ? "none" : "fadeUp 0.8s 2.05s ease both", opacity: reduced ? 1 : 0 }}>
          <Btn onClick={onStart} variant="ghost" style={{ fontSize: "15px", padding: "16px 40px" }}>
            Ask the real question →
          </Btn>
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: "22px", animation: reduced ? "none" : "fadeUp 0.8s 2.25s ease both", opacity: reduced ? 1 : 0 }}>
            <button onClick={onHist} style={{ background: "none", border: "none",
              color: "var(--faint)", fontSize: "12px", cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", letterSpacing: "1px", textTransform: "uppercase",
              minHeight: "44px" }}>
              {history.length} past check{history.length !== 1 ? "s" : ""} →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const DEPTHS = [
  { id: "quick", label: "Quick", desc: "3–4 challenges", icon: "⚡" },
  { id: "standard", label: "Standard", desc: "5–6 challenges", icon: "◈" },
  { id: "deep", label: "Deep Dive", desc: "7–8 challenges", icon: "◎" },
];

function InputPage({ question, setQuestion, depth, setDepth, onSubmit, onBack, error }) {
  const ref = useRef(null);
  const errorRef = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const submitHint = isMac ? "⌘+Enter to submit" : "Ctrl+Enter to submit";
  const canSubmit = !!question.trim();

  return (
    <main id="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "60px 24px",
      position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 500px 400px at 60% 30%,rgba(80,40,200,0.08) 0%,transparent 70%)" }} aria-hidden="true"/>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "600px",
        display: "flex", flexDirection: "column", gap: "20px" }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "var(--accent)",
            opacity: 0.7, textTransform: "uppercase", marginBottom: "10px" }} aria-hidden="true">reality check</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(24px,5vw,34px)",
            fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
            What are you thinking of{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>starting?</em>
          </h1>
        </div>

        <div>
          <label htmlFor="question-input" style={{ display: "block", fontSize: "13px",
            color: "var(--muted)", marginBottom: "8px" }}>
            Describe your idea or plan
          </label>
          <textarea
            id="question-input"
            ref={ref}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              const trigger = isMac ? e.metaKey : e.ctrlKey;
              if (e.key === "Enter" && trigger && canSubmit) onSubmit();
            }}
            maxLength={600}
            aria-describedby={error ? "question-error" : "question-hint"}
            aria-invalid={!!error}
            placeholder={"e.g. I want to start a dropshipping business selling fitness gear\n\nBe specific — the more real your question, the more honest your answer."}
            style={{ width: "100%", minHeight: "165px", background: "var(--bg2)",
              border: `0.5px solid ${error ? "rgba(255,107,107,0.5)" : "var(--border)"}`,
              borderRadius: "14px", color: "var(--text)", fontSize: "15px",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 300, padding: "20px 22px",
              resize: "vertical", lineHeight: 1.65,
              transition: "border-color 0.25s,background 0.25s" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent-border)";
              e.target.style.background = "rgba(155,127,255,0.04)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)";
              e.target.style.background = "var(--bg2)"; }}/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            {error ? (
              <span id="question-error" ref={errorRef} role="alert" tabIndex={-1}
                style={{ fontSize: "12px", color: "rgba(255,107,107,0.9)" }}>
                ⚠ {error}
              </span>
            ) : (
              <span id="question-hint" style={{ fontSize: "12px", color: "var(--faint)" }}>
                {submitHint}
              </span>
            )}
            <span style={{ fontSize: "12px", color: "var(--faint)" }} aria-live="polite">
              {question.length} / 600
            </span>
          </div>
        </div>

        <fieldset style={{ border: "none", padding: 0 }}>
          <legend style={{ fontSize: "10px", letterSpacing: "3px", color: "var(--faint)",
            textTransform: "uppercase", marginBottom: "12px" }}>Check depth</legend>
          <div style={{ display: "flex", gap: "8px" }}>
            {DEPTHS.map(d => (
              <button key={d.id} onClick={() => setDepth(d.id)}
                aria-pressed={depth === d.id}
                style={{
                  flex: 1, padding: "14px 10px", cursor: "pointer",
                  background: depth === d.id ? "var(--accent-dim)" : "var(--bg2)",
                  border: `0.5px solid ${depth === d.id ? "var(--accent-border)" : "var(--border)"}`,
                  borderRadius: "12px", color: depth === d.id ? "var(--accent)" : "var(--muted)",
                  fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", textAlign: "center",
                  minHeight: "44px" }}>
                <div style={{ fontSize: "18px", marginBottom: "5px" }} aria-hidden="true">{d.icon}</div>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>{d.label}</div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <button onClick={canSubmit ? onSubmit : undefined}
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          style={{
            padding: "18px 32px", cursor: canSubmit ? "pointer" : "not-allowed",
            background: canSubmit ? "rgba(155,127,255,0.14)" : "transparent",
            border: `0.5px solid ${canSubmit ? "rgba(155,127,255,0.4)" : "var(--border)"}`,
            color: canSubmit ? "#c4b2ff" : "var(--faint)", fontSize: "15px",
            fontFamily: "'DM Sans',sans-serif", borderRadius: "100px", transition: "all 0.25s",
            opacity: canSubmit ? 1 : 0.5, minHeight: "44px" }}>
          {canSubmit ? "Get my reality check →" : "Type something above first"}
        </button>

        <p style={{ fontSize: "12px", color: "var(--faint)", textAlign: "center", lineHeight: 1.6 }}>
          Powered by Claude AI · Honest by design · 100% free
        </p>
      </div>
    </main>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "challenges", label: "Challenges", icon: "⚠" },
  { id: "upside", label: "Upside", icon: "↑" },
  { id: "needs", label: "What You Need", icon: "✦" },
  { id: "plan", label: "30-Day Plan", icon: "◎" },
  { id: "mindset", label: "Mindset", icon: "◯" },
];

function OverviewTab({ r }) {
  const reduced = useReducedMotion();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {r.successFactors?.length > 0 && (
        <div>
          <SLabel>What will carry you</SLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {r.successFactors.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", padding: "13px 18px",
                background: "rgba(107,255,184,0.05)", border: "0.5px solid rgba(107,255,184,0.15)",
                borderLeft: "2px solid #6bffb840", borderRadius: "0 12px 12px 0",
                animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.06}s ease both` }}>
                <span style={{ color: "#6bffb8", fontSize: "14px", flexShrink: 0, marginTop: "1px" }} aria-hidden="true">✓</span>
                <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 300, lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {r.redFlags?.length > 0 && (
        <div>
          <SLabel>Red flags to watch</SLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {r.redFlags.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", padding: "13px 18px",
                background: "rgba(255,107,107,0.05)", border: "0.5px solid rgba(255,107,107,0.2)",
                borderLeft: "2px solid #ff6b6b60", borderRadius: "0 12px 12px 0",
                animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.06}s ease both` }}>
                <span style={{ color: "var(--high)", fontSize: "14px", flexShrink: 0, marginTop: "1px" }} aria-hidden="true">⚑</span>
                <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 300, lineHeight: 1.6 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengesTab({ challenges }) {
  const reduced = useReducedMotion();
  const sorted = [...challenges].sort((a, b) =>
    ({ high: 0, medium: 1, low: 2 }[a.severity] ?? 1) - ({ high: 0, medium: 1, low: 2 }[b.severity] ?? 1));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {sorted.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px",
          padding: "18px 20px", background: "var(--bg2)",
          borderLeft: `2px solid ${svc(c.severity)}50`,
          borderRadius: "0 13px 13px 0", border: `0.5px solid ${svc(c.severity)}18`,
          animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.07}s ease both` }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(240,238,252,0.85)" }}>{c.title}</span>
              <span style={{ padding: "2px 8px", borderRadius: "100px",
                background: `${svc(c.severity)}15`, border: `0.5px solid ${svc(c.severity)}40`,
                color: svc(c.severity), fontSize: "9px", letterSpacing: "1.5px",
                fontFamily: "'Space Mono',monospace" }}>{svl(c.severity)}</span>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65, fontWeight: 300 }}>{c.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpsideTab({ opportunities }) {
  const reduced = useReducedMotion();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {(opportunities || []).map((o, i) => (
        <div key={i} style={{ padding: "18px 20px", background: "rgba(107,255,184,0.04)",
          border: "0.5px solid rgba(107,255,184,0.13)", borderRadius: "13px",
          animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.07}s ease both` }}>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#6bffb8", marginBottom: "8px" }}>
            ↑ {o.title}
          </div>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65, fontWeight: 300 }}>{o.detail}</p>
        </div>
      ))}
    </div>
  );
}

function NeedsTab({ requirements: req }) {
  const reduced = useReducedMotion();
  if (!req) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {[
        { icon: "⏱", label: "Time commitment", value: req.time, color: "var(--accent)" },
        { icon: "💰", label: "Financial investment", value: req.money, color: "var(--med)" },
      ].map((r, i) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "16px",
          padding: "18px 20px", background: "var(--bg2)", border: "0.5px solid var(--border)",
          borderRadius: "13px", animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.07}s ease both` }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "11px",
            background: `${r.color}18`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "20px", flexShrink: 0 }} aria-hidden="true">{r.icon}</div>
          <div>
            <div style={{ fontSize: "10px", color: "var(--faint)", textTransform: "uppercase",
              letterSpacing: "2px", marginBottom: "4px" }}>{r.label}</div>
            <div style={{ fontSize: "15px", color: r.color, fontWeight: 500 }}>{r.value}</div>
          </div>
        </div>
      ))}
      {req.skills?.length > 0 && (
        <div style={{ padding: "20px", background: "var(--bg2)", border: "0.5px solid var(--border)",
          borderRadius: "13px", animation: reduced ? "none" : "fadeUp 0.4s 0.14s ease both" }}>
          <SLabel>Skills needed</SLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {req.skills.map((s, i) => (
              <span key={i} style={{ padding: "5px 14px", borderRadius: "100px",
                background: "var(--accent-dim)", border: "0.5px solid var(--accent-border)",
                color: "var(--accent)", fontSize: "13px" }}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanTab({ plan }) {
  const reduced = useReducedMotion();
  return (
    <div>
      {(plan || []).map((p, i) => (
        <div key={i} style={{ display: "flex", gap: "16px",
          animation: reduced ? "none" : `fadeUp 0.4s ${i * 0.1}s ease both` }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}
            aria-hidden="true">
            <div style={{ width: "10px", height: "10px", borderRadius: "50%",
              background: "var(--accent)", marginTop: "20px", flexShrink: 0,
              boxShadow: "0 0 10px rgba(155,127,255,0.6)" }}/>
            {i < (plan.length - 1) && (
              <div style={{ width: "1px", flex: 1, background: "rgba(155,127,255,0.18)", margin: "5px 0" }}/>
            )}
          </div>
          <div style={{ padding: "16px 0 24px", flex: 1 }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "9px",
              color: "var(--accent)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>
              {p.phase}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 500, color: "rgba(240,238,252,0.85)", marginBottom: "7px" }}>
              {p.focus}
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65, fontWeight: 300 }}>{p.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MindsetTab({ mindset }) {
  return (
    <div style={{ animation: "fadeUp 0.4s ease both", padding: "28px 30px",
      background: "rgba(155,127,255,0.06)", border: "0.5px solid rgba(155,127,255,0.2)", borderRadius: "16px" }}>
      <div style={{ fontSize: "36px", color: "rgba(155,127,255,0.3)",
        fontFamily: "'DM Serif Display',serif", lineHeight: 1, marginBottom: "16px" }} aria-hidden="true">"</div>
      <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(16px,3vw,21px)",
        fontStyle: "italic", lineHeight: 1.8, color: "rgba(240,238,252,0.82)" }}>{mindset}</p>
    </div>
  );
}

function ResultsPage({ results: r, question, activeTab, setActiveTab, onAgain }) {
  const color = sc(r.realityScore);
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const tablistRef = useRef(null);

  const copyAll = async () => {
    const t = `BeforeUstart Reality Check\n"${question}"\n\nReality Score: ${r.realityScore}/100 — ${r.scoreLabel}\n\nVerdict: ${r.verdict}\n\nCHALLENGES:\n${(r.challenges||[]).map((c,i)=>`${i+1}. [${(c.severity||"").toUpperCase()}] ${c.title}: ${c.detail}`).join("\n")}\n\nOPPORTUNITIES:\n${(r.opportunities||[]).map((o,i)=>`${i+1}. ${o.title}: ${o.detail}`).join("\n")}\n\nREQUIREMENTS:\nTime: ${r.requirements?.time}\nMoney: ${r.requirements?.money}\nSkills: ${(r.requirements?.skills||[]).join(", ")}\n\nMINDSET:\n${r.mindset}`;
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = t;
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTabKey = (e, idx) => {
    const tabs = tablistRef.current?.querySelectorAll('[role="tab"]');
    if (!tabs) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      tabs[(idx + 1) % tabs.length]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      tabs[(idx - 1 + tabs.length) % tabs.length]?.focus();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10,
        background: "rgba(8,8,15,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid var(--border)", padding: "11px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <BackBtn onClick={onAgain} label="new check" />
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "15px",
          color: "var(--muted)", flex: 1, textAlign: "center" }}>
          <span aria-hidden="true">{r.categoryEmoji}</span> {r.category}
        </div>
        <button onClick={copyAll} aria-label={copied ? "Copied to clipboard" : "Copy results to clipboard"}
          style={{ background: "none",
            border: "0.5px solid var(--border)", borderRadius: "8px", padding: "6px 13px",
            color: copied ? "var(--low)" : "var(--faint)", fontSize: "12px", cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", minHeight: "44px", minWidth: "44px",
            transition: "color 0.2s" }}>
          {copied ? "copied ✓" : "copy"}
        </button>
      </header>

      <main id="main-content" style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 22px 100px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
          gap: "18px", marginBottom: "32px", animation: reduced ? "none" : "fadeUp 0.5s ease both" }}>
          <ScoreGauge score={r.realityScore} label={r.scoreLabel} />
          <div style={{ maxWidth: "530px", textAlign: "center", padding: "20px 26px",
            background: `linear-gradient(135deg,${color}10,transparent)`,
            border: `0.5px solid ${color}30`, borderRadius: "16px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color, opacity: 0.7,
              textTransform: "uppercase", marginBottom: "10px" }} aria-hidden="true">verdict</div>
            <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(16px,3vw,20px)",
              fontStyle: "italic", lineHeight: 1.55 }}>{r.verdict}</p>
          </div>
        </div>

        <div role="tablist" ref={tablistRef} aria-label="Result sections"
          style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "24px",
            background: "var(--bg2)", border: "0.5px solid var(--border)",
            borderRadius: "12px", padding: "5px" }}>
          {TABS.map((t, idx) => (
            <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={activeTab === t.id ? 0 : -1}
              onClick={() => setActiveTab(t.id)}
              onKeyDown={e => handleTabKey(e, idx)}
              style={{
                flex: 1, minWidth: "70px", padding: "8px 8px", cursor: "pointer",
                background: activeTab === t.id ? "rgba(155,127,255,0.14)" : "transparent",
                border: `0.5px solid ${activeTab === t.id ? "var(--accent-border)" : "transparent"}`,
                borderRadius: "8px", color: activeTab === t.id ? "var(--accent)" : "var(--faint)",
                fontSize: "11px", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                whiteSpace: "nowrap", minHeight: "44px" }}>
              <div style={{ fontSize: "14px", marginBottom: "2px" }} aria-hidden="true">{t.icon}</div>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {TABS.map(t => (
          <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`}
            hidden={activeTab !== t.id}
            style={{ animation: activeTab === t.id && !reduced ? "fadeUp 0.3s ease both" : "none" }}>
            {activeTab === t.id && (
              <>
                {t.id === "overview" && <OverviewTab r={r} />}
                {t.id === "challenges" && <ChallengesTab challenges={r.challenges || []} />}
                {t.id === "upside" && <UpsideTab opportunities={r.opportunities || []} />}
                {t.id === "needs" && <NeedsTab requirements={r.requirements} />}
                {t.id === "plan" && <PlanTab plan={r.plan || []} />}
                {t.id === "mindset" && <MindsetTab mindset={r.mindset} />}
              </>
            )}
          </div>
        ))}
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
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} aria-hidden="true" style={{ position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}/>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Past checks"
        style={{ position: "relative", width: "310px", maxWidth: "90vw", height: "100%",
          background: "#0c0c18", borderLeft: "0.5px solid var(--border)",
          padding: "24px", overflowY: "auto", animation: "slideIn 0.3s ease both",
          paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <span style={{ fontSize: "13px", color: "var(--muted)", letterSpacing: "1px" }}>Past checks</span>
          <button ref={closeRef} onClick={onClose} aria-label="Close past checks panel"
            style={{ background: "none", border: "none",
              color: "var(--faint)", cursor: "pointer", fontSize: "20px", lineHeight: 1,
              minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {history.length === 0 ? (
          <p style={{ color: "var(--faint)", fontSize: "13px" }}>No checks yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.map(h => (
              <div key={h.id} style={{ padding: "14px 16px", background: "var(--bg2)",
                border: "0.5px solid var(--border)", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", color: "rgba(240,238,252,0.7)", lineHeight: 1.4 }}>
                    {h.question}
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 500, color: sc(h.score),
                    flexShrink: 0, fontFamily: "'DM Serif Display',serif" }}
                    aria-label={`Score: ${h.score}`}>{h.score}</span>
                </div>
                <span style={{ fontSize: "10px", color: "var(--faint)" }}>{h.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState("standard");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("bys_history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [showHist, setShowHist] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("bys_history", JSON.stringify(history)); } catch {}
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

      let err;
      if (!res.ok) {
        try { err = await res.json(); } catch {}
        throw new Error(err?.error || `Server error ${res.status}`);
      }

      const parsed = await res.json();
      const entry = {
        id: crypto.randomUUID(),
        question: question.length > 75 ? question.slice(0, 75) + "…" : question,
        score: parsed.realityScore,
        category: parsed.category,
        date: new Date().toLocaleDateString(),
      };
      setHistory(h => [entry, ...h].slice(0, 10));
      setResults(parsed); setActiveTab("overview"); setPage("results");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setPage("input");
    }
  }, [question, depth]);

  useEffect(() => {
    const titles = {
      home: "BeforeUstart — Know Before You Begin",
      input: "Reality Check — BeforeUstart",
      loading: "Analyzing… — BeforeUstart",
      results: results ? `${results.realityScore}/100 Reality Score — BeforeUstart` : "Results — BeforeUstart",
    };
    document.title = titles[page] || titles.home;
  }, [page, results]);

  return (
    <>
      <style>{CSS}</style>
      {showHist && <HistoryPanel history={history} onClose={() => setShowHist(false)} />}
      {page === "home" && (
        <HomePage onStart={() => setPage("input")}
          history={history} onHist={() => setShowHist(true)} />
      )}
      {page === "input" && (
        <InputPage question={question} setQuestion={setQuestion}
          depth={depth} setDepth={setDepth}
          onSubmit={runCheck} onBack={() => setPage("home")} error={error} />
      )}
      {page === "loading" && <LoadingPage question={question} />}
      {page === "results" && results && (
        <ResultsPage results={results} question={question}
          activeTab={activeTab} setActiveTab={setActiveTab}
          onAgain={() => { setQuestion(""); setResults(null); setPage("input"); }} />
      )}
    </>
  );
}
