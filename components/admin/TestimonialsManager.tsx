"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  Quote,
  User,
  Briefcase,
  Sparkles,
  AlertCircle,
  Linkedin,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface TestimonialRecord {
  id: string;
  quote: string;
  author: string;
  author_name?: string;
  role?: string | null;
  author_role?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  author_photo_url?: string | null;
  category?: string | null;
  linkedin_url?: string | null;
  is_published: boolean;
  created_at: string;
}

interface TestimonialsManagerProps {
  onShowToast?: (type: "success" | "error" | "info", message: string) => void;
}

const CATEGORIES = [
  { value: "professeur", label: "Enseignant / Professeur" },
  { value: "alumni", label: "Alumnus / Diplômé" },
  { value: "entreprise", label: "Partenaire Industriel / Entreprise" },
  { value: "etudiant", label: "Étudiant Membre" },
  { value: "autre", label: "Autre" },
];

export default function TestimonialsManager({ onShowToast }: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formQuote, setFormQuote] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formCategory, setFormCategory] = useState("professeur");
  const [formLinkedinUrl, setFormLinkedinUrl] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<TestimonialRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      if (res.ok && data.testimonials) {
        setTestimonials(data.testimonials);
      } else {
        throw new Error(data.error || "Impossible de charger les témoignages.");
      }
    } catch (err: any) {
      onShowToast?.("error", err.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormQuote("");
    setFormAuthor("");
    setFormRole("");
    setFormCategory("professeur");
    setFormLinkedinUrl("");
    setFormIsPublished(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: TestimonialRecord) => {
    setEditingItem(item);
    setFormQuote(item.quote);
    setFormAuthor(item.author || item.author_name || "");
    setFormRole(item.role || item.author_role || "");
    setFormCategory(item.category || "professeur");
    setFormLinkedinUrl(item.linkedin_url || "");
    setFormIsPublished(item.is_published);
    setIsModalOpen(true);
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuote.trim() || !formAuthor.trim()) {
      onShowToast?.("info", "La citation et le nom de l'auteur sont requis.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: editingItem?.id,
        quote: formQuote.trim(),
        author: formAuthor.trim(),
        author_name: formAuthor.trim(),
        role: formRole.trim(),
        author_role: formRole.trim(),
        category: formCategory,
        linkedin_url: formLinkedinUrl.trim() || null,
        is_published: formIsPublished,
      };

      const res = await fetch("/api/admin/testimonials", {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la sauvegarde.");

      onShowToast?.(
        "success",
        editingItem ? "Témoignage mis à jour avec succès !" : "Témoignage ajouté et publié !"
      );
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (err: any) {
      onShowToast?.("error", err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Quick toggle publish status
  const handleTogglePublish = async (item: TestimonialRecord) => {
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          quote: item.quote,
          author: item.author || item.author_name,
          role: item.role || item.author_role,
          category: item.category,
          linkedin_url: item.linkedin_url,
          is_published: !item.is_published,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de statut.");

      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_published: !t.is_published } : t))
      );
      onShowToast?.(
        "info",
        !item.is_published ? "Témoignage visible sur la page d'accueil." : "Témoignage masqué."
      );
    } catch (err: any) {
      onShowToast?.("error", err.message || "Impossible de changer le statut.");
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/testimonials?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression.");

      onShowToast?.("success", "Témoignage supprimé avec succès.");
      setDeleteTarget(null);
      fetchTestimonials();
    } catch (err: any) {
      onShowToast?.("error", err.message || "Échec de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  // Helper for category badge
  const getCategoryLabel = (cat?: string | null) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : "Témoignage";
  };

  // Filtered list
  const filteredTestimonials = testimonials.filter((item) => {
    const authorName = item.author || item.author_name || "";
    const authorRole = item.role || item.author_role || "";
    const matchSearch =
      authorName.toLowerCase().includes(search.toLowerCase()) ||
      item.quote.toLowerCase().includes(search.toLowerCase()) ||
      authorRole.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && item.is_published) ||
      (statusFilter === "draft" && !item.is_published);

    const matchCat =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#fca311]" />
            Gestion des Témoignages
          </h2>
          <p className="text-xs text-[#888] mt-1">
            Gérez les avis, retours d'enseignants, partenaires industriels et alumni affichés sur la page d'accueil.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fca311] text-black font-bold text-xs hover:bg-[#ffc887] transition-all shadow-[0_0_15px_rgba(252,163,17,0.2)] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau témoignage
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            type="text"
            placeholder="Rechercher par auteur, rôle ou citation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "all"
                ? "bg-[#2a2c2c] text-[#fca311] border border-[#fca311]/30"
                : "bg-[#141616] text-[#888] border border-[#2a2c2c] hover:text-white"
            }`}
          >
            Tous ({testimonials.length})
          </button>
          <button
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "published"
                ? "bg-[#2a2c2c] text-emerald-400 border border-emerald-500/30"
                : "bg-[#141616] text-[#888] border border-[#2a2c2c] hover:text-white"
            }`}
          >
            Publiés ({testimonials.filter((t) => t.is_published).length})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "draft"
                ? "bg-[#2a2c2c] text-amber-400 border border-amber-500/30"
                : "bg-[#141616] text-[#888] border border-[#2a2c2c] hover:text-white"
            }`}
          >
            Masqués ({testimonials.filter((t) => !t.is_published).length})
          </button>
        </div>
      </div>

      {/* Testimonials List / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#fca311] animate-spin" />
          <p className="text-xs text-[#888]">Chargement des témoignages...</p>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="bg-[#141616] border border-[#2a2c2c] rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1c1c] border border-[#2a2c2c] flex items-center justify-center mx-auto mb-4 text-[#fca311]">
            <Quote className="w-7 h-7" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {search || statusFilter !== "all" || categoryFilter !== "all"
              ? "Aucun résultat trouvé"
              : "Aucun témoignage enregistré"}
          </h3>
          <p className="text-xs text-[#888] max-w-md mx-auto mb-6">
            {search || statusFilter !== "all" || categoryFilter !== "all"
              ? "Essayez de modifier vos critères de recherche ou de filtre."
              : "Ajoutez des citations de professeurs, industriels ou anciens membres pour enrichir la page d'accueil."}
          </p>
          {!search && statusFilter === "all" && categoryFilter === "all" && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fca311] text-black font-bold text-xs hover:bg-[#ffc887] transition-all"
            >
              <Plus className="w-4 h-4" />
              Ajouter le premier témoignage
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTestimonials.map((item) => {
            const displayName = item.author || item.author_name || "Anonyme";
            const displayRole = item.role || item.author_role || "";
            const avatarInitial = item.avatar || (displayName ? displayName.substring(0, 2).toUpperCase() : "CG");

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#141616] border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-[#fca311]/40 ${
                  item.is_published ? "border-[#2a2c2c]" : "border-[#2a2c2c]/50 opacity-70"
                }`}
              >
                <div>
                  {/* Header card with status + category + actions */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#222]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.is_published
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {item.is_published ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Publié
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Masqué
                          </>
                        )}
                      </span>

                      {item.category && (
                        <span className="text-[10px] text-[#fca311] bg-[#fca311]/10 px-2 py-0.5 rounded-full border border-[#fca311]/20 font-medium">
                          {getCategoryLabel(item.category)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        title={item.is_published ? "Masquer sur la page d'accueil" : "Publier sur la page d'accueil"}
                        className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1f2121] transition-colors"
                      >
                        {item.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        title="Modifier"
                        className="p-1.5 rounded-lg text-[#888] hover:text-[#fca311] hover:bg-[#1f2121] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-[#888] hover:text-red-400 hover:bg-[#1f2121] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quote Content */}
                  <div className="relative mb-6">
                    <span className="text-4xl text-[#fca311]/20 font-serif leading-none select-none block -mb-3">
                      “
                    </span>
                    <p className="text-xs text-[#bbb] leading-relaxed italic line-clamp-4 pl-1">
                      {item.quote}
                    </p>
                  </div>
                </div>

                {/* Author Footer */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#222]">
                  <div className="w-9 h-9 rounded-full bg-black border border-[#fca311]/30 flex items-center justify-center text-[#fca311] font-extrabold text-xs shrink-0">
                    {avatarInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-bold text-xs truncate">
                      {displayName}
                    </h4>
                    {displayRole && (
                      <p className="text-[10px] text-[#777] truncate">
                        {displayRole}
                      </p>
                    )}
                  </div>
                  {item.linkedin_url && (
                    <a
                      href={item.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#888] hover:text-[#fca311] transition-colors p-1"
                      title="Profil LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141616] border border-[#2a2c2c] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#222]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#fca311]/10 border border-[#fca311]/30 flex items-center justify-center text-[#fca311]">
                    <Quote className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-white">
                    {editingItem ? "Modifier le témoignage" : "Nouveau témoignage"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#1a1c1c] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Quote */}
                <div>
                  <label className="block text-xs font-semibold text-[#bbb] mb-1.5">
                    Citation / Témoignage <span className="text-[#fca311]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formQuote}
                    onChange={(e) => setFormQuote(e.target.value)}
                    placeholder="Ex: Le Club Génie Industriel de l'ENIT est un pont essentiel entre le monde académique et l'industrie..."
                    className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl p-3 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Author & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#bbb] mb-1.5">
                      Nom de l'auteur <span className="text-[#fca311]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        required
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        placeholder="Ex: Pr. Slimane Ben Ali"
                        className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#bbb] mb-1.5">
                      Rôle / Titre / Statut
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value)}
                        placeholder="Ex: Enseignant-Chercheur ENIT"
                        className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & LinkedIn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#bbb] mb-1.5">
                      Catégorie
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#fca311]/50 transition-colors"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value} className="bg-[#141616] text-white">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#bbb] mb-1.5">
                      Lien LinkedIn (Optionnel)
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                      <input
                        type="url"
                        value={formLinkedinUrl}
                        onChange={(e) => setFormLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Published Checkbox Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#fca311]" />
                    <div>
                      <p className="text-xs font-semibold text-white">Publier immédiatement</p>
                      <p className="text-[10px] text-[#777]">
                        Rendre ce témoignage visible sur la page d'accueil
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#2a2c2c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fca311]" />
                  </label>
                </div>

                {/* Live Preview */}
                {formQuote.trim() && (
                  <div className="mt-4 pt-4 border-t border-[#222]">
                    <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">
                      Aperçu en direct
                    </p>
                    <div className="bg-black/50 border border-[#fca311]/20 rounded-2xl p-4">
                      <span className="text-3xl text-[#fca311]/20 font-serif leading-none block -mb-2">“</span>
                      <p className="text-xs text-[#bbb] italic leading-relaxed mb-3">
                        {formQuote}
                      </p>
                      <div className="flex items-center gap-2.5 pt-2 border-t border-[#222]">
                        <div className="w-7 h-7 rounded-full bg-black border border-[#fca311]/40 flex items-center justify-center text-[#fca311] font-bold text-[10px]">
                          {formAuthor ? formAuthor.substring(0, 2).toUpperCase() : "AA"}
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">{formAuthor || "Nom de l'auteur"}</p>
                          <p className="text-[9px] text-[#777]">{formRole || "Rôle / Titre"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888] hover:text-white hover:bg-[#1a1c1c] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fca311] text-black font-bold text-xs hover:bg-[#ffc887] transition-all disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingItem ? "Enregistrer les modifications" : "Créer le témoignage"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141616] border border-[#2a2c2c] rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-white font-bold text-base mb-1">
                Supprimer ce témoignage ?
              </h3>
              <p className="text-xs text-[#888] mb-6 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer le témoignage de{" "}
                <span className="text-white font-bold">{deleteTarget.author || deleteTarget.author_name}</span> ? Cette action est irréversible.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888] hover:text-white hover:bg-[#1a1c1c] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Supprimer définitivement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
