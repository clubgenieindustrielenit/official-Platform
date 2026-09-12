"use client";

import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Shield,
  Loader2,
  X,
  Sparkles,
  Check,
  Flag,
  Layers,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Pole = { id: string; name: string; slug?: string };

type MemberProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  pole_id: string | null;
  avatar_url: string | null;
};

type ProjectMember = {
  user_id: string;
  profiles: MemberProfile | null;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "done";
  progress: number;
  deadline: string | null;
  google_form_url?: string | null;
  pole_id: string | null;
  lead_id: string | null;
  poles: Pole | null;
  lead: MemberProfile | null;
  project_members: ProjectMember[];
};

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [poles, setPoles] = useState<Pole[]>([]);
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poleId, setPoleId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "done">("planned");
  const [progress, setProgress] = useState<number>(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Fetch Projects Data
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du chargement des projets");
      setProjects(data.projects || []);
      setPoles(data.poles || []);
      setProfiles(data.profiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Open Modal for Create or Edit
  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setTitle(project.title);
      setDescription(project.description || "");
      setPoleId(project.pole_id || "");
      setLeadId(project.lead_id || "");
      setDeadline(project.deadline ? project.deadline.split("T")[0] : "");
      setGoogleFormUrl(project.google_form_url || "");
      setStatus(project.status || "planned");
      setProgress(project.progress || 0);
      setSelectedMemberIds(project.project_members?.map((pm) => pm.user_id) || []);
    } else {
      setEditingProject(null);
      setTitle("");
      setDescription("");
      setPoleId("");
      setLeadId("");
      setDeadline("");
      setGoogleFormUrl("");
      setStatus("planned");
      setProgress(0);
      setSelectedMemberIds([]);
    }
    setMemberSearch("");
    setIsModalOpen(true);
  };

  const handleToggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        id: editingProject?.id,
        title: title.trim(),
        description: description?.trim() || null,
        pole_id: poleId || null,
        lead_id: leadId || null,
        deadline: deadline ? (deadline.includes("T") ? deadline.split("T")[0] : deadline) : null,
        google_form_url: googleFormUrl.trim() || null,
        status,
        progress: status === "done" ? 100 : progress,
        member_ids: selectedMemberIds,
      };

      const res = await fetch("/api/admin/projects", {
        method: editingProject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement");

      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (
    project: Project,
    newStatus: "planned" | "in_progress" | "done"
  ) => {
    try {
      const progressValue = newStatus === "done" ? 100 : newStatus === "in_progress" ? 50 : 0;
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, status: newStatus, progress: progressValue }),
      });
      if (res.ok) fetchProjects();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDelete = async (id: string, projectTitle: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le projet "${projectTitle}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de la suppression du projet");
        return;
      }
      fetchProjects();
    } catch (err: any) {
      console.error("Failed to delete project", err);
      alert(err.message || "Erreur lors de la suppression du projet");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.poles?.name && p.poles.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.lead && `${p.lead.first_name} ${p.lead.last_name}`.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && p.status === filterStatus;
  });

  const filteredProfiles = profiles.filter((prof) =>
    `${prof.first_name || ""} ${prof.last_name || ""}`.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-custom-amber" />
            <span>Gestion des Projets du Club</span>
          </h2>
          <p className="text-[#888] text-sm mt-0.5">
            Supervisez les projets transversaux, assignez les chefs de projet et suivez les jalons.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-custom-amber hover:bg-[#ffc887] transition-all shadow-[0_0_20px_rgba(252,163,17,0.3)] hover:shadow-[0_0_25px_rgba(252,163,17,0.5)] shrink-0 cursor-pointer transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#777]" />
          <input
            type="text"
            placeholder="Rechercher par titre, pôle ou responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141515] border border-[#2a2c2c] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tous" },
            { id: "planned", label: "Planifiés" },
            { id: "in_progress", label: "En cours" },
            { id: "done", label: "Terminés" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-custom-amber/20 text-custom-amber border border-custom-amber/40 font-bold"
                  : "bg-[#141515] text-[#888] border border-[#2a2c2c] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-12 text-center text-[#888] text-sm flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-custom-amber" />
          <span>Chargement des projets...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-12 text-center text-[#888] text-sm space-y-3">
          <FolderGit2 className="w-8 h-8 text-[#555] mx-auto" />
          <p>Aucun projet trouvé. Cliquez sur &quot;Nouveau Projet&quot; pour en créer un.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const memberCount = project.project_members?.length || 0;
            return (
              <div
                key={project.id}
                className="bg-[#141515] border border-[#2a2c2c] hover:border-custom-amber/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-custom-amber/15 text-custom-amber border border-custom-amber/30 uppercase tracking-wider">
                        {project.poles?.name || "Club GI"}
                      </span>
                      <h3 className="font-display font-bold text-lg text-white mt-2 group-hover:text-custom-amber transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenModal(project)}
                        className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.title)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-[#aaa] line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Project Lead */}
                  {project.lead && (
                    <div className="flex items-center gap-2 text-xs text-[#ddd] bg-[#1e2020] border border-[#333535] p-2 rounded-xl">
                      <Shield className="w-3.5 h-3.5 text-custom-amber shrink-0" />
                      <span className="font-mono text-[11px] text-[#888]">Lead:</span>
                      <span className="font-semibold">
                        {project.lead.first_name} {project.lead.last_name}
                      </span>
                    </div>
                  )}

                  {/* Deadline & Members count */}
                  <div className="flex items-center justify-between text-xs text-[#888] font-mono pt-1">
                    {project.deadline ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-custom-amber" />
                        <span>{new Date(project.deadline).toLocaleDateString("fr-FR")}</span>
                      </div>
                    ) : (
                      <span className="text-[#666]">Pas de date limite</span>
                    )}

                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{memberCount} membre{memberCount > 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#888]">Avancement</span>
                      <span className="font-bold text-custom-amber">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1e2020] border border-[#333535] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-custom-amber to-[#ffc887] transition-all duration-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="pt-3 border-t border-[#2a2c2c] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-[#888]">Statut :</span>
                  <div className="flex items-center gap-1 bg-[#1e2020] p-1 rounded-xl border border-[#333535]">
                    <button
                      onClick={() => handleStatusToggle(project, "planned")}
                      className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
                        project.status === "planned"
                          ? "bg-custom-amber/20 text-custom-amber font-bold"
                          : "text-[#777] hover:text-white"
                      }`}
                    >
                      Planifié
                    </button>
                    <button
                      onClick={() => handleStatusToggle(project, "in_progress")}
                      className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
                        project.status === "in_progress"
                          ? "bg-custom-amber/20 text-custom-amber font-bold"
                          : "text-[#777] hover:text-white"
                      }`}
                    >
                      En cours
                    </button>
                    <button
                      onClick={() => handleStatusToggle(project, "done")}
                      className={`px-2.5 py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer ${
                        project.status === "done"
                          ? "bg-emerald-500/20 text-emerald-300 font-bold"
                          : "text-[#777] hover:text-white"
                      }`}
                    >
                      Terminé
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141515] border border-[#2a2c2c] w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingProject ? "Modifier le projet" : "Nouveau Projet Club"}
                    </h3>
                    <p className="text-xs text-[#888]">
                      Définissez les objectifs, le chef de projet et l&apos;équipe.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}
                {/* Title */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                    Titre du Projet *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Développement Plateforme Web & Mobile"
                    className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                    Description & Objectifs
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objectifs, technologies utilisées, livrables attendus..."
                    className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber"
                  />
                </div>

                {/* Pole & Lead */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Pôle Associé
                    </label>
                    <select
                      value={poleId}
                      onChange={(e) => setPoleId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber"
                    >
                      <option value="">-- Aucun / Projet Général --</option>
                      {poles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Chef de projet (Lead)
                    </label>
                    <select
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber"
                    >
                      <option value="">-- Sélectionner un lead --</option>
                      {profiles.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.first_name} {prof.last_name} ({prof.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Deadline & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Date Limite (Deadline)
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Statut Initial
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber"
                    >
                      <option value="planned">Planifié (Non démarré)</option>
                      <option value="in_progress">En cours de réalisation</option>
                      <option value="done">Terminé / Livré</option>
                    </select>
                  </div>
                </div>

                {/* Google Form Registration URL */}
                <div>
                  <label className="block text-xs font-mono uppercase text-custom-amber mb-1 flex items-center gap-1.5 font-bold">
                    <span>Lien Formulaire d&apos;inscription / Candidature (Google Form)</span>
                  </label>
                  <input
                    type="url"
                    value={googleFormUrl}
                    onChange={(e) => setGoogleFormUrl(e.target.value)}
                    placeholder="https://docs.google.com/forms/d/..."
                    className="w-full px-4 py-2.5 bg-[#1e2020] border border-custom-amber/40 rounded-xl text-sm text-white focus:outline-none focus:border-custom-amber placeholder-[#666]"
                  />
                  <p className="text-[10px] text-[#888] mt-1">
                    Permet aux membres du club de candidater ou rejoindre l&apos;équipe projet via un formulaire officiel.
                  </p>
                </div>

                {/* Member Selection Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase text-[#aaa]">
                      Assigner des membres ({selectedMemberIds.length} sélectionnés)
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Filtrer les membres par nom..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1e2020] border border-[#333535] rounded-xl text-xs text-white focus:outline-none focus:border-custom-amber"
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#333535] bg-[#1a1c1c] p-2.5 rounded-2xl">
                    {filteredProfiles.map((prof) => {
                      const isSelected = selectedMemberIds.includes(prof.id);
                      return (
                        <div
                          key={prof.id}
                          onClick={() => handleToggleMember(prof.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-custom-amber/20 border border-custom-amber/40 text-white"
                              : "hover:bg-[#252828] text-[#aaa]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-custom-amber/20 flex items-center justify-center text-custom-amber font-bold text-[10px]">
                              {prof.first_name?.[0] || "?"}
                            </div>
                            <span className="font-medium">
                              {prof.first_name} {prof.last_name}
                            </span>
                            <span className="text-[10px] text-[#777] font-mono">({prof.role})</span>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-custom-amber border-custom-amber text-black"
                                : "border-[#555]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2c2c]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-custom-amber hover:bg-[#ffc887] text-black shadow-[0_0_20px_rgba(252,163,17,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? "Enregistrement..." : editingProject ? "Mettre à jour" : "Créer le projet"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
