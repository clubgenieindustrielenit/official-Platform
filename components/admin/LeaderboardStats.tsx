"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Users,
  Award,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  Sparkles,
  Loader2,
  Calendar,
  Search,
  ArrowUpDown,
  Filter,
  FileText,
  Linkedin,
  GraduationCap,
  Briefcase,
  Activity,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export interface RankedMember {
  rank: number;
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  points_total: number;
  pole_id?: string | null;
  pole_ids?: string[] | null;
  pole_name?: string | null;
  pole_names?: string[] | null;
  statut_membre?: string | null;
  role?: string;
  is_active?: boolean;
}

interface StatsData {
  kpis: {
    totalMembers: number;
    activeMembers: number;
    avgPoints: number;
    profileCompletionRate: number;
    cvMembersCount?: number;
    cvRate?: number;
    linkedinMembersCount?: number;
    linkedinRate?: number;
    statutBreakdown: {
      actif: number;
      senior: number;
      alumni: number;
      non_renseigne: number;
    };
  };
  activities?: {
    formations: number;
    visites: number;
    projects: number;
    eventRegistrations: number;
  };
  top10: RankedMember[];
  leaderboard?: RankedMember[];
  pointsDistribution: Array<{
    range: string;
    count: number;
  }>;
  pointsTimeline: Array<{
    date: string;
    total: number;
  }>;
  poleStats: Array<{
    id: string;
    name: string;
    memberCount: number;
    totalPoints: number;
    avgPoints: number;
  }>;
  prepaBreakdown?: Array<{
    name: string;
    count: number;
  }>;
  classBreakdown?: Array<{
    label: string;
    count: number;
  }>;
}

