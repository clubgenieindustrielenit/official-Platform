"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Search,
  Calendar,
  Users,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ProjectItem = {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "done" | string;
  progress: number;
  deadline: string | null;
  google_form_url?: string | null;
  created_at: string;
  poles: { id: string; name: string; slug?: string } | null;
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  project_members: Array<{
    user_id: string;
    profiles: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  }>;
  isUserMember: boolean;
  isUserLead: boolean;
};

interface Props {
  projects: ProjectItem[];
  userId: string;
}

export default function ProjectsListClient({ projects, userId }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "my" | "in_progress" | "planned" | "done">("all");
  const [selectedPole, setSelectedPole] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Extract unique poles
  const poles = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      if (p.poles?.id && p.poles?.name) {
        map.set(p.poles.id, p.poles.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  // Statistics
  const myProjectsCount = projects.filter((p) => p.isUserMember || p.isUserLead).length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;
  const doneCount = projects.filter((p) => p.status === "done").length;

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Tab filter
      if (activeTab === "my" && !p.isUserMember && !p.isUserLead) return false;
      if (activeTab === "in_progress" && p.status !== "in_progress") return false;
      if (activeTab === "planned" && p.status !== "planned") return false;
      if (activeTab === "done" && p.status !== "done") return false;

      // Pole filter
      if (selectedPole !== "all" && p.poles?.id !== selectedPole) return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = (p.description || "").toLowerCase().includes(query);
        const matchesPole = (p.poles?.name || "").toLowerCase().includes(query);
        const matchesLead = p.lead
          ? `${p.lead.first_name || ""} ${p.lead.last_name || ""}`.toLowerCase().includes(query)
          : false;

        if (!matchesTitle && !matchesDesc && !matchesPole && !matchesLead) {
          return false;
        }
      }

      return true;
    });
  }, [projects, activeTab, selectedPole, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return {
          label: "En cours",
          classes: "bg-amber-500/15 text-custom-amber border-custom-amber/30",
        };
      case "done":
        return {
          label: "Terminé",
          classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      default:
        return {
          label: "Planifié",
          classes: "bg-sky-500/15 text-sky-400 border-sky-500/30",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#888]">Total Projets</p>
            <p className="font-mono text-2xl font-bold text-white mt-0.5">{projects.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber">
            <FolderGit2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#888]">Mes Projets</p>
            <p className="font-mono text-2xl font-bold text-custom-amber mt-0.5">{myProjectsCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#888]">En cours</p>
            <p className="font-mono text-2xl font-bold text-sky-400 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#888]">Terminés</p>
            <p className="font-mono text-2xl font-bold text-emerald-400 mt-0.5">{doneCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "Tous les Projets", count: projects.length },
              { id: "my", label: "Mes Projets", count: myProjectsCount },
              { id: "in_progress", label: "En cours", count: inProgressCount },
              { id: "planned", label: "Planifiés", count: projects.filter((p) => p.status === "planned").length },
              { id: "done", label: "Terminés", count: doneCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-custom-amber text-black font-bold shadow-[0_0_15px_rgba(252,163,17,0.3)]"
                    : "bg-[#141515] text-[#888] border border-[#2a2c2c] hover:text-white hover:border-[#3a3c3c]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id ? "bg-black/20 text-black font-bold" : "bg-[#1e2020] text-[#777]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Pole filter */}
          <div className="flex items-center gap-2">
            {poles.length > 0 && (
              <select
                value={selectedPole}
                onChange={(e) => setSelectedPole(e.target.value)}
                className="bg-[#141515] border border-[#2a2c2c] focus:border-custom-amber text-xs text-[#aaa] rounded-xl py-2 px-3 outline-none"
              >
                <option value="all">Tous les pôles</option>
                {poles.map((pole) => (
                  <option key={pole.id} value={pole.id}>
                    {pole.name.startsWith("Pôle") ? pole.name : `Pôle ${pole.name}`}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141515] border border-[#2a2c2c] focus:border-custom-amber rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none placeholder-[#666]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-[#141515] border border-dashed border-[#2a2c2c] rounded-3xl p-12 text-center space-y-3">
          <FolderGit2 className="w-10 h-10 text-[#444] mx-auto" />
          <p className="text-sm font-semibold text-white">Aucun projet trouvé</p>
          <p className="text-xs text-[#777] max-w-md mx-auto">
            {activeTab === "my"
              ? "Vous n'êtes actuellement assigné à aucun projet. Consultez les projets généraux du club ou contactez un responsable de pôle !"
              : "Aucun projet ne correspond à vos critères de recherche pour le moment."}
          </p>
          {activeTab === "my" && (
            <button
              onClick={() => setActiveTab("all")}
              className="mt-2 px-4 py-2 bg-custom-amber/15 text-custom-amber border border-custom-amber/30 rounded-xl text-xs font-bold hover:bg-custom-amber hover:text-black transition-colors"
            >
              Voir tous les projets du club
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => {
              const badge = getStatusBadge(project.status);
              const members = project.project_members || [];

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={`/membre/projets/${project.id}`}
                    className="bg-[#141515] border border-[#2a2c2c] hover:border-custom-amber/50 rounded-2xl p-5 flex flex-col justify-between h-full transition-all group shadow-md hover:shadow-[0_0_25px_rgba(252,163,17,0.12)] relative overflow-hidden"
                  >
                    {/* Top highlights for user's own project */}
                    {(project.isUserLead || project.isUserMember) && (
                      <div className="absolute top-0 right-0">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl bg-custom-amber text-black shadow-sm">
                          {project.isUserLead ? "★ Chef de projet" : "✓ Membre"}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      {/* Pole & Status Tags */}
                      <div className="flex items-center gap-2 flex-wrap pr-16">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1e2020] text-white border border-[#333535]">
                          {project.poles?.name || "Club GI"}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Project Title */}
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-custom-amber transition-colors line-clamp-2">
                        {project.title}
                      </h3>

                      {/* Project Description */}
                      <p className="text-xs text-[#aaa] line-clamp-2 leading-relaxed">
                        {project.description || "Aucune description détaillée fournie."}
                      </p>

                      {/* Lead info */}
                      {project.lead && (
                        <div className="flex items-center gap-2 text-xs text-[#ccc] bg-[#1a1c1c] border border-[#2e3030] p-2 rounded-xl">
                          <div className="w-5 h-5 rounded-full bg-custom-amber/20 flex items-center justify-center text-custom-amber text-[10px] font-bold shrink-0">
                            {project.lead.avatar_url ? (
                              <img
                                src={project.lead.avatar_url}
                                alt="Lead"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{project.lead.first_name?.[0] || "L"}</span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#888] font-mono">Lead:</span>
                          <span className="font-medium truncate">
                            {project.lead.first_name} {project.lead.last_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="mt-5 pt-4 border-t border-[#222424] space-y-3">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1.5">
                          <span className="text-[#888]">Avancement</span>
                          <span className="font-bold text-custom-amber">{project.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1e2020] rounded-full overflow-hidden border border-[#2a2c2c]">
                          <div
                            className="h-full bg-gradient-to-r from-custom-amber to-[#ffc887] transition-all duration-500 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Application / Membership / Action CTA */}
                      {project.google_form_url && !project.isUserMember && !project.isUserLead && (
                        <div className="pt-1">
                          <a
                            href={project.google_form_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full py-2 px-3 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(252,163,17,0.25)]"
                          >
                            <span>Postuler / S&apos;inscrire (Formulaire)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Team & Deadline footer */}
                      <div className="flex items-center justify-between text-xs text-[#888] pt-1">
                        {/* Member Avatars */}
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {members.slice(0, 4).map((m, idx) => (
                            <div
                              key={m.user_id || idx}
                              title={`${m.profiles?.first_name || ""} ${m.profiles?.last_name || ""}`}
                              className="w-6 h-6 rounded-full bg-[#252828] border border-[#141515] flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0"
                            >
                              {m.profiles?.avatar_url ? (
                                <img
                                  src={m.profiles.avatar_url}
                                  alt="Member"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span>{m.profiles?.first_name?.[0] || "?"}</span>
                              )}
                            </div>
                          ))}
                          {members.length > 4 && (
                            <span className="w-6 h-6 rounded-full bg-[#1e2020] border border-[#141515] flex items-center justify-center text-[9px] font-mono text-[#aaa]">
                              +{members.length - 4}
                            </span>
                          )}
                          {members.length === 0 && (
                            <span className="text-[10px] font-mono text-[#666]">0 membre</span>
                          )}
                        </div>

                        {/* Deadline */}
                        {project.deadline ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-[#aaa]">
                            <Calendar className="w-3.5 h-3.5 text-custom-amber" />
                            <span>{new Date(project.deadline).toLocaleDateString("fr-FR")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-custom-amber font-semibold group-hover:translate-x-0.5 transition-transform">
                            <span>Détails & Kanban</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
