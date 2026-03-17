import { useState, useEffect, useRef, useCallback } from "react";

const BUILDINGS = [
  "Admin Block", "Cafeteria", "Parking Lot", "Boys Hostel", "Girls Hostel",
  "A-Block", "B-Block", "C-Block", "D-Block", "E-Block",
  "F-Block", "G-Block", "H-Block", "I-Block", "J-Block",
];

// Each building has 2-3 devices
const BUILDING_DEVICES = BUILDINGS.map((b, bi) => [
  { name: "HVAC Unit",      baseline: 18 + (bi % 5) * 3 },
  { name: "Lighting Grid",  baseline: 12 + (bi % 4) * 2 },
  { name: "Server / AV",    baseline:  8 + (bi % 3) * 4 },
]);

const FAULT_TYPES = {
  spike:    { label: "Spike",    color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.35)", icon: "⚡", severity: 4 },
  flatline: { label: "Flatline", color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.35)",  icon: "📉", severity: 3 },
  erratic:  { label: "Erratic",  color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.35)", icon: "〜", severity: 2 },
};

function SeverityDots({ score }) {
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {[1,2,3,4,5].map(n => (
        <div key={n} style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: n <= score ? "#f87171" : "rgba(248,113,113,0.2)",
        }} />
      ))}
    </div>
  );
}

