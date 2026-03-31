import { useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const EVENTS = [
  { id: 1, name: "Mid-Semester Exams",     type: "exam",     date: "2026-03-10", endDate: "2026-03-17", impact: +35, dept: "All Blocks", icon: "📝" },
  { id: 2, name: "Spring Break / Holiday", type: "holiday",  date: "2026-03-18", endDate: "2026-03-22", impact: -60, dept: "All Campus",  icon: "🌴" },
  { id: 3, name: "End-Semester Exams",     type: "exam",     date: "2026-04-20", endDate: "2026-04-30", impact: +45, dept: "All Blocks", icon: "📚" },
  { id: 4, name: "Annual Sports Day",      type: "event",    date: "2026-04-05", endDate: "2026-04-05", impact: +20, dept: "Grounds & Cafeteria", icon: "🏅" },
  { id: 5, name: "Convocation Ceremony",   type: "event",    date: "2026-04-15", endDate: "2026-04-15", impact: +30, dept: "Admin Block", icon: "🎓" },
  { id: 6, name: "Summer Vacation",        type: "holiday",  date: "2026-05-10", endDate: "2026-06-14", impact: -75, dept: "All Campus",  icon: "☀️" },
  { id: 7, name: "Orientation Week",       type: "event",    date: "2026-07-01", endDate: "2026-07-07", impact: +15, dept: "A-Block & Admin", icon: "🎉" },
  { id: 8, name: "Semester Start",         type: "semester", date: "2026-07-08", endDate: "2026-07-08", impact: +40, dept: "All Campus",  icon: "🏫" },
  { id: 9, name: "Republic Day Holiday",   type: "holiday",  date: "2026-01-26", endDate: "2026-01-26", impact: -70, dept: "All Campus",  icon: "🇮🇳" },
  { id: 10, name: "Gandhi Jayanti",        type: "holiday",  date: "2026-10-02", endDate: "2026-10-02", impact: -65, dept: "All Campus",  icon: "🇮🇳" },
];

const TYPE_META = {
  exam:     { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", label: "Exam",     badge: "🔴" },
  holiday:  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)",  label: "Holiday",  badge: "🟢" },
  event:    { color: "#fb923c", bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.3)",  label: "Event",    badge: "🟡" },
  semester: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)", label: "Semester", badge: "🟣" },
};

