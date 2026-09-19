"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Building,
  ShieldCheck,
} from "lucide-react";
import { Database } from "@/lib/supabase/database.types";


type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Registration = Database["public"]["Tables"]["event_registrations"]["Row"];

interface VisitEnrollmentCardProps {
  activity: Activity;
  initialRegistration: Registration | null;
  initialRegisteredCount: number;
  userId: string;
}

export default function VisitEnrollmentCard({
  activity,
  initialRegistration,
  initialRegisteredCount,
  userId,
}: VisitEnrollmentCardProps) {
  const [registration, setRegistration] = useState<Registration | null>(initialRegistration);
  const [registeredCount, setRegisteredCount] = useState<number>(initialRegisteredCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const capacity = activity.capacity;
  const isFull = capacity ? registeredCount >= capacity : false;
  const remainingPlaces = capacity ? Math.max(0, capacity - registeredCount) : null;
  const percentFilled = capacity ? Math.min(100, Math.round((registeredCount / capacity) * 100)) : 0;

  // Check if visit is past or upcoming
  const visitDate = new Date(activity.date_start || activity.date || "");
  const isPast = !isNaN(visitDate.getTime()) && visitDate < new Date();

  const handleRegister = async () => {
    if (!userId) {
      setError("Veuillez vous connecter pour vous inscrire.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const optimisticReg: Registration = {
        id: "temp-id",
        activity_id: activity.id,
        user_id: userId,
        status: isFull ? "waitlisted" : "confirmed",
        queue_position: null,
        attended: null,
        created_at: new Date().toISOString(),
      };
      setRegistration(optimisticReg);

      const res = await fetch("/api/activities/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: activity.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegistration(initialRegistration);
        throw new Error(data.error || "Erreur lors de l'inscription.");
      }

      if (data.registration) {
        setRegistration(data.registration);
      }
      if (data.registeredCount !== undefined) {
        setRegisteredCount(data.registeredCount);
      } else {
        setRegisteredCount((prev) => prev + 1);
      }

      // Status panel below handles the post-registration display
      setSuccessMessage(null);
    } catch (err: any) {
      setError(err.message || "Impossible de s'inscrire pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!registration || registration.id === "temp-id") return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const prevReg = registration;
    setRegistration(null);

    try {
      const res = await fetch(
        `/api/activities/register?activity_id=${activity.id}&id=${registration.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setRegistration(prevReg);
        throw new Error(data.error || "Annulation impossible.");
      }

      if (data.registeredCount !== undefined) {
        setRegisteredCount(data.registeredCount);
      } else {
        setRegisteredCount((prev) => Math.max(0, prev - 1));
      }
      setSuccessMessage("Votre désistement a été pris en compte.");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'annulation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-custom-amber/5 blur-[90px] pointer-events-none" />

      {/* Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2a2c2c]">
        <div>
          {activity.entreprise && (
            <div className="flex items-center gap-1 text-xs text-custom-amber font-semibold mb-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>{activity.entreprise}</span>
            </div>
          )}
          <h3 className="text-lg font-bold text-white">Modalités d&apos;inscription</h3>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Status or Enrollment Action */}
      <div className="space-y-4">
        {registration ? (
          /* ── Post-inscription: simple pending confirmation panel ── */
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-300">
                  {activity.google_form_url
                    ? "Merci de remplir ce formulaire pour que votre inscription soit enregistrée !"
                    : "Inscription enregistrée !"}
                </p>
                <p className="text-xs text-emerald-200/70 leading-relaxed">
                  {activity.google_form_url
                    ? "Votre demande a bien été notée. Veuillez impérativement compléter le Google Form ci-dessous afin que l'administration du club puisse valider votre place."
                    : "Votre demande a bien été reçue. L'administration du club confirmera votre place prochainement."}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              {activity.google_form_url && (
                <a
                  href={activity.google_form_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(252,163,17,0.25)] hover:shadow-[0_0_30px_rgba(252,163,17,0.45)] cursor-pointer"
                >
                  <span>Remplir le Google Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{isLoading ? "Traitement..." : "Se désister"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Pre-inscription ── */
          <div className="space-y-4">
            {activity.google_form_url ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-custom-navy/80 via-[#1a233b] to-[#141515] border border-custom-amber/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Inscription requise via Google Form
                    </h4>
                    <p className="text-xs text-[#aaa] mt-0.5 leading-relaxed">
                      L&apos;entreprise partenaire exige de remplir le formulaire officiel afin d&apos;éditer les badges de sécurité pour la visite.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading || isPast}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-custom-amber hover:bg-[#ffc887] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(252,163,17,0.35)] hover:shadow-[0_0_35px_rgba(252,163,17,0.55)] cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isPast ? "Visite terminée" : isFull ? "Rejoindre la liste d'attente" : "S'inscrire"}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Direct In-App Registration (no Google Form) */
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading || isPast}
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                    isPast
                      ? "bg-[#222] text-[#666] cursor-not-allowed"
                      : isFull
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                      : "bg-custom-amber hover:bg-[#ffc887] text-black shadow-[0_0_25px_rgba(252,163,17,0.3)] hover:shadow-[0_0_35px_rgba(252,163,17,0.5)] transform hover:-translate-y-0.5"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPast ? (
                    "Cette visite est terminée"
                  ) : isFull ? (
                    "Rejoindre la liste d'attente"
                  ) : (
                    "S'inscrire 🚀"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

