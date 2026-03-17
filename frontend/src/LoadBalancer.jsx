import { useState, useEffect, useRef, useCallback } from "react";

const BUILDINGS = [
  "Admin Block", "Cafeteria", "Parking Lot", "Boys Hostel", "Girls Hostel",
  "A-Block", "B-Block", "C-Block", "D-Block", "E-Block",
  "F-Block", "G-Block", "H-Block", "I-Block", "J-Block",
];
const BASE_LOAD = [45, 30, 15, 80, 75, 60, 55, 50, 58, 62, 48, 53, 51, 49, 56];
const MAX_SAFE_LOAD = 95; // kW — overload threshold

function getLoadColor(load) {
  if (load >= MAX_SAFE_LOAD) return "#f87171";
  if (load >= 70) return "#fb923c";
  if (load >= 40) return "#facc15";
  return "#22c55e";
}

function LoadBar({ load, isDark }) {
  const pct = Math.min(100, (load / 110) * 100);
  const color = getLoadColor(load);
  return (
    <div style={{ height: "6px", background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginTop: "6px" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.7s ease" }} />
    </div>
  );
}

function LoadBalancer({ isDark }) {
  const loadsRef = useRef(BASE_LOAD.map(v => v + (Math.random() - 0.5) * 10));
  const [loads, setLoads] = useState(loadsRef.current.map(v => +v.toFixed(1)));
  const [source, setSource] = useState(0);
  const [target, setTarget] = useState(1);
  const [amount, setAmount] = useState(10);
  const [transferLog, setTransferLog] = useState([]);
  const [flash, setFlash] = useState(null); // index of flashing building
  const [toast, setToast] = useState(null);
  const [overloadWarn, setOverloadWarn] = useState(false);

  // Live simulation (gentle drift, 1.5 s)
  useEffect(() => {
    const iv = setInterval(() => {
      loadsRef.current = loadsRef.current.map(v =>
        Math.max(5, Math.min(105, v + (Math.random() - 0.49) * 4))
      );
      setLoads(loadsRef.current.map(v => +v.toFixed(1)));
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  // Check overload whenever source/target/amount changes
  useEffect(() => {
    const projectedTarget = loads[target] + amount;
    setOverloadWarn(projectedTarget > MAX_SAFE_LOAD);
  }, [source, target, amount, loads]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const executeTransfer = useCallback(() => {
    if (source === target) {
      showToast("⚠️ Source and target must be different.", "error");
      return;
    }
    const projectedTarget = loadsRef.current[target] + amount;
    if (projectedTarget > MAX_SAFE_LOAD) {
      showToast(`🚫 Overload! Target would reach ${projectedTarget.toFixed(1)} kW`, "error");
      return;
    }
    if (loadsRef.current[source] - amount < 5) {
      showToast(`⚠️ Source load too low to shed ${amount} kW safely.`, "error");
      return;
    }

    // Apply transfer
    loadsRef.current = loadsRef.current.map((v, i) => {
      if (i === source) return Math.max(5, v - amount);
      if (i === target) return Math.min(105, v + amount);
      return v;
    });
    setLoads(loadsRef.current.map(v => +v.toFixed(1)));

    // Flash both buildings
    setFlash({ source, target });
    setTimeout(() => setFlash(null), 1200);

    // Log the transfer
    const entry = {
      id: Date.now(),
      from: BUILDINGS[source],
      to: BUILDINGS[target],
      amount,
      time: new Date().toLocaleTimeString("en-IN"),
    };
    setTransferLog(prev => [entry, ...prev].slice(0, 12));
    showToast(`✅ Shifted ${amount} kW from ${BUILDINGS[source]} → ${BUILDINGS[target]}`);
  }, [source, target, amount]);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    inner: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    input: isDark ? "#1e293b" : "#f8fafc",
    inputBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
  };

  const selectStyle = {
    padding: "10px 14px", borderRadius: "10px", border: `1px solid ${t.inputBorder}`,
    background: t.input, color: t.text, fontSize: "13px",
    fontFamily: "Inter, sans-serif", outline: "none", width: "100%",
    colorScheme: isDark ? "dark" : "light",
  };

  const projectedTarget = (loads[target] + amount).toFixed(1);
  const projectedSource = Math.max(5, loads[source] - amount).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: "20px", padding: "4px 14px",
          fontSize: "12px", fontWeight: "700", color: "#22c55e", letterSpacing: "1px",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e", animation: "glow-pulse 2s infinite" }} />
          LIVE BALANCER
        </span>
        <span style={{ fontSize: "13px", color: t.sub }}>Shift load intelligently between departments to avoid overload</span>
      </div>

      {/* Summary stat bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {[
          { label: "Highest Load", value: `${Math.max(...loads).toFixed(1)} kW`, color: "#f87171", icon: "🔥" },
          { label: "Lowest Load", value: `${Math.min(...loads).toFixed(1)} kW`, color: "#22c55e", icon: "📉" },
          { label: "Transfers Done", value: transferLog.length, color: "#38bdf8", icon: "⚖️" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* ── Transfer Control Panel ── */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>⚙️ Transfer Control</div>

          {/* Source */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
              Source Department (shed load FROM)
            </label>
            <select value={source} onChange={e => setSource(+e.target.value)} style={selectStyle}>
              {BUILDINGS.map((b, i) => (
                <option key={b} value={i}>{b} — {loads[i]} kW</option>
              ))}
            </select>
            <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "10px", background: t.inner, border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: t.sub }}>Current → After Transfer</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#f87171" }}>
                  {loads[source]} kW → <span style={{ color: "#22c55e" }}>{projectedSource} kW</span>
                </span>
              </div>
              <LoadBar load={loads[source]} isDark={isDark} />
            </div>
          </div>

          {/* Arrow divider */}
          <div style={{ textAlign: "center", fontSize: "24px", color: "#38bdf8", lineHeight: 1 }}>⬇️</div>

          {/* Target */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
              Target Department (receive load TO)
            </label>
            <select value={target} onChange={e => setTarget(+e.target.value)} style={selectStyle}>
              {BUILDINGS.map((b, i) => (
                <option key={b} value={i}>{b} — {loads[i]} kW</option>
              ))}
            </select>
            <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "10px", background: t.inner, border: `1px solid ${overloadWarn ? "rgba(248,113,113,0.4)" : t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: t.sub }}>Current → After Transfer</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8" }}>
                  {loads[target]} kW → <span style={{ color: overloadWarn ? "#f87171" : "#22c55e" }}>{projectedTarget} kW</span>
                </span>
              </div>
              <LoadBar load={+projectedTarget} isDark={isDark} />
            </div>
          </div>

          {/* Amount slider */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: "700", color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Transfer Amount</span>
              <span style={{ color: "#38bdf8", fontSize: "14px" }}>{amount} kW</span>
            </label>
            <input
              type="range" min={1} max={30} value={amount}
              onChange={e => setAmount(+e.target.value)}
              style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: t.sub, marginTop: "4px" }}>
              <span>1 kW</span><span>15 kW</span><span>30 kW</span>
            </div>
          </div>

          {/* Overload warning */}
          {overloadWarn && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.35)", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>🚫</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#f87171" }}>Overload Risk!</div>
                <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>
                  Target would reach <strong style={{ color: "#f87171" }}>{projectedTarget} kW</strong> — exceeds safe limit of {MAX_SAFE_LOAD} kW
                </div>
              </div>
            </div>
          )}

          {/* Execute button */}
          <button
            onClick={executeTransfer}
            disabled={overloadWarn || source === target}
            style={{
              padding: "13px", borderRadius: "12px", border: "none",
              background: overloadWarn || source === target
                ? (isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0")
                : "linear-gradient(135deg,#22c55e,#16a34a)",
              color: overloadWarn || source === target ? t.sub : "#fff",
              fontSize: "15px", fontWeight: "700", cursor: overloadWarn || source === target ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              boxShadow: overloadWarn || source === target ? "none" : "0 4px 18px rgba(34,197,94,0.35)",
              transition: "all 0.2s",
            }}
          >
            ⚡ Execute Transfer
          </button>
        </div>

        {/* ── Live Building Grid + Transfer Log ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Building Grid */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "20px" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "14px" }}>🏛️ Live Department Loads</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
              {BUILDINGS.map((b, i) => {
                const load = loads[i];
                const color = getLoadColor(load);
                const isFlashSource = flash?.source === i;
                const isFlashTarget = flash?.target === i;
                const isSelected = i === source || i === target;
                return (
                  <div key={b} style={{
                    borderRadius: "10px", padding: "10px 12px",
                    border: `1px solid ${isSelected ? color + "66" : t.border}`,
                    background: isFlashSource ? "rgba(34,197,94,0.12)" : isFlashTarget ? "rgba(56,189,248,0.12)" : t.inner,
                    transition: "all 0.4s",
                    boxShadow: isFlashSource || isFlashTarget ? `0 0 14px ${color}44` : "none",
                  }}>
                    <div style={{ fontSize: "10px", color: t.text, fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>{b}</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color }}>{load} kW</div>
                    <LoadBar load={load} isDark={isDark} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transfer Log */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "20px", flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "14px" }}>📋 Transfer History</div>
            {transferLog.length === 0
              ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: t.sub }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚖️</div>
                  <div style={{ fontSize: "13px" }}>No transfers yet. <br />Select buildings and execute a transfer.</div>
                </div>
              )
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                  {transferLog.map(entry => (
                    <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "10px", background: t.inner, border: `1px solid ${t.border}` }}>
                      <span style={{ fontSize: "16px" }}>⚡</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: t.text }}>
                          <span style={{ color: "#f87171" }}>{entry.from}</span>
                          <span style={{ color: t.sub, margin: "0 6px" }}>→</span>
                          <span style={{ color: "#22c55e" }}>{entry.to}</span>
                        </div>
                        <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{entry.time}</div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                        -{entry.amount} kW
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          padding: "14px 22px", borderRadius: "14px", border: "1px solid",
          backdropFilter: "blur(8px)", color: "#f1f5f9",
          fontSize: "14px", fontWeight: "600",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 200,
          animation: "slide-in-right 0.3s ease",
          background: toast.type === "error" ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.15)",
          borderColor: toast.type === "error" ? "rgba(248,113,113,0.4)" : "rgba(34,197,94,0.4)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default LoadBalancer;
