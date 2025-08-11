import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, ClipboardList, SquareGanttChart, BarChart2, 
  Paperclip, HelpCircle, Plus, Send, Printer, Trash2, 
  ArrowRight, Lightbulb, Layers, Info 
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultProjects = [
  { id: uid(), title: "Reduce extrusion changeover (SMED)", department: "Production", sponsor: "Ops Sr. Manager", requester: "Lean Champion - Factory 1", description: "Cut changeover from 45 → 20 min by converting internal setup to external.", impact: 5, effort: 3, status: "In Progress", completion: 40, type: "Kaizen", fromCI: true },
  { id: uid(), title: "Automate length measurement (Poka‑Yoke)", department: "Engineering", sponsor: "COO", requester: "OPEX", description: "Install encoders & counters on inner‑duct lines.", impact: 5, effort: 4, status: "At Risk", completion: 25, type: "Six Sigma", fromCI: false },
  { id: uid(), title: "A3 – Scrap reduction on line PPR‑07", department: "Quality", sponsor: "Quality Manager", requester: "Lean Champion - Factory 2", description: "Use Pareto + 5 Whys to tackle top 2 scrap causes.", impact: 4, effort: 2, status: "Completed", completion: 100, type: "Kaizen", fromCI: true },
];

const defaultIdeas = [
  { id: uid(), text: "Visual management for tool availability", owner: "Maintenance" },
  { id: uid(), text: "Kanban for raw material bins", owner: "Warehouse" },
];

export default function App() {
  const tabs = [
    { key: "guide", label: "Guide", icon: BookOpen },
    { key: "request", label: "Project Request", icon: ClipboardList },
    { key: "ci", label: "CI Board", icon: Lightbulb },
    { key: "matrix", label: "Priority Matrix", icon: SquareGanttChart },
    { key: "dash", label: "Dashboard", icon: BarChart2 },
    { key: "files", label: "Templates", icon: Paperclip },
    { key: "help", label: "Help", icon: HelpCircle },
  ];
  const [active, setActive] = useState(0);
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("opex_projects");
    return saved ? JSON.parse(saved) : defaultProjects;
  });
  const [ideas, setIdeas] = useState(() => {
    const saved = localStorage.getItem("opex_ideas");
    return saved ? JSON.parse(saved) : defaultIdeas;
  });
  const [files, setFiles] = useState([]);

  useEffect(() => localStorage.setItem("opex_projects", JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem("opex_ideas", JSON.stringify(ideas)), [ideas]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % tabs.length);
      else if (e.key === "ArrowLeft") setActive((i) => (i - 1 + tabs.length) % tabs.length);
      else if (e.key === "Enter") {
        const primary = document.querySelector('[data-primary="true"]:not([disabled])');
        if (primary) primary.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addProject = (p) => setProjects((prev) => [{ ...p, id: uid() }, ...prev]);
  const promoteIdea = (id, p) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    addProject(p);
  };
  const removeProject = (id) => setProjects((prev) => prev.filter((p) => p.id !== id));

  return (
    <div>
      <header className="topbar">
        <div className="container" style={{padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{height:36,width:36,borderRadius:12,background:"var(--primary)",color:"#fff",display:"grid",placeItems:"center",fontWeight:900}}>OP</div>
            <div>
              <div style={{fontWeight:700}}>OPEX Portal</div>
              <div style={{fontSize:12,color:"#475569"}}>Interactive SOP Companion · Sections 1.0 – 4.9</div>
            </div>
          </div>
          <div style={{display:"none"}} />
        </div>
      </header>

      <main className="container" style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:"1rem",padding:"1rem 1rem",marginTop:"1rem"}}>
        <nav className="card" style={{padding:"8px",position:"sticky",top:80,height:"fit-content"}}>
          {tabs.map((t,i)=> (
            <button key={t.key} onClick={()=>setActive(i)} className={"sidebar-btn "+(i===active?"active":"")}>
              {<t.icon size={16}/>} {t.label}
            </button>
          ))}
          <div style={{fontSize:11,color:"#6b7280",padding:"0 8px",marginTop:8}}>Tip: Use ← / → to switch tabs.</div>
        </nav>

        <section>
          <AnimatePresence mode="wait">
            {active===0 && <motion.div key="guide" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><Guide/></motion.div>}
            {active===1 && <motion.div key="request" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><RequestForm addProject={addProject}/></motion.div>}
            {active===2 && <motion.div key="ci" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><CIBoard ideas={ideas} setIdeas={setIdeas} onPromote={promoteIdea}/></motion.div>}
            {active===3 && <motion.div key="matrix" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><PriorityMatrix projects={projects} onDelete={removeProject}/></motion.div>}
            {active===4 && <motion.div key="dash" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><Dashboard projects={projects}/></motion.div>}
            {active===5 && <motion.div key="files" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><Templates files={files} setFiles={setFiles}/></motion.div>}
            {active===6 && <motion.div key="help" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><Help/></motion.div>}
          </AnimatePresence>
        </section>
      </main>

      <footer style={{marginTop:"24px",padding:"24px 0",borderTop:"1px solid #e5e7eb",textAlign:"center",fontSize:12,color:"#6b7280"}}>
        © {new Date().getFullYear()} Neproplast · OPEX Portal — SOP‑N‑25‑004 Companion (1.0–4.9)
      </footer>
    </div>
  );
}