function FaultDetection({ isDark }) {
  // readings[buildingIdx][deviceIdx] = float
  const baselines = useRef(BUILDING_DEVICES.map(devs => devs.map(d => d.baseline)));
  const readingsRef = useRef(baselines.current.map(devs => devs.map(v => v)));
  const prevReadingsRef = useRef(readingsRef.current.map(r => [...r]));
  const flatlineTicks = useRef(BUILDINGS.map(() => [0, 0, 0]));

  const [readings, setReadings] = useState(readingsRef.current.map(r => r.map(v => +v.toFixed(2))));
  const [faults, setFaults] = useState([]); // active faults
  const [eventLog, setEventLog] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(0);
  const [simCooldown, setSimCooldown] = useState(false);

  // Normal drift simulation
  useEffect(() => {
    const iv = setInterval(() => {
      prevReadingsRef.current = readingsRef.current.map(r => [...r]);
      readingsRef.current = readingsRef.current.map((devs, bi) =>
        devs.map((v, di) => {
          const base = baselines.current[bi][di];
          const newVal = Math.max(0.5, Math.min(base * 2.5, v + (Math.random() - 0.49) * 2.2));
          return newVal;
        })
      );
      setReadings(readingsRef.current.map(r => r.map(v => +v.toFixed(2))));

      // Detect faults automatically
      readingsRef.current.forEach((devs, bi) => {
        devs.forEach((val, di) => {
          const base = baselines.current[bi][di];
          const prev = prevReadingsRef.current[bi][di];
          const faultKey = `${bi}-${di}`;

          let detectedType = null;

          // Spike: > 150% of baseline
          if (val > base * 1.5) {
            detectedType = "spike";
          }
          // Erratic: swing > 45% between consecutive ticks
          else if (prev > 1 && Math.abs(val - prev) / prev > 0.45) {
            detectedType = "erratic";
          }
          // Flatline: value varies < 2% for 5+ ticks
          else if (Math.abs(val - prev) < base * 0.02) {
            flatlineTicks.current[bi][di]++;
            if (flatlineTicks.current[bi][di] >= 5) detectedType = "flatline";
          } else {
            flatlineTicks.current[bi][di] = 0;
          }

          if (detectedType) {
            setFaults(prev => {
              if (prev.find(f => f.key === faultKey && !f.resolved)) return prev;
              const entry = {
                id: Date.now() + bi * 100 + di,
                key: faultKey, bi, di,
                building: BUILDINGS[bi],
                device: BUILDING_DEVICES[bi][di].name,
                type: detectedType,
                value: val.toFixed(2),
                baseline: base,
                time: new Date().toLocaleTimeString("en-IN"),
                resolved: false,
                severity: FAULT_TYPES[detectedType].severity,
              };
              setEventLog(log => [entry, ...log].slice(0, 30));
              return [entry, ...prev].slice(0, 20);
            });
          }

          // Auto-resolve: reading back in normal band (70%–130% baseline)
          if (val >= base * 0.7 && val <= base * 1.3) {
            setFaults(prev =>
              prev.map(f => f.key === faultKey && !f.resolved
                ? { ...f, resolved: true, resolvedTime: new Date().toLocaleTimeString("en-IN") }
                : f)
            );
          }
        });
      });
    }, 1400);
    return () => clearInterval(iv);
  }, []);

  // Simulate a device fault
  const simulateFault = useCallback(() => {
    if (simCooldown) return;
    const bi = Math.floor(Math.random() * BUILDINGS.length);
    const di = Math.floor(Math.random() * 3);
    const base = baselines.current[bi][di];
    const types = ["spike", "erratic", "flatline"];
    const pick = types[Math.floor(Math.random() * types.length)];

    if (pick === "spike") {
      readingsRef.current[bi][di] = base * 1.8 + Math.random() * base * 0.5;
    } else if (pick === "erratic") {
      readingsRef.current[bi][di] = base * 0.3;
    } else {
      // Force flatline by pegging to a fixed value for next 8 ticks
      const fixed = base * 0.95;
      for (let t = 0; t < 8; t++) flatlineTicks.current[bi][di]++;
      readingsRef.current[bi][di] = fixed;
    }

    setSimCooldown(true);
    setTimeout(() => setSimCooldown(false), 5000);
    setSelectedBuilding(bi); // navigate to that building's view
  }, [simCooldown]);

  const resolveAll = () => setFaults(prev => prev.map(f => ({ ...f, resolved: true })));
  const activeFaults = faults.filter(f => !f.resolved);

  const t = {
    card:   isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    inner:  isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text:   isDark ? "#f1f5f9" : "#1e293b",
    sub:    isDark ? "#64748b" : "#94a3b8",
    input:  isDark ? "#1e293b" : "#f8fafc",
    inputBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
  };

  const selectStyle = {
    padding: "9px 14px", borderRadius: "9px", border: `1px solid ${t.inputBorder}`,
    background: t.input, color: t.text, fontSize: "13px",
    fontFamily: "Inter, sans-serif", outline: "none",
    colorScheme: isDark ? "dark" : "light",
  };

  const selBuilding = BUILDINGS[selectedBuilding];
  const selDevices = BUILDING_DEVICES[selectedBuilding];
  const selFaults = activeFaults.filter(f => f.bi === selectedBuilding);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: activeFaults.length > 0 ? "rgba(248,113,113,0.12)" : "rgba(34,197,94,0.12)",
            border: `1px solid ${activeFaults.length > 0 ? "rgba(248,113,113,0.35)" : "rgba(34,197,94,0.35)"}`,
            borderRadius: "20px", padding: "4px 14px",
            fontSize: "12px", fontWeight: "700",
            color: activeFaults.length > 0 ? "#f87171" : "#22c55e",
            letterSpacing: "0.5px",
          }}>
            {activeFaults.length > 0
              ? `🔴 ${activeFaults.length} ACTIVE FAULT${activeFaults.length > 1 ? "S" : ""}`
              : "✅ ALL DEVICES NORMAL"}
          </span>
          <span style={{ fontSize: "13px", color: t.sub }}>AI-powered device behaviour monitoring</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={simulateFault} disabled={simCooldown}
            style={{
              padding: "8px 16px", borderRadius: "9px",
              border: "1px solid rgba(167,139,250,0.4)",
              background: simCooldown ? "transparent" : "rgba(167,139,250,0.1)",
              color: simCooldown ? t.sub : "#a78bfa",
              fontSize: "12px", fontWeight: "700", cursor: simCooldown ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            🔬 {simCooldown ? "Simulating…" : "Simulate Device Fault"}
          </button>
          {activeFaults.length > 0 && (
            <button onClick={resolveAll} style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              ✓ Resolve All
            </button>
          )}
        </div>
      </div>

      {/* Active fault banners */}
      {activeFaults.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activeFaults.slice(0, 5).map(f => {
            const ft = FAULT_TYPES[f.type];
            return (
              <div key={f.id} style={{ background: ft.bg, border: `1px solid ${ft.border}`, borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <span style={{ fontSize: "22px" }}>{ft.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: ft.color }}>
                    {ft.label} fault — {f.device} @ {f.building}
                  </div>
                  <div style={{ fontSize: "12px", color: t.sub, marginTop: "3px" }}>
                    Reading: <strong style={{ color: ft.color }}>{f.value} W</strong> vs baseline {f.baseline} W · detected at {f.time}
                  </div>
                  <div style={{ marginTop: "8px" }}><SeverityDots score={f.severity} /></div>
                </div>
                <button
                  onClick={() => setFaults(prev => prev.map(x => x.id === f.id ? { ...x, resolved: true } : x))}
                  style={{ background: "none", border: "none", color: t.sub, cursor: "pointer", fontSize: "16px", padding: 0 }}
                >✕</button>
              </div>
            );
          })}
          {activeFaults.length > 5 && (
            <div style={{ fontSize: "12px", color: t.sub, textAlign: "center" }}>+{activeFaults.length - 5} more active faults…</div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Building Inspector */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>🔍 Device Inspector</div>
            <select value={selectedBuilding} onChange={e => setSelectedBuilding(+e.target.value)} style={selectStyle}>
              {BUILDINGS.map((b, i) => (
                <option key={b} value={i}>
                  {b}{faults.filter(f => f.bi === i && !f.resolved).length > 0 ? " 🔴" : ""}
                </option>
              ))}
            </select>
          </div>

          {selDevices.map((dev, di) => {
            const val = readings[selectedBuilding][di];
            const base = baselines.current[selectedBuilding][di];
            const pct = Math.min(100, (val / (base * 2.5)) * 100);
            const devFault = selFaults.find(f => f.di === di);
            const ft = devFault ? FAULT_TYPES[devFault.type] : null;
            const statusColor = ft ? ft.color : val > base * 1.15 ? "#fb923c" : "#22c55e";
            return (
              <div key={dev.name} style={{
                padding: "14px 16px", borderRadius: "14px",
                background: ft ? ft.bg : t.inner,
                border: `1px solid ${ft ? ft.border : t.border}`,
                transition: "all 0.4s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{dev.name}</div>
                    <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>Baseline: {base} W</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: statusColor }}>{val.toFixed(1)} W</div>
                    {ft && (
                      <span style={{ fontSize: "10px", fontWeight: "700", color: ft.color, background: ft.bg, padding: "1px 7px", borderRadius: "6px", border: `1px solid ${ft.border}` }}>
                        {ft.icon} {ft.label.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Reading bar */}
                <div style={{ height: "5px", background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: statusColor, borderRadius: "3px", transition: "width 0.6s ease" }} />
                </div>
                {ft && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: t.sub }}>Severity:</span>
                    <SeverityDots score={ft.severity} />
                  </div>
                )}
              </div>
            );
          })}

          {selFaults.length === 0 && (
            <div style={{ textAlign: "center", padding: "12px 0", color: "#22c55e", fontSize: "13px", fontWeight: "600" }}>
              ✅ All devices in {selBuilding} are operating normally
            </div>
          )}
        </div>

        {/* All-Buildings Fault Grid + Event Log */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Building overview grid */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "20px" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "14px" }}>🏛️ Campus Fault Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
              {BUILDINGS.map((b, i) => {
                const bfaults = activeFaults.filter(f => f.bi === i);
                const hasFault = bfaults.length > 0;
                const worstSeverity = hasFault ? Math.max(...bfaults.map(f => f.severity)) : 0;
                return (
                  <button key={b} onClick={() => setSelectedBuilding(i)} style={{
                    padding: "10px 8px", borderRadius: "10px",
                    border: `1px solid ${hasFault ? "rgba(248,113,113,0.4)" : t.border}`,
                    background: hasFault ? "rgba(248,113,113,0.08)" : t.inner,
                    cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                    outline: selectedBuilding === i ? "2px solid rgba(56,189,248,0.5)" : "none",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b}</div>
                    <div style={{ marginTop: "4px" }}>
                      {hasFault
                        ? <><span style={{ fontSize: "10px", color: "#f87171", fontWeight: "700" }}>🔴 {bfaults.length} fault{bfaults.length > 1 ? "s" : ""}</span><SeverityDots score={worstSeverity} /></>
                        : <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: "600" }}>✅ Normal</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Log */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "20px", flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "14px" }}>📋 Fault Event Log</div>
            {eventLog.length === 0
              ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: t.sub, fontSize: "13px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔬</div>
                  No events yet. Click "Simulate Device Fault" to test detection.
                </div>
              )
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: "7px", maxHeight: "260px", overflowY: "auto" }}>
                  {eventLog.map(e => {
                    const ft = FAULT_TYPES[e.type];
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "9px", background: t.inner }}>
                        <span style={{ fontSize: "14px" }}>{e.resolved ? "✅" : ft.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: e.resolved ? "#22c55e" : ft.color }}>
                            {ft.label} — {e.device}
                          </span>
                          <span style={{ fontSize: "11px", color: t.sub, marginLeft: "6px" }}>@ {e.building}</span>
                          <span style={{ fontSize: "10px", color: t.sub, marginLeft: "6px" }}>{e.time}</span>
                        </div>
                        <span style={{
                          fontSize: "9px", fontWeight: "700", textTransform: "uppercase",
                          color: e.resolved ? t.sub : ft.color,
                        }}>{e.resolved ? "resolved" : "active"}</span>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default FaultDetection;
