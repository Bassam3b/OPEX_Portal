
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, ResponsiveContainer } from "recharts";

// ---- THEME ----
const theme = {
  brand: {
    primary: "#00A36C", // green
    surface: "#F7F9F8", // near-white
    text: "#1F2937", // gray-800
    accent: "#9CA3AF", // gray-400
    border: "#E5E7EB", // gray-200
  },
};

// ---- TYPES ----
const ImpactLevels = ["Low", "Medium", "High"] as const;
const EffortLevels = ["Low", "Medium", "High"] as const;
const Statuses = ["Requested", "Approved", "In Progress", "On Hold", "Completed"] as const;
const Types = ["Lean Six Sigma", "Kaizen", "Agile Sprint"] as const;

type Impact = typeof ImpactLevels[number];
type Effort = typeof EffortLevels[number];

type Project = {
  id: string;
  title: string;
  department: string;
  sponsor?: string;
  type: typeof Types[number];
  impact: Impact;
  effort: Effort;
  description?: string;
  costSAR?: number;
  expectedSavingsSAR?: number;
  attachments: { name: string; size: number; url?: string }[];
  status: typeof Statuses[number];
  completionPct: number; // 0..100
  createdAt: number;
};

type Idea = {
  id: string;
  title: string;
  owner?: string;
  department?: string;
  benefitNote?: string;
  effortNote?: string;
  stage: "To Evaluate" | "Under Review" | "Ready for Priority";
};