const STATUT_COLORS = ["#3b82f6", "#fca311", "#a855f7", "#6b7280"];
const BAR_COLORS = ["#fca311", "#e5e5e5", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#6366f1"];

const getPoleBadgeStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("partenariat") || n.includes("sponsoring")) return "bg-[#fca311]/15 text-[#fca311] border-[#fca311]/30";
  if (n.includes("logistique") || n.includes("événement") || n.includes("evenement")) return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  if (n.includes("projet")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (n.includes("formation")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  return "bg-white/10 text-[#aaa] border-white/15";
};

export default function LeaderboardStats({
  onShowToast,
}: {
  onShowToast: (type: "success" | "error" | "info", msg: string) => void;
}) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPole, setSelectedPole] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur chargement des stats");
      setData(json);
    } catch (err: any) {
      onShowToast("error", err.message || "Erreur lors du chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fullList = useMemo(() => {
    return data?.leaderboard || data?.top10 || [];
  }, [data]);

  const filteredLeaderboard = useMemo(() => {
    return fullList.filter((m) => {
      if (selectedPole !== "all") {
        const matchName =
          m.pole_name === selectedPole ||
          (m.pole_names && m.pole_names.includes(selectedPole));
        const matchId =
          m.pole_id === selectedPole ||
          (m.pole_ids && m.pole_ids.includes(selectedPole));
        if (!matchName && !matchId) return false;
      }
      if (selectedStatut !== "all") {
        if ((m.statut_membre || "").toLowerCase() !== selectedStatut.toLowerCase()) {
          return false;
        }
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
        const pole = (m.pole_name || "").toLowerCase();
        if (!fullName.includes(query) && !pole.includes(query)) return false;
      }
      return true;
    });
  }, [fullList, search, selectedPole, selectedStatut]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-custom-amber animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#666]">Génération du tableau de bord d&apos;analyse...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-8 text-center text-xs text-[#888]">
        Aucune donnée disponible.
      </div>
    );
  }

  const statutPieData = [
    { name: "Actif", value: data.kpis.statutBreakdown.actif },
    { name: "Senior", value: data.kpis.statutBreakdown.senior },
    { name: "Alumni", value: data.kpis.statutBreakdown.alumni },
    { name: "Non renseigné", value: data.kpis.statutBreakdown.non_renseigne },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2a2c2c] pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-custom-amber" />
            <span>Tableau de Bord & Statistiques Avancées</span>
          </h2>
          <p className="text-xs text-[#888] mt-1">
            Analyse globale de l&apos;engagement, du CVbook, des pôles et classement exhaustif des membres CGI ENIT.
          </p>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#141515] border border-[#2a2c2c] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[#888] font-mono">
            <span>Membres Inscrits</span>
            <Users className="w-4 h-4 text-custom-amber" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
            {data.kpis.totalMembers}
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>● {data.kpis.activeMembers} comptes actifs</span>
          </p>
        </div>

        <div className="bg-[#141515] border border-[#2a2c2c] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[#888] font-mono">
            <span>Moyenne Points</span>
            <Award className="w-4 h-4 text-custom-amber" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
            {data.kpis.avgPoints}
          </p>
          <p className="text-[10px] text-[#888] mt-1 font-mono">pts par membre</p>
        </div>

        <div className="bg-[#141515] border border-[#2a2c2c] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[#888] font-mono">
            <span>Complétion Profils</span>
            <ShieldCheck className="w-4 h-4 text-custom-amber" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
            {data.profileCompletionRate || data.kpis.profileCompletionRate}%
          </p>
          <p className="text-[10px] text-[#888] mt-1 font-mono">profils renseignés</p>
        </div>

        <div className="bg-[#141515] border border-[#2a2c2c] p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-[#888] font-mono">
            <span>Pôles Actifs</span>
            <BarChart3 className="w-4 h-4 text-custom-amber" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
            {data.poleStats.length}
          </p>
          <p className="text-[10px] text-[#888] mt-1 font-mono">divisions du club</p>
        </div>
      </div>

      {/* Advanced Secondary Metrics (Réseau, CVbook & Activités) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* CVbook Rate */}
        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#888]">Taux Dépôt CVbook</p>
            <p className="text-lg font-bold text-white font-mono">{data.kpis.cvRate ?? 0}%</p>
            <p className="text-[10px] text-[#666]">{data.kpis.cvMembersCount ?? 0} CVs soumis</p>
          </div>
        </div>

        {/* LinkedIn Network Rate */}
        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Linkedin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#888]">Profils LinkedIn</p>
            <p className="text-lg font-bold text-white font-mono">{data.kpis.linkedinRate ?? 0}%</p>
            <p className="text-[10px] text-[#666]">{data.kpis.linkedinMembersCount ?? 0} profils connectés</p>
          </div>
        </div>

        {/* Formations Hub */}
        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#888]">Formations Publiées</p>
            <p className="text-lg font-bold text-white font-mono">{data.activities?.formations ?? 0}</p>
            <p className="text-[10px] text-[#666]">sessions d&apos;apprentissage</p>
          </div>
        </div>

        {/* Event Registrations */}
        <div className="bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#888]">Inscriptions Événements</p>
            <p className="text-lg font-bold text-white font-mono">{data.activities?.eventRegistrations ?? 0}</p>
            <p className="text-[10px] text-[#666]">participations enregistrées</p>
          </div>
        </div>
      </div>

      {/* Analytics Grid: Status breakdown & Pole performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown Pie */}
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-custom-amber" />
            <span>Répartition par Statut Membre</span>
          </h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statutPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statutPieData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={STATUT_COLORS[idx % STATUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e2020", borderColor: "#333", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs mt-2">
            {statutPieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[#aaa]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_COLORS[idx % STATUT_COLORS.length] }} />
                <span>{entry.name}: <strong className="text-white">{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Pole Performance Bar Chart */}
        <div className="lg:col-span-2 bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-custom-amber" />
            <span>Performance & Moyenne de Points par Pôle</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.poleStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#777" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#777" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#1e2020", borderColor: "#333", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="avgPoints" fill="#fca311" name="Moy. pts/membre" radius={[6, 6, 0, 0]}>
                  {data.poleStats.map((_, index) => (
                    <Cell key={`cell-pole-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Prepa & Class Breakdown */}
      {((data.prepaBreakdown && data.prepaBreakdown.length > 0) || (data.classBreakdown && data.classBreakdown.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prepa Schools */}
          {data.prepaBreakdown && data.prepaBreakdown.length > 0 && (
            <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span>Écoles de Prépa d&apos;Origine</span>
              </h3>
              <div className="space-y-3">
                {data.prepaBreakdown.slice(0, 6).map((prep) => {
                  const pct = Math.round((prep.count / (data.kpis.totalMembers || 1)) * 100);
                  return (
                    <div key={prep.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{prep.name}</span>
                        <span className="text-[#888] font-mono">{prep.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-[#1e2020] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-custom-amber rounded-full"
                          style={{ width: `${Math.min(pct * 2.5, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Points Distribution Histogram */}
          <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-custom-amber" />
              <span>Distribution des Points par Tranches</span>
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pointsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="range" stroke="#777" fontSize={11} />
                  <YAxis stroke="#777" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e2020", borderColor: "#333", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" fill="#fca311" radius={[8, 8, 0, 0]}>
                    {data.pointsDistribution.map((_, index) => (
                      <Cell key={`cell-pts-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CLASSEMENT DE TOUS LES MEMBRES */}
      <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#2a2c2c]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-custom-amber" />
              <span>Classement Général du Club ({fullList.length} membres)</span>
            </h3>
            <p className="text-xs text-[#888] mt-0.5">
              Classement complet basé sur l&apos;ensemble des points cumulés par chaque membre.
            </p>
          </div>

          {/* Search, Pole Filter & Statut Filter */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1e2020] border border-[#333535] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-[#666] outline-none focus:border-custom-amber"
              />
            </div>

            {/* Statut Filter */}
            <div className="flex items-center gap-1 bg-[#1e2020] border border-[#333535] rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#888]" />
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="bg-transparent text-white outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-[#141515]">Tous statuts</option>
                <option value="actif" className="bg-[#141515]">Membre Actif</option>
                <option value="senior" className="bg-[#141515]">Membre Senior</option>
                <option value="alumni" className="bg-[#141515]">Alumni</option>
              </select>
            </div>

            {/* Pole Filter */}
            <div className="flex items-center gap-1 bg-[#1e2020] border border-[#333535] rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#888]" />
              <select
                value={selectedPole}
                onChange={(e) => setSelectedPole(e.target.value)}
                className="bg-transparent text-white outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-[#141515]">Tous les pôles</option>
                {data.poleStats.map((p) => (
                  <option key={p.id} value={p.name} className="bg-[#141515]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222] text-[11px] uppercase tracking-wider text-[#777] font-mono">
                <th className="py-3 px-3">Rang</th>
                <th className="py-3 px-3">Membre</th>
                <th className="py-3 px-3">Pôle(s)</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2020] text-xs">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#666]">
                    Aucun membre ne correspond à la recherche.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((m) => {
                  const isTop3 = m.rank <= 3;
                  const rankColor =
                    m.rank === 1
                      ? "text-[#fca311] font-bold"
                      : m.rank === 2
                      ? "text-slate-300 font-bold"
                      : m.rank === 3
                      ? "text-amber-600 font-bold"
                      : "text-[#666]";

                  return (
                    <tr key={m.id} className="hover:bg-[#1a1c1c] transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${isTop3 ? "bg-[#fca311]/10 border border-[#fca311]/30" : ""}`}>
                          <span className={rankColor}>#{m.rank}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-[#333]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#252828] border border-[#333] flex items-center justify-center text-white font-bold text-xs">
                              {(m.first_name?.[0] || "").toUpperCase()}
                              {(m.last_name?.[0] || "").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">
                              {m.first_name} {m.last_name}
                            </p>
                            {m.role && (
                              <p className="text-[10px] text-[#666] capitalize">{m.role.replace("_", " ")}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {m.pole_name ? (
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border ${getPoleBadgeStyle(m.pole_name)}`}>
                            {m.pole_name}
                          </span>
                        ) : (
                          <span className="text-[#555] italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 capitalize text-[#aaa]">
                        {m.statut_membre ? (
                          <span className="px-2 py-0.5 rounded bg-[#1e2020] border border-[#333] text-[10px]">
                            {m.statut_membre === "actif" ? "Membre Actif" : m.statut_membre === "senior" ? "Membre Senior" : m.statut_membre === "alumni" ? "Alumni" : m.statut_membre}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#fca311]">
                        {m.points_total} pts
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
