"use client";

import React from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Building,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { formatActivityDate } from "@/lib/utils";

interface Props {
  activity: {
    id: string;
    title: string;
    description: string | null;
    content?: string | null;
    date_start: string;
    date_end?: string | null;
    location?: string | null;
    cover_image_url?: string | null;
    image_url?: string | null;
    photo_urls?: string[] | null;
    recap_url?: string | null;
  };
}

export default function EventDetailClient({ activity }: Props) {
  const images = (activity.photo_urls && activity.photo_urls.length > 0)
    ? activity.photo_urls
    : activity.cover_image_url
    ? [activity.cover_image_url]
    : activity.image_url
    ? [activity.image_url]
    : [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Return button */}
      <div>
        <Link
          href="/membre/evenements"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#888] hover:text-custom-amber transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Retour aux événements du club</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Événement Phare Annuel</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {activity.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#aaa]">
          <span className="font-mono flex items-center gap-1.5 text-custom-amber font-semibold">
            <CalendarDays className="w-4 h-4" />
            {formatActivityDate(activity.date_start)}
          </span>

          {activity.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-custom-amber" />
              {activity.location}
            </span>
          )}
        </div>
      </div>

      {/* Main Cover & Gallery of Previous Editions */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden border border-[#2a2c2c] relative shadow-2xl bg-[#141515]">
            <img
              src={images[0]}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-custom-amber" />
              <span>Galerie photos • Éditions précédentes & Immersion</span>
            </div>
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.slice(1).map((url, idx) => (
                <div
                  key={idx}
                  className="h-28 rounded-2xl overflow-hidden border border-[#2a2c2c] hover:border-custom-amber/40 transition-colors shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Photo édition précédente ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description & Detailed Content */}
      <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#2a2c2c] pb-3">
          <Sparkles className="w-5 h-5 text-custom-amber" />
          <span>Présentation & Programme de l&apos;Événement</span>
        </h2>

        {activity.description && (
          <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-line">
            {activity.description}
          </p>
        )}

        {activity.content && (
          <div className="pt-4 border-t border-[#2a2c2c] text-xs text-[#aaa] leading-relaxed whitespace-pre-line">
            {activity.content}
          </div>
        )}
      </div>

      {/* Informative Notice: Inscription opening later */}
      <div className="bg-gradient-to-r from-sky-950/40 via-[#141d2f] to-[#141515] border border-sky-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Inscriptions Bientôt Ouvertes
            </h3>
            <p className="text-xs text-[#aaa] leading-relaxed">
              Cet événement fait partie des grands rendez-vous annuels du Club GI ENIT. Les inscriptions et réservations de places ouvriront prochainement. Restez informés via l&apos;espace Annonces du club !
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Link
            href="/membre/annonces"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-colors"
          >
            <span>Consulter les Annonces du Club</span>
          </Link>
          <Link
            href="/membre/calendrier"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
          >
            <span>Voir dans le Calendrier</span>
          </Link>
        </div>
      </div>

      {/* Optional Recap Link if finished */}
      {activity.recap_url && (
        <div className="bg-[#141515] border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-medium">
            Le compte-rendu et les livrables de cet événement sont disponibles.
          </span>
          <a
            href={activity.recap_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-emerald-300 hover:underline"
          >
            Consulter le compte-rendu →
          </a>
        </div>
      )}
    </div>
  );
}