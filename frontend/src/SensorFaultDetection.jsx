import { useState, useEffect, useRef, useCallback } from "react";

const SENSORS = [
  { id:"s1",  name:"Admin Temp Sensor",    unit:"°C",  min:18,  max:34,  baseline:24,  type:"temperature" },
  { id:"s2",  name:"Cafeteria Humidity",   unit:"%RH", min:30,  max:80,  baseline:55,  type:"humidity"    },
  { id:"s3",  name:"A-Block Power Meter",  unit:"kW",  min:0.5, max:50,  baseline:22,  type:"power"       },
  { id:"s4",  name:"B-Block Power Meter",  unit:"kW",  min:0.5, max:50,  baseline:19,  type:"power"       },
  { id:"s5",  name:"Parking CO₂ Sensor",  unit:"ppm", min:350, max:2000,baseline:600, type:"co2"         },
  { id:"s6",  name:"Boys Hostel Temp",     unit:"°C",  min:18,  max:34,  baseline:26,  type:"temperature" },
  { id:"s7",  name:"Girls Hostel Humidity",unit:"%RH", min:30,  max:80,  baseline:60,  type:"humidity"    },
  { id:"s8",  name:"Server Room Temp",     unit:"°C",  min:16,  max:28,  baseline:20,  type:"temperature" },
  { id:"s9",  name:"C-Block Power Meter",  unit:"kW",  min:0.5, max:50,  baseline:25,  type:"power"       },
  { id:"s10", name:"D-Block Power Meter",  unit:"kW",  min:0.5, max:50,  baseline:31,  type:"power"       },
  { id:"s11", name:"Library CO₂ Sensor",  unit:"ppm", min:350, max:2000,baseline:680, type:"co2"         },
  { id:"s12", name:"Gym Humidity Sensor",  unit:"%RH", min:30,  max:80,  baseline:65,  type:"humidity"    },
];

const FAULT_CLASSES = {
  out_of_range:{ label:"Out-of-Range",    icon:"📡", color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.35)", desc:"Value outside physical limits",  severity:4 },
  stuck:       { label:"Stuck / Frozen",  icon:"🧊", color:"#60a5fa", bg:"rgba(96,165,250,0.10)", border:"rgba(96,165,250,0.3)",   desc:"Reading unchanged for too long",  severity:3 },
  noise:       { label:"Noisy / Erratic", icon:"📶", color:"#facc15", bg:"rgba(250,204,21,0.08)", border:"rgba(250,204,21,0.35)",  desc:"Excessive random fluctuations",   severity:2 },
  dropout:     { label:"Dropout",         icon:"⚡",  color:"#fb923c", bg:"rgba(251,146,60,0.10)", border:"rgba(251,146,60,0.35)",  desc:"Sudden zero / null reading",      severity:5 },
};

const TYPE_ICONS = { temperature:"🌡️", humidity:"💧", power:"⚡", co2:"🌫️" };

