import { useState, useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement, LineElement, CategoryScale, LinearScale,
  PointElement, Filler, Tooltip, Legend,
} from "chart.js";

ChartJS.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend);

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];

// Simulated hourly load profile
const HOURLY_LABELS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,"0")}:00`);
const HOURLY_LOAD   = [12,10,9,8,9,15,28,45,62,74,80,78,72,68,75,79,83,76,65,55,44,35,24,16];

// Simulated weather data
const WEATHER_LABELS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WEATHER_TEMP     = [28,30,32,29,31,35,33];
const WEATHER_ENERGY   = [185,195,215,190,205,240,225];

// Simulated events
const CAMPUS_EVENTS = [
  { name: "Convocation",      date:"2026-03-05", delta:+32, icon:"🎓" },
  { name: "Sports Day",       date:"2026-03-08", delta:+21, icon:"🏅" },
  { name: "Mid-Term Exams",   date:"2026-03-10", delta:+38, icon:"📝" },
  { name: "Spring Holiday",   date:"2026-03-18", delta:-58, icon:"🌴" },
  { name: "Lab Open Day",     date:"2026-03-25", delta:+18, icon:"🔬" },
  { name: "Guest Lecture",    date:"2026-04-02", delta:+10, icon:"🎤" },
  { name: "Hackathon",        date:"2026-04-06", delta:+45, icon:"💻" },
];

const TABS = [
  { id: "time",   label: "⏰ Time",       icon: "⏰" },
  { id: "dept",   label: "🏛️ Department", icon: "🏛️" },
  { id: "weather",label: "🌤️ Weather",    icon: "🌤️" },
  { id: "events", label: "📅 Events",     icon: "📅" },
];

function MultiDimensionalAnalytics({ data, isDark }) {
  const [tab, setTab] = useState("time");
  const [timeRange, setTimeRange] = useState("hourly");

  const t = {
    card:   isDark ? "rgba(255,255,255,0.04)" : "#d1fae5",
    inner:  isDark ? "rgba(255,255,255,0.03)" : "#ecfdf5",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(6,95,70,0.15)",
    text:   isDark ? "#f1f5f9" : "#064e3b",
    sub:    isDark ? "#64748b" : "#047857",
    grid:   isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };

  const baseChartOpts = (yLabel = "kWh") => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.sub, font: { family: "Inter", size: 12 } } },
      tooltip: {
        backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff",
        titleColor: t.text, bodyColor: t.sub,
        callbacks: { label: ctx => ` ${ctx.parsed.y} ${yLabel}` },
      },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 } } },
      y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, callback: v => `${v} ${yLabel}` } },
    },
  });

  // ── Time chart ──
  const weeklyLabels  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weeklyLoad    = [620,580,710,660,745,510,320];
  const monthlyLabels = ["Week 1","Week 2","Week 3","Week 4"];
  const monthlyLoad   = [2800,3100,2950,3250];

  const timeChart = useMemo(() => {
    const isHourly  = timeRange === "hourly";
    const isWeekly  = timeRange === "weekly";
    return {
      labels: isHourly ? HOURLY_LABELS : isWeekly ? weeklyLabels : monthlyLabels,
      datasets: [{
        label: `${isHourly?"Hourly":isWeekly?"Daily":"Weekly"} Load (kWh)`,
        data: isHourly ? HOURLY_LOAD : isWeekly ? weeklyLoad : monthlyLoad,
        borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.12)",
        tension: 0.4, fill: true, pointRadius: isHourly ? 0 : 4, borderWidth: 2,
      }],
    };
  }, [timeRange]);

  // ── Department chart (live data) ──
  const deptChart = useMemo(() => {
    const totals = BUILDINGS.map(b => ({
      name: b,
      val: +data.filter(d => d.building === b).reduce((s, d) => s + (d.consumption || 0), 0).toFixed(1),
    })).filter(b => b.val > 0).sort((a, b) => b.val - a.val).slice(0, 10);
    return {
      labels: totals.map(b => b.name),
      datasets: [{
        label: "Total Consumption (kWh)",
        data: totals.map(b => b.val),
        backgroundColor: totals.map((_, i) => i === 0 ? "rgba(248,113,113,0.7)" : i < 3 ? "rgba(251,146,60,0.7)" : "rgba(16,185,129,0.7)"),
        borderRadius: 8, borderSkipped: false,
      }],
    };
  }, [data]);

  // ── Weather chart: dual-axis simulation (temp + energy) ──
  const weatherChart = useMemo(() => ({
    labels: WEATHER_LABELS,
    datasets: [
      {
        label: "Energy (kWh)",
        data: WEATHER_ENERGY,
        backgroundColor: "rgba(16,185,129,0.65)",
        borderRadius: 8, borderSkipped: false,
        yAxisID: "y",
      },
      {
        label: "Temp (°C)",
        data: WEATHER_TEMP,
        type: "line",
        borderColor: "#fb923c", backgroundColor: "transparent",
        tension: 0.4, pointRadius: 5, borderWidth: 2,
        yAxisID: "y1",
      },
    ],
  }), []);

  const weatherOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.sub, font: { family: "Inter", size: 12 } } },
      tooltip: { backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff", titleColor: t.text, bodyColor: t.sub },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 11 } } },
      y:  { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 10 }, callback: v => `${v} kWh` }, position: "left" },
      y1: { ticks: { color: "#fb923c", font: { family: "Inter", size: 10 }, callback: v => `${v}°C` }, position: "right", grid: { drawOnChartArea: false } },
    },
  };

  // ── Events chart ──
  const eventsChart = useMemo(() => ({
    labels: CAMPUS_EVENTS.map(e => `${e.icon} ${e.name}`),
    datasets: [{
      label: "Energy Delta (%)",
      data: CAMPUS_EVENTS.map(e => e.delta),
      backgroundColor: CAMPUS_EVENTS.map(e => e.delta > 0 ? "rgba(248,113,113,0.7)" : "rgba(16,185,129,0.7)"),
      borderRadius: 8, borderSkipped: false,
    }],
  }), []);

  const activeKeys = useMemo(() => ({
    time:    { title: "Time-Based Analysis",       sub: "Campus energy usage across different time horizons" },
    dept:    { title: "Department-Based Analysis", sub: "Total energy consumption per department from live records" },
    weather: { title: "Weather Correlation",       sub: "How outdoor temperature correlates with campus energy demand" },
    events:  { title: "Event Impact Analysis",     sub: "Energy change (%) during campus events vs a normal day" },
  }), []);

  const info = activeKeys[tab];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Tab Bar */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "6px", display: "flex", gap: "4px" }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            flex: 1, padding: "10px", borderRadius: "12px", cursor: "pointer",
            fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: "600",
            border: "none", transition: "all 0.2s",
            background: tab === tb.id ? "linear-gradient(135deg,#10b981,#047857)" : "transparent",
            color: tab === tb.id ? "#fff" : t.sub,
            boxShadow: tab === tb.id ? "0 4px 12px rgba(16,185,129,0.3)" : "none",
          }}>{tb.label}</button>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {tab === "time" && [
          { label: "Peak Hour",     value: "4:00 PM – 5:00 PM", icon: "⏱️", color: "#f87171" },
          { label: "Off-Peak Hour", value: "3:00 AM – 5:00 AM", icon: "🌙",  color: "#10b981" },
          { label: "Daily Avg",     value: `${Math.round(HOURLY_LOAD.reduce((a,b)=>a+b,0)/24)} kWh/hr`, icon: "📈", color: t.text },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 18px" }}>
            <span style={{ fontSize: "22px" }}>{s.icon}</span>
            <div style={{ fontSize: "18px", fontWeight: "700", color: s.color, marginTop: "6px" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
        {tab === "dept" && data.length > 0 && [
          { label: "Top Consumer",  value: deptChart.labels[0] || "N/A", icon: "🔥", color: "#f87171" },
          { label: "Departments",   value: deptChart.labels.length,       icon: "🏛️", color: t.text },
          { label: "Total Tracked", value: `${data.reduce((s,d)=>s+(d.consumption||0),0).toFixed(0)} kWh`, icon: "⚡", color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 18px" }}>
            <span style={{ fontSize: "22px" }}>{s.icon}</span>
            <div style={{ fontSize: data.length === 0 ? "14px" : "18px", fontWeight: "700", color: s.color, marginTop: "6px" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
        {tab === "weather" && [
          { label: "Hottest Day",   value: `${Math.max(...WEATHER_TEMP)}°C (${WEATHER_LABELS[WEATHER_TEMP.indexOf(Math.max(...WEATHER_TEMP))]})`, icon: "🌡️", color: "#f87171" },
          { label: "Peak Energy",   value: `${Math.max(...WEATHER_ENERGY)} kWh`, icon: "⚡", color: "#fb923c" },
          { label: "Correlation",   value: "High (+0.91)",   icon: "📈", color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 18px" }}>
            <span style={{ fontSize: "22px" }}>{s.icon}</span>
            <div style={{ fontSize: "18px", fontWeight: "700", color: s.color, marginTop: "6px" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
        {tab === "events" && [
          { label: "Max Surge",  value: "+45% (Hackathon)",    icon: "🔝", color: "#f87171" },
          { label: "Max Drop",   value: "-58% (Spring Break)", icon: "📉", color: "#10b981" },
          { label: "Events Tracked", value: CAMPUS_EVENTS.length, icon: "📅", color: t.text },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 18px" }}>
            <span style={{ fontSize: "22px" }}>{s.icon}</span>
            <div style={{ fontSize: "18px", fontWeight: "700", color: s.color, marginTop: "6px" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: t.sub, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Chart Card */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>{info.title}</div>
            <div style={{ fontSize: "12px", color: t.sub, marginTop: "3px" }}>{info.sub}</div>
          </div>
          {tab === "time" && (
            <div style={{ display: "flex", gap: "6px" }}>
              {["hourly","weekly","monthly"].map(r => (
                <button key={r} onClick={() => setTimeRange(r)} style={{
                  padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s",
                  border: timeRange === r ? "1px solid rgba(16,185,129,0.4)" : `1px solid ${t.border}`,
                  background: timeRange === r ? "rgba(16,185,129,0.12)" : "transparent",
                  color: timeRange === r ? "#10b981" : t.sub,
                  textTransform: "capitalize",
                }}>{r}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: "280px" }}>
          {tab === "time"    && <Line data={timeChart}    options={baseChartOpts("kWh")} />}
          {tab === "dept"    && (data.length === 0
            ? <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:t.sub }}>
                <span style={{ fontSize:"48px",marginBottom:"12px" }}>📭</span>
                <p>No energy records yet. Add records to see department breakdown.</p>
              </div>
            : <Bar  data={deptChart}    options={baseChartOpts("kWh")} />
          )}
          {tab === "weather" && <Bar  data={weatherChart} options={weatherOpts} />}
          {tab === "events"  && <Bar  data={eventsChart}  options={baseChartOpts("%")} />}
        </div>
      </div>

      {/* Insight Box */}
      <div style={{ background: t.inner, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px 20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: t.text, marginBottom: "8px" }}>💡 AI Insight</div>
        <div style={{ fontSize: "13px", color: t.sub, lineHeight: 1.6 }}>
          {tab === "time"    && "Campus energy peaks between 3–6 PM on weekdays due to lab usage, AC systems, and admin activity. Consider time-of-use scheduling to shift non-critical loads to off-peak hours (midnight–6 AM)."}
          {tab === "dept"    && (data.length > 0 ? `${deptChart.labels[0] || "The top department"} is consuming the most energy. Consider a targeted energy audit and behavioural nudges for frequent high-usage hours.` : "Add energy records to generate department-level insights.")}
          {tab === "weather" && "There is a strong positive correlation (+0.91) between outdoor temperature and campus energy usage. Every +1°C rise in temperature corresponds to ~8 kWh additional consumption due to air conditioning."}
          {tab === "events"  && "Events like Hackathons (+45%) and Exams (+38%) drive significant energy spikes. Pre-scheduling HVAC and lighting adjustments before these events can reduce peak load by up to 15%."}
        </div>
      </div>
    </div>
  );
}

export default MultiDimensionalAnalytics;
