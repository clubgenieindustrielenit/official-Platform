"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  addToast: (type: "success" | "error" | "info", msg: string) => void;
}

const DEFAULT_ROADMAPS = [
  {
    icon: "TrendingUp",
    title: "Supply Chain & Logistique",
    role: "Supply Chain Manager, Ingénieur Logistique",
    description: "L'art de piloter les flux physiques et d'information de bout en bout avec une efficacité maximale et des coûts optimisés.",
    skills: ["Gestion des stocks & Approvisionnements", "Transport, Distribution & Logistique Verte", "Global Supply Chain & S&OP"],
    tools: ["SAP ERP", "Advanced Planning & Scheduling (APS)", "Logiciels de routage (VRP)"],
  },
  {
    icon: "Factory",
    title: "Gestion de Production",
    role: "Responsable Production, Ingénieur Méthodes",
    description: "Planifier, ordonnancer et fabriquer en minimisant les gaspillages et en maximisant la productivité.",
    skills: ["MRP / ERP & Ordonnancement", "Lean Manufacturing (Gaspillages, VSM)", "Système Juste-à-Temps & Kanban"],
    tools: ["Jira / Trello", "MS Project / Primavera", "Systèmes MES (Manufacturing Execution Systems)"],
  },
  {
    icon: "ShieldCheck",
    title: "Qualité & Amélioration Continue",
    role: "Ingénieur Qualité, Black Belt Lean Six Sigma",
    description: "Garantir la conformité et installer une culture d'amélioration permanente pour atteindre le zéro défaut.",
    skills: ["Méthodologie Six Sigma (DMAIC)", "Outils Lean (5S, Kaizen, SMED, Poka-Yoke)", "Normes ISO 9001, 14001, 45001"],
    tools: ["Minitab (Analyse statistique)", "Diagramme d'Ishikawa / Pareto", "FMEA (AMDEC)"],
  },
  {
    icon: "LineChart",
    title: "Recherche Opérationnelle",
    role: "Ingénieur R&D, Data Analyst Industriel",
    description: "Utiliser les mathématiques appliquées et l'informatique pour prendre les meilleures décisions possibles.",
    skills: ["Modélisation mathématique & Optimisation", "Simulation de flux et d'événements discrets", "Théorie des graphes & Aide à la décision"],
    tools: ["Python (PuLP, SciPy)", "Gurobi / CPLEX", "Arena / FlexSim (Simulation de flux)"],
  },
  {
    icon: "Cpu",
    title: "Industrie 4.0 & Maintenance",
    role: "Ingénieur Industrie 4.0, Responsable Maintenance",
    description: "Intégrer le digital au cœur de l'usine physique pour la rendre intelligente, flexible et prédictive.",
    skills: ["Smart Factory & IoT Industriel", "Maintenance Prédictive & GMAO", "Jumeaux numériques (Digital Twins)"],
    tools: ["Node-RED / Plateformes IoT", "Logiciels GMAO", "SCADA & Automates Programmables (API)"],
  },
  {
    icon: "ClipboardList",
    title: "Gestion de Projets & Économie",
    role: "Chef de Projet Industriel, Auditeur de processus",
    description: "Piloter des projets complexes multidisciplinaires en maîtrisant les budgets, les délais et les risques.",
    skills: ["Management de projet (PMBOK, Agile/Scrum)", "Gestion des risques industriels & financiers", "Ingénierie financière & Analyse de rentabilité"],
    tools: ["MS Project", "Analyse de sensibilité financière", "Matrice de criticité (Risk Register)"],
  },
];

const DEFAULT_DEVS = [
  { name: "Khalil Ben Ahmed", role: "Lead Fullstack Developer", linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "Yassine Mansour", role: "UI/UX & Frontend Engineer", linkedin: "https://linkedin.com", github: "https://github.com" },
  { name: "Aymen Ben Ali", role: "Backend & Cloud Architect", linkedin: "https://linkedin.com", github: "https://github.com" },
];

// ─── helpers ────────────────────────────────────────────────
const inputCls = "w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-4 text-[#e2e2e2] text-sm outline-none transition-all focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-[#555]";
const labelCls = "text-xs font-semibold text-[#888] uppercase tracking-wider mb-1.5 block";
const cardCls = "bg-[#14213d] border border-[#333535] hover:border-custom-amber/30 rounded-2xl p-6 transition-colors space-y-4";
const saveBtn = "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer";

function SectionCard({ title, children, onSave, saving }: { title: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <div className={cardCls}>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {children}
      <button onClick={onSave} disabled={saving} className={saveBtn}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Sauvegarder
      </button>
    </div>
  );
}