function AcademicCalendar({ isDark }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const t = {
    card:   isDark ? "rgba(255,255,255,0.04)" : "#d1fae5",
    inner:  isDark ? "rgba(255,255,255,0.03)" : "#ecfdf5",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(6,95,70,0.15)",
    text:   isDark ? "#f1f5f9" : "#064e3b",
    sub:    isDark ? "#64748b" : "#047857",
    grid:   isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };

  const FILTERS = ["All", "exam", "holiday", "event", "semester"];

  const filtered = filter === "All" ? EVENTS : EVENTS.filter(e => e.type === filter);

  // Chart data: compare Normal vs Exam vs Holiday energy (simulated base 100 kWh/day)
  const compareData = useMemo(() => ({
    labels: ["Normal Day", "Exam Day", "Holiday", "Major Event", "Semester Start"],
    datasets: [{
      label: "Campus Energy Usage (kWh, relative to normal)",
      data: [100, 135, 30, 120, 140],
      backgroundColor: [
        "rgba(16,185,129,0.7)",
        "rgba(248,113,113,0.7)",
        "rgba(16,185,129,0.4)",
        "rgba(251,146,60,0.7)",
        "rgba(167,139,250,0.7)",
      ],
      borderRadius: 10,
      borderSkipped: false,
    }],
  }), []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.sub, font: { family: "Inter", size: 12 } } },
      tooltip: {
        backgroundColor: isDark ? "rgba(15,23,42,0.95)" : "#fff",
        titleColor: t.text, bodyColor: t.sub,
        callbacks: { label: ctx => ` ${ctx.parsed.y} kWh (relative)` },
      },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 11 } } },
      y: { grid: { color: t.grid }, ticks: { color: t.sub, font: { family: "Inter", size: 11 }, callback: v => `${v} kWh` } },
    },
  };

  const selectedEvent = EVENTS.find(e => e.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Summary Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
        {[
          { label: "Exams",    count: EVENTS.filter(e => e.type === "exam").length,     icon: "📝", color: "#f87171" },
          { label: "Holidays", count: EVENTS.filter(e => e.type === "holiday").length,   icon: "🌴", color: "#10b981" },
          { label: "Events",   count: EVENTS.filter(e => e.type === "event").length,     icon: "🏅", color: "#fb923c" },
          { label: "Semester", count: EVENTS.filter(e => e.type === "semester").length,  icon: "🏫", color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.count}</div>
              <div style={{ fontSize: "11px", color: t.sub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Energy Comparison Chart */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "4px" }}>📊 Energy Impact by Day Type</div>
        <div style={{ fontSize: "12px", color: t.sub, marginBottom: "18px" }}>Relative campus energy consumption compared to a normal academic day (100 kWh baseline)</div>
        <div style={{ height: "220px" }}>
          <Bar data={compareData} options={chartOptions} />
        </div>
      </div>

      {/* Insight callout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px" }}>
        {[
          { icon: "📝", label: "Exam Period",    delta: "+35–45%", note: "Extended lab & library hours, AC usage spikes.", color: "#f87171" },
          { icon: "🌴", label: "Holiday",        delta: "−60–75%", note: "Most buildings empty. Major energy savings.",    color: "#10b981" },
          { icon: "🏅", label: "Major Event",    delta: "+20–30%", note: "Lighting, AV systems, cafeteria surge.",         color: "#fb923c" },
          { icon: "🏫", label: "Semester Start", delta: "+40%",    note: "All buildings active. Peak welcome-week load.",  color: "#a78bfa" },
        ].map(c => (
          <div key={c.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "14px 18px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "22px" }}>{c.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: t.text }}>{c.label}</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: c.color, background: `${c.color}18`, borderRadius: "8px", padding: "1px 8px" }}>{c.delta}</span>
              </div>
              <div style={{ fontSize: "12px", color: t.sub }}>{c.note}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Event List */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>📅 Academic Events Calendar</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700",
                cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s",
                border: filter === f ? `1px solid ${TYPE_META[f]?.color || "#10b981"}66` : `1px solid ${t.border}`,
                background: filter === f ? `${TYPE_META[f]?.color || "#10b981"}18` : "transparent",
                color: filter === f ? (TYPE_META[f]?.color || "#10b981") : t.sub,
                textTransform: "capitalize",
              }}>{f === "All" ? "📋 All" : `${TYPE_META[f].badge} ${TYPE_META[f].label}`}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.sort((a,b) => a.date.localeCompare(b.date)).map(ev => {
            const meta = TYPE_META[ev.type];
            const isUp = ev.impact > 0;
            return (
              <div key={ev.id}
                onClick={() => setSelected(selected === ev.id ? null : ev.id)}
                style={{
                  background: selected === ev.id ? meta.bg : t.inner,
                  border: `1px solid ${selected === ev.id ? meta.border : t.border}`,
                  borderRadius: "12px", padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: "14px",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                <span style={{ fontSize: "24px", flexShrink: 0 }}>{ev.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: t.text }}>{ev.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "8px", background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                      {meta.badge} {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: t.sub }}>
                    {ev.date === ev.endDate ? ev.date : `${ev.date} → ${ev.endDate}`} · {ev.dept}
                  </div>
                  {selected === ev.id && (
                    <div style={{ marginTop: "10px", fontSize: "12px", color: t.sub, background: meta.bg, borderRadius: "8px", padding: "8px 12px" }}>
                      💡 Expected energy impact: <strong style={{ color: meta.color }}>{ev.impact > 0 ? "+" : ""}{ev.impact}%</strong> compared to a normal day. Plan resource allocation accordingly.
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: isUp ? "#f87171" : "#10b981" }}>
                    {isUp ? "▲" : "▼"} {Math.abs(ev.impact)}%
                  </div>
                  <div style={{ fontSize: "10px", color: t.sub }}>{isUp ? "Higher" : "Lower"} usage</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AcademicCalendar;
