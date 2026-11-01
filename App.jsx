import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell,
  BookOpen, BrainCircuit, BriefcaseBusiness, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, FileText, Filter, Gauge, Home, Lightbulb, Menu,
  Plus, Search, Settings, ShieldCheck, Sparkles, Target, TrendingUp,
  Users, Wrench, X, Zap
} from "lucide-react";
import { initialCases, initialProjects, initialSignals } from "./data";
import { isSupabaseConfigured, supabase } from "./supabase";

const NAV = [
  { id: "dashboard", label: "Executive Dashboard", icon: Home, group: "WORKSPACE" },
  { id: "projects", label: "Project Management", icon: BriefcaseBusiness, group: "WORKSPACE" },
  { id: "knowledge", label: "CI Knowledge Hub", icon: BookOpen, group: "INTELLIGENCE" },
  { id: "analytics", label: "CI Analytics", icon: BarChart3, group: "INTELLIGENCE" },
  { id: "copilot", label: "AI CI Co-pilot", icon: BrainCircuit, group: "INTELLIGENCE" },
  { id: "predictive", label: "Predictive Intelligence", icon: Activity, group: "INTELLIGENCE" },
  { id: "tasks", label: "Notifications & Tasks", icon: Bell, group: "SYSTEM" },
  { id: "admin", label: "Administration", icon: Settings, group: "SYSTEM" }
];