// ---- UTIL ----
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function quadrant(impact: Impact, effort: Effort) {
  const impHigh = impact === "High";
  const impLow = impact === "Low";
  const effHigh = effort === "High";
  const effLow = effort === "Low";
  if (impHigh && effLow) return { key: "Q1", label: "Quick Wins (High Impact • Low Effort)" };
  if (impHigh && effHigh) return { key: "Q2", label: "Major Projects (High Impact • High Effort)" };
  if (impLow && effLow) return { key: "Q3", label: "Fill‑ins (Low Impact • Low Effort)" };
  if (impLow && effHigh) return { key: "Q4", label: "Avoid/Defer (Low Impact • High Effort)" };
  // Any medium values fall back by effort then impact
  if (impHigh) return { key: effHigh ? "Q2" : "Q1", label: effHigh ? "Major Projects" : "Quick Wins" };
  if (impLow) return { key: effHigh ? "Q4" : "Q3", label: effHigh ? "Avoid/Defer" : "Fill‑ins" };
  // Medium impact
  if (effHigh) return { key: "Q2", label: "Major/Medium" };
  if (effLow) return { key: "Q1", label: "Quick/Medium" };
  return { key: "Q3", label: "Medium" };
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

// ---- MAIN APP ----
export default function OpexApp() {
  const tabs = [
    { key: "guide", label: "Guide" },
    { key: "request", label: "Project Request" },
    { key: "ci", label: "CI Board" },
    { key: "matrix", label: "Priority Matrix" },
    { key: "dashboard", label: "Dashboard" },
    { key: "templates", label: "Templates & Attachments" },
  ] as const;

  const [activeIndex, setActiveIndex] = useState(0);

  // Projects & Ideas state
  const [projects, setProjects] = useState<Project[]>(() => { try { const raw = localStorage.getItem("opex_projects_v1"); return raw ? JSON.parse(raw) : []; } catch { return []; } });
  const [ideas, setIdeas] = useState<Idea[]>(() => { try { const raw = localStorage.getItem("opex_ideas_v1"); if (raw) return JSON.parse(raw); } catch {} return [
    { id: uid("idea"), title: "Reduce changeover on Extruder L4 (SMED)", stage: "To Evaluate", department: "Production" },
    { id: uid("idea"), title: "Barcode error‑proofing at packing (Poka Yoke)", stage: "Under Review", department: "QA" },
  ]; });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Templates library (files uploaded in Templates tab)
  const [library, setLibrary] = useState<{ name: string; size: number; url?: string }[]>(() => {
    try { const raw = localStorage.getItem("opex_library_v1"); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  // Keyboard navigation across tabs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => Math.min(i + 1, tabs.length - 1));
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        // Trigger default actions per tab
        const key = tabs[activeIndex].key;
        if (key === "request") {
          const btn = document.getElementById("submit-request-btn") as HTMLButtonElement | null;
          btn?.click();
        } else if (key === "ci") {
          const btn = document.getElementById("quick-add-idea-btn") as HTMLButtonElement | null;
          btn?.click();
        } else if (key === "templates") {
          const input = document.getElementById("upload-input") as HTMLInputElement | null;
          input?.click();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

    // Persist to localStorage whenever state changes
  useEffect(() => { try { localStorage.setItem("opex_projects_v1", JSON.stringify(projects)); } catch {} }, [projects]);
  useEffect(() => { try { localStorage.setItem("opex_ideas_v1", JSON.stringify(ideas)); } catch {} }, [ideas]);
  useEffect(() => { try { localStorage.setItem("opex_library_v1", JSON.stringify(library)); } catch {} }, [library]);

  // Derived data
  const projectsByQuadrant = useMemo(() => {
    const map: Record<string, Project[]> = { Q1: [], Q2: [], Q3: [], Q4: [] };
    projects.forEach((p) => {
      const q = quadrant(p.impact, p.effort).key as keyof typeof map;
      map[q].push(p);
    });
    return map;
  }, [projects]);

  return (
    <div className="min-h-screen" style={{
      // CSS variables for theme
      // @ts-ignore
      '--primary': theme.brand.primary,
      '--surface': theme.brand.surface,
      '--text': theme.brand.text,
      '--accent': theme.brand.accent,
      '--border': theme.brand.border,
      background: 'var(--surface)'
    }}>
      <Header activeIndex={activeIndex} tabs={tabs as any} setActiveIndex={setActiveIndex} />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6" style={{ color: 'var(--text)' }}>
        {activeIndex === 0 && <Guide />}
        {activeIndex === 1 && (
          <ProjectRequest
            onSubmit={(p) => setProjects((prev) => [p, ...prev])}
          />
        )}
        {activeIndex === 2 && (
          <CIBoard
            ideas={ideas}
            setIdeas={setIdeas}
            onPromote={(idea) => {
              const draft: Project = {
                id: uid("proj"),
                title: idea.title,
                department: idea.department || "",
                sponsor: "",
                type: "Kaizen",
                impact: "High",
                effort: "Medium",
                attachments: [],
                status: "Requested",
                completionPct: 0,
                createdAt: Date.now(),
              } as Project;
              setProjects((prev) => [draft, ...prev]);
              setActiveIndex(3);
            }}
          />
        )}
        {activeIndex === 3 && (
          <PriorityMatrix
            projectsByQuadrant={projectsByQuadrant}
            projects={projects}
            setProjects={setProjects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
          />
        )}
        {activeIndex === 4 && <Dashboard projects={projects} />}
        {activeIndex === 5 && <TemplatesArea projects={projects} library={library} setLibrary={setLibrary} />}
      </main>

      <Footer />
      <KeyShortcuts />
    </div>
  );
}

// ---- HEADER ----
function Header({ activeIndex, tabs, setActiveIndex }: any) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl" style={{ background: `linear-gradient(135deg, ${theme.brand.primary}, #38B2AC)` }} />
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Neproplast • OPEX Portal</h1>
            <p className="text-xs text-gray-500">SOP‑N‑25‑004 — interactive guide & tools (sections 1.0–4.9)</p>
          </div>
        </div>
        <nav className="hidden gap-1 md:flex">
          {tabs.map((t: any, i: number) => (
            <button
              key={t.key}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                i === activeIndex
                  ? "bg-[var(--primary)]/10 text-gray-900 ring-1 ring-[var(--primary)]"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="border-t bg-gray-50 px-4 py-2 text-center text-xs text-gray-600">
        Use ← → to switch sections • Press Enter for the main action in each section • Click the “?” bubble for tips.
      </div>
    </header>
  );
}

// ---- GUIDE ----
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-base font-semibold text-gray-800">{title}</h3>
      <div className="prose prose-sm max-w-none text-gray-700">
        {children}
      </div>
    </div>
  );
}

function Guide() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border bg-gradient-to-br from-white to-green-50 p-6">
          <h2 className="text-xl font-bold text-gray-800">Welcome to the OPEX Portal</h2>
          <p className="mt-2 text-sm text-gray-700">
            This app guides you through Neproplast’s Operational Excellence procedure (SOP‑N‑25‑004) from the beginning
            up to section <strong>4.9</strong>.
            It helps you submit projects, triage ideas on the <em>CI Board</em>, prioritize via the <em>Project Priority Matrix</em>,
            and track status on an interactive dashboard.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <li>• Projects can be <strong>requested</strong>, <strong>printed</strong>, and <strong>submitted</strong> here.</li>
            <li>• Ideas move from <strong>CI Board → Priority Matrix</strong> automatically.</li>
            <li>• High‑impact + High‑effort items are flagged on the <strong>Priority board</strong>.</li>
            <li>• Upload and access all <strong>templates</strong> within the app.</li>
          </ul>
        </div>

        <SectionCard title="4.1 OPEX Project Engagement & Intake">
          <ul>
            <li>Where ideas come from: departmental observations, audits, complaints, headcount studies, RF1/VMOST reviews, leadership priorities, and the <strong>CI Board</strong>.</li>
            <li>Who initiates: department managers/supervisors or OPEX team via the <em>Project Request</em> form.</li>
            <li>Who sponsors: the accountable department or executive for the affected area; oversight by the OPEX Section Head/CI Engineer.</li>
            <li>Evaluation criteria: urgency, strategic alignment, capacity, ROI.</li>
          </ul>
        </SectionCard>

        <SectionCard title="4.2 Project Types">
          <ul>
            <li><strong>Lean Six Sigma</strong> — medium+ scope, data‑driven, typically ≥6 weeks; template provided; completion signature required.</li>
            <li><strong>Kaizen</strong> — focused one‑week blitz for quick wins; A3 template; completion signature.</li>
            <li><strong>Agile Sprint</strong> — 2–3 weeks, iterative, sponsor actively participates; A3 template; completion signature.</li>
          </ul>
        </SectionCard>

        <SectionCard title="4.3 Tools & Techniques (selected)">
          <ul>
            <li>ASME Flow Process Charting; Activity Sampling & Time Study for workforce optimization.</li>
            <li>Value Stream Mapping (VSM); Pareto; Root Cause (Fishbone, 5 Whys).</li>
            <li>FMEA for risk mitigation; <strong>SMED</strong> for faster changeovers; <strong>Poka‑Yoke</strong> for error‑proofing.</li>
          </ul>
        </SectionCard>

        <SectionCard title="4.4–4.9 Governance & Rhythm">
          <ul>
            <li><strong>Approval & Docs</strong> — use standard templates; maintain central repository; audits ensure compliance.</li>
            <li><strong>Document Control</strong> — versioned templates (A3, Six Sigma YB, FMEA) with naming conventions.</li>
            <li><strong>KPIs</strong> — on‑time completion, savings/productivity, project count, participation, sustainability.</li>
            <li><strong>Lean Champions</strong> — one per department; monthly huddles; at least one idea each 6 months.</li>
            <li><strong>Communication & Training</strong> — weekly updates; quarterly reviews; regular training and mentoring.</li>
            <li><strong>VMOST Review (4.9)</strong> — weekly A0 master schedule checks; monthly RF1 management review.</li>
          </ul>
        </SectionCard>
      </div>

      <div className="space-y-6">
        <Tips />
        <MiniHowTo />
      </div>
    </div>
  );
}

function Tips() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">i</span>
        <h3 className="text-sm font-semibold text-gray-800">Simple tips</h3>
      </div>
      <ul className="list-disc pl-5 text-sm text-gray-700">
        <li>Use the <strong>Project Request</strong> tab to start. Press <kbd>Enter</kbd> to submit.</li>
        <li>Move ideas across CI stages; press <kbd>Enter</kbd> for quick‑add.</li>
        <li>In the <strong>Matrix</strong>, click a project to select; change impact/effort from its card.</li>
        <li>Upload templates in <strong>Templates & Attachments</strong>. Press <kbd>Enter</kbd> to open the uploader.</li>
        <li>Use ← → to change sections at any time.</li>
      </ul>
    </div>
  );
}

function MiniHowTo() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">What to do & where to go</h3>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
        <li>Read the <strong>Guide</strong> (this page) for the SOP overview.</li>
        <li>Open <strong>Project Request</strong>, complete the form, and submit/print.</li>
        <li>Capture improvement ideas on the <strong>CI Board</strong>.</li>
        <li>Prioritize via <strong>Priority Matrix</strong> — projects place themselves based on impact/effort.</li>
        <li>Track progress on the <strong>Dashboard</strong>.</li>
        <li>Find all official <strong>templates</strong> under <em>Templates & Attachments</em>.</li>
      </ol>
    </div>
  );
}

