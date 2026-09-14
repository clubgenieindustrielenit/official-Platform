"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Sparkles,
  X,
  Workflow,
  Lightbulb,
  Factory,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ActivityPhotoCarousel from "@/components/home/ActivityPhotoCarousel";

export interface Activity {
  id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  photo_urls?: string[];
  category: "Workshop" | "Hackathon" | "Visite" | "Formation" | "Conférence" | "Autre";
  date: string;
  location?: string;
  status: "draft" | "published" | "archived";
  created_at: string;
}

const CATEGORIES = ["Toutes", "Workshop", "Hackathon", "Conférence"];
const PER_PAGE = 9;

const CATEGORY_COLORS: Record<string, string> = {
  Workshop: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Hackathon: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Visite: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Formation: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Conférence": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Autre: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

function getCategoryIcon(category: string) {
  switch (category) {
    case "Workshop": return <Workflow className="w-4 h-4" />;
    case "Hackathon": return <Lightbulb className="w-4 h-4" />;
    case "Visite": return <Factory className="w-4 h-4" />;
    case "Formation": return <ShieldCheck className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
}

function getPhotos(act: Activity): string[] {
  if (act.photo_urls && act.photo_urls.length > 0) return act.photo_urls;
  if (act.image_url) return [act.image_url];
  return [];
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("per_page", String(PER_PAGE));
      params.set("page", String(page));
      if (selectedCategory !== "Toutes") params.set("category", selectedCategory);

      const res = await fetch(`/api/activities?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.activities) {
        setActivities(data.activities);
        setTotal(data.total ?? data.activities.length);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des activités", err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = activities.filter((act) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      act.title.toLowerCase().includes(q) ||
      act.description.toLowerCase().includes(q) ||
      (act.location && act.location.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="bg-black text-custom-gray min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-custom-amber hover:underline uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-custom-navy border border-custom-amber/20 text-custom-amber text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Actualités &amp; Réalisations</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-custom-white tracking-tight">
            Activités du <span className="text-custom-amber">Club</span>
          </h1>
          <p className="text-base text-custom-gray/70 max-w-3xl leading-relaxed">
            Consultez nos récents workshops, hackathons, visites industrielles et formations certifiantes organisées par le Club Génie Industriel ENIT.
          </p>
        </motion.div>

        {/* Search & Filter Toolbar */}
        <div className="bg-custom-navy border border-custom-gray/10 rounded-2xl p-4 sm:p-6 mb-12 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-custom-gray/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une activité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-custom-gray/10 focus:border-custom-amber rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-custom-gray/40 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-custom-gray/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                    selectedCategory === cat
                      ? "bg-custom-amber text-custom-black border-custom-amber font-extrabold shadow-[0_0_15px_rgba(252,163,17,0.2)]"
                      : "bg-black/50 text-custom-gray/70 border-custom-gray/10 hover:border-custom-amber/30 hover:text-custom-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: PER_PAGE }).map((_, n) => (
              <div
                key={n}
                className="bg-custom-navy/40 border border-custom-gray/10 rounded-3xl p-6 h-72 animate-pulse"
              />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20 bg-custom-navy/20 border border-custom-gray/10 rounded-3xl p-8 space-y-3">
            <Filter className="w-10 h-10 text-custom-gray/40 mx-auto" />
            <h3 className="text-custom-white font-bold text-lg">Aucune activité disponible</h3>
            <p className="text-custom-gray/60 text-xs">
              Essayez de modifier vos critères de recherche ou de changer de catégorie.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredActivities.map((act, idx) => {
              const photos = getPhotos(act);
              const thumb = photos[0] || null;
              const colorClass = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.Autre;

              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{
                    y: -6,
                    borderColor: "rgba(252, 163, 17, 0.4)",
                    boxShadow: "0 15px 35px -10px rgba(252, 163, 17, 0.15)",
                  }}
                  onClick={() => setSelectedActivity(act)}
                  className="bg-custom-navy p-0 rounded-3xl border border-custom-gray/10 flex flex-col overflow-hidden transition-all duration-300 cursor-pointer group"
                >
                  {/* Cover photo */}
                  <div className="relative w-full h-52 overflow-hidden bg-black">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={act.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-custom-navy via-[#1a2540] to-black flex items-center justify-center">
                        <div className="text-custom-amber/20">
                          {getCategoryIcon(act.category)}
                        </div>
                      </div>
                    )}
                    {/* Category badge */}
                    <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm ${colorClass}`}>
                      {getCategoryIcon(act.category)}
                      {act.category}
                    </div>
                    {/* Multi-photo indicator */}
                    {photos.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-mono text-white/80 border border-white/10">
                        +{photos.length} photos
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6 space-y-3">
                    <h3 className="text-custom-white font-extrabold text-lg leading-snug group-hover:text-custom-amber transition-colors line-clamp-2">
                      {act.title}
                    </h3>
                    <p className="text-custom-gray/70 text-xs leading-relaxed line-clamp-3 flex-1">
                      {act.description}
                    </p>

                    <div className="pt-4 border-t border-custom-gray/5 flex flex-wrap items-center justify-between text-[11px] font-mono text-custom-gray/50 gap-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-custom-amber" />
                        {new Date(act.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {act.location && (
                        <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                          <MapPin className="w-3.5 h-3.5 text-custom-amber" />
                          {act.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-custom-gray/10 bg-custom-navy text-xs font-mono text-custom-gray/70 hover:border-custom-amber/40 hover:text-custom-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono transition-all ${
                    page === i + 1
                      ? "bg-custom-amber text-black font-bold"
                      : "bg-custom-navy text-custom-gray/60 hover:text-white border border-custom-gray/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-custom-gray/10 bg-custom-navy text-xs font-mono text-custom-gray/70 hover:border-custom-amber/40 hover:text-custom-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="bg-[#0e1420] border border-custom-amber/20 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl space-y-5"
            >
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-5 right-5 p-2 text-custom-gray/60 hover:text-white bg-black/40 rounded-full border border-custom-gray/10 transition-colors z-10"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Photo Carousel */}
              <ActivityPhotoCarousel
                photos={getPhotos(selectedActivity)}
                alt={selectedActivity.title}
                aspectRatio="aspect-video"
                className="border border-custom-gray/10"
              />

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${CATEGORY_COLORS[selectedActivity.category] || CATEGORY_COLORS.Autre}`}>
                  {getCategoryIcon(selectedActivity.category)}
                  {selectedActivity.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono text-custom-gray/60">
                  <Calendar className="w-3.5 h-3.5 text-custom-amber" />
                  {new Date(selectedActivity.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {selectedActivity.location && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-custom-gray/60">
                    <MapPin className="w-3.5 h-3.5 text-custom-amber" />
                    {selectedActivity.location}
                  </span>
                )}
              </div>

              {/* Title + description */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-custom-white leading-tight">
                  {selectedActivity.title}
                </h3>
                <p className="text-custom-gray/80 text-sm leading-relaxed">
                  {selectedActivity.description}
                </p>
              </div>

              {/* Detailed content */}
              {selectedActivity.content && (
                <div className="pt-4 border-t border-custom-gray/10 space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-custom-amber tracking-wider">
                    Compte-rendu détaillé
                  </h4>
                  <div className="text-sm text-custom-gray/70 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-2xl border border-custom-gray/5">
                    {selectedActivity.content}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-6 py-2.5 rounded-xl bg-custom-amber text-custom-black font-extrabold text-xs uppercase tracking-wider hover:bg-custom-amber/90 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