function SectionHeader({icon:Icon,title,subtitle}){
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:700}}>
          <span style={{display:"inline-grid",placeItems:"center",height:36,width:36,borderRadius:12,background:"var(--primarySoft)",color:"var(--primary)"}}><Icon size={18}/></span>
          {title}
        </div>
        <div style={{fontSize:14,color:"#475569",marginTop:4}}>{subtitle}</div>
      </div>
      <div className="badge">Theme: green/gray/white</div>
    </div>
  );
}

function Guide(){
  const sections=[
    {title:"Scope & Purpose",tag:"SOP 1.0",points:[
      "Applies to all OPEX initiatives across sites and departments.",
      "Aligns improvements to strategic goals and embeds Lean culture.",
      "Defines roles, documentation, monitoring and reporting."
    ]},
    {title:"Objectives of OPEX",tag:"SOP 1.1",points:[
      "Align with VMOST, remove bottlenecks, and standardize processes.",
      "Build capability: training, mentoring, Yellow Belt.",
      "Enable project logging/tracking, dashboards, and cost‑reduction."
    ]},
    {title:"Engagement & Intake (4.1)",tag:"SOP 4.1",points:[
      "Ideas can come from audits, customer feedback, RF1 reviews, headcount studies, and leadership priorities.",
      "CI Board collects ideas → Ops Manager selects → Priority Matrix.",
      "Project sponsor validates; OPEX provides oversight."
    ]},
    {title:"Classification (4.2)",tag:"SOP 4.2",points:[
      "Kaizen (≈1 week, quick wins, A3).",
      "Agile Sprint (2–3 weeks, focused change, A3).",
      "Six Sigma (≥6 weeks, data‑driven, DMAIC template)."
    ]},
    {title:"Methods & Tools (4.3)",tag:"SOP 4.3",points:[
      "ASME charting, Activity sampling & Time study, VSM.",
      "FMEA, Pareto, RCA (Fishbone & 5 Whys).",
      "SMED & Poka‑Yoke for speed and error‑proofing."
    ]},
    {title:"Governance (4.4–4.6)",tag:"SOP 4.4–4.6",points:[
      "Formal approvals with standard templates.",
      "Central document control; naming conventions.",
      "KPIs: on‑time, savings, throughput, participation, sustainment."
    ]},
    {title:"Lean Champions & Communication (4.7–4.8)",tag:"SOP 4.7–4.8",points:[
      "Each department assigns a Lean Champion (ideas ≥1 / 6 months).",
      "Monthly huddles; quarterly reviews via tracker.",
      "Training cadence: tools + mentoring."
    ]},
    {title:"VMOST Strategy Review (4.9)",tag:"SOP 4.9",points:[
      "Weekly factory‑level check on tactics using A0 master schedule.",
      "Monthly management review using RF1 dashboard."
    ]},
  ];
  return (
    <div>
      <SectionHeader icon={BookOpen} title="Know the Procedure" subtitle="Everything you need from the beginning of the SOP to section 4.9 — with tips at every step."/>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        {sections.map(s => (
          <div key={s.title} className="card" style={{padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:600}}><Layers size={16}/> {s.title}</div>
              <span className="badge">{s.tag}</span>
            </div>
            <ul style={{margin:0,paddingLeft:"1rem"}}>
              {s.points.map((p,i)=>(<li key={i} style={{margin:"6px 0",fontSize:14}}>{p}</li>))}
            </ul>
            <div style={{fontSize:12,color:"#6b7280",marginTop:8}}>Tip: Use ← / → to move through the portal.</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({label,children,required}){
  return (<label style={{display:"block",fontSize:14}}>
    <div style={{marginBottom:4,fontWeight:600}}>{label} {required && <span style={{color:"#ef4444"}}>*</span>}</div>
    {children}
  </label>);
}

function RequestForm({addProject}){
  const [form,setForm] = useState({
    title:"",
    department:"Production",
    sponsor:"",
    requester:"",
    description:"",
    impact:3,effort:3,status:"Not Started",completion:0,type:"Kaizen"
  });
  const onChange = e => setForm(f=>({...f,[e.target.name]: e.target.type==="range"||e.target.type==="number"? Number(e.target.value): e.target.value}));
  const submit = e => { 
    e.preventDefault(); 
    addProject(form); 
    alert("Project submitted and placed on the Matrix."); 
    setForm(f => ({ ...f, title: "", description: "", requester: "" })); 
  };
  const printForm = () => window.print();

  return (
    <form onSubmit={submit}>
      <SectionHeader icon={ClipboardList} title="Submit a Project Request" subtitle="Fill, print if needed, and submit. Projects auto‑place on the matrix using Impact & Effort."/>
      <div className="card" style={{padding:16}}>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
          <Field label="Project Title" required><input name="title" value={form.title} onChange={onChange} placeholder="e.g., Reduce changeover time on Line 3"/></Field>
          <Field label="Department"><select name="department" value={form.department} onChange={onChange}>{["Production","Quality","Maintenance","Engineering","Warehouse","Logistics","IT"].map(d=><option key={d}>{d}</option>)}</select></Field>
          <Field label="Sponsor (Department/Executive)"><input name="sponsor" value={form.sponsor} onChange={onChange} placeholder="e.g., COO or Operations Sr. Manager"/></Field>
          <Field label="Requester"><input name="requester" value={form.requester} onChange={onChange} placeholder="Your name / role"/></Field>
          <Field label="Project Type (4.2)"><select name="type" value={form.type} onChange={onChange}><option>Kaizen</option><option>Agile Sprint</option><option>Six Sigma</option></select></Field>
          <Field label="Impact (1=Low, 5=High)"><input type="range" min={1} max={5} name="impact" value={form.impact} onChange={onChange}/></Field>
          <Field label="Effort (1=Low, 5=High)"><input type="range" min={1} max={5} name="effort" value={form.effort} onChange={onChange}/></Field>
          <Field label="Status"><select name="status" value={form.status} onChange={onChange}><option>Not Started</option><option>In Progress</option><option>At Risk</option><option>Completed</option></select></Field>
          <Field label="Completion %"><input type="number" min={0} max={100} name="completion" value={form.completion} onChange={onChange}/></Field>
          <div style={{gridColumn:"1 / -1"}}>
            <Field label="Description / Business Case"><textarea name="description" value={form.description} onChange={onChange} rows={4} placeholder="Problem, expected benefits, cost/savings, risks." /></Field>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginTop:12}}>
        <button type="submit" className="btn btn-primary" data-primary="true"><Send size={16}/> Submit (↵)</button>
        <button type="button" onClick={printForm} className="btn btn-ghost"><Printer size={16}/> Print Form</button>
        <span className="badge"><Info size={12}/> Impact/Effort drives matrix placement.</span>
      </div>
    </form>
  );
}

function CIBoard({ideas,setIdeas,onPromote}){
  const [text,setText]=useState(""); const [owner,setOwner]=useState("Production");
  const addIdea=()=>{ if(!text.trim())return; setIdeas(prev=>[{id:uid(),text,owner},...prev]); setText("") };
  return (
    <div>
      <SectionHeader icon={Lightbulb} title="Continuous Improvement (CI) Board" subtitle="Submit ideas. Ops Manager selects high‑value items for the Priority Matrix."/>
      <div className="card" style={{padding:16,marginBottom:16}}>
        <div className="grid" style={{gridTemplateColumns:"1fr 200px auto"}}>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g., Visual kanban for die sets"/>
          <select value={owner} onChange={e=>setOwner(e.target.value)}>{["Production","Quality","Maintenance","Engineering","Warehouse","Logistics","IT"].map(d=><option key={d}>{d}</option>)}</select>
          <button onClick={addIdea} className="btn btn-primary" data-primary="true"><Plus size={16}/> Add Idea (↵)</button>
        </div>
        <div style={{fontSize:12,color:"#6b7280",marginTop:8}}>Tip: CI Board → Ops Manager → Matrix (SOP 4.1).</div>
      </div>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        {ideas.map(i=>(
          <div key={i.id} className="card" style={{padding:12,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontWeight:600}}>{i.text}</div><div style={{fontSize:12,color:"#6b7280"}}>Owner: {i.owner}</div></div>
            <button className="btn btn-primary" onClick={()=>onPromote(i.id,{title:i.text,department:i.owner,sponsor:"Ops Manager",requester:"CI Board",description:"Promoted from CI Board for prioritization.",impact:4,effort:3,status:"Not Started",completion:0,type:"Kaizen",fromCI:true})}><ArrowRight size={16}/> Send to Matrix</button>
          </div>
        ))}
        {ideas.length===0 && <div style={{fontSize:14,color:"#6b7280"}}>No ideas yet — add one above.</div>}
      </div>
    </div>
  );
}

function PriorityMatrix({projects,onDelete}){
  const quadrants = useMemo(()=>({Q1:[],Q2:[],Q3:[],Q4:[]}),[]);
  projects.forEach(p=>{ const ih=p.impact>=4, eh=p.effort>=4; if(ih&&!eh) quadrants.Q1.push(p); else if(ih&&eh) quadrants.Q2.push(p); else if(!ih&&!eh) quadrants.Q3.push(p); else quadrants.Q4.push(p); });
  const CellBox=(title,list)=> (
    <div className="card" style={{padding:12,background:"#fff"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontWeight:600,fontSize:14}}>{title}</div>
        <span className="badge">{list.length} item(s)</span>
      </div>
      <ul style={{margin:0,paddingLeft:0,listStyle:"none"}}>
        {list.map(p=>(
          <li key={p.id} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:8,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>{p.title}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>Impact {p.impact} · Effort {p.effort} · {p.type}</div>
              </div>
              <button onClick={()=>onDelete(p.id)} className="btn btn-ghost" style={{color:"#ef4444"}}><Trash2 size={14}/> Remove</button>
            </div>
          </li>
        ))}
        {list.length===0 && <li style={{fontSize:12,color:"#6b7280"}}>—</li>}
      </ul>
    </div>
  );
  return (
    <div>
      <SectionHeader icon={SquareGanttChart} title="Project Priority Matrix" subtitle="Items auto‑placed by Impact & Effort. High‑Impact/High‑Effort appear in Strategic quadrant automatically."/>
      <div className="matrix">
        {CellBox("Quick Wins – High Impact / Low Effort", quadrants.Q1)}
        {CellBox("Strategic – High Impact / High Effort", quadrants.Q2)}
        {CellBox("Fill‑ins – Low Impact / Low Effort", quadrants.Q3)}
        {CellBox("Reconsider – Low Impact / High Effort", quadrants.Q4)}
      </div>
      <div className="card" style={{padding:12,fontSize:12,color:"#6b7280",marginTop:12}}>
        Guidance: Use the CI Board for idea capture. Submitted requests and promoted ideas are placed here using scores; review with Ops Manager/Sponsor to confirm initiation (SOP 4.1).
      </div>
    </div>
  );
}

function Dashboard({projects}){
  const byStatus = useMemo(()=>{
    const m={"Not Started":0,"In Progress":0,"At Risk":0,"Completed":0};
    projects.forEach(p=>m[p.status]=(m[p.status]||0)+1);
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[projects]);
  const comp = useMemo(()=>projects.map(p=>({name:(p.title.length>16?p.title.slice(0,16)+'…':p.title), completion:p.completion})),[projects]);
  return (
    <div>
      <SectionHeader icon={BarChart2} title="Interactive Dashboard" subtitle="Live view of project status and completion."/>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        <div className="card" style={{padding:12}}>
          <div style={{fontWeight:600,marginBottom:8}}>Status Distribution</div>
          <div style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={byStatus} outerRadius={90} label>{byStatus.map((_,i)=><Cell key={i} />)}</Pie>
                <Tooltip/><Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{padding:12}}>
          <div style={{fontWeight:600,marginBottom:8}}>Completion % by Project</div>
          <div style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comp}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip/><Legend/>
                <Bar dataKey="completion" name="Completion %">{comp.map((_,i)=><Cell key={i} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="card" style={{padding:12,fontSize:12,color:"#6b7280",marginTop:12}}>
        Charts show progress at a glance. Update Status & Completion % when re‑submitting or sync from your PM tool.
      </div>
    </div>
  );
}

function Templates({files,setFiles}){
  const onPick = (e)=>{
    const picked = Array.from(e.target.files||[]);
    setFiles(prev=>[...prev, ...picked.map(f=>({id:uid(),name:f.name,size:f.size}))]);
  };
  return (
    <div>
      <SectionHeader icon={Paperclip} title="Templates & Attachments" subtitle="Upload or reference standard templates (A3, DMAIC, FMEA, Time Study, etc.)."/>
      <div className="card" style={{padding:12,display:"flex",gap:12,justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:14}}><div style={{fontWeight:600}}>Template Library</div><div style={{fontSize:12,color:"#6b7280"}}>Attach files for quick access. Keep originals in the controlled OPEX folder.</div></div>
        <label className="btn btn-primary" style={{cursor:"pointer"}}>
          Add Attachments
          <input type="file" style={{display:"none"}} multiple onChange={onPick}/>
        </label>
      </div>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        {files.map(f=>(
          <div key={f.id} className="card" style={{padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:600,fontSize:14}}>{f.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{Math.round(f.size/1024)} KB</div></div>
            <button className="btn btn-ghost">Open</button>
          </div>
        ))}
        {files.length===0 && <div style={{fontSize:14,color:"#6b7280"}}>No attachments yet.</div>}
      </div>
    </div>
  );
}

function Help(){
  const steps=[
    {title:"Start with the Guide",desc:"Review the SOP summary (1.0–4.9). Each card has quick tips.",icon:BookOpen},
    {title:"Submit a Request",desc:"Open Project Request, fill details, set Impact/Effort — press Enter to submit.",icon:ClipboardList},
    {title:"Use CI Board",desc:"Capture ideas. Promote selected items to the Priority Matrix.",icon:Lightbulb},
    {title:"Prioritize",desc:"Matrix auto‑places items. Review Strategic & Quick Wins first.",icon:SquareGanttChart},
    {title:"Track",desc:"Watch status and completion on the Dashboard (colorful).",icon:BarChart2},
    {title:"Attach Templates",desc:"Upload A3, DMAIC, FMEA, Time Study sheets to keep things handy.",icon:Paperclip},
  ];
  return (
    <div>
      <SectionHeader icon={HelpCircle} title="How to use the OPEX Portal" subtitle="A quick path explaining what to do and where to go."/>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr"}}>
        {steps.map(s=>(
          <div key={s.title} className="card" style={{padding:12,display:"flex",gap:12}}>
            <s.icon size={20}/>
            <div><div style={{fontWeight:600}}>{s.title}</div><div style={{fontSize:14,color:"#6b7280"}}>{s.desc}</div></div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:12,fontSize:12,color:"#6b7280",marginTop:12}}>
        Keyboard: Use ← / → to move between sections, and Enter to trigger the primary action on the current view.
      </div>
    </div>
  );
}