"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Linkedin,
  Phone,
  Shield,
  Award,
  Sparkles,
  Edit3,
  User,
} from "lucide-react";
import EditProfileModal, { ProfileData } from "./EditProfileModal";
import { getRoleLabel, Role } from "@/lib/types/roles";

interface ProfilClientProps {
  initialProfile: (ProfileData & { role: Role; poles?: { name: string } | null }) | null;
  initialPointsLog: Array<{
    id: string;
    user_id: string;
    reason: string;
    amount: number;
    created_at: string;
  }>;
  userEmail: string;
  /** All poles the member is assigned to (resolved from pole_ids) */
  resolvedPoles?: { id: string; name: string; color?: string }[];
}

export default function ProfilClient({
  initialProfile,
  initialPointsLog,
  userEmail,
  resolvedPoles = [],
}: ProfilClientProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const statutLabel =
    initialProfile?.statut_membre === "senior"
      ? "Membre Senior (2ème année)"
      : initialProfile?.statut_membre === "alumni"
      ? "Alumni (3ème année+)"
      : "Membre Actif (1ère année)";

  const handleProfileUpdated = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Mon Profil</h1>
          <p className="text-xs text-[#888] mt-1">
            Gérez vos informations personnelles, votre statut et suivez vos points d&apos;engagement.
          </p>
        </div>

        <button
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-custom-amber text-black font-bold text-xs hover:bg-[#ffc887] transition-all shadow-[0_0_15px_rgba(252,163,17,0.2)] cursor-pointer self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>Modifier mon profil</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="panel-surface rounded-2xl p-6 bg-[#141515] border border-[#2a2c2c] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#1e2020] border border-custom-amber/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {initialProfile?.avatar_url ? (
                <img
                  src={initialProfile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display font-bold text-2xl text-custom-amber">
                  {initialProfile?.first_name?.[0] || "U"}
                  {initialProfile?.last_name?.[0] || "A"}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-white">
                  {initialProfile?.first_name} {initialProfile?.last_name}
                </h2>
              </div>
              <p className="text-muted text-xs mt-0.5">
                {initialProfile?.email || userEmail}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {resolvedPoles.length > 0 ? (
                  resolvedPoles.map((p) => (
                    <span
                      key={p.id}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border"
                      style={p.color
                        ? {
                            backgroundColor: `${p.color}18`,
                            borderColor: `${p.color}40`,
                            color: p.color,
                          }
                        : undefined}
                    >
                      {`Pôle ${p.name.replace(/^Pôle\s+/i, "")}`}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white">
                    Membre ENIT
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-custom-amber/15 text-custom-amber border border-custom-amber/30">
                  {getRoleLabel(initialProfile?.role, initialProfile?.statut_membre)}
                </span>
              </div>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-[#2a2c2c]">
            <span className="text-[10px] text-muted uppercase font-mono tracking-wider block">
              Total Points
            </span>
            <span className="font-mono text-3xl font-extrabold text-custom-amber">
              {initialProfile?.points_total || 0} pts
            </span>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#2a2c2c]">
          {/* Statut Membre */}
          <div className="p-3.5 rounded-xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-1">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider block">
              Statut Membre
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{statutLabel}</span>
              {initialProfile?.statut_membre_verified ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vérifié</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>En attente de vérification</span>
                </span>
              )}
            </div>
          </div>

          {/* Classe ou Promotion */}
          <div className="p-3.5 rounded-xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-1">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider block">
              {initialProfile?.statut_membre === "alumni" ? "Promotion" : "Classe ENIT"}
            </span>
            <span className="text-xs font-bold text-white">
              {initialProfile?.statut_membre === "alumni"
                ? initialProfile?.year || initialProfile?.promotion || initialProfile?.classe || "Alumni"
                : initialProfile?.classe || "Non renseigné"}
            </span>
          </div>

          {/* Téléphone */}
          <div className="p-3.5 rounded-xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-1">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider block">
              Téléphone
            </span>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-custom-amber" />
              {initialProfile?.phone || "Non renseigné"}
            </span>
          </div>

          {/* Parcours Prépa & Concours */}
          <div className="p-3.5 rounded-xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-1">
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider block">
              Parcours Prépa & Concours
            </span>
            <span className="text-xs font-bold text-white">
              {initialProfile?.prepa_section || initialProfile?.annee_concours || initialProfile?.bio || initialProfile?.training_availability ? (
                <>
                  {initialProfile?.prepa_section ? `${initialProfile.prepa_section} · ` : ""}
                  {initialProfile?.prepa_etablissement ? `${initialProfile.prepa_etablissement}` : ""}
                  {initialProfile?.rang_concours ? ` (Rang #${initialProfile.rang_concours})` : ""}
                  {(initialProfile?.annee_concours || initialProfile?.bio || initialProfile?.training_availability) ? (
                    <span className="text-[#aaa] block text-[11px] mt-0.5">
                      Concours : {initialProfile.annee_concours || initialProfile.bio || initialProfile.training_availability}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-[#666]">Non renseigné</span>
              )}
            </span>
          </div>
        </div>

        {/* Links (LinkedIn & CV) */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#2a2c2c]">
          {initialProfile?.linkedin_url ? (
            <a
              href={initialProfile.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>Profil LinkedIn</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <span className="text-xs text-[#666] flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5" /> Pas de lien LinkedIn
            </span>
          )}

          {initialProfile?.cv_url ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Curriculum Vitae attaché</span>
            </span>
          ) : (
            <span className="text-xs text-[#666] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Pas de CV téléversé
            </span>
          )}
        </div>
      </div>

      {/* Points History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-custom-amber" />
            <span>Historique des Points</span>
          </h3>
          <span className="text-xs text-[#888]">
            {initialPointsLog?.length || 0} mouvement{(initialPointsLog?.length || 0) > 1 ? "s" : ""}
          </span>
        </div>

        <div className="panel-surface overflow-hidden rounded-2xl bg-[#141515] border border-[#2a2c2c]">
          {initialPointsLog && initialPointsLog.length > 0 ? (
            initialPointsLog.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border-b border-[#2a2c2c] last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <p className="text-xs text-white font-medium">{log.reason}</p>
                  <p className="text-[10px] text-muted font-mono mt-0.5">
                    {new Date(log.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold text-sm ${
                    log.amount > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {log.amount > 0 ? "+" : ""}
                  {log.amount} pts
                </span>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-muted text-xs">
              Aucun mouvement de points enregistré pour le moment.
            </p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {initialProfile && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          profile={initialProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
