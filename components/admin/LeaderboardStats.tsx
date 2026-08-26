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
    statutBreakdown: {
      actif: number;
      senior: number;
      alumni: number;
      non_renseigne: number;
    };
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
}

const STATUT_COLORS = ["#3b82f6", "#fca311", "#a855f7", "#6b7280"];
const BAR_COLORS = ["#fca311", "#e5e5e5", "#3b82f6", "#10b981", "#8b5cf6"];

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
      if (search.trim()) {
        const query = search.toLowerCase();
        const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
        const pole = (m.pole_name || "").toLowerCase();
        if (!fullName.includes(query) && !pole.includes(query)) return false;
      }
      return true;
    });
  }, [fullList, search, selectedPole]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-custom-amber animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#666]">Génération des statistiques et du classement...</p>
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
            <span>Statistiques Globales & Classement de Tous les Membres</span>
          </h2>
          <p className="text-xs text-[#888] mt-1">
            Analyse complète de l&apos;engagement, répartition des points et classement exhaustif de tous les membres du Club GI ENIT.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
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
            <span>● {data.kpis.activeMembers} actifs</span>
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
            {data.kpis.profileCompletionRate}%
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des points */}
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-custom-amber" />
            <span>Distribution des Points par Tranches</span>
          </h3>
          <div className="h-64 w-full">
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
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution temporelle des points */}
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Évolution des Points Attribués (30 derniers jours)</span>
          </h3>
          <div className="h-64 w-full">
            {data.pointsTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#666]">
                Aucun mouvement de points récent.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.pointsTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" stroke="#777" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#777" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e2020", borderColor: "#333", borderRadius: 12, fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

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

          {/* Search & Pole Filter */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-[#666] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher membre..."
                className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none placeholder-[#666]"
              />
            </div>

            {data.poleStats.length > 0 && (
              <select
                value={selectedPole}
                onChange={(e) => setSelectedPole(e.target.value)}
                className="bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2 px-3 text-xs text-[#aaa] outline-none"
              >
                <option value="all">Tous les pôles</option>
                {data.poleStats.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <div className="max-h-[500px] overflow-y-auto divide-y divide-[#2a2c2c]/40 pr-1">
          {filteredLeaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#777]">
              Aucun membre trouvé pour ces critères de recherche.
            </div>
          ) : (
            filteredLeaderboard.map((member) => (
              <div
                key={member.id}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 font-mono ${
                      member.rank === 1
                        ? "bg-custom-amber text-black shadow-[0_0_12px_rgba(252,163,17,0.45)]"
                        : member.rank === 2
                        ? "bg-gray-300 text-black shadow-sm"
                        : member.rank === 3
                        ? "bg-amber-700 text-white shadow-sm"
                        : "bg-[#1e2020] text-[#888] border border-[#2e3030]"
                    }`}
                  >
                    #{member.rank}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#1e2020] border border-[#333] flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-custom-amber">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.first_name?.[0] || "M"}</span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white leading-snug">
                      {member.first_name || "Membre"} {member.last_name || ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {(member.pole_names && member.pole_names.length > 0
                        ? member.pole_names
                        : member.pole_name
                        ? [member.pole_name]
                        : []
                      ).map((pName, pIdx) => (
                        <span
                          key={pIdx}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono ${getPoleBadgeStyle(
                            pName
                          )}`}
                        >
                          {pName.replace(/^Pôle\s+/i, "")}
                        </span>
                      ))}
                      {member.statut_membre && (
                        <span className="text-[9px] uppercase font-bold text-custom-amber bg-custom-amber/10 px-1.5 py-0.5 rounded border border-custom-amber/20">
                          {member.statut_membre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-custom-amber">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{member.points_total} pts</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
