"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles,
  X,
  Workflow,
  Lightbulb,
  Factory,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
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

const CATEGORY_COLORS: Record<string, string> = {
  Workshop: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Hackathon: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Visite: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Formation: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Conférence": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Autre: "bg-custom-amber/20 text-custom-amber border-custom-amber/30",
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

/** Returns all photos for an activity (photo_urls takes priority, falls back to image_url) */
function getPhotos(act: Activity): string[] {
  if (act.photo_urls && act.photo_urls.length > 0) return act.photo_urls;
  if (act.image_url) return [act.image_url];
  return [];
}

export default function ClubActivitiesSection() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const res = await fetch("/api/activities?limit=9", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.activities) {
          setActivities(data.activities);
        }
      } catch (err) {
        console.error("Erreur de chargement des activités", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  // Hide section entirely when no activities after loading
  if (!loading && activities.length === 0) return null;

  return (
    <section id="activities" className="py-24 bg-black border-t border-custom-navy/20 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-custom-amber/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-custom-navy border border-custom-amber/20 text-custom-amber text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vie du Club &amp; Événements</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-custom-white tracking-tight">
              Activités <span className="text-custom-amber">Récentes</span>
            </h2>
            <p className="text-sm text-custom-gray/60 leading-relaxed">
              Workshops, hackathons, visites industrielles et formations — les moments forts du Club Génie Industriel ENIT.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Link
              href="/activities"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-custom-navy hover:bg-custom-navy/80 border border-custom-gray/10 hover:border-custom-amber/40 text-custom-white text-xs font-bold uppercase tracking-wider transition-all duration-300 group whitespace-nowrap"
            >
              <span>Voir toutes les activités</span>
              <ChevronRight className="w-4 h-4 text-custom-amber group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Instagram-style Photo Grid */}
        {loading ? (
          // Skeleton grid
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-custom-navy/40 border border-custom-gray/5 rounded-sm animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
            {activities.map((act, idx) => {
              const photos = getPhotos(act);
              const thumb = photos[0] || null;
              const colorClass = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.Autre;

              return (
                <motion.button
                  key={act.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedActivity(act)}
                  className="aspect-square relative overflow-hidden rounded-sm bg-custom-navy group focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-amber cursor-pointer"
                  aria-label={`Voir l'activité : ${act.title}`}
                >
                  {/* Thumbnail */}
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={act.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    // Gradient placeholder when no photo
                    <div className="absolute inset-0 bg-gradient-to-br from-custom-navy via-[#1a2540] to-black flex items-center justify-center">
                      <div className="text-custom-amber/30">
                        {getCategoryIcon(act.category)}
                      </div>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col items-start justify-end p-3 sm:p-4">
                    <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 space-y-1.5 w-full`}>
                      {/* Category badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${colorClass}`}>
                        {getCategoryIcon(act.category)}
                        {act.category}
                      </span>
                      {/* Title */}
                      <p className="text-white text-xs font-bold leading-tight line-clamp-2 text-left">
                        {act.title}
                      </p>
                      {/* Date */}
                      <p className="text-white/60 text-[10px] font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-custom-amber" />
                        {new Date(act.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Multiple photos indicator */}
                  {photos.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] font-mono text-white/80 border border-white/10">
                      +{photos.length}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* "Voir plus" link below grid */}
        {!loading && activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <Link
              href="/activities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-custom-amber/30 text-custom-amber hover:bg-custom-amber hover:text-black font-bold text-xs uppercase tracking-wider transition-all duration-300"
            >
              <span>Voir toutes les activités</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Activity Detail Modal with Photo Carousel                           */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="bg-[#0e1420] border border-custom-amber/20 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl space-y-5"
            >
              {/* Close */}
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
                className="rounded-2xl border border-custom-gray/10"
              />

              {/* Meta row */}
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

              {/* Footer */}
              <div className="pt-4 flex justify-between items-center">
                <Link
                  href="/activities"
                  onClick={() => setSelectedActivity(null)}
                  className="text-xs font-mono text-custom-amber/70 hover:text-custom-amber underline underline-offset-2 transition-colors"
                >
                  Voir toutes les activités →
                </Link>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-6 py-2.5 rounded-xl bg-custom-amber text-black font-extrabold text-xs uppercase tracking-wider hover:bg-custom-amber/90 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