function Sparkline({ history, color }) {
  const W = 100, H = 32;
  if (!history || history.length < 2) return null;
  const lo = Math.min(...history);
  const hi = Math.max(...history);
  const range = hi - lo || 1;
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((v - lo) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={W} height={H}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function SensorFaultDetection({ isDark }) {
  const T = {
    card:  isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    inner: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
    border:isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    text:  isDark ? "#f1f5f9"               : "#1e293b",
    sub:   isDark ? "#64748b"               : "#94a3b8",
    input: isDark ? "#1e293b"               : "#f8fafc",
    inputB:isDark ? "rgba(255,255,255,0.08)": "rgba(0,0,0,0.1)",
  };
  const sel = { padding:"7px 12px", borderRadius:"8px", border:`1px solid ${T.inputB}`, background:T.input, color:T.text, fontSize:"11px", fontFamily:"Inter,sans-serif", outline:"none", colorScheme: isDark?"dark":"light" };

  const stateRef = useRef(
    Object.fromEntries(SENSORS.map(s=>[s.id,{ value:s.baseline, history:[s.baseline], stuckTicks:0, faultOn:{} }]))
  );
  const [disp, setDisp] = useState(()=>Object.fromEntries(SENSORS.map(s=>[s.id,{ value:s.baseline, history:[s.baseline] }])));
  const [alerts, setAlerts] = useState([]);
  const [log, setLog] = useState([]);
  const [selected, setSelected] = useState("s1");
  const [cooldown, setCooldown] = useState(false);
  const [ftFilter, setFtFilter] = useState("all");
  const [tcFilter, setTcFilter] = useState("all");

  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date().toLocaleTimeString("en-IN");
      const newDisp = {}, newAlerts = [], newLog = [];

      SENSORS.forEach(s => {
        const st = stateRef.current[s.id];
        const prev = st.value;
        let next = prev + (Math.random()-0.49)*(s.baseline*0.05);
        next = Math.max(s.min*0.4, Math.min(s.max*1.6, next));
        st.value = next;
        st.history = [...st.history.slice(-19), next];

        const det = {};
        if (next < s.min || next > s.max) det.out_of_range = true;
        if (next < s.min*0.05) det.dropout = true;
        if (Math.abs(next-prev) < s.baseline*0.002) {
          st.stuckTicks++;
          if (st.stuckTicks >= 6) det.stuck = true;
        } else { st.stuckTicks = 0; }
        const win = st.history.slice(-8);
        if (win.length >= 6) {
          const mean = win.reduce((a,b)=>a+b,0)/win.length;
          const std = Math.sqrt(win.reduce((a,b)=>a+(b-mean)**2,0)/win.length);
          if (mean && std/Math.abs(mean) > 0.18) det.noise = true;
        }

        Object.keys(FAULT_CLASSES).forEach(fc => {
          const uid = `${s.id}-${fc}`;
          if (det[fc] && !st.faultOn[fc]) {
            st.faultOn[fc] = true;
            const e = { id:uid+Date.now(), uid, sensorId:s.id, sensorName:s.name, cls:fc, value:next.toFixed(2), unit:s.unit, time:now, resolved:false };
            newAlerts.push(e); newLog.push(e);
          } else if (!det[fc] && st.faultOn[fc]) {
            st.faultOn[fc] = false;
            newLog.push({ id:uid+"r"+Date.now(), uid, sensorId:s.id, sensorName:s.name, cls:fc, value:next.toFixed(2), unit:s.unit, time:now, resolved:true });
          }
        });
        newDisp[s.id] = { value:next, history:[...st.history] };
      });

      setDisp(newDisp);
      if (newAlerts.length) setAlerts(prev=>{
        const base = prev.filter(a=>!a.resolved);
        const fresh = newAlerts.filter(na=>!base.find(b=>b.uid===na.uid));
        return [...fresh,...base].slice(0,40);
      });
      if (newLog.length) setLog(prev=>[...newLog,...prev].slice(0,50));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  const simulateFault = useCallback(() => {
    if (cooldown) return;
    const s = SENSORS[Math.floor(Math.random()*SENSORS.length)];
    const cls = Object.keys(FAULT_CLASSES)[Math.floor(Math.random()*4)];
    const st = stateRef.current[s.id];
    if (cls==="out_of_range") st.value = s.max*1.7;
    else if (cls==="dropout") st.value = 0.00001;
    else if (cls==="stuck")   st.stuckTicks = 10;
    else { for(let k=0;k<8;k++) st.history[Math.max(0,st.history.length-1-k)] = s.baseline*(0.3+Math.random()*1.4); }
    setCooldown(true); setSelected(s.id);
    setTimeout(()=>setCooldown(false), 5000);
  }, [cooldown]);

  const resolveAll = () => setAlerts(p=>p.map(a=>({...a,resolved:true})));
  const active = alerts.filter(a=>!a.resolved);
  const healthScore = Math.max(0, 100 - active.length*12);
  const hColor = healthScore>=80?"#22c55e":healthScore>=50?"#fb923c":"#f87171";

  const visible = SENSORS.filter(s=>{
    if (tcFilter!=="all" && s.type!==tcFilter) return false;
    if (ftFilter!=="all" && !active.find(a=>a.sensorId===s.id&&a.cls===ftFilter)) return false;
    return true;
  });

  const selS = SENSORS.find(s=>s.id===selected);
  const selD = disp[selected]??{ value:selS?.baseline??0, history:[] };
  const selAlerts = active.filter(a=>a.sensorId===selected);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:"6px",background:active.length?"rgba(248,113,113,0.12)":"rgba(34,197,94,0.12)",border:`1px solid ${active.length?"rgba(248,113,113,0.4)":"rgba(34,197,94,0.4)"}`,borderRadius:"20px",padding:"4px 14px",fontSize:"12px",fontWeight:"700",color:active.length?"#f87171":"#22c55e"}}>
            {active.length?`🔴 ${active.length} SENSOR FAULT${active.length>1?"S":""}` :"✅ ALL SENSORS HEALTHY"}
          </span>
          <span style={{display:"inline-flex",alignItems:"center",gap:"5px",background:T.inner,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"4px 12px",fontSize:"12px",fontWeight:"700",color:hColor}}>
            🩺 Health: {healthScore}%
          </span>
          <span style={{fontSize:"12px",color:T.sub}}>Monitoring {SENSORS.length} campus sensors</span>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={simulateFault} disabled={cooldown} style={{padding:"8px 16px",borderRadius:"9px",border:"1px solid rgba(167,139,250,0.4)",background:cooldown?"transparent":"rgba(167,139,250,0.1)",color:cooldown?T.sub:"#a78bfa",fontSize:"12px",fontWeight:"700",cursor:cooldown?"not-allowed":"pointer",fontFamily:"Inter,sans-serif"}}>
            🧪 {cooldown?"Simulating…":"Inject Fault"}
          </button>
          {active.length>0&&<button onClick={resolveAll} style={{padding:"8px 16px",borderRadius:"9px",border:"1px solid rgba(34,197,94,0.35)",background:"rgba(34,197,94,0.1)",color:"#22c55e",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"Inter,sans-serif"}}>✓ Resolve All</button>}
        </div>
      </div>

      {/* Alert banners */}
      {active.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {active.slice(0,4).map(a=>{
            const fc=FAULT_CLASSES[a.cls]; const s=SENSORS.find(x=>x.id===a.sensorId);
            return (
              <div key={a.id} style={{background:fc.bg,border:`1px solid ${fc.border}`,borderRadius:"14px",padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:"14px"}}>
                <span style={{fontSize:"22px"}}>{fc.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"14px",fontWeight:"700",color:fc.color}}>{fc.label} — {a.sensorName}</div>
                  <div style={{fontSize:"12px",color:T.sub,marginTop:"3px"}}>
                    Reading: <strong style={{color:fc.color}}>{a.value} {a.unit}</strong>
                    {s&&<> · Range: {s.min}–{s.max} {s.unit}</>} · {fc.desc}
                  </div>
                  <div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Detected {a.time}</div>
                </div>
                <button onClick={()=>setAlerts(p=>p.map(x=>x.id===a.id?{...x,resolved:true}:x))} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:"16px",padding:0}}>✕</button>
              </div>
            );
          })}
          {active.length>4&&<div style={{fontSize:"12px",color:T.sub,textAlign:"center"}}>+{active.length-4} more…</div>}
        </div>
      )}

      {/* Main grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>

        {/* Sensor list */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
            <div style={{fontSize:"15px",fontWeight:"700",color:T.text}}>📡 Sensor Network</div>
            <div style={{display:"flex",gap:"6px"}}>
              <select value={tcFilter} onChange={e=>setTcFilter(e.target.value)} style={sel}>
                <option value="all">All Types</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="power">Power</option>
                <option value="co2">CO₂</option>
              </select>
              <select value={ftFilter} onChange={e=>setFtFilter(e.target.value)} style={sel}>
                <option value="all">All Status</option>
                {Object.entries(FAULT_CLASSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"7px",maxHeight:"500px",overflowY:"auto"}}>
            {visible.map(s=>{
              const d=disp[s.id]??{value:s.baseline};
              const sAlerts=active.filter(a=>a.sensorId===s.id);
              const hasFault=sAlerts.length>0;
              const worstFc=hasFault?FAULT_CLASSES[sAlerts.sort((a,b)=>FAULT_CLASSES[b.cls].severity-FAULT_CLASSES[a.cls].severity)[0].cls]:null;
              const isSelected=selected===s.id;
              return (
                <button key={s.id} onClick={()=>setSelected(s.id)} style={{padding:"11px 13px",borderRadius:"12px",textAlign:"left",border:`1px solid ${isSelected?"rgba(56,189,248,0.5)":hasFault?worstFc.border:T.border}`,background:isSelected?(isDark?"rgba(56,189,248,0.07)":"rgba(56,189,248,0.05)"):hasFault?worstFc.bg:T.inner,cursor:"pointer",fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",gap:"10px",transition:"all 0.2s",outline:"none"}}>
                  <span style={{fontSize:"17px",flexShrink:0}}>{TYPE_ICONS[s.type]}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                    <div style={{fontSize:"11px",color:T.sub,marginTop:"2px"}}>
                      <span style={{color:hasFault?worstFc.color:"#22c55e",fontWeight:"600"}}>{(typeof d.value==="number"?d.value:s.baseline).toFixed(1)} {s.unit}</span>
                      <span style={{marginLeft:"5px"}}>({s.min}–{s.max})</span>
                    </div>
                  </div>
                  {hasFault
                    ?<span style={{fontSize:"10px",fontWeight:"700",color:worstFc.color,background:worstFc.bg,padding:"2px 7px",borderRadius:"6px",border:`1px solid ${worstFc.border}`,flexShrink:0}}>{worstFc.icon} {worstFc.label}</span>
                    :<span style={{fontSize:"10px",color:"#22c55e",fontWeight:"600",flexShrink:0}}>✅ OK</span>}
                </button>
              );
            })}
            {visible.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:T.sub,fontSize:"13px"}}><div style={{fontSize:"26px",marginBottom:"6px"}}>🔍</div>No sensors match filter.</div>}
          </div>
        </div>

        {/* Right: detail + legend + log */}
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

          {/* Sensor detail */}
          {selS&&(
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"22px"}}>{TYPE_ICONS[selS.type]}</span>
                <div>
                  <div style={{fontSize:"15px",fontWeight:"700",color:T.text}}>{selS.name}</div>
                  <div style={{fontSize:"12px",color:T.sub}}>Valid range: {selS.min}–{selS.max} {selS.unit}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:"14px"}}>
                <div style={{fontSize:"36px",fontWeight:"800",color:selAlerts.length?FAULT_CLASSES[selAlerts[0].cls].color:"#22c55e",lineHeight:1}}>
                  {(selD.value??selS.baseline).toFixed(1)}
                  <span style={{fontSize:"15px",fontWeight:"400",color:T.sub,marginLeft:"4px"}}>{selS.unit}</span>
                </div>
                <Sparkline history={selD.history} color={selAlerts.length?FAULT_CLASSES[selAlerts[0].cls].color:"#22c55e"}/>
              </div>
              {/* range bar */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:T.sub,marginBottom:"4px"}}>
                  <span>{selS.min}</span><span>Baseline {selS.baseline}</span><span>{selS.max}</span>
                </div>
                <div style={{height:"6px",background:isDark?"rgba(255,255,255,0.06)":"#e2e8f0",borderRadius:"4px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,bottom:0,
                    left:`${((selS.min-selS.min*0.4)/(selS.max*1.6-selS.min*0.4))*100}%`,
                    width:`${((selS.max-selS.min)/(selS.max*1.6-selS.min*0.4))*100}%`,
                    background:"rgba(34,197,94,0.15)"}}/>
                  <div style={{position:"absolute",top:0,bottom:0,
                    left:`${Math.min(100,Math.max(0,((selD.value??selS.baseline)-selS.min*0.4)/(selS.max*1.6-selS.min*0.4)*100))}%`,
                    width:"3px",background:selAlerts.length?FAULT_CLASSES[selAlerts[0].cls].color:"#22c55e",
                    borderRadius:"2px",transform:"translateX(-50%)",transition:"left 0.5s"}}/>
                </div>
              </div>
              {selAlerts.length>0
                ?selAlerts.map(a=>{const fc=FAULT_CLASSES[a.cls];return(
                  <div key={a.uid} style={{padding:"10px 12px",borderRadius:"10px",background:fc.bg,border:`1px solid ${fc.border}`}}>
                    <div style={{fontSize:"13px",fontWeight:"700",color:fc.color}}>{fc.icon} {fc.label}</div>
                    <div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>{fc.desc} · {a.time}</div>
                  </div>
                );})
                :<div style={{textAlign:"center",color:"#22c55e",fontSize:"13px",fontWeight:"600"}}>✅ Sensor nominal</div>}
            </div>
          )}

          {/* Fault class legend */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"16px"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:T.text,marginBottom:"10px"}}>🔍 Fault Types</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
              {Object.entries(FAULT_CLASSES).map(([k,fc])=>{
                const cnt=active.filter(a=>a.cls===k).length;
                return(
                  <div key={k} style={{padding:"9px 11px",borderRadius:"10px",background:cnt?fc.bg:T.inner,border:`1px solid ${cnt?fc.border:T.border}`}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:cnt?fc.color:T.sub}}>{fc.icon} {fc.label}</div>
                    <div style={{fontSize:"10px",color:T.sub,marginTop:"2px"}}>{fc.desc}</div>
                    <div style={{fontSize:"11px",fontWeight:"700",color:cnt?fc.color:T.sub,marginTop:"3px"}}>{cnt?`${cnt} active`:"None"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log */}
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"20px",padding:"16px",flex:1}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:T.text,marginBottom:"10px"}}>📋 Detection Log</div>
            {log.length===0
              ?<div style={{textAlign:"center",padding:"20px 0",color:T.sub,fontSize:"13px"}}><div style={{fontSize:"26px",marginBottom:"6px"}}>🧪</div>Click "Inject Fault" to test.</div>
              :<div style={{display:"flex",flexDirection:"column",gap:"5px",maxHeight:"190px",overflowY:"auto"}}>
                {log.slice(0,25).map(e=>{const fc=FAULT_CLASSES[e.cls];return(
                  <div key={e.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",borderRadius:"8px",background:T.inner}}>
                    <span style={{fontSize:"13px"}}>{e.resolved?"✅":fc.icon}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:"11px",fontWeight:"600",color:e.resolved?"#22c55e":fc.color}}>{fc.label}</span>
                      <span style={{fontSize:"10px",color:T.sub,marginLeft:"5px"}}>— {e.sensorName}</span>
                    </div>
                    <span style={{fontSize:"9px",color:T.sub}}>{e.time}</span>
                    <span style={{fontSize:"9px",fontWeight:"700",color:e.resolved?T.sub:fc.color,textTransform:"uppercase"}}>{e.resolved?"resolved":"active"}</span>
                  </div>
                );})}
              </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SensorFaultDetection;
