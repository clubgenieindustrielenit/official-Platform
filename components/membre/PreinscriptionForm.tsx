"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
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
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";

interface PreinscriptionFormProps {
  userId: string;
  initialEmail: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialStatutMembre?: "actif" | "senior" | "alumni";
  onSuccess?: () => void;
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
  "2031",
  "2030",
  "2029",
  "2028",
  "2027",
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

export default function PreinscriptionForm({
  userId,
  initialEmail,
  initialFirstName = "",
  initialLastName = "",
  initialStatutMembre = "actif",
  onSuccess,
}: PreinscriptionFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  // Mandatory fields
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState("");
  const [classe, setClasse] = useState<string>("");
  const [promotion, setPromotion] = useState<string>("");
  const [statutMembre, setStatutMembre] = useState<"actif" | "senior" | "alumni">(initialStatutMembre);

  // Optional fields (Point bonuses)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [prepaSection, setPrepaSection] = useState<string>("");
  const [prepaSchoolSelect, setPrepaSchoolSelect] = useState<string>("");
  const [prepaSchoolOther, setPrepaSchoolOther] = useState("");
  const [rangConcours, setRangConcours] = useState<string>("");
  const [anneeConcours, setAnneeConcours] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate live preview points
  let bonusPoints = 0;
  if (avatarFile) bonusPoints += 5;
  if (cvFile) bonusPoints += 10;
  if (linkedinUrl.trim()) bonusPoints += 5;
  if (prepaSection) bonusPoints += 5;
  if (prepaSchoolSelect) bonusPoints += 5;
  if (rangConcours.trim()) bonusPoints += 5;
  if (anneeConcours.trim()) bonusPoints += 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !statutMembre) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
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
    setError(null);

    try {
      let avatarUrl: string | null = null;
      let cvUrl: string | null = null;

      // 1. Upload Avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const avatarPath = `avatar-${userId}-${Date.now()}.${fileExt}`;
        const { error: avatarErr } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, avatarFile, { upsert: true });

