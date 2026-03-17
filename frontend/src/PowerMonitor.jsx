import { useState, useEffect, useRef, useMemo } from "react";

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];
const BASE_LOAD = [45,30,15,80,75,60,55,50,58,62,48,53,51,49,56];
const DROP_THRESHOLD = 3;      // kW — below this = power cut
const DROP_DETECT_RATIO = 0.30; // 30% sudden drop = suspect failure

function PowerMonitor({ data, isDark }) {
  const loadsRef = useRef(BASE_LOAD.map(v => v));
  const prevLoadsRef = useRef(BASE_LOAD.map(v => v));
  const [loads, setLoads] = useState(BASE_LOAD.map(v => v));
  const [events, setEvents] = useState([]);       // alert log
  const [simFailure, setSimFailure] = useState(null); // building index with simulated cut
  const [history, setHistory] = useState(() =>
    BUILDINGS.map(() => Array(20).fill(null).map((_, i) => ({
      t: Date.now() - (19 - i) * 2000,
      v: BASE_LOAD[Math.floor(Math.random() * BASE_LOAD.length)] * (0.85 + Math.random() * 0.3),
    })))
  );

  // Live simulation
  useEffect(() => {
    const iv = setInterval(() => {
      prevLoadsRef.current = [...loadsRef.current];
      const newLoads = loadsRef.current.map((v, i) => {
        if (simFailure === i) return 0;
        return Math.max(3, Math.min(110, v + (Math.random() - 0.48) * 8));
      });
      loadsRef.current = newLoads;
      setLoads([...newLoads]);

      // Detect sudden drops
      newLoads.forEach((load, i) => {
        const prev = prevLoadsRef.current[i];
        const dropped = load < DROP_THRESHOLD || (prev > 10 && load / prev < DROP_DETECT_RATIO);
        if (dropped) {
          setEvents(ev => {
            const already = ev.find(e => e.building === BUILDINGS[i] && !e.resolved);
            if (already) return ev;
            return [{
              id: Date.now() + i,
              building: BUILDINGS[i],
              time: new Date().toLocaleTimeString("en-IN"),
              type: load < DROP_THRESHOLD ? "cut" : "dip",
              load: load.toFixed(1),
              resolved: false,
            }, ...ev].slice(0, 20);
          });
        }
        // Auto-resolve when load recovers
        if (load > 10) {
          setEvents(ev => ev.map(e => e.building === BUILDINGS[i] && !e.resolved ? { ...e, resolved: true } : e));
        }
      });

      setHistory(prev => prev.map((bHist, i) => [
        ...bHist.slice(-19),
        { t: Date.now(), v: newLoads[i] },
      ]));
    }, 1500);
    return () => clearInterval(iv);
  }, [simFailure]);

  // Real data failures: buildings with 0 recent records but had past records
  const realFailures = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date(now); sevenDays.setDate(now.getDate() - 7);
    const recent = data.filter(d => new Date(d.usageDate) >= sevenDays);
    const past = data.filter(d => new Date(d.usageDate) < sevenDays);
    const recentBuildings = new Set(recent.map(d => d.building));
    const pastBuildings = new Set(past.map(d => d.building));
    return [...pastBuildings].filter(b => b && !recentBuildings.has(b));
  }, [data]);

  const activeAlerts = events.filter(e => !e.resolved);
  const resolvedEvents = events.filter(e => e.resolved);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    innerCard: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
  };

  const resolveAll = () => setEvents(ev => ev.map(e => ({ ...e, resolved: true })));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: activeAlerts.length > 0 ? "rgba(248,113,113,0.12)" : "rgba(34,197,94,0.12)", border: `1px solid ${activeAlerts.length > 0 ? "rgba(248,113,113,0.35)" : "rgba(34,197,94,0.35)"}`, borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: "700", color: activeAlerts.length > 0 ? "#f87171" : "#22c55e", letterSpacing: "0.5px" }}>
            {activeAlerts.length > 0 ? `⚡ ${activeAlerts.length} ACTIVE FAILURE${activeAlerts.length > 1 ? "S" : ""}` : "✅ ALL SYSTEMS NORMAL"}
          </span>
          <span style={{ fontSize: "13px", color: t.sub }}>Real-time power failure detection</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              const idx = Math.floor(Math.random() * BUILDINGS.length);
              setSimFailure(idx);
              setTimeout(() => setSimFailure(null), 8000);
            }}
            style={{ padding: "7px 14px", borderRadius: "9px", border: "1px solid rgba(251,146,60,0.35)", background: "rgba(251,146,60,0.1)", color: "#fb923c", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >⚡ Simulate Failure</button>
          {activeAlerts.length > 0 && (
            <button onClick={resolveAll} style={{ padding: "7px 14px", borderRadius: "9px", border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✓ Resolve All</button>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {activeAlerts.map(e => (
            <div key={e.id} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <span style={{ fontSize: "22px", animation: "pulse 1.5s infinite" }}>🚨</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#f87171" }}>
                  {e.type === "cut" ? "⚠ Power failure detected" : "⚠ Power dip detected"} in {e.building}
                </div>
                <div style={{ fontSize: "12px", color: t.sub, marginTop: "3px" }}>
                  Load dropped to {e.load} kW at {e.time}
                  {e.type === "cut" ? " — possible power cut or meter offline" : " — sudden drop detected"}
                </div>
              </div>
              <button
                onClick={() => setEvents(ev => ev.map(x => x.id === e.id ? { ...x, resolved: true } : x))}
                style={{ background: "none", border: "none", color: t.sub, cursor: "pointer", fontSize: "16px", padding: "0", flexShrink: 0 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Real data gaps */}
      {realFailures.length > 0 && (
        <div style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.25)", borderRadius: "14px", padding: "14px 18px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#fb923c", marginBottom: "8px" }}>📊 No recent data for these buildings (last 7 days)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {realFailures.map(b => (
              <span key={b} style={{ padding: "3px 10px", borderRadius: "8px", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", fontSize: "12px", color: "#fb923c", fontWeight: "600" }}>{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Building Status Grid */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Live Building Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {BUILDINGS.map((b, i) => {
            const load = loads[i];
            const isCut = load < DROP_THRESHOLD;
            const isLow = !isCut && load < 15;
            const status = isCut ? "FAILURE" : isLow ? "LOW" : "NORMAL";
            const statusColor = isCut ? "#f87171" : isLow ? "#fb923c" : "#22c55e";
            const statusBg = isCut ? "rgba(248,113,113,0.1)" : isLow ? "rgba(251,146,60,0.1)" : "rgba(34,197,94,0.06)";
            const borderColor = isCut ? "rgba(248,113,113,0.35)" : isLow ? "rgba(251,146,60,0.3)" : t.border;
            return (
              <div key={b} style={{ background: statusBg, borderRadius: "12px", padding: "12px 14px", border: `1px solid ${borderColor}`, transition: "all 0.4s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: t.text, fontWeight: "700", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b}</span>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: statusColor, background: isCut ? "rgba(248,113,113,0.15)" : "transparent", borderRadius: "4px", padding: "1px 4px" }}>{isCut && "🔴 "}{status}</span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: statusColor }}>
                  {isCut ? "0.0" : load.toFixed(1)} kW
                </div>
                <div style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: "2px", marginTop: "6px" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (load / 100) * 100)}%`, background: statusColor, borderRadius: "2px", transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Event Log */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Event Log</div>
        {events.length === 0
          ? <div style={{ textAlign: "center", padding: "30px 0", color: t.sub, fontSize: "13px" }}>No events recorded yet. Click "Simulate Failure" to test detection.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
              {events.map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                  <span style={{ fontSize: "14px" }}>{e.resolved ? "✅" : "🚨"}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: e.resolved ? "#22c55e" : "#f87171" }}>
                      {e.type === "cut" ? "Power cut" : "Power dip"} — {e.building}
                    </span>
                    <span style={{ fontSize: "11px", color: t.sub, marginLeft: "8px" }}>{e.time}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: e.resolved ? t.sub : "#f87171", textTransform: "uppercase" }}>{e.resolved ? "resolved" : "active"}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

export default PowerMonitor;
