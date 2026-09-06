"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Shield,
  Award,
  Search,
  Mail,
  Phone,
  GraduationCap,
  ExternalLink,
  Layers,
  Sparkles,
  Briefcase,
  IdCard,
  Building2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AnnuaireMember {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: "admin" | "membre_bureau" | "membre_actif" | "bureau" | "membre" | string;
  phone?: string | null;
  classe?: string | null;
  statut_membre?: "senior" | "actif" | "alumni" | null;
  statut_membre_verified?: boolean;
  points_total?: number;
  pole_id?: string | null;
  pole_ids?: string[] | null;
  poles?: { name: string } | null;
  year?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  joined_at?: string;
  is_active?: boolean;
}

interface AnnuaireManagerProps {
  members: AnnuaireMember[];
  polesMap: Record<string, string>;
  onSelectMember?: (member: any) => void;
  onOpenPassport?: (memberId: string) => void;
}

const POLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Média": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
  "Formation": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Projets": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Visites": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  "Sponsoring": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "Événements": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  "Général": { bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" },
};

function getPoleBadgeStyle(poleName: string) {
  const clean = poleName.replace(/^Pôle\s+/i, "");
  return POLE_COLORS[clean] || POLE_COLORS["Général"];
}

export default function AnnuaireManager({
  members,
  polesMap,
  onSelectMember,
  onOpenPassport,
}: AnnuaireManagerProps) {
  const [search, setSearch] = useState("");
  const [selectedPoleFilter, setSelectedPoleFilter] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  const isBureauOrAdmin = (role: string) => {
    return role === "admin" || role === "bureau" || role === "membre_bureau";
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return { label: "Super Admin", color: "bg-red-500/10 text-red-400 border-red-500/30" };
    }
    if (role === "membre_bureau" || role === "bureau") {
      return { label: "Bureau Exécutif", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    }
    return { label: "Membre Actif", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
  };

  // Extract unique pole names
  const allPoleNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(polesMap).forEach((name) => names.add(name));
    return Array.from(names).sort();
  }, [polesMap]);

  // Filter members
  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter((m) => {
      const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      const email = (m.email || "").toLowerCase();
      const classe = (m.classe || "").toLowerCase();
      const role = (m.role || "").toLowerCase();

      const matchQuery =
        !q ||
        fullName.includes(q) ||
        email.includes(q) ||
        classe.includes(q) ||
        role.includes(q);

      // Pole filter
      let matchPole = true;
      if (selectedPoleFilter !== "all") {
        const memberPoles: string[] = [];
        if (m.pole_ids && m.pole_ids.length > 0) {
          m.pole_ids.forEach((pid) => {
            if (polesMap[pid]) memberPoles.push(polesMap[pid]);
          });
        } else if (m.pole_id && polesMap[m.pole_id]) {
          memberPoles.push(polesMap[m.pole_id]);
        }
        if (m.poles?.name) memberPoles.push(m.poles.name);

        matchPole = memberPoles.some((pn) =>
          pn.toLowerCase().includes(selectedPoleFilter.toLowerCase())
        );
      }

      // Role filter
      let matchRole = true;
      if (selectedRoleFilter === "bureau") {
        matchRole = isBureauOrAdmin(m.role);
      } else if (selectedRoleFilter === "actif") {
        matchRole = !isBureauOrAdmin(m.role);
      } else if (selectedRoleFilter === "senior") {
        matchRole = m.statut_membre === "senior";
      } else if (selectedRoleFilter === "alumni") {
        matchRole = m.statut_membre === "alumni";
      }

      return matchQuery && matchPole && matchRole;
    });
  }, [members, search, selectedPoleFilter, selectedRoleFilter, polesMap]);

  // Split into Bureau & Members
  const bureauMembers = useMemo(() => {
    return filteredMembers.filter((m) => isBureauOrAdmin(m.role));
  }, [filteredMembers]);

  // Group active members by pole
  const poleGroups = useMemo(() => {
    const groups: Record<string, AnnuaireMember[]> = {};

    allPoleNames.forEach((name) => {
      groups[name] = [];
    });
    groups["Membres Généraux"] = [];

    const nonBureau = filteredMembers.filter((m) => !isBureauOrAdmin(m.role));

    nonBureau.forEach((m) => {
      const pIds = m.pole_ids && m.pole_ids.length > 0 ? m.pole_ids : m.pole_id ? [m.pole_id] : [];
      if (pIds.length === 0) {
        groups["Membres Généraux"].push(m);
      } else {
        pIds.forEach((pid) => {
          const pName = polesMap[pid];
          if (pName) {
            if (!groups[pName]) groups[pName] = [];
            groups[pName].push(m);
          } else {
            groups["Membres Généraux"].push(m);
          }
        });
      }
    });

    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  }, [filteredMembers, allPoleNames, polesMap]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#181a1a] via-[#141515] to-[#121313] border border-[#2a2c2c] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#fca311] text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Annuaire Officiel & Organigramme</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Annuaire des Membres
            </h1>
            <p className="text-[#888] text-xs sm:text-sm max-w-2xl leading-relaxed">
              Consultez l'ensemble des membres actifs, l'organigramme du bureau exécutif et la répartition par pôle d'activité.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#1a1c1c] border border-[#2a2c2c] rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <span className="text-[10px] text-[#888] uppercase font-mono block">Total</span>
              <span className="text-xl font-bold text-white font-mono">{members.length}</span>
            </div>
            <div className="bg-[#1a1c1c] border border-amber-500/30 rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <span className="text-[10px] text-amber-400 uppercase font-mono block">Bureau</span>
              <span className="text-xl font-bold text-amber-400 font-mono">
                {members.filter((m) => isBureauOrAdmin(m.role)).length}
              </span>
            </div>
            <div className="bg-[#1a1c1c] border border-[#2a2c2c] rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">Pôles</span>
              <span className="text-xl font-bold text-white font-mono">{allPoleNames.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-[#141616] border border-[#2a2c2c] p-3 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, email, classe ou rôle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Role filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-[#1a1c1c] border border-[#2a2c2c] text-xs text-[#bbb] rounded-xl px-3 py-2 focus:outline-none focus:border-[#fca311]/50 cursor-pointer"
          >
            <option value="all">Tous les rôles</option>
            <option value="bureau">Bureau Exécutif</option>
            <option value="actif">Membres Actifs</option>
            <option value="senior">Membres Seniors</option>
            <option value="alumni">Alumni</option>
          </select>

          {/* Pole filter */}
          <select
            value={selectedPoleFilter}
            onChange={(e) => setSelectedPoleFilter(e.target.value)}
            className="bg-[#1a1c1c] border border-[#2a2c2c] text-xs text-[#bbb] rounded-xl px-3 py-2 focus:outline-none focus:border-[#fca311]/50 cursor-pointer"
          >
            <option value="all">Tous les pôles</option>
            {allPoleNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. BUREAU EXÉCUTIF SECTION */}
      {bureauMembers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Bureau Exécutif & Responsables
                </h2>
                <p className="text-[11px] text-[#777]">Membres dirigeants et pilotes du club</p>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {bureauMembers.length} membres
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bureauMembers.map((member) => {
              const roleBadge = getRoleBadge(member.role);
              const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase() || member.email.substring(0, 2).toUpperCase();

              return (
                <motion.div
                  key={member.id}
                  whileHover={{ y: -4 }}
                  className="bg-[#141515] border border-[#2a2c2c] hover:border-amber-500/50 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 shadow-lg group relative overflow-hidden"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-[#1e2020] border-2 border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-base text-[#fca311]">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                        {member.first_name || member.last_name
                          ? `${member.first_name || ""} ${member.last_name || ""}`
                          : member.email.split("@")[0]}
                      </h4>
                      <p className="text-[11px] text-[#777] font-mono truncate">{member.email}</p>
                      
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${roleBadge.color}`}
                        >
                          {roleBadge.label}
                        </span>
                        {member.classe && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-[#aaa]">
                            {member.classe}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#222] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#777] font-mono">
                      {member.points_total || 0} pts
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onOpenPassport && (
                        <button
                          onClick={() => onOpenPassport(member.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-white hover:text-amber-400 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <IdCard className="w-3 h-3" />
                          <span>Passeport</span>
                        </button>
                      )}
                      {onSelectMember && (
                        <button
                          onClick={() => onSelectMember(member)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-bold hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          Détails
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. MEMBRES GROUPÉS PAR PÔLE */}
      {poleGroups.length > 0 && (
        <div className="space-y-8">
          {poleGroups.map(([poleName, poleMembers]) => {
            const badgeStyle = getPoleBadgeStyle(poleName);

            return (
              <section key={poleName} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${badgeStyle.bg} border ${badgeStyle.border} flex items-center justify-center ${badgeStyle.text}`}>
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white">
                        {poleName === "Membres Généraux" ? poleName : `Pôle ${poleName.replace(/^Pôle\s+/i, "")}`}
                      </h3>
                      <p className="text-[11px] text-[#777]">Membres et contributeurs actifs du pôle</p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}>
                    {poleMembers.length} membres
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {poleMembers.map((member) => {
                    const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase() || member.email.substring(0, 2).toUpperCase();

                    return (
                      <motion.div
                        key={member.id}
                        whileHover={{ y: -3 }}
                        className="bg-[#141515] border border-[#2a2c2c] hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#1e2020] border border-[#2a2c2c] flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-[#aaa]">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-xs truncate">
                              {member.first_name || member.last_name
                                ? `${member.first_name || ""} ${member.last_name || ""}`
                                : member.email.split("@")[0]}
                            </p>
                            <p className="text-[10px] text-[#777] font-mono truncate">{member.email}</p>
                            {member.classe && (
                              <span className="inline-block mt-1 px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-[#aaa]">
                                {member.classe}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#222] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#666] font-mono">
                            {member.points_total || 0} pts
                          </span>

                          <div className="flex items-center gap-1">
                            {onOpenPassport && (
                              <button
                                onClick={() => onOpenPassport(member.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/15 text-[#888] hover:text-amber-400 transition-colors"
                                title="Passeport Membre"
                              >
                                <IdCard className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onSelectMember && (
                              <button
                                onClick={() => onSelectMember(member)}
                                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white text-[10px] font-medium transition-colors"
                              >
                                Profil
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="bg-[#141616] border border-[#2a2c2c] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1e2020] border border-[#2a2c2c] flex items-center justify-center mx-auto mb-4 text-[#888]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Aucun membre trouvé</h3>
          <p className="text-xs text-[#777] max-w-sm mx-auto">
            Aucun membre ne correspond à vos critères de recherche ou de filtrage.
          </p>
        </div>
      )}
    </div>
  );
}