// ---- PROJECT REQUEST FORM ----
function ProjectRequest({ onSubmit }: { onSubmit: (p: Project) => void }) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [type, setType] = useState<typeof Types[number]>("Kaizen");
  const [impact, setImpact] = useState<Impact>("High");
  const [effort, setEffort] = useState<Effort>("Medium");
  const [cost, setCost] = useState<string>("");
  const [savings, setSavings] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<{ name: string; size: number; url?: string }[]>([]);

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (!f) return;
    const list = Array.from(f).map((file) => ({ name: file.name, size: file.size, url: URL.createObjectURL(file) }));
    setFiles((prev) => [...prev, ...list]);
  };

  const submit = () => {
    if (!title || !department) {
      alert("Please enter a Title and Department.");
      return;
    }
    const p: Project = {
      id: uid("proj"),
      title,
      department,
      sponsor,
      type,
      impact,
      effort,
      description: desc,
      costSAR: cost ? Number(cost) : undefined,
      expectedSavingsSAR: savings ? Number(savings) : undefined,
      attachments: files,
      status: "Requested",
      completionPct: 0,
      createdAt: Date.now(),
    };
    onSubmit(p);
    alert("Project submitted. It will appear in the Priority Matrix according to Impact/Effort.");
    setTitle("");
    setDepartment("");
    setSponsor("");
    setType("Kaizen");
    setImpact("High");
    setEffort("Medium");
    setCost("");
    setSavings("");
    setDesc("");
    setFiles([]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800">OPEX Project Request Form</h2>
        <p className="mt-1 text-sm text-gray-600">Fill, print if needed, and submit. High‑impact + High‑effort will be placed in the Priority board automatically.</p>

        <form ref={formRef} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Project Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Department</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Sponsor</label>
            <input value={sponsor} onChange={(e) => setSponsor(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Project Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]">
              {Types.map((t) => (<option key={t}>{t}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Impact</label>
              <select value={impact} onChange={(e) => setImpact(e.target.value as Impact)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]">
                {ImpactLevels.map((v) => (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-700">Effort</label>
              <select value={effort} onChange={(e) => setEffort(e.target.value as Effort)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]">
                {EffortLevels.map((v) => (<option key={v}>{v}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700">Estimated Cost (SAR)</label>
            <input inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Expected Savings (SAR)</label>
            <input inputMode="numeric" value={savings} onChange={(e) => setSavings(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Attachments</label>
            <div className="mt-1 flex items-center gap-3">
              <input id="upload-input" type="file" multiple onChange={handleUpload} className="hidden" />
              <button type="button" onClick={() => document.getElementById("upload-input")?.click()} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                📎 Add files
              </button>
              <span className="text-xs text-gray-500">Upload A3, FMEA, Six Sigma YB, etc.</span>
            </div>
            {files.length > 0 && (
              <ul className="mt-2 divide-y rounded-xl border">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2"><span>📄</span><span>{f.name}</span></div>
                    <div className="flex items-center gap-3">
                      {f.url && <a href={f.url} download className="text-xs text-green-700 hover:underline">Download</a>}
                      <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-xs text-red-600">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 md:col-span-2">
            <button id="submit-request-btn" type="submit" className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95">Submit</button>
            <button type="button" onClick={() => window.print()} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50">Print</button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">Tips for completing the form</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>Choose Impact and Effort to auto‑place the project on the Matrix.</li>
            <li>Use the correct type: Kaizen (1 week), Agile Sprint (2–3 weeks), Lean Six Sigma (6+ weeks).</li>
            <li>Attach templates as needed (A3, FMEA, Time Study, etc.).</li>
            <li>Press Enter anytime to submit.</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-800">Priority rule</h3>
          <p className="text-sm text-gray-700">Projects set to High Impact & High Effort are highlighted on the Priority board and in the Dashboard.</p>
        </div>
      </div>
    </div>
  );
}

// ---- CI BOARD ----
function CIBoard({ ideas, setIdeas, onPromote }: { ideas: Idea[]; setIdeas: (i: Idea[]) => void; onPromote: (idea: Idea) => void }) {
  const stages: Idea["stage"][] = ["To Evaluate", "Under Review", "Ready for Priority"];
  const [newIdea, setNewIdea] = useState("");

  const move = (id: string, dir: 1 | -1) => {
    setIdeas(
      ideas.map((it) => {
        if (it.id !== id) return it;
        const idx = stages.indexOf(it.stage);
        const next = Math.min(Math.max(idx + dir, 0), stages.length - 1);
        return { ...it, stage: stages[next] };
      })
    );
  };

  const quickAdd = () => {
    if (!newIdea.trim()) return;
    setIdeas([{ id: uid("idea"), title: newIdea.trim(), stage: "To Evaluate" }, ...ideas]);
    setNewIdea("");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="Quick idea..."
          className="w-64 rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button id="quick-add-idea-btn" onClick={quickAdd} className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white">Add</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage} className="rounded-2xl border bg-white p-3">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">{stage}</h3>
            <div className="space-y-2">
              {ideas.filter((i) => i.stage === stage).map((i) => (
                <div key={i.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{i.title}</p>
                      {i.department && <p className="text-xs text-gray-500">{i.department}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => move(i.id, -1)} className="rounded-lg border bg-white px-2 py-1 text-xs">←</button>
                      <button onClick={() => move(i.id, 1)} className="rounded-lg border bg-white px-2 py-1 text-xs">→</button>
                    </div>
                  </div>
                  {stage === "Ready for Priority" && (
                    <div className="mt-2">
                      <button onClick={() => { onPromote(i); setIdeas(ideas.filter(x => x.id !== i.id)); }} className="rounded-lg bg-[var(--primary)] px-2 py-1 text-xs font-semibold text-white">Send to Priority Matrix</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- PRIORITY MATRIX ----
function PriorityMatrix({ projectsByQuadrant, projects, setProjects, selectedProjectId, setSelectedProjectId }: any) {
  const quadrants = [
    { key: "Q1", title: "Quick Wins", subtitle: "High Impact • Low Effort" },
    { key: "Q2", title: "Major Projects", subtitle: "High Impact • High Effort" },
    { key: "Q3", title: "Fill‑ins", subtitle: "Low Impact • Low Effort" },
    { key: "Q4", title: "Avoid/Defer", subtitle: "Low Impact • High Effort" },
  ];

  const updateProject = (id: string, patch: Partial<Project>) => {
    setProjects(projects.map((p: Project) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-4">
          {quadrants.map((q) => (
            <div key={q.key} className="rounded-2xl border bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{q.title}</h3>
                  <p className="text-xs text-gray-500">{q.subtitle}</p>
                </div>
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">{projectsByQuadrant[q.key]?.length || 0}</span>
              </div>

              <div className="space-y-2">
                {(projectsByQuadrant[q.key] || []).map((p: Project) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 transition",
                      selectedProjectId === p.id ? "ring-2 ring-[var(--primary)]" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.title}</p>
                        <p className="text-xs text-gray-500">{p.department} • {p.type}</p>
                      </div>
                      <span className="text-xs text-gray-500">{p.completionPct}%</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>Impact: {p.impact}</span>
                      <span>Effort: {p.effort}</span>
                      <span>Status: {p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel for selected project */}
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">Selected Project</h3>
          {!selectedProjectId ? (
            <p className="text-sm text-gray-600">Click a project to view and edit its details.</p>
          ) : (
            (() => {
              const p = projects.find((x: Project) => x.id === selectedProjectId)!;
              return (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Title</label>
                    <input value={p.title} onChange={(e) => updateProject(p.id, { title: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Impact</label>
                      <select value={p.impact} onChange={(e) => updateProject(p.id, { impact: e.target.value as Impact })} className="mt-1 w-full rounded-xl border px-3 py-2">
                        {ImpactLevels.map((v) => (<option key={v}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Effort</label>
                      <select value={p.effort} onChange={(e) => updateProject(p.id, { effort: e.target.value as Effort })} className="mt-1 w-full rounded-xl border px-3 py-2">
                        {EffortLevels.map((v) => (<option key={v}>{v}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <select value={p.status} onChange={(e) => updateProject(p.id, { status: e.target.value as any })} className="mt-1 w-full rounded-xl border px-3 py-2">
                        {Statuses.map((s) => (<option key={s}>{s}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Completion %</label>
                      <input type="number" min={0} max={100} value={p.completionPct} onChange={(e) => updateProject(p.id, { completionPct: Math.min(100, Math.max(0, Number(e.target.value))) })} className="mt-1 w-full rounded-xl border px-3 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Description</label>
                    <textarea value={p.description || ""} onChange={(e) => updateProject(p.id, { description: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" />
                  </div>
                  {p.attachments && p.attachments.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500">Attachments</label>
                      <ul className="mt-1 divide-y rounded-xl border">
                        {p.attachments.map((a: { name: string; size: number; url?: string }, ai: number) => (
                          <li key={ai} className="flex items-center justify-between px-3 py-2 text-xs">
                            <span className="truncate">📄 {a.name}</span>
                            <button onClick={() => updateProject(p.id, { attachments: p.attachments.filter((_: { name: string; size: number; url?: string }, idx: number) => idx !== ai) })} className="text-red-600">Remove</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">Priority Board (High‑High)</h3>
          {projects.filter((p: Project) => p.impact === "High" && p.effort === "High").length === 0 ? (
            <p className="text-sm text-gray-600">No High‑Impact & High‑Effort projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects
                .filter((p: Project) => p.impact === "High" && p.effort === "High")
                .map((p: Project) => (
                  <li key={p.id} className="rounded-xl border bg-gray-50 p-2 text-sm">
                    {p.title}
                    <span className="ml-2 text-xs text-gray-500">{p.department}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- DASHBOARD ----
function Dashboard({ projects }: { projects: Project[] }) {
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    Statuses.forEach((s) => (map[s] = 0));
    projects.forEach((p) => (map[p.status] = (map[p.status] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const byQuadrant = useMemo(() => {
    const counts: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    projects.forEach((p) => counts[quadrant(p.impact, p.effort).key]++);
    return [
      { name: "Q1 Quick Wins", value: counts.Q1 },
      { name: "Q2 Major", value: counts.Q2 },
      { name: "Q3 Fill‑ins", value: counts.Q3 },
      { name: "Q4 Avoid", value: counts.Q4 },
    ];
  }, [projects]);

  const completionData = useMemo(() => {
    return projects
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((p, i) => ({ name: `P${i + 1}`, Completion: p.completionPct }));
  }, [projects]);

  const colors = ["#00A36C", "#6B7280", "#10B981", "#94A3B8", "#16A34A", "#4ADE80"]; // green/gray palette

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Projects by Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90}>
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Projects by Priority Quadrant</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byQuadrant}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value">
                {byQuadrant.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 lg:col-span-2">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Completion Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="Completion" stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---- TEMPLATES ----
function TemplatesArea({ projects, library, setLibrary }: { projects: Project[]; library: { name: string; size: number; url?: string }[]; setLibrary: React.Dispatch<React.SetStateAction<{ name: string; size: number; url?: string }[]>> }) {
    const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list = Array.from(e.target.files).map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) }));
    setLibrary((prev) => [...prev, ...list]);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Upload official templates</h3>
        <input id="upload-input" type="file" multiple onChange={onUpload} className="hidden" />
        <button onClick={() => document.getElementById("upload-input")?.click()} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">📎 Upload files</button>
        <ul className="mt-3 divide-y rounded-xl border">
          {library.length === 0 && <li className="px-3 py-2 text-sm text-gray-600">No files yet.</li>}
          {library.map((f, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
              <div className="flex items-center gap-2"><span>📄</span>{f.name}</div>
              <div className="flex items-center gap-3">
                {f.url && <a href={f.url} download className="text-xs text-green-700 hover:underline">Download</a>}
                <button onClick={() => setLibrary(library.filter((_, idx) => idx !== i))} className="text-xs text-red-600">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-500">Recommended: A3, FMEA, VSM, Time Study, Six Sigma YB, CI idea sheet, etc.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Project attachments (most recent first)</h3>
        <ul className="space-y-2">
          {projects.slice(0, 6).map((p) => (
            <li key={p.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.department} • {p.type}</p>
                </div>
                <span className="text-xs text-gray-500">{p.attachments.length} files</span>
              </div>
              {p.attachments.length > 0 && (
                <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {p.attachments.map((a, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border bg-gray-50 px-2 py-1 text-xs">
                      <span className="truncate">📄 {a.name}</span>
                      {a.url && <a href={a.url} download className="text-green-700">Download</a>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---- FOOTER & HELP ----
function Footer() { return null; }

function KeyShortcuts() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg focus:outline-none"
        title="Help"
      >
        ?
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div className="max-w-lg rounded-2xl border bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800">Keyboard shortcuts</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
              <li><kbd>←</kbd> / <kbd>→</kbd> — switch sections</li>
              <li><kbd>Enter</kbd> — main action in each section (submit form, quick‑add idea, open uploader)</li>
              <li>Tab through inputs to edit; everything is also clickable with the mouse</li>
            </ul>
            <div className="mt-4 text-right">
              <button onClick={() => setOpen(false)} className="rounded-xl border px-3 py-1 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
