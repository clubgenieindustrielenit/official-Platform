"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Award,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  ExternalLink,
  GraduationCap,
  Star,
  UserCheck,
  ChevronDown,
  Filter,
} from "lucide-react";
import MemberPoleMultiSelect, { PoleItem } from "./MemberPoleMultiSelect";
import { MemberRecord } from "@/app/(public)/admin/page";

interface MembersGridViewProps {
  members: MemberRecord[];
  poles: PoleItem[];
  polesMap: Record<string, string>;
  onChangePoles: (member: MemberRecord, newPoleIds: string[]) => void;
  onChangeRole: (
    member: MemberRecord,
    newRole: "admin" | "membre_bureau" | "membre_actif"
  ) => void;
  onVerifyStatus: (member: MemberRecord) => void;
  onOpenPointsModal: (member: MemberRecord) => void;
  onOpenPassport: (memberId: string) => void;
  onSelectMemberForDetails: (member: MemberRecord) => void;
  onDeleteMember: (member: MemberRecord) => void;
}

export default function MembersGridView({
  members,
  poles,
  polesMap,
  onChangePoles,
  onChangeRole,
  onVerifyStatus,
  onOpenPointsModal,
  onOpenPassport,
  onSelectMemberForDetails,
  onDeleteMember,
}: MembersGridViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatut, setSelectedStatut] = useState<
    "all" | "actif" | "senior" | "alumni"
  >("all");
  const [selectedPole, setSelectedPole] = useState<string>("all");

  // Helper for pole colors
  const getPoleColor = (poleName: string, fallbackColor?: string) => {
    if (fallbackColor) return fallbackColor;
    const name = poleName.toLowerCase();
    if (name.includes("partenariat") || name.includes("sponsoring"))
      return "#fca311";
    if (
      name.includes("logistique") ||
      name.includes("événement") ||
      name.includes("evenement")
    )
      return "#3b82f6";
    if (name.includes("projet")) return "#10b981";
    if (name.includes("formation")) return "#a855f7";
    if (name.includes("média") || name.includes("media")) return "#ec4899";
    return "#888888";
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
        const email = (m.email || "").toLowerCase();
        const classe = (m.classe || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        const bio = (m.bio || "").toLowerCase();
        const prepa = `${m.prepa_section || ""} ${m.prepa_etablissement || ""}`.toLowerCase();
        if (
          !fullName.includes(query) &&
          !email.includes(query) &&
          !classe.includes(query) &&
          !phone.includes(query) &&
          !bio.includes(query) &&
          !prepa.includes(query)
        ) {
          return false;
        }
      }

      // Statut filter
      if (selectedStatut !== "all") {
        const mStatut = m.statut_membre || "actif";
        if (mStatut !== selectedStatut) return false;
      }

      // Pole filter
      if (selectedPole !== "all") {
        const pIds = m.pole_ids || (m.pole_id ? [m.pole_id] : []);
        if (!pIds.includes(selectedPole)) return false;
      }

      return true;
    });
  }, [members, searchQuery, selectedStatut, selectedPole]);

  // Counts by statut
  const countActifs = useMemo(
    () => members.filter((m) => (m.statut_membre || "actif") === "actif").length,
    [members]
  );
  const countSeniors = useMemo(
    () => members.filter((m) => m.statut_membre === "senior").length,
    [members]
  );
  const countAlumni = useMemo(
    () => members.filter((m) => m.statut_membre === "alumni").length,
    [members]
  );

  // Group members into 3 buckets
  const grouped = useMemo(() => {
    const actifs = filteredMembers.filter(
      (m) => (m.statut_membre || "actif") === "actif"
    );
    const seniors = filteredMembers.filter((m) => m.statut_membre === "senior");
    const alumni = filteredMembers.filter((m) => m.statut_membre === "alumni");
    return { actifs, seniors, alumni };
  }, [filteredMembers]);

  // Card component
  const renderMemberCard = (m: MemberRecord) => {
    const memberPoleIds = m.pole_ids || (m.pole_id ? [m.pole_id] : []);
    const memberPoles = poles.filter((p) => memberPoleIds.includes(p.id));
    const fullName =
      m.first_name || m.last_name
        ? `${m.first_name || ""} ${m.last_name || ""}`.trim()
        : m.email.split("@")[0];

    const statut = m.statut_membre || "actif";

    return (
      <div
        key={m.id}
        className="group relative bg-[#141515] hover:bg-[#181a1a] border border-[#2a2c2c] hover:border-custom-amber/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(252,163,17,0.12)] hover:-translate-y-1 flex flex-col justify-between"
      >
        {/* Top badges bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Points badge */}
          <button
            type="button"
            onClick={() => onOpenPointsModal(m)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#1e2020] hover:bg-custom-amber/20 border border-[#333535] hover:border-custom-amber/40 text-custom-amber text-[10px] font-mono font-bold transition-colors cursor-pointer"
            title="Attribuer des points"
          >
            <Sparkles className="w-3 h-3" />
            <span>{m.points_total || 0} pts</span>
          </button>

          {/* Statut pill */}
          {statut === "senior" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              <span>SENIOR</span>
            </span>
          ) : statut === "alumni" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <GraduationCap className="w-2.5 h-2.5" />
              <span>ALUMNI</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UserCheck className="w-2.5 h-2.5" />
              <span>ACTIF</span>
            </span>
          )}
        </div>

        {/* Member Avatar & Main Info */}
        <div className="flex flex-col items-center text-center space-y-2.5 my-1">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#1e2020] border-2 border-[#333535] group-hover:border-custom-amber/60 flex items-center justify-center font-bold text-custom-amber text-lg overflow-hidden shadow-md transition-colors">
              {m.avatar_url ? (
                <img
                  src={m.avatar_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {m.first_name ? m.first_name[0].toUpperCase() : m.email[0].toUpperCase()}
                  {m.last_name ? m.last_name[0].toUpperCase() : ""}
                </span>
              )}
            </div>

            {/* Verification icon indicator */}
            {m.statut_membre_verified ? (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center shadow"
                title="Statut vérifié"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onVerifyStatus(m)}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-custom-amber/20 border border-custom-amber text-custom-amber hover:bg-custom-amber hover:text-black flex items-center justify-center shadow transition-colors cursor-pointer"
                title="Cliquer pour vérifier le statut"
              >
                <Shield className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-full px-1">
            <h3
              onClick={() => onSelectMemberForDetails(m)}
              className="font-bold text-white text-sm group-hover:text-custom-amber transition-colors truncate cursor-pointer"
              title={fullName}
            >
              {fullName}
            </h3>
            <p className="text-[11px] text-[#888] truncate font-mono mt-0.5">
              {m.email}
            </p>

            {/* Classe / Year badge */}
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
              <span className="px-2 py-0.5 rounded-md bg-[#1e2020] border border-[#333535] text-[#bbb] font-medium">
                {statut === "alumni"
                  ? `Promo ${m.year || m.classe || "Alumni"}`
                  : m.classe || "Classe non précisée"}
              </span>

              {m.prepa_section && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#181a1a] text-[#777] border border-[#2a2c2c] text-[9px]">
                  {m.prepa_section} {m.rang_concours ? `(#${m.rang_concours})` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Poles Chips */}
        <div className="mt-3 pt-2.5 border-t border-[#222424] min-h-[32px] flex flex-wrap items-center justify-center gap-1">
          {memberPoles.length === 0 ? (
            <span className="text-[10px] text-[#555] italic">Aucun pôle</span>
          ) : (
            memberPoles.map((p) => {
              const color = getPoleColor(p.name, p.color);
              const displayName = p.name.replace(/^Pôle\s+/i, "");
              return (
                <span
                  key={p.id}
                  style={{
                    backgroundColor: `${color}18`,
                    borderColor: `${color}40`,
                    color: color,
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border truncate max-w-[130px]"
                  title={p.name}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{displayName}</span>
                </span>
              );
            })
          )}
        </div>

        {/* Hover / Quick Actions Footer */}
        <div className="mt-3 pt-3 border-t border-[#2a2c2c] flex items-center justify-between gap-1">
          {/* Inline Pole Multi-Select */}
          <div className="scale-90 origin-left">
            <MemberPoleMultiSelect
              memberId={m.id}
              assignedPoleIds={m.pole_ids}
              fallbackPoleId={m.pole_id}
              poles={poles}
              onChange={(newPoleIds) => onChangePoles(m, newPoleIds)}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onOpenPassport(m.id)}
              className="p-1.5 rounded-lg text-custom-amber hover:bg-custom-amber/15 transition-colors cursor-pointer"
              title="Générer le Passeport GI"
            >
              <Award className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectMemberForDetails(m)}
              className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Voir profil complet"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteMember(m)}
              className="p-1.5 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Supprimer le membre"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Search + Filters + View Mode Toggle */}
      <div className="bg-[#141515] border border-[#333535] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Header Title */}
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-custom-amber" />
              <span>Membres & Gestion des Statuts</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-custom-amber/15 text-custom-amber border border-custom-amber/30 font-mono">
                {filteredMembers.length}
              </span>
            </h2>
            <p className="text-xs text-[#888] mt-0.5">
              Vue en grille groupée par statut (Actifs, Seniors, Alumni) avec actions rapides et gestion des pôles.
            </p>
          </div>

          {/* Right controls: Search + View Mode */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-[#555] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher nom, email, classe..."
                className="w-full bg-[#121414] border border-[#333535] focus:border-custom-amber rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#555]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#666] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center p-1 bg-[#121414] border border-[#333535] rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-custom-amber text-black shadow-md font-bold"
                    : "text-[#888] hover:text-white"
                }`}
                title="Vue en Grille"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grille</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-custom-amber text-black shadow-md font-bold"
                    : "text-[#888] hover:text-white"
                }`}
                title="Vue Tableau"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tableau</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills: Statut & Pole */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2a2c2c]">
          {/* Statut Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedStatut("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedStatut === "all"
                  ? "bg-white text-black border-white shadow"
                  : "bg-[#121414] text-[#888] border-[#333535] hover:border-[#555] hover:text-white"
              }`}
            >
              Tous ({members.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatut("actif")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                selectedStatut === "actif"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow"
                  : "bg-[#121414] text-[#888] border-[#333535] hover:border-blue-500/30 hover:text-blue-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Actifs ({countActifs})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatut("senior")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                selectedStatut === "senior"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow"
                  : "bg-[#121414] text-[#888] border-[#333535] hover:border-amber-500/30 hover:text-amber-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Seniors ({countSeniors})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatut("alumni")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                selectedStatut === "alumni"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow"
                  : "bg-[#121414] text-[#888] border-[#333535] hover:border-purple-500/30 hover:text-purple-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Alumni ({countAlumni})</span>
            </button>
          </div>

          {/* Pole Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#666] flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Pôle :</span>
            </span>
            <select
              value={selectedPole}
              onChange={(e) => setSelectedPole(e.target.value)}
              className="bg-[#121414] border border-[#333535] focus:border-custom-amber text-xs text-white rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="all">Tous les pôles ({poles.length})</option>
              {poles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* RENDER CONTENT: GRID or TABLE */}
      {viewMode === "grid" ? (
        <div className="space-y-8">
          {filteredMembers.length === 0 ? (
            <div className="bg-[#141515] border border-[#333535] rounded-2xl p-12 text-center text-[#666] space-y-2">
              <Users className="w-10 h-10 mx-auto text-[#444]" />
              <p className="text-sm font-medium">Aucun membre ne correspond aux critères de recherche.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatut("all");
                  setSelectedPole("all");
                }}
                className="text-xs text-custom-amber hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              {/* SECTION: SENIORS (if any, or if selected) */}
              {(selectedStatut === "all" || selectedStatut === "senior") &&
                grouped.seniors.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#2a2c2c]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                        Membres Seniors ({grouped.seniors.length})
                      </h3>
                      <div className="h-px bg-gradient-to-r from-amber-500/30 to-transparent flex-1 ml-2" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {grouped.seniors.map(renderMemberCard)}
                    </div>
                  </div>
                )}

              {/* SECTION: MEMBRES ACTIFS */}
              {(selectedStatut === "all" || selectedStatut === "actif") &&
                grouped.actifs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#2a2c2c]">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-blue-300 font-bold">
                        Membres Actifs ({grouped.actifs.length})
                      </h3>
                      <div className="h-px bg-gradient-to-r from-blue-500/30 to-transparent flex-1 ml-2" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {grouped.actifs.map(renderMemberCard)}
                    </div>
                  </div>
                )}

              {/* SECTION: ALUMNI */}
              {(selectedStatut === "all" || selectedStatut === "alumni") &&
                grouped.alumni.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#2a2c2c]">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                        Réseau Alumni ({grouped.alumni.length})
                      </h3>
                      <div className="h-px bg-gradient-to-r from-purple-500/30 to-transparent flex-1 ml-2" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {grouped.alumni.map(renderMemberCard)}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      ) : (
        /* TABLE VIEW FALLBACK */
        <div className="bg-[#141515] border border-[#333535] rounded-2xl p-4 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2a2c2c] text-[#888] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">MEMBRE</th>
                <th className="py-3 px-4">PÔLES ASSIGNÉS</th>
                <th className="py-3 px-4">STATUT MEMBRE</th>
                <th className="py-3 px-4">CLASSE & PARCOURS</th>
                <th className="py-3 px-4">POINTS TOTAL</th>
                <th className="py-3 px-4">RÔLE ACCÈS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2c2c]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#666]">
                    Aucun membre trouvé.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#1e2020]/50 transition-colors"
                  >
                    {/* Member info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1e2020] border border-[#333535] flex items-center justify-center font-bold text-custom-amber text-xs shrink-0 overflow-hidden shadow-sm">
                          {row.avatar_url ? (
                            <img
                              src={row.avatar_url}
                              alt={row.first_name || "Membre"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {row.first_name
                                ? row.first_name[0]
                                : row.email.substring(0, 1).toUpperCase()}
                              {row.last_name ? row.last_name[0] : ""}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">
                            {row.first_name || row.last_name
                              ? `${row.first_name || ""} ${row.last_name || ""}`
                              : row.email.split("@")[0]}
                          </div>
                          <div className="text-[11px] text-[#888]">
                            {row.email}
                          </div>
                          {row.phone && (
                            <div className="text-[10px] text-[#666] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-[#555]" />
                              <span>{row.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Poles Multi-Select */}
                    <td className="py-3.5 px-4">
                      <MemberPoleMultiSelect
                        memberId={row.id}
                        assignedPoleIds={row.pole_ids}
                        fallbackPoleId={row.pole_id}
                        poles={poles}
                        onChange={(newPoleIds) =>
                          onChangePoles(row, newPoleIds)
                        }
                      />
                    </td>

                    {/* Statut Membre + Verification */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                            row.statut_membre === "senior"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : row.statut_membre === "alumni"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {row.statut_membre || "Actif"}
                        </span>

                        <div>
                          {row.statut_membre_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Vérifié</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onVerifyStatus(row)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-custom-amber/15 hover:bg-custom-amber/25 text-custom-amber text-[10px] font-bold transition-colors cursor-pointer"
                              title="Valider le statut de ce membre"
                            >
                              <Shield className="w-3 h-3" />
                              <span>Vérifier</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Classe & Parcours */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="font-bold text-white">
                          {row.statut_membre === "alumni"
                            ? `Promotion : ${row.year || row.classe || "Alumni"}`
                            : row.classe || "Non renseigné"}
                        </div>
                        {row.prepa_section && (
                          <div className="text-[10px] text-[#888]">
                            Prépa: {row.prepa_section} (
                            {row.prepa_etablissement || "?"})
                            {row.rang_concours
                              ? ` · Rang #${row.rang_concours}`
                              : ""}
                          </div>
                        )}
                        {(row.bio || row.training_availability) && (
                          <div className="text-[10px] text-custom-amber/80 font-mono">
                            Concours: {row.bio || row.training_availability}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {row.linkedin_url && (
                            <a
                              href={row.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>LinkedIn</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {row.cv_url && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              ✓ CV joint
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Points total + Button */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-custom-amber text-xs font-mono">
                          {row.points_total || 0} pts
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenPointsModal(row)}
                          className="p-1 rounded-md bg-[#1e2020] hover:bg-custom-amber/20 text-[#aaa] hover:text-custom-amber transition-colors cursor-pointer"
                          title="Attribuer ou ajuster des points"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Role Select */}
                    <td className="py-3.5 px-4">
                      <select
                        value={row.role}
                        onChange={(e) =>
                          onChangeRole(row, e.target.value as any)
                        }
                        className="bg-[#121414] border border-[#333535] focus:border-custom-amber text-[10px] uppercase font-bold text-white rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="membre_actif">Membre Actif</option>
                        <option value="membre_bureau">Membre Bureau</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenPassport(row.id)}
                          className="p-1.5 rounded-lg text-custom-amber hover:bg-custom-amber/15 transition-colors cursor-pointer"
                          title="Générer le Passeport GI / Bilan Annuel d'Activité"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectMemberForDetails(row)}
                          className="p-1.5 rounded-lg text-[#888] hover:text-custom-amber hover:bg-custom-amber/10 transition-colors cursor-pointer"
                          title="Voir le profil et les détails complets"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMember(row)}
                          className="p-1.5 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Supprimer le membre"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
