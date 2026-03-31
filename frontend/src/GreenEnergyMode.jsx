import { useState, useEffect } from "react";

/* ── Time-based solar helpers ── */
function getSolarPhase(hour) {
  if (hour >= 6  && hour < 9)  return { id:"dawn",    label:"Dawn",        icon:"🌅", pct: (hour-6)/3*0.4,          color:"#fb923c" };
  if (hour >= 9  && hour < 12) return { id:"morning", label:"Morning Peak", icon:"☀️", pct:0.4+(hour-9)/3*0.55,       color:"#facc15" };
  if (hour >= 12 && hour < 15) return { id:"noon",    label:"Noon Peak",    icon:"🔆", pct:0.95+(Math.random()*0.05), color:"#fde047" };
  if (hour >= 15 && hour < 18) return { id:"afternoon",label:"Afternoon",   icon:"🌤️", pct:0.95-(hour-15)/3*0.65,    color:"#facc15" };
  if (hour >= 18 && hour < 20) return { id:"dusk",    label:"Dusk",         icon:"🌇", pct:0.3-(hour-18)/2*0.3,      color:"#f97316" };
  return { id:"night", label:"Night", icon:"🌙", pct:0, color:"#64748b" };
}

const BUILDINGS = [
  { name:"Admin Block",   solar:true,  baseW:18 },
  { name:"A-Block",       solar:true,  baseW:22 },
  { name:"B-Block",       solar:true,  baseW:19 },
  { name:"Cafeteria",     solar:false, baseW:30 },
  { name:"Boys Hostel",   solar:false, baseW:14 },
  { name:"Girls Hostel",  solar:false, baseW:14 },
  { name:"C-Block",       solar:true,  baseW:25 },
  { name:"Parking Lot",   solar:false, baseW:5  },
  { name:"D-Block",       solar:false, baseW:31 },
  { name:"Server Room",   solar:false, baseW:40 },
];

const TIPS = [
  { id:1, icon:"☀️", title:"Use Solar During Daytime",    body:"Peak solar output is 9 AM–3 PM. Schedule heavy loads (HVAC, washing, charging) within this window to maximise free energy.", tags:["solar","daytime"], impact:"High" },
  { id:2, icon:"🌙", title:"Defer Non-Critical Loads",    body:"Shift laundry, water heating and EV charging to off-peak night hours (11 PM–5 AM) when grid tariffs are lowest.", tags:["grid","savings"],  impact:"High" },
  { id:3, icon:"💡", title:"LED & Smart Lighting",        body:"Replace remaining fluorescent fixtures with LED. Use occupancy sensors in corridors and rest-rooms to cut standby waste.", tags:["lighting"],        impact:"Medium" },
  { id:4, icon:"❄️", title:"Pre-Cool Before Peak",        body:"Set HVAC to pre-cool buildings 30 min before peak occupancy using surplus solar so compressors run on green energy.", tags:["hvac","solar"],    impact:"High" },
  { id:5, icon:"🔋", title:"Battery Buffer Strategy",     body:"If campus batteries are installed, charge them at noon peak and discharge after 6 PM to cover evening demand without the grid.", tags:["battery","solar"], impact:"High" },
  { id:6, icon:"🖥️", title:"Server Room Off-Peak Jobs",  body:"Schedule batch processing, backups and ML training jobs between 2–5 AM to flatten the daytime demand curve.", tags:["servers"],         impact:"Medium" },
  { id:7, icon:"🪟", title:"Natural Ventilation Window",  body:"Open windows 6–8 AM and 5–7 PM to flush heat. This can reduce HVAC runtime by up to 20% on mild days.", tags:["hvac"],            impact:"Low" },
  { id:8, icon:"📊", title:"Monitor & Baseline",          body:"Buildings without sub-metering can hide 15–30% waste. Deploy power meters at panel level for granular visibility.", tags:["monitoring"],      impact:"Medium" },
];

const IMPACT_COLOR = { High:"#22c55e", Medium:"#fb923c", Low:"#64748b" };

