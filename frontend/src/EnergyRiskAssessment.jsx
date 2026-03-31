import { useMemo, useState } from "react";

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];

const HIGH_THRESHOLD  = 300;
const MED_THRESHOLD   = 150;

function getRisk(kwh) {
  if (kwh >= HIGH_THRESHOLD) return { label: "High",   color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.3)",  icon: "🔴" };
  if (kwh >= MED_THRESHOLD)  return { label: "Medium", color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.3)",   icon: "🟡" };
  return                             { label: "Low",    color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.3)",   icon: "🟢" };
}

function RiskMeter({ value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 75 ? "#f87171" : pct >= 45 ? "#fb923c" : "#10b981";
  return (
    <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginTop: "6px" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.6s ease" }} />
    </div>
  );
}

function EnergyRiskAssessment({ data, isDark }) {
  const [filter, setFilter] = useState("All");

  const t = {
    card:   isDark ? "rgba(255,255,255,0.04)" : "#d1fae5",
    inner:  isDark ? "rgba(255,255,255,0.03)" : "#ecfdf5",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(6,95,70,0.15)",
    text:   isDark ? "#f1f5f9" : "#064e3b",
    sub:    isDark ? "#64748b" : "#047857",
  };

  const buildingRisks = useMemo(() => {
    return BUILDINGS.map(b => {
      const records = data.filter(d => d.building === b);
      const total   = records.reduce((s, d) => s + (d.consumption || 0), 0);
      const avg     = records.length ? total / records.length : 0;
      const peak    = records.length ? Math.max(...records.map(d => d.consumption || 0)) : 0;
      // Use peak for risk (worst-case scenario)
      const score   = peak || avg;
      const risk    = getRisk(score);
      return { name: b, total: +total.toFixed(1), avg: +avg.toFixed(1), peak: +peak.toFixed(1), score, risk, records: records.length };
    });
  }, [data]);

  const maxPeak = Math.max(...buildingRisks.map(b => b.score), 1);
  const highCount   = buildingRisks.filter(b => b.risk.label === "High").length;
  const medCount    = buildingRisks.filter(b => b.risk.label === "Medium").length;
  const lowCount    = buildingRisks.filter(b => b.risk.label === "Low").length;

  const filtered = filter === "All" ? buildingRisks : buildingRisks.filter(b => b.risk.label === filter);
  const sorted   = [...filtered].sort((a, b) => b.score - a.score);

  const FILTERS = ["All", "High", "Medium", "Low"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
        {[
          { label: "Total Buildings",  value: buildingRisks.length, color: t.text,    icon: "🏛️" },
          { label: "High Risk",        value: highCount,             color: "#f87171",  icon: "🔴" },
          { label: "Medium Risk",      value: medCount,              color: "#fb923c",  icon: "🟡" },
          { label: "Low Risk",         value: lowCount,              color: "#10b981",  icon: "🟢" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "26px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Risk Banner */}
      {highCount > 0 && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "14px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "24px" }}>🚨</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f87171" }}>High Risk Alert</div>
            <div style={{ fontSize: "12px", color: t.sub, marginTop: "2px" }}>{highCount} building{highCount > 1 ? "s are" : " is"} in high-risk zone. Immediate energy review recommended.</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
            cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s",
            border: filter === f
              ? (f === "High" ? "1px solid rgba(248,113,113,0.4)" : f === "Medium" ? "1px solid rgba(251,146,60,0.4)" : f === "Low" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(16,185,129,0.35)")
              : `1px solid ${t.border}`,
            background: filter === f
              ? (f === "High" ? "rgba(248,113,113,0.12)" : f === "Medium" ? "rgba(251,146,60,0.12)" : f === "Low" ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.12)")
              : "transparent",
            color: filter === f
              ? (f === "High" ? "#f87171" : f === "Medium" ? "#fb923c" : f === "Low" ? "#10b981" : "#10b981")
              : t.sub,
          }}>
            {f === "High" ? "🔴" : f === "Medium" ? "🟡" : f === "Low" ? "🟢" : "📋"} {f} {f !== "All" ? `(${buildingRisks.filter(b => b.risk.label === f).length})` : `(${buildingRisks.length})`}
          </button>
        ))}
      </div>

      {/* Building Risk Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px" }}>
        {sorted.map(b => (
          <div key={b.name} style={{
            background: b.risk.bg, border: `1px solid ${b.risk.border}`,
            borderRadius: "16px", padding: "18px 20px",
            transition: "transform 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>{b.name}</div>
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "3px 10px",
                borderRadius: "10px", background: b.risk.bg, border: `1px solid ${b.risk.border}`,
                color: b.risk.color,
              }}>
                {b.risk.icon} {b.risk.label} Risk
              </span>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "10px" }}>
              {[
                { label: "Peak", value: `${b.peak} kWh`, color: b.risk.color },
                { label: "Avg",  value: `${b.avg} kWh`,  color: t.text },
                { label: "Records", value: b.records,    color: t.sub },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "10px", color: t.sub, marginTop: "1px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Risk meter */}
            <div style={{ fontSize: "10px", color: t.sub, marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
              <span>Risk Level</span>
              <span style={{ color: b.risk.color }}>{Math.round((b.score / maxPeak) * 100)}%</span>
            </div>
            <RiskMeter value={b.score} max={maxPeak} />

            {/* Recommendation */}
            {b.risk.label === "High" && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#f87171", background: "rgba(248,113,113,0.08)", borderRadius: "8px", padding: "6px 10px" }}>
                ⚡ Immediate action: Audit energy usage, fix leaks, consider load shedding.
              </div>
            )}
            {b.risk.label === "Medium" && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#fb923c", background: "rgba(251,146,60,0.08)", borderRadius: "8px", padding: "6px 10px" }}>
                📋 Monitor closely. Review schedules and occupancy patterns.
              </div>
            )}
          </div>
        ))}

        {sorted.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: t.sub }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <p>No buildings at {filter} risk.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "12px" }}>📌 Risk Thresholds</div>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {[
            { label: "🔴 High Risk",   desc: "Peak ≥ 300 kWh", color: "#f87171" },
            { label: "🟡 Medium Risk", desc: "150 – 299 kWh",   color: "#fb923c" },
            { label: "🟢 Low Risk",    desc: "< 150 kWh",       color: "#10b981" },
          ].map(r => (
            <div key={r.label}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: r.color }}>{r.label}</span>
              <span style={{ fontSize: "12px", color: t.sub, marginLeft: "6px" }}>({r.desc})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EnergyRiskAssessment;
