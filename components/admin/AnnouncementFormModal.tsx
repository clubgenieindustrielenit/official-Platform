"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone, Pin, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing: {
    id: string;
    title: string;
    excerpt: string | null;
    content: string | null;
    pinned: boolean;
    pole_id: string | null;
  } | null;
  poles: { id: string; name: string }[];
  onSaved: () => void;
}

export default function AnnouncementFormModal({ isOpen, onClose, editing, poles, onSaved }: Props) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [poleId, setPoleId] = useState<string>("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync fields when editing prop changes
  useEffect(() => {
    if (editing) {
      setTitle(editing.title || "");
      setExcerpt(editing.excerpt || "");
      setContent(editing.content || "");
      setPoleId(editing.pole_id || "");
      setPinned(editing.pinned || false);
    } else {
      setTitle("");
      setExcerpt("");
      setContent("");
      setPoleId("");
      setPinned(false);
    }
    setError(null);
  }, [editing, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Le titre est obligatoire."); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        pinned,
        pole_id: poleId || null,
      };
      if (editing) {
        const { error: err } = await supabase.from("announcements").update(payload).eq("id", editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("announcements").insert(payload);
        if (err) throw err;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg bg-[#1a1c1c] border border-[#2a2c2c] rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2c2c]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#fca311]/15 border border-[#fca311]/30 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-[#fca311]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {editing ? "Modifier l'annonce" : "Nouvelle annonce"}
                    </h3>
                    <p className="text-[10px] text-[#888]">Visible par les membres et sur le site public</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Pin toggle in header */}
                  <button
                    onClick={() => setPinned(!pinned)}
                    title={pinned ? "Désépingler" : "Épingler l'annonce"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      pinned
                        ? "bg-[#fca311]/20 text-[#fca311] border border-[#fca311]/40"
                        : "bg-white/5 text-[#888] border border-white/10 hover:text-white"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {pinned ? "Épinglée" : "Épingler"}
                  </button>
                  <button onClick={onClose} className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1.5">
                    Titre <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex : Compte-rendu de la réunion du bureau..."
                    className="w-full bg-[#141515] border border-[#2a2c2c] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#fca311]/50 transition-colors"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1.5">
                    Résumé court <span className="text-[#555] font-normal">(affiché sur le tableau de bord)</span>
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Une ou deux phrases résumant l'annonce..."
                    rows={2}
                    className="w-full bg-[#141515] border border-[#2a2c2c] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#fca311]/50 transition-colors resize-none"
                  />
                </div>

                {/* Full Content */}
                <div>
                  <label className="block text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1.5">
                    Contenu complet <span className="text-[#555] font-normal">(page Annonces)</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Détails complets de l'annonce, informations supplémentaires..."
                    rows={5}
                    className="w-full bg-[#141515] border border-[#2a2c2c] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#fca311]/50 transition-colors resize-none"
                  />
                </div>

                {/* Pole selector */}
                <div>
                  <label className="block text-[10px] text-[#888] font-bold uppercase tracking-wider mb-1.5">
                    Pôle cible
                  </label>
                  <select
                    value={poleId}
                    onChange={(e) => setPoleId(e.target.value)}
                    className="w-full bg-[#141515] border border-[#2a2c2c] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fca311]/50 transition-colors cursor-pointer"
                  >
                    <option value="">Tous les membres</option>
                    {poles.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2c2c]">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#888] hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fca311] text-black font-bold text-sm hover:bg-[#ffc887] transition-all shadow-[0_0_15px_rgba(252,163,17,0.2)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editing ? "Enregistrer" : "Publier l'annonce"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
