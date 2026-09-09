"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  User,
  Phone,
  GraduationCap,
  Sparkles,
  Upload,
  FileText,
  Linkedin,
  Award,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Camera,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export interface ProfileData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  classe: string | null;
  statut_membre: "senior" | "actif" | "alumni" | null;
  statut_membre_verified?: boolean;
  avatar_url: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  prepa_section: string | null;
  prepa_etablissement: string | null;
  rang_concours: number | null;
  year?: string | null;
  promotion?: string | null;
  annee_concours?: string | null;
  bio?: string | null;
  training_availability?: string | null;
  points_total?: number;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onProfileUpdated: () => void;
}

const PREPA_SCHOOLS = [
  "IPEIM",
  "IPEIN",
  "IPEIS",
  "IPEIB",
  "IPEIT",
  "IPEIEM",
  "FSS",
  "FST",
  "FSM",
  "IPEIK",
  "IPEIG",
  "ESSTHS",
  "Autre",
];

const CLASSES = [
  "1AGI1",
  "1AGI2",
  "1AGI3",
  "2AGI1",
  "2AGI2",
  "2AGI3",
  "3AGI",
];

const PROMOTIONS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
  "Avant 2015",
];

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const supabase = createClient();

  // Form states
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [classe, setClasse] = useState(profile.classe || "1AGI1");
  const [promotion, setPromotion] = useState(
    profile.year || (profile.classe && /^\d{4}$/.test(profile.classe) ? profile.classe : "2024")
  );
  const [statutMembre, setStatutMembre] = useState<"actif" | "senior" | "alumni">(
    profile.statut_membre || "actif"
  );

  // Bonus fields
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);

  const [cvUrl, setCvUrl] = useState<string | null>(profile.cv_url || null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [prepaSection, setPrepaSection] = useState(profile.prepa_section || "");

  // Prepa establishment
  const initialSchoolIsKnown = profile.prepa_etablissement
    ? PREPA_SCHOOLS.includes(profile.prepa_etablissement)
    : false;
  const [prepaSchoolSelect, setPrepaSchoolSelect] = useState(
    profile.prepa_etablissement
      ? initialSchoolIsKnown
        ? profile.prepa_etablissement
        : "Autre"
      : ""
  );
  const [prepaSchoolOther, setPrepaSchoolOther] = useState(
    profile.prepa_etablissement && !initialSchoolIsKnown
      ? profile.prepa_etablissement
      : ""
  );

  const [rangConcours, setRangConcours] = useState<string>(
    profile.rang_concours !== null && profile.rang_concours !== undefined
      ? String(profile.rang_concours)
      : ""
  );

  const [anneeConcours, setAnneeConcours] = useState<string>(
    profile.annee_concours || profile.bio || profile.training_availability || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate live dynamic points difference
  const pointsDelta = useMemo(() => {
    let delta = 0;

    // 1. Avatar (5 pts)
    const hadAvatar = Boolean(profile.avatar_url);
    const hasAvatar = Boolean(avatarPreview || avatarFile);
    if (!hadAvatar && hasAvatar) delta += 5;
    if (hadAvatar && !hasAvatar) delta -= 5;

    // 2. CV (10 pts)
    const hadCv = Boolean(profile.cv_url);
    const hasCv = Boolean(cvUrl || cvFile);
    if (!hadCv && hasCv) delta += 10;
    if (hadCv && !hasCv) delta -= 10;

    // 3. LinkedIn (5 pts)
    const hadLinkedin = Boolean(profile.linkedin_url?.trim());
    const hasLinkedin = Boolean(linkedinUrl.trim());
    if (!hadLinkedin && hasLinkedin) delta += 5;
    if (hadLinkedin && !hasLinkedin) delta -= 5;

    // 4. Section Prépa (5 pts)
    const hadSection = Boolean(profile.prepa_section?.trim());
    const hasSection = Boolean(prepaSection.trim());
    if (!hadSection && hasSection) delta += 5;
    if (hadSection && !hasSection) delta -= 5;

    // 5. School (5 pts)
    const hadSchool = Boolean(profile.prepa_etablissement?.trim());
    const finalSchool =
      prepaSchoolSelect === "Autre" ? prepaSchoolOther.trim() : prepaSchoolSelect.trim();
    const hasSchool = Boolean(finalSchool);
    if (!hadSchool && hasSchool) delta += 5;
    if (hadSchool && !hasSchool) delta -= 5;

    // 6. Rang Concours (5 pts)
    const hadRang = profile.rang_concours !== null && profile.rang_concours !== undefined;
    const hasRang = Boolean(rangConcours.trim());
    if (!hadRang && hasRang) delta += 5;
    if (hadRang && !hasRang) delta -= 5;

    // 7. Année Concours (5 pts)
    const hadAnneeConcours = Boolean(profile.annee_concours || profile.bio || profile.training_availability);
    const hasAnneeConcours = Boolean(anneeConcours.trim());
    if (!hadAnneeConcours && hasAnneeConcours) delta += 5;
    if (hadAnneeConcours && !hasAnneeConcours) delta -= 5;

    return delta;
  }, [
    profile,
    avatarPreview,
    avatarFile,
    cvUrl,
    cvFile,
    linkedinUrl,
    prepaSection,
    prepaSchoolSelect,
    prepaSchoolOther,
    rangConcours,
    anneeConcours,
  ]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl(null);
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
    }
  };

  const removeCv = () => {
    setCvFile(null);
    setCvUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !statutMembre) {
      setError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }

    if (statutMembre === "alumni") {
      if (!promotion.trim()) {
        setError("Veuillez sélectionner votre promotion (*).");
        return;
      }
    } else {
      if (!classe) {
        setError("Veuillez sélectionner votre classe (*).");
        return;
      }
    }

    setLoading(true);

    try {
      let finalAvatarUrl: string | null = avatarUrl;
      let finalCvUrl: string | null = cvUrl;

      // 1. Upload Avatar if new file selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const avatarPath = `avatar-${profile.id}-${Date.now()}.${fileExt}`;
        const { error: avatarUploadErr } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, avatarFile, { upsert: true });

        if (avatarUploadErr) {
          throw new Error(`Erreur lors du téléversement de l'avatar : ${avatarUploadErr.message}`);
        }

        const { data: pubAvatar } = supabase.storage
          .from("avatars")
          .getPublicUrl(avatarPath);
        finalAvatarUrl = pubAvatar.publicUrl;
      } else if (!avatarPreview) {
        finalAvatarUrl = null;
      }

      // 2. Upload CV if new file selected
      if (cvFile) {
        const fileExt = cvFile.name.split(".").pop();
        const cvPath = `cv-${profile.id}-${Date.now()}.${fileExt}`;
        const { error: cvUploadErr } = await supabase.storage
          .from("cvs")
          .upload(cvPath, cvFile, { upsert: true });

        if (cvUploadErr) {
          if (cvUploadErr.message?.includes("Bucket not found") || (cvUploadErr as any)?.statusCode === "404") {
            throw new Error(
              "Le dossier de stockage 'cvs' n'existe pas dans Supabase Storage. Veuillez exécuter le fichier de migration SQL '20270104000000_create_cvs_storage_bucket.sql' ou créer le bucket public 'cvs' dans la console Supabase."
            );
          }
          throw new Error(`Erreur lors du téléversement du CV : ${cvUploadErr.message}`);
        }

        const { data: pubCv } = supabase.storage
          .from("cvs")
          .getPublicUrl(cvPath);
        finalCvUrl = pubCv.publicUrl || cvPath;
      } else if (!cvUrl && !cvFile) {
        finalCvUrl = null;
      }

      // 3. Resolve prepa school
      let finalSchool: string | null = prepaSchoolSelect || null;
      if (prepaSchoolSelect === "Autre") {
        finalSchool = prepaSchoolOther.trim() || null;
      }

      // 4. Update payload
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        classe: statutMembre === "alumni" ? (promotion.trim() || "Alumni") : classe,
        statut_membre: statutMembre,
        year: statutMembre === "alumni" ? promotion.trim() : null,
        promotion: statutMembre === "alumni" ? promotion.trim() : null,
        annee_concours: anneeConcours.trim() || null,
        bio: anneeConcours.trim() || null,
        avatar_url: finalAvatarUrl,
        cv_url: finalCvUrl,
        linkedin_url: linkedinUrl.trim() || null,
        prepa_section: prepaSection || null,
        prepa_etablissement: finalSchool,
        rang_concours: rangConcours.trim() ? parseInt(rangConcours.trim(), 10) : null,
      };

      const res = await fetch("/api/membre/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erreur lors de la mise à jour du profil.");
      }

      setSuccess("Profil mis à jour avec succès !");
      setTimeout(() => {
        onProfileUpdated();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentTotal = profile.points_total || 0;
  const simulatedTotal = Math.max(0, currentTotal + pointsDelta);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#141515] border border-[#333535] rounded-3xl p-5 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto touch-scroll shadow-2xl my-auto relative text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2a2c2c]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-custom-amber/10 border border-custom-amber/20 flex items-center justify-center text-custom-amber">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Modifier mon Profil</h2>
                <p className="text-xs text-[#888]">Mettez à jour vos coordonnées et informations académiques.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#888] hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Points Impact Live Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-custom-navy/60 via-[#1b253b] to-[#141515] border border-custom-amber/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-custom-amber shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Impact sur vos Points GI-ENIT
                </span>
                <span className="text-[11px] text-[#aaa]">
                  Remplir des champs bonus ajoute des points. Les effacer les déduira automatiquement.
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-mono text-[#888] line-through">{currentTotal} pts</span>
                <span className="text-sm font-extrabold font-mono text-custom-amber">
                  {simulatedTotal} pts
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                  pointsDelta > 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : pointsDelta < 0
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-[#aaa]"
                }`}
              >
                {pointsDelta > 0 ? `+${pointsDelta} pts` : pointsDelta < 0 ? `${pointsDelta} pts` : "0 pt"}
              </span>
            </div>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {/* Section 1: Informations obligatoires */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-custom-amber flex items-center gap-2">
                <span>Informations Principales (*)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-[#aaa] block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#1c1e1e] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#aaa] block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#1c1e1e] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#aaa] block mb-1">Téléphone *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#666] absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 50 123 456"
                      className="w-full bg-[#1c1e1e] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 pl-9 pr-3 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Classe (si Actif ou Senior) ou Promotion (si Alumni) */}
                {statutMembre === "alumni" ? (
                  <div>
                    <label className="text-[11px] font-medium text-[#aaa] block mb-1">
                      Promotion (Année de diplôme) *
                    </label>
                    <input
                      type="number"
                      min={1970}
                      max={2040}
                      value={promotion}
                      onChange={(e) => setPromotion(e.target.value)}
                      placeholder="Ex: 2024"
                      className="w-full bg-[#1c1e1e] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-medium text-[#aaa] block mb-1">Classe ENIT *</label>
                    <select
                      value={classe}
                      onChange={(e) => setClasse(e.target.value)}
                      className="w-full bg-[#1c1e1e] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none transition-colors"
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-[#aaa] block mb-1">Statut au Club *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "actif", label: "Membre Actif (1ère A)" },
                      { id: "senior", label: "Membre Senior (2ème A)" },
                      { id: "alumni", label: "Alumni (3ème A+)" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStatutMembre(s.id as any)}
                        className={`py-2 px-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                          statutMembre === s.id
                            ? "bg-custom-amber/15 border-custom-amber text-custom-amber"
                            : "bg-[#1c1e1e] border-[#333535] text-[#888] hover:border-[#444]"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Informations Optionnelles (Points bonus) */}
            <div className="space-y-4 pt-4 border-t border-[#2a2c2c]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-custom-amber" />
                  <span>Informations Optionnelles (Gagnez jusqu'à +35 pts)</span>
                </h3>
              </div>

              {/* Avatar & CV Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photo de profil */}
                <div className="p-4 rounded-2xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-custom-amber" />
                      Photo de profil
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-custom-amber/10 text-custom-amber">
                      +5 pts
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[#141515] border border-[#333] flex items-center justify-center overflow-hidden shrink-0">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#555]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-colors">
                        <Upload className="w-3 h-3 text-custom-amber" />
                        <span>Changer photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="block text-[10px] text-red-400 hover:underline"
                        >
                          Supprimer la photo (-5 pts)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CV */}
                <div className="p-4 rounded-2xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Curriculum Vitae (PDF)
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      +10 pts
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="cursor-pointer flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#333] hover:border-custom-amber/50 bg-[#141515] text-xs text-[#aaa] hover:text-white transition-colors">
                      <Upload className="w-3.5 h-3.5 text-custom-amber" />
                      <span>{cvFile ? cvFile.name : cvUrl ? "Remplacer le CV" : "Téléverser votre CV"}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCvChange}
                        className="hidden"
                      />
                    </label>
                    {(cvUrl || cvFile) && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> CV présent
                        </span>
                        <button
                          type="button"
                          onClick={removeCv}
                          className="text-red-400 hover:underline"
                        >
                          Supprimer le CV (-10 pts)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="p-3.5 rounded-2xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                    Lien Profil LinkedIn
                  </label>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    +5 pts
                  </span>
                </div>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#141515] border border-[#333] focus:border-custom-amber rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              {/* Prépa Information */}
              <div className="p-3.5 rounded-2xl bg-[#1a1c1c] border border-[#2a2c2c] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-custom-amber" />
                    Parcours Classes Préparatoires
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-custom-amber/10 text-custom-amber">
                    Jusqu'à +20 pts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Section (+5 pts) */}
                  <div>
                    <label className="text-[10px] font-semibold text-[#888] block mb-1">
                      Section (+5 pts)
                    </label>
                    <select
                      value={prepaSection}
                      onChange={(e) => setPrepaSection(e.target.value)}
                      className="w-full bg-[#141515] border border-[#333] focus:border-custom-amber rounded-xl py-2 px-2.5 text-xs text-white outline-none"
                    >
                      <option value="">-- Non renseigné --</option>
                      <option value="MP">MP</option>
                      <option value="PC">PC</option>
                      <option value="PT">PT</option>
                    </select>
                  </div>

                  {/* Établissement (+5 pts) */}
                  <div>
                    <label className="text-[10px] font-semibold text-[#888] block mb-1">
                      Établissement (+5 pts)
                    </label>
                    <select
                      value={prepaSchoolSelect}
                      onChange={(e) => setPrepaSchoolSelect(e.target.value)}
                      className="w-full bg-[#141515] border border-[#333] focus:border-custom-amber rounded-xl py-2 px-2.5 text-xs text-white outline-none"
                    >
                      <option value="">-- Non renseigné --</option>
                      {PREPA_SCHOOLS.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rang (+5 pts) */}
                  <div>
                    <label className="text-[10px] font-semibold text-[#888] block mb-1">
                      Rang (+5 pts)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={rangConcours}
                      onChange={(e) => setRangConcours(e.target.value)}
                      placeholder="Ex: 42"
                      className="w-full bg-[#141515] border border-[#333] focus:border-custom-amber rounded-xl py-2 px-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  {/* Année Concours (+5 pts) */}
                  <div>
                    <label className="text-[10px] font-semibold text-[#888] block mb-1">
                      Année Concours (+5 pts)
                    </label>
                    <input
                      type="number"
                      min={1990}
                      max={2035}
                      value={anneeConcours}
                      onChange={(e) => setAnneeConcours(e.target.value)}
                      placeholder="Ex: 2023"
                      className="w-full bg-[#141515] border border-[#333] focus:border-custom-amber rounded-xl py-2 px-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {prepaSchoolSelect === "Autre" && (
                  <div>
                    <label className="text-[10px] font-semibold text-[#888] block mb-1">
                      Nom de l'établissement prépa
                    </label>
                    <input
                      type="text"
                      value={prepaSchoolOther}
                      onChange={(e) => setPrepaSchoolOther(e.target.value)}
                      placeholder="Ex: Lycée Pilote..."
                      className="w-full bg-[#141515] border border-[#333] focus:border-custom-amber rounded-xl py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#2a2c2c]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-[#333535] text-xs font-semibold text-[#aaa] hover:bg-white/5 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-custom-amber text-black font-bold text-xs hover:bg-[#ffc887] transition-all shadow-[0_0_15px_rgba(252,163,17,0.2)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
