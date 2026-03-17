import { useState, useMemo } from "react";

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];
const DEFAULT_RATE = 8;

function Billing({ data, isDark }) {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [rateInput, setRateInput] = useState(String(DEFAULT_RATE));
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const rows = useMemo(() => {
    const filtered = month
      ? data.filter(d => d.usageDate?.slice(0, 7) === month)
      : data;
    return BUILDINGS.map(b => {
      const kwh = +filtered.filter(d => d.building === b).reduce((s, d) => s + (d.consumption || 0), 0).toFixed(1);
      const cost = +(kwh * rate).toFixed(2);
      return { building: b, kwh, cost };
    }).filter(r => r.kwh > 0).sort((a, b) => b.cost - a.cost);
  }, [data, rate, month]);

  const totalKwh = rows.reduce((s, r) => s + r.kwh, 0).toFixed(1);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0).toFixed(2);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    row: isDark ? "rgba(255,255,255,0.025)" : "#f8fafc",
    th: { padding: "10px 14px", fontSize: "11px", fontWeight: "700", color: isDark ? "#475569" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` },
    td: { padding: "13px 14px", fontSize: "14px", color: isDark ? "#cbd5e1" : "#334155", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` },
  };

  const inputStyle = {
    padding: "9px 12px", borderRadius: "8px", border: `1px solid ${t.border}`,
    background: isDark ? "#1e293b" : "#f1f5f9", color: t.text,
    fontSize: "14px", fontFamily: "Inter, sans-serif", outline: "none",
    colorScheme: isDark ? "dark" : "light",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Controls */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>₹ per kWh Rate</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#facc15", fontSize: "16px" }}>₹</span>
            <input
              type="number"
              min="1" step="0.5"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              onBlur={() => { const v = parseFloat(rateInput); if (!isNaN(v) && v > 0) setRate(v); }}
              style={{ ...inputStyle, width: "80px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Month Filter</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle }} />
        </div>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          {[
            { label: "Total Consumption", value: `${totalKwh} kWh`, color: "#38bdf8", icon: "⚡" },
            { label: "Total Campus Bill", value: `₹${Number(totalCost).toLocaleString("en-IN")}`, color: "#facc15", icon: "💰" },
            { label: "Rate Applied", value: `₹${rate}/kWh`, color: "#34d399", icon: "📋" },
          ].map(s => (
            <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px" }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: t.sub, marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Building-wise Electricity Cost</div>
        {rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: t.sub }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>💡</div>
            <p>No energy records for the selected month.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Building", "Consumption (kWh)", "Cost (₹)", "% of Total"].map(h => (
                    <th key={h} style={t.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = totalKwh > 0 ? ((r.kwh / totalKwh) * 100).toFixed(1) : 0;
                  return (
                    <tr key={r.building} style={{ background: i % 2 === 1 ? t.row : "transparent" }}>
                      <td style={t.td}>{i + 1}</td>
                      <td style={t.td}>{r.building}</td>
                      <td style={{ ...t.td, color: "#38bdf8", fontWeight: "600" }}>{r.kwh}</td>
                      <td style={{ ...t.td, color: "#facc15", fontWeight: "700" }}>₹{r.cost.toLocaleString("en-IN")}</td>
                      <td style={t.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#38bdf8,#818cf8)", borderRadius: "3px" }} />
                          </div>
                          <span style={{ fontSize: "12px", color: t.sub, width: "36px" }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${t.border}` }}>
                  <td colSpan="2" style={{ ...t.td, fontWeight: "700", color: t.text }}>Campus Total</td>
                  <td style={{ ...t.td, fontWeight: "700", color: "#38bdf8" }}>{totalKwh} kWh</td>
                  <td style={{ ...t.td, fontWeight: "700", color: "#facc15", fontSize: "16px" }}>₹{Number(totalCost).toLocaleString("en-IN")}</td>
                  <td style={t.td}>100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div style={{ marginTop: "12px", fontSize: "11px", color: t.sub }}>
          Formula: Cost (₹) = Consumption (kWh) × Rate (₹{rate}/kWh)
        </div>
      </div>
    </div>
  );
}

export default Billing;
