import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EnergyChart from "./energychart";
import LiveMonitor from "./LiveMonitor";
import Prediction from "./Prediction";
import PeakUsage from "./PeakUsage";
import EfficiencyScores from "./EfficiencyScores";
import Notifications from "./Notifications";
import CompareAnalytics from "./CompareAnalytics";
import CampusMap from "./CampusMap";
import Billing from "./Billing";
import Heatmap from "./Heatmap";
import PowerMonitor from "./PowerMonitor";
import DashboardCustomizer from "./DashboardCustomizer";
import LoadBalancer from "./LoadBalancer";
import FaultDetection from "./FaultDetection";
import SensorFaultDetection from "./SensorFaultDetection";
import GreenEnergyMode from "./GreenEnergyMode";
import EnergyRiskAssessment from "./EnergyRiskAssessment";
import MultiDimensionalAnalytics from "./MultiDimensionalAnalytics";
import AcademicCalendar from "./AcademicCalendar";

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];

function StatCard({ icon, label, value, unit, color, isDark }) {
  const [hovered, setHovered] = useState(false);
  const bg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? color + "33" : color + "22";
  const textPrimary = isDark ? "#f1f5f9" : "#1e293b";
  const textSec = isDark ? "#64748b" : "#94a3b8";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "16px",
        background: bg, borderRadius: "16px", padding: "20px",
        border: `1px solid ${hovered ? color + "66" : border}`,
        transition: "all 0.25s",
        boxShadow: hovered ? `0 4px 24px ${color}22` : "none",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", flexShrink: 0,
        background: hovered ? color + "33" : color + "22", color,
        transition: "background 0.2s",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "22px", fontWeight: "700", color: textPrimary }}>
          {value} <span style={{ fontSize: "13px", fontWeight: "400", color: textSec }}>{unit}</span>
        </div>
        <div style={{ fontSize: "12px", color: textSec, marginTop: "2px" }}>{label}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [form, setForm] = useState({ building: BUILDINGS[0], consumption: "", usageDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Profile state
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem("profilePhoto") || null);
  const [phone, setPhone] = useState(() => localStorage.getItem("profilePhone") || "");
  const [phoneEdit, setPhoneEdit] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);

  const toggleTheme = () => setIsDark(d => {
    localStorage.setItem("theme", d ? "light" : "dark");
    return !d;
  });

  // ── Offline Mode ──
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem("offlineQueue") || "[]"); } catch { return []; }
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      setSyncing(true);
      Promise.all(
        offlineQueue.map(item =>
          axios.post(`${import.meta.env.VITE_API_URL}/api/energy`, item).catch(() => null)
        )
      ).then(() => {
        setOfflineQueue([]);
        localStorage.removeItem("offlineQueue");
        fetchData();
        showToast(`✅ ${offlineQueue.length} offline record(s) synced!`);
      }).finally(() => setSyncing(false));
    }
  }, [isOnline]); // eslint-disable-line

  const queueOffline = (record) => {
    const next = [...offlineQueue, record];
    setOfflineQueue(next);
    localStorage.setItem("offlineQueue", JSON.stringify(next));
    showToast(`📶 Saved offline (${next.length} pending)`, "warning");
  };

  // Customizer pinned tiles
  const pinnedViews = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("dashPinned") || "[]"); } catch { return []; }
  }, []);

  const QUICK_TILES = [
    { id: "monitor",       icon: "📡", label: "Live Monitor",       color: "#22c55e" },
    { id: "predict",       icon: "🤖", label: "AI Prediction",      color: "#a78bfa" },
    { id: "peak",          icon: "⏱️", label: "Peak Usage",         color: "#fb923c" },
    { id: "scores",        icon: "🏆", label: "Efficiency",         color: "#facc15" },
    { id: "power",         icon: "⚡", label: "Power Monitor",      color: "#f87171" },
    { id: "compare",       icon: "📊", label: "Compare",            color: "#10b981" },
    { id: "riskassess",    icon: "🛡️", label: "Risk Assessment",   color: "#f87171" },
    { id: "multidim",      icon: "📐", label: "Multi Analytics",   color: "#a78bfa" },
    { id: "calendar",      icon: "📅", label: "Academic Calendar", color: "#fb923c" },
    { id: "map",           icon: "🗺️", label: "Campus Map",         color: "#34d399" },
    { id: "billing",       icon: "💰", label: "Billing",            color: "#facc15" },
    { id: "heatmap",       icon: "🌡️", label: "Heatmap",            color: "#f87171" },
    { id: "loadbalancer",  icon: "⚖️", label: "Load Balancer",      color: "#22c55e" },
    { id: "faults",        icon: "🔬", label: "Fault Detection",    color: "#a78bfa" },
    { id: "sensorfaults",  icon: "📡", label: "Sensor Faults",      color: "#60a5fa" },
    { id: "greenenergy",   icon: "🌱", label: "Green Energy",       color: "#22c55e" },
  ];
  const activeTiles = pinnedViews.length > 0
    ? QUICK_TILES.filter(t => pinnedViews.includes(t.id))
    : QUICK_TILES;

  const fetchData = () => {
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/energy`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("profilePhoto");
    localStorage.removeItem("profilePhone");
    navigate("/");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setProfilePhoto(ev.target.result);
      localStorage.setItem("profilePhoto", ev.target.result);
      showToast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhone = () => {
    const trimmed = phoneInput.trim();
    if (!/^[+\d\s\-()]{7,15}$/.test(trimmed)) { showToast("Enter a valid phone number.", "error"); return; }
    setPhone(trimmed); localStorage.setItem("profilePhone", trimmed);
    setPhoneEdit(false); showToast("Phone number saved!");
  };

  const handleChangePassword = () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwMsg({ text: "All fields are required.", type: "error" }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ text: "New passwords do not match.", type: "error" }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ text: "Password must be ≥6 characters.", type: "error" }); return; }
    setPwForm({ current: "", next: "", confirm: "" });
    setPwMsg({ text: "Password updated successfully!", type: "success" });
    setTimeout(() => setPwMsg(null), 3000);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (!form.consumption || !form.usageDate) { showToast("Please fill in all fields.", "error"); return; }
    const record = { building: form.building, consumption: parseFloat(form.consumption), usageDate: form.usageDate };
    setSubmitting(true);
    if (!isOnline) {
      queueOffline(record);
      setForm({ building: BUILDINGS[0], consumption: "", usageDate: "" });
      setShowForm(false);
      setSubmitting(false);
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/energy`, record);
      showToast("Energy record added!");
      setForm({ building: BUILDINGS[0], consumption: "", usageDate: "" });
      setShowForm(false); fetchData();
    } catch { showToast("Failed to add record.", "error"); }
    finally { setSubmitting(false); }
  };

  const totalKwh = data.reduce((s, d) => s + (d.consumption || 0), 0).toFixed(1);
  const avgKwh = data.length ? (totalKwh / data.length).toFixed(1) : 0;
  const peakKwh = data.length ? Math.max(...data.map(d => d.consumption || 0)).toFixed(1) : 0;
  const buildings = [...new Set(data.map(d => d.building).filter(Boolean))].length;

  const byBuilding = BUILDINGS.map(b => ({
    name: b,
    total: data.filter(d => d.building === b).reduce((s, d) => s + (d.consumption || 0), 0).toFixed(1),
    count: data.filter(d => d.building === b).length,
  })).filter(b => b.count > 0);

  const alertCount = useMemo(() =>
    data.filter(d => (d.consumption || 0) >= 300).length + 3, [data]);

  const navItems = [
    { id: "overview",      icon: "📊", label: "Overview" },
    { id: "buildings",     icon: "🏛️", label: "Buildings" },
    { id: "records",       icon: "📋", label: "Records" },
    { id: "monitor",       icon: "📡", label: "Live Monitor" },
    { id: "predict",       icon: "🤖", label: "AI Prediction" },
    { id: "peak",          icon: "⏱️", label: "Peak Usage" },
    { id: "scores",        icon: "🏆", label: "Efficiency" },
    { id: "alerts",        icon: "🔔", label: "Notifications", badge: alertCount },
    { id: "power",         icon: "⚡", label: "Power Monitor" },
    { id: "loadbalancer",  icon: "⚖️", label: "Load Balancer" },
    { id: "faults",        icon: "🔬", label: "Fault Detection" },
    { id: "sensorfaults",  icon: "📡", label: "Sensor Faults" },
    { id: "greenenergy",   icon: "🌱", label: "Green Energy" },
    { id: "riskassess",    icon: "🛡️", label: "Risk Assessment" },
    { id: "multidim",      icon: "📐", label: "Multi Analytics" },
    { id: "calendar",      icon: "📅", label: "Academic Calendar" },
    { id: "compare",       icon: "📊", label: "Compare" },
    { id: "map",           icon: "🗺️", label: "Campus Map" },
    { id: "billing",       icon: "💰", label: "Billing" },
    { id: "heatmap",       icon: "🌡️", label: "Heatmap" },
    { id: "customizer",    icon: "⚙️", label: "Customise", badge: offlineQueue.length || 0 },
    { id: "profile",       icon: "👤", label: "My Profile" },
  ];

  const pageTitles = {
    overview:      "Energy Overview",
    buildings:     "Building Breakdown",
    records:       "All Records",
    monitor:       "Live Monitor",
    predict:       "AI Energy Prediction",
    peak:          "Peak Usage Detection",
    scores:        "Efficiency Scores",
    alerts:        "Notifications",
    power:         "Power Monitor",
    loadbalancer:  "Smart Load Balancer",
    faults:        "Fault Detection System",
    sensorfaults:  "Sensor Fault Detection",
    greenenergy:   "Green Energy Optimization",
    riskassess:    "Energy Risk Assessment",
    multidim:      "Multi-Dimensional Analytics",
    calendar:      "Academic Calendar",
    compare:       "Comparison Analytics",
    map:           "Campus Map",
    billing:       "Billing System",
    heatmap:       "Heatmap Visualization",
    customizer:    "Customise Dashboard",
    profile:       "My Profile",
  };

  // Theme tokens
  const T = {
    shell: isDark ? "#0a0f1e" : "#ecfdf5",
    sidebar: isDark ? "rgba(255,255,255,0.03)" : "#d1fae5",
    sidebarBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(6,95,70,0.15)",
    card: isDark ? "rgba(255,255,255,0.04)" : "#d1fae5",
    cardBorder: isDark ? "rgba(255,255,255,0.07)" : "rgba(6,95,70,0.15)",
    textPrimary: isDark ? "#f1f5f9" : "#064e3b",
    textSecondary: isDark ? "#64748b" : "#047857",
    navActive: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)",
    navActiveBorder: isDark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.3)",
    navColor: isDark ? "#64748b" : "#065f46",
    footerBg: isDark ? "rgba(255,255,255,0.03)" : "#a7f3d0",
    input: isDark ? "rgba(255,255,255,0.05)" : "#ecfdf5",
    inputBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(6,95,70,0.2)",
    modalBg: isDark ? "#0f172a" : "#ecfdf5",
    overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(6,95,70,0.3)",
  };

  const inputStyle = {
    padding: "11px 14px", borderRadius: "10px", border: `1px solid ${T.inputBorder}`,
    background: isDark ? "#1e293b" : "#f8fafc", color: T.textPrimary,
    fontSize: "14px", fontFamily: "Inter, sans-serif", outline: "none",
    colorScheme: isDark ? "dark" : "light",
  };

  const selectStyle = { ...inputStyle };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.shell, fontFamily: "Inter, sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: "220px", minHeight: "100vh",
        background: T.sidebar, borderRight: `1px solid ${T.sidebarBorder}`,
        display: "flex", flexDirection: "column", padding: "20px 12px 16px",
        position: "fixed", left: 0, top: 0, bottom: 0, overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", padding: "0 6px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "11px", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 16px rgba(16,185,129,0.35)" }}><img src="/logo.png" alt="SCEO" style={{ width: "36px", height: "36px", objectFit: "cover" }} /></div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: "800", letterSpacing: "2px", color: T.textPrimary }}>SCEO</div>
            <div style={{ fontSize: "9px", color: T.textSecondary, letterSpacing: "0.5px" }}>Energy Optimizer</div>
          </div>
        </div>
        {/* Animated gradient accent line */}
        <div style={{
          height: "2px", borderRadius: "2px", marginBottom: "20px", marginLeft: "6px", marginRight: "6px",
          background: "linear-gradient(90deg,#10b981,#047857,#34d399,#10b981)",
          backgroundSize: "200% 200%",
          animation: "gradient-shift 4s ease infinite",
        }} />

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflowY: "auto" }}>
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px",
                  borderRadius: "9px",
                  border: isActive ? `1px solid ${T.navActiveBorder}` : "1px solid transparent",
                  background: isActive ? T.navActive : "transparent",
                  color: isActive ? "#10b981" : T.navColor,
                  fontSize: "13px", fontWeight: isActive ? "600" : "500", cursor: "pointer",
                  textAlign: "left", transition: "all 0.15s", fontFamily: "Inter, sans-serif",
                  position: "relative",
                  boxShadow: isActive ? "inset 3px 0 0 #10b981" : "none",
                }}
              >
                <span style={{ fontSize: "15px", width: "18px", textAlign: "center" }}>{item.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background: "#f87171", color: "#fff", fontSize: "9px", fontWeight: "700", borderRadius: "10px", padding: "1px 6px", flexShrink: 0 }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: user info + logout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
          {/* User pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", borderRadius: "10px", background: T.footerBg, border: `1px solid ${T.sidebarBorder}`, cursor: "pointer" }}
            onClick={() => setActiveView("profile")} title="My Profile">
            {profilePhoto
              ? <img src={profilePhoto} alt="avatar" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#047857)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0, color: "#fff" }}>{(user.email || "U")[0].toUpperCase()}</div>
            }
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || user.email || "Admin"}</div>
              <div style={{ fontSize: "9px", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>{phone || user.role || "USER"}</div>
            </div>
          </div>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "9px 10px", borderRadius: "9px", border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.08)", color: "#f87171",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
              fontFamily: "Inter, sans-serif", transition: "all 0.15s", width: "100%",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}
            title="Logout"
          >
            🚪 <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: "220px", flex: 1, padding: "28px", minHeight: "100vh" }}>
        {/* Offline Banner */}
        {!isOnline && (
          <div style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.35)", borderRadius: "12px", padding: "10px 18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>📶</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#fb923c" }}>You are offline</span>
              <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "8px" }}>New records will be saved locally and synced when reconnected</span>
            </div>
            {offlineQueue.length > 0 && <span style={{ fontSize: "12px", fontWeight: "700", color: "#fb923c", background: "rgba(251,146,60,0.15)", borderRadius: "8px", padding: "2px 10px" }}>{offlineQueue.length} queued</span>}
          </div>
        )}
        {/* Sync Banner */}
        {isOnline && syncing && (
          <div style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "12px", padding: "10px 18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>♻️</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#10b981" }}>Syncing offline records…</span>
          </div>
        )}
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: T.textPrimary, marginBottom: "4px" }}>{pageTitles[activeView]}</h1>
            <p style={{ fontSize: "13px", color: T.textSecondary, display: "flex", alignItems: "center", gap: "8px" }}>
              {currentTime.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              <span style={{ color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>·</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: T.textSecondary }}>
                🕐 {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Dark/Light toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                padding: "8px 16px", borderRadius: "10px", border: `1px solid ${T.cardBorder}`,
                background: T.card, color: T.textPrimary, fontSize: "13px", fontWeight: "600",
                cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", gap: "6px", alignItems: "center",
                transition: "all 0.2s",
              }}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button
              id="add-record-btn"
              onClick={() => setShowForm(true)}
              style={{
                padding: "9px 18px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff",
                fontSize: "14px", fontWeight: "600", cursor: "pointer",
                fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(56,189,248,0.3)",
              }}
            >+ Add Record</button>
          </div>
        </div>

        {/* Stat cards — only on data views */}
        {["overview","buildings","records","monitor","predict","peak","scores","compare","map","billing","heatmap","power","alerts","loadbalancer","faults","sensorfaults","greenenergy"].includes(activeView) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "22px" }}>
            <StatCard icon="⚡" label="Total Consumption" value={totalKwh} unit="kWh" color="#10b981" isDark={isDark} />
            <StatCard icon="📈" label="Peak Usage" value={peakKwh} unit="kWh" color="#fb923c" isDark={isDark} />
            <StatCard icon="📉" label="Avg Per Record" value={avgKwh} unit="kWh" color="#34d399" isDark={isDark} />
            <StatCard icon="🏛️" label="Active Buildings" value={buildings} unit="" color="#a78bfa" isDark={isDark} />
          </div>
        )}

        {/* ── Views ── */}
        {activeView === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Quick Access Tiles */}
            {activeTiles.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: T.textPrimary }}>Quick Access</span>
                  <button onClick={() => setActiveView("customizer")} style={{ padding: "4px 10px", borderRadius: "7px", border: `1px solid ${T.cardBorder}`, background: "transparent", color: T.textSecondary, fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>⚙️ Customise</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px" }}>
                  {activeTiles.map(tile => (
                    <button key={tile.id} onClick={() => setActiveView(tile.id)}
                      style={{ padding: "14px 10px", borderRadius: "12px", border: `1px solid ${T.cardBorder}`, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.15s", fontFamily: "Inter, sans-serif" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = tile.color + "55"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.cardBorder}
                    >
                      <span style={{ fontSize: "22px" }}>{tile.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: T.textPrimary, textAlign: "center", lineHeight: 1.3 }}>{tile.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Chart */}
            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.textPrimary }}>Consumption Trend</h2>
                <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "600" }}>{data.length} data points</span>
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ width: "36px", height: "36px", border: "3px solid rgba(16,185,129,0.15)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                  <p style={{ color: T.textSecondary, marginTop: "12px" }}>Loading…</p>
                </div>
              ) : data.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}><span style={{ fontSize: "48px" }}>📭</span><p style={{ color: T.textSecondary, marginTop: "12px" }}>No records yet.</p></div>
              ) : (
                <EnergyChart data={[...data].sort((a, b) => new Date(a.usageDate) - new Date(b.usageDate))} />
              )}
            </div>
          </div>
        )}

        {activeView === "buildings" && (
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.textPrimary }}>Building Energy Breakdown</h2>
              <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "600" }}>{byBuilding.length} buildings</span>
            </div>
            {byBuilding.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0" }}><span style={{ fontSize: "48px" }}>🏛️</span><p style={{ color: T.textSecondary, marginTop: "12px" }}>No building data yet.</p></div>
              : <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {byBuilding.sort((a, b) => b.total - a.total).map((b, i) => {
                    const pct = totalKwh > 0 ? ((b.total / totalKwh) * 100).toFixed(1) : 0;
                    return (
                      <div key={b.name} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ fontSize: "11px", color: T.textSecondary, fontWeight: "700", width: "20px" }}>#{i+1}</span>
                        <span style={{ fontSize: "13px", color: T.textPrimary, fontWeight: "500", width: "140px", flexShrink: 0 }}>{b.name}</span>
                        <div style={{ flex: 1, height: "8px", background: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#10b981,#047857)", borderRadius: "4px", transition: "width 0.6s" }} />
                        </div>
                        <span style={{ fontSize: "13px", color: "#10b981", fontWeight: "700", width: "80px", textAlign: "right" }}>{b.total} kWh</span>
                        <span style={{ fontSize: "12px", color: T.textSecondary, width: "40px" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {activeView === "records" && (
          <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.textPrimary }}>All Energy Records</h2>
              <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "600" }}>{data.length} records</span>
            </div>
            {data.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0" }}><span style={{ fontSize: "48px" }}>📋</span><p style={{ color: T.textSecondary, marginTop: "12px" }}>No records.</p></div>
              : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>{["#","Date","Building","Consumption (kWh)"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[...data].sort((a, b) => new Date(b.usageDate) - new Date(a.usageDate)).map((row, i) => (
                        <tr key={row.id} style={{ background: i % 2 !== 0 ? (isDark ? "rgba(255,255,255,0.02)" : "#f8fafc") : "transparent" }}>
                          <td style={{ padding: "12px 16px", fontSize: "14px", color: T.textSecondary, borderBottom: `1px solid ${T.cardBorder}` }}>{i+1}</td>
                          <td style={{ padding: "12px 16px", fontSize: "14px", color: isDark ? "#cbd5e1" : "#334155", borderBottom: `1px solid ${T.cardBorder}` }}>
                            {row.usageDate ? new Date(row.usageDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "14px", color: isDark ? "#cbd5e1" : "#334155", borderBottom: `1px solid ${T.cardBorder}` }}>{row.building || "—"}</td>
                          <td style={{ padding: "12px 16px", fontSize: "14px", color: "#10b981", fontWeight: "600", borderBottom: `1px solid ${T.cardBorder}` }}>{row.consumption}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}

        {activeView === "monitor"      && <LiveMonitor isDark={isDark} />}
        {activeView === "predict"      && <Prediction data={data} isDark={isDark} />}
        {activeView === "peak"         && <PeakUsage data={data} isDark={isDark} />}
        {activeView === "scores"       && <EfficiencyScores data={data} isDark={isDark} />}
        {activeView === "alerts"       && <Notifications data={data} isDark={isDark} />}
        {activeView === "power"        && <PowerMonitor data={data} isDark={isDark} />}
        {activeView === "loadbalancer" && <LoadBalancer isDark={isDark} />}
        {activeView === "faults"       && <FaultDetection isDark={isDark} />}
        {activeView === "sensorfaults"  && <SensorFaultDetection isDark={isDark} />}
        {activeView === "greenenergy"   && <GreenEnergyMode isDark={isDark} />}
        {activeView === "riskassess"    && <EnergyRiskAssessment data={data} isDark={isDark} />}
        {activeView === "multidim"      && <MultiDimensionalAnalytics data={data} isDark={isDark} />}
        {activeView === "calendar"      && <AcademicCalendar isDark={isDark} />}
        {activeView === "compare"      && <CompareAnalytics data={data} isDark={isDark} />}
        {activeView === "map"          && <CampusMap data={data} isDark={isDark} />}
        {activeView === "billing"      && <Billing data={data} isDark={isDark} />}
        {activeView === "heatmap"      && <Heatmap data={data} isDark={isDark} />}
        {activeView === "customizer"   && <DashboardCustomizer isDark={isDark} onNavigate={setActiveView} />}

        {/* ── PROFILE ── */}
        {activeView === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.textPrimary, marginBottom: "20px" }}>Profile Photo</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ width: "76px", height: "76px", borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#10b981,#047857)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(16,185,129,0.3)", overflow: "hidden" }}>
                  {profilePhoto ? <img src={profilePhoto} alt="profile" style={{ width: "76px", height: "76px", objectFit: "cover" }} />
                    : <span style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>{(user.email || "U")[0].toUpperCase()}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ color: T.textSecondary, fontSize: "13px", margin: 0 }}>Upload JPG or PNG</p>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
                    📁 Choose Photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                  </label>
                  {profilePhoto && (
                    <button style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                      onClick={() => { setProfilePhoto(null); localStorage.removeItem("profilePhoto"); showToast("Photo removed."); }}>🗑 Remove</button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.textPrimary, marginBottom: "20px" }}>Account Details</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[{ label: "Email", value: user.email || "—" }, { label: "Role", value: user.role || "USER" }].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>{f.label}</label>
                    <div style={{ padding: "11px 14px", borderRadius: "10px", border: `1px solid ${T.inputBorder}`, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", color: T.textSecondary, fontSize: "14px" }}>{f.value}</div>
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Phone Number</label>
                  {phoneEdit ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+91 98765 43210" style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={handleSavePhone} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save</button>
                      <button onClick={() => { setPhoneEdit(false); setPhoneInput(""); }} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${T.inputBorder}`, background: "transparent", color: T.textSecondary, fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ flex: 1, padding: "11px 14px", borderRadius: "10px", border: `1px solid ${T.inputBorder}`, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", color: T.textSecondary, fontSize: "14px" }}>{phone || "Not set"}</div>
                      <button onClick={() => { setPhoneEdit(true); setPhoneInput(phone); }} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✏️ Edit</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.textPrimary, marginBottom: "20px" }}>Change Password</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {["current","next","confirm"].map(field => (
                  <div key={field}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                      {field === "current" ? "Current Password" : field === "next" ? "New Password" : "Confirm New Password"}
                    </label>
                    <input type="password" value={pwForm[field]} onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })} style={inputStyle} />
                  </div>
                ))}
                {pwMsg && <div style={{ padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", background: pwMsg.type === "error" ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)", color: pwMsg.type === "error" ? "#f87171" : "#34d399", border: `1px solid ${pwMsg.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}` }}>{pwMsg.type === "error" ? "⚠️" : "✅"} {pwMsg.text}</div>}
                <button onClick={handleChangePassword} style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "Inter, sans-serif", alignSelf: "flex-start" }}>🔑 Update Password</button>
              </div>
            </div>

            <div style={{ background: T.card, border: "1px solid rgba(248,113,113,0.2)", borderRadius: "20px", padding: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#f87171", marginBottom: "8px" }}>Danger Zone</h2>
              <p style={{ color: T.textSecondary, fontSize: "13px", marginBottom: "16px" }}>Logging out will clear your session data.</p>
              <button onClick={handleLogout} style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}>🚪 Logout</button>
            </div>
          </div>
        )}
      </main>

      {/* ── Add Record Modal ── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: T.overlay, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: T.modalBg, border: `1px solid ${T.cardBorder}`, borderRadius: "20px", padding: "36px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: T.textPrimary, marginBottom: "4px" }}>Add Energy Record</h2>
            <p style={{ fontSize: "13px", color: T.textSecondary, marginBottom: "24px" }}>Enter new energy consumption data</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Building</label>
                <select value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} style={{ ...selectStyle, width: "100%" }}>
                  {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Consumption (kWh)</label>
                <input type="number" placeholder="e.g. 245.5" value={form.consumption} onChange={e => setForm({ ...form, consumption: e.target.value })} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Date</label>
                <input type="date" value={form.usageDate} onChange={e => setForm({ ...form, usageDate: e.target.value })} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${T.inputBorder}`, background: "transparent", color: T.textSecondary, fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
                {submitting ? "Saving…" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          padding: "14px 22px", borderRadius: "14px", border: "1px solid",
          backdropFilter: "blur(10px)", color: "#f1f5f9",
          fontSize: "14px", fontWeight: "600",
          boxShadow: "0 8px 36px rgba(0,0,0,0.45)", zIndex: 200,
          animation: "slide-in-right 0.3s ease",
          background: toast.type === "error"
            ? "rgba(248,113,113,0.18)"
            : toast.type === "warning"
              ? "rgba(251,146,60,0.18)"
              : "rgba(34,197,94,0.18)",
          borderColor: toast.type === "error"
            ? "rgba(248,113,113,0.4)"
            : toast.type === "warning"
              ? "rgba(251,146,60,0.4)"
              : "rgba(34,197,94,0.4)",
        }}>
          {toast.type === "error" ? "⚠️" : toast.type === "warning" ? "📶" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}

export default Dashboard;