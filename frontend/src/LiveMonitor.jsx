import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, CategoryScale,
  LinearScale, PointElement, Filler, Tooltip, Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend);

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];
const BASE_LOAD = [45,30,15,80,75,60,55,50,58,62,48,53,51,49,56];

function LiveMonitor({ isDark }) {
  const loadsRef = useRef(BASE_LOAD.map(v => v));
  const [loads, setLoads] = useState(BASE_LOAD.map(v => v));
  const [history, setHistory] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      t: new Date(Date.now() - (29 - i) * 1000),
      v: BASE_LOAD.reduce((a, b) => a + b, 0) + (Math.random() - 0.5) * 40,
    }))
  );

  useEffect(() => {
    const iv = setInterval(() => {
      const newLoads = loadsRef.current.map(v =>
        Math.max(5, Math.min(110, v + (Math.random() - 0.48) * 8))
      );
      loadsRef.current = newLoads;
      setLoads([...newLoads]);
      setHistory(prev => [
        ...prev.slice(-29),
        { t: new Date(), v: newLoads.reduce((a, b) => a + b, 0) },
      ]);
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  const totalLoad = loads.reduce((a, b) => a + b, 0).toFixed(1);
  const peakIdx = loads.indexOf(Math.max(...loads));

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    innerCard: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    grid: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };

  const chartData = {
    labels: history.map(h =>
      h.t.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    ),
    datasets: [{
      label: "Campus Load (kW)",
      data: history.map(h => +h.v.toFixed(1)),
      borderColor: "#38bdf8",
      backgroundColor: "rgba(56,189,248,0.08)",
      tension: 0.4, fill: true, pointRadius: 0, borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: {
      legend: { labels: { color: t.sub, font: { family: "Inter" } } },
      tooltip: {
        backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff",
        borderColor: "rgba(56,189,248,0.3)", borderWidth: 1,
        titleColor: t.text, bodyColor: t.sub,
      },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, maxTicksLimit: 6, font: { family: "Inter", size: 10 } } },
      y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, callback: v => `${v} kW` } },
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Live Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: "20px", padding: "4px 14px",
          fontSize: "12px", fontWeight: "700", color: "#22c55e", letterSpacing: "1px",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block",
            boxShadow: "0 0 6px #22c55e" }} />
          LIVE
        </span>
        <span style={{ color: t.sub, fontSize: "13px" }}>Real-time campus IoT energy monitoring</span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {[
          { label: "Total Campus Load", value: `${totalLoad} kW`, color: "#38bdf8", icon: "⚡" },
          { label: "Active Buildings", value: "15", color: "#22c55e", icon: "🏛️" },
          { label: "Peak Building", value: BUILDINGS[peakIdx], color: "#fb923c", icon: "🔥" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{s.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: t.sub, marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live Chart */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Live Load Waveform</div>
        <div style={{ height: "220px" }}><Line data={chartData} options={chartOptions} /></div>
      </div>

      {/* Building Grid */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Live Building Loads</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {BUILDINGS.map((b, i) => {
            const pct = Math.min(100, (loads[i] / 110) * 100);
            const color = pct > 70 ? "#f87171" : pct > 45 ? "#fb923c" : "#22c55e";
            return (
              <div key={b} style={{ background: t.innerCard, borderRadius: "10px", padding: "12px", border: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: t.text, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80px" }}>{b}</span>
                  <span style={{ fontSize: "11px", color, fontWeight: "700" }}>{loads[i].toFixed(1)} kW</span>
                </div>
                <div style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LiveMonitor;
