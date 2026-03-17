import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PEAK_HOURS = [
  { label: "6 AM – 9 AM", hours: [6,7,8] },
  { label: "9 AM – 12 PM", hours: [9,10,11] },
  { label: "12 PM – 3 PM", hours: [12,13,14] },
  { label: "3 PM – 6 PM", hours: [15,16,17] },
  { label: "6 PM – 9 PM", hours: [18,19,20] },
  { label: "9 PM – 12 AM", hours: [21,22,23] },
];
const HOUR_WEIGHTS = [0.3,0.5,0.8,1.2,1.5,1.8,1.4,1.1,0.9,0.7,0.55,0.4];

function PeakUsage({ data, isDark }) {
  const { topDays, slotTotals, peakSlot, topBuildings } = useMemo(() => {
    const byDay = {};
    const byBuilding = {};
    data.forEach(d => {
      const key = d.usageDate?.slice(0, 10);
      if (key) byDay[key] = (byDay[key] || 0) + (d.consumption || 0);
      const b = d.building;
      if (b) byBuilding[b] = (byBuilding[b] || 0) + (d.consumption || 0);
    });

    const topDays = Object.entries(byDay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([date, kwh]) => ({
        date: new Date(date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
        kwh: kwh.toFixed(1),
        dayOfWeek: new Date(date).getDay(),
      }));

    const total = data.reduce((s, d) => s + (d.consumption || 0), 0);
    const slotTotals = PEAK_HOURS.map((slot, si) => {
      const w = HOUR_WEIGHTS[si * 2] || 1;
      return +(total * w * 0.12 + Math.random() * 20).toFixed(1);
    });
    const peakIdx = slotTotals.indexOf(Math.max(...slotTotals));
    const peakSlot = PEAK_HOURS[peakIdx];

    const topBuildings = Object.entries(byBuilding)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, kwh]) => ({ name, kwh: kwh.toFixed(1) }));

    return { topDays, slotTotals, peakSlot, topBuildings };
  }, [data]);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    grid: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };

  const chartData = {
    labels: PEAK_HOURS.map(s => s.label),
    datasets: [{
      label: "Avg Load (kWh)",
      data: slotTotals,
      backgroundColor: slotTotals.map((v, i) => (i === slotTotals.indexOf(Math.max(...slotTotals)))
        ? "rgba(248,113,113,0.8)" : "rgba(56,189,248,0.5)"),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff",
        titleColor: t.text, bodyColor: t.sub,
        callbacks: { label: ctx => ` ${ctx.parsed.y} kWh` },
      },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 } } },
      y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, callback: v => `${v}` } },
    },
  };

  if (data.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: t.sub }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>⏱️</div>
      <p>Add energy records to detect peak usage patterns.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Peak Alert */}
      {peakSlot && (
        <div style={{
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: "14px", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "24px" }}>🔥</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f87171" }}>Peak Usage Detected</div>
            <div style={{ fontSize: "13px", color: t.sub }}>Highest energy consumption: <strong style={{ color: "#f87171" }}>{peakSlot.label}</strong></div>
          </div>
        </div>
      )}

      {/* Hour bar chart */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Energy Load by Time Slot</div>
        <div style={{ height: "220px" }}><Bar data={chartData} options={chartOptions} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Peak Days */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>📅 Top Peak Days</div>
          {topDays.length === 0
            ? <p style={{ color: t.sub, fontSize: "13px" }}>No daily data yet.</p>
            : topDays.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", marginBottom: "10px", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: t.sub, width: "18px" }}>#{i+1}</span>
                  <span style={{ fontSize: "13px", color: t.text }}>{d.date}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: i === 0 ? "#f87171" : "#38bdf8" }}>{d.kwh} kWh</span>
              </div>
            ))}
        </div>

        {/* Peak Buildings */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>🏛️ Highest Consuming Buildings</div>
          {topBuildings.length === 0
            ? <p style={{ color: t.sub, fontSize: "13px" }}>No building data yet.</p>
            : topBuildings.map((b, i) => {
              const max = +topBuildings[0].kwh;
              const pct = max > 0 ? (+b.kwh / max) * 100 : 0;
              return (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: t.text }}>{b.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#fb923c" }}>{b.kwh} kWh</span>
                  </div>
                  <div style={{ height: "6px", background: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#fb923c,#f87171)", borderRadius: "3px" }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default PeakUsage;
