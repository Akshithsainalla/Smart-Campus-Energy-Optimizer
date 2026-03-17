import { useState, useMemo } from "react";

const ALL_WIDGETS = [
  { id: "stat_total",    label: "Total Consumption",    icon: "⚡", category: "Stat Cards" },
  { id: "stat_peak",     label: "Peak Usage",           icon: "📈", category: "Stat Cards" },
  { id: "stat_avg",      label: "Avg Per Record",       icon: "📉", category: "Stat Cards" },
  { id: "stat_building", label: "Active Buildings",     icon: "🏛️", category: "Stat Cards" },
  { id: "overview",      label: "Consumption Trend",    icon: "📊", category: "Views" },
  { id: "buildings",     label: "Building Breakdown",   icon: "🏛️", category: "Views" },
  { id: "records",       label: "Records Table",        icon: "📋", category: "Views" },
  { id: "monitor",       label: "Live Monitor",         icon: "📡", category: "Views" },
  { id: "predict",       label: "AI Prediction",        icon: "🤖", category: "Views" },
  { id: "peak",          label: "Peak Usage",           icon: "⏱️", category: "Views" },
  { id: "scores",        label: "Efficiency Scores",    icon: "🏆", category: "Views" },
  { id: "alerts",        label: "Notifications",        icon: "🔔", category: "Views" },
  { id: "power",         label: "Power Monitor",        icon: "⚡", category: "Views" },
  { id: "compare",       label: "Comparison Analytics", icon: "📊", category: "Views" },
  { id: "map",           label: "Campus Map",           icon: "🗺️", category: "Views" },
  { id: "billing",       label: "Billing",              icon: "💰", category: "Views" },
  { id: "heatmap",       label: "Heatmap",              icon: "🌡️", category: "Views" },
];

const DEFAULT_VISIBLE = ALL_WIDGETS.map(w => w.id);
const DEFAULT_PINNED = ["overview", "monitor", "predict", "map", "billing"];
const LAYOUT_OPTIONS = ["comfortable", "compact", "grid"];

function DashboardCustomizer({ isDark, onNavigate }) {
  const [visible, setVisible] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dashVisible") || JSON.stringify(DEFAULT_VISIBLE)); } catch { return DEFAULT_VISIBLE; }
  });
  const [pinned, setPinned] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dashPinned") || JSON.stringify(DEFAULT_PINNED)); } catch { return DEFAULT_PINNED; }
  });
  const [layout, setLayout] = useState(() => localStorage.getItem("dashLayout") || "comfortable");
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("dashVisible", JSON.stringify(visible));
    localStorage.setItem("dashPinned", JSON.stringify(pinned));
    localStorage.setItem("dashLayout", layout);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setVisible(DEFAULT_VISIBLE);
    setPinned(DEFAULT_PINNED);
    setLayout("comfortable");
  };

  const toggleVisible = (id) => setVisible(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  const togglePinned = (id) => setPinned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const cats = [...new Set(ALL_WIDGETS.map(w => w.category))];

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    innerCard: isDark ? "rgba(255,255,255,0.035)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
    activeBg: isDark ? "rgba(56,189,248,0.1)" : "rgba(56,189,248,0.08)",
    activeBorder: "rgba(56,189,248,0.3)",
  };

  const pillStyle = (active, hue = "blue") => {
    const colors = {
      blue: { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.35)", text: "#38bdf8" },
      purple: { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.35)", text: "#a78bfa" },
    };
    const c = colors[hue];
    return {
      padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "700",
      cursor: "pointer", fontFamily: "Inter, sans-serif",
      border: active ? `1px solid ${c.border}` : `1px solid ${t.border}`,
      background: active ? c.bg : "transparent",
      color: active ? c.text : t.sub,
      transition: "all 0.15s",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
      {/* Layout picker */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>Layout Style</h2>
        <p style={{ fontSize: "13px", color: t.sub, marginBottom: "16px" }}>Choose how the dashboard content is displayed</p>
        <div style={{ display: "flex", gap: "10px" }}>
          {LAYOUT_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setLayout(opt)}
              style={{
                padding: "10px 20px", borderRadius: "10px", cursor: "pointer",
                fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: "600",
                border: layout === opt ? "1px solid rgba(56,189,248,0.35)" : `1px solid ${t.border}`,
                background: layout === opt ? "rgba(56,189,248,0.1)" : "transparent",
                color: layout === opt ? "#38bdf8" : t.sub,
                textTransform: "capitalize", transition: "all 0.15s",
              }}
            >{opt === "comfortable" ? "🖥️ Comfortable" : opt === "compact" ? "⚡ Compact" : "⊞ Grid"}</button>
          ))}
        </div>
      </div>

      {/* Pinned Quick Access */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "6px" }}>📌 Quick Access Tiles</h2>
        <p style={{ fontSize: "13px", color: t.sub, marginBottom: "16px" }}>Pinned views appear as large tiles on the Overview page for one-click access</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {ALL_WIDGETS.filter(w => w.category === "Views").map(w => (
            <button key={w.id} onClick={() => togglePinned(w.id)} style={pillStyle(pinned.includes(w.id), "purple")}>
              {w.icon} {w.label} {pinned.includes(w.id) ? "📌" : "+"}
            </button>
          ))}
        </div>
        {pinned.length > 0 && (
          <div style={{ marginTop: "14px", padding: "10px 14px", background: t.innerCard, borderRadius: "10px", fontSize: "12px", color: t.sub }}>
            {pinned.length} pinned: {pinned.map(id => ALL_WIDGETS.find(w => w.id === id)?.label).join(", ")}
          </div>
        )}
      </div>

      {/* Widget visibility */}
      {cats.map(cat => (
        <div key={cat} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: t.text }}>{cat === "Stat Cards" ? "📊 " : "🔲 "}{cat}</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => {
                const ids = ALL_WIDGETS.filter(w => w.category === cat).map(w => w.id);
                setVisible(v => [...new Set([...v, ...ids])]);
              }} style={{ ...pillStyle(false), padding: "4px 10px" }}>Show All</button>
              <button onClick={() => {
                const ids = ALL_WIDGETS.filter(w => w.category === cat).map(w => w.id);
                setVisible(v => v.filter(x => !ids.includes(x)));
              }} style={{ ...pillStyle(false), padding: "4px 10px" }}>Hide All</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {ALL_WIDGETS.filter(w => w.category === cat).map(w => {
              const isVisible = visible.includes(w.id);
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: t.innerCard, border: `1px solid ${t.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px" }}>{w.icon}</span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: isVisible ? t.text : t.sub }}>{w.label}</span>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "36px", height: "20px", cursor: "pointer" }}>
                    <input type="checkbox" checked={isVisible} onChange={() => toggleVisible(w.id)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: "absolute", inset: 0, borderRadius: "20px", transition: "0.3s",
                      background: isVisible ? "#38bdf8" : (isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1"),
                    }}>
                      <span style={{
                        position: "absolute", width: "14px", height: "14px", left: isVisible ? "19px" : "3px", top: "3px",
                        borderRadius: "50%", background: "#fff", transition: "0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }} />
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save / Reset */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={save} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "none", background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#38bdf8,#818cf8)", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(56,189,248,0.3)", transition: "all 0.2s" }}>
          {saved ? "✅ Saved!" : "💾 Save Layout"}
        </button>
        <button onClick={reset} style={{ padding: "13px 24px", borderRadius: "12px", border: `1px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

export { ALL_WIDGETS, DEFAULT_PINNED, DEFAULT_VISIBLE };
export default DashboardCustomizer;