function SunArc({ pct, isDark }) {
  const r = 80, cx = 120, cy = 100;
  const angle = Math.PI + pct * Math.PI;
  const sx = cx + r * Math.cos(Math.PI);
  const sy = cy + r * Math.sin(Math.PI);
  const ex = cx + r * Math.cos(angle);
  const ey = cy + r * Math.sin(angle);
  const sunX = ex, sunY = ey;

  return (
    <svg width={240} height={110} style={{display:"block",margin:"0 auto"}}>
      {/* track */}
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"} strokeWidth="4" strokeLinecap="round"/>
      {/* filled arc */}
      {pct>0&&<path d={`M ${sx} ${sy} A ${r} ${r} 0 ${pct>0.5?1:0} 1 ${ex} ${ey}`} fill="none" stroke="url(#solarGrad)" strokeWidth="4" strokeLinecap="round"/>}
      <defs>
        <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb923c"/>
          <stop offset="100%" stopColor="#fde047"/>
        </linearGradient>
      </defs>
      {/* sun */}
      {pct>0&&(
        <>
          <circle cx={sunX} cy={sunY} r="10" fill="#fde047" opacity="0.25"/>
          <circle cx={sunX} cy={sunY} r="6"  fill="#fde047"/>
        </>
      )}
      {/* horizon labels */}
      <text x={sx-2} y={cy+18} fontSize="10" fill={isDark?"#64748b":"#94a3b8"} textAnchor="middle">6AM</text>
      <text x={cx}   y={cy-r-8} fontSize="10" fill={isDark?"#64748b":"#94a3b8"} textAnchor="middle">12PM</text>
      <text x={cx+r+2} y={cy+18} fontSize="10" fill={isDark?"#64748b":"#94a3b8"} textAnchor="middle">6PM</text>
    </svg>
  );
}

