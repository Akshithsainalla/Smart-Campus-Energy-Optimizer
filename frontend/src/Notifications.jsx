import { useState, useMemo } from "react";

const THRESHOLD = 300;

const SIMULATED_ALERTS = [
  // ── Original alerts ──
  { id: "sim1", type: "warning",  category: "usage",   icon: "⚠️",  title: "High energy usage detected in Boys Hostel", time: "Today, 2 PM", building: "Boys Hostel" },
  { id: "sim2", type: "info",     category: "info",    icon: "ℹ️",  title: "Scheduled maintenance: A-Block meters offline 6–8 PM", time: "Yesterday", building: "A-Block" },
  { id: "sim3", type: "success",  category: "info",    icon: "✅",  title: "Girls Hostel efficiency improved by 12% this week", time: "2 days ago", building: "Girls Hostel" },

  // ── Feature 5: Sudden Spike Alert ──
  { id: "spike1", type: "warning", category: "spike",  icon: "⚠️",  title: "Abnormal spike detected in Lab Block — 3× normal baseline in 2 minutes", time: "Today, 11:34 AM", building: "E-Block" },
  { id: "spike2", type: "warning", category: "spike",  icon: "⚠️",  title: "Abnormal spike detected in Parking Lot: 420 kWh burst (expected < 100 kWh)", time: "Yesterday, 7:15 PM", building: "Parking Lot" },

  // ── Feature 6: Power Failure Alert ──
  { id: "power1", type: "danger",  category: "power",  icon: "🚨",  title: "No energy data detected in H-Block — possible power cut or meter failure", time: "Today, 3:00 AM", building: "H-Block" },
  { id: "power2", type: "danger",  category: "power",  icon: "🚨",  title: "Cafeteria offline: 0 kWh recorded for 45 minutes (possible breaker trip)", time: "Yesterday, 9:20 PM", building: "Cafeteria" },

  // ── Feature 7: Cost Alert ──
  { id: "cost1", type: "warning",  category: "cost",   icon: "💸",  title: "Electricity cost exceeding monthly budget — ₹1,24,500 used vs ₹1,00,000 target", time: "Today, 12:00 PM", building: "All Campus" },
  { id: "cost2", type: "warning",  category: "cost",   icon: "💸",  title: "Admin Block billing spike: ₹8,200 this week vs ₹4,000 weekly average", time: "3 days ago", building: "Admin Block" },
];

const CATEGORY_META = {
  all:   { label: "All",           icon: "📋", color: "#10b981" },
  spike: { label: "Spike Alerts",  icon: "⚠️", color: "#fb923c" },
  power: { label: "Power Failure", icon: "🚨", color: "#f87171" },
  cost:  { label: "Cost Alerts",   icon: "💸", color: "#facc15" },
  usage: { label: "High Usage",    icon: "⚡", color: "#fb923c" },
  info:  { label: "Info",          icon: "ℹ️", color: "#10b981" },
};

function Notifications({ data, isDark }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dismissedAlerts") || "[]"); } catch { return []; }
  });
  const [catFilter, setCatFilter] = useState("all");

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissedAlerts", JSON.stringify(next));
  };

  const liveAlerts = useMemo(() => data
    .filter(d => (d.consumption || 0) >= THRESHOLD)
    .map(d => ({
      id: `live-${d.id}`,
      type: "danger",
      category: "usage",
      icon: "🚨",
      title: `High energy usage: ${d.consumption} kWh in ${d.building || "Unknown"}`,
      time: d.usageDate ? new Date(d.usageDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—",
      building: d.building,
    })), [data]);

  const allAlerts     = [...liveAlerts, ...SIMULATED_ALERTS].filter(a => !dismissed.includes(a.id));
  const filteredAlerts = catFilter === "all" ? allAlerts : allAlerts.filter(a => a.category === catFilter);
  const activeCount   = allAlerts.length;

  const clearAll = () => {
    const ids = allAlerts.map(a => a.id);
    const next = [...dismissed, ...ids];
    setDismissed(next);
    localStorage.setItem("dismissedAlerts", JSON.stringify(next));
  };

  const t = {
    card:   isDark ? "rgba(255,255,255,0.04)" : "#d1fae5",
    inner:  isDark ? "rgba(255,255,255,0.03)" : "#ecfdf5",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(6,95,70,0.15)",
    text:   isDark ? "#f1f5f9" : "#064e3b",
    sub:    isDark ? "#64748b" : "#047857",
  };

  const typeStyles = {
    danger:  { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", color: "#f87171" },
    warning: { bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  color: "#fb923c" },
    info:    { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  color: "#10b981" },
    success: { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   color: "#22c55e" },
  };

  // Summary counts per category
  const countByCategory = ["spike","power","cost","usage"].reduce((acc, cat) => {
    acc[cat] = allAlerts.filter(a => a.category === cat).length;
    return acc;
  }, {});

  const FILTER_KEYS = ["all","spike","power","cost","usage","info"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "760px" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🔔</span>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: t.text }}>Notification Center</div>
            <div style={{ fontSize: "12px", color: t.sub }}>{activeCount} active alert{activeCount !== 1 ? "s" : ""}</div>
          </div>
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} style={{
            padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.08)", color: "#f87171",
            fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>Clear all</button>
        )}
      </div>

      {/* Quick-stat summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { cat: "spike", icon: "⚠️", label: "Spike Alerts",  color: "#fb923c" },
          { cat: "power", icon: "🚨", label: "Power Failure", color: "#f87171" },
          { cat: "cost",  icon: "💸", label: "Cost Alerts",   color: "#facc15" },
          { cat: "usage", icon: "⚡", label: "High Usage",    color: "#fb923c" },
        ].map(s => (
          <div key={s.cat}
            onClick={() => setCatFilter(catFilter === s.cat ? "all" : s.cat)}
            style={{
              background: catFilter === s.cat ? `${s.color}18` : t.card,
              border: catFilter === s.cat ? `1px solid ${s.color}55` : `1px solid ${t.border}`,
              borderRadius: "14px", padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
            }}>
            <div style={{ fontSize: "22px" }}>{s.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: s.color, marginTop: "6px" }}>{countByCategory[s.cat]}</div>
            <div style={{ fontSize: "11px", color: t.sub }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Threshold info */}
      <div style={{
        padding: "10px 16px", borderRadius: "10px",
        background: isDark ? "rgba(255,255,255,0.03)" : "#ecfdf5",
        border: `1px solid ${t.border}`, fontSize: "12px", color: t.sub,
      }}>
        ⚡ Live alerts trigger automatically when consumption ≥ <strong style={{ color: "#f87171" }}>{THRESHOLD} kWh</strong> per record. Spike + Power + Cost alerts are simulated in real-time.
      </div>

      {/* Category Filter Bar */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {FILTER_KEYS.map(key => {
          const meta = CATEGORY_META[key];
          const count = key === "all" ? allAlerts.length : allAlerts.filter(a => a.category === key).length;
          return (
            <button key={key} onClick={() => setCatFilter(key)} style={{
              padding: "6px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: "700",
              cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s",
              border: catFilter === key ? `1px solid ${meta.color}55` : `1px solid ${t.border}`,
              background: catFilter === key ? `${meta.color}18` : "transparent",
              color: catFilter === key ? meta.color : t.sub,
            }}>
              {meta.icon} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      {filteredAlerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: t.sub }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
          <p>{catFilter === "all" ? "All clear! No alerts at the moment." : `No ${CATEGORY_META[catFilter]?.label} alerts.`}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredAlerts.map(a => {
            const ts = typeStyles[a.type] || typeStyles.info;
            const catMeta = CATEGORY_META[a.category] || CATEGORY_META.info;
            return (
              <div key={a.id} style={{
                background: ts.bg, border: `1px solid ${ts.border}`,
                borderRadius: "14px", padding: "16px 18px",
                display: "flex", alignItems: "flex-start", gap: "14px",
                transition: "transform 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateX(2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <span style={{ fontSize: "20px", flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: t.text }}>{a.title}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "8px",
                      background: `${catMeta.color}18`, color: catMeta.color, border: `1px solid ${catMeta.color}44`, flexShrink: 0 }}>
                      {catMeta.icon} {catMeta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: t.sub }}>
                    {a.building && a.building !== "All Campus" ? `🏛️ ${a.building}  ·  ` : ""}{a.time}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(a.id)}
                  style={{ background: "none", border: "none", color: t.sub, cursor: "pointer", fontSize: "16px", padding: "0 2px", flexShrink: 0, lineHeight: 1 }}
                >✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { SIMULATED_ALERTS };
export default Notifications;
