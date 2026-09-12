"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Check, X, Edit, Trash2, EyeOff, RotateCcw,
  Loader2, Plus, Linkedin, Upload, Clock, CheckCircle2, XCircle, Save, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_photo_url?: string | null;
  quote: string;
  category: "alumni" | "professeur" | "partenaire" | "membre";
  linkedin_url?: string | null;
  approved: boolean;
  rejected: boolean;
  created_at?: string;
}

export const DEFAULT_TESTIMONIALS: Testimonial[] = [];

const CATEGORY_LABELS: Record<string, string> = {
  alumni: "Alumni",
  professeur: "Professeur",
  partenaire: "Partenaire industriel",
  membre: "Membre actif",
};

const inputCls = "w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3 px-4 text-[#e2e2e2] text-sm outline-none transition-all focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-[#555]";
const labelCls = "text-xs font-semibold text-[#888] uppercase tracking-wider mb-1.5 block";
const cardCls = "bg-[#14213d] border border-[#333535] hover:border-custom-amber/30 rounded-2xl p-6 transition-colors space-y-4";
const saveBtnCls = "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer";

interface Props {
  addToast: (type: "success" | "error" | "info", msg: string) => void;
  openConfirm?: (config: { title: string; message: string; confirmText?: string; variant?: "danger" | "warning"; onConfirm: () => void }) => void;
}

