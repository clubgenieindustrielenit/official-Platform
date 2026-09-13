"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
  GraduationCap,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Registration = Database["public"]["Tables"]["event_registrations"]["Row"];

interface FormationEnrollmentCardProps {
  activity: Activity;
  initialRegistration: Registration | null;
  initialRegisteredCount: number;
  userId: string;
}

export default function FormationEnrollmentCard({
  activity,
  initialRegistration,
  initialRegisteredCount,
  userId,
}: FormationEnrollmentCardProps) {
  const supabase = createClient();
  const [registration, setRegistration] = useState<Registration | null>(initialRegistration);
  const [registeredCount, setRegisteredCount] = useState<number>(initialRegisteredCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const capacity = activity.capacity;
  const isFull = capacity ? registeredCount >= capacity : false;

  // Check if formation is past or upcoming
  const formationDate = new Date(activity.date_start || activity.date || "");
  const isPast = !isNaN(formationDate.getTime()) && formationDate < new Date();

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

      setSuccessMessage(
        data.status === "waitlisted"
          ? "Vous avez été ajouté à la liste d'attente !"
          : "Votre inscription à cette formation a été enregistrée avec succès !"
      );
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
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none" />

      {/* Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2a2c2c]">
        <div>
          {activity.trainer_name && (
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold mb-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Formateur : {activity.trainer_name}</span>
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
        {/* If user is confirmed */}
        {registration && registration.status === "confirmed" ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Vous êtes inscrit à cette formation !</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Place confirmée
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Votre présence a bien été confirmée. En cas d&apos;empêchement, merci de vous désister pour libérer la place à un autre membre.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {activity.google_form_url && (
                <a
                  href={activity.google_form_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  <span>Revoir le Google Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {activity.training_material_url && (
                <a
                  href={activity.training_material_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors border border-emerald-500/30"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Supports de cours</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? "Annulation..." : "Se désister"}
              </button>
            </div>
          </div>
        ) : registration && registration.status === "waitlisted" ? (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Clock className="w-5 h-5" />
                <span>En liste d&apos;attente</span>
              </div>
            </div>
            <p className="text-xs text-amber-200/80">
              Dès qu&apos;une place se libère, votre inscription sera automatiquement confirmée.
            </p>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold"
            >
              {isLoading ? "Traitement..." : "Quitter la liste d'attente"}
            </button>
          </div>
        ) : (
          /* User Not Registered Yet */
          <div className="space-y-4">
            {activity.google_form_url ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#112a20] via-[#142320] to-[#141515] border border-emerald-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Formulaire d&apos;inscription requis
                    </h4>
                    <p className="text-xs text-[#aaa] mt-0.5 leading-relaxed">
                      Remplissez le formulaire officiel afin de valider votre participation et recevoir les supports préparatoires.
                    </p>
                  </div>
                </div>

                {/* Highlighted Glowing Enroll Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href={activity.google_form_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] cursor-pointer transform hover:-translate-y-0.5 text-center"
                  >
                    <span>S&apos;inscrire à cette formation (Form) 🚀</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/15 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Confirmer sur la plateforme</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Direct In-App Registration */
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
                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPast ? (
                    "Cette formation est terminée"
                  ) : isFull ? (
                    "Rejoindre la liste d'attente"
                  ) : (
                    "S'inscrire à cette formation 🚀"
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