const money = n => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n || 0));
const pct = n => `${Math.round(Number(n || 0))}%`;
const readStore = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [projects, setProjects] = useState(() => readStore("ci_projects", initialProjects));
  const [cases, setCases] = useState(() => readStore("ci_cases", initialCases));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState([{ role: "assistant", text: "สวัสดีครับ ผมคือ CI Co-pilot รุ่นเริ่มต้น สามารถช่วยค้นหาแนวทางจาก Knowledge Hub และจัดโครงร่างโครงการปรับปรุงได้ ลองถามเกี่ยวกับ Cost, Quality, Delivery หรือ Kaizen ได้เลยครับ" }]);

  useEffect(() => { localStorage.setItem("ci_projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem("ci_cases", JSON.stringify(cases)); }, [cases]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("ci_projects").select("*").order("created_at", { ascending: false });
      if (!alive) return;
      if (!error && data?.length) setProjects(data.map(p => ({
        id: p.project_code, title: p.title, department: p.department || "Unassigned", area: p.area || "N/A",
        owner: p.owner || "Unassigned", type: p.project_type || "Kaizen", status: p.status || "On track",
        progress: p.progress || 0, loss: p.loss_category || "Cost", benefit: Number(p.actual_benefit || 0),
        target: Number(p.target_benefit || 0), updated: (p.updated_at || p.created_at || "").slice(0, 10),
        problem: p.problem || "", action: p.action || ""
      })));
    })();
    return () => { alive = false; };
  }, []);

  const activeNav = NAV.find(n => n.id === page);
  const totalBenefit = projects.reduce((s, p) => s + Number(p.benefit || 0), 0);
  const totalTarget = projects.reduce((s, p) => s + Number(p.target || 0), 0);
  const statusCounts = {
    "On track": projects.filter(p => p.status === "On track").length,
    "At risk": projects.filter(p => p.status === "At risk").length,
    "Delayed": projects.filter(p => p.status === "Delayed").length
  };

  const addProject = async (project) => {
    setProjects(prev => [project, ...prev]);
    setShowModal(false);
    setToast("เพิ่มโครงการเรียบร้อยแล้ว");
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("ci_projects").insert({
        project_code: project.id, title: project.title, department: project.department, area: project.area,
        owner: project.owner, project_type: project.type, status: project.status, progress: project.progress,
        loss_category: project.loss, actual_benefit: project.benefit, target_benefit: project.target,
        problem: project.problem, action: project.action
      });
      if (error) setToast("บันทึกในเครื่องแล้ว แต่ส่งข้อมูลไป Supabase ไม่สำเร็จ: " + error.message);
    }
  };

  const sendChat = () => {
    const q = chatInput.trim();
    if (!q) return;
    const matched = cases.filter(c => `${c.title} ${c.summary} ${c.loss} ${c.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
    const related = matched.length ? matched : cases.filter(c => q.toLowerCase().includes(c.loss.toLowerCase()));
    const answer = related.length
      ? `พบกรณีศึกษา ${related.length} รายการที่อาจเกี่ยวข้อง:\n${related.slice(0, 3).map(c => `• ${c.title} (${c.id}) — ${c.summary}`).join("\n")}\n\nข้อเสนอแนะ: เริ่มจากกำหนด Baseline, วิเคราะห์สาเหตุราก (Root Cause), ทดลองมาตรการ และยืนยันผลก่อนจัดทำมาตรฐาน`
      : "ยังไม่พบกรณีศึกษาที่ตรงกับคำถามในข้อมูลตัวอย่าง กรุณาระบุประเภทความสูญเสีย (Cost / Quality / Delivery / Safety) หรือคำสำคัญเพิ่มเติม ทั้งนี้คำตอบนี้เป็นการค้นหาจากข้อมูลตัวอย่าง ยังไม่ได้เชื่อมต่อ LLM หรือ RAG";
    setChat(prev => [...prev, { role: "user", text: q }, { role: "assistant", text: answer }]);
    setChatInput("");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Gauge size={22} /></div>
          <div><strong>CI INTELLIGENCE</strong><span>CONTINUOUS IMPROVEMENT</span></div>
          <button className="mobile-close icon-btn" onClick={() => setMobileNav(false)}><X size={18}/></button>
        </div>
        <div className="workspace-switch"><div className="workspace-avatar">N</div><div><b>NPI Organization</b><small>Enterprise workspace</small></div><ChevronDown size={15}/></div>
        {["WORKSPACE", "INTELLIGENCE", "SYSTEM"].map(group => (
          <div className="nav-group" key={group}>
            <div className="nav-caption">{group}</div>
            {NAV.filter(n => n.group === group).map(item => {
              const Icon = item.icon;
              return <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => { setPage(item.id); setMobileNav(false); }}>
                <Icon size={17}/><span>{item.label}</span>{item.id === "tasks" && <i className="nav-dot"/>}
              </button>;
            })}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Need a hand?</b><p>Explore the CI user guide and best practices.</p><button onClick={() => setPage("knowledge")}>Open Knowledge Hub <span>→</span></button></div>
          <div className="profile"><div className="profile-avatar">AD</div><div><b>CI Administrator</b><small>System Admin</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-btn" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{activeNav?.label}</b></div></div>
          <div className="topbar-right"><div className={`connection ${isSupabaseConfigured ? "connected" : ""}`}><span/> {isSupabaseConfigured ? "Supabase connected" : "Demo mode"}</div><button className="icon-btn notification-btn" onClick={() => setPage("tasks")}><Bell size={18}/><i/></button><div className="top-avatar">AD</div></div>
        </header>
        <div className="content">
          {page === "dashboard" && <Dashboard projects={projects} statusCounts={statusCounts} totalBenefit={totalBenefit} totalTarget={totalTarget} setPage={setPage}/>}
          {page === "projects" && <Projects projects={projects} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onAdd={() => setShowModal(true)} onStatus={(id, status) => setProjects(prev => prev.map(p => p.id === id ? {...p, status, updated: new Date().toISOString().slice(0,10)} : p))}/>}
          {page === "knowledge" && <Knowledge cases={cases} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter}/>}
          {page === "analytics" && <Analytics projects={projects}/>}
          {page === "copilot" && <Copilot chat={chat} input={chatInput} setInput={setChatInput} onSend={sendChat}/>}
          {page === "predictive" && <Predictive setPage={setPage}/>}
          {page === "tasks" && <Tasks projects={projects}/>}
          {page === "admin" && <Admin/>}
        </div>
        <footer className="footer"><span>© 2026 CI Intelligence</span><span>Continuous Improvement • Knowledge • Intelligence</span><span>Version 1.0.0 MVP</span></footer>
      </main>
      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={addProject}/>}
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, desc, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>{action}</div>;
}
function Metric({ label, value, suffix, note, icon: Icon, tone = "blue", trend }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${tone}`}><Icon size={18}/></div></div><div className="metric-value">{value}<small>{suffix}</small></div><div className="metric-note">{trend && <span className={trend === "down" ? "trend-down" : "trend-up"}>{trend === "down" ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}</span>}{note}</div></div>;
}
function StatusPill({ status }) {
  const cls = status === "On track" ? "good" : status === "At risk" ? "warning" : "danger";
  return <span className={`status-pill ${cls}`}><i/>{status}</span>;
}
function Dashboard({ projects, statusCounts, totalBenefit, totalTarget, setPage }) {
  const categories = ["Cost", "Quality", "Delivery", "Safety", "Environment", "Morale"];
  const colors = ["#5277e8", "#23a68a", "#e6a23c", "#e36b6b", "#8b6edb", "#7b8a9a"];
  const total = projects.length || 1;
  const lossCount = categories.map(c => projects.filter(p => p.loss === c).length);
  return <>
    <PageHeading eyebrow="OVERVIEW / PERFORMANCE" title="Executive Dashboard" desc="A real-time view of continuous improvement performance across your organization." action={<button className="btn btn-primary" onClick={() => setPage("projects")}><Plus size={16}/> Create CI Project</button>}/>
    <div className="welcome-strip"><div className="welcome-icon"><Sparkles size={19}/></div><div><b>Good afternoon, CI Team</b><p>Here is your improvement performance snapshot. Keep turning insights into measurable impact.</p></div><span className="date-chip">01 NOV 2026 <ChevronDown size={13}/></span></div>
    <div className="metric-grid">
      <Metric label="Total CI Projects" value={projects.length} note="Registered projects" icon={BriefcaseBusiness} tone="blue"/>
      <Metric label="On Track" value={statusCounts["On track"] || 0} note="Progressing as planned" icon={CheckCircle2} tone="green" trend="up"/>
      <Metric label="At Risk" value={statusCounts["At risk"] || 0} note="Requires attention" icon={AlertTriangle} tone="amber"/>
      <Metric label="Delayed" value={statusCounts["Delayed"] || 0} note="Behind target timeline" icon={Clock3} tone="red"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel benefit-panel"><div className="panel-heading"><div><h3>Benefit Realization</h3><p>Actual benefit compared with target benefit</p></div><span className="period-select">Year 2026 <ChevronDown size={14}/></span></div><div className="benefit-numbers"><div><small>ACTUAL BENEFIT</small><strong>฿{money(totalBenefit)}</strong></div><div className="target-number"><small>TARGET BENEFIT</small><strong>฿{money(totalTarget)}</strong></div></div><div className="progress-track"><div style={{width: `${totalTarget ? Math.min(100,totalBenefit/totalTarget*100) : 0}%`}}/></div><div className="progress-foot"><span>{totalTarget ? pct(totalBenefit/totalTarget*100) : "0%"} achievement</span><span>Gap ฿{money(Math.max(0,totalTarget-totalBenefit))}</span></div><div className="panel-footnote">* Demo data. Benefit figures must be verified by the responsible department before management reporting.</div></section>
      <section className="panel"><div className="panel-heading"><div><h3>Loss & Impact Distribution</h3><p>Projects by loss category</p></div><button className="text-link" onClick={() => setPage("analytics")}>View analytics →</button></div><div className="loss-layout"><div className="donut" style={{background: `conic-gradient(${colors.map((c,i)=>`${c} ${lossCount.slice(0,i).reduce((a,b)=>a+b,0)/total*100}% ${lossCount.slice(0,i+1).reduce((a,b)=>a+b,0)/total*100}%`).join(",")})`}}><div><b>{projects.length}</b><small>Projects</small></div></div><div className="legend">{categories.map((c,i)=><div key={c}><i style={{background:colors[i]}}/><span>{c}</span><b>{lossCount[i]}</b></div>)}</div></div></section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel"><div className="panel-heading"><div><h3>Project Health Overview</h3><p>Latest project status and progress</p></div><button className="text-link" onClick={() => setPage("projects")}>All projects →</button></div><div className="table-wrap"><table><thead><tr><th>PROJECT</th><th>OWNER / AREA</th><th>PROGRESS</th><th>STATUS</th></tr></thead><tbody>{projects.slice(0,5).map(p=><tr key={p.id}><td><b className="project-title">{p.title}</b><small>{p.id}</small></td><td>{p.owner}<small>{p.area}</small></td><td><div className="mini-progress"><i style={{width:`${p.progress}%`}}/></div><small>{p.progress}%</small></td><td><StatusPill status={p.status}/></td></tr>)}</tbody></table></div></section>
      <section className="panel insight-panel"><div className="panel-heading"><div><h3>Intelligence Highlights</h3><p>Signals that may need attention</p></div><span className="ai-label"><Sparkles size={13}/> AI INSIGHT</span></div><div className="insight-item"><div className="insight-symbol red"><TrendingUp size={17}/></div><div><b>Quality opportunity detected</b><p>Area B defect rate is above its baseline. Review defect patterns and existing improvement cases.</p><button onClick={() => setPage("predictive")}>Explore opportunity →</button></div></div><div className="insight-item"><div className="insight-symbol amber"><Zap size={17}/></div><div><b>Improvement coverage gap</b><p>Area E may need a new CI screening activity to address the quality signal.</p><button onClick={() => setPage("predictive")}>Explore opportunity →</button></div></div></section>
    </div>
  </>;
}

