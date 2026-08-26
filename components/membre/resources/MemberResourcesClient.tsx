"use client";

import React, { useState, useMemo } from "react";
import { BookOpen, ExternalLink, FileText, Search, GraduationCap, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface MemberResource {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  academic_year: string | null;
  file_url: string;
  drive_url: string | null;
  created_at: string;
  poles: { name: string } | null;
}

const CLASS_TABS = [
  { id: "all", label: "Toutes les classes" },
  { id: "1ère année GI", label: "1ère Année GI" },
  { id: "2ème année GI", label: "2ème Année GI" },
];

export default function MemberResourcesClient({
  initialResources,
}: {
  initialResources: MemberResource[];
}) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredResources = useMemo(() => {
    return initialResources.filter((res) => {
      // Class filter
      if (selectedClass !== "all") {
        const year = res.academic_year || "1ère année GI";
        if (!year.includes(selectedClass) && !year.includes("Tronc commun") && !year.includes("Tous")) {
          return false;
        }
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesDesc = (res.description || "").toLowerCase().includes(q);
        const matchesPole = (res.poles?.name || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesPole) return false;
      }

      return true;
    });
  }, [initialResources, selectedClass, search]);

  const count1GI = initialResources.filter((r) => (r.academic_year || "1ère année GI").includes("1ère")).length;
  const count2GI = initialResources.filter((r) => (r.academic_year || "").includes("2ème")).length;

  return (
    <div className="space-y-6">
      {/* Class filter tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Class Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#141515] border border-[#2a2c2c] overflow-x-auto">
          {CLASS_TABS.map((tab) => {
            const isActive = selectedClass === tab.id;
            const count =
              tab.id === "all"
                ? initialResources.length
                : tab.id === "1ère année GI"
                ? count1GI
                : count2GI;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedClass(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-custom-amber text-black shadow-md"
                    : "text-[#888] hover:text-white hover:bg-white/5"
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#888]"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive ? "bg-black/20 text-black" : "bg-[#1e2020] text-[#777]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#666] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un cours, DS, examen..."
            className="w-full bg-[#141515] border border-[#2a2c2c] focus:border-custom-amber rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white outline-none placeholder-[#666] transition-colors"
          />
        </div>
      </div>

      {/* Resource Count Summary */}
      <div className="flex items-center justify-between text-xs text-[#888] px-1">
        <span>
          Affichage de <strong className="text-white">{filteredResources.length}</strong> document(s)
          {selectedClass !== "all" && ` pour la ${selectedClass}`}
        </span>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-[#141515] rounded-3xl border border-dashed border-[#2a2c2c] py-16 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-[#444] mx-auto stroke-[1.5]" />
          <p className="text-sm font-bold text-white">Aucune ressource disponible pour cette sélection</p>
          <p className="text-xs text-[#888] max-w-md mx-auto">
            {search
              ? "Aucun document ne correspond à vos critères de recherche."
              : `Les documents partagés pour la ${selectedClass} apparaîtront ici dès leur publication.`}
          </p>
          {(search || selectedClass !== "all") && (
            <button
              onClick={() => {
                setSelectedClass("all");
                setSearch("");
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-custom-amber/15 text-custom-amber border border-custom-amber/30 text-xs font-bold hover:bg-custom-amber hover:text-black transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((res) => {
              const targetUrl = res.drive_url || res.file_url;
              return (
                <motion.div
                  key={res.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#141515] border border-[#2a2c2c] hover:border-custom-amber/40 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 shadow-lg group hover:shadow-[0_0_25px_rgba(252,163,17,0.08)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#1e2020] border border-[#2a2c2c] flex items-center justify-center text-custom-amber shrink-0 group-hover:scale-105 transition-transform group-hover:border-custom-amber/40">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-custom-amber font-mono font-bold bg-custom-amber/10 px-2.5 py-0.5 rounded-lg border border-custom-amber/20">
                              <GraduationCap className="w-3 h-3" />
                              <span>{res.academic_year || "1ère année GI"}</span>
                            </span>
                            {res.poles && (
                              <span className="text-[10px] text-[#aaa] font-mono bg-[#1e2020] px-2 py-0.5 rounded-md border border-[#333535]">
                                Pôle {res.poles.name.replace(/^Pôle\s+/i, "")}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-custom-amber transition-colors leading-snug">
                            {res.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {res.description && (
                      <p className="text-xs text-[#888] mt-3 line-clamp-2 leading-relaxed pl-1">
                        {res.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#2a2c2c]/80 flex items-center justify-between">
                    <span className="text-[11px] text-[#666] font-mono">
                      {new Date(res.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {targetUrl && (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-custom-amber/15 hover:bg-custom-amber hover:text-black text-custom-amber font-bold text-xs transition-all cursor-pointer border border-custom-amber/30 group-hover:shadow-[0_0_15px_rgba(252,163,17,0.2)]"
                      >
                        <span>{res.drive_url ? "Ouvrir Drive" : "Consulter le document"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