        if (!avatarErr) {
          const { data: publicData } = supabase.storage
            .from("avatars")
            .getPublicUrl(avatarPath);
          avatarUrl = publicData.publicUrl;
        } else {
          console.warn("Avatar upload failed:", avatarErr);
        }
      }

      // 2. Upload CV if provided
      if (cvFile) {
        const fileExt = cvFile.name.split(".").pop();
        const cvPath = `cv-${userId}-${Date.now()}.${fileExt}`;
        const { error: cvErr } = await supabase.storage
          .from("cvs")
          .upload(cvPath, cvFile, { upsert: true });

        if (!cvErr) {
          cvUrl = cvPath; // Store path for signed URL retrieval
        } else {
          console.warn("CV upload failed:", cvErr);
        }
      }

      // 3. Resolve prepa establishment
      let finalSchool = prepaSchoolSelect;
      if (prepaSchoolSelect === "Autre") {
        finalSchool = prepaSchoolOther.trim() || "Autre";
      }

      // 4. Update Profile
      const updateData: Record<string, any> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        classe: statutMembre === "alumni" ? (promotion.trim() || "Alumni") : classe,
        statut_membre: statutMembre,
        statut_membre_verified: false,
        profile_completed_at: new Date().toISOString(),
      };

      if (statutMembre === "alumni") {
        updateData.year = promotion.trim();
      } else {
        updateData.year = null;
      }

      if (anneeConcours.trim()) {
        updateData.bio = anneeConcours.trim();
        updateData.training_availability = anneeConcours.trim();
      }

      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (cvUrl) updateData.cv_url = cvUrl;
      if (linkedinUrl.trim()) updateData.linkedin_url = linkedinUrl.trim();
      if (prepaSection) updateData.prepa_section = prepaSection;
      if (finalSchool) updateData.prepa_etablissement = finalSchool;
      if (rangConcours.trim()) {
        const parsed = parseInt(rangConcours.trim(), 10);
        if (!isNaN(parsed)) updateData.rang_concours = parsed;
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (updateErr) throw updateErr;

      // 5. Create welcome notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "système",
        title: "Bienvenue au CGI ENIT !",
        message: "Votre profil a été enregistré avec succès. Explorez vos activités et découvrez vos opportunités.",
        link: "/membre",
        read: false,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/membre");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#14213d]/90 border border-[#333535] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-custom-amber/10 border border-custom-amber/30 text-custom-amber mb-3 shadow-[0_0_20px_rgba(252,163,17,0.15)]">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {t("preinscription.title", "Complétez votre profil membre")}
        </h2>
        <p className="text-xs text-[#a0a0a0] mt-2 max-w-md mx-auto">
          {t("preinscription.subtitle", "Ces informations nous permettent de mieux vous connaître et d'adapter les activités du club.")}
        </p>
      </div>

      {/* Bonus Points Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-custom-amber/15 via-[#fca311]/10 to-transparent border border-custom-amber/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-custom-amber shrink-0 animate-pulse" />
          <p className="text-xs text-white/90 font-medium">
            {t("preinscription.optional_points_banner", "Gagnez jusqu'à +35 points en complétant les champs optionnels !")}
          </p>
        </div>
        <div className="shrink-0 bg-custom-amber text-black font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm">
          +{bonusPoints} pts
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Obligatoire */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-custom-amber" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">
              {t("preinscription.step1_title", "Informations Obligatoires (*)")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prénom */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#888] uppercase">
                {t("preinscription.first_name", "Prénom")} *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Mohamed"
                className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
              />
            </div>

            {/* Nom */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#888] uppercase">
                {t("preinscription.last_name", "Nom")} *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Ben Ali"
                className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-[#888] uppercase">
                {t("preinscription.email", "Email")} *
              </label>
              <input
                type="email"
                disabled
                value={initialEmail}
                className="w-full bg-[#161818] border border-[#2a2c2c] text-[#777] rounded-xl py-3 px-3.5 text-sm cursor-not-allowed"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#888] uppercase">
                {t("preinscription.phone", "Téléphone")} *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +216 20 123 456"
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Classe (si Actif ou Senior) ou Promotion (si Alumni) */}
            {statutMembre === "alumni" ? (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  {t("preinscription.promotion", "Promotion (Année de diplôme)")} *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-[#777] absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    required
                    min={1970}
                    max={2040}
                    value={promotion}
                    onChange={(e) => setPromotion(e.target.value)}
                    placeholder="Ex: 2024"
                    className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 pl-10 pr-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  {t("preinscription.class", "Classe")} *
                </label>
                <select
                  required
                  value={classe}
                  onChange={(e) => setClasse(e.target.value)}
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                >
                  <option value="">Sélectionner votre classe</option>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Statut Membre */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-[#888] uppercase">
                {t("preinscription.member_status", "Statut Membre")} *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "actif",
                    label: t("preinscription.status_actif", "Actif"),
                    desc: "1ère année",
                    color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
                  },
                  {
                    id: "senior",
                    label: t("preinscription.status_senior", "Senior"),
                    desc: "2ème année",
                    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
                  },
                  {
                    id: "alumni",
                    label: t("preinscription.status_alumni", "Alumni"),
                    desc: "3ème année+",
                    color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
                  },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setStatutMembre(s.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      statutMembre === s.id
                        ? `${s.color} ring-1 ring-custom-amber`
                        : "border-[#333535] bg-[#1e2020] text-[#888] hover:border-[#444]"
                    }`}
                  >
                    <div className="font-bold text-xs">{s.label}</div>
                    <div className="text-[10px] text-[#888] mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Optionnel (Gagnez des points) */}
        <div className="pt-4 border-t border-[#2a2c2c]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-custom-amber" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-custom-amber">
              {t("preinscription.step2_title", "Champs Optionnels (Bonus de points)")}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Photo de profil (+5 pts) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  {t("preinscription.avatar", "Photo de profil")}
                </label>
                <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                  +5 pts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="avatar_upload"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="avatar_upload"
                  className="flex-1 border border-dashed border-[#333535] hover:border-custom-amber/60 bg-[#1e2020] rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-[#aaa] hover:text-white transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-custom-amber" />
                  <span>
                    {avatarFile ? avatarFile.name : "Téléverser une photo (JPG, PNG, WebP)"}
                  </span>
                </label>
              </div>
            </div>

            {/* CV PDF (+10 pts) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  {t("preinscription.cv", "Curriculum Vitae (PDF)")}
                </label>
                <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                  +10 pts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="cv_upload"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="cv_upload"
                  className="flex-1 border border-dashed border-[#333535] hover:border-custom-amber/60 bg-[#1e2020] rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-[#aaa] hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-custom-amber" />
                  <span>
                    {cvFile ? cvFile.name : "Téléverser votre CV (PDF uniquement)"}
                  </span>
                </label>
              </div>
            </div>

            {/* LinkedIn (+5 pts) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  {t("preinscription.linkedin", "Lien LinkedIn")}
                </label>
                <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                  +5 pts
                </span>
              </div>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-[#777] absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 pl-10 pr-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Section Prépa & Établissement (+5 pts chacun) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#888] uppercase">
                    {t("preinscription.prepa_section", "Section Prépa")}
                  </label>
                  <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                    +5 pts
                  </span>
                </div>
                <select
                  value={prepaSection}
                  onChange={(e) => setPrepaSection(e.target.value)}
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                >
                  <option value="">Sélectionner la section</option>
                  <option value="MP">MP (Math-Physique)</option>
                  <option value="PC">PC (Physique-Chimie)</option>
                  <option value="PT">PT (Technologie)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#888] uppercase">
                    {t("preinscription.prepa_school", "Établissement Prépa")}
                  </label>
                  <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                    +5 pts
                  </span>
                </div>
                <select
                  value={prepaSchoolSelect}
                  onChange={(e) => setPrepaSchoolSelect(e.target.value)}
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                >
                  <option value="">Sélectionner l'établissement</option>
                  {PREPA_SCHOOLS.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {prepaSchoolSelect === "Autre" && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#888] uppercase">
                  {t("preinscription.other_school", "Précisez l'établissement")}
                </label>
                <input
                  type="text"
                  value={prepaSchoolOther}
                  onChange={(e) => setPrepaSchoolOther(e.target.value)}
                  placeholder="Nom de l'institut ou faculté"
                  className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                />
              </div>
            )}

            {/* Rang au Concours National (+5 pts) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#888] uppercase">
                    {t("preinscription.rank", "Rang au Concours National")}
                  </label>
                  <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                    +5 pts
                  </span>
                </div>
                <div className="relative">
                  <Award className="w-4 h-4 text-[#777] absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min={1}
                    value={rangConcours}
                    onChange={(e) => setRangConcours(e.target.value)}
                    placeholder="Ex: 42"
                    className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 pl-10 pr-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Année de passage du concours (+5 pts) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#888] uppercase">
                    {t("preinscription.concours_year", "Année de passage du concours")}
                  </label>
                  <span className="text-[10px] font-bold text-custom-amber bg-custom-amber/10 px-2 py-0.5 rounded-md border border-custom-amber/20">
                    +5 pts
                  </span>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#777] absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min={1990}
                    max={2035}
                    value={anneeConcours}
                    onChange={(e) => setAnneeConcours(e.target.value)}
                    placeholder="Ex: 2023"
                    className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 pl-10 pr-3.5 text-[#e2e2e2] text-sm outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={loading}
          type="submit"
          className="w-full mt-6 bg-[#fca311] hover:bg-[#ffc887] text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-[0_0_20px_rgba(252,163,17,0.2)]"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{t("preinscription.submit", "Finaliser mon inscription")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
