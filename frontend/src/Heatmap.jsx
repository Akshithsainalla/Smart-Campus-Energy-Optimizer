import { useState, useMemo } from "react";

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];

function kwhColor(ratio, isDark) {
  if (ratio === 0) return isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  if (ratio < 0.25) return "rgba(56,189,248,0.45)";
  if (ratio < 0.5)  return "rgba(56,189,248,0.75)";
  if (ratio < 0.75) return "rgba(251,146,60,0.75)";
  return "rgba(248,113,113,0.85)";
}

function Heatmap({ data, isDark }) {
  const [tooltip, setTooltip] = useState(null);

  const { days, matrix, maxVal } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });

    const matrix = {};
    BUILDINGS.forEach(b => {
      matrix[b] = {};
      days.forEach(d => { matrix[b][d] = 0; });
    });
    data.forEach(d => {
      const key = d.usageDate?.slice(0, 10);
      if (d.building && BUILDINGS.includes(d.building) && matrix[d.building] && key && matrix[d.building][key] !== undefined) {
        matrix[d.building][key] += d.consumption || 0;
      }
    });

    const maxVal = Math.max(1, ...BUILDINGS.flatMap(b => days.map(d => matrix[b][d])));
    return { days, matrix, maxVal };
  }, [data]);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    label: isDark ? "#94a3b8" : "#475569",
  };

  const cellW = 38;
  const cellH = 28;
  const labelW = 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ fontSize: "13px", color: t.sub }}>
        🌡️ Hover over cells to see exact kWh values. Darker = higher consumption.
      </div>

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "20px" }}>Energy Heatmap — Last 14 Days</div>

        <div style={{ overflowX: "auto", position: "relative" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: "3px" }}>
            <thead>
              <tr>
                <th style={{ width: `${labelW}px`, padding: 0 }} />
                {days.map(d => {
                  const dt = new Date(d + "T00:00:00");
                  return (
                    <th key={d} style={{ width: `${cellW}px`, fontSize: "9px", fontWeight: "600", color: t.sub, textAlign: "center", padding: "0 0 4px" }}>
                      {dt.toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {BUILDINGS.map(b => (
                <tr key={b}>
                  <td style={{ fontSize: "10px", color: t.label, fontWeight: "600", paddingRight: "8px", whiteSpace: "nowrap", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b}
                  </td>
                  {days.map(d => {
                    const val = matrix[b][d];
                    const ratio = val / maxVal;
                    const color = kwhColor(ratio, isDark);
                    return (
                      <td key={d}
                        onMouseEnter={e => setTooltip({ b, d, val, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          width: `${cellW}px`, height: `${cellH}px`,
                          background: color, borderRadius: "4px", cursor: "default",
                          transition: "opacity 0.15s",
                        }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <span style={{ fontSize: "11px", color: t.sub }}>0 kWh</span>
          {[0.04, 0.45, 0.75, 0.85, 1].map((r, i) => (
            <div key={i} style={{ width: "28px", height: "16px", borderRadius: "4px", background: kwhColor(r, isDark) }} />
          ))}
          <span style={{ fontSize: "11px", color: t.sub }}>{maxVal.toFixed(0)} kWh</span>
        </div>

        {/* Color scale labels */}
        <div style={{ display: "flex", gap: "8px", marginTop: "6px", marginLeft: "38px" }}>
          {["None", "Low", "Medium", "High", "Peak"].map(label => (
            <span key={label} style={{ fontSize: "10px", color: t.sub, width: "28px", textAlign: "center" }}>{label}</span>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 12, top: tooltip.y - 40,
          background: isDark ? "rgba(15,23,42,0.97)" : "#fff",
          border: "1px solid rgba(56,189,248,0.3)", borderRadius: "8px",
          padding: "8px 12px", zIndex: 999, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          fontSize: "12px", fontWeight: "600",
          color: isDark ? "#f1f5f9" : "#1e293b",
          fontFamily: "Inter, sans-serif",
        }}>
          {tooltip.b} · {new Date(tooltip.d + "T00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          <br />
          <span style={{ color: "#38bdf8" }}>{tooltip.val.toFixed(1)} kWh</span>
        </div>
      )}
    </div>
  );
}

export default Heatmap;