// ─── main component ─────────────────────────────────────────
export default function ContenuTab({ addToast }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Hero
  const [hero, setHero] = useState({ badge: "", title: "", titleAccent: "", subtitle: "", cta1: "", cta2: "" });
  // About
  const [about, setAbout] = useState({ title: "", description: "", stats: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }] });
  // WhyUs
  const [whyUs, setWhyUs] = useState([{ icon: "Users", title: "", description: "" }, { icon: "Heart", title: "", description: "" }, { icon: "Target", title: "", description: "" }]);
  // Roadmaps
  const [roadmaps, setRoadmaps] = useState<{ icon: string; title: string; description: string; role?: string; tools?: string[]; skills: string[] }[]>(DEFAULT_ROADMAPS);
  // Developers
  const [devs, setDevs] = useState<{ name: string; role: string; photo_url?: string; linkedin?: string; github?: string }[]>(DEFAULT_DEVS);
  const [devPhotoFiles, setDevPhotoFiles] = useState<Record<number, File>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("site_content").select("section,content");
      if (!data) return;
      data.forEach(({ section, content }: any) => {
        if (section === "hero") setHero({ badge: content.badge ?? "", title: content.title ?? "", titleAccent: content.titleAccent ?? "", subtitle: content.subtitle ?? "", cta1: content.cta1 ?? "", cta2: content.cta2 ?? "" });
        if (section === "about") setAbout({ title: content.title ?? "", description: content.description ?? "", stats: content.stats ?? [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }] });
        if (section === "why_us") setWhyUs(content.pillars ?? whyUs);
        if (section === "roadmaps") {
          const items = content.items || [];
          if (items.length > 0) {
            const merged = DEFAULT_ROADMAPS.map((def, idx) => {
              const item = items[idx];
              if (!item) return def;
              return {
                ...def,
                ...item,
                role: item.role || def.role,
                skills: (item.skills && item.skills.length > 0) ? item.skills : def.skills,
                tools: (item.tools && item.tools.length > 0) ? item.tools : def.tools,
              };
            });
            if (items.length > DEFAULT_ROADMAPS.length) {
              setRoadmaps(merged.concat(items.slice(DEFAULT_ROADMAPS.length)));
            } else {
              setRoadmaps(merged);
            }
          }
        }
        if (section === "developers") setDevs(content.items && content.items.length > 0 ? content.items : DEFAULT_DEVS);
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const save = async (section: string, content: object) => {
    setSaving(section);
    try {
      const { error } = await supabase.from("site_content").upsert({ section, content, updated_at: new Date().toISOString() }, { onConflict: "section" });
      if (error) throw error;
      addToast("success", "Section mise à jour !");
    } catch (err: any) {
      addToast("error", err.message || "Erreur de sauvegarde.");
    } finally {
      setSaving(null);
    }
  };

  const uploadDevPhoto = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `dev_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("developers").upload(filename, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data: u } = supabase.storage.from("developers").getPublicUrl(data.path);
    return u.publicUrl;
  };

  const saveDevs = async () => {
    setSaving("developers");
    try {
      const updated = [...devs];
      for (const [idxStr, file] of Object.entries(devPhotoFiles)) {
        const idx = Number(idxStr);
        updated[idx].photo_url = await uploadDevPhoto(file);
      }
      setDevPhotoFiles({});
      await save("developers", { items: updated });
      setDevs(updated);
    } catch (err: any) {
      addToast("error", err.message || "Erreur upload photo.");
      setSaving(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-custom-amber animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-custom-amber" />
        <div>
          <h2 className="text-2xl font-bold text-white">Contenu du site</h2>
          <p className="text-sm text-[#888] mt-0.5">Modifiez le contenu affiché sur le site public. Les changements sont appliqués instantanément.</p>
        </div>
      </div>

      {/* ── HERO ── */}
      <SectionCard title="🏠 Hero — Page d'accueil" onSave={() => save("hero", hero)} saving={saving === "hero"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([["badge", "Texte du badge"], ["title", "Titre principal"], ["titleAccent", "Mot accentué en amber"], ["subtitle", "Sous-titre"], ["cta1", "Bouton CTA 1"], ["cta2", "Bouton CTA 2"]] as [keyof typeof hero, string][]).map(([key, lbl]) => (
            <div key={key} className={key === "subtitle" ? "sm:col-span-2" : ""}>
              <label className={labelCls}>{lbl}</label>
              {key === "subtitle" ? (
                <textarea rows={3} value={hero[key]} onChange={(e) => setHero({ ...hero, [key]: e.target.value })} className={inputCls + " resize-none"} />
              ) : (
                <input type="text" value={hero[key]} onChange={(e) => setHero({ ...hero, [key]: e.target.value })} className={inputCls} />
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── ABOUT ── */}
      <SectionCard title="🏛️ À Propos & Historique" onSave={() => save("about", about)} saving={saving === "about"}>
        <div>
          <label className={labelCls}>Titre</label>
          <input type="text" value={about.title} onChange={(e) => setAbout({ ...about, title: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Description principale</label>
          <textarea rows={6} value={about.description} onChange={(e) => setAbout({ ...about, description: e.target.value })} className={inputCls + " resize-none"} />
        </div>
        <div>
          <label className={labelCls}>Statistiques</label>
          <div className="grid grid-cols-3 gap-3">
            {about.stats.map((s, i) => (
              <div key={i} className="space-y-2">
                <input placeholder="Valeur" value={s.value} onChange={(e) => { const ss = [...about.stats]; ss[i] = { ...ss[i], value: e.target.value }; setAbout({ ...about, stats: ss }); }} className={inputCls + " text-center"} />
                <input placeholder="Label" value={s.label} onChange={(e) => { const ss = [...about.stats]; ss[i] = { ...ss[i], label: e.target.value }; setAbout({ ...about, stats: ss }); }} className={inputCls + " text-center text-xs"} />
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── WHY US ── */}
      <SectionCard title="✨ Pourquoi Nous" onSave={() => save("why_us", { pillars: whyUs })} saving={saving === "why_us"}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {whyUs.map((p, i) => (
            <div key={i} className="bg-[#0c0d0d] border-l-[3px] border-custom-amber rounded-xl p-4 space-y-3">
              <div>
                <label className={labelCls}>Icône</label>
                <select value={p.icon} onChange={(e) => { const w = [...whyUs]; w[i] = { ...w[i], icon: e.target.value }; setWhyUs(w); }} className={inputCls}>
                  {["Users","Target","Heart","Zap","Shield","Flame","Trophy","Rocket"].map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Titre</label>
                <input value={p.title} onChange={(e) => { const w = [...whyUs]; w[i] = { ...w[i], title: e.target.value }; setWhyUs(w); }} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={p.description} onChange={(e) => { const w = [...whyUs]; w[i] = { ...w[i], description: e.target.value }; setWhyUs(w); }} className={inputCls + " resize-none"} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── ROADMAPS ── */}
      <SectionCard title="🗺️ Roadmaps Industrielles" onSave={() => save("roadmaps", { items: roadmaps })} saving={saving === "roadmaps"}>
        <div className="space-y-3">
          {roadmaps.map((rm, i) => (
            <div key={i} className="bg-[#0c0d0d] border border-[#333535] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (i === 0) return; const r = [...roadmaps]; [r[i-1],r[i]]=[r[i],r[i-1]]; setRoadmaps(r); }} className="p-1.5 text-[#666] hover:text-white cursor-pointer"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => { if (i === roadmaps.length-1) return; const r = [...roadmaps]; [r[i],r[i+1]]=[r[i+1],r[i]]; setRoadmaps(r); }} className="p-1.5 text-[#666] hover:text-white cursor-pointer"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <button onClick={() => setRoadmaps(roadmaps.filter((_,j)=>j!==i))} className="p-1.5 text-[#666] hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Icône</label>
                  <select value={rm.icon} onChange={(e)=>{const r=[...roadmaps];r[i]={...r[i],icon:e.target.value};setRoadmaps(r);}} className={inputCls}>
                    {["Truck","Factory","ShieldCheck","Calculator","Cpu","FolderKanban","TrendingUp","LineChart","ClipboardList"].map(ic=><option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Titre</label>
                  <input value={rm.title} onChange={(e)=>{const r=[...roadmaps];r[i]={...r[i],title:e.target.value};setRoadmaps(r);}} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Métier Cible</label>
                <input value={rm.role || ""} onChange={(e)=>{const r=[...roadmaps];r[i]={...r[i],role:e.target.value};setRoadmaps(r);}} className={inputCls} placeholder="ex: Supply Chain Manager, Ingénieur Logistique" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={rm.description} onChange={(e)=>{const r=[...roadmaps];r[i]={...r[i],description:e.target.value};setRoadmaps(r);}} className={inputCls+" resize-none"} />
              </div>
              <div>
                <label className={labelCls}>Compétences / Concepts Clés</label>
                <div className="space-y-2">
                  {(rm.skills || []).map((sk,j)=>(
                    <div key={j} className="flex gap-2">
                      <input value={sk} onChange={(e)=>{const r=[...roadmaps];r[i].skills=r[i].skills.map((s,k)=>k===j?e.target.value:s);setRoadmaps(r);}} className={inputCls} />
                      <button onClick={()=>{const r=[...roadmaps];r[i].skills=r[i].skills.filter((_,k)=>k!==j);setRoadmaps(r);}} className="p-2 text-[#666] hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {(rm.skills || []).length < 10 && (
                    <button onClick={()=>{const r=[...roadmaps];r[i].skills=[...(r[i].skills||[]),""];setRoadmaps(r);}} className="text-xs text-custom-amber hover:text-[#ffc887] font-semibold flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Ajouter une compétence
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Outils & Systèmes Clés</label>
                <div className="space-y-2">
                  {(rm.tools || []).map((tool,j)=>(
                    <div key={j} className="flex gap-2">
                      <input value={tool} onChange={(e)=>{const r=[...roadmaps];const t=[...(r[i].tools||[])];t[j]=e.target.value;r[i].tools=t;setRoadmaps(r);}} className={inputCls} />
                      <button onClick={()=>{const r=[...roadmaps];r[i].tools=(r[i].tools||[]).filter((_,k)=>k!==j);setRoadmaps(r);}} className="p-2 text-[#666] hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {(rm.tools || []).length < 10 && (
                    <button onClick={()=>{const r=[...roadmaps];r[i].tools=[...(r[i].tools||[]),""];setRoadmaps(r);}} className="text-xs text-custom-amber hover:text-[#ffc887] font-semibold flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Ajouter un outil
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>setRoadmaps([...roadmaps,{icon:"Truck",title:"",description:"",role:"",tools:[""],skills:[""]}])} className="w-full py-3 rounded-xl border border-dashed border-custom-amber/40 text-custom-amber hover:bg-custom-amber/5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Ajouter une roadmap
          </button>
        </div>
      </SectionCard>

      {/* ── DEVELOPERS ── */}
      <div className={cardCls}>
        <h3 className="text-base font-semibold text-white">💻 Développeurs du site</h3>
        <div className="space-y-3">
          {devs.map((dev, i) => (
            <div key={i} className="bg-[#0c0d0d] border border-[#333535] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#282a2b] border border-[#444] flex items-center justify-center text-custom-amber font-bold text-sm flex-shrink-0">
                    {dev.photo_url ? <img src={dev.photo_url} alt={dev.name} className="w-full h-full object-cover" /> : (dev.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2) || "?")}
                  </div>
                  <span className="text-white font-semibold text-sm">{dev.name || "Nouveau développeur"}</span>
                </div>
                <button onClick={()=>setDevs(devs.filter((_,j)=>j!==i))} className="p-1.5 text-[#666] hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nom *</label>
                  <input value={dev.name} onChange={(e)=>{const d=[...devs];d[i]={...d[i],name:e.target.value};setDevs(d);}} className={inputCls} placeholder="Khalil Ben Ahmed" />
                </div>
                <div>
                  <label className={labelCls}>Rôle *</label>
                  <input value={dev.role} onChange={(e)=>{const d=[...devs];d[i]={...d[i],role:e.target.value};setDevs(d);}} className={inputCls} placeholder="Lead Developer" />
                </div>
                <div>
                  <label className={labelCls}>LinkedIn</label>
                  <input value={dev.linkedin||""} onChange={(e)=>{const d=[...devs];d[i]={...d[i],linkedin:e.target.value};setDevs(d);}} className={inputCls} placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className={labelCls}>GitHub</label>
                  <input value={dev.github||""} onChange={(e)=>{const d=[...devs];d[i]={...d[i],github:e.target.value};setDevs(d);}} className={inputCls} placeholder="https://github.com/..." />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Photo (optionnel)</label>
                  <label className="cursor-pointer flex items-center gap-3">
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f){setDevPhotoFiles(prev=>({...prev,[i]:f}));const d=[...devs];d[i]={...d[i],photo_url:URL.createObjectURL(f)};setDevs(d);}}} />
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#444] text-[#888] hover:border-custom-amber/40 text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Choisir une photo
                    </span>
                    {devPhotoFiles[i] && <span className="text-xs text-custom-amber">{devPhotoFiles[i].name}</span>}
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>setDevs([...devs,{name:"",role:"",linkedin:"",github:""}])} className="w-full py-3 rounded-xl border border-dashed border-custom-amber/40 text-custom-amber hover:bg-custom-amber/5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Ajouter un développeur
          </button>
        </div>
        <button onClick={saveDevs} disabled={saving==="developers"} className={saveBtn}>
          {saving==="developers"?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Save className="w-3.5 h-3.5"/>} Sauvegarder Développeurs
        </button>
      </div>
    </div>
  );
}
