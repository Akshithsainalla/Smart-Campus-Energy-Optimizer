import { useState, useMemo } from "react";

const BUILDING_LAYOUT = [
  { id: "Admin Block", x: 10, y: 10, w: 140, h: 60, label: "Admin Block", icon: "🏛️" },
  { id: "Cafeteria", x: 170, y: 10, w: 100, h: 60, label: "Cafeteria", icon: "🍽️" },
  { id: "Parking Lot", x: 290, y: 10, w: 120, h: 60, label: "Parking Lot", icon: "🚗" },
  { id: "Boys Hostel", x: 10, y: 100, w: 110, h: 80, label: "Boys Hostel", icon: "🏠" },
  { id: "Girls Hostel", x: 140, y: 100, w: 110, h: 80, label: "Girls Hostel", icon: "🏠" },
  { id: "A-Block", x: 10, y: 210, w: 70, h: 60, label: "A", icon: "" },
  { id: "B-Block", x: 90, y: 210, w: 70, h: 60, label: "B", icon: "" },
  { id: "C-Block", x: 170, y: 210, w: 70, h: 60, label: "C", icon: "" },
  { id: "D-Block", x: 250, y: 210, w: 70, h: 60, label: "D", icon: "" },
  { id: "E-Block", x: 330, y: 210, w: 70, h: 60, label: "E", icon: "" },
  { id: "F-Block", x: 10, y: 290, w: 70, h: 60, label: "F", icon: "" },
  { id: "G-Block", x: 90, y: 290, w: 70, h: 60, label: "G", icon: "" },
  { id: "H-Block", x: 170, y: 290, w: 70, h: 60, label: "H", icon: "" },
  { id: "I-Block", x: 250, y: 290, w: 70, h: 60, label: "I", icon: "" },
  { id: "J-Block", x: 330, y: 290, w: 70, h: 60, label: "J", icon: "" },
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(low, high, t) {
  return [
    Math.round(lerp(low[0], high[0], t)),
    Math.round(lerp(low[1], high[1], t)),
    Math.round(lerp(low[2], high[2], t)),
  ];
}

function CampusMap({ data, isDark }) {
  const [selected, setSelected] = useState(null);

  const byBuilding = useMemo(() => {
    const m = {};
    data.forEach(d => {
      if (d.building) m[d.building] = (m[d.building] || 0) + (d.consumption || 0);
    });
    return m;
  }, [data]);

  const maxKwh = Math.max(1, ...Object.values(byBuilding));

  function buildingColor(id) {
    const kwh = byBuilding[id] || 0;
    const ratio = kwh / maxKwh;
    if (ratio === 0) return isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
    const low = [56, 189, 248];   // blue
    const mid = [251, 146, 60];   // orange
    const high = [248, 113, 113]; // red
    const [r, g, b] = ratio < 0.5
      ? lerpColor(low, mid, ratio * 2)
      : lerpColor(mid, high, (ratio - 0.5) * 2);
    return `rgba(${r},${g},${b},0.65)`;
  }

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    mapBg: isDark ? "rgba(255,255,255,0.02)" : "#f1f5f9",
    stroke: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
    label: isDark ? "#e2e8f0" : "#1e293b",
  };

  const sel = selected ? BUILDING_LAYOUT.find(b => b.id === selected) : null;
  const selKwh = selected ? (byBuilding[selected] || 0).toFixed(1) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ fontSize: "13px", color: t.sub }}>👆 Click a building to view its energy stats</div>

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>🗺️ Campus Energy Map</div>

        {/* SVG Map */}
        <div style={{ overflowX: "auto" }}>
          <svg width="420" height="370" style={{ background: t.mapBg, borderRadius: "12px", display: "block" }}>
            {/* Road lines */}
            <line x1="0" y1="90" x2="420" y2="90" stroke={t.stroke} strokeWidth="4" strokeDasharray="8,4" />
            <line x1="0" y1="195" x2="420" y2="195" stroke={t.stroke} strokeWidth="4" strokeDasharray="8,4" />
            <line x1="0" y1="280" x2="420" y2="280" stroke={t.stroke} strokeWidth="4" strokeDasharray="8,4" />

            {BUILDING_LAYOUT.map(b => {
              const fill = buildingColor(b.id);
              const isSelected = selected === b.id;
              const kwh = byBuilding[b.id] || 0;
              return (
                <g key={b.id} onClick={() => setSelected(isSelected ? null : b.id)} style={{ cursor: "pointer" }}>
                  <rect
                    x={b.x} y={b.y} width={b.w} height={b.h}
                    rx="8" ry="8"
                    fill={fill}
                    stroke={isSelected ? "#38bdf8" : t.stroke}
                    strokeWidth={isSelected ? 2.5 : 1}
                    style={{ transition: "all 0.2s" }}
                  />
                  {b.icon && (
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 6} textAnchor="middle" fontSize="14">{b.icon}</text>
                  )}
                  <text
                    x={b.x + b.w / 2} y={b.y + (b.icon ? b.h / 2 + 10 : b.h / 2 + 5)}
                    textAnchor="middle" fontSize={b.icon ? "10" : "13"}
                    fontWeight="700" fill={t.label} fontFamily="Inter, sans-serif"
                  >{b.label}</text>
                  {kwh > 0 && (
                    <text
                      x={b.x + b.w / 2} y={b.y + b.h - 8}
                      textAnchor="middle" fontSize="9" fill={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"}
                      fontFamily="Inter, sans-serif"
                    >{kwh.toFixed(0)} kWh</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px" }}>
          <span style={{ fontSize: "11px", color: t.sub }}>Low</span>
          <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "linear-gradient(90deg, rgba(56,189,248,0.65), rgba(251,146,60,0.65), rgba(248,113,113,0.65))" }} />
          <span style={{ fontSize: "11px", color: t.sub }}>High</span>
        </div>
      </div>

      {/* Selected building panel */}
      {sel && (
        <div style={{ background: t.card, border: "1px solid rgba(56,189,248,0.25)", borderRadius: "18px", padding: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, marginBottom: "12px" }}>
            {sel.icon || "🏢"} {sel.id}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[
              { label: "Total Consumption", value: `${selKwh} kWh`, color: "#38bdf8" },
              { label: "Records", value: data.filter(d => d.building === sel.id).length, color: "#a78bfa" },
              { label: "Status", value: selKwh > 0 ? (selKwh / maxKwh > 0.6 ? "⚠️ High" : "✅ Normal") : "No Data", color: "#34d399" },
            ].map(s => (
              <div key={s.label} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: t.sub, marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CampusMap;
