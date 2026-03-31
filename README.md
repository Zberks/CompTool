# CompTool
import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const FF = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const N = {
  navy:"#003865", blue:"#0057A8", teal:"#00A9CE", tealLt:"#E5F6FB", navyLt:"#EDF2F8",
  blueLt:"#E8F1F9", white:"#FFFFFF", offWhite:"#F7F9FC", gray50:"#F0F4F8", gray100:"#E2E8F0",
  gray200:"#CBD5E1", gray400:"#94A3B8", gray600:"#475569", gray700:"#334155", gray800:"#1E293B",
  amber:"#F59E0B", amberLt:"#FEF3C7", red:"#DC2626", redLt:"#FEE2E2",
  green:"#059669", greenLt:"#D1FAE5", orange:"#EA580C", orangeLt:"#FFF0E6",
};
const shortageColor={low:N.teal,moderate:N.amber,high:N.orange,critical:N.red};
const shortageBg={low:N.tealLt,moderate:N.amberLt,high:N.orangeLt,critical:N.redLt};
const shortageLabel={low:"Well Supplied",moderate:"Moderate Demand",high:"High Demand",critical:"Critical Shortage"};
const fmt=v=>v>=1000?`$${Math.round(v/1000)}K`:`$${v}`;

async function geocodeZip(zip){
  const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(zip)}&countrycodes=us&limit=1`,{headers:{"Accept-Language":"en","User-Agent":"NAPAWorkforceTool/1.0"}});
  const d=await r.json();
  if(!d?.length) throw new Error(`ZIP code ${zip} not found`);
  return{lat:parseFloat(d[0].lat),lng:parseFloat(d[0].lon),display:d[0].display_name};
}
async function reverseGeocode(lat,lng){
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,{headers:{"Accept-Language":"en","User-Agent":"NAPAWorkforceTool/1.0"}});
    const d=await r.json();
    const city=d.address?.city||d.address?.town||d.address?.county||"";
    const state=d.address?.state_code||d.address?.state||"";
    return city?`${city}, ${state}`:state;
  }catch{return "";}
}
function dateRangeMultiplier(start,end){
  const midYear=((new Date(start+"-01").getFullYear()+new Date(end+"-01").getFullYear())/2);
  return 1+(midYear-2024)*0.032;
}
function syntheticWorkforceFromCoord(lat,lng,cityLabel,dateRange={start:"2023-01",end:"2025-12"}){
  const isNE=lat>40&&lng>-80,isWC=lng<-115,isSouth=lat<35,isMW=lat>37&&lat<47&&lng>-100&&lng<-80;
  const isRural=cityLabel?.toLowerCase().includes("county")||cityLabel?.toLowerCase().includes("rural");
  const colBase=isNE?135:isWC?138:isSouth?92:isMW?93:100;
  const col=Math.round(colBase+(Math.random()*10-5));
  const shortage=isRural?"critical":isSouth?"high":isNE?"low":isMW?"moderate":"moderate";
  const mult=dateRangeMultiplier(dateRange.start,dateRange.end);
  const mdBaseVal=Math.round((isNE?478000:isWC?498000:isSouth?408000:isMW?422000:440000)*mult);
  const mdComp=Math.round(mdBaseVal+(Math.random()*20000-10000));
  const mdBase=Math.round(mdComp*.78),mdBonus=Math.round(mdComp*.12),mdBenefits=Math.round(mdComp*.10);
  const mdSignOn=isRural?75000:isSouth?55000:isNE?40000:50000;
  const mdPtoDays=isNE?28:isSouth?22:30,md401kMatch=isNE?6:isSouth?4:5;
  const md401kVal=Math.round(mdBase*(md401kMatch/100)),mdCME=isNE?4500:isSouth?3000:4000;
  const mdMalpractice=isNE?28000:isSouth?22000:25000,mdRelocation=isRural?15000:10000;
  const crnaBaseVal=Math.round((isNE?248000:isWC?252000:isSouth?214000:isMW?220000:228000)*mult);
  const crnaComp=Math.round(crnaBaseVal+(Math.random()*10000-5000));
  const crnaBase=Math.round(crnaComp*.84),crnaBonus=Math.round(crnaComp*.10),crnaBenefits=Math.round(crnaComp*.09);
  const crnaSignOn=isRural?45000:isSouth?30000:isNE?20000:28000;
  const crnaPtoDays=isNE?25:isSouth?20:28,crna401kMatch=isNE?5:isSouth?4:4;
  const crna401kVal=Math.round(crnaBase*(crna401kMatch/100)),crnaCME=isNE?3000:isSouth?2000:2500;
  const crnaMalpractice=isNE?8000:isSouth?6000:7000,crnaRelocation=isRural?10000:6000;
  return{col,shortage,mdComp,mdBase,mdBonus,mdBenefits,mdSignOn,mdPtoDays,md401kMatch,md401kVal,mdCME,mdMalpractice,mdRelocation,
    crnaComp,crnaBase,crnaBonus,crnaBenefits,crnaSignOn,crnaPtoDays,crna401kMatch,crna401kVal,crnaCME,crnaMalpractice,crnaRelocation,
    mdNatDiff:(((mdComp-443000)/443000)*100).toFixed(1),crnaNatDiff:(((crnaComp-228000)/228000)*100).toFixed(1)};
}

// ── Shared UI ──────────────────────────────────────────────────────────────
const Tip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:N.white,border:`1px solid ${N.gray200}`,borderRadius:6,padding:"10px 14px",fontFamily:FF,boxShadow:"0 4px 12px rgba(0,56,101,0.12)"}}>
    {label&&<div style={{color:N.gray400,fontSize:11,marginBottom:4}}>{label}</div>}
    {payload.map((p,i)=>(<div key={i} style={{color:p.color||N.navy,fontWeight:600,fontSize:13}}>{p.name}: {typeof p.value==="number"&&p.value>999?fmt(p.value):p.value}</div>))}
  </div>);
};
const Badge=({label,color=N.blue,bg})=>(
  <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:4,background:bg||`${color}18`,border:`1px solid ${color}35`,fontSize:11,fontWeight:600,color,fontFamily:FF}}>{label}</span>
);
const Btn=({children,onClick,variant="primary",disabled,style={}})=>{
  const base={border:"none",borderRadius:6,padding:"10px 22px",fontWeight:600,fontSize:13,fontFamily:FF,cursor:disabled?"wait":"pointer",transition:"all .15s",...style};
  const styles={primary:{background:N.blue,color:N.white,...base},teal:{background:N.teal,color:N.white,...base},ghost:{background:"transparent",color:N.gray600,border:`1px solid ${N.gray200}`,...base}};
  return <button onClick={onClick} disabled={disabled} style={{...styles[variant]||styles.primary,opacity:disabled?.6:1}}>{children}</button>;
};
const TabBar=({tabs,active,onChange})=>(
  <div style={{display:"flex",gap:2,borderBottom:`2px solid ${N.gray100}`,marginBottom:20,flexWrap:"wrap"}}>
    {tabs.map(([k,l])=>(
      <button key={k} onClick={()=>onChange(k)} style={{padding:"10px 18px",background:"none",border:"none",borderBottom:`2px solid ${active===k?N.blue:"transparent"}`,marginBottom:-2,color:active===k?N.blue:N.gray400,fontWeight:active===k?700:500,fontSize:13,fontFamily:FF,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>{l}</button>
    ))}
  </div>
);

// ── SOURCE CONFIG ─────────────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  indeed:  { label: "Indeed",     icon: "🔍", color: N.blue,    applyBase: "https://www.indeed.com/viewjob?jk=" },
  gaswork: { label: "GasWork",    icon: "⛽", color: "#e65c00", applyBase: "https://www.gaswork.com/post/" },
  gasjobs: { label: "GasJobs",    icon: "💨", color: "#7b2d8b", applyBase: "https://www.gasjobs.com/jobs/" },
};

// ── LIVE JOB POSTINGS TAB ────────────────────────────────────────────────────
function LiveJobsTab({ zip, locLabel, radius, pastedJobs = [] }) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");
  const [fetched, setFetched] = useState(false);
  const [activeRole, setActiveRole] = useState("All");
  const [activeSource, setActiveSource] = useState("All");
  const [sortBy, setSortBy] = useState("salary");
  const [view, setView] = useState("table"); // "table" | "cards"
  const [sourceStatus, setSourceStatus] = useState({});

  const extractJSON = (text) => {
    const s = text.indexOf("["), e = text.lastIndexOf("]");
    if (s === -1 || e === -1) return [];
    try { return JSON.parse(text.slice(s, e + 1)); } catch { return []; }
  };

  const parseSalaryMid = (s) => {
    if (!s || s === "null") return null;
    const nums = s.replace(/[^0-9kKmM.\-–]/g, " ").split(/[\s\-–]+/).map(n => {
      if (!n) return null;
      const v = parseFloat(n.replace(/[kK]/i, "")) * (n.match(/[kK]/i) ? 1000 : 1);
      return v > 500 ? v : v > 0 ? v * 1000 : null;
    }).filter(n => n && n > 0);
    if (!nums.length) return null;
    const mid = nums.length >= 2 ? Math.round((nums[0] + nums[1]) / 2) : nums[0];
    // Sanity check — anesthesia salaries should be between $50K and $2M
    return (mid >= 50000 && mid <= 2000000) ? mid : null;
  };

  const [apifyToken, setApifyToken] = useState("");

  // ── Apify valig/indeed-jobs-scraper ──────────────────────────────────────
  const APIFY_TOKEN = apifyToken.trim();

  const runApifyActor = async (input) => {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/valig~indeed-jobs-scraper/runs?token=${APIFY_TOKEN}&timeout=90&memory=512`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }
    );
    if (!runRes.ok) throw new Error(`Apify run failed: ${runRes.status}`);
    const runData = await runRes.json();
    const datasetId = runData.data?.defaultDatasetId;
    if (!datasetId) throw new Error("No datasetId returned");

    // Poll for completion (max 90s)
    const runId = runData.data?.id;
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusRes.json();
      const status = statusData.data?.status;
      if (status === "SUCCEEDED") break;
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") throw new Error(`Actor run ${status}`);
    }

    // Fetch results
    const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`);
    if (!itemsRes.ok) throw new Error("Failed to fetch dataset");
    return await itemsRes.json();
  };

  // Normalize raw Apify job → standard job object
  const normalizeApifyJob = (raw, source = "indeed") => {
    const salMin = raw.baseSalary?.min;
    const salMax = raw.baseSalary?.max;
    const salaryStr = salMin && salMax
      ? `${Math.round(salMin/1000)}K–${Math.round(salMax/1000)}K`
      : salMin ? `${Math.round(salMin/1000)}K+` : null;
    const salaryMid = salMin && salMax ? Math.round((salMin+salMax)/2) : salMin || null;

    const titleLower = (raw.title||"").toLowerCase();
    const descLower = (raw.description?.text||"").toLowerCase();
    let role = "MD";
    if (titleLower.includes("crna") || titleLower.includes("nurse anesthetist") || descLower.includes("crna") && !titleLower.includes("physician")) role = "CRNA";
    else if (titleLower.includes("anesthesiologist assistant") || titleLower.includes(" aa ")) role = "AA";

    const jobTypesObj = raw.jobTypes || raw.employerAttributes || {};
    const jobTypeMap = { "CF3CP": "Full-Time", "BFXZR": "Part-Time", "PJMGE": "Contract", "DQKBV": "Locum Tenens", "QYZJH": "Per Diem" };
    const jobType = Object.entries(jobTypesObj).map(([k]) => jobTypeMap[k]).filter(Boolean)[0] || "Full-Time";

    const postedDate = raw.datePublished
      ? (() => { const d = Math.floor((Date.now() - new Date(raw.datePublished))/86400000); return d===0?"Today":d===1?"1 day ago":`${d} days ago`; })()
      : "Recently";

    const benefitMap = { "EY33Q":"Health insurance","FQJ2X":"Dental insurance","RZAT2":"Vision insurance","HW4J4":"PTO","AWHEP":"Paid holidays","KBRYN":"Pension","T5TJS":"403(b)","9C4KH":"457(b)","V2CTH":"Loan forgiveness","53E7B":"CME credits","NPHPU":"Parental leave" };
    const benefits = Object.entries(raw.benefits||{}).map(([k])=>benefitMap[k]).filter(Boolean).slice(0,5);

    return {
      title: raw.title || "Anesthesia Position",
      company: raw.employer?.name || "Healthcare System",
      location: raw.location?.city ? `${raw.location.city}, ${raw.location.admin1Code}` : "United States",
      salary: salaryStr,
      salaryMid,
      salaryMin: salMin || null,
      salaryMax: salMax || null,
      jobType,
      role,
      postedDate,
      snippet: (raw.description?.text||"").slice(0, 120).replace(/\s+/g," ").trim(),
      applyUrl: raw.jobUrl || raw.url || "https://www.indeed.com",
      indeedUrl: raw.url || null,
      source,
      benefits,
      isUrgent: raw.isUrgentHire || false,
      employerRating: raw.employer?.ratingsValue || null,
    };
  };

  // ── Fallback: web search via Claude API ───────────────────────────────────
  const fetchViaWebSearch = async () => {
    const stateMatch = locLabel.match(/,\s*([A-Z]{2})$/);
    const state = stateMatch ? stateMatch[1] : "";
    const city = locLabel.replace(/,.*$/, "").trim();
    const prompt = `Search the web for current anesthesia job postings near ${locLabel} (ZIP ${zip}).