function Projects({ projects, query, setQuery, filter, setFilter, onAdd, onStatus }) {
  const filtered = projects.filter(p => (filter === "All" || p.status === filter) && `${p.id} ${p.title} ${p.department} ${p.area}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="WORKSPACE / EXECUTION" title="Project Management" desc="Track improvement projects, ownership, progress and validated benefits." action={<button className="btn btn-primary" onClick={onAdd}><Plus size={16}/> New Project</button>}/>
    <div className="toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search project, department or area..."/></div><div className="filterbox"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>On track</option><option>At risk</option><option>Delayed</option></select></div><span className="result-count">{filtered.length} projects</span></div>
    <div className="panel"><div className="table-wrap"><table className="large-table"><thead><tr><th>PROJECT INFORMATION</th><th>DEPARTMENT</th><th>TYPE / LOSS</th><th>PROGRESS</th><th>BENEFIT (THB)</th><th>STATUS</th><th>UPDATE STATUS</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><b className="project-title">{p.title}</b><small>{p.id} · {p.area} · {p.owner}</small></td><td>{p.department}</td><td>{p.type}<small>{p.loss}</small></td><td><div className="mini-progress wide"><i style={{width:`${p.progress}%`}}/></div><small>{p.progress}%</small></td><td><b>{money(p.benefit)}</b><small>Target {money(p.target)}</small></td><td><StatusPill status={p.status}/></td><td><select className="status-select" value={p.status} onChange={e=>onStatus(p.id,e.target.value)}><option>On track</option><option>At risk</option><option>Delayed</option></select></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state">No projects match your search.</div>}</div></div>
    <div className="notice"><ShieldCheck size={17}/><span>For reliable reporting, assign a project owner and validate actual benefits before closing a project.</span></div>
  </>;
}

function Knowledge({ cases, query, setQuery, filter, setFilter }) {
  const filtered = cases.filter(c => (filter === "All" || c.type === filter) && `${c.title} ${c.summary} ${c.tags.join(" ")} ${c.loss}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="INTELLIGENCE / ORGANIZATIONAL MEMORY" title="CI Knowledge Hub" desc="Search, learn and replicate proven continuous improvement practices." action={<button className="btn btn-secondary" onClick={()=>alert("ฟังก์ชันเพิ่มกรณีศึกษา จะเชื่อมต่อฐานข้อมูลในขั้นถัดไป") }><Plus size={16}/> Add Case Study</button>}/>
    <div className="knowledge-hero"><div className="knowledge-hero-icon"><BookOpen size={25}/></div><div><h2>Make every improvement reusable.</h2><p>Turn completed projects into organizational knowledge — searchable, structured and ready to replicate.</p></div><div className="knowledge-stat"><b>{cases.length.toString().padStart(2,"0")}</b><span>CASE STUDIES</span></div></div>
    <div className="toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search keywords, problem, solution or tags..."/></div><div className="filterbox"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Kaizen</option><option>SGA</option><option>FI</option></select></div><span className="result-count">{filtered.length} cases</span></div>
    <div className="case-grid">{filtered.map(c=><article className="case-card" key={c.id}><div className="case-top"><span className="case-type">{c.type}</span><span className="case-id">{c.id}</span></div><h3>{c.title}</h3><p>{c.summary}</p><div className="tag-row">{c.tags.map(t=><span key={t}>#{t}</span>)}</div><div className="case-result"><CheckCircle2 size={15}/><span>{c.result}</span></div><div className="case-meta"><span>{c.department}</span><span>{c.loss} loss</span><button onClick={()=>alert(`${c.title}\n\n${c.summary}\n\nResult: ${c.result}`)}>View case →</button></div></article>)}</div>
  </>;
}

function Analytics({ projects }) {
  const losses = ["Cost","Quality","Delivery","Safety","Environment","Morale"];
  const depts = [...new Set(projects.map(p=>p.department))];
  return <>
    <PageHeading eyebrow="INTELLIGENCE / PERFORMANCE" title="CI Analytics" desc="Understand improvement performance by loss category, department and benefit realization."/>
    <div className="metric-grid"><Metric label="Total Actual Benefit" value={`฿${money(projects.reduce((s,p)=>s+p.benefit,0))}`} note="Based on demo project data" icon={Target} tone="green"/><Metric label="Average Progress" value={pct(projects.length?projects.reduce((s,p)=>s+p.progress,0)/projects.length:0)} note="Across all projects" icon={TrendingUp} tone="blue"/><Metric label="Departments" value={depts.length} note="With registered projects" icon={Users} tone="violet"/><Metric label="Knowledge Cases" value="04" note="Sample knowledge records" icon={BookOpen} tone="amber"/></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h3>Projects by Loss Category</h3><p>Distribution of improvement focus</p></div></div><div className="bar-chart">{losses.map((l,i)=>{const n=projects.filter(p=>p.loss===l).length;return <div className="bar-row" key={l}><span>{l}</span><div><i style={{width:`${projects.length?n/projects.length*100:0}%`}}/></div><b>{n}</b></div>})}</div></section><section className="panel"><div className="panel-heading"><div><h3>Department Contribution</h3><p>Actual benefit by department</p></div></div><div className="bar-chart">{depts.map(d=>{const n=projects.filter(p=>p.department===d).reduce((s,p)=>s+p.benefit,0);const max=Math.max(1,...depts.map(x=>projects.filter(p=>p.department===x).reduce((s,p)=>s+p.benefit,0)));return <div className="bar-row" key={d}><span>{d}</span><div><i style={{width:`${n/max*100}%`}}/></div><b>{money(n)}</b></div>})}</div></section></div>
    <div className="notice"><AlertTriangle size={17}/><span>Analytics currently use sample/local project records. Connect operational data and finance validation before using this page for formal management decisions.</span></div>
  </>;
}

function Copilot({ chat, input, setInput, onSend }) {
  return <>
    <PageHeading eyebrow="INTELLIGENCE / AI ASSISTANT" title="AI CI Co-pilot" desc="An assistant for finding past cases, structuring problem analysis and preparing improvement reports."/>
    <div className="copilot-layout"><aside className="copilot-side"><div className="copilot-brand"><div><BrainCircuit size={24}/></div><b>CI Co-pilot</b><span>ASSISTANT PREVIEW</span></div><h4>Suggested capabilities</h4><div className="capability"><Search size={16}/><div><b>Knowledge Search</b><small>Find similar CI cases</small></div></div><div className="capability"><Lightbulb size={16}/><div><b>Idea Generation</b><small>Explore improvement ideas</small></div></div><div className="capability"><FileText size={16}/><div><b>Report Assistant</b><small>Structure CI reports</small></div></div><div className="copilot-disclaimer">Preview mode: responses are based on sample Knowledge Hub records. Connect an approved AI model and retrieval pipeline for production use.</div></aside><section className="chat-panel"><div className="chat-head"><div className="chat-avatar"><Sparkles size={18}/></div><div><b>CI Intelligence Assistant</b><small><i/> Ready to help</small></div><span className="preview-pill">PREVIEW</span></div><div className="chat-messages">{chat.map((m,i)=><div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role==="assistant"?<BrainCircuit size={16}/>: "You"}</div><div className="message-bubble">{m.text}</div></div>)}</div><div className="suggestions"><span>Try asking:</span>{["Find Cost reduction cases","Quality improvement ideas","How to structure a Kaizen?"].map(s=><button key={s} onClick={()=>setInput(s)}>{s}</button>)}</div><div className="chat-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSend()} placeholder="Ask about CI projects, losses or improvement methods..."/><button onClick={onSend}><Zap size={17}/></button></div></section></div>
  </>;
}

function Predictive({ setPage }) {
  return <>
    <PageHeading eyebrow="INTELLIGENCE / EARLY WARNING" title="Predictive Intelligence" desc="Identify abnormal operational signals and convert them into improvement opportunities." action={<span className="preview-pill">RULE-BASED MVP</span>}/>
    <div className="predictive-banner"><div><div className="eyebrow">EARLY WARNING SYSTEM</div><h2>See the signal. Act before the loss grows.</h2><p>Initial version uses rule-based indicators and sample data. Statistical/ML forecasting can be added after data integration and model validation.</p></div><div className="predictive-art"><Activity size={72}/><span/><span/><span/></div></div>
    <div className="section-title"><div><h3>Detected Opportunities</h3><p>Signals requiring review by process owners</p></div><span className="signal-count">3 signals detected</span></div>
    <div className="signal-grid">{initialSignals.map((s,i)=><div className="signal-card" key={s.id}><div className="signal-top"><span className={`severity ${s.severity.toLowerCase()}`}>{s.severity} priority</span><span>{s.id}</span></div><div className="signal-area">{s.area} <span>·</span> {s.category}</div><h3>{s.metric}</h3><div className="signal-values"><div><small>BASELINE</small><b>{s.baseline} <em>{s.unit}</em></b></div><div><small>CURRENT</small><b className="abnormal">{s.current} <em>{s.unit}</em></b></div></div><p>{s.reason}</p><div className="signal-suggestion"><Lightbulb size={15}/>{s.suggestion}</div><button className="btn btn-secondary btn-full" onClick={()=>setPage("projects")}><Plus size={15}/> Create CI Project</button></div>)}</div>
    <div className="notice"><ShieldCheck size={17}/><span>Signals are screening suggestions, not confirmed root causes or guaranteed predictions. Process owners must verify source data and investigate before action.</span></div>
  </>;
}

function Tasks({ projects }) {
  const tasks = [{title:"Review quality signal – Area B",sub:"Predictive Intelligence · High priority",date:"Today",tone:"red"},{title:"Validate actual benefit – CI-2026-001",sub:"Project Management · Benefit validation",date:"Nov 03",tone:"amber"},{title:"Update project progress – Area C",sub:"Project Management · Delayed project",date:"Overdue",tone:"red"},{title:"Capture lessons learned – CI-2026-004",sub:"Knowledge Hub · Knowledge capture",date:"Nov 06",tone:"blue"}];
  return <><PageHeading eyebrow="SYSTEM / FOLLOW-UP" title="Notifications & Tasks" desc="A central place to follow up actions, project risks and knowledge-capture activities."/><div className="task-list panel">{tasks.map((t,i)=><div className="task-row" key={i}><div className={`task-icon ${t.tone}`}><Bell size={17}/></div><div className="task-text"><b>{t.title}</b><small>{t.sub}</small></div><span className={`task-date ${t.tone}`}>{t.date}</span><button className="text-link">Open →</button></div>)}</div><div className="notice"><Clock3 size={17}/><span>Task assignment, due-date reminders and email/LINE notifications are prepared as the next integration step.</span></div></>;
}

function Admin() {
  return <><PageHeading eyebrow="SYSTEM / CONFIGURATION" title="Administration" desc="Manage organization structure, users, permissions and system configuration."/><div className="admin-grid">{[{icon:Users,title:"Organization & Departments",desc:"Manage departments, areas and process ownership."},{icon:ShieldCheck,title:"Users & Permissions",desc:"Set roles such as Admin, CI Manager, Project Owner and Viewer."},{icon:Wrench,title:"System Configuration",desc:"Configure project types, loss categories and workflow rules."},{icon:Zap,title:"Integrations",desc:"Connect Supabase, AI provider, n8n and operational data sources."}].map((x,i)=>{const I=x.icon;return <div className="admin-card" key={i}><div><I size={21}/></div><h3>{x.title}</h3><p>{x.desc}</p><span>Configuration module · Planned</span></div>})}</div><div className="notice"><ShieldCheck size={17}/><span>Before production release, enable authentication, role-based access control (RBAC), audit logging and database Row Level Security (RLS).</span></div></>;
}

function ProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({title:"",department:"Production",area:"Area A",owner:"",type:"Kaizen",loss:"Cost",target:0,problem:"",action:""});
  const change = e => setForm({...form,[e.target.name]:e.target.value});
  const submit = e => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, id:`CI-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, status:"On track", progress:0, benefit:0, target:Number(form.target||0), updated:new Date().toISOString().slice(0,10) });
  };
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="modal" onSubmit={submit}><div className="modal-head"><div><span className="eyebrow">PROJECT REGISTRATION</span><h2>Create CI Project</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={19}/></button></div><div className="form-grid"><label className="full">Project title *<input name="title" required value={form.title} onChange={change} placeholder="Enter improvement project title"/></label><label>Department<select name="department" value={form.department} onChange={change}><option>Production</option><option>Quality</option><option>Maintenance</option><option>Safety</option><option>Engineering</option><option>Admin</option></select></label><label>Area<input name="area" value={form.area} onChange={change}/></label><label>Project owner<input name="owner" value={form.owner} onChange={change} placeholder="Owner / team"/></label><label>Project type<select name="type" value={form.type} onChange={change}><option>Kaizen</option><option>SGA</option><option>FI</option></select></label><label>Loss category<select name="loss" value={form.loss} onChange={change}>{["Cost","Quality","Delivery","Safety","Environment","Morale"].map(x=><option key={x}>{x}</option>)}</select></label><label>Target benefit (THB)<input name="target" type="number" min="0" value={form.target} onChange={change}/></label><label className="full">Problem / opportunity<textarea name="problem" rows="2" value={form.problem} onChange={change}/></label><label className="full">Proposed action<textarea name="action" rows="2" value={form.action} onChange={change}/></label></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary"><Plus size={16}/> Create Project</button></div></form></div>;
}

export default App;