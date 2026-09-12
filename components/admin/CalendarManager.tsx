"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  Users,
  X,
  Loader2,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type CalendarActivity = {
  id: string;
  title: string;
  description: string | null;
  type: "event" | "visit" | "formation" | string;
  date_start: string;
  date_end?: string | null;
  location?: string | null;
  poles?: { id: string; name: string } | null;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; dotColor: string; badgeClass: string; icon: React.ElementType }
> = {
  visit: {
    label: "Visite",
    dotColor: "bg-amber-400",
    badgeClass: "bg-amber-500/15 text-[#fca311] border-amber-500/30",
    icon: Building,
  },
  formation: {
    label: "Formation",
    dotColor: "bg-emerald-400",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: GraduationCap,
  },
  event: {
    label: "Événement / AG",
    dotColor: "bg-sky-400",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: CalendarDays,
  },
};

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function CalendarManager() {
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CalendarActivity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<string>("event");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("14:00");
  const [formLocation, setFormLocation] = useState("ENIT - Salle GI");
  const [formDescription, setFormDescription] = useState("");

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur chargement");
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = useMemo(() => {
    let list = activities;
    if (filterType !== "all") {
      list = list.filter((a) => a.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  }, [activities, filterType, search]);

  // Current month activities for mini calendar
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const activitiesThisMonth = useMemo(() => {
    return activities.filter((a) => {
      const d = new Date(a.date_start);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [activities, year, month]);

  const openAddModal = () => {
    setEditingActivity(null);
    setFormTitle("");
    setFormType("event");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime("14:00");
    setFormLocation("ENIT - Salle GI");
    setFormDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (act: CalendarActivity) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormType(act.type);
    const d = new Date(act.date_start);
    setFormDate(d.toISOString().slice(0, 10));
    setFormTime(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
    setFormLocation(act.location || "");
    setFormDescription(act.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const parsedDate = new Date(`${formDate}T${formTime}`);
      const fullDateStart = !isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : new Date().toISOString();

      const payload = {
        ...(editingActivity ? { id: editingActivity.id } : {}),
        title: formTitle.trim(),
        type: formType,
        date_start: fullDateStart,
        location: formLocation.trim() || null,
        description: formDescription.trim() || null,
      };

      const res = await fetch("/api/calendar", {
        method: editingActivity ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de l'enregistrement");

      setIsModalOpen(false);
      fetchActivities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette activité du calendrier ?")) return;
    try {
      const res = await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erreur suppression");
      }
      fetchActivities();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-custom-amber" />
            <span>Gestion du Calendrier</span>
          </h2>
          <p className="text-xs text-[#888] mt-1">
            Programmez les événements, AG, réunions, visites et formations du Club GI ENIT.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-custom-amber hover:bg-[#ffc887] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(252,163,17,0.35)] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Programmer un Événement / AG</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#141515] border border-[#2a2c2c] p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <input
            type="text"
            placeholder="Rechercher par titre, lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-xs text-white outline-none focus:border-custom-amber"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: "all", label: "Tous", color: "bg-white" },
            { key: "visit", label: "Visites", color: "bg-amber-400" },
            { key: "formation", label: "Formations", color: "bg-emerald-400" },
            { key: "event", label: "Événements & AG", color: "bg-sky-400" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === f.key
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-[#888] hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${f.color}`} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Month nav for mini overview */}
      <div className="flex items-center gap-3 bg-[#141515] border border-[#2a2c2c] p-3 rounded-2xl">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-white font-mono">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="text-[11px] text-[#888] font-mono ml-auto">
          {activitiesThisMonth.length} activité{activitiesThisMonth.length !== 1 ? "s" : ""} ce mois
        </span>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-custom-amber animate-spin" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-20 space-y-3 bg-[#141515] border border-[#2a2c2c] rounded-2xl">
          <CalendarDays className="w-10 h-10 text-[#444] mx-auto" />
          <p className="text-sm font-bold text-white">Aucune activité trouvée</p>
          <p className="text-xs text-[#888]">
            Cliquez sur &quot;Programmer&quot; pour ajouter une activité au calendrier.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((act) => {
            const conf = TYPE_CONFIG[act.type] || TYPE_CONFIG.event;
            const Icon = conf.icon;
            const d = new Date(act.date_start);
            const dateStr = d.toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const timeStr = `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
            const isPast = d < new Date();

            return (
              <div
                key={act.id}
                className={`bg-[#141515] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isPast ? "border-[#222424] opacity-60" : "border-[#2a2c2c] hover:border-custom-amber/40"
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Date block */}
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#1e2020] border border-[#333535] flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white leading-none">{d.getDate()}</span>
                    <span className="text-[9px] font-mono uppercase text-custom-amber font-bold mt-0.5">
                      {MONTH_NAMES[d.getMonth()].slice(0, 3)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${conf.badgeClass}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{conf.label}</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#888]">
                        {dateStr} · {timeStr}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">{act.title}</h4>

                    <div className="flex items-center gap-3 text-[11px] text-[#aaa]">
                      {act.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-custom-amber" />
                          <span>{act.location}</span>
                        </span>
                      )}
                      {act.description && (
                        <span className="truncate max-w-xs text-[#666]">{act.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={
                      act.type === "visit"
                        ? `/membre/visites/${act.id}`
                        : act.type === "formation"
                        ? `/membre/formations/${act.id}`
                        : `/membre/evenements/${act.id}`
                    }
                    target="_blank"
                    className="p-2 rounded-xl bg-[#1e2020] hover:bg-sky-500/15 text-[#aaa] hover:text-sky-400 transition-colors cursor-pointer"
                    title="Voir la page membre"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEditModal(act)}
                    className="p-2 rounded-xl bg-[#1e2020] hover:bg-custom-amber/15 text-[#aaa] hover:text-custom-amber transition-colors cursor-pointer"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="p-2 rounded-xl bg-[#1e2020] hover:bg-red-500/15 text-[#aaa] hover:text-red-400 transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Activity */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#141515] border border-[#333535] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2c2c]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {editingActivity ? "Modifier l'activité" : "Programmer un Événement / AG"}
                  </h3>
                  <p className="text-[10px] text-[#888]">
                    {editingActivity
                      ? "Mettez à jour les informations de l'activité."
                      : "Ajoutez une session au calendrier officiel du Club GI ENIT."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#888] hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  Type d&apos;activité
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("event")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      formType === "event"
                        ? "bg-sky-500/20 border-sky-400 text-sky-300"
                        : "border-[#333535] text-[#888] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>AG / Réunion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("formation")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      formType === "formation"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                        : "border-[#333535] text-[#888] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Formation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("visit")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      formType === "visit"
                        ? "bg-amber-500/20 border-custom-amber text-[#fca311]"
                        : "border-[#333535] text-[#888] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Visite</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">Titre *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Assemblée Générale Ordinaire 2026"
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3.5 text-xs text-white outline-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#888] uppercase">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#888] uppercase">Heure *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">Lieu / Salle</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ex: Salle GI, Amphi B..."
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3.5 text-xs text-white outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">Description / Ordre du jour</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ordre du jour, prérequis..."
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3.5 text-xs text-white outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a2c2c] mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#333535] text-xs font-semibold text-[#aaa] hover:bg-white/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-custom-amber text-black font-bold text-xs hover:bg-[#ffc887] transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(252,163,17,0.3)]"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingActivity ? (
                    "Enregistrer les modifications"
                  ) : (
                    "Programmer la session"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
