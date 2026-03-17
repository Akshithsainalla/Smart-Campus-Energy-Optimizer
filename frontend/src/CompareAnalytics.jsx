import { useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];
const TABS = [
  { id: "dept", label: "Dept vs Dept" },
  { id: "daily", label: "Today vs Yesterday" },
  { id: "monthly", label: "This Month vs Last Month" },
];

function CompareAnalytics({ data, isDark }) {
  const [tab, setTab] = useState("dept");
  const [bldA, setBldA] = useState(BUILDINGS[0]);
  const [bldB, setBldB] = useState(BUILDINGS[1]);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    innerCard: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    grid: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };

  const chartOptions = (title) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.sub, font: { family: "Inter", size: 11 } } },
      tooltip: {
        backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff",
        titleColor: t.text, bodyColor: t.sub,
        callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)} kWh` },
      },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 } } },
      y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, callback: v => `${v} kWh` } },
    },
  });

  const deptChart = useMemo(() => {
    const totA = data.filter(d => d.building === bldA).reduce((s, d) => s + (d.consumption || 0), 0);
    const totB = data.filter(d => d.building === bldB).reduce((s, d) => s + (d.consumption || 0), 0);
    return {
      labels: [bldA, bldB],
      datasets: [{
        label: "Total kWh",
        data: [+totA.toFixed(1), +totB.toFixed(1)],
        backgroundColor: ["rgba(56,189,248,0.6)", "rgba(167,139,250,0.6)"],
        borderRadius: 10, borderSkipped: false,
      }],
    };
  }, [data, bldA, bldB]);

  const dailyChart = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const todayKwh = data.filter(d => d.usageDate?.slice(0,10) === today).reduce((s, d) => s + (d.consumption || 0), 0);
    const yestKwh = data.filter(d => d.usageDate?.slice(0,10) === yesterday).reduce((s, d) => s + (d.consumption || 0), 0);
    return {
      labels: ["Today", "Yesterday"],
      datasets: [{
        label: "Total kWh",
        data: [+todayKwh.toFixed(1), +yestKwh.toFixed(1)],
        backgroundColor: ["rgba(52,211,153,0.6)", "rgba(99,102,241,0.6)"],
        borderRadius: 10, borderSkipped: false,
      }],
    };
  }, [data]);

  const monthChart = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const lastDate = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,"0")}`;
    const thisKwh = data.filter(d => d.usageDate?.slice(0,7) === thisMonth).reduce((s,d) => s+(d.consumption||0),0);
    const lastKwh = data.filter(d => d.usageDate?.slice(0,7) === lastMonth).reduce((s,d) => s+(d.consumption||0),0);
    const tLabel = now.toLocaleDateString("en-IN",{month:"long"});
    const lLabel = lastDate.toLocaleDateString("en-IN",{month:"long"});
    return {
      labels: [tLabel, lLabel],
      datasets: [{
        label: "Total kWh",
        data: [+thisKwh.toFixed(1), +lastKwh.toFixed(1)],
        backgroundColor: ["rgba(251,146,60,0.6)", "rgba(248,113,113,0.6)"],
        borderRadius: 10, borderSkipped: false,
      }],
    };
  }, [data]);

  const charts = { dept: deptChart, daily: dailyChart, monthly: monthChart };
  const activeChart = charts[tab];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        {TABS.map(t2 => (
          <button
            key={t2.id}
            onClick={() => setTab(t2.id)}
            style={{
              padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
              fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: "600",
              border: tab === t2.id ? "1px solid rgba(56,189,248,0.3)" : `1px solid ${t.border}`,
              background: tab === t2.id ? "rgba(56,189,248,0.1)" : "transparent",
              color: tab === t2.id ? "#38bdf8" : t.sub,
              transition: "all 0.15s",
            }}
          >{t2.label}</button>
        ))}
      </div>

      {/* Dept selector */}
      {tab === "dept" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[{val: bldA, set: setBldA, label: "Building A", color: "#38bdf8"},
            {val: bldB, set: setBldB, label: "Building B", color: "#a78bfa"}].map(({val,set,label,color}) => (
            <div key={label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>{label}</label>
              <select
                value={val}
                onChange={e => set(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${t.border}`,
                  background: isDark ? "#1e293b" : "#f1f5f9", color: t.text,
                  fontSize: "13px", fontFamily: "Inter, sans-serif", outline: "none", colorScheme: isDark ? "dark" : "light" }}
              >
                {BUILDINGS.filter(b => b !== (label === "Building A" ? bldB : bldA)).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "20px" }}>
          {TABS.find(x => x.id === tab)?.label}
        </div>
        <div style={{ height: "260px" }}>
          <Bar data={activeChart} options={chartOptions()} />
        </div>
      </div>

      {/* Insight */}
      {tab === "dept" && (
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px", fontSize: "13px", color: t.sub }}>
          💡 <strong style={{ color: t.text }}>Insight:</strong>{" "}
          {deptChart.datasets[0].data[0] > deptChart.datasets[0].data[1]
            ? `${bldA} consumes more energy than ${bldB}. Consider load optimization for ${bldA}.`
            : deptChart.datasets[0].data[0] < deptChart.datasets[0].data[1]
            ? `${bldB} consumes more energy than ${bldA}. Consider load optimization for ${bldB}.`
            : `${bldA} and ${bldB} have similar consumption patterns.`}
        </div>
      )}
    </div>
  );
}

export default CompareAnalytics;