export default function TestimonialsTab({ addToast, openConfirm }: Props) {
  const supabase = createClient();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // New testimonial form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState<Omit<Testimonial, "id">>({
    author_name: "",
    author_role: "",
    category: "alumni",
    quote: "",
    linkedin_url: "",
    author_photo_url: "",
    approved: true, // Default to approved when added by admin
    rejected: false,
  });
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur chargement des témoignages.");
      setTestimonials(data.testimonials || []);
    } catch (err: any) {
      addToast("error", err.message || "Erreur de chargement des témoignages.");
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const counts = {
    all: testimonials.length,
    approved: testimonials.filter((t) => t.approved).length,
    pending: testimonials.filter((t) => !t.approved && !t.rejected).length,
    rejected: testimonials.filter((t) => t.rejected && !t.approved).length,
  };

  const filteredTestimonials = testimonials.filter((t) => {
    if (filter === "approved") return t.approved;
    if (filter === "pending") return !t.approved && !t.rejected;
    if (filter === "rejected") return t.rejected && !t.approved;
    return true;
  });

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "testimonials");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur d'upload de la photo.");

      return json.url;
    } catch (err: any) {
      addToast("error", "Erreur lors de l'upload de la photo : " + (err.message || ""));
      return null;
    }
  };

  // Inline Field Change
  const handleFieldChange = (id: string, field: keyof Testimonial, value: any) => {
    setTestimonials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Save changes for a testimonial (Handles insertion if it's a default item!)
  const handleSaveItem = async (t: Testimonial) => {
    if (!t.author_name.trim() || !t.author_role.trim() || !t.quote.trim()) {
      addToast("error", "Veuillez remplir au moins le nom, le rôle et la citation.");
      return;
    }

    setSavingId(t.id);
    try {
      const payload = {
        author_name: t.author_name.trim(),
        author_role: t.author_role.trim(),
        category: t.category,
        quote: t.quote.trim(),
        linkedin_url: t.linkedin_url?.trim() || null,
        author_photo_url: t.author_photo_url || null,
        approved: t.approved,
        rejected: t.rejected,
      };

      if (t.id.startsWith("def-")) {
        // Insert new row in database for default item
        const { data: inserted, error } = await supabase
          .from("testimonials")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setTestimonials((prev) =>
          prev.map((item) => (item.id === t.id ? inserted : item))
        );
        addToast("success", `Témoignage par défaut enregistré en base pour "${t.author_name}" !`);
      } else {
        // Update existing row in database
        const { error } = await supabase
          .from("testimonials")
          .update(payload)
          .eq("id", t.id);

        if (error) throw error;
        addToast("success", `Témoignage de "${t.author_name}" mis à jour !`);
      }
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSavingId(null);
    }
  };

  // Upload Photo for an item
  const handlePhotoUploadForItem = async (id: string, file: File) => {
    setUploadingId(id);
    const photoUrl = await uploadPhoto(file);
    if (photoUrl) {
      handleFieldChange(id, "author_photo_url", photoUrl);
      addToast("info", "Photo chargée. N'oubliez pas d'enregistrer pour valider.");
    }
    setUploadingId(null);
  };

  // Status Toggles
  const handleToggleApproved = (id: string, currentApproved: boolean) => {
    const newApproved = !currentApproved;
    const newRejected = newApproved ? false : false;
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, approved: newApproved, rejected: newRejected } : t))
    );
  };

  const handleToggleRejected = (id: string, currentRejected: boolean) => {
    const newRejected = !currentRejected;
    const newApproved = newRejected ? false : false;
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, rejected: newRejected, approved: newApproved } : t))
    );
  };

  // Delete Item
  const handleDeleteItem = (t: Testimonial) => {
    const doDelete = async () => {
      try {
        if (!t.id.startsWith("def-")) {
          const { error } = await supabase.from("testimonials").delete().eq("id", t.id);
          if (error) throw error;
        }
        addToast("success", "Témoignage supprimé.");
        setTestimonials((prev) => prev.filter((item) => item.id !== t.id));
      } catch (err: any) {
        addToast("error", err.message || "Erreur lors de la suppression.");
      }
    };

    if (openConfirm) {
      openConfirm({
        title: "Supprimer ce témoignage ?",
        message: `Le témoignage de "${t.author_name}" sera retiré.`,
        confirmText: "Supprimer",
        variant: "danger",
        onConfirm: doDelete,
      });
    } else if (window.confirm(`Supprimer le témoignage de "${t.author_name}" ?`)) {
      doDelete();
    }
  };

  // Handle Create New Testimonial
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.author_name.trim() || !newTestimonial.author_role.trim() || !newTestimonial.quote.trim()) {
      addToast("error", "Veuillez remplir les champs obligatoires (*).");
      return;
    }

    setAdding(true);
    try {
      let photoUrl: string | null = null;
      if (newPhotoFile) {
        photoUrl = await uploadPhoto(newPhotoFile);
      }

      const payload = {
        author_name: newTestimonial.author_name.trim(),
        author_role: newTestimonial.author_role.trim(),
        category: newTestimonial.category,
        quote: newTestimonial.quote.trim(),
        linkedin_url: newTestimonial.linkedin_url?.trim() || null,
        author_photo_url: photoUrl,
        approved: newTestimonial.approved,
        rejected: newTestimonial.rejected,
      };

      const { data, error } = await supabase.from("testimonials").insert(payload).select().single();
      if (error) throw error;

      addToast("success", "Nouveau témoignage créé et enregistré !");
      setTestimonials((prev) => [data, ...prev]);
      setShowAddForm(false);
      setNewTestimonial({
        author_name: "",
        author_role: "",
        category: "alumni",
        quote: "",
        linkedin_url: "",
        author_photo_url: "",
        approved: true,
        rejected: false,
      });
      setNewPhotoFile(null);
      setNewPhotoPreview(null);
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de la création.");
    } finally {
      setAdding(false);
    }
  };

  const initials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-custom-amber" />
          <div>
            <h2 className="text-2xl font-bold text-white">Témoignages du Site</h2>
            <p className="text-sm text-[#888] mt-0.5">
              Consultez et modifiez directement les témoignages affichés sur la page d'accueil.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Fermer le formulaire" : "Nouveau Témoignage"}</span>
        </button>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#14213d] border border-[#333535] rounded-2xl p-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(["all", "approved", "pending", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                filter === tab
                  ? "bg-custom-amber text-black font-bold shadow-md"
                  : "bg-[#1e2020] text-[#888] hover:text-white hover:bg-[#282a2b]"
              }`}
            >
              {tab === "all"
                ? `Tous (${counts.all})`
                : tab === "approved"
                ? `Approuvés (${counts.approved})`
                : tab === "pending"
                ? `En attente (${counts.pending})`
                : `Refusés (${counts.rejected})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> {counts.approved} visibles sur le site
          </span>
        </div>
      </div>

      {/* NEW TESTIMONIAL FORM (EXPANDABLE) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddSubmit} className={cardCls + " border-custom-amber/40 shadow-xl"}>
              <h3 className="text-base font-bold text-custom-amber flex items-center gap-2">
                <Plus className="w-5 h-5" /> Créer un nouveau témoignage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nom de l&apos;auteur *</label>
                  <input
                    type="text"
                    required
                    value={newTestimonial.author_name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, author_name: e.target.value })}
                    placeholder="Ex: Prof. Mohamed Ben Ali"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Rôle / Titre *</label>
                  <input
                    type="text"
                    required
                    value={newTestimonial.author_role}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, author_role: e.target.value })}
                    placeholder="Ex: Supply Chain Manager, Airbus"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Catégorie *</label>
                  <select
                    required
                    value={newTestimonial.category}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, category: e.target.value as any })}
                    className={inputCls}
                  >
                    <option value="alumni">Alumni</option>
                    <option value="professeur">Professeur</option>
                    <option value="partenaire">Partenaire industriel</option>
                    <option value="membre">Membre actif</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>LinkedIn (Optionnel)</label>
                  <input
                    type="url"
                    value={newTestimonial.linkedin_url || ""}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Citation / Témoignage *</label>
                <textarea
                  required
                  rows={3}
                  value={newTestimonial.quote}
                  onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                  placeholder="Écrivez le témoignage complet ici..."
                  className={inputCls + " resize-none"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className={labelCls}>Photo de profil (Optionnel)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1e2020] border border-[#333535] flex items-center justify-center flex-shrink-0 text-custom-amber font-bold text-xs">
                      {newPhotoPreview ? (
                        <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#666]" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setNewPhotoFile(f);
                            setNewPhotoPreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#444] text-[#888] hover:border-custom-amber/40 text-xs font-semibold transition-colors">
                        Choisir une photo
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Visibilité Immédiate sur le site</label>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={newTestimonial.approved}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, approved: e.target.checked, rejected: false })}
                      className="w-4 h-4 accent-custom-amber rounded cursor-pointer"
                    />
                    <span className="text-xs text-white font-medium">
                      {newTestimonial.approved ? "Approuvé (Visible directement)" : "En attente de validation"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={adding} className={saveBtnCls}>
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Enregistrer le témoignage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#333535] text-[#888] hover:text-white text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDITABLE TESTIMONIAL CARDS LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-custom-amber animate-spin" />
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="text-center py-16 bg-[#14213d] border border-[#333535] rounded-2xl text-[#888] text-sm">
          Aucun témoignage trouvé dans cette catégorie.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTestimonials.map((t) => (
            <div key={t.id} className={cardCls}>
              {/* Card Header & Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2a2c2c] pb-4">
                <div className="flex items-center gap-3">
                  {/* Author Avatar Preview */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1e2020] border border-custom-amber/40 flex items-center justify-center text-custom-amber font-extrabold text-sm flex-shrink-0">
                    {t.author_photo_url ? (
                      <img src={t.author_photo_url} alt={t.author_name} className="w-full h-full object-cover" />
                    ) : (
                      initials(t.author_name)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold text-base leading-tight">
                        {t.author_name || "Auteur sans nom"}
                      </h4>
                      {t.id.startsWith("def-") && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-custom-amber/10 border border-custom-amber/30 text-custom-amber">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#888]">{t.author_role || "Rôle non renseigné"}</p>
                  </div>
                </div>

                {/* Status Toggle Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleApproved(t.id, t.approved)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      t.approved
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-[#1e2020] text-[#888] border-[#333535] hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.approved ? "Approuvé (Public)" : "Rendre Approuvé"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRejected(t.id, t.rejected)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      t.rejected && !t.approved
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : "bg-[#1e2020] text-[#888] border-[#333535] hover:text-white"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.rejected && !t.approved ? "Refusé" : "Refuser"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(t)}
                    className="p-2 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 border border-[#333535] transition-colors cursor-pointer"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nom de l&apos;auteur *</label>
                  <input
                    type="text"
                    value={t.author_name}
                    onChange={(e) => handleFieldChange(t.id, "author_name", e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Ahmed Ben Salem"
                  />
                </div>

                <div>
                  <label className={labelCls}>Rôle / Titre / Entreprise *</label>
                  <input
                    type="text"
                    value={t.author_role}
                    onChange={(e) => handleFieldChange(t.id, "author_role", e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Supply Chain Manager, Airbus"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Catégorie *</label>
                  <select
                    value={t.category}
                    onChange={(e) => handleFieldChange(t.id, "category", e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="alumni">Alumni</option>
                    <option value="professeur">Professeur</option>
                    <option value="partenaire">Partenaire industriel</option>
                    <option value="membre">Membre actif</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Lien LinkedIn</label>
                  <input
                    type="url"
                    value={t.linkedin_url || ""}
                    onChange={(e) => handleFieldChange(t.id, "linkedin_url", e.target.value)}
                    className={inputCls}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Citation / Témoignage *</label>
                <textarea
                  rows={3}
                  value={t.quote}
                  onChange={(e) => handleFieldChange(t.id, "quote", e.target.value)}
                  className={inputCls + " resize-none"}
                  placeholder="Texte du témoignage..."
                />
              </div>

              {/* Photo Upload & Card Actions Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUploadForItem(t.id, file);
                      }}
                    />
                    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[#444] text-[#888] hover:border-custom-amber/40 text-xs font-semibold transition-colors">
                      {uploadingId === t.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-custom-amber" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Changer la photo
                    </span>
                  </label>
                  {t.author_photo_url && (
                    <span className="text-[10px] text-custom-amber font-mono truncate max-w-[200px]">
                      Photo active
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveItem(t)}
                  disabled={savingId === t.id}
                  className={saveBtnCls}
                >
                  {savingId === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Sauvegarder ce témoignage</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
