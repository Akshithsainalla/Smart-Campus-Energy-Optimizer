import { useMemo } from "react";

const BUILDINGS = [
  "Admin Block","Cafeteria","Parking Lot","Boys Hostel","Girls Hostel",
  "A-Block","B-Block","C-Block","D-Block","E-Block",
  "F-Block","G-Block","H-Block","I-Block","J-Block",
];

function grade(score) {
  if (score >= 80) return { label: "A", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" };
  if (score >= 60) return { label: "B", color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.3)" };
  if (score >= 40) return { label: "C", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.3)" };
  return { label: "D", color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)" };
}

function EfficiencyScores({ data, isDark }) {
  const scores = useMemo(() => {
    const byBuilding = {};
    const dayCount = {};
    data.forEach(d => {
      if (d.building) {
        byBuilding[d.building] = (byBuilding[d.building] || 0) + (d.consumption || 0);
        dayCount[d.building] = (dayCount[d.building] || 0) + 1;
      }
    });

    const avgs = BUILDINGS.map(b => ({
      name: b,
      avg: dayCount[b] ? byBuilding[b] / dayCount[b] : 0,
      total: byBuilding[b] || 0,
      count: dayCount[b] || 0,
    }));

    const campusAvg = avgs.filter(a => a.avg > 0).reduce((s, a) => s + a.avg, 0) /
      Math.max(1, avgs.filter(a => a.avg > 0).length);

    return avgs.map(a => {
      if (a.avg === 0) return { ...a, score: null };
      const diff = ((a.avg - campusAvg) / Math.max(campusAvg, 1)) * 100;
      const score = Math.max(0, Math.min(100, Math.round(100 - diff)));
      return { ...a, score };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [data]);

  const t = {
    card: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    innerCard: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#f1f5f9" : "#1e293b",
    sub: isDark ? "#64748b" : "#94a3b8",
  };

  const graded = scores.filter(s => s.score !== null);
  const aCnt = graded.filter(s => s.score >= 80).length;
  const bCnt = graded.filter(s => s.score >= 60 && s.score < 80).length;
  const cCnt = graded.filter(s => s.score >= 40 && s.score < 60).length;
  const dCnt = graded.filter(s => s.score < 40).length;

  if (data.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: t.sub }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏆</div>
      <p>Add energy records to compute efficiency scores.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {[
          { g: "A", count: aCnt, color: "#22c55e", label: "Excellent (≥80)" },
          { g: "B", count: bCnt, color: "#facc15", label: "Good (60–79)" },
          { g: "C", count: cCnt, color: "#fb923c", label: "Average (40–59)" },
          { g: "D", count: dCnt, color: "#f87171", label: "Poor (<40)" },
        ].map(s => (
          <div key={s.g} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: s.color }}>{s.g}</div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: t.text }}>{s.count}</div>
            <div style={{ fontSize: "11px", color: t.sub, marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "20px", padding: "24px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", color: t.text, marginBottom: "20px" }}>Building Efficiency Leaderboard</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {scores.map((s, i) => {
            if (s.score === null) return (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "12px", opacity: 0.4 }}>
                <span style={{ width: "22px", fontSize: "11px", color: t.sub }}>#{i+1}</span>
                <span style={{ width: "130px", fontSize: "13px", color: t.text }}>{s.name}</span>
                <span style={{ fontSize: "11px", color: t.sub, flex: 1 }}>No data</span>
              </div>
            );
            const g = grade(s.score);
            return (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ width: "22px", fontSize: "11px", color: t.sub, fontWeight: "700" }}>#{i+1}</span>
                <span style={{ width: "130px", fontSize: "13px", color: t.text, fontWeight: "500", flexShrink: 0 }}>{s.name}</span>
                <div style={{ flex: 1, height: "8px", background: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.score}%`, background: g.color, borderRadius: "4px", transition: "width 0.6s ease" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: t.text, width: "36px", textAlign: "right" }}>{s.score}</span>
                <span style={{
                  width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                  background: g.bg, border: `1px solid ${g.border}`, color: g.color, fontSize: "12px", fontWeight: "800", flexShrink: 0,
                }}>{g.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: "16px", padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: "10px", fontSize: "11px", color: t.sub }}>
          💡 Score = 100 − ((building avg − campus avg) / campus avg × 100). Higher = more efficient.
        </div>
      </div>
    </div>
  );
}

export default EfficiencyScores;
