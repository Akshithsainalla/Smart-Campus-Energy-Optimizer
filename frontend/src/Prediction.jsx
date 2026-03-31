import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, CategoryScale, LinearScale,
  PointElement, Filler, Tooltip, Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend);

function linReg(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 200 };
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = ys.reduce((s, y, i) => s + (i - xMean) * (y - yMean), 0);
  const den = ys.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  return { slope, intercept: yMean - slope * xMean };
}

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function Prediction({ data, isDark }) {
  const { realLabels, realVals, predLabels, predVals, forecast, trend } = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.usageDate) - new Date(b.usageDate));
    const byDay = {};
    sorted.forEach(d => {
      const key = d.usageDate?.slice(0, 10);
      if (key) byDay[key] = (byDay[key] || 0) + (d.consumption || 0);
    });
    const days = Object.keys(byDay).slice(-14);
    const vals = days.map(d => +byDay[d].toFixed(1));
    const { slope, intercept } = linReg(vals.length ? vals : [200, 210, 205]);
    const n = vals.length || 14;

    const forecast = Array.from({ length: 7 }, (_, i) => {
      const predicted = Math.max(50, +(intercept + slope * (n + i)).toFixed(1));
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
        value: predicted,
        day: DAYS[date.getDay()],
      };
    });

    const trendDir = slope > 2 ? "📈 Increasing" : slope < -2 ? "📉 Decreasing" : "➡️ Stable";
    const realLabels = days.map(d => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
    const predLabels = forecast.map(f => f.date.split(",")[0] || f.date);

    return {
      realLabels, realVals: vals,
      predLabels, predVals: forecast.map(f => f.value),
      forecast, trend: trendDir,
    };
  }, [data]);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    innerCard: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    grid: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };

  const allLabels = [...realLabels, ...predLabels];
  const realFull = [...realVals, ...Array(predLabels.length).fill(null)];
  const predFull = [...Array(realLabels.length).fill(null), ...predVals];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: "Actual (kWh)",
        data: realFull,
        borderColor: "#10b981",
        backgroundColor: "rgba(56,189,248,0.08)",
        tension: 0.4, fill: true, pointRadius: 4,
        borderWidth: 2,
      },
      {
        label: "Predicted (kWh)",
        data: predFull,
        borderColor: "#a78bfa",
        backgroundColor: "rgba(167,139,250,0.06)",
        tension: 0.4, fill: true, pointRadius: 4,
        borderWidth: 2, borderDash: [6, 3],
      },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.sub, font: { family: "Inter" } } },
      tooltip: {
        backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff",
        borderColor: "rgba(167,139,250,0.3)", borderWidth: 1,
        titleColor: t.text, bodyColor: t.sub,
        callbacks: { label: ctx => ` ${ctx.parsed.y} kWh` },
      },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, maxTicksLimit: 10 } },
      y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, callback: v => `${v} kWh` } },
    },
  };

  if (data.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: t.sub }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🤖</div>
      <p>Add at least 2 energy records to generate predictions.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* AI Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{
          background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)",
          borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: "700",
          color: "#a78bfa", letterSpacing: "0.5px",
        }}>🤖 AI MODEL</span>
        <span style={{ fontSize: "13px", color: t.sub }}>Linear regression trend — 7-day energy forecast</span>
        <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: "700", color: trend.includes("Increasing") ? "#f87171" : trend.includes("Decreasing") ? "#22c55e" : "#38bdf8" }}>{trend}</span>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
        {[
          { label: "Tomorrow's Prediction", value: `${forecast[0]?.value} kWh`, color: "#a78bfa", icon: "🔮" },
          { label: "7-Day Total (Predicted)", value: `${forecast.reduce((a, f) => a + f.value, 0).toFixed(0)} kWh`, color: "#10b981", icon: "📅" },
          { label: "7-Day Avg (Predicted)", value: `${(forecast.reduce((a, f) => a + f.value, 0) / 7).toFixed(1)} kWh/day`, color: "#34d399", icon: "📉" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "20px" }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: t.sub, marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>Actual vs Predicted Consumption</div>
        <div style={{ height: "240px" }}><Line data={chartData} options={chartOptions} /></div>
      </div>

      {/* 7-day forecast table */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "16px" }}>7-Day Forecast</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {forecast.map((f, i) => {
            const max = Math.max(...forecast.map(x => x.value));
            const pct = max > 0 ? (f.value / max) * 100 : 0;
            const color = pct > 75 ? "#f87171" : pct > 50 ? "#fb923c" : "#34d399";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ width: "90px", fontSize: "12px", color: t.sub, flexShrink: 0 }}>{f.date}</span>
                <div style={{ flex: 1, height: "8px", background: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.5s ease" }} />
                </div>
                <span style={{ width: "80px", textAlign: "right", fontSize: "13px", fontWeight: "700", color, flexShrink: 0 }}>{f.value} kWh</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Prediction;
