"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  ExternalLink,
  Phone,
  Mail,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";

export interface FeedbackItem {
  id: string;
  user_id: string;
  type: "bug" | "suggestion" | "autre";
  description: string;
  page_url: string;
  status: "nouveau" | "en_cours" | "resolu" | "archive";
  created_at: string;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    role?: string;
    avatar_url?: string | null;
  } | null;
}

interface FeedbacksTabProps {
  addToast: (type: "success" | "error" | "info", message: string) => void;
  openConfirmModal?: (config: {
    title: string;
    message: string;
    confirmText?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
  }) => void;
}

export default function FeedbacksTab({ addToast, openConfirmModal }: FeedbacksTabProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bug" | "suggestion">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "nouveau" | "en_cours" | "resolu">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de récupérer les feedbacks.");
      }
      setFeedbacks(data.feedbacks || []);
    } catch (err: any) {
      addToast("error", err.message || "Erreur de chargement des retours.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "nouveau" | "en_cours" | "resolu") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour du statut.");
      }

      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      );
      addToast("success", `Statut mis à jour : ${newStatus.replace("_", " ")}.`);
    } catch (err: any) {
      addToast("error", err.message || "Impossible de modifier le statut.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (id: string) => {
    const action = async () => {
      try {
        const res = await fetch(`/api/feedback?id=${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erreur lors de la suppression.");
        }

        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        addToast("success", "Retour supprimé avec succès.");
      } catch (err: any) {
        addToast("error", err.message || "Impossible de supprimer.");
      }
    };

    if (openConfirmModal) {
      openConfirmModal({
        title: "Supprimer ce retour ?",
        message: "Cette action est irréversible et retirera définitivement ce signalement de la base.",
        confirmText: "Supprimer",
        variant: "danger",
        onConfirm: action,
      });
    } else {
      if (confirm("Voulez-vous vraiment supprimer ce retour ?")) {
        action();
      }
    }
  };

  // Filtrage
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const authorName = `${item.profile?.first_name || ""} ${item.profile?.last_name || ""}`.toLowerCase();
      const email = (item.profile?.email || "").toLowerCase();
      const desc = item.description.toLowerCase();
      const page = item.page_url.toLowerCase();

      return authorName.includes(q) || email.includes(q) || desc.includes(q) || page.includes(q);
    }

    return true;
  });

  // Compteurs
  const countTotal = feedbacks.length;
  const countBugs = feedbacks.filter((f) => f.type === "bug").length;
  const countSuggestions = feedbacks.filter((f) => f.type === "suggestion").length;
  const countNouveau = feedbacks.filter((f) => f.status === "nouveau").length;
  const countEnCours = feedbacks.filter((f) => f.status === "en_cours").length;
  const countResolu = feedbacks.filter((f) => f.status === "resolu").length;

  return (
    <div className="space-y-6">
      {/* Titre & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <MessageSquarePlus className="w-6 h-6 text-[#fca311]" />
            <span>Retours Utilisateurs & Bugs</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#888] mt-1">
            Centralisez les signalements de bugs et les suggestions d'amélioration soumis par les membres.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFeedbacks}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#14171e] hover:bg-[#1a1f29] border border-[#262a36] text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#fca311]" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#14171e] border border-[#222530] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Total Reçus</p>
            <p className="text-2xl font-black text-white mt-1">{countTotal}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14171e] border border-red-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Bugs Signalés</p>
            <p className="text-2xl font-black text-red-400 mt-1">{countBugs}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <Bug className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14171e] border border-[#fca311]/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#fca311] uppercase tracking-wider">Suggestions</p>
            <p className="text-2xl font-black text-[#fca311] mt-1">{countSuggestions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fca311]/10 flex items-center justify-center text-[#fca311]">
            <Lightbulb className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#14171e] border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Résolus</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{countResolu}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#14171e] border border-[#222530]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            placeholder="Rechercher par membre, description ou page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d0e12] border border-[#262a36] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#fca311]/60"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Filtre Type */}
          <div className="flex items-center bg-[#0d0e12] p-1 rounded-xl border border-[#262a36]">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                typeFilter === "all" ? "bg-[#fca311] text-black" : "text-[#888] hover:text-white"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("bug")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                typeFilter === "bug" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-[#888] hover:text-red-400"
              }`}
            >
              <Bug className="w-3 h-3" />
              <span>Bugs</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("suggestion")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                typeFilter === "suggestion" ? "bg-[#fca311]/20 text-[#fca311] border border-[#fca311]/30" : "text-[#888] hover:text-[#fca311]"
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>Idées</span>
            </button>
          </div>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0d0e12] border border-[#262a36] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#fca311]/60 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="nouveau">Nouveaux ({countNouveau})</option>
            <option value="en_cours">En cours ({countEnCours})</option>
            <option value="resolu">Résolus ({countResolu})</option>
          </select>
        </div>
      </div>

      {/* Liste des Feedbacks */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#666]">
          <Loader2 className="w-6 h-6 animate-spin text-[#fca311]" />
          <p className="text-xs">Chargement des signalements...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#14171e] border border-[#222530] p-6">
          <MessageSquarePlus className="w-10 h-10 text-[#444] mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white">Aucun retour trouvé</h4>
          <p className="text-xs text-[#888] mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== "all" || statusFilter !== "all"
              ? "Aucun résultat ne correspond à vos filtres actuels."
              : "Aucun membre n'a encore signalé de bug ou proposé de suggestion."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks.map((item) => {
            const author = item.profile;
            const authorName = author
              ? `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Membre"
              : "Membre";
            const dateStr = new Date(item.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  item.status === "nouveau"
                    ? "bg-[#14171e] border-[#fca311]/30 shadow-sm"
                    : item.status === "resolu"
                    ? "bg-[#101217]/80 border-[#222530] opacity-80"
                    : "bg-[#14171e] border-[#222530]"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Contenu principal */}
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Header : Type + Statut + Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.type === "bug" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                          <Bug className="w-3.5 h-3.5" />
                          <span>Bug</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] text-xs font-bold">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Suggestion</span>
                        </span>
                      )}

                      {/* Badge Statut */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          item.status === "nouveau"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : item.status === "en_cours"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {item.status === "nouveau"
                          ? "Nouveau"
                          : item.status === "en_cours"
                          ? "En cours"
                          : "Résolu"}
                      </span>

                      <span className="text-[11px] text-[#666]">{dateStr}</span>

                      {/* Page concernée */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#888] bg-black/40 px-2 py-0.5 rounded-md border border-[#222530]">
                        <span className="text-[#555]">Page :</span>
                        <span className="text-white">{item.page_url}</span>
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#ddd] leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>

                    {/* Informations du Membre avec Actions Directes */}
                    <div className="pt-2 border-t border-[#222530] flex flex-wrap items-center justify-between gap-3 text-xs text-[#888]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 flex items-center justify-center text-[#fca311] font-bold text-[11px]">
                          {authorName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white mr-1.5">{authorName}</span>
                          <span className="text-[11px] text-[#666]">
                            ({author?.role === "admin" ? "Admin" : author?.role === "membre_bureau" ? "Bureau" : "Membre"})
                          </span>
                        </div>
                      </div>

                      {/* Raccourcis de contact direct */}
                      <div className="flex items-center gap-2">
                        {author?.email && (
                          <a
                            href={`mailto:${author.email}?subject=Retour CGI ENIT : ${item.type === "bug" ? "Votre signalement" : "Votre suggestion"}`}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1d26] hover:bg-[#222632] border border-[#2a2d3a] text-white text-[11px] font-medium transition-colors"
                            title="Envoyer un email"
                          >
                            <Mail className="w-3 h-3 text-[#fca311]" />
                            <span>{author.email}</span>
                          </a>
                        )}

                        {author?.phone && (
                          <a
                            href={`tel:${author.phone}`}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1d26] hover:bg-[#222632] border border-[#2a2d3a] text-white text-[11px] font-medium transition-colors"
                            title="Appeler directement"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{author.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions d'administration */}
                  <div className="flex sm:flex-row lg:flex-col items-center gap-2 pt-2 lg:pt-0 shrink-0 border-t lg:border-t-0 lg:border-l border-[#222530] lg:pl-4">
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) =>
                        handleUpdateStatus(
                          item.id,
                          e.target.value as "nouveau" | "en_cours" | "resolu"
                        )
                      }
                      className="w-full sm:w-auto bg-[#0d0e12] border border-[#2a2e3d] rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#fca311] cursor-pointer"
                    >
                      <option value="nouveau">Statut: Nouveau</option>
                      <option value="en_cours">Statut: En cours</option>
                      <option value="resolu">Statut: Résolu</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all cursor-pointer"
                      title="Supprimer ce feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