function GreenEnergyMode({ isDark }) {
  const T = {
    card:  isDark?"rgba(255,255,255,0.04)" :"#ffffff",
    inner: isDark?"rgba(255,255,255,0.03)" :"#f8fafc",
    border:isDark?"rgba(255,255,255,0.07)" :"rgba(0,0,0,0.08)",
    text:  isDark?"#f1f5f9"               :"#1e293b",
    sub:   isDark?"#64748b"               :"#94a3b8",
    input: isDark?"#1e293b"               :"#f8fafc",
    inputB:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)",
  };

  const now = new Date();
  const hour = now.getHours() + now.getMinutes()/60;
  const [phase, setPhase] = useState(()=>getSolarPhase(hour));
  const [solarW, setSolarW] = useState(0);
  const [gridW, setGridW]   = useState(0);
  const [savingsKwh, setSavingsKwh] = useState(0);
  const [co2Saved, setCo2Saved]     = useState(0);
  const [filterTag, setFilterTag]   = useState("all");
  const [dismissed, setDismissed]   = useState([]);
  const [greenMode, setGreenMode]   = useState(false);

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours() + new Date().getMinutes()/60;
      const p = getSolarPhase(h);
      setPhase(p);
      const solarPeak = 45; // kW campus capacity
      const rawSolar = solarPeak * p.pct * (0.95 + Math.random()*0.05);
      const demand = 120 + Math.random()*20;
      const sW = Math.min(rawSolar, demand);
      const gW = Math.max(0, demand - sW);
      setSolarW(+sW.toFixed(1));
      setGridW(+gW.toFixed(1));
      setSavingsKwh(prev => +(prev + sW * (1400/3600000)).toFixed(3)); // accumulate
      setCo2Saved(prev => +(prev + sW * (1400/3600000) * 0.82).toFixed(3)); // 0.82 kg/kWh
    };
    tick();
    const iv = setInterval(tick, 1400);
    return () => clearInterval(iv);
  }, []);

  const isDaytime = phase.id !== "night";
  const solarPct = solarW+gridW>0 ? (solarW/(solarW+gridW)*100).toFixed(0) : 0;

  const visibleTips = TIPS.filter(t => {
    if (dismissed.includes(t.id)) return false;
    if (filterTag==="all") return true;
    return t.tags.includes(filterTag);
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>

      {/* Mode header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:"6px",background:isDaytime?"rgba(250,204,21,0.12)":"rgba(100,116,139,0.12)",border:`1px solid ${isDaytime?"rgba(250,204,21,0.4)":"rgba(100,116,139,0.3)"}`,borderRadius:"20px",padding:"4px 14px",fontSize:"12px",fontWeight:"700",color:isDaytime?"#fde047":"#94a3b8"}}>
            {phase.icon} {phase.label}
          </span>
          <span style={{fontSize:"12px",color:T.sub}}>{isDaytime?"Solar generation active":"Solar offline – grid only"}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"12px",color:T.sub}}>Green Mode</span>
          <div
            onClick={()=>setGreenMode(g=>!g)}
            style={{width:"44px",height:"24px",borderRadius:"12px",background:greenMode?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.08)",border:`1px solid ${greenMode?"rgba(34,197,94,0.6)":"rgba(255,255,255,0.15)"}`,position:"relative",cursor:"pointer",transition:"all 0.3s"}}
          >
            <div style={{position:"absolute",top:"3px",left:greenMode?"23px":"3px",width:"16px",height:"16px",borderRadius:"50%",background:greenMode?"#22c55e":"#64748b",transition:"left 0.3s",boxShadow:greenMode?"0 0 8px #22c55e":"none"}}/>
          </div>
          {greenMode&&<span style={{fontSize:"12px",fontWeight:"700",color:"#22c55e"}}>✅ Active</span>}
        </div>
      </div>

      {/* Advisory banner */}
      {isDaytime&&(
        <div style={{background:"rgba(250,204,21,0.08)",border:"1px solid rgba(250,204,21,0.35)",borderRadius:"14px",padding:"14px 20px",display:"flex",alignItems:"flex-start",gap:"14px"}}>
          <span style={{fontSize:"24px"}}>☀️</span>
          <div>
            <div style={{fontSize:"14px",fontWeight:"700",color:"#fde047"}}>Solar Energy Available — Use It Now!</div>
            <div style={{fontSize:"13px",color:T.sub,marginTop:"4px"}}>
              Current solar output is <strong style={{color:"#fde047"}}>{solarW} kW</strong> ({solarPct}% of demand).
              {Number(solarPct)>=70
                ? " Excellent conditions — shift heavy loads to solar now."
                : Number(solarPct)>=30
                  ? " Moderate generation — prioritise critical systems on solar."
                  : " Low generation — cloudy conditions. Continue monitoring."}
            </div>
          </div>
        </div>
      )}

      {/* Main 2-col */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>

        {/* LEFT column */}
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

          {/* Solar arc card */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px"}}>
            <div style={{fontSize:"15px",fontWeight:"700",color:T.text,marginBottom:"14px"}}>☀️ Solar Position Today</div>
            <SunArc pct={phase.pct} isDark={isDark}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginTop:"12px"}}>
              {[
                {label:"Solar",    value:`${solarW} kW`,  color:"#fde047"},
                {label:"Grid",     value:`${gridW} kW`,   color:"#f87171"},
                {label:"Solar %",  value:`${solarPct}%`,  color:"#22c55e"},
              ].map(m=>(
                <div key={m.label} style={{textAlign:"center",padding:"10px",borderRadius:"12px",background:T.inner,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:"16px",fontWeight:"800",color:m.color}}>{m.value}</div>
                  <div style={{fontSize:"10px",color:T.sub,marginTop:"2px"}}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live energy mix */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px"}}>
            <div style={{fontSize:"15px",fontWeight:"700",color:T.text,marginBottom:"14px"}}>⚡ Live Energy Mix</div>
            <div style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"6px"}}>
                <span style={{color:"#fde047",fontWeight:"600"}}>☀️ Solar {solarW} kW</span>
                <span style={{color:"#f87171",fontWeight:"600"}}>🔌 Grid {gridW} kW</span>
              </div>
              <div style={{height:"16px",borderRadius:"8px",background:T.inner,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex"}}>
                <div style={{width:`${solarPct}%`,background:"linear-gradient(90deg,#fb923c,#fde047)",borderRadius:"8px 0 0 8px",transition:"width 0.8s"}}/>
                <div style={{flex:1,background:isDark?"rgba(248,113,113,0.25)":"rgba(248,113,113,0.15)"}}/>
              </div>
              <div style={{fontSize:"11px",color:T.sub,marginTop:"5px",textAlign:"center"}}>{solarPct}% renewable right now</div>
            </div>
          </div>

          {/* Session savings */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px"}}>
            <div style={{fontSize:"15px",fontWeight:"700",color:T.text,marginBottom:"14px"}}>🌱 Session Savings</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {[
                {icon:"⚡",label:"Solar kWh",    value:savingsKwh.toFixed(2),unit:"kWh",color:"#fde047"},
                {icon:"🍃",label:"CO₂ Avoided",  value:co2Saved.toFixed(2),  unit:"kg", color:"#22c55e"},
              ].map(m=>(
                <div key={m.label} style={{padding:"14px",borderRadius:"14px",background:T.inner,border:`1px solid ${T.border}`,textAlign:"center"}}>
                  <div style={{fontSize:"22px"}}>{m.icon}</div>
                  <div style={{fontSize:"22px",fontWeight:"800",color:m.color,marginTop:"4px"}}>{m.value}</div>
                  <div style={{fontSize:"10px",color:T.sub}}>{m.unit}</div>
                  <div style={{fontSize:"10px",color:T.sub,marginTop:"2px"}}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Building solar status */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px"}}>
            <div style={{fontSize:"14px",fontWeight:"700",color:T.text,marginBottom:"12px"}}>🏛️ Building Solar Status</div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px",maxHeight:"200px",overflowY:"auto"}}>
              {BUILDINGS.map(b=>{
                const load = (b.baseW*(0.9+Math.random()*0.2)).toFixed(1);
                const solar = b.solar && isDaytime ? (Math.min(b.baseW*0.7,solarW/5)*(0.8+Math.random()*0.2)).toFixed(1) : "0.0";
                return (
                  <div key={b.name} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"10px",background:T.inner,border:`1px solid ${T.border}`}}>
                    <span style={{fontSize:"13px",width:"16px"}}>{b.solar?"🔆":"🔌"}</span>
                    <div style={{flex:1,fontSize:"12px",fontWeight:"600",color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:"11px",color:b.solar&&isDaytime?"#fde047":T.sub,fontWeight:"700"}}>{b.solar&&isDaytime?`☀️ ${solar} kW`:"Grid only"}</div>
                      <div style={{fontSize:"10px",color:T.sub}}>Load: {load} kW</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT column – Tips */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
            <div style={{fontSize:"15px",fontWeight:"700",color:T.text}}>💡 Optimization Tips</div>
            <select
              value={filterTag}
              onChange={e=>setFilterTag(e.target.value)}
              style={{padding:"6px 11px",borderRadius:"8px",border:`1px solid ${T.inputB}`,background:T.input,color:T.text,fontSize:"11px",fontFamily:"Inter,sans-serif",outline:"none",colorScheme:isDark?"dark":"light"}}
            >
              <option value="all">All Tips</option>
              <option value="solar">Solar</option>
              <option value="hvac">HVAC</option>
              <option value="lighting">Lighting</option>
              <option value="battery">Battery</option>
              <option value="servers">Servers</option>
              <option value="grid">Grid / Savings</option>
            </select>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"10px",overflowY:"auto",flex:1}}>
            {visibleTips.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:T.sub,fontSize:"13px"}}>
                <div style={{fontSize:"28px",marginBottom:"8px"}}>✅</div>
                All tips dismissed! Click "All Tips" to reset.
              </div>
            )}
            {visibleTips.map(tip=>(
              <div key={tip.id} style={{padding:"16px",borderRadius:"14px",background:T.inner,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:"8px",position:"relative"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <span style={{fontSize:"22px",flexShrink:0}}>{tip.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:"700",color:T.text}}>{tip.title}</div>
                    <span style={{fontSize:"10px",fontWeight:"700",color:IMPACT_COLOR[tip.impact],background:`${IMPACT_COLOR[tip.impact]}18`,padding:"1px 7px",borderRadius:"6px",border:`1px solid ${IMPACT_COLOR[tip.impact]}33`,display:"inline-block",marginTop:"4px"}}>
                      {tip.impact} Impact
                    </span>
                  </div>
                  <button
                    onClick={()=>setDismissed(d=>[...d,tip.id])}
                    style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:"14px",padding:"0",flexShrink:0}}
                    title="Dismiss"
                  >✕</button>
                </div>
                <div style={{fontSize:"12px",color:T.sub,lineHeight:1.6}}>{tip.body}</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {tip.tags.map(tag=>(
                    <span key={tag} style={{fontSize:"10px",color:T.sub,background:T.card,padding:"2px 8px",borderRadius:"6px",border:`1px solid ${T.border}`}}>#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Daily schedule advice */}
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:"14px"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:T.text,marginBottom:"10px"}}>📅 Today's Solar Schedule</div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {[
                {time:"6–9 AM",  icon:"🌅", label:"Dawn ramp-up",       advice:"Light loads – pre-charge batteries",     active: hour>=6&&hour<9},
                {time:"9–15 PM", icon:"☀️", label:"Peak solar window",  advice:"Run all heavy loads on solar now!",      active: hour>=9&&hour<15},
                {time:"15–18PM", icon:"🌤️", label:"Afternoon declining", advice:"Wind-down heavy loads, top up batteries",active: hour>=15&&hour<18},
                {time:"18–6 AM", icon:"🌙", label:"Night grid only",     advice:"Defer non-critical loads to off-peak",   active: hour>=18||hour<6},
              ].map(s=>(
                <div key={s.time} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"10px",background:s.active?"rgba(250,204,21,0.08)":T.inner,border:`1px solid ${s.active?"rgba(250,204,21,0.35)":T.border}`,transition:"all 0.3s"}}>
                  <span style={{fontSize:"16px"}}>{s.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:s.active?"#fde047":T.text}}>{s.time} — {s.label}</div>
                    <div style={{fontSize:"11px",color:T.sub,marginTop:"2px"}}>{s.advice}</div>
                  </div>
                  {s.active&&<span style={{fontSize:"10px",fontWeight:"700",color:"#fde047",background:"rgba(250,204,21,0.12)",border:"1px solid rgba(250,204,21,0.35)",padding:"2px 8px",borderRadius:"6px",flexShrink:0}}>NOW</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GreenEnergyMode;
