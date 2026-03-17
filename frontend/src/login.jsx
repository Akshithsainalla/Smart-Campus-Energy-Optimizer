import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ── Helpers: local user store (fallback when backend is offline) ──
const LOCAL_USERS_KEY = "sceo_local_users";

function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]"); } catch { return []; }
}

function saveLocalUser(user) {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function findLocalUser(email, password) {
  return getLocalUsers().find(u => u.email === email && u.password === password) || null;
}

function localEmailExists(email) {
  return getLocalUsers().some(u => u.email === email);
}

function Login() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // ── Load remembered credentials on mount ──
  useEffect(() => {
    const saved = localStorage.getItem("sceo_remember");
    if (saved) {
      try {
        const { email: e, password: p } = JSON.parse(saved);
        setEmail(e);
        setPassword(p);
        setRememberMe(true);
      } catch { /* ignore */ }
    }
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setConfirmPassword("");
    setName("");
  };

  const handleSignIn = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");

    // Save / clear Remember Me
    if (rememberMe) {
      localStorage.setItem("sceo_remember", JSON.stringify({ email, password }));
    } else {
      localStorage.removeItem("sceo_remember");
    }

    // 1️⃣ Try backend
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
      return;
    } catch (err) {
      // If it's a 401 Unauthorized from backend, don't fall through
      if (err?.response?.status === 401) {
        // Check local store too (user registered locally)
        const local = findLocalUser(email, password);
        if (local) {
          localStorage.setItem("user", JSON.stringify({ id: local.id || Date.now(), name: local.name, email: local.email, role: local.role || "USER" }));
          navigate("/dashboard");
          return;
        }
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }
    }

    // 2️⃣ Backend unreachable → try local store
    const local = findLocalUser(email, password);
    if (local) {
      localStorage.setItem("user", JSON.stringify({ id: local.id || Date.now(), name: local.name, email: local.email, role: local.role || "USER" }));
      navigate("/dashboard");
      return;
    }

    setError("Invalid email or password. Please try again.");
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) { setError("Please fill in all fields."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");

    // 1️⃣ Try backend
    try {
      await axios.post("http://localhost:8080/api/auth/register", { name, email, password, role: "USER" });
      setSuccess("Account created! You can now sign in.");
      setMode("signin");
      setEmail(email);
      setPassword("");
      setConfirmPassword("");
      setName("");
      setLoading(false);
      return;
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      // Duplicate email from backend
      if (status === 400) {
        setError(msg || "Email already registered.");
        setLoading(false);
        return;
      }
      // Backend 500 or offline → fall through to local storage
    }

    // 2️⃣ Backend unreachable → register locally
    if (localEmailExists(email)) {
      setError("Email already registered.");
      setLoading(false);
      return;
    }
    saveLocalUser({ id: Date.now(), name, email, password, role: "USER" });
    setSuccess("Account created! You can now sign in.");
    setMode("signin");
    setEmail(email);
    setPassword("");
    setConfirmPassword("");
    setName("");
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") mode === "signin" ? handleSignIn() : handleSignUp();
  };

  const inputProps = (value, setter, type = "text", placeholder = "") => ({
    type,
    placeholder,
    value,
    onChange: (e) => setter(e.target.value),
    onKeyDown: handleKeyDown,
    style: styles.input,
    onFocus: (e) => Object.assign(e.target.style, styles.inputFocus),
    onBlur: (e) => Object.assign(e.target.style, styles.input),
  });

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.iconWrap}>
          <span style={styles.icon}>⚡</span>
        </div>
        <h1 style={styles.title}>SCEO</h1>
        <p style={styles.subtitle}>Smart Campus Energy Optimizer</p>

        {/* Tab Toggle */}
        <div style={styles.tabBar}>
          <button
            style={mode === "signin" ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            style={mode === "signup" ? { ...styles.tab, ...styles.tabActive } : styles.tab}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div style={styles.form}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input id="name" {...inputProps(name, setName, "text", "Jane Smith")} />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input id="email" {...inputProps(email, setEmail, "email", "you@campus.edu")} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input id="password" {...inputProps(password, setPassword, "password", "••••••••")} />
          </div>

          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <input
                id="confirm-password"
                {...inputProps(confirmPassword, setConfirmPassword, "password", "••••••••")}
              />
            </div>
          )}

          {/* Remember Me (Sign In only) */}
          {mode === "signin" && (
            <label style={styles.rememberRow}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: "#38bdf8", width: "15px", height: "15px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "13px", color: "#94a3b8", cursor: "pointer" }}>Remember me</span>
            </label>
          )}

          {error && <p style={styles.error}>⚠️ {error}</p>}
          {success && <p style={styles.successMsg}>✅ {success}</p>}

          <button
            id={mode === "signin" ? "login-btn" : "signup-btn"}
            onClick={mode === "signin" ? handleSignIn : handleSignUp}
            disabled={loading}
            style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, styles.buttonHover)}
            onMouseLeave={(e) => !loading && Object.assign(e.target.style, styles.button)}
          >
            {loading
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </button>
        </div>

        {/* Switch prompt */}
        <p style={styles.switchText}>
          {mode === "signin" ? "New to SCEO? " : "Already have an account? "}
          <span
            style={styles.switchLink}
            onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </span>
        </p>

        <p style={styles.footer}>Campus Energy Management System © 2026</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at 30% 20%, #0f2040 0%, #0a0f1e 60%)",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
    top: "-100px",
    left: "-100px",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
    bottom: "-80px",
    right: "-60px",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(56,189,248,0.08)",
    animation: "fadeIn 0.6s ease",
    position: "relative",
    zIndex: 1,
  },
  iconWrap: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    boxShadow: "0 0 30px rgba(56,189,248,0.4)",
    animation: "float 3s ease-in-out infinite",
  },
  icon: { fontSize: "28px" },
  title: {
    textAlign: "center",
    fontSize: "32px",
    fontWeight: "800",
    letterSpacing: "4px",
    background: "linear-gradient(90deg, #38bdf8, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "6px",
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "28px",
    letterSpacing: "0.5px",
  },
  tabBar: {
    display: "flex",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "4px",
    marginBottom: "28px",
    gap: "4px",
  },
  tab: {
    flex: 1,
    padding: "9px",
    borderRadius: "9px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
    letterSpacing: "0.3px",
  },
  tabActive: {
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    color: "#fff",
    boxShadow: "0 2px 12px rgba(56,189,248,0.35)",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#f1f5f9",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
  },
  inputFocus: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(56,189,248,0.5)",
    background: "rgba(56,189,248,0.06)",
    color: "#f1f5f9",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
    boxShadow: "0 0 0 3px rgba(56,189,248,0.1)",
  },
  error: {
    fontSize: "13px",
    color: "#f87171",
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
  },
  successMsg: {
    fontSize: "13px",
    color: "#34d399",
    background: "rgba(52,211,153,0.1)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
  },
  button: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #38bdf8, #818cf8)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
    boxShadow: "0 4px 20px rgba(56,189,248,0.3)",
  },
  buttonHover: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #0ea5e9, #7c3aed)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
    boxShadow: "0 8px 30px rgba(56,189,248,0.5)",
    transform: "translateY(-1px)",
  },
  buttonDisabled: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "not-allowed",
    letterSpacing: "0.5px",
    fontFamily: "Inter, sans-serif",
  },
  switchText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "13px",
    color: "#64748b",
  },
  switchLink: {
    color: "#38bdf8",
    cursor: "pointer",
    fontWeight: "600",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  footer: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "11px",
    color: "#334155",
    letterSpacing: "0.3px",
  },
};

export default Login;