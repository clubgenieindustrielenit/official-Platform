"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Calendar,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  Upload,
  X,
  Users,
  Download,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface FormationRecord {
  id: string;
  title: string;
  trainer_name?: string | null;
  location?: string | null;
  description?: string | null;
  prerequisites?: string | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  google_form_url?: string | null;
  training_material_url?: string | null;
  date_start: string;
  date_end?: string | null;
  capacity?: number | null;
  status: "draft" | "published" | "cancelled" | "done";
  created_at: string;
}

interface ParticipantRecord {
  id: string;
  activity_id: string;
  user_id: string;
  status: "confirmed" | "waitlisted" | "cancelled";
  queue_position?: number | null;
  attended: boolean;
  created_at: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    classe: string | null;
    avatar_url: string | null;
    statut_membre: string | null;
  };
}

export default function FormationsManager({
  onShowToast,
}: {
  onShowToast: (type: "success" | "error" | "info", msg: string) => void;
}) {
  const supabase = createClient();
  const [formations, setFormations] = useState<FormationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<FormationRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [trainingMaterialUrl, setTrainingMaterialUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Participants Modal States
  const [participantsModal, setParticipantsModal] = useState<{
    isOpen: boolean;
    formation: FormationRecord | null;
    participants: ParticipantRecord[];
    loading: boolean;
    search: string;
  }>({
    isOpen: false,
    formation: null,
    participants: [],
    loading: false,
    search: "",
  });

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/formations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur chargement des formations");
      setFormations(data.formations || []);
    } catch (err: any) {
      onShowToast("error", err.message || "Erreur lors du chargement des formations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  const openCreateModal = () => {
    setEditingFormation(null);
    setTitle("");
    setTrainerName("");
    setLocation("");
    setDescription("");
    setPrerequisites("");
    setDateStart(new Date().toISOString().slice(0, 16));
    setDateEnd("");
    setCapacity("");
    setGoogleFormUrl("");
    setTrainingMaterialUrl("");
    setStatus("published");
    setImageFile(null);
    setPreviewImageUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (formation: FormationRecord) => {
    setEditingFormation(formation);
    setTitle(formation.title || "");
    setTrainerName(formation.trainer_name || "");
    setLocation(formation.location || "");
    setDescription(formation.description || "");
    setPrerequisites(formation.prerequisites || "");
    setDateStart(formation.date_start ? new Date(formation.date_start).toISOString().slice(0, 16) : "");
    setDateEnd(formation.date_end ? new Date(formation.date_end).toISOString().slice(0, 16) : "");
    setCapacity(formation.capacity ? String(formation.capacity) : "");
    setGoogleFormUrl(formation.google_form_url || "");
    setTrainingMaterialUrl(formation.training_material_url || "");
    setStatus(formation.status === "draft" ? "draft" : "published");
    setImageFile(null);
    setPreviewImageUrl(formation.cover_image_url || formation.image_url || null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewImageUrl(url);
    }
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "activity-images");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur upload image");

      return json.url;
    } catch (err: any) {
      console.warn("Storage upload fallback:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast("error", "Le titre de la formation est obligatoire.");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl = (previewImageUrl && !previewImageUrl.startsWith("blob:")) ? previewImageUrl : null;
      if (imageFile) {
        const resUrl = await uploadCoverImage(imageFile);
        if (resUrl) uploadedUrl = resUrl;
      }

      const payload = {
        id: editingFormation?.id,
        title: title.trim(),
        trainer_name: trainerName.trim() || null,
        location: location.trim() || null,
        description: description.trim() || "",
        prerequisites: prerequisites.trim() || null,
        date_start: dateStart ? new Date(dateStart).toISOString() : new Date().toISOString(),
        date_end: dateEnd ? new Date(dateEnd).toISOString() : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        google_form_url: googleFormUrl.trim() || null,
        training_material_url: trainingMaterialUrl.trim() || null,
        cover_image_url: uploadedUrl,
        status,
      };

      const res = await fetch("/api/admin/formations", {
        method: editingFormation ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement.");

      onShowToast(
        "success",
        editingFormation ? "Formation modifiée avec succès !" : "Nouvelle formation créée avec succès !"
      );
      setIsModalOpen(false);
      fetchFormations();
    } catch (err: any) {
      onShowToast("error", err.message || "Impossible d'enregistrer la formation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, formTitle: string) => {
    if (!confirm(`Supprimer définitivement la formation "${formTitle}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/formations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur suppression.");

      onShowToast("success", "Formation supprimée.");
      setFormations((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      onShowToast("error", err.message || "Erreur lors de la suppression.");
    }
  };

  // Open Participants Modal
  const openParticipants = async (formation: FormationRecord) => {
    setParticipantsModal({
      isOpen: true,
      formation,
      participants: [],
      loading: true,
      search: "",
    });

    try {
      const res = await fetch(`/api/admin/formations/participants?activity_id=${formation.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur participants");

      setParticipantsModal((prev) => ({
        ...prev,
        participants: data.participants || [],
        loading: false,
      }));
    } catch (err: any) {
      onShowToast("error", err.message || "Erreur chargement des inscrits.");
      setParticipantsModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const toggleAttendance = async (regId: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/formations/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: regId, attended: !current }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour présence.");

      setParticipantsModal((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === regId ? { ...p, attended: !current } : p
        ),
      }));
      onShowToast("success", !current ? "Présence validée !" : "Présence retirée.");
    } catch (err: any) {
      onShowToast("error", err.message);
    }
  };

  const filteredFormations = formations.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.trainer_name && f.trainer_name.toLowerCase().includes(search.toLowerCase())) ||
      (f.location && f.location.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && f.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            <span>Gestion des Formations Professionnelles</span>
          </h2>
          <p className="text-[#888] text-sm mt-0.5">
            Publiez des ateliers techniques, gérez les formateurs, supports de cours et listes d&apos;inscrits.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-emerald-400 hover:bg-emerald-300 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] shrink-0 cursor-pointer transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Formation</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#777]" />
          <input
            type="text"
            placeholder="Rechercher par titre, formateur, lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141515] border border-[#2a2c2c] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Toutes" },
            { id: "published", label: "Publiées" },
            { id: "draft", label: "Brouillons" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                  : "bg-[#141515] text-[#888] border border-[#2a2c2c] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formations Grid */}
      {loading ? (
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-12 text-center text-[#888] text-sm flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Chargement des formations...</span>
        </div>
      ) : filteredFormations.length === 0 ? (
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-12 text-center text-[#888] text-sm space-y-3">
          <GraduationCap className="w-8 h-8 text-[#555] mx-auto" />
          <p>Aucune formation trouvée. Cliquez sur &quot;Nouvelle Formation&quot; pour en planifier une.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFormations.map((formation) => (
            <div
              key={formation.id}
              className="bg-[#141515] border border-[#2a2c2c] hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Cover Image */}
                <div className="w-full h-40 bg-[#1c1e1e] relative overflow-hidden">
                  {formation.cover_image_url || formation.image_url ? (
                    <img
                      src={formation.cover_image_url || formation.image_url || ""}
                      alt={formation.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#444] gap-2">
                      <GraduationCap className="w-8 h-8 text-emerald-500/30" />
                      <span className="text-[10px] font-mono uppercase">Pas d&apos;image</span>
                    </div>
                  )}

                  {/* Status badge overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                        formation.status === "published"
                          ? "bg-emerald-500/80 text-black border-emerald-400 font-extrabold"
                          : "bg-gray-800/80 text-gray-300 border-gray-600"
                      }`}
                    >
                      {formation.status === "published" ? "Publiée" : "Brouillon"}
                    </span>
                  </div>

                  {/* Capacity badge overlay */}
                  {formation.capacity && (
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>{formation.capacity} places</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    {formation.trainer_name && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {formation.trainer_name}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {formation.title}
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#aaa] font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{new Date(formation.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {formation.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{formation.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges for Form / Materials */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {formation.google_form_url && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Google Form
                      </span>
                    )}
                    {formation.training_material_url && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Supports
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-[#2a2c2c] mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => openParticipants(formation)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inscrits</span>
                </button>

                <button
                  onClick={() => openEditModal(formation)}
                  className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(formation.id, formation.title)}
                  className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#141515] border border-[#2a2c2c] w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingFormation ? "Modifier la formation" : "Nouvelle Formation"}
                    </h3>
                    <p className="text-xs text-[#888]">Renseignez les détails pour les adhérents.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title & Trainer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Titre de la formation *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ex: Workshop Power BI & Supply Chain"
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Formateur / Animateur
                    </label>
                    <input
                      type="text"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      placeholder="ex: Dr. Foulen Ben Foulen / Expert Safran"
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Location & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Lieu / Salle ou Lien
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="ex: Amphi GI / Salle B12 / Google Meet"
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Capacité (Nombre total de places)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="ex: 25"
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Date & Heure de début *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Date & Heure de fin (optionnel)
                    </label>
                    <input
                      type="datetime-local"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Google Form & Materials URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Lien Google Form d&apos;inscription (Optionnel)
                    </label>
                    <input
                      type="url"
                      value={googleFormUrl}
                      onChange={(e) => setGoogleFormUrl(e.target.value)}
                      placeholder="https://forms.gle/..."
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                      Lien Supports de Formation / Drive (Optionnel)
                    </label>
                    <input
                      type="url"
                      value={trainingMaterialUrl}
                      onChange={(e) => setTrainingMaterialUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Description / Objectives */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                    Programme & Objectifs de la formation
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Grandes lignes du contenu abordé..."
                    className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Prerequisites */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                    Prérequis recommandés (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                    placeholder="ex: Notions de base en Python, PC portable requis"
                    className="w-full px-4 py-2.5 bg-[#1e2020] border border-[#333535] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#aaa] mb-1">
                    Image de couverture
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#333535] hover:border-emerald-400/50 rounded-2xl p-4 cursor-pointer bg-[#1e2020] transition-colors">
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-xs text-[#aaa]">Choisir une image (JPG, PNG, WebP)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {previewImageUrl && (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#333535] shrink-0 relative">
                        <img
                          src={previewImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setPreviewImageUrl(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#aaa] mb-1.5">
                    Statut de publication
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "published", label: "Publier immédiatement" },
                      { id: "draft", label: "Brouillon (Non visible)" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStatus(opt.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          status === opt.id
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                            : "bg-[#1e2020] text-[#777] border border-[#333535] hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2c2c]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? "Enregistrement..." : editingFormation ? "Mettre à jour" : "Créer la formation"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PARTICIPANTS MODAL */}
      <AnimatePresence>
        {participantsModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141515] border border-[#2a2c2c] w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <span>Inscrits : {participantsModal.formation?.title}</span>
                  </h3>
                  <p className="text-xs text-[#888] mt-0.5">
                    {participantsModal.participants.length} participant(s) enregistré(s)
                  </p>
                </div>
                <button
                  onClick={() => setParticipantsModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {participantsModal.loading ? (
                <div className="py-12 text-center text-[#888] text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Chargement des inscrits...</span>
                </div>
              ) : participantsModal.participants.length === 0 ? (
                <div className="py-12 text-center text-[#888] text-sm">
                  Aucun membre inscrit pour le moment.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {participantsModal.participants.map((part) => (
                    <div
                      key={part.id}
                      className="p-3.5 bg-[#1e2020] border border-[#333535] rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
                          {part.profile?.first_name?.[0] || "?"}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {part.profile?.first_name} {part.profile?.last_name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-[#888] font-mono">
                            <span>{part.profile?.email}</span>
                            {part.profile?.classe && <span>• {part.profile.classe}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            part.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {part.status === "confirmed" ? "Confirmé" : "En attente"}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleAttendance(part.id, part.attended)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            part.attended
                              ? "bg-emerald-500 text-black font-bold"
                              : "bg-white/10 text-[#aaa] hover:text-white"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{part.attended ? "Présent" : "Marquer Présent"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