Search for: CRNA jobs ${city} ${state}, anesthesiologist jobs ${city} ${state}, anesthesia positions ${zip}.
Return ONLY a JSON array of real jobs found:
[{"title":"...","company":"...","location":"City, ST","salary":"$XXXk-$XXXk or null","jobType":"Full-Time","role":"CRNA|MD|AA","postedDate":"X days ago","snippet":"...","applyUrl":"https://...","source":"indeed"}]`;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000,
        tools:[{type:"web_search_20250305",name:"web_search"}],
        messages:[{role:"user",content:prompt}] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content.map(b=>b.type==="text"?b.text:"").join("");
    const jobs = extractJSON(text);
    return jobs.map(j=>({ ...j, salary:j.salary==="null"?null:j.salary, salaryMid:parseSalaryMid(j.salary), source:j.source||"indeed" }));
  };

  const fetchAllJobs = async () => {
    setLoading(true); setErr(""); setJobs([]); setFetched(true);
    setSourceStatus({ indeed: "searching…", gaswork: "—", gasjobs: "—" });
    try {
      let normalized = [];

      if (APIFY_TOKEN) {
        // Run two Apify searches in parallel: CRNA + Anesthesiologist
        setSourceStatus({ indeed: "⏳ Running Apify…", gaswork: "—", gasjobs: "—" });
        const stateMatch = locLabel.match(/,\s*([A-Z]{2})$/);
        const state = stateMatch ? stateMatch[1] : "";
        const city = locLabel.replace(/,.*$/, "").trim();
        const locationStr = city ? `${city}, ${state}` : state || zip;

        const [crnaRaw, mdRaw] = await Promise.allSettled([
          runApifyActor({ title: "CRNA nurse anesthetist", location: locationStr, country: "us", limit: 25, datePosted: "14" }),
          runApifyActor({ title: "anesthesiologist", location: locationStr, country: "us", limit: 25, datePosted: "14" }),
        ]);

        const crnaJobs = crnaRaw.status==="fulfilled" ? crnaRaw.value.map(j=>normalizeApifyJob(j,"indeed")) : [];
        const mdJobs   = mdRaw.status==="fulfilled"   ? mdRaw.value.map(j=>normalizeApifyJob(j,"indeed")) : [];

        // Dedupe by URL
        const seen = new Set();
        normalized = [...crnaJobs, ...mdJobs].filter(j => {
          if (seen.has(j.applyUrl)) return false;
          seen.add(j.applyUrl); return true;
        });
        setSourceStatus({ indeed: `${normalized.length} jobs`, gaswork: "—", gasjobs: "—" });
      } else {
        // Fallback to web search
        setSourceStatus({ indeed: "⏳ Web search…", gaswork: "⏳", gasjobs: "⏳" });
        normalized = await fetchViaWebSearch();
        const bySrc = {};
        normalized.forEach(j => { bySrc[j.source]=(bySrc[j.source]||0)+1; });
        setSourceStatus({
          indeed:  bySrc.indeed  ? `${bySrc.indeed} jobs`  : "0 found",
          gaswork: bySrc.gaswork ? `${bySrc.gaswork} jobs` : "0 found",
          gasjobs: bySrc.gasjobs ? `${bySrc.gasjobs} jobs` : "0 found",
        });
      }

      if (!normalized.length) setErr("No listings found. Try a larger radius or different ZIP.");
      else setJobs(normalized.map((j,i)=>({...j, id:i+1})));
    } catch(e) {
      setErr(`Search failed: ${e.message}`);
      setSourceStatus({ indeed:"error", gaswork:"—", gasjobs:"—" });
    }
    setLoading(false);
  };

  const roleColor = { MD: N.blue, CRNA: N.teal, AA: N.navy };
  const typeColor = { "Full-Time": N.green, "Part-Time": N.teal, "Per Diem": N.amber, "Contract": N.orange, "Locum Tenens": N.red };
  const typeIcon  = { "Full-Time": "💼", "Part-Time": "🕐", "Per Diem": "📅", "Contract": "🧾", "Locum Tenens": "✈️" };

  const filtered = [...allJobs]
    .filter(j => activeRole === "All" || j.role === activeRole)
    .filter(j => activeSource === "All" || j.source === activeSource)
    .sort((a, b) => {
      if (sortBy === "salary") return (b.salaryMid||0) - (a.salaryMid||0);
      if (sortBy === "role") return (a.role||"").localeCompare(b.role||"");
      if (sortBy === "company") return (a.company||"").localeCompare(b.company||"");
      if (sortBy === "source") return (a.source||"").localeCompare(b.source||"");
      return 0; // date order (as-received)
    });

  // ── Averages ───────────────────────────────────────────────────────────────
  const allJobs = [...jobs, ...pastedJobs];
  const withSal = allJobs.filter(j => j.salaryMid && j.salaryMid > 0);
  const avgAll  = withSal.length ? Math.round(withSal.reduce((s,j)=>s+j.salaryMid,0)/withSal.length) : null;
  const mdWithSal   = allJobs.filter(j=>j.role==="MD"   && j.salaryMid && j.salaryMid > 0);
  const crnaWithSal = allJobs.filter(j=>j.role==="CRNA" && j.salaryMid && j.salaryMid > 0);
  const avgMD   = mdWithSal.length   ? Math.round(mdWithSal.reduce((s,j)=>s+j.salaryMid,0)/mdWithSal.length)   : null;
  const avgCRNA = crnaWithSal.length ? Math.round(crnaWithSal.reduce((s,j)=>s+j.salaryMid,0)/crnaWithSal.length) : null;
  const pastedWithSal = pastedJobs.filter(j=>j.salaryMid&&j.salaryMid>0);
  const avgPasted = pastedWithSal.length ? Math.round(pastedWithSal.reduce((s,j)=>s+j.salaryMid,0)/pastedWithSal.length) : null;

  // ── Avg summary table rows by source × role ────────────────────────────────
  const avgRows = ["MD","CRNA","AA","All"].map(role => {
    const row = { role };
    ["indeed","gaswork","gasjobs","all"].forEach(src => {
      const subset = jobs.filter(j =>
        (role==="All" || j.role===role) &&
        (src==="all" || j.source===src) &&
        j.salaryMid && j.salaryMid > 0
      );
      row[src] = subset.length ? Math.round(subset.reduce((s,j)=>s+j.salaryMid,0)/subset.length) : null;
      row[src+"_n"] = subset.length;
    });
    return row;
  });

  if (!fetched) return (
    <div style={{ background: N.tealLt, border:`1px solid ${N.teal}30`, borderRadius:10, padding:40, fontFamily:FF }}>
      <div style={{textAlign:"center", marginBottom:28}}>
        <div style={{ fontSize:44, marginBottom:12 }}>🔍</div>
        <div style={{ fontSize:22, fontWeight:700, color:N.navy, marginBottom:8 }}>Live Indeed Job Search</div>
        <p style={{ fontSize:13, color:N.gray600, maxWidth:540, margin:"0 auto", lineHeight:1.8 }}>
          Pull real, current anesthesia postings for <strong style={{color:N.navy}}>{locLabel}</strong> directly from Indeed via <strong style={{color:"#e65c00"}}>Apify</strong> — or use the free web-search fallback.
        </p>
      </div>

      {/* Token input */}
      <div style={{background:N.white, border:`1px solid ${N.gray200}`, borderRadius:10, padding:20, maxWidth:560, margin:"0 auto 20px"}}>
        <div style={{fontSize:11, fontWeight:700, color:N.navy, textTransform:"uppercase", letterSpacing:".08em", marginBottom:10}}>
          🔑 Apify API Token <span style={{color:N.gray400, fontWeight:500, textTransform:"none", letterSpacing:0}}>(optional — enables direct Indeed scraping)</span>
        </div>
        <div style={{display:"flex", gap:8, marginBottom:10}}>
          <input
            type="password"
            placeholder="apify_api_xxxxxxxxxxxxxxxxxxxx"
            value={apifyToken}
            onChange={e=>setApifyToken(e.target.value)}
            style={{flex:1, padding:"9px 12px", border:`1.5px solid ${apifyToken?N.teal:N.gray200}`, borderRadius:6, fontSize:13, color:N.navy, fontFamily:FF, background:N.white}}
          />
          {apifyToken && <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 10px",background:N.greenLt,borderRadius:6,fontSize:11,fontWeight:700,color:N.green}}>✓ Set</div>}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          <div style={{background:apifyToken?N.greenLt:N.gray50, border:`1px solid ${apifyToken?N.green+"30":N.gray200}`, borderRadius:7, padding:"10px 12px"}}>
            <div style={{fontSize:11,fontWeight:700,color:apifyToken?N.green:N.gray400,marginBottom:4}}>🚀 With Apify Token</div>
            <div style={{fontSize:10,color:N.gray600,lineHeight:1.5}}>Real-time Indeed scraper · Structured salary data · ~$0.01–0.15 per search · 25 CRNA + 25 MD results</div>
          </div>
          <div style={{background:!apifyToken?N.amberLt:N.gray50, border:`1px solid ${!apifyToken?N.amber+"30":N.gray200}`, borderRadius:7, padding:"10px 12px"}}>
            <div style={{fontSize:11,fontWeight:700,color:!apifyToken?N.amber:N.gray400,marginBottom:4}}>🌐 Free Fallback (no token)</div>
            <div style={{fontSize:10,color:N.gray600,lineHeight:1.5}}>AI web search · Free · Less structured · Fewer results · May miss some postings</div>
          </div>
        </div>
        <div style={{marginTop:10,fontSize:10,color:N.gray400}}>
          Get a free Apify API token at <a href="https://console.apify.com/account/integrations" target="_blank" rel="noopener noreferrer" style={{color:N.blue}}>console.apify.com/account/integrations</a> · Actor used: <code style={{background:N.gray50,padding:"1px 5px",borderRadius:3}}>valig/indeed-jobs-scraper</code>
        </div>
      </div>

      <div style={{textAlign:"center"}}>
        <Btn onClick={fetchAllJobs} variant="teal" style={{fontSize:14, padding:"13px 36px"}}>
          {apifyToken ? "🚀 Fetch Live Indeed Jobs via Apify" : "🌐 Search Jobs (Free Fallback)"}
        </Btn>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ background:N.navyLt, borderRadius:10, padding:48, textAlign:"center" }}>
      <div style={{fontSize:13, fontWeight:700, color:N.navy, marginBottom:20, fontFamily:FF}}>Searching all 3 job boards simultaneously…</div>
      <div style={{display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap"}}>
        {Object.entries(SOURCE_CONFIG).map(([k,s])=>(
          <div key={k} style={{background:N.white, border:`2px solid ${s.color}40`, borderRadius:8, padding:"12px 20px", display:"flex", gap:8, alignItems:"center", minWidth:160}}>
            <span style={{fontSize:16}}>{s.icon}</span>
            <div>
              <div style={{fontSize:12, fontWeight:700, color:s.color, fontFamily:FF}}>{s.label}</div>
              <div style={{fontSize:10, color:sourceStatus[k]==="error"?N.red:N.teal, fontFamily:FF}}>
                {!sourceStatus[k]||sourceStatus[k]==="loading"?"⏳ Fetching…":sourceStatus[k]==="error"?"⚠ Error":`✓ ${sourceStatus[k]}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (err && !jobs.length) return (
    <div style={{background:N.redLt, border:`1px solid ${N.red}30`, borderRadius:8, padding:32, textAlign:"center"}}>
      <div style={{fontSize:13, color:N.red, fontWeight:600, marginBottom:12, fontFamily:FF}}>⚠ {err}</div>
      <Btn onClick={fetchAllJobs}>Try Again</Btn>
    </div>
  );

  return (
    <div style={{display:"grid", gap:18}}>

      {/* ── Header stats bar ── */}
      <div style={{background:N.navy, borderRadius:10, overflow:"hidden"}}>
        <div style={{padding:"14px 22px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10}}>
          <div>
            <div style={{fontSize:10, fontWeight:700, color:N.teal, textTransform:"uppercase", letterSpacing:".1em", marginBottom:3, fontFamily:FF}}>📋 Live Postings — {locLabel}</div>
            <div style={{fontSize:18, fontWeight:700, color:N.white, fontFamily:FF}}>{jobs.length} jobs · {withSal.length} with salary disclosed</div>
          </div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
            {Object.entries(SOURCE_CONFIG).map(([k,s])=>(
              <div key={k} style={{display:"flex", gap:5, alignItems:"center", background:"rgba(255,255,255,0.07)", borderRadius:5, padding:"5px 10px"}}>
                <span style={{fontSize:13}}>{s.icon}</span>
                <span style={{fontSize:11, fontWeight:600, color:s.color, fontFamily:FF}}>{s.label}</span>
                <span style={{fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:FF}}>{jobs.filter(j=>j.source===k).length}</span>
                {sourceStatus[k]==="error"&&<span style={{fontSize:9, color:N.red}}>⚠</span>}
              </div>
            ))}
            <Btn onClick={fetchAllJobs} variant="ghost" style={{fontSize:11, padding:"5px 12px", borderColor:"rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.6)"}}>↻ Refresh</Btn>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))"}}>
          {[
            {l:"Total Listings",    v:jobs.length,                    c:N.white},
            {l:"Avg Comp — All",    v:avgAll  ? fmt(avgAll)  : "—",   c:N.green,  sub:`${withSal.length} w/ salary`},
            {l:"Avg Comp — MD",     v:avgMD   ? fmt(avgMD)   : "—",   c:N.blue,   sub:`${jobs.filter(j=>j.role==="MD"&&j.salaryMid).length} w/ salary`},
            {l:"Avg Comp — CRNA",   v:avgCRNA ? fmt(avgCRNA) : "—",   c:N.teal,   sub:`${jobs.filter(j=>j.role==="CRNA"&&j.salaryMid).length} w/ salary`},
            {l:"MD Postings",       v:jobs.filter(j=>j.role==="MD").length,   c:N.blue},
            {l:"CRNA Postings",     v:jobs.filter(j=>j.role==="CRNA").length, c:N.teal},
          ].map((k,i)=>(
            <div key={i} style={{padding:"12px 16px", borderRight:i<5?"1px solid rgba(255,255,255,0.06)":"none", borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:3, fontFamily:FF}}>{k.l}</div>
              <div style={{fontSize:22, fontWeight:700, color:k.c, lineHeight:1, fontFamily:FF}}>{k.v}</div>
              {k.sub&&<div style={{fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2, fontFamily:FF}}>{k.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Avg Comp Summary Table ── */}
      <div style={{background:N.white, border:`1px solid ${N.gray100}`, borderRadius:8, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,56,101,0.06)"}}>
        <div style={{background:N.navy, padding:"10px 18px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{fontSize:11, fontWeight:700, color:N.white, fontFamily:FF}}>📊 Average Salary by Role &amp; Source</div>
          <div style={{fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:FF}}>midpoint of disclosed salary ranges · n = postings with salary shown</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse", fontFamily:FF, fontSize:13}}>
            <thead>
              <tr style={{background:N.gray50}}>
                {["Role","Indeed","GasWork","GasJobs","All Boards Combined"].map((h,i)=>(
                  <th key={i} style={{padding:"10px 16px", textAlign:i===0?"left":"center", fontSize:10, fontWeight:700, color:N.gray600, textTransform:"uppercase", letterSpacing:".08em", borderBottom:`2px solid ${N.gray100}`, whiteSpace:"nowrap"}}>
                    {i>0&&i<4&&<span style={{marginRight:4}}>{Object.values(SOURCE_CONFIG)[i-1]?.icon}</span>}{h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {avgRows.map((row,ri)=>{
                const isAll = row.role==="All";
                const rc = {MD:N.blue,CRNA:N.teal,AA:N.navy,All:N.gray600}[row.role];
                return(
                  <tr key={ri} style={{background:isAll?N.navyLt:ri%2===0?N.white:N.gray50, borderTop:`1px solid ${N.gray100}`}}>
                    <td style={{padding:"12px 16px", fontWeight:700, color:rc}}>
                      {isAll ? <span style={{color:N.gray600}}>All Roles</span> : <Badge label={row.role} color={rc}/>}
                    </td>
                    {["indeed","gaswork","gasjobs","all"].map(src=>(
                      <td key={src} style={{padding:"12px 16px", textAlign:"center"}}>
                        {row[src]
                          ? <div>
                              <div style={{fontSize:15, fontWeight:700, color:isAll?N.navy:rc}}>{fmt(row[src])}</div>
                              <div style={{fontSize:10, color:N.gray400}}>n={row[src+"_n"]}</div>
                            </div>
                          : <span style={{fontSize:12, color:N.gray200}}>—</span>
                        }
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"8px 16px", background:N.amberLt, borderTop:`1px solid ${N.amber}20`, fontSize:10, color:N.gray600, fontFamily:FF}}>
          ⚠ Averages based only on postings that disclose salary. Many anesthesia roles omit salary — actual market rates may differ. n = number of postings with salary data.
        </div>
      </div>

      {/* ── Filters & view toggle ── */}
      <div style={{background:N.white, border:`1px solid ${N.gray100}`, borderRadius:8, padding:"12px 18px", display:"grid", gap:10}}>
        <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:"space-between"}}>
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <span style={{fontSize:11, color:N.gray400, fontWeight:700, fontFamily:FF}}>Source:</span>
            <button onClick={()=>setActiveSource("All")} style={{padding:"5px 12px", borderRadius:4, background:activeSource==="All"?N.navy:N.white, border:`1px solid ${activeSource==="All"?N.navy:N.gray200}`, color:activeSource==="All"?N.white:N.gray600, fontSize:11, fontFamily:FF, cursor:"pointer", fontWeight:600}}>All</button>
            {Object.entries(SOURCE_CONFIG).map(([k,s])=>(
              <button key={k} onClick={()=>setActiveSource(k)} style={{padding:"5px 12px", borderRadius:4, background:activeSource===k?s.color:N.white, border:`1.5px solid ${activeSource===k?s.color:N.gray200}`, color:activeSource===k?N.white:N.gray600, fontSize:11, fontFamily:FF, cursor:"pointer", fontWeight:600, display:"flex", gap:4, alignItems:"center"}}>
                {s.icon} {s.label}
              </button>
            ))}
            {pastedJobs.length>0&&(
              <button onClick={()=>setActiveSource("pasted")} style={{padding:"5px 12px", borderRadius:4, background:activeSource==="pasted"?"#e65c00":N.white, border:`1.5px solid ${activeSource==="pasted"?"#e65c00":N.gray200}`, color:activeSource==="pasted"?N.white:N.gray600, fontSize:11, fontFamily:FF, cursor:"pointer", fontWeight:600}}>
                📎 Pasted ({pastedJobs.length})
              </button>
            )}
          </div>
          {/* View toggle */}
          <div style={{display:"flex", gap:4, background:N.gray50, borderRadius:6, padding:3}}>
            {[["table","⊞ Table"],["cards","☰ Cards"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"5px 12px", borderRadius:4, background:view===v?N.white:"transparent", border:"none", fontSize:11, fontFamily:FF, cursor:"pointer", fontWeight:view===v?700:500, color:view===v?N.navy:N.gray400, boxShadow:view===v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:"space-between"}}>
          <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <span style={{fontSize:11, color:N.gray400, fontWeight:700, fontFamily:FF}}>Role:</span>
            {["All","MD","CRNA","AA"].map(f=>(
              <button key={f} onClick={()=>setActiveRole(f)} style={{padding:"5px 12px", borderRadius:4, background:activeRole===f?N.navy:N.white, border:`1px solid ${activeRole===f?N.navy:N.gray200}`, color:activeRole===f?N.white:N.gray600, fontSize:11, fontFamily:FF, cursor:"pointer", fontWeight:600}}>{f}</button>
            ))}
          </div>
          <div style={{display:"flex", gap:6, alignItems:"center"}}>
            <span style={{fontSize:11, color:N.gray400, fontWeight:700, fontFamily:FF}}>Sort:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:N.white, border:`1px solid ${N.gray200}`, borderRadius:5, padding:"5px 10px", color:N.navy, fontSize:11, fontFamily:FF}}>
              <option value="salary">Salary: High → Low</option>
              <option value="date">Most Recent</option>
              <option value="role">By Role</option>
              <option value="company">By Company</option>
              <option value="source">By Board</option>
            </select>
            <span style={{fontSize:11, color:N.gray400, fontFamily:FF}}>{filtered.length} listings</span>
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {view==="table"&&(
        <div style={{border:`1px solid ${N.gray100}`, borderRadius:8, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,56,101,0.06)"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse", fontFamily:FF, fontSize:12}}>
              <thead>
                <tr style={{background:N.navy}}>
                  {["Role","Job Title","Company","Location","Salary","Type","Source","Posted","Apply"].map((h,i)=>(
                    <th key={i} style={{padding:"10px 14px", textAlign:i>=4&&i!==1?"center":"left", fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:".07em", whiteSpace:"nowrap", borderRight:i<8?"1px solid rgba(255,255,255,0.06)":"none"}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, i)=>{
                  const rc = roleColor[job.role]||N.blue;
                  const src = SOURCE_CONFIG[job.source]||SOURCE_CONFIG.indeed;
                  return(
                    <tr key={job.id} style={{background:i%2===0?N.white:N.gray50, borderTop:`1px solid ${N.gray100}`, borderLeft:`3px solid ${rc}`}}>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`}}>
                        <Badge label={job.role||"?"} color={rc}/>
                      </td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, maxWidth:220}}>
                        <div style={{fontWeight:700, color:N.navy, lineHeight:1.3}}>{job.title}</div>
                        {job.snippet&&<div style={{fontSize:10, color:N.gray400, marginTop:3, lineHeight:1.4}}>{job.snippet.slice(0,80)}{job.snippet.length>80?"…":""}</div>}
                      </td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, fontWeight:600, color:N.gray600, whiteSpace:"nowrap"}}>{job.company||"—"}</td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, color:N.gray600, whiteSpace:"nowrap"}}>{job.location||"—"}</td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, textAlign:"center", whiteSpace:"nowrap"}}>
                        {job.salary
                          ? <div>
                              <div style={{fontWeight:700, color:N.green}}>{job.salary}</div>
                              {job.salaryMid&&<div style={{fontSize:10, color:N.gray400}}>mid: {fmt(job.salaryMid)}</div>}
                            </div>
                          : <span style={{fontSize:11, color:N.gray200}}>not listed</span>
                        }
                      </td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, textAlign:"center"}}>
                        {job.jobType
                          ? <span style={{fontSize:10, fontWeight:600, color:typeColor[job.jobType]||N.gray400, background:`${typeColor[job.jobType]||N.gray400}15`, padding:"2px 7px", borderRadius:3}}>
                              {typeIcon[job.jobType]||""} {job.jobType}
                            </span>
                          : <span style={{color:N.gray200, fontSize:11}}>—</span>
                        }
                      </td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, textAlign:"center"}}>
                        <span style={{fontSize:10, fontWeight:700, color:src.color}}>{src.icon} {src.label}</span>
                      </td>
                      <td style={{padding:"10px 14px", borderRight:`1px solid ${N.gray100}`, textAlign:"center", color:N.gray400, fontSize:11, whiteSpace:"nowrap"}}>{job.postedDate||"—"}</td>
                      <td style={{padding:"10px 14px", textAlign:"center"}}>
                        <a href={job.applyUrl||src.applyBase} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                          <div style={{padding:"5px 10px", background:src.color, borderRadius:4, fontSize:10, fontWeight:700, color:N.white, whiteSpace:"nowrap", display:"inline-block"}}>Apply →</div>
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length&&(
                  <tr><td colSpan={9} style={{padding:32, textAlign:"center", color:N.gray400, fontSize:13}}>No listings match current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {view==="cards"&&(
        <div style={{display:"grid", gap:10}}>
          {filtered.map(job=>{
            const rc = roleColor[job.role]||N.blue;
            const src = SOURCE_CONFIG[job.source]||SOURCE_CONFIG.indeed;
            return(
              <div key={job.id} style={{background:N.white, border:`1px solid ${N.gray100}`, borderRadius:8, padding:"14px 18px", borderLeft:`4px solid ${rc}`, boxShadow:"0 1px 4px rgba(0,56,101,0.05)", display:"grid", gridTemplateColumns:"1fr auto", gap:14, alignItems:"start"}}>
                <div>
                  <div style={{display:"flex", gap:6, alignItems:"center", marginBottom:6, flexWrap:"wrap"}}>
                    <Badge label={job.role||"?"} color={rc}/>
                    {job.jobType&&<Badge label={`${typeIcon[job.jobType]||""} ${job.jobType}`} color={typeColor[job.jobType]||N.gray400}/>}
                    <span style={{display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:4, background:`${src.color}15`, border:`1px solid ${src.color}30`, fontSize:10, fontWeight:700, color:src.color, fontFamily:FF}}>{src.icon} {src.label}</span>
                    {job.postedDate&&<span style={{fontSize:10, color:N.gray400, fontFamily:FF}}>📅 {job.postedDate}</span>}
                  </div>
                  <div style={{fontSize:15, fontWeight:700, color:N.navy, marginBottom:3, lineHeight:1.3, fontFamily:FF}}>{job.title}</div>
                  <div style={{fontSize:12, color:N.gray600, marginBottom:5, fontFamily:FF}}>🏥 <strong>{job.company}</strong> · 📍 {job.location}</div>
                  {job.salary&&<div style={{fontSize:14, fontWeight:700, color:N.green, fontFamily:FF}}>💰 {job.salary}{job.salaryMid?<span style={{fontSize:11, color:N.gray400, fontWeight:500}}> (mid: {fmt(job.salaryMid)})</span>:""}</div>}
                  {job.snippet&&<div style={{fontSize:11, color:N.gray400, lineHeight:1.6, marginTop:6, fontFamily:FF}}>{job.snippet}</div>}
                </div>
                <a href={job.applyUrl||src.applyBase} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                  <div style={{padding:"8px 14px", background:src.color, borderRadius:6, fontSize:11, fontWeight:700, color:N.white, whiteSpace:"nowrap", fontFamily:FF}}>Apply →</div>
                </a>
              </div>
            );
          })}
          {!filtered.length&&<div style={{padding:40, textAlign:"center", color:N.gray400, fontSize:13, background:N.white, borderRadius:8, fontFamily:FF}}>No listings match current filters.</div>}
        </div>
      )}

      <div style={{background:N.navyLt, border:`1px solid ${N.gray100}`, borderRadius:6, padding:"10px 14px", display:"flex", gap:8}}>
        <span style={{fontSize:13}}>ℹ️</span>
        <p style={{fontSize:11, color:N.gray600, margin:0, lineHeight:1.6, fontFamily:FF}}>
          <strong>Indeed</strong> via live MCP connection · <strong>GasWork</strong> &amp; <strong>GasJobs</strong> via AI web search. All Apply links go directly to the original posting. Salary averages use the midpoint of disclosed ranges only.
        </p>
      </div>
    </div>
  );
}

// ── PASTE JOBS PANEL ─────────────────────────────────────────────────────────
function PasteJobsPanel({ onJobsAdded, existingJobs }) {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");
  const [added, setAdded] = useState(false);

  const APIFY_TOKEN = "apify_api_evmmRYWP7SERtVnHzU8Y1QrEOiAGyX3T1zDr";

  const scrapeUrl = async (url) => {
    const endpoint = `https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items`
      + `?token=${APIFY_TOKEN}&timeout=60&memory=256&format=json&limit=1`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: url, maxResults: 1 }),
    });
    if (!res.ok) throw new Error(`Scrape failed (${res.status})`);
    const items = await res.json();
    return items[0];
  };

  const extractJobFromPage = (raw, url) => {
    const md = raw?.markdown || raw?.text || "";
    const title = raw?.metadata?.title || "";

    // Salary extraction — look for various patterns in markdown
    const salPatterns = [
      /\$([0-9,]+(?:\.[0-9]+)?)\s*[-–to]+\s*\$([0-9,]+(?:\.[0-9]+)?)\s*(?:per year|\/yr|annually|a year)?/gi,
      /(?:salary|pay|compensation)[:\s]+\$([0-9,]+(?:\.[0-9]+)?)\s*[-–]\s*\$([0-9,]+(?:\.[0-9]+)?)/gi,
      /\$([0-9]{2,3}(?:,[0-9]{3})?(?:\.[0-9]+)?)[kK]?\s*[-–]\s*\$([0-9]{2,3}(?:,[0-9]{3})?(?:\.[0-9]+)?)[kK]?/g,
      /([0-9]{3,3}(?:,[0-9]{3})?)\s*[-–]\s*([0-9]{3}(?:,[0-9]{3})?)\s*(?:per year|annually)/gi,
    ];

    let salaryStr = null, salaryMid = null;
    for (const pat of salPatterns) {
      const m = pat.exec(md);
      if (m) {
        let lo = parseFloat(m[1].replace(/,/g,""));
        let hi = parseFloat(m[2].replace(/,/g,""));
        // handle K suffix or raw numbers without K
        if (lo < 1000) lo *= 1000;
        if (hi < 1000) hi *= 1000;
        if (lo >= 50000 && hi <= 3000000 && hi > lo) {
          salaryStr = `${Math.round(lo/1000)}K–${Math.round(hi/1000)}K`;
          salaryMid = Math.round((lo+hi)/2);
          break;
        }
      }
    }
    // Single salary
    if (!salaryStr) {
      const single = /\$([0-9]{2,3}(?:,[0-9]{3})?(?:\.[0-9]+)?)\s*(?:per year|\/year|annually|k\b)/gi.exec(md);
      if (single) {
        let v = parseFloat(single[1].replace(/,/g,""));
        if (v < 2000) v *= 1000;
        if (v >= 50000 && v <= 3000000) { salaryStr = `${Math.round(v/1000)}K`; salaryMid = v; }
      }
    }

    // Company
    const compMatch = md.match(/(?:employer|company|hospital|health system|medical center)[:\s]+([^\n.]{3,60})/i)
      || md.match(/\*\*([A-Z][A-Za-z\s&'.-]{3,50})\*\*[\s\S]{0,200}(?:anesthes|CRNA|physician)/i);
    const company = compMatch ? compMatch[1].trim() : (title.split(/[-|–]/)[1]||"").trim() || "See posting";

    // Location
    const locMatch = md.match(/([A-Z][a-zA-Z\s]+),\s+([A-Z]{2})(?:\s|,|$)/);
    const location = locMatch ? `${locMatch[1].trim()}, ${locMatch[2]}` : "See posting";

    // Role
    const tl = (title + " " + md.slice(0,500)).toLowerCase();
    let role = "MD";
    if (tl.includes("crna")||tl.includes("nurse anesthetist")) role = "CRNA";
    else if (tl.includes("anesthesiologist assistant")||tl.includes(" caa ")) role = "AA";

    // Job type
    const jobType = tl.includes("locum") ? "Locum Tenens"
      : tl.includes("per diem")||tl.includes("prn") ? "Per Diem"
      : tl.includes("part-time")||tl.includes("part time") ? "Part-Time"
      : tl.includes("contract") ? "Contract" : "Full-Time";

    // Snippet
    const snippet = md.replace(/#+\s*/g,"").replace(/\*+/g,"").replace(/\n+/g," ").slice(0,150).trim();

    return {
      title: title.replace(/ [-–|].*$/,"").trim() || "Anesthesia Position",
      company, location, salary: salaryStr, salaryMid,
      salaryMin: null, salaryMax: null, jobType, role,
      postedDate: "Pasted", benefits: [], isUrgent: false,
      employerRating: null, snippet,
      applyUrl: url, indeedUrl: null, source: "pasted",
    };
  };

  const handleScrape = async () => {
    const lines = urls.split("\n").map(l=>l.trim()).filter(l=>l.startsWith("http"));
    if (!lines.length) { setErr("Paste at least one URL (one per line)"); return; }
    setLoading(true); setErr(""); setResults([]);
    const scraped = [];
    for (const url of lines) {
      try {
        const raw = await scrapeUrl(url);
        scraped.push(extractJobFromPage(raw, url));
      } catch(e) {
        scraped.push({ title:"Could not fetch", company:"—", location:"—",
          salary:null, salaryMid:null, jobType:"Full-Time", role:"MD",
          postedDate:"Pasted", benefits:[], isUrgent:false, employerRating:null,
          snippet:`Error: ${e.message}`, applyUrl:url, indeedUrl:null, source:"pasted", _error:true });
      }
    }
    setResults(scraped);
    setLoading(false);
  };

  const handleManualAdd = () => {
    // Add any successfully scraped jobs directly without needing to re-confirm
    const good = results.filter(j=>!j._error);
    if (!good.length) return;
    onJobsAdded(good);
    setAdded(true);
    setTimeout(()=>setAdded(false), 2500);
  };

  const roleColor = { MD:N.blue, CRNA:N.teal, AA:N.navy };

  // Avg of pasted+existing salaries combined
  const pastedWithSal = results.filter(j=>j.salaryMid&&j.salaryMid>0&&!j._error);
  const existingWithSal = existingJobs.filter(j=>j.salaryMid&&j.salaryMid>0);
  const pastedAvg = pastedWithSal.length ? Math.round(pastedWithSal.reduce((s,j)=>s+j.salaryMid,0)/pastedWithSal.length) : null;
  const combinedJobs = [...existingWithSal, ...pastedWithSal];
  const combinedAvg = combinedJobs.length ? Math.round(combinedJobs.reduce((s,j)=>s+j.salaryMid,0)/combinedJobs.length) : null;

  return (
    <div style={{display:"grid", gap:16, fontFamily:FF}}>

      {/* Header */}
      <div style={{background:N.navy, borderRadius:10, padding:"18px 22px"}}>
        <div style={{fontSize:10, fontWeight:700, color:N.teal, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4}}>📎 Paste Job Links</div>
        <div style={{fontSize:18, fontWeight:700, color:N.white, marginBottom:4}}>Add Jobs from Any URL</div>
        <p style={{fontSize:12, color:"rgba(255,255,255,0.5)", margin:0, lineHeight:1.7}}>
          Paste links to any job postings (Indeed, GasWork, GasJobs, hospital careers pages, etc.) — the tool will scrape each page and extract the salary, role, and details automatically. Pasted jobs get their own separate average so you can compare.
        </p>
      </div>

      {/* URL input */}
      <div style={{background:N.white, border:`1px solid ${N.gray100}`, borderRadius:8, padding:20}}>
        <div style={{fontSize:11, fontWeight:700, color:N.navy, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8}}>Job URLs — one per line</div>
        <textarea
          value={urls}
          onChange={e=>setUrls(e.target.value)}
          placeholder={"https://www.gasjobs.com/job/crna-opportunity/12345/\nhttps://www.indeed.com/viewjob?jk=abc123\nhttps://careers.hospital.org/job/anesthesiologist/456\nhttps://www.gaswork.com/post/567890"}
          rows={6}
          style={{width:"100%", padding:"10px 12px", border:`1.5px solid ${N.gray200}`, borderRadius:6,
            fontSize:12, fontFamily:"monospace", color:N.navy, resize:"vertical", lineHeight:1.6}}
        />
        {err && <div style={{fontSize:11, color:N.red, marginTop:6}}>{err}</div>}
        <div style={{display:"flex", gap:10, marginTop:12, alignItems:"center"}}>
          <Btn onClick={handleScrape} disabled={loading} variant="teal" style={{fontSize:13}}>
            {loading ? "⏳ Scraping…" : "🔍 Scrape & Extract"}
          </Btn>
          <span style={{fontSize:11, color:N.gray400}}>
            Uses Apify rag-web-browser · ~{Math.max(1,urls.split("\n").filter(l=>l.startsWith("http")).length)} URL{urls.split("\n").filter(l=>l.startsWith("http")).length!==1?"s":""} · ~10s each
          </span>
        </div>
      </div>

      {/* Avg comparison */}
      {(pastedAvg || combinedAvg) && (
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
          {[
            { l:"Pasted Jobs Avg", v:pastedAvg, sub:`${pastedWithSal.length} job${pastedWithSal.length!==1?"s":""} w/ salary`, c:N.orange },
            { l:"Search Results Avg", v:existingWithSal.length?Math.round(existingWithSal.reduce((s,j)=>s+j.salaryMid,0)/existingWithSal.length):null,
              sub:`${existingWithSal.length} jobs w/ salary`, c:N.blue },
            { l:"Combined Average", v:combinedAvg, sub:`${combinedJobs.length} total w/ salary`, c:N.teal },
          ].map((k,i)=>(
            <div key={i} style={{background:N.white, border:`2px solid ${k.c}30`, borderRadius:8, padding:"14px 16px", borderTop:`3px solid ${k.c}`}}>
              <div style={{fontSize:9, fontWeight:700, color:N.gray400, textTransform:"uppercase", letterSpacing:".08em", marginBottom:4}}>{k.l}</div>
              <div style={{fontSize:22, fontWeight:700, color:k.v?k.c:N.gray200}}>{k.v?fmt(k.v):"—"}</div>
              <div style={{fontSize:10, color:N.gray400, marginTop:2}}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Scraped results preview */}
      {results.length > 0 && (
        <div style={{border:`1px solid ${N.gray100}`, borderRadius:8, overflow:"hidden"}}>
          <div style={{background:N.navy, padding:"10px 18px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div style={{fontSize:11, fontWeight:700, color:N.white}}>
              📋 Scraped Results — {results.filter(j=>!j._error).length} of {results.length} successful
            </div>
            <button
              onClick={handleManualAdd}
              disabled={!results.filter(j=>!j._error).length}
              style={{padding:"6px 16px", borderRadius:5, background:added?N.green:N.teal, border:"none",
                color:N.white, fontSize:11, fontWeight:700, fontFamily:FF, cursor:"pointer"}}>
              {added ? "✓ Added!" : `➕ Add ${results.filter(j=>!j._error).length} to Live Postings`}
            </button>
          </div>
          {results.map((job,i)=>{
            const rc = roleColor[job.role]||N.blue;
            return (
              <div key={i} style={{display:"grid", gridTemplateColumns:"1fr auto", gap:12, padding:"12px 18px",
                background:i%2===0?N.white:N.gray50, borderBottom:`1px solid ${N.gray100}`,
                borderLeft:`3px solid ${job._error?N.red:rc}`, opacity:job._error?0.5:1}}>
                <div>
                  <div style={{display:"flex", gap:6, alignItems:"center", marginBottom:4, flexWrap:"wrap"}}>
                    {!job._error && <Badge label={job.role} color={rc}/>}
                    {!job._error && <Badge label={job.jobType} color={N.gray400}/>}
                    <span style={{fontSize:10, color:"#e65c00", fontWeight:700, background:"#fff0e6",
                      border:"1px solid #e65c0030", padding:"2px 7px", borderRadius:3}}>📎 Pasted</span>
                  </div>
                  <div style={{fontSize:14, fontWeight:700, color:N.navy}}>{job.title}</div>
                  <div style={{fontSize:11, color:N.gray600}}>{job.company} · {job.location}</div>
                  {job.salary && <div style={{fontSize:13, fontWeight:700, color:N.green, marginTop:3}}>💰 {job.salary}
                    {job.salaryMid&&<span style={{fontSize:10,color:N.gray400,fontWeight:400}}> (mid: {fmt(job.salaryMid)})</span>}
                  </div>}
                  {!job.salary && !job._error && <div style={{fontSize:11, color:N.amber, marginTop:3}}>⚠ Salary not found on page</div>}
                  {job._error && <div style={{fontSize:11, color:N.red, marginTop:3}}>{job.snippet}</div>}
                </div>
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none", alignSelf:"center"}}>
                  <div style={{padding:"6px 12px", background:N.navy, borderRadius:5, fontSize:10, fontWeight:700, color:N.white, whiteSpace:"nowrap"}}>
                    View →
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual entry fallback */}
      <div style={{background:N.navyLt, border:`1px solid ${N.gray100}`, borderRadius:8, padding:"14px 18px"}}>
        <div style={{fontSize:11, fontWeight:700, color:N.navy, marginBottom:8}}>✏️ Can't scrape a URL? Add salary manually</div>
        <ManualJobEntry onAdd={onJobsAdded}/>
      </div>
    </div>
  );
}

function ManualJobEntry({ onAdd }) {
  const [v, setV] = useState({ title:"", company:"", location:"", salary:"", role:"CRNA", jobType:"Full-Time", applyUrl:"" });
  const [added, setAdded] = useState(false);
  const set = (k,val) => setV(p=>({...p,[k]:val}));

  const handleAdd = () => {
    if (!v.title) return;
    const salaryMid = (() => {
      const m = v.salary.match(/([0-9,]+)/g);
      if (!m) return null;
      const nums = m.map(n=>parseFloat(n.replace(/,/g,""))).filter(n=>n>0).map(n=>n<2000?n*1000:n);
      if (!nums.length) return null;
      return nums.length>=2?Math.round((nums[0]+nums[1])/2):nums[0];
    })();
    onAdd([{ ...v, salaryMid, salaryMin:null, salaryMax:null,
      postedDate:"Manual", benefits:[], isUrgent:false, employerRating:null,
      snippet:v.title, indeedUrl:null, source:"pasted",
      id: Date.now() }]);
    setAdded(true);
    setV({ title:"", company:"", location:"", salary:"", role:"CRNA", jobType:"Full-Time", applyUrl:"" });
    setTimeout(()=>setAdded(false), 2000);
  };

  const inp = (k,ph,w="1fr") => (
    <div style={{gridColumn:`span 1`}}>
      <input value={v[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
        style={{width:"100%",padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,
          fontSize:12,fontFamily:FF,color:N.navy}}/>
    </div>
  );

  return (
    <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, alignItems:"end"}}>
      <input value={v.title} onChange={e=>set("title",e.target.value)} placeholder="Job title *"
        style={{gridColumn:"span 2",padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,fontSize:12,fontFamily:FF,color:N.navy}}/>
      <input value={v.company} onChange={e=>set("company",e.target.value)} placeholder="Company"
        style={{padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,fontSize:12,fontFamily:FF,color:N.navy}}/>
      <input value={v.location} onChange={e=>set("location",e.target.value)} placeholder="City, ST"
        style={{padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,fontSize:12,fontFamily:FF,color:N.navy}}/>
      <input value={v.salary} onChange={e=>set("salary",e.target.value)} placeholder="Salary e.g. $280K-$320K"
        style={{gridColumn:"span 1",padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,fontSize:12,fontFamily:FF,color:N.navy}}/>
      <select value={v.role} onChange={e=>set("role",e.target.value)}
        style={{padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,fontSize:12,fontFamily:FF,color:N.navy}}>
        {["CRNA","MD","AA"].map(r=><option key={r}>{r}</option>)}
      </select>
      <select value={v.jobType} onChange={e=>set("jobType",e.target.value)}
        style={{padding:"7px 10px",border:`1px solid ${N.gray200}`,borderRadius:5,fontSize:12,fontFamily:FF,color:N.navy}}>
        {["Full-Time","Part-Time","Per Diem","Contract","Locum Tenens"].map(t=><option key={t}>{t}</option>)}
      </select>
      <button onClick={handleAdd} disabled={!v.title}
        style={{padding:"7px 14px",background:added?N.green:N.blue,border:"none",borderRadius:5,
          fontSize:11,fontWeight:700,color:N.white,fontFamily:FF,cursor:"pointer"}}>
        {added?"✓ Added":"➕ Add"}
      </button>
    </div>
  );
}

// ── POSTED ROLES COMP ANALYZER ──────────────────────────────────────────────
function PostedRolesTab({zip, radius, locLabel, wf}){
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [err, setErr] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterTypes, setFilterTypes] = useState(new Set(["Full-Time","Part-Time","Per Diem","1099 / Independent","Locum Tenens"]));
  const [sortBy, setSortBy] = useState("comp_desc");
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true); setErr(""); setRoles([]); setSelected(new Set()); setGenerated(true);
    const prompt = `You are a healthcare staffing data analyst. Generate a realistic dataset of 28 anesthesia job postings within ${radius} miles of ZIP code ${zip} (${locLabel}).
Market context: MD avg comp ${wf.mdComp.toLocaleString()}, CRNA avg comp ${wf.crnaComp.toLocaleString()}, shortage: ${wf.shortage}, cost of living index: ${wf.col}.
Return ONLY a JSON array — no markdown, no preamble. Each object:
{"id":NUMBER,"title":"...","employer":"Real-sounding hospital or group name","location":"City, ST","distanceMi":NUMBER,"role":"MD"|"CRNA"|"AA","type":"Full-Time"|"Part-Time"|"Per Diem"|"1099 / Independent"|"Locum Tenens","setting":"Academic Medical Center"|"Community Hospital"|"Ambulatory Surgery Center"|"Critical Access Hospital"|"Private Group"|"VA Medical Center","subspecialty":"General"|"Cardiac"|"Pediatric"|"OB"|"Pain"|"Neuro"|"Regional","salary":"$XXXk–$XXXk","base":NUMBER,"totalComp":NUMBER,"bonus":NUMBER,"signOn":NUMBER,"pto":NUMBER,"match401k":NUMBER,"callDays":NUMBER,"posted":"X days ago","urgent":true|false,"source":"Indeed"|"ASA"|"AANA"|"BagMask"|"Hospital"|"LinkedIn","applyUrl":"https://..."}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, messages:[{role:"user", content:prompt}] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content.filter(c=>c.type==="text").map(c=>c.text).join("");
      const start = text.indexOf("["), end = text.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("No data returned.");
      const parsed = JSON.parse(text.slice(start, end+1));
      const withIds = parsed.map((r,i)=>({...r, id:i+1, base:Number(r.base)||0, totalComp:Number(r.totalComp)||0, bonus:Number(r.bonus)||0, signOn:Number(r.signOn)||0, pto:Number(r.pto)||0, match401k:Number(r.match401k)||0, callDays:Number(r.callDays)||0, distanceMi:Number(r.distanceMi)||1 }));
      setRoles(withIds);
      setSelected(new Set(withIds.map(r=>r.id)));
    } catch(e) { setErr(`Error: ${e.message}`); }
    finally { setLoading(false); }
  };

  const toggleRole = (id) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const selectAll = () => setSelected(new Set(roles.map(r=>r.id)));
  const selectNone = () => setSelected(new Set());
  const selectByRole = (role) => setSelected(new Set(roles.filter(r=>r.role===role).map(r=>r.id)));
  const toggleType = (t) => { setFilterTypes(prev => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next; }); };

  const displayRoles = [...roles]
    .filter(r => filterRole === "All" || r.role === filterRole)
    .filter(r => filterTypes.has(r.type))
    .sort((a,b) => sortBy==="comp_desc"?b.totalComp-a.totalComp:sortBy==="comp_asc"?a.totalComp-b.totalComp:sortBy==="dist"?a.distanceMi-b.distanceMi:b.base-a.base);

  const selRoles = roles.filter(r => selected.has(r.id));
  const selMD = selRoles.filter(r=>r.role==="MD");
  const selCRNA = selRoles.filter(r=>r.role==="CRNA");
  const avg = arr => arr.length ? Math.round(arr.reduce((s,r)=>s+r,0)/arr.length) : 0;
  const avgTotalComp=avg(selRoles.map(r=>r.totalComp)), avgBase=avg(selRoles.map(r=>r.base));
  const avgBonus=avg(selRoles.map(r=>r.bonus)), avgSignOn=avg(selRoles.filter(r=>r.signOn>0).map(r=>r.signOn));
  const avgPto=avg(selRoles.map(r=>r.pto)), avg401k=avg(selRoles.map(r=>r.match401k)), avgCall=avg(selRoles.map(r=>r.callDays));
  const minComp=selRoles.length?Math.min(...selRoles.map(r=>r.totalComp)):0, maxComp=selRoles.length?Math.max(...selRoles.map(r=>r.totalComp)):0;

  const roleColor={MD:N.blue,CRNA:N.teal,AA:N.navy};
  const typeColor={"Full-Time":N.green,"Locum Tenens":N.red,"Part-Time":N.teal,"Per Diem":N.amber,"1099 / Independent":N.orange};
  const typeIcon={"Full-Time":"💼","Part-Time":"🕐","Per Diem":"📅","1099 / Independent":"🧾","Locum Tenens":"✈️"};
  const settingIcon={"Academic Medical Center":"🎓","Community Hospital":"🏥","Ambulatory Surgery Center":"⚕️","Critical Access Hospital":"🚑","Private Group":"🏢","VA Medical Center":"🎖️"};

  if (!generated) return (
    <div style={{background:N.tealLt,border:`1px solid ${N.teal}30`,borderRadius:10,padding:48,textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:14}}>📋</div>
      <div style={{fontSize:22,fontWeight:700,color:N.navy,marginBottom:8,fontFamily:FF}}>Posted Roles Compensation Analyzer</div>
      <p style={{fontSize:13,color:N.gray600,maxWidth:500,margin:"0 auto 20px",lineHeight:1.8,fontFamily:FF}}>Generate a modeled sample of <strong style={{color:N.navy}}>anesthesia postings</strong> within <strong style={{color:N.teal}}>{radius} miles of {zip}</strong>, then select/deselect roles to see how comp averages shift.</p>
      <Btn onClick={generate} variant="teal" style={{fontSize:14,padding:"13px 36px"}}>📋 Generate Sample Roles</Btn>
    </div>
  );
  if (loading) return (<div style={{background:N.navyLt,borderRadius:10,padding:56,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:N.blue,fontFamily:FF}}>Generating 28 modeled listings…</div></div>);
  if (err) return (<div style={{background:N.redLt,border:`1px solid ${N.red}30`,borderRadius:8,padding:32,textAlign:"center"}}><div style={{fontSize:13,color:N.red,fontWeight:600,marginBottom:12,fontFamily:FF}}>⚠ {err}</div><Btn onClick={generate}>Try Again</Btn></div>);

  return (
    <div style={{display:"grid",gap:18}}>
      <div style={{background:N.navy,borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:N.teal,textTransform:"uppercase",letterSpacing:".1em",marginBottom:3,fontFamily:FF}}>📊 Live Comp Averages</div>
            <div style={{fontSize:18,fontWeight:700,color:N.white,fontFamily:FF}}>{selected.size} of {roles.length} roles selected</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={selectAll} style={{padding:"6px 14px",borderRadius:5,border:`1px solid rgba(255,255,255,0.2)`,background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>Select All</button>
            <button onClick={selectNone} style={{padding:"6px 14px",borderRadius:5,border:`1px solid rgba(255,255,255,0.2)`,background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>Deselect All</button>
            <button onClick={()=>selectByRole("MD")} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${N.blue}50`,background:`${N.blue}25`,color:N.teal,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>MD Only</button>
            <button onClick={()=>selectByRole("CRNA")} style={{padding:"6px 14px",borderRadius:5,border:`1px solid ${N.teal}50`,background:`${N.teal}20`,color:N.teal,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>CRNA Only</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))"}}>
          {[{l:"Avg Total Comp",v:selected.size?fmt(avgTotalComp):"—",sub:`${fmt(minComp)}–${fmt(maxComp)} range`,c:N.teal},{l:"Avg Base",v:selected.size?fmt(avgBase):"—",sub:"excl. bonus",c:N.white},{l:"Avg Bonus",v:selected.size?fmt(avgBonus):"—",sub:"performance",c:N.amber},{l:"Avg Sign-On",v:selected.size&&avgSignOn?fmt(avgSignOn):"—",sub:`${selRoles.filter(r=>r.signOn>0).length} of ${selected.size}`,c:N.orange},{l:"Avg PTO",v:selected.size?avgPto:"—",sub:"days",c:N.white},{l:"401k Match",v:selected.size?`${avg401k}%`:"—",sub:"of base",c:N.white},{l:"Avg Call",v:selected.size?avgCall:"—",sub:"days/mo",c:N.white}].map((k,i)=>(
            <div key={i} style={{padding:"16px 18px",borderRight:i<6?"1px solid rgba(255,255,255,0.06)":"none",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontFamily:FF}}>{k.l}</div>
              <div style={{fontSize:22,fontWeight:700,color:k.c||N.white,lineHeight:1,marginBottom:3,fontFamily:FF}}>{k.v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontFamily:FF}}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"14px 18px",display:"grid",gap:10}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:N.gray400,fontWeight:700,minWidth:40,fontFamily:FF}}>Role:</span>
          {["All","MD","CRNA","AA"].map(f=>(<button key={f} onClick={()=>setFilterRole(f)} style={{padding:"5px 13px",borderRadius:4,background:filterRole===f?N.navy:N.white,border:`1px solid ${filterRole===f?N.navy:N.gray200}`,color:filterRole===f?N.white:N.gray600,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>{f}</button>))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:N.gray400,fontWeight:700,minWidth:40,fontFamily:FF}}>Type:</span>
          {[{k:"Full-Time",icon:"💼",c:N.green},{k:"Part-Time",icon:"🕐",c:N.teal},{k:"Per Diem",icon:"📅",c:N.amber},{k:"1099 / Independent",icon:"🧾",c:N.orange},{k:"Locum Tenens",icon:"✈️",c:N.red}].map(({k,icon,c})=>{
            const on=filterTypes.has(k);
            return(<button key={k} onClick={()=>toggleType(k)} style={{padding:"5px 12px",borderRadius:4,background:on?`${c}18`:N.white,border:`1.5px solid ${on?c:N.gray200}`,color:on?c:N.gray400,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:on?700:500,display:"flex",gap:5,alignItems:"center"}}><span>{icon}</span>{k}</button>);
          })}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,color:N.gray400,fontWeight:700,fontFamily:FF}}>Sort:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:N.white,border:`1px solid ${N.gray200}`,borderRadius:5,padding:"5px 10px",color:N.navy,fontSize:11,fontFamily:FF}}>
              <option value="comp_desc">Comp: High → Low</option>
              <option value="comp_asc">Comp: Low → High</option>
              <option value="base_desc">Base: High → Low</option>
              <option value="dist">Distance: Nearest</option>
            </select>
          </div>
          <Btn onClick={generate} variant="ghost" style={{fontSize:11,padding:"6px 14px"}}>↻ Regenerate</Btn>
        </div>
      </div>

      <div style={{border:`1px solid ${N.gray100}`,borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,56,101,0.06)"}}>
        <div style={{display:"grid",gridTemplateColumns:"44px 1fr 80px 100px 90px 80px 80px 70px 56px",background:N.navy,padding:"10px 16px",gap:8,alignItems:"center"}}>
          {["✓","Role / Employer","Type","Total Comp","Base","Sign-On","PTO","Call/mo","Apply"].map((h,i)=>(<div key={i} style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:".07em",textAlign:i>=3?"right":"left",fontFamily:FF}}>{h}</div>))}
        </div>
        {displayRoles.map((role, i) => {
          const isSelected=selected.has(role.id), rc=roleColor[role.role]||N.gray600;
          return (
            <div key={role.id} onClick={()=>toggleRole(role.id)}
              style={{display:"grid",gridTemplateColumns:"44px 1fr 80px 100px 90px 80px 80px 70px 56px",padding:"11px 16px",gap:8,alignItems:"center",cursor:"pointer",background:isSelected?(i%2===0?N.white:N.gray50):(i%2===0?"#f8f4f0":"#f4efe8"),borderBottom:`1px solid ${N.gray100}`,borderLeft:`3px solid ${isSelected?rc:"transparent"}`,opacity:isSelected?1:0.55}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${isSelected?rc:N.gray200}`,background:isSelected?rc:N.white,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {isSelected&&<span style={{color:N.white,fontSize:12,fontWeight:700}}>✓</span>}
                </div>
              </div>
              <div>
                <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:11}}>{settingIcon[role.setting]||"🏥"}</span>
                  <Badge label={role.role} color={rc}/>
                  {role.urgent&&<Badge label="URGENT" color={N.red} bg={N.redLt}/>}
                  <span style={{fontSize:10,color:N.gray400,fontFamily:FF}}>{role.subspecialty}</span>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:isSelected?N.navy:N.gray400,fontFamily:FF}}>{role.title}</div>
                <div style={{fontSize:10,color:N.gray400,marginTop:2,fontFamily:FF}}>{role.employer} · {role.location} · {role.distanceMi}mi</div>
              </div>
              <div><span style={{fontSize:10}}>{typeIcon[role.type]||"💼"}</span><div style={{fontSize:10,fontWeight:600,color:typeColor[role.type]||N.gray400,fontFamily:FF}}>{role.type}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,color:isSelected?rc:N.gray400,fontFamily:FF}}>{fmt(role.totalComp)}</div><div style={{fontSize:9,color:N.gray400,fontFamily:FF}}>{role.salary}</div></div>
              <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:600,color:isSelected?N.gray600:N.gray400,fontFamily:FF}}>{fmt(role.base)}</span></div>
              <div style={{textAlign:"right"}}>{role.signOn>0?<span style={{fontSize:12,fontWeight:600,color:isSelected?N.orange:N.gray400,fontFamily:FF}}>{fmt(role.signOn)}</span>:<span style={{fontSize:10,color:N.gray200}}>—</span>}</div>
              <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:600,color:isSelected?N.navy:N.gray400,fontFamily:FF}}>{role.pto}d</span></div>
              <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:600,color:isSelected?N.navy:N.gray400,fontFamily:FF}}>{role.callDays}d</span></div>
              <div onClick={e=>e.stopPropagation()}>
                <a href={role.applyUrl||`https://careers.asahq.org/jobs/?keywords=anesthesiologist&location=${encodeURIComponent(role.location)}`} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                  <div style={{padding:"5px 8px",background:rc,borderRadius:4,fontSize:10,fontWeight:700,color:N.white,textAlign:"center",fontFamily:FF}}>Apply</div>
                </a>
              </div>
            </div>
          );
        })}
        {displayRoles.length===0&&<div style={{padding:32,textAlign:"center",color:N.gray400,fontSize:13,background:N.white,fontFamily:FF}}>No roles match current filters.</div>}
      </div>

      <div style={{background:N.redLt,border:`1px solid ${N.red}20`,borderRadius:6,padding:"10px 14px",display:"flex",gap:10}}>
        <span style={{fontSize:13}}>⚠️</span>
        <p style={{fontSize:11,color:N.gray600,margin:0,lineHeight:1.6,fontFamily:FF}}>AI-modeled postings calibrated to local market data — not verified live listings. Use the <strong>🔍 Live Postings</strong> tab for real Indeed jobs.</p>
      </div>
    </div>
  );
}

// ── Comp Wizard Modal ─────────────────────────────────────────────────────────
function CompWizard({ wf, zip, locLabel, onClose, onSubmit }) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({
    mdBase: wf.mdBase, mdBonus: wf.mdBonus, mdBenefits: wf.mdBenefits,
    mdSignOn: wf.mdSignOn, mdPtoDays: wf.mdPtoDays, md401kMatch: wf.md401kMatch,
    mdCME: wf.mdCME, mdMalpractice: wf.mdMalpractice,
    crnaBase: wf.crnaBase, crnaBonus: wf.crnaBonus, crnaBenefits: wf.crnaBenefits,
    crnaSignOn: wf.crnaSignOn, crnaPtoDays: wf.crnaPtoDays, crna401kMatch: wf.crna401kMatch,
    crnaCME: wf.crnaCME, crnaMalpractice: wf.crnaMalpractice,
    shortage: wf.shortage, col: wf.col,
  });
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setVals(prev => ({ ...prev, [k]: v }));

  const numInput = (k, label, prefix="$", min=0, stepV=1000) => (
    <div style={{ display: "grid", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: N.gray600, fontFamily: FF }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:N.gray400, pointerEvents:"none" }}>{prefix}</span>}
        <input type="number" value={vals[k]} min={min} step={stepV}
          onChange={e => set(k, Number(e.target.value))}
          style={{ width:"100%", padding:`8px 10px 8px ${prefix?"26px":"10px"}`, border:`1.5px solid ${N.gray200}`, borderRadius:6, fontSize:13, fontWeight:600, color:N.navy, fontFamily:FF, background:N.white }} />
      </div>
    </div>
  );

  const steps = [
    {
      title: "Anesthesiologist (MD/DO) Compensation", icon: "👨‍⚕️", color: N.blue,
      content: (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {numInput("mdBase","Base Salary","$",200000,5000)}
          {numInput("mdBonus","Performance Bonus","$",0,1000)}
          {numInput("mdBenefits","Benefits Value","$",0,1000)}
          {numInput("mdSignOn","Sign-On Bonus","$",0,1000)}
          {numInput("mdCME","CME Stipend","$",0,500)}
          {numInput("mdMalpractice","Malpractice Coverage","$",0,1000)}
          {numInput("mdPtoDays","PTO Days","",10,1)}
          {numInput("md401kMatch","401k Match %","",0,0.5)}
        </div>
      ),
    },
    {
      title: "CRNA Compensation", icon: "💉", color: N.teal,
      content: (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {numInput("crnaBase","Base Salary","$",150000,5000)}
          {numInput("crnaBonus","Performance Bonus","$",0,1000)}
          {numInput("crnaBenefits","Benefits Value","$",0,1000)}
          {numInput("crnaSignOn","Sign-On Bonus","$",0,1000)}
          {numInput("crnaCME","CME Stipend","$",0,500)}
          {numInput("crnaMalpractice","Malpractice Coverage","$",0,500)}
          {numInput("crnaPtoDays","PTO Days","",10,1)}
          {numInput("crna401kMatch","401k Match %","",0,0.5)}
        </div>
      ),
    },
    {
      title: "Market Parameters", icon: "📊", color: N.amber,
      content: (
        <div style={{ display:"grid", gap:14 }}>
          <div style={{ display:"grid", gap:4 }}>
            <label style={{ fontSize:11, fontWeight:600, color:N.gray600, fontFamily:FF }}>Workforce Shortage Level</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[["low","✅ Well Supplied",N.green],["moderate","📊 Moderate",N.amber],["high","⚠️ High Demand",N.orange],["critical","🚨 Critical",N.red]].map(([v,l,c])=>(
                <button key={v} onClick={()=>set("shortage",v)} style={{ padding:"8px 14px", borderRadius:6, background:vals.shortage===v?c:`${c}12`, border:`1.5px solid ${vals.shortage===v?c:`${c}30`}`, color:vals.shortage===v?N.white:c, fontSize:11, fontWeight:700, fontFamily:FF, cursor:"pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gap:4 }}>
            <label style={{ fontSize:11, fontWeight:600, color:N.gray600, fontFamily:FF }}>Cost of Living Index <span style={{ color:N.gray400, fontWeight:400 }}>(100 = US avg)</span></label>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <input type="range" min={60} max={200} step={1} value={vals.col} onChange={e=>set("col",Number(e.target.value))} style={{ flex:1, accentColor:N.teal }} />
              <div style={{ background:N.navy, color:N.white, borderRadius:6, padding:"6px 14px", fontSize:16, fontWeight:700, minWidth:52, textAlign:"center", fontFamily:FF }}>{vals.col}</div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:N.gray400, fontFamily:FF }}>
              <span>60 — Rural/Low CoL</span><span>100 — National Avg</span><span>200 — NYC/SF</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Review & Submit", icon: "✅", color: N.green,
      content: (
        <div style={{ display:"grid", gap:12 }}>
          {[
            { label:"Anesthesiologist MD/DO", color:N.blue, rows:[
              ["Base",fmt(vals.mdBase)],["Bonus",fmt(vals.mdBonus)],["Benefits",fmt(vals.mdBenefits)],
              ["Total Comp",fmt(vals.mdBase+vals.mdBonus+vals.mdBenefits),"bold"],
              ["Sign-On",fmt(vals.mdSignOn)],["CME",fmt(vals.mdCME)],["PTO",`${vals.mdPtoDays}d`],["401k",`${vals.md401kMatch}%`],
            ]},
            { label:"CRNA", color:N.teal, rows:[
              ["Base",fmt(vals.crnaBase)],["Bonus",fmt(vals.crnaBonus)],["Benefits",fmt(vals.crnaBenefits)],
              ["Total Comp",fmt(vals.crnaBase+vals.crnaBonus+vals.crnaBenefits),"bold"],
              ["Sign-On",fmt(vals.crnaSignOn)],["CME",fmt(vals.crnaCME)],["PTO",`${vals.crnaPtoDays}d`],["401k",`${vals.crna401kMatch}%`],
            ]},
          ].map((g,i)=>(
            <div key={i} style={{ background:N.white, border:`1px solid ${N.gray100}`, borderRadius:8, overflow:"hidden" }}>
              <div style={{ background:g.color, padding:"8px 14px", fontSize:11, fontWeight:700, color:N.white, fontFamily:FF }}>{g.label}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:0 }}>
                {g.rows.map(([l,v,b],j)=>(
                  <div key={j} style={{ padding:"8px 12px", borderRight:j%4!==3?`1px solid ${N.gray100}`:"none", borderBottom:j<g.rows.length-4?`1px solid ${N.gray100}`:"none", background:b?"#f0f8ff":N.white }}>
                    <div style={{ fontSize:9, color:N.gray400, fontWeight:600, textTransform:"uppercase", letterSpacing:".07em", marginBottom:2, fontFamily:FF }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:b?700:600, color:b?g.color:N.navy, fontFamily:FF }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ background:N.navyLt, border:`1px solid ${N.gray100}`, borderRadius:8, padding:"12px 16px", display:"flex", gap:12, justifyContent:"space-between", flexWrap:"wrap" }}>
            <div style={{fontFamily:FF}}><span style={{ fontSize:11, color:N.gray600 }}>Shortage: </span><strong style={{ color:shortageColor[vals.shortage] }}>{shortageLabel[vals.shortage]}</strong></div>
            <div style={{fontFamily:FF}}><span style={{ fontSize:11, color:N.gray600 }}>CoL Index: </span><strong style={{ color:N.navy }}>{vals.col}</strong></div>
          </div>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    const newWf = { ...wf, ...vals, mdComp: vals.mdBase+vals.mdBonus+vals.mdBenefits, crnaComp: vals.crnaBase+vals.crnaBonus+vals.crnaBenefits,
      mdNatDiff: (((vals.mdBase+vals.mdBonus+vals.mdBenefits-443000)/443000)*100).toFixed(1),
      crnaNatDiff: (((vals.crnaBase+vals.crnaBonus+vals.crnaBenefits-228000)/228000)*100).toFixed(1) };
    setSubmitted(true);
    setTimeout(() => { onSubmit(newWf); onClose(); }, 900);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,15,40,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:N.white, borderRadius:14, width:"100%", maxWidth:620, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:N.navy, padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:N.teal, textTransform:"uppercase", letterSpacing:".1em", marginBottom:2, fontFamily:FF }}>🧙 Comp Wizard</div>
            <div style={{ fontSize:16, fontWeight:700, color:N.white, fontFamily:FF }}>{locLabel} · ZIP {zip}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:6, padding:"6px 10px", color:"rgba(255,255,255,0.6)", fontSize:16, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ display:"flex", borderBottom:`1px solid ${N.gray100}` }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{ flex:1, padding:"10px 6px", background:step===i?`${s.color}10`:N.white, border:"none", borderBottom:`2px solid ${step===i?s.color:"transparent"}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ fontSize:9, fontWeight:700, color:step===i?s.color:N.gray400, textAlign:"center", lineHeight:1.2, fontFamily:FF }}>{s.title.split(" ").slice(0,2).join(" ")}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:N.navy, marginBottom:14, display:"flex", gap:8, alignItems:"center", fontFamily:FF }}>
            <span style={{ fontSize:18 }}>{steps[step].icon}</span>{steps[step].title}
          </div>
          {steps[step].content}
        </div>
        <div style={{ padding:"14px 24px", borderTop:`1px solid ${N.gray100}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:N.gray50 }}>
          <Btn onClick={() => setStep(s => Math.max(0, s-1))} variant="ghost" style={{ visibility:step===0?"hidden":"visible" }}>← Back</Btn>
          <div style={{ display:"flex", gap:6 }}>
            {steps.map((_,i) => <div key={i} style={{ width:6, height:6, borderRadius:3, background:i===step?N.blue:N.gray200 }}/>)}
          </div>
          {step < steps.length-1
            ? <Btn onClick={() => setStep(s => s+1)}>Next →</Btn>
            : <Btn onClick={handleSubmit} variant="teal" style={{ background:submitted?N.green:undefined }}>{submitted?"✓ Applied!":"✅ Apply Changes"}</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ── PDF Export via html2canvas screenshot ────────────────────────────────────
function ExportPDFModal({ onClose }) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [imgData, setImgData] = useState(null);
  const previewRef = useRef(null);

  const capture = async () => {
    setStatus("loading");
    try {
      // Load html2canvas from CDN if not already loaded
      if (!window.html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      // Find the main scrollable content div (the app root)
      const target = document.querySelector("#gasgauge-root") || document.body;
      const canvas = await window.html2canvas(target, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#F0F4F8",
        logging: false,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
        scrollX: 0, scrollY: 0,
        x: 0, y: 0,
        width: target.scrollWidth,
        height: target.scrollHeight,
      });
      setImgData(canvas.toDataURL("image/png", 0.95));
      setStatus("ready");
    } catch(e) {
      console.error(e);
      setStatus("error");
    }
  };

  const downloadPDF = () => {
    if (!window.jspdf && !window.jsPDF) {
      // Load jsPDF then download
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = () => doDownload();
      document.head.appendChild(s);
    } else {
      doDownload();
    }
  };

  const doDownload = () => {
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF || !imgData) return;
    const img = new Image();
    img.onload = () => {
      const pw = 210, ph = 297; // A4 mm
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const ratio = pw / iw;
      const docH = ih * ratio;
      const orientation = docH > ph ? "p" : "l";
      const pdf = new jsPDF({ orientation, unit:"mm", format:"a4" });
      // Tile image across pages if taller than one A4
      let yOffset = 0;
      const pageH = ph;
      while (yOffset < docH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pw, docH);
        yOffset += pageH;
      }
      pdf.save(`NAPA-GasGauge-Summary.pdf`);
    };
    img.src = imgData;
  };

  const printPreview = () => {
    if (!imgData) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to print."); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>NAPA GasGauge — Print Preview</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#888;display:flex;flex-direction:column;align-items:center;padding:20px;gap:12px}
.toolbar{background:#fff;border-radius:8px;padding:10px 20px;display:flex;gap:12px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);position:sticky;top:0;z-index:10}
button{padding:8px 18px;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-weight:700}
.print-btn{background:#003865;color:#fff}.close-btn{background:#E2E8F0;color:#1E293B}
img{max-width:210mm;width:100%;box-shadow:0 4px 20px rgba(0,0,0,0.4);background:#fff}
@media print{.toolbar{display:none}body{background:#fff;padding:0}img{box-shadow:none;width:100%;max-width:100%}}</style>
</head><body>
<div class="toolbar">
  <strong style="color:#003865;font-size:14px">NAPA GasGauge — Print Preview</strong>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
  <button class="close-btn" onclick="window.close()">✕ Close</button>
</div>
<img src="${imgData}" alt="GasGauge Summary"/>
</body></html>`);
    win.document.close();
  };

  useEffect(() => { capture(); }, []);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,15,40,0.8)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:N.white,borderRadius:14,width:"100%",maxWidth:560,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{background:N.navy,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:N.teal,textTransform:"uppercase",letterSpacing:".1em",marginBottom:2,fontFamily:FF}}>📄 Export</div>
            <div style={{fontSize:15,fontWeight:700,color:N.white,fontFamily:FF}}>PDF / Print Preview</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:6,padding:"6px 10px",color:"rgba(255,255,255,0.6)",fontSize:16,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{padding:24}}>
          {status==="loading" && (
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:36,marginBottom:12}}>📸</div>
              <div style={{fontSize:14,fontWeight:700,color:N.navy,marginBottom:6,fontFamily:FF}}>Capturing page screenshot…</div>
              <div style={{fontSize:12,color:N.gray400,fontFamily:FF}}>This takes a few seconds</div>
            </div>
          )}

          {status==="error" && (
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>⚠️</div>
              <div style={{fontSize:13,fontWeight:600,color:N.red,marginBottom:12,fontFamily:FF}}>Screenshot capture failed</div>
              <div style={{fontSize:12,color:N.gray600,marginBottom:16,fontFamily:FF}}>Your browser may restrict canvas captures in iframes. Use the print option below instead.</div>
              <Btn onClick={onClose}>Close</Btn>
            </div>
          )}

          {status==="ready" && imgData && (
            <div>
              {/* Thumbnail preview */}
              <div style={{border:`2px solid ${N.gray100}`,borderRadius:8,overflow:"hidden",marginBottom:16,maxHeight:280,overflowY:"auto",background:"#888",padding:8}}>
                <img src={imgData} alt="Page preview" style={{width:"100%",borderRadius:4,boxShadow:"0 2px 12px rgba(0,0,0,0.3)",display:"block"}}/>
              </div>
              <div style={{fontSize:11,color:N.gray400,marginBottom:16,textAlign:"center",fontFamily:FF}}>Scroll to preview full page · Use Print Preview for best results</div>

              {/* Action buttons */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={printPreview} style={{padding:"12px",borderRadius:8,background:N.navy,border:"none",color:N.white,fontSize:13,fontWeight:700,fontFamily:FF,cursor:"pointer",display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}>
                  🖨 Open Print Preview
                </button>
                <button onClick={downloadPDF} style={{padding:"12px",borderRadius:8,background:N.teal,border:"none",color:N.white,fontSize:13,fontWeight:700,fontFamily:FF,cursor:"pointer",display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}>
                  ⬇ Download PDF
                </button>
              </div>
              <div style={{marginTop:10,fontSize:10,color:N.gray400,textAlign:"center",fontFamily:FF}}>
                Print Preview → browser print dialog → "Save as PDF" · Or download directly
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overview / NAPA Compare ──────────────────────────────────────────────────
function OverviewCompare({wf, r, locLabel, onTabChange, onOpenWizard, onExport}){
  const napaPremium=wf.shortage==="critical"?0.12:wf.shortage==="high"?0.09:wf.shortage==="moderate"?0.07:0.05;
  const rows=[
    {role:"Anesthesiologist (MD/DO)",short:"MD",mktTotal:wf.mdComp,mktBase:wf.mdBase,mktBonus:wf.mdBonus,mktSignOn:wf.mdSignOn,mktPto:wf.mdPtoDays,mkt401k:wf.md401kMatch,mktCME:wf.mdCME,mktMalp:wf.mdMalpractice,napaTotal:Math.round(wf.mdComp*(1+napaPremium)),napaBase:Math.round(wf.mdBase*(1+napaPremium)),napaBonus:Math.round(wf.mdBonus*(1+napaPremium*0.6)),napaSignOn:Math.round(wf.mdSignOn*1.15),napaPto:wf.mdPtoDays+2,napa401k:wf.md401kMatch+1,napaCME:Math.round(wf.mdCME*1.1),napaMalp:Math.round(wf.mdMalpractice*1.05),natAvg:443000,color:N.blue},
    {role:"CRNA",short:"CRNA",mktTotal:wf.crnaComp,mktBase:wf.crnaBase,mktBonus:wf.crnaBonus,mktSignOn:wf.crnaSignOn,mktPto:wf.crnaPtoDays,mkt401k:wf.crna401kMatch,mktCME:wf.crnaCME,mktMalp:wf.crnaMalpractice,napaTotal:Math.round(wf.crnaComp*(1+napaPremium)),napaBase:Math.round(wf.crnaBase*(1+napaPremium)),napaBonus:Math.round(wf.crnaBonus*(1+napaPremium*0.6)),napaSignOn:Math.round(wf.crnaSignOn*1.15),napaPto:wf.crnaPtoDays+2,napa401k:wf.crna401kMatch+1,napaCME:Math.round(wf.crnaCME*1.1),napaMalp:Math.round(wf.crnaMalpractice*1.05),natAvg:228000,color:N.teal},
  ];
  const chartData=rows.flatMap(r=>[{name:`${r.short} Market`,total:r.mktTotal,fill:r.color+"99"},{name:`${r.short} NAPA`,total:r.napaTotal,fill:r.color},{name:`${r.short} National`,total:r.natAvg,fill:N.gray200}]);
  return(
    <div style={{display:"grid",gap:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div><div style={{fontSize:14,fontWeight:700,color:N.navy,fontFamily:FF}}>⚖️ Market vs NAPA vs National</div><div style={{fontSize:11,color:N.gray400,marginTop:2,fontFamily:FF}}>How local comp stacks up</div></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={onExport} style={{padding:"7px 14px",borderRadius:6,background:N.white,border:`1px solid ${N.gray200}`,color:N.navy,fontSize:12,fontFamily:FF,cursor:"pointer",fontWeight:700,display:"flex",gap:5,alignItems:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>📄 Export PDF</button>
            <button onClick={onOpenWizard} style={{padding:"7px 16px",borderRadius:6,background:`linear-gradient(135deg,${N.blue},${N.teal})`,border:"none",color:N.white,fontSize:12,fontFamily:FF,cursor:"pointer",fontWeight:700,display:"flex",gap:6,alignItems:"center"}}>🧙 Wizard</button>
            <button onClick={()=>onTabChange("live")} style={{padding:"6px 14px",borderRadius:5,background:N.tealLt,border:`1px solid ${N.teal}40`,color:N.teal,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>🔍 Live Postings →</button>
          </div>
        </div>
      <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"16px 18px"}}>
        <div style={{fontSize:12,fontWeight:700,color:N.navy,marginBottom:12,fontFamily:FF}}>Total Compensation Comparison</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={N.gray50}/>
            <XAxis dataKey="name" tick={{fill:N.gray400,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v=>`${v/1000}K`} tick={{fill:N.gray400,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="total" name="Total Comp" radius={[4,4,0,0]}>
              {chartData.map((entry,i)=><rect key={i} fill={entry.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {rows.map(row=>{
        const diff=row.napaTotal-row.mktTotal, pct=((diff/row.mktTotal)*100).toFixed(1), vsNat=((row.mktTotal-row.natAvg)/row.natAvg*100).toFixed(1);
        return(
          <div key={row.short} style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:N.navy}}>
              <div style={{padding:"11px 16px",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",fontFamily:FF}}><span style={{color:row.color,marginRight:6}}>●</span>{row.role}</div>
              <div style={{padding:"11px 16px",borderLeft:"1px solid rgba(255,255,255,0.08)",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textAlign:"center",fontFamily:FF}}>Local Market</div>
              <div style={{padding:"11px 16px",borderLeft:"1px solid rgba(255,255,255,0.08)",fontSize:11,fontWeight:700,color:N.teal,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:FF}}>⚕️ NAPA Est.<span style={{fontSize:10,fontWeight:600,color:diff>=0?N.green:N.red,background:"rgba(255,255,255,0.1)",padding:"1px 6px",borderRadius:3}}>{diff>=0?"+":""}{pct}%</span></div>
            </div>
            {[{l:"Total Comp",mkt:row.mktTotal,napa:row.napaTotal,bold:true},{l:"Base Salary",mkt:row.mktBase,napa:row.napaBase},{l:"Bonus",mkt:row.mktBonus,napa:row.napaBonus},{l:"Sign-On",mkt:row.mktSignOn,napa:row.napaSignOn},{l:"CME",mkt:row.mktCME,napa:row.napaCME},{l:"PTO Days",mkt:row.mktPto,napa:row.napaPto,isDay:true},{l:"401k Match",mkt:row.mkt401k,napa:row.napa401k,isPct:true}].map((item,i)=>{
              const d=item.napa-item.mkt, fmtVal=v=>item.isDay?`${v}d`:item.isPct?`${v}%`:fmt(v);
              return(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${N.gray50}`,background:i%2===0?N.white:N.gray50}}>
                <div style={{padding:"10px 16px",fontSize:item.bold?13:12,fontWeight:item.bold?700:500,color:item.bold?N.navy:N.gray600,fontFamily:FF}}>{item.l}</div>
                <div style={{padding:"10px 16px",borderLeft:`1px solid ${N.gray100}`,textAlign:"center",fontSize:item.bold?15:12,fontWeight:item.bold?700:500,color:item.bold?N.navy:N.gray600,fontFamily:FF}}>{fmtVal(item.mkt)}</div>
                <div style={{padding:"10px 16px",borderLeft:`1px solid ${N.gray100}`,textAlign:"center",display:"flex",justifyContent:"center",alignItems:"center",gap:6}}>
                  <span style={{fontSize:item.bold?15:12,fontWeight:item.bold?700:600,color:item.bold?N.teal:N.gray600,fontFamily:FF}}>{fmtVal(item.napa)}</span>
                  {d>0&&<span style={{fontSize:9,fontWeight:700,color:N.green,background:N.greenLt,padding:"1px 5px",borderRadius:3,fontFamily:FF}}>+{item.isDay?d+"d":item.isPct?d+"%":fmt(d)}</span>}
                </div>
              </div>);
            })}
            <div style={{padding:"8px 16px",background:N.navyLt,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
              <span style={{fontSize:11,color:N.gray600,fontFamily:FF}}>vs national avg <strong style={{color:N.navy}}>{fmt(row.natAvg)}</strong>: <span style={{color:parseFloat(vsNat)>=0?N.green:N.red,fontWeight:700}}>{parseFloat(vsNat)>=0?"+":""}{vsNat}%</span></span>
              <a href="https://www.napa.com/careers" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}><div style={{padding:"4px 12px",background:N.teal,borderRadius:4,fontSize:10,fontWeight:700,color:N.white,fontFamily:FF}}>Apply at NAPA →</div></a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── AI Analysis Tab ───────────────────────────────────────────────────────────
function AIAnalysisTab({locLabel,wf,radius,zip}){
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");
  const run=async()=>{
    setLoading(true);setErr("");setResult(null);
    const prompt=`Healthcare workforce strategist. Analyze this anesthesia market. Return ONLY JSON, no markdown.
Center ZIP: ${zip} (${locLabel}), Radius: ${radius} miles
MD Total Comp: $${wf.mdComp}, CRNA Total Comp: $${wf.crnaComp}, Cost of Living Index: ${wf.col}, Shortage: ${wf.shortage}
Return: {"marketSummary":"3 sentences","compPressure":"2-3 sentences","talentFlow":"2-3 sentences","hotSpots":["trend 1","trend 2","trend 3"],"recruitStrategies":["strategy 1","strategy 2","strategy 3"],"watchOut":"1-2 sentences","outlook":"1 sentence 3-year forecast"}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      setResult(JSON.parse(d.content.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim()));
    }catch(e){setErr("Analysis failed.");}
    finally{setLoading(false);}
  };
  if(!result&&!loading) return(<div style={{background:N.navyLt,border:`1px solid ${N.gray100}`,borderRadius:8,padding:40,textAlign:"center"}}><div style={{fontSize:38,marginBottom:12}}>🧠</div><div style={{fontSize:20,fontWeight:700,color:N.navy,marginBottom:8,fontFamily:FF}}>Regional AI Intelligence</div><p style={{fontSize:13,color:N.gray600,maxWidth:420,margin:"0 auto 20px",lineHeight:1.7,fontFamily:FF}}>Strategic workforce analysis for <strong style={{color:N.blue}}>{radius} miles around {zip}</strong>.</p>{err&&<div style={{fontSize:12,color:N.red,marginBottom:14,fontFamily:FF}}>{err}</div>}<Btn onClick={run} variant="teal">Analyze This Market</Btn></div>);
  if(loading) return(<div style={{background:N.navyLt,borderRadius:8,padding:48,textAlign:"center"}}><div style={{fontSize:14,fontWeight:600,color:N.blue,fontFamily:FF}}>Analyzing {radius}-mile market…</div></div>);
  return(
    <div style={{display:"grid",gap:14}}>
      <div style={{background:N.navy,borderRadius:8,padding:20,color:N.white}}><div style={{fontSize:10,fontWeight:700,color:N.teal,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6,fontFamily:FF}}>3-Year Outlook</div><p style={{fontSize:16,fontWeight:600,lineHeight:1.5,margin:0,fontFamily:FF}}>{result.outlook}</p></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[{k:"marketSummary",l:"Market Summary",icon:"🗺️",c:N.blue},{k:"compPressure",l:"Comp Pressure",icon:"💹",c:N.teal},{k:"talentFlow",l:"Talent Flow",icon:"🔄",c:N.navy},{k:"watchOut",l:"Key Risk",icon:"⚠️",c:N.red}].map(item=>(
          <div key={item.k} style={{background:N.white,border:`1px solid ${N.gray100}`,borderLeft:`4px solid ${item.c}`,borderRadius:"0 8px 8px 0",padding:16}}><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}><span style={{fontSize:14}}>{item.icon}</span><span style={{fontSize:10,fontWeight:700,color:item.c,textTransform:"uppercase",letterSpacing:".08em",fontFamily:FF}}>{item.l}</span></div><p style={{fontSize:13,color:N.gray600,lineHeight:1.7,margin:0,fontFamily:FF}}>{result[item.k]}</p></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[{k:"hotSpots",l:"Hot Spots",icon:"🎯",c:N.teal},{k:"recruitStrategies",l:"Strategies",icon:"📋",c:N.blue}].map(item=>(
          <div key={item.k} style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:16}}><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:10}}><span style={{fontSize:14}}>{item.icon}</span><span style={{fontSize:10,fontWeight:700,color:item.c,textTransform:"uppercase",letterSpacing:".08em",fontFamily:FF}}>{item.l}</span></div>{(result[item.k]||[]).map((t,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}><span style={{color:item.c,fontWeight:700,fontSize:13,flexShrink:0}}>›</span><span style={{fontSize:13,color:N.gray600,lineHeight:1.6,fontFamily:FF}}>{t}</span></div>))}</div>
        ))}
      </div>
      <Btn onClick={run} variant="ghost" style={{width:"fit-content",fontSize:12}}>↻ Regenerate</Btn>
    </div>
  );
}

// ── Job Boards Tab ────────────────────────────────────────────────────────────
const jobBoards=[
  {id:"asa",name:"ASA Career Center",role:"MD",icon:"🏥",color:N.blue,url:(loc)=>`https://careers.asahq.org/jobs/?keywords=anesthesiologist&location=${encodeURIComponent(loc)}`,features:["Salary data","Subspecialty filters","Academic vs private"]},
  {id:"aana",name:"AANA MOTION Platform",role:"CRNA",icon:"💉",color:N.teal,url:()=>`https://www.aana.com/motion-crna-career-platform/`,features:["Map-based search","Salary benchmarks","No-call positions"]},
  {id:"bagmask",name:"BagMask Job Board",role:"MD + CRNA",icon:"🫁",color:N.amber,url:(loc)=>`https://bagmask.com/jobs/?location=${encodeURIComponent(loc)}`,features:["Locum tenens","Rural postings","Salary filters"]},
  {id:"nejm",name:"NEJM Career Center",role:"MD",icon:"📋",color:N.navy,url:(loc)=>`https://www.nejmcareercenter.org/jobs/anesthesiology/?location=${encodeURIComponent(loc)}`,features:["Academic roles","Research positions"]},
  {id:"indeed",name:"Indeed Anesthesia",role:"MD + CRNA",icon:"🔍",color:N.gray600,url:(loc,z)=>`https://www.indeed.com/jobs?q=anesthesiologist+CRNA&l=${encodeURIComponent(loc+' '+z)}`,features:["Live listings","Easy apply","Salary estimates"]},
];
function JobsTab({locLabel,radius,zip}){
  return(
    <div style={{display:"grid",gap:14}}>
      <div style={{background:N.navyLt,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
        <span style={{fontSize:20}}>📍</span>
        <div><div style={{fontSize:13,fontWeight:700,color:N.navy,fontFamily:FF}}>Searching near {locLabel}</div><div style={{fontSize:12,color:N.gray600,fontFamily:FF}}>All links pre-filtered for your {radius}-mile radius around ZIP {zip}</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {jobBoards.map(b=>(
          <a key={b.id} href={b.url(`${locLabel} ${zip}`,zip)} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
            <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"18px 20px",borderLeft:`4px solid ${b.color}`,boxShadow:"0 1px 4px rgba(0,56,101,0.06)",height:"100%"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:20}}>{b.icon}</span><div style={{fontSize:14,fontWeight:700,color:N.navy,fontFamily:FF}}>{b.name}</div></div>
                <Badge label={b.role} color={b.color}/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>{b.features.map((f,i)=>(<span key={i} style={{padding:"2px 7px",borderRadius:3,background:N.gray50,border:`1px solid ${N.gray100}`,fontSize:11,color:N.gray600,fontFamily:FF}}>{f}</span>))}</div>
              <div style={{fontSize:12,fontWeight:600,color:b.color,fontFamily:FF}}>Search near {zip} →</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Map Tab ───────────────────────────────────────────────────────────────────
function MapTab({geo,zip,radius,locLabel}){
  const mapRef=useRef(null), mapObj=useRef(null);
  const [mapReady,setMapReady]=useState(false);
  const [hospitals,setHospitals]=useState([]);
  const [loadingH,setLoadingH]=useState(false);
  const radiusM=radius*1609.34;

  useEffect(()=>{
    if(window.L){setMapReady(true);return;}
    const link=document.createElement("link");link.rel="stylesheet";link.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(link);
    const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";s.onload=()=>setMapReady(true);document.head.appendChild(s);
  },[]);

  useEffect(()=>{
    if(!mapReady||!mapRef.current||mapObj.current)return;
    const L=window.L;
    const m=L.map(mapRef.current,{zoomControl:true}).setView([geo.lat,geo.lng],radius<=10?12:radius<=25?10:radius<=50?9:8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; OpenStreetMap',maxZoom:19}).addTo(m);
    mapObj.current=m;
    const ci=L.divIcon({className:"",html:`<div style="width:32px;height:32px;background:${N.navy};border:3px solid ${N.teal};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;height:100%;font-size:13px">📮</div></div>`,iconSize:[32,32],iconAnchor:[16,32]});
    L.marker([geo.lat,geo.lng],{icon:ci}).addTo(m).bindPopup(`<b>ZIP ${zip}</b><br>${locLabel}`);
    L.circle([geo.lat,geo.lng],{radius:radiusM,color:N.teal,fillColor:N.teal,fillOpacity:0.07,weight:2,dashArray:"6 4"}).addTo(m);
  },[mapReady]);

  useEffect(()=>{
    if(!mapReady||!mapObj.current||!hospitals.length)return;
    const L=window.L,m=mapObj.current;
    hospitals.forEach(h=>{
      const icon=L.divIcon({className:"",html:`<div style="background:${N.blue};color:white;border-radius:4px;padding:3px 7px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25)">🏥 ${h.role||"Anesthesia"}</div>`,iconAnchor:[24,10]});
      L.marker([h.lat,h.lng],{icon}).addTo(m).bindPopup(`<b>${h.name}</b><br><span style="font-size:11px;color:#666">${h.city}</span>`);
    });
  },[mapReady,hospitals]);

  const fetchFacilities=async()=>{
    setLoadingH(true);
    const prompt=`List 8 real hospitals near lat=${geo.lat.toFixed(3)}, lng=${geo.lng.toFixed(3)} (ZIP ${zip}) within ${radius} miles. Return ONLY JSON array:
[{"name":"...","city":"City, ST","lat":NUMBER,"lng":NUMBER,"role":"MD"}]`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      const text=d.content.map(c=>c.text||"").join("");
      const s=text.indexOf("["),e=text.lastIndexOf("]");
      if(s>-1&&e>-1) setHospitals(JSON.parse(text.slice(s,e+1)));
    }catch(e){console.error(e);}finally{setLoadingH(false);}
  };

  return(
    <div style={{display:"grid",gap:14}}>
      <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:13,fontWeight:700,color:N.navy,fontFamily:FF}}>📍 {locLabel} · ZIP {zip}</div><div style={{fontSize:11,color:N.gray400,fontFamily:FF}}>{radius}-mile radius</div></div>
        <Btn onClick={fetchFacilities} disabled={loadingH} variant="teal" style={{fontSize:11,padding:"6px 14px"}}>{loadingH?"Loading…":"🏥 Load Nearby Facilities"}</Btn>
      </div>
      {!mapReady&&<div style={{height:460,background:N.navyLt,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:13,color:N.gray400,fontFamily:FF}}>Loading map…</div></div>}
      <div ref={mapRef} style={{height:460,borderRadius:8,border:`1px solid ${N.gray200}`,overflow:"hidden",display:mapReady?"block":"none",boxShadow:"0 2px 8px rgba(0,56,101,0.10)"}}/>
    </div>
  );
}

// ── Data Sources Tab ──────────────────────────────────────────────────────────
function MethodologyTab(){
  const [expanded, setExpanded] = useState(null);
  const toggle = (i) => setExpanded(expanded === i ? null : i);

  const sources=[
    {
      name:"U.S. Bureau of Labor Statistics — OEWS", type:"Federal Dataset", icon:"🏛️", color:N.navy,
      url:"https://www.bls.gov/oes/", updateFreq:"Annual (May release)", lag:"12–18 months",
      coverage:"~1.1M establishments, 560M+ data points",
      fields:["Mean/median wage by SOC code","10th–90th percentile wage bands","State & MSA-level breakdowns","Industry cross-tab (NAICS)"],
      howUsed:"Base salary floors and national percentile anchors. Anesthesiologists = SOC 29-1211 · CRNAs = SOC 29-1151. State-level OES data localize the regional wage curve.",
      limitations:"Excludes bonuses, benefits, sign-on. Self-employed/owner-physician wages may be underreported. 12–18 mo publication lag.",
    },
    {
      name:"MGMA Physician Compensation & Production Report", type:"Industry Survey", icon:"📋", color:N.blue,
      url:"https://www.mgma.com/data/benchmarking-data/mgma-datadive", updateFreq:"Annual", lag:"6–12 months",
      coverage:"~165,000 providers · 6,000+ medical groups",
      fields:["Total cash compensation (TCC)","wRVU production & conversion factors","Base + incentive split","Benefits as % of TCC","Call pay rates"],
      howUsed:"Primary driver of MD/DO total-comp estimates and base-vs-bonus splits. Regional quartile data informs the geographic adjustment applied per latitude/longitude cluster.",
      limitations:"Subscription-gated; figures here modeled from published summaries. Skews toward group practices; independent physicians may differ.",
    },
    {
      name:"AANA Practice & Salary Survey", type:"Association Survey", icon:"💉", color:N.teal,
      url:"https://www.aana.com/practice/practice-management/compensation", updateFreq:"Biennial (odd years)", lag:"6–12 months",
      coverage:"~8,000 CRNA members (≈18% of US CRNAs)",
      fields:["Annual base & total comp","Call pay (hourly & flat rate)","Sign-on bonus prevalence & amount","401k match %","CME stipend","PTO days","Practice setting distribution"],
      howUsed:"Sole primary source for CRNA-specific compensation benchmarks. Setting filters (ACT vs. CRNA-only) calibrate the model to supervision model in the searched area.",
      limitations:"Self-reported; participation voluntary. Biennial cadence means odd-year releases; interpolated for even years.",
    },
    {
      name:"ASA Anesthesiology Practice Survey", type:"Association Survey", icon:"🏥", color:"#4f46e5",
      url:"https://www.asahq.org/about-asa/newsroom/news-releases", updateFreq:"Annual", lag:"6–12 months",
      coverage:"~5,000 ASA member respondents",
      fields:["MD/DO median total comp by subspecialty","Academic vs private group differentials","Benefits package components","Malpractice coverage amounts","Partnership track timelines"],
      howUsed:"Subspecialty premium calibration (cardiac +18%, pediatric +12%, pain +9%, neuro +7% vs general). Academic vs. private setting discount/premium factors.",
      limitations:"Member survey; non-members not captured. Academic centers may be overrepresented.",
    },
    {
      name:"C2ER Cost of Living Index (COLI)", type:"Economic Index", icon:"📊", color:N.amber,
      url:"https://www.coli.org/", updateFreq:"Quarterly", lag:"1–3 months",
      coverage:"300+ urban areas across all 50 states",
      fields:["Composite COLI (100 = US avg)","Housing sub-index","Grocery sub-index","Utilities sub-index","Transportation sub-index","Healthcare sub-index"],
      howUsed:"Geographic wage adjustment multiplier. Composite COLI applied to national benchmarks to localize total comp. Also displayed as standalone market indicator in the results header.",
      limitations:"Urban-centric; rural ZIPs interpolated from nearest measured area. Does not capture hyper-local neighborhood variation.",
    },
    {
      name:"Indeed — Live MCP Integration", type:"Live Job Feed", icon:"🔍", color:N.green,
      url:"https://www.indeed.com/", updateFreq:"Real-time (at search)", lag:"None — current at query time",
      coverage:"Largest US job board; millions of active listings",
      fields:["Job title & employer","Posted date","Location (city, state)","Salary (when disclosed)","Job type (FT/PT/contract/locum)","Apply URL"],
      howUsed:"Live Postings tab: Claude calls the Indeed MCP server (mcp.indeed.com/claude/mcp) at search time with CRNA + Anesthesiologist queries centered on your ZIP. Returns real postings normalized into the card UI.",
      limitations:"Salary disclosed on ~30–40% of anesthesia postings. Listings reflect employer-posted data; actual offers may vary.",
    },
    {
      name:"GasWork.com", type:"Specialty Job Board", icon:"⛽", color:"#e65c00",
      url:"https://www.gaswork.com/", updateFreq:"Real-time (at search)", lag:"None — current at query time",
      coverage:"Largest dedicated anesthesia job board in the US",
      fields:["CRNA & MD/DO postings","State-level search","Employer type","Salary ranges (when listed)","Apply links"],
      howUsed:"Live Postings tab: Claude uses web search to fetch GasWork CRNA and Anesthesiologist listings for the searched state/region and parses them into the standardized job card format.",
      limitations:"Requires login for full job details on some postings. Web-fetch method may miss dynamically loaded listings. State-level only — no ZIP radius filter.",
    },
    {
      name:"GasJobs.com", type:"Specialty Job Board", icon:"💨", color:"#7b2d8b",
      url:"https://www.gasjobs.com/", updateFreq:"Real-time (at search)", lag:"None — current at query time",
      coverage:"Anesthesiology-focused clearinghouse; hospital systems & private groups",
      fields:["Anesthesiologist & CRNA roles","Full-time, locum, per diem","Employer direct postings","Geographic filter","Salary (when disclosed)"],
      howUsed:"Live Postings tab: Claude performs targeted web search for GasJobs listings near the searched location and normalizes results into the card UI.",
      limitations:"Smaller inventory than Indeed or GasWork. Some listings may redirect to employer ATS systems requiring separate login.",
    },
    {
      name:"Claude AI — Synthetic Market Modeling", type:"AI-Generated Estimates", icon:"🤖", color:N.gray600,
      url:"https://www.anthropic.com/claude", updateFreq:"Generated at query time", lag:"None",
      coverage:"Any US ZIP code",
      fields:["Regional comp adjustment by lat/lng cluster","Shortage severity classification","Date-range comp trend extrapolation","Sample Posted Roles dataset (28 modeled listings)","AI market narrative (Analysis tab)"],
      howUsed:"All benchmark figures in the overview are computed by a deterministic model using lat/lng geographic clusters and C2ER COLI. The Sample Roles and AI Analysis tabs use the Anthropic API (claude-sonnet-4) to generate modeled datasets and narrative analysis.",
      limitations:"AI-modeled output — not verified real postings or audited survey data. Should be used for directional benchmarking only. NAPA-specific comp estimates are modeled from public market data and do not represent official NAPA compensation offers.",
    },
  ];

  const dataFlow = [
    {step:1, label:"ZIP → Geocode", detail:"OpenStreetMap converts ZIP to lat/lng", icon:"📮", color:N.navy},
    {step:2, label:"Region Cluster", detail:"NE/WC/South/MW/Rural calibrates comp model", icon:"🗺️", color:N.blue},
    {step:3, label:"BLS + MGMA + AANA/ASA", detail:"National benchmarks anchored by survey data", icon:"📊", color:N.teal},
    {step:4, label:"C2ER COLI Applied", detail:"CoL index adjusts to local market", icon:"💹", color:N.amber},
    {step:5, label:"Date Range Multiplier", detail:"3.2%/yr comp trend extrapolation", icon:"📅", color:N.orange},
    {step:6, label:"Live Boards Queried", detail:"Indeed MCP + GasWork + GasJobs in parallel", icon:"🔍", color:N.green},
    {step:7, label:"Results Rendered", detail:"Benchmarks, listings, AI analysis, map", icon:"✅", color:N.navy},
  ];

  return(
    <div style={{display:"grid",gap:16}}>
      <div style={{background:N.navy,borderRadius:10,padding:"20px 24px"}}>
        <div style={{fontSize:10,fontWeight:700,color:N.teal,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4,fontFamily:FF}}>📐 Data Sources & Methodology</div>
        <div style={{fontSize:20,fontWeight:700,color:N.white,marginBottom:8,fontFamily:FF}}>Where Every Number Comes From</div>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.8,margin:0,fontFamily:FF}}>GasGauge synthesizes <strong style={{color:N.teal}}>federal datasets</strong>, <strong style={{color:N.teal}}>industry surveys</strong>, <strong style={{color:N.teal}}>specialty association data</strong>, and <strong style={{color:N.teal}}>live job board feeds</strong> into a single localized view.</p>
      </div>

      <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"16px 20px"}}>
        <div style={{fontSize:11,fontWeight:700,color:N.navy,textTransform:"uppercase",letterSpacing:".08em",marginBottom:14,fontFamily:FF}}>🔄 Data Pipeline</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:0,alignItems:"center"}}>
          {dataFlow.map((s, i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:0}}>
              <div style={{background:`${s.color}12`,border:`1.5px solid ${s.color}30`,borderRadius:7,padding:"9px 12px",minWidth:100,textAlign:"center"}}>
                <div style={{fontSize:16,marginBottom:3}}>{s.icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:s.color,marginBottom:2,fontFamily:FF}}>{s.label}</div>
                <div style={{fontSize:9,color:N.gray400,lineHeight:1.4,fontFamily:FF}}>{s.detail}</div>
              </div>
              {i < dataFlow.length-1 && <div style={{fontSize:14,color:N.gray200,padding:"0 3px"}}>›</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:N.navy,textTransform:"uppercase",letterSpacing:".08em",fontFamily:FF}}>📚 Source Details — Click to Expand</div>
      <div style={{display:"grid",gap:8}}>
        {sources.map((s, i)=>(
          <div key={i} style={{background:N.white,border:`1px solid ${expanded===i?s.color+"60":N.gray100}`,borderRadius:8,overflow:"hidden",boxShadow:expanded===i?`0 2px 10px ${s.color}18`:"none"}}>
            <button onClick={()=>toggle(i)} style={{width:"100%",background:"none",border:"none",padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,textAlign:"left",borderLeft:`4px solid ${s.color}`}}>
              <div style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0}}>
                <span style={{fontSize:20,flexShrink:0}}>{s.icon}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:N.navy,marginBottom:3,fontFamily:FF}}>{s.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Badge label={s.type} color={s.color}/>
                    <Badge label={`Updated: ${s.updateFreq}`} color={N.gray400}/>
                    <Badge label={`Lag: ${s.lag}`} color={s.lag.startsWith("None")?N.green:N.amber}/>
                  </div>
                </div>
              </div>
              <span style={{fontSize:18,color:N.gray400,flexShrink:0,transform:expanded===i?"rotate(90deg)":"rotate(0deg)",transition:"transform .2s"}}>›</span>
            </button>
            {expanded===i&&(
              <div style={{borderTop:`1px solid ${s.color}20`,padding:"16px 18px 18px",display:"grid",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[{l:"Coverage",v:s.coverage},{l:"Update Frequency",v:s.updateFreq},{l:"Data Lag",v:s.lag}].map((item,j)=>(
                    <div key={j} style={{background:N.gray50,borderRadius:6,padding:"10px 12px"}}>
                      <div style={{fontSize:9,fontWeight:700,color:N.gray400,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontFamily:FF}}>{item.l}</div>
                      <div style={{fontSize:12,fontWeight:600,color:j===2&&item.v.startsWith("None")?N.green:N.navy,lineHeight:1.5,fontFamily:FF}}>{item.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:s.color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontFamily:FF}}>Fields / Variables Pulled</div>
                    {s.fields.map((f,j)=>(
                      <div key={j} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                        <span style={{color:s.color,fontWeight:700,fontSize:12,flexShrink:0,marginTop:1}}>›</span>
                        <span style={{fontSize:12,color:N.gray600,lineHeight:1.5,fontFamily:FF}}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:N.navy,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontFamily:FF}}>How GasGauge Uses This</div>
                    <p style={{fontSize:12,color:N.gray600,lineHeight:1.7,margin:"0 0 12px",fontFamily:FF}}>{s.howUsed}</p>
                    <div style={{fontSize:10,fontWeight:700,color:N.amber,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6,fontFamily:FF}}>Known Limitations</div>
                    <p style={{fontSize:12,color:N.gray600,lineHeight:1.7,margin:0,fontFamily:FF}}>{s.limitations}</p>
                  </div>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",background:`${s.color}12`,border:`1px solid ${s.color}30`,borderRadius:5,fontSize:11,fontWeight:700,color:s.color,width:"fit-content",fontFamily:FF}}>
                  🔗 Visit Source →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{background:N.amberLt,border:`1px solid ${N.amber}30`,borderRadius:8,padding:16}}>
        <div style={{fontSize:11,fontWeight:700,color:N.amber,marginBottom:10,fontFamily:FF}}>⚠️ Important Caveats</div>
        {[
          "All benchmark figures represent estimated ranges based on publicly available survey data — not guaranteed offer amounts.",
          "BLS OEWS and MGMA data carry 12–18 month publication lags; figures are forward-adjusted using a 3.2%/year comp trend.",
          "Live job board postings reflect real listings at time of search and may change or expire within hours.",
          "NAPA-specific comp estimates are modeled from public market data and do not represent verified or official NAPA compensation offers. Visit napa.com/careers for current openings.",
          "AI-generated content (Sample Roles tab, Analysis tab) is for directional benchmarking only.",
        ].map((c,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:N.amber,fontWeight:700,flexShrink:0}}>›</span><p style={{fontSize:12,color:N.gray700,lineHeight:1.6,margin:0,fontFamily:FF}}>{c}</p></div>))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [zip,setZip]=useState("");
  const [radius,setRadius]=useState(25);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [result,setResult]=useState(null);
  const [tab,setTab]=useState("overview");
  const [dateRange,setDateRange]=useState({start:"2023-01",end:"2025-12"});
  const [showWizard,setShowWizard]=useState(false);
  const [showExport,setShowExport]=useState(false);
  const [pastedJobs,setPastedJobs]=useState([]);
  const handleWizardSubmit=(newWf)=>{ setResult(prev=>prev?{...prev,wf:newWf}:prev); };
  const handlePastedJobsAdded=(newJobs)=>{ setPastedJobs(prev=>[...prev,...newJobs.map((j,i)=>({...j,id:`p${Date.now()}${i}`,source:"pasted"}))]); };

  const search=async()=>{
    const z=zip.trim().replace(/\D/g,"");
    if(z.length<5){setErr("Enter a valid 5-digit ZIP code.");return;}
    setLoading(true);setErr("");setResult(null);setTab("overview");
    try{
      const geo=await geocodeZip(z);
      const city=await reverseGeocode(geo.lat,geo.lng);
      const wf=syntheticWorkforceFromCoord(geo.lat,geo.lng,city,dateRange);
      setResult({zip:z,geo,city,wf,radius});
    }catch(e){setErr(e.message||"Could not find that ZIP code.");}
    finally{setLoading(false);}
  };

  const r=result;
  const locLabel=r?`${r.city||""}`:""

  return(
    <div id="gasgauge-root" style={{minHeight:"100vh",background:N.gray50,fontFamily:FF,color:N.gray800}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;font-family:${FF}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${N.gray50}}
        ::-webkit-scrollbar-thumb{background:${N.gray200};border-radius:3px}
        input[type=number]::-webkit-inner-spin-button{opacity:1}
      `}</style>

      {/* Header */}
      <div style={{background:N.navy,borderBottom:`3px solid ${N.teal}`}}>
        <div style={{maxWidth:980,margin:"0 auto",padding:"0 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{background:N.teal,borderRadius:6,padding:"7px 11px"}}><span style={{color:N.white,fontSize:17,fontWeight:700,letterSpacing:".04em",fontFamily:FF}}>NAPA</span></div>
              <div><div style={{fontSize:17,fontWeight:700,color:N.white,fontFamily:FF}}>GasGauge Market Insights</div><div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:1,fontFamily:FF}}>ZIP-Based Anesthesia Workforce Intelligence</div></div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <Badge label="Indeed Live Postings" color={N.green} bg="rgba(5,150,105,0.2)"/>
              <Badge label="ZIP-Level Precision" color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.1)"/>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:980,margin:"0 auto",padding:"24px 20px"}}>
        {/* Search card */}
        <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:10,padding:28,marginBottom:24,boxShadow:"0 2px 8px rgba(0,56,101,0.08)"}}>
          <div style={{fontSize:20,fontWeight:700,color:N.navy,marginBottom:4,fontFamily:FF}}>Enter a ZIP Code + Radius</div>
          <p style={{fontSize:13,color:N.gray600,marginBottom:20,lineHeight:1.6,fontFamily:FF}}>Workforce benchmarks, compensation data, and <strong style={{color:N.green}}>live Indeed job listings</strong> for CRNAs and Anesthesiologists near any US ZIP code.</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
            <div style={{position:"relative",flex:1,minWidth:180}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none"}}>📮</span>
              <input value={zip} onChange={e=>setZip(e.target.value.replace(/\D/g,"").slice(0,5))} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="ZIP code  e.g. 90210"
                style={{width:"100%",paddingLeft:38,paddingRight:14,paddingTop:11,paddingBottom:11,background:N.white,border:`1.5px solid ${N.gray200}`,borderRadius:6,color:N.navy,fontSize:15,fontFamily:FF,fontWeight:600}}/>
            </div>
            <select value={radius} onChange={e=>setRadius(Number(e.target.value))} style={{background:N.white,border:`1.5px solid ${N.gray200}`,borderRadius:6,padding:"11px 14px",color:N.navy,fontSize:13,fontFamily:FF,cursor:"pointer",fontWeight:600}}>
              {[5,10,25,50,100].map(r=><option key={r} value={r}>{r} miles</option>)}
            </select>
            <Btn onClick={search} disabled={loading}>{loading?"Searching…":"Search →"}</Btn>
          </div>
          <div style={{background:N.navyLt,border:`1px solid ${N.gray100}`,borderRadius:8,padding:"12px 16px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:N.navy,textTransform:"uppercase",letterSpacing:".09em",marginBottom:8,fontFamily:FF}}>📅 Date Range</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}><label style={{fontSize:11,color:N.gray600,fontWeight:600,fontFamily:FF}}>From</label><input type="month" value={dateRange.start} min="2015-01" max={dateRange.end} onChange={e=>setDateRange(d=>({...d,start:e.target.value}))} style={{background:N.white,border:`1.5px solid ${N.gray200}`,borderRadius:6,padding:"5px 8px",color:N.navy,fontSize:12,fontFamily:FF}}/></div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}><label style={{fontSize:11,color:N.gray600,fontWeight:600,fontFamily:FF}}>To</label><input type="month" value={dateRange.end} min={dateRange.start} max="2026-12" onChange={e=>setDateRange(d=>({...d,end:e.target.value}))} style={{background:N.white,border:`1.5px solid ${N.gray200}`,borderRadius:6,padding:"5px 8px",color:N.navy,fontSize:12,fontFamily:FF}}/></div>
              {[["2022-01","2023-12","2022–23"],["2024-01","2025-12","2024–25"],["2023-01","2026-12","3-Year"]].map(([s,e,l])=>(<button key={l} onClick={()=>setDateRange({start:s,end:e})} style={{padding:"4px 10px",borderRadius:4,background:dateRange.start===s&&dateRange.end===e?N.blue:N.white,border:`1px solid ${dateRange.start===s&&dateRange.end===e?N.blue:N.gray200}`,color:dateRange.start===s&&dateRange.end===e?N.white:N.gray600,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>{l}</button>))}
            </div>
          </div>
          {err&&<div style={{fontSize:12,color:N.red,marginBottom:10,fontWeight:500,fontFamily:FF}}>⚠ {err}</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            <span style={{fontSize:11,color:N.gray400,fontWeight:500,alignSelf:"center",fontFamily:FF}}>Try:</span>
            {[["90210",10],["10001",25],["60601",25],["77001",50],["30301",25],["02108",10]].map(([z,r])=>(<button key={z} onClick={()=>{setZip(z);setRadius(r);}} style={{background:N.navyLt,border:`1px solid ${N.gray200}`,borderRadius:4,padding:"4px 10px",color:N.blue,fontSize:11,fontFamily:FF,cursor:"pointer",fontWeight:600}}>{z} · {r}mi</button>))}
          </div>
        </div>

        {/* Results */}
        {r&&(
          <>
            <div style={{background:N.navy,borderRadius:10,padding:"20px 24px",marginBottom:16,borderLeft:`6px solid ${shortageColor[r.wf.shortage]}`}}>
              <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4,fontFamily:FF}}>{r.radius}-mile radius · ZIP {r.zip}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                <div style={{fontSize:28,fontWeight:700,color:N.white,fontFamily:FF}}>{locLabel||r.zip}</div>
                <button onClick={()=>setShowWizard(true)} style={{padding:"9px 20px",borderRadius:7,background:`linear-gradient(135deg,${N.blue},${N.teal})`,border:"none",color:N.white,fontSize:13,fontFamily:FF,cursor:"pointer",fontWeight:700,display:"flex",gap:7,alignItems:"center"}}>🧙 Wizard</button>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18,marginTop:8}}>
                <Badge label={`● ${shortageLabel[r.wf.shortage]}`} color={shortageColor[r.wf.shortage]} bg={`${shortageColor[r.wf.shortage]}25`}/>
                <Badge label={`CoL Index: ${r.wf.col}`} color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.1)"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                {[
                  {l:"MD Total Comp",v:fmt(r.wf.mdComp),sub:`${parseFloat(r.wf.mdNatDiff)>=0?"▲":"▼"} ${Math.abs(r.wf.mdNatDiff)}% vs natl`,ac:N.teal},
                  {l:"MD Base Salary",v:fmt(r.wf.mdBase),sub:"excl. bonus + benefits",ac:N.teal},
                  {l:"CRNA Total Comp",v:fmt(r.wf.crnaComp),sub:`${parseFloat(r.wf.crnaNatDiff)>=0?"▲":"▼"} ${Math.abs(r.wf.crnaNatDiff)}% vs natl`,ac:N.white},
                  {l:"CRNA Base Salary",v:fmt(r.wf.crnaBase),sub:"excl. bonus + benefits",ac:N.white},
                ].map((k,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.07)",borderRadius:6,padding:"12px 14px",borderTop:`2px solid ${k.ac===N.teal?N.teal:"rgba(255,255,255,0.2)"}`}}>
                    <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontFamily:FF}}>{k.l}</div>
                    <div style={{fontSize:20,fontWeight:700,color:k.ac===N.teal?N.teal:N.white,lineHeight:1,marginBottom:3,fontFamily:FF}}>{k.v}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontFamily:FF}}>{k.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {showWizard&&<CompWizard wf={r.wf} zip={r.zip} locLabel={locLabel} onClose={()=>setShowWizard(false)} onSubmit={handleWizardSubmit}/>}

            <TabBar
              tabs={[["overview","Overview"],["live","🔍 Live Postings"],["paste","📎 Paste Jobs"],["posted","📋 Sample Roles"],["map","🗺️ Map"],["ai","🧠 AI Analysis"],["jobs","💼 Job Boards"],["methodology","📐 Data Sources"]]}
              active={tab} onChange={setTab}/>

            {tab==="overview"&&(
              <div style={{display:"grid",gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {[
                    {role:"Anesthesiologist MD/DO",base:r.wf.mdBase,bonus:r.wf.mdBonus,benefits:r.wf.mdBenefits,total:r.wf.mdComp,nat:443000,color:N.blue,diff:r.wf.mdNatDiff,signOn:r.wf.mdSignOn,ptoDays:r.wf.mdPtoDays,match401k:r.wf.md401kMatch,cme:r.wf.mdCME,malpractice:r.wf.mdMalpractice},
                    {role:"CRNA",base:r.wf.crnaBase,bonus:r.wf.crnaBonus,benefits:r.wf.crnaBenefits,total:r.wf.crnaComp,nat:228000,color:N.teal,diff:r.wf.crnaNatDiff,signOn:r.wf.crnaSignOn,ptoDays:r.wf.crnaPtoDays,match401k:r.wf.crna401kMatch,cme:r.wf.crnaCME,malpractice:r.wf.crnaMalpractice},
                  ].map((item,i)=>(
                    <div key={i} style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:20,borderTop:`3px solid ${item.color}`,boxShadow:"0 1px 4px rgba(0,56,101,0.06)"}}>
                      <div style={{fontSize:10,fontWeight:700,color:item.color,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6,fontFamily:FF}}>{item.role}</div>
                      <div style={{fontSize:28,fontWeight:700,color:N.navy,lineHeight:1,fontFamily:FF}}>{fmt(item.total)}</div>
                      <div style={{fontSize:11,fontWeight:600,marginBottom:12,color:parseFloat(item.diff)>=0?N.green:N.red,fontFamily:FF}}>{parseFloat(item.diff)>=0?"▲":"▼"} {Math.abs(item.diff)}% vs national avg {fmt(item.nat)}</div>
                      {[{l:"Base Salary",v:item.base,c:item.color},{l:"Performance Bonus",v:item.bonus,c:N.amber},{l:"Benefits",v:item.benefits,c:N.green}].map((row,j)=>(<div key={j} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:12,color:N.gray600,fontFamily:FF}}>{row.l}</span><span style={{fontSize:13,fontWeight:700,color:row.c,fontFamily:FF}}>{fmt(row.v)}</span></div>))}
                      <div style={{height:1,background:N.gray100,margin:"10px 0"}}/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[{l:"Sign-On",v:fmt(item.signOn),c:N.orange},{l:"CME",v:fmt(item.cme),c:N.navy},{l:"PTO Days",v:`${item.ptoDays}d`,c:N.teal},{l:"401k Match",v:`${item.match401k}%`,c:N.blue}].map((row,j)=>(<div key={j} style={{background:N.gray50,borderRadius:5,padding:"8px 10px"}}><div style={{fontSize:10,color:N.gray400,marginBottom:2,fontFamily:FF}}>{row.l}</div><div style={{fontSize:14,fontWeight:700,color:row.c,fontFamily:FF}}>{row.v}</div></div>))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:N.navy,marginBottom:4,fontFamily:FF}}>Local vs National Compensation</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={[{l:"MD Base",local:r.wf.mdBase,nat:345000},{l:"MD Total",local:r.wf.mdComp,nat:443000},{l:"CRNA Base",local:r.wf.crnaBase,nat:194000},{l:"CRNA Total",local:r.wf.crnaComp,nat:228000}]}>
                      <CartesianGrid vertical={false} stroke={N.gray50}/>
                      <XAxis dataKey="l" tick={{fill:N.gray400,fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={v=>`$${v/1000}K`} tick={{fill:N.gray400,fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontSize:12}}/>
                      <Bar dataKey="local" name={`ZIP ${r.zip} Area`} fill={N.blue} radius={[4,4,0,0]}/>
                      <Bar dataKey="nat" name="National Avg" fill={N.gray200} radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:shortageBg[r.wf.shortage],border:`1px solid ${shortageColor[r.wf.shortage]}30`,borderRadius:8,padding:"14px 18px",display:"flex",gap:12}}>
                  <div style={{background:shortageColor[r.wf.shortage],borderRadius:5,padding:"7px 9px",flexShrink:0}}><span style={{fontSize:16,color:N.white}}>{{low:"✅",moderate:"📊",high:"⚠️",critical:"🚨"}[r.wf.shortage]}</span></div>
                  <div><div style={{fontSize:13,fontWeight:700,color:shortageColor[r.wf.shortage],marginBottom:3,fontFamily:FF}}>{shortageLabel[r.wf.shortage]}</div><p style={{fontSize:12,color:N.gray600,lineHeight:1.7,margin:0,fontFamily:FF}}>{{low:"Well-supplied anesthesia workforce.",moderate:"Active recruiting market with competitive packages.",high:"High-demand market. Sign-on bonuses and above-average comp are common.",critical:"Critical shortage. Aggressive comp premiums and loan forgiveness prevalent."}[r.wf.shortage]}</p></div>
                </div>
                <OverviewCompare wf={r.wf} r={r} locLabel={locLabel} onTabChange={setTab} onOpenWizard={()=>setShowWizard(true)} onExport={()=>setShowExport(true)}/>
              </div>
            )}
            {tab==="live" && <LiveJobsTab zip={r.zip} locLabel={locLabel} radius={r.radius} pastedJobs={pastedJobs} />}
            {tab==="paste" && <PasteJobsPanel onJobsAdded={handlePastedJobsAdded} existingJobs={[]} />}
            {tab==="posted" && <PostedRolesTab zip={r.zip} radius={r.radius} locLabel={locLabel} wf={r.wf} />}
            {tab==="map" && <MapTab geo={r.geo} zip={r.zip} radius={r.radius} locLabel={locLabel} />}
            {tab==="ai" && <AIAnalysisTab locLabel={locLabel} wf={r.wf} radius={r.radius} zip={r.zip} />}
            {tab==="jobs" && <JobsTab locLabel={locLabel} radius={r.radius} zip={r.zip} />}
            {tab==="methodology" && <MethodologyTab />}
          </>
        )}

        {!r&&(
          <div style={{background:N.white,border:`1px solid ${N.gray100}`,borderRadius:8,padding:48,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>📮</div>
            <div style={{fontSize:18,fontWeight:700,color:N.navy,marginBottom:8,fontFamily:FF}}>Enter a ZIP Code to Get Started</div>
            <p style={{fontSize:13,color:N.gray600,maxWidth:440,margin:"0 auto",lineHeight:1.7,fontFamily:FF}}>Get compensation benchmarks, workforce shortage data, and <strong style={{color:N.green}}>live Indeed job listings</strong> for CRNAs and Anesthesiologists calibrated to your search radius.</p>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:28,fontSize:11,color:N.gray400,borderTop:`1px solid ${N.gray100}`,paddingTop:14,fontFamily:FF}}>
          © North American Partners in Anesthesia (NAPA) · GasGauge · Data: BLS OES, MGMA, AANA, ASA, Indeed · 2024–2026
        </div>
      </div>
    </div>
  );
}
