import { useState, useMemo } from "react";

const THRESHOLD = 300;
const SIMULATED_ALERTS = [
  { id: "sim1", type: "warning", icon: "⚠️", title: "High energy usage detected in Boys Hostel", time: "Today, 2 PM", building: "Boys Hostel" },
  { id: "sim2", type: "info", icon: "ℹ️", title: "Scheduled maintenance: A-Block meters offline 6–8 PM", time: "Yesterday", building: "A-Block" },
  { id: "sim3", type: "success", icon: "✅", title: "Girls Hostel efficiency improved by 12% this week", time: "2 days ago", building: "Girls Hostel" },
];

function Notifications({ data, isDark }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dismissedAlerts") || "[]"); } catch { return []; }
  });

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissedAlerts", JSON.stringify(next));
  };

  const clearAll = () => {
    const ids = [...liveAlerts.map(a => a.id), ...SIMULATED_ALERTS.map(a => a.id)];
    setDismissed(ids);
    localStorage.setItem("dismissedAlerts", JSON.stringify(ids));
  };

  const liveAlerts = useMemo(() => data
    .filter(d => (d.consumption || 0) >= THRESHOLD)
    .map(d => ({
      id: `live-${d.id}`,
      type: "danger",
      icon: "🚨",
      title: `High energy usage: ${d.consumption} kWh in ${d.building || "Unknown"}`,
      time: d.usageDate ? new Date(d.usageDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—",
      building: d.building,
    })), [data]);

  const allAlerts = [...liveAlerts, ...SIMULATED_ALERTS].filter(a => !dismissed.includes(a.id));
  const activeCount = allAlerts.length;

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
  };

  const typeStyles = {
    danger: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", color: "#f87171" },
    warning: { bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.25)", color: "#fb923c" },
    info: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.25)", color: "#38bdf8" },
    success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", color: "#22c55e" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🔔</span>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: t.text }}>Notification Center</div>
            <div style={{ fontSize: "12px", color: t.sub }}>{activeCount} active alerts</div>
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

      {/* Threshold info */}
      <div style={{
        padding: "10px 16px", borderRadius: "10px",
        background: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
        border: `1px solid ${t.border}`, fontSize: "12px", color: t.sub,
      }}>
        ⚡ Live alerts trigger automatically when consumption ≥ <strong style={{ color: "#f87171" }}>{THRESHOLD} kWh</strong> per record.
      </div>

      {/* Alert list */}
      {allAlerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: t.sub }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
          <p>All clear! No alerts at the moment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {allAlerts.map(a => {
            const ts = typeStyles[a.type] || typeStyles.info;
            return (
              <div key={a.id} style={{
                background: ts.bg, border: `1px solid ${ts.border}`,
                borderRadius: "14px", padding: "16px 18px",
                display: "flex", alignItems: "flex-start", gap: "14px",
              }}>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: t.text, marginBottom: "4px" }}>{a.title}</div>
                  <div style={{ fontSize: "11px", color: t.sub }}>{a.time}</div>
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
