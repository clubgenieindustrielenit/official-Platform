"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  CalendarDays,
  ExternalLink,
} from "lucide-react";

export type CalendarActivity = {
  id: string;
  title: string;
  description: string | null;
  type: "event" | "visit" | "formation" | string;
  date_start: string;
  date_end?: string | null;
  location?: string | null;
  entreprise?: string | null;
  trainer_name?: string | null;
  pole_id?: string | null;
  poles?: { id: string; name: string } | null;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; dotColor: string; badgeClass: string; icon: React.ElementType }
> = {
  visit: {
    label: "Visite Industrielle",
    dotColor: "bg-amber-400",
    badgeClass: "bg-amber-500/15 text-[#fca311] border-amber-500/30",
    icon: Building,
  },
  formation: {
    label: "Formation Technique",
    dotColor: "bg-emerald-400",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: GraduationCap,
  },
  event: {
    label: "Événement Club / AG",
    dotColor: "bg-sky-400",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: CalendarDays,
  },
};

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarClient({
  initialActivities,
}: {
  initialActivities: CalendarActivity[];
}) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<string>("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  const displayedActivities = useMemo(() => {
    if (filterType === "all") return initialActivities;
    return initialActivities.filter((a) => a.type === filterType);
  }, [initialActivities, filterType]);

  const activitiesThisMonth = useMemo(() => {
    return displayedActivities.filter((a) => {
      const d = new Date(a.date_start);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [displayedActivities, year, month]);

  const getActivitiesForDay = (day: number) => {
    return activitiesThisMonth.filter((a) => {
      const d = new Date(a.date_start);
      return d.getDate() === day;
    });
  };

  const selectedDayActivities = useMemo(() => {
    if (!selectedDate) return [];
    return displayedActivities.filter((a) => {
      const d = new Date(a.date_start);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
    });
  }, [displayedActivities, selectedDate]);

  const changeMonth = (dir: number) => {
    const nextDate = new Date(year, month + dir, 1);
    setCurrentDate(nextDate);
    setSelectedDate(new Date(year, month + dir, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Filter Bar (read-only, no add button) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-[#141515] border border-[#2a2c2c] p-3 sm:p-4 rounded-3xl shadow-lg">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterType === "all"
              ? "bg-white text-black shadow-sm"
              : "text-[#888] hover:text-white hover:bg-white/5"
          }`}
        >
          Tous ({initialActivities.length})
        </button>
        <button
          onClick={() => setFilterType("visit")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filterType === "visit"
              ? "bg-custom-amber text-black shadow-sm"
              : "text-[#888] hover:text-custom-amber hover:bg-custom-amber/10"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-custom-amber" />
          <span>Visites</span>
        </button>
        <button
          onClick={() => setFilterType("formation")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filterType === "formation"
              ? "bg-emerald-400 text-black shadow-sm"
              : "text-[#888] hover:text-emerald-400 hover:bg-emerald-500/10"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Formations</span>
        </button>
        <button
          onClick={() => setFilterType("event")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filterType === "event"
              ? "bg-sky-400 text-black shadow-sm"
              : "text-[#888] hover:text-sky-400 hover:bg-sky-500/10"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Événements & AG</span>
        </button>
      </div>

      {/* Main Calendar Grid & Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                {MONTH_NAMES[month]} <span className="text-custom-amber font-mono">{year}</span>
              </h2>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-lg bg-[#1e2020] hover:bg-[#252828] border border-[#333535] text-[11px] font-bold text-[#aaa] hover:text-white transition-colors"
              >
                Aujourd&apos;hui
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#1e2020] border border-[#2a2c2c] p-1 rounded-xl">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAYS.map((d, i) => (
              <div
                key={i}
                className="text-center text-[11px] font-mono font-bold uppercase text-[#777] py-1.5"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-white/[0.01]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayActs = getActivitiesForDay(day);
              const isSelected =
                selectedDate?.getDate() === day &&
                selectedDate?.getMonth() === month &&
                selectedDate?.getFullYear() === year;
              const isToday =
                new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`group relative aspect-square rounded-2xl border flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-custom-amber bg-custom-amber/15 shadow-[0_0_15px_rgba(252,163,17,0.2)]"
                      : isToday
                      ? "border-custom-amber/50 bg-[#1a1c1c]"
                      : "border-[#222424] hover:border-custom-amber/30 bg-[#121313] hover:bg-[#181a1a]"
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected
                          ? "text-custom-amber"
                          : isToday
                          ? "text-white"
                          : "text-[#aaa] group-hover:text-white"
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-custom-amber animate-ping" />
                    )}
                  </div>

                  {dayActs.length > 0 && (
                    <div className="w-full flex flex-col gap-0.5">
                      <div className="flex items-center justify-center gap-1">
                        {dayActs.slice(0, 3).map((act) => {
                          const conf = TYPE_CONFIG[act.type] || TYPE_CONFIG.event;
                          return (
                            <span
                              key={act.id}
                              className={`w-1.5 h-1.5 rounded-full ${conf.dotColor}`}
                            />
                          );
                        })}
                      </div>
                      {dayActs.length > 1 && (
                        <span className="text-[9px] font-mono text-center text-custom-amber/80 font-bold hidden sm:block">
                          {dayActs.length} acts
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details (read-only) */}
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="pb-3 border-b border-[#2a2c2c]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-custom-amber">
                Planning Quotidien
              </span>
              <h3 className="text-base font-bold text-white capitalize mt-0.5">
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            </div>

            {selectedDayActivities.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CalendarRange className="w-10 h-10 text-[#444] mx-auto stroke-[1.5]" />
                <p className="text-xs font-semibold text-white">Aucun événement ce jour-là</p>
                <p className="text-[11px] text-[#777] max-w-xs mx-auto">
                  Consultez les autres dates pour voir les activités du Club GI ENIT.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {selectedDayActivities.map((act) => {
                  const conf = TYPE_CONFIG[act.type] || TYPE_CONFIG.event;
                  const Icon = conf.icon;
                  const startDate = new Date(act.date_start);
                  const timeFormatted = `${startDate.getHours().toString().padStart(2, "0")}h${startDate
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`;

                  const linkHref =
                    act.type === "visit"
                      ? `/membre/visites/${act.id}`
                      : act.type === "formation"
                      ? `/membre/formations/${act.id}`
                      : `/membre/evenements/${act.id}`;

                  return (
                    <div
                      key={act.id}
                      className="bg-[#1a1c1c] border border-[#2e3030] hover:border-custom-amber/40 rounded-2xl p-4 space-y-2.5 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${conf.badgeClass}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{conf.label}</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-custom-amber" />
                          <span>{timeFormatted}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-custom-amber transition-colors leading-snug">
                        {act.title}
                      </h4>

                      {act.description && (
                        <p className="text-xs text-[#888] line-clamp-2 leading-relaxed">
                          {act.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#252828] flex items-center justify-between text-[11px] text-[#aaa]">
                        {act.location ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-custom-amber shrink-0" />
                            <span>{act.location}</span>
                          </span>
                        ) : (
                          <span className="text-[#666]">Lieu à confirmer</span>
                        )}
                        <Link
                          href={linkHref}
                          className="text-custom-amber font-bold hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                          <span>Détails</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}