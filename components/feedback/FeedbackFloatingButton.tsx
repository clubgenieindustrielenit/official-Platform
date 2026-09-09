"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Bug, Lightbulb, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function FeedbackFloatingButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"bug" | "suggestion">("bug");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Réinitialiser les états lors de la fermeture
  const handleClose = () => {
    if (submitting) return;
    setIsOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setErrorMessage(null);
      setDescription("");
      setType("bug");
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage("Veuillez fournir une description détaillée (au moins 5 caractères).");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim(),
          page_url: pathname || window.location.pathname,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Bouton Flottant Déclenché */}
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(true)}
        aria-label="Signaler un problème ou faire une suggestion"
        title="Signaler un bug ou faire une suggestion"
        className="fixed z-40 bottom-20 right-4 lg:bottom-6 lg:right-6 flex items-center justify-center gap-2 px-3.5 py-3 rounded-full bg-gradient-to-r from-[#1b1e24] to-[#121417] text-[#fca311] border border-[#fca311]/40 shadow-[0_4px_25px_rgba(0,0,0,0.6)] hover:border-[#fca311] hover:shadow-[0_0_20px_rgba(252,163,17,0.3)] transition-all duration-300 group cursor-pointer backdrop-blur-md"
      >
        <MessageSquarePlus className="w-5 h-5 text-[#fca311] group-hover:rotate-12 transition-transform duration-300" />
        <span className="hidden sm:inline-block text-xs font-bold text-white tracking-wide pr-1">
          Aide & Suggestions
        </span>
      </motion.button>

      {/* Modal Slide-over / Pop-up */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg bg-[#101216] border border-[#2a2d36] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#222530] bg-[#14171e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fca311]/10 border border-[#fca311]/30 flex items-center justify-center text-[#fca311]">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Faire un retour à l'équipe
                    </h3>
                    <p className="text-[11px] text-[#888] flex items-center gap-1.5 mt-0.5">
                      <span>Page actuelle :</span>
                      <code className="text-[#fca311] font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded">
                        {pathname}
                      </code>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-1.5 rounded-xl text-[#888] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Merci pour votre retour !</h4>
                    <p className="text-xs text-[#888] max-w-xs">
                      L'équipe du bureau a bien reçu votre message et va l'examiner rapidement.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Sélecteur de type */}
                    <div>
                      <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                        De quoi s'agit-il ?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setType("bug")}
                          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                            type === "bug"
                              ? "bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                              : "bg-[#14171e] border-[#222530] text-[#777] hover:text-white hover:bg-[#181b24]"
                          }`}
                        >
                          <Bug className="w-4 h-4" />
                          <span>Signaler un Bug</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setType("suggestion")}
                          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                            type === "suggestion"
                              ? "bg-[#fca311]/10 border-[#fca311]/50 text-[#fca311] shadow-[0_0_15px_rgba(252,163,17,0.15)]"
                              : "bg-[#14171e] border-[#222530] text-[#777] hover:text-white hover:bg-[#181b24]"
                          }`}
                        >
                          <Lightbulb className="w-4 h-4" />
                          <span>Faire une Idée</span>
                        </button>
                      </div>
                    </div>

                    {/* Zone de description */}
                    <div>
                      <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                        {type === "bug"
                          ? "Décrivez le problème rencontré *"
                          : "Quelle fonctionnalité ou amélioration proposez-vous ? *"}
                      </label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                          type === "bug"
                            ? "Ex: Quand je clique sur le bouton X, la page ne se charge pas ou affiche une erreur..."
                            : "Ex: Ce serait super d'ajouter un filtre par pôle dans le calendrier des visites..."
                        }
                        className="w-full bg-[#14171e] border border-[#262a36] rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#fca311]/60 focus:ring-1 focus:ring-[#fca311]/60 transition-colors resize-none"
                      />
                    </div>

                    {/* Message d'erreur */}
                    {errorMessage && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl border border-[#2a2d36] text-xs font-semibold text-[#888] hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Annuler
                      </button>

                      <button
                        type="submit"
                        disabled={submitting || !description.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fca311] hover:bg-[#e0920f] text-black font-extrabold text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(252,163,17,0.2)]"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Envoi en cours...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Envoyer le retour</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
