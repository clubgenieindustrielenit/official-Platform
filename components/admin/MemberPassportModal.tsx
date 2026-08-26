"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  Building,
  GraduationCap,
  FolderGit2,
  Phone,
  Mail,
  Linkedin,
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Loader2,
  Shield,
  Star,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

interface MemberPassportModalProps {
  userId: string | null;
  onClose: () => void;
}

export default function MemberPassportModal({
  userId,
  onClose,
}: MemberPassportModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchPassport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/members/passport?user_id=${userId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur chargement du passeport.");
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPassport();
  }, [userId]);

  const handlePrint = () => {
    window.print();
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-[#141515] border border-[#2a2c2c] w-full max-w-4xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:my-0 print:p-6"
      >
        {/* Background glow (hidden on print) */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-custom-amber/10 blur-[100px] pointer-events-none print:hidden" />

        {/* Modal Controls Header */}
        <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Passeport GI • Bilan Annuel d&apos;Activité</span>
              </h3>
              <p className="text-xs text-[#888]">
                Vue 360° du profil, des participations et de l&apos;engagement au club.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
              title="Imprimer ou Exporter en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exporter / Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#888] text-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-custom-amber" />
            <span>Génération du passeport d&apos;activité...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
            {error}
          </div>
        ) : data && (
          <div className="space-y-6">
            {/* Header: Member Identity Card */}
            <div className="bg-gradient-to-r from-[#14213d] via-[#1a202c] to-[#141515] border border-custom-amber/30 rounded-3xl p-6 print:border print:border-gray-300 print:bg-gray-50 print:text-black">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {data.profile.avatar_url ? (
                    <img
                      src={data.profile.avatar_url}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-custom-amber/50 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-custom-amber/20 border-2 border-custom-amber/50 flex items-center justify-center font-bold text-custom-amber text-xl shrink-0">
                      {data.profile.first_name?.[0] || "?"}
                      {data.profile.last_name?.[0] || ""}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-bold text-white print:text-black">
                        {data.profile.first_name} {data.profile.last_name}
                      </h2>
                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-custom-amber text-black">
                        {data.profile.role}
                      </span>
                      {data.profile.statut_membre && (
                        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Membre {data.profile.statut_membre}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#aaa] mt-2 font-mono print:text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-custom-amber" />
                        {data.profile.email}
                      </span>
                      {data.profile.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-custom-amber" />
                          {data.profile.phone}
                        </span>
                      )}
                      {data.profile.classe && (
                        <span className="bg-white/10 px-2 py-0.5 rounded text-white print:text-black">
                          Classe : {data.profile.classe}
                        </span>
                      )}
                      {((data.profile.assigned_poles && data.profile.assigned_poles.length > 0)
                        ? data.profile.assigned_poles
                        : data.profile.poles
                        ? [data.profile.poles]
                        : []
                      ).map((p: any, pIdx: number) => {
                        const name = p.name?.replace(/^Pôle\s+/i, "") || "Pôle";
                        return (
                          <span
                            key={p.id || pIdx}
                            className="bg-custom-amber/20 text-custom-amber border border-custom-amber/30 px-2 py-0.5 rounded font-mono font-bold text-[11px]"
                          >
                            Pôle : {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Points Card */}
                <div className="bg-[#121414] border border-custom-amber/40 rounded-2xl p-4 sm:text-right shrink-0 print:border print:border-gray-400 print:bg-white">
                  <span className="text-[10px] uppercase font-mono font-bold text-[#888] block">
                    Points GI Cumulés
                  </span>
                  <span className="text-3xl font-extrabold text-custom-amber font-mono print:text-amber-700">
                    {data.profile.points_total || 0} pts
                  </span>
                </div>
              </div>

              {/* Extra Info: Prépa / LinkedIn / CV */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-[#aaa] print:text-gray-700">
                  {data.profile.prepa_section && (
                    <span>Prépa : <strong>{data.profile.prepa_section}</strong> ({data.profile.prepa_etablissement || "N/A"})</span>
                  )}
                  {data.profile.rang_concours && (
                    <span>Rang concours : <strong>#{data.profile.rang_concours}</strong></span>
                  )}
                </div>

                <div className="flex items-center gap-3 print:hidden">
                  {data.profile.linkedin_url && (
                    <a
                      href={data.profile.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {data.profile.cv_url && (
                    <a
                      href={data.profile.cv_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Consulter CV</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Grid Activity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-4 print:border-gray-300">
                <span className="text-xs text-[#888] font-mono block">Visites d&apos;Entreprise</span>
                <span className="text-2xl font-bold text-white font-mono print:text-black">
                  {data.visits.length}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {data.visits.filter((v: any) => v.attended).length} présence(s) validée(s)
                </span>
              </div>

              <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-4 print:border-gray-300">
                <span className="text-xs text-[#888] font-mono block">Formations & Workshops</span>
                <span className="text-2xl font-bold text-white font-mono print:text-black">
                  {data.formations.length}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {data.formations.filter((f: any) => f.attended).length} présence(s) validée(s)
                </span>
              </div>

              <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-4 print:border-gray-300">
                <span className="text-xs text-[#888] font-mono block">Projets Réalisés</span>
                <span className="text-2xl font-bold text-white font-mono print:text-black">
                  {data.projects.length}
                </span>
                <span className="text-[10px] text-custom-amber block mt-1">
                  {data.projects.filter((p: any) => p.is_lead).length} en tant que Lead
                </span>
              </div>
            </div>

            {/* Section: Visites d'Entreprise */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 print:text-black">
                <Building className="w-4 h-4 text-custom-amber" />
                <span>Visites Industrielles ({data.visits.length})</span>
              </h3>
              {data.visits.length === 0 ? (
                <p className="text-xs text-[#666] italic bg-[#1e2020] p-3.5 rounded-xl">
                  Aucune visite enregistrée cette année.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.visits.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 bg-[#1e2020] border border-[#2a2c2c] rounded-xl flex items-center justify-between text-xs print:border-gray-300"
                    >
                      <div>
                        <span className="font-semibold text-white print:text-black">{v.title}</span>
                        {v.entreprise && (
                          <span className="text-custom-amber font-mono ml-2">@{v.entreprise}</span>
                        )}
                        <span className="text-[#888] font-mono block text-[11px]">
                          {new Date(v.date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          v.attended
                            ? "bg-emerald-500/20 text-emerald-300"
                            : v.status === "confirmed"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {v.attended ? "Présent(e) ✓" : v.status === "confirmed" ? "Inscrit(e)" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Formations */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 print:text-black">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Formations & Certifications ({data.formations.length})</span>
              </h3>
              {data.formations.length === 0 ? (
                <p className="text-xs text-[#666] italic bg-[#1e2020] p-3.5 rounded-xl">
                  Aucune formation suivie cette année.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.formations.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-3 bg-[#1e2020] border border-[#2a2c2c] rounded-xl flex items-center justify-between text-xs print:border-gray-300"
                    >
                      <div>
                        <span className="font-semibold text-white print:text-black">{f.title}</span>
                        {f.trainer_name && (
                          <span className="text-emerald-400 font-mono ml-2">Formateur: {f.trainer_name}</span>
                        )}
                        <span className="text-[#888] font-mono block text-[11px]">
                          {new Date(f.date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          f.attended
                            ? "bg-emerald-500/20 text-emerald-300"
                            : f.status === "confirmed"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {f.attended ? "Validé ✓" : f.status === "confirmed" ? "Inscrit(e)" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Projets */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2 print:text-black">
                <FolderGit2 className="w-4 h-4 text-custom-amber" />
                <span>Projets et Rôles ({data.projects.length})</span>
              </h3>
              {data.projects.length === 0 ? (
                <p className="text-xs text-[#666] italic bg-[#1e2020] p-3.5 rounded-xl">
                  Aucun projet attribué.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.projects.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3.5 bg-[#1e2020] border border-[#2a2c2c] rounded-xl text-xs space-y-2 print:border-gray-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white print:text-black">{p.title}</span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            p.is_lead ? "bg-custom-amber text-black" : "bg-white/10 text-[#aaa]"
                          }`}
                        >
                          {p.is_lead ? "Lead" : "Membre"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#888] font-mono">
                        <span>Pôle : {p.poles?.name || "Club GI"}</span>
                        <span>Avancement : {p.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Print Date / Club signature */}
            <div className="pt-4 border-t border-[#2a2c2c] flex items-center justify-between text-[10px] text-[#666] font-mono print:text-gray-500">
              <span>Club Génie Industriel • ENIT</span>
              <span>Généré le {new Date().toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
