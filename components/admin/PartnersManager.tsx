"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Handshake,
  Plus,
  Upload,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Building2,
  Globe,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

interface PartnersManagerProps {
  onNotify?: (type: "success" | "error" | "info", message: string) => void;
}

export default function PartnersManager({ onNotify }: PartnersManagerProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Delete modal state
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (type: "success" | "error" | "info", message: string) => {
    if (onNotify) onNotify(type, message);
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      if (res.ok && data.partners) {
        setPartners(data.partners);
      } else {
        notify("error", data.error || "Erreur de chargement des partenaires");
      }
    } catch (err: any) {
      notify("error", err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const openAddModal = () => {
    setEditingPartner(null);
    setPartnerName("");
    setWebsiteUrl("");
    setLogoFile(null);
    setLogoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerName(partner.name);
    setWebsiteUrl(partner.website_url || "");
    setLogoFile(null);
    setLogoPreview(partner.logo_url);
    setIsModalOpen(true);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      notify("error", "Veuillez sélectionner une image (PNG, JPG, SVG, WebP).");
      return;
    }
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      notify("error", "Le nom du partenaire est requis.");
      return;
    }

    if (!editingPartner && !logoFile && !logoPreview) {
      notify("error", "Veuillez téléverser le logo du partenaire.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingPartner) {
        // If there's a new file, upload via FormData
        if (logoFile) {
          const formData = new FormData();
          formData.append("name", partnerName.trim());
          formData.append("website_url", websiteUrl.trim());
          formData.append("file", logoFile);

          const res = await fetch("/api/admin/partners", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");

          // delete the old one
          await fetch(`/api/admin/partners?id=${editingPartner.id}`, { method: "DELETE" });
        } else {
          // Update details only
          const res = await fetch("/api/admin/partners", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editingPartner.id,
              name: partnerName.trim(),
              website_url: websiteUrl.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");
        }
        notify("success", "Partenaire mis à jour avec succès !");
      } else {
        // Create new
        const formData = new FormData();
        formData.append("name", partnerName.trim());
        formData.append("website_url", websiteUrl.trim());
        if (logoFile) {
          formData.append("file", logoFile);
        } else if (logoPreview) {
          formData.append("logo_url", logoPreview);
        }

        const res = await fetch("/api/admin/partners", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de création");

        notify("success", `Partenaire "${partnerName}" ajouté avec succès !`);
      }

      setIsModalOpen(false);
      fetchPartners();
    } catch (err: any) {
      notify("error", err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      const res = await fetch("/api/admin/partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: partner.id,
          is_active: !partner.is_active,
        }),
      });
      if (!res.ok) throw new Error("Erreur de modification");
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, is_active: !p.is_active } : p))
      );
      notify("success", `Visibilité modifiée pour ${partner.name}`);
    } catch (err: any) {
      notify("error", err.message);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= partners.length) return;

    const newPartners = [...partners];
    const temp = newPartners[index];
    newPartners[index] = newPartners[targetIndex];
    newPartners[targetIndex] = temp;

    // Update display_order values
    const updatedWithOrder = newPartners.map((p, idx) => ({
      ...p,
      display_order: idx + 1,
    }));

    setPartners(updatedWithOrder);

    try {
      await fetch("/api/admin/partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedWithOrder.map((p) => ({ id: p.id, display_order: p.display_order })),
        }),
      });
    } catch (err) {
      notify("error", "Erreur lors du réordonnancement");
      fetchPartners();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/partners?id=${partnerToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");

      notify("success", `Partenaire "${partnerToDelete.name}" supprimé.`);
      setPartnerToDelete(null);
      fetchPartners();
    } catch (err: any) {
      notify("error", err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141820] border border-[#232936] p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5 text-custom-amber mb-1">
            <Handshake className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Partenaires du Club
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gestion de la Bande des Partenaires
          </h2>
          <p className="text-xs sm:text-sm text-[#8a94a6] mt-1 max-w-2xl">
            Ajoutez, modifiez ou réordonnez les logos des entreprises et sponsors. Les changements
            apparaissent automatiquement en temps réel sur la page d'accueil.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-custom-amber text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:bg-custom-amber/90 transition-all shadow-[0_0_20px_rgba(252,163,17,0.2)] shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Partenaire</span>
        </button>
      </div>

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#11141c] p-3 rounded-xl border border-[#202634]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#181d28] border border-[#2a3242] rounded-lg text-xs text-white placeholder-[#666] focus:outline-none focus:border-custom-amber/60"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-[#888] w-full sm:w-auto justify-end">
          <span>
            Total : <strong className="text-white">{partners.length}</strong>
          </span>
          <span>
            Actifs :{" "}
            <strong className="text-emerald-400">
              {partners.filter((p) => p.is_active).length}
            </strong>
          </span>
        </div>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#11141c] rounded-2xl border border-[#202634]">
          <Loader2 className="w-8 h-8 text-custom-amber animate-spin mb-3" />
          <p className="text-xs text-[#888] font-mono">Chargement des partenaires...</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-16 bg-[#11141c] rounded-2xl border border-[#202634] p-6 space-y-3">
          <Building2 className="w-12 h-12 text-[#444] mx-auto" />
          <h3 className="text-sm font-bold text-white">Aucun partenaire trouvé</h3>
          <p className="text-xs text-[#777] max-w-md mx-auto">
            {searchQuery
              ? "Aucun partenaire ne correspond à votre recherche."
              : "Aucun partenaire n'est encore enregistré. Cliquez sur Nouveau Partenaire pour en ajouter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-[#141820] border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group ${
                partner.is_active
                  ? "border-[#252d3d] hover:border-custom-amber/40"
                  : "border-red-500/20 opacity-60"
              }`}
            >
              {/* Top Row: Index and Actions */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#888] border border-white/5">
                    #{partner.display_order}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      partner.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}
                  >
                    {partner.is_active ? "Actif" : "Masqué"}
                  </span>
                </div>

                {/* Reorder Arrows */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                    className="p-1 rounded bg-[#1c2230] text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === partners.length - 1}
                    onClick={() => handleMove(index, "down")}
                    className="p-1 rounded bg-[#1c2230] text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Logo Preview (White Card matching Homepage) */}
              <div className="w-full h-28 bg-white rounded-xl p-3 flex items-center justify-center shadow-inner overflow-hidden my-2 group-hover:shadow-[0_0_15px_rgba(252,163,17,0.2)] transition-shadow">
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Partner Name & Website */}
              <div className="mt-3 space-y-1">
                <h4 className="text-sm font-bold text-white truncate" title={partner.name}>
                  {partner.name}
                </h4>
                {partner.website_url ? (
                  <a
                    href={partner.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-custom-amber/80 hover:text-custom-amber truncate max-w-full"
                  >
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{partner.website_url.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[11px] text-[#666] italic">Aucun site web renseigné</span>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#202634]">
                <button
                  onClick={() => handleToggleActive(partner)}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    partner.is_active
                      ? "text-[#888] hover:text-white hover:bg-white/5"
                      : "text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                  title={partner.is_active ? "Masquer de la page d'accueil" : "Afficher sur la page d'accueil"}
                >
                  {partner.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{partner.is_active ? "Masquer" : "Afficher"}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(partner)}
                    className="p-1.5 text-[#888] hover:text-custom-amber hover:bg-custom-amber/10 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPartnerToDelete(partner)}
                    className="p-1.5 text-[#888] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Add / Edit Partner                                      */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#141820] border border-custom-amber/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative z-10 shadow-2xl space-y-6"
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-[#888] hover:text-white bg-black/30 rounded-full border border-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-custom-amber/10 text-custom-amber text-[10px] font-mono font-bold uppercase">
                  <Handshake className="w-3 h-3" />
                  <span>{editingPartner ? "Modification" : "Nouveau Partenaire"}</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingPartner ? `Modifier ${editingPartner.name}` : "Ajouter un Partenaire"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Partner Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">
                    Nom de l'Entreprise / Sponsor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: STB BANK, Tunisie Telecom, BIAT..."
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d1017] border border-[#2a3242] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-custom-amber"
                  />
                </div>

                {/* Website URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">
                    Site Web officiel (Optionnel)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d1017] border border-[#2a3242] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-custom-amber"
                  />
                </div>

                {/* Logo Upload Box with Drag & Drop */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">
                    Logo du Partenaire {editingPartner ? "(Laisser vide pour conserver l'actuel)" : "*"}
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-custom-amber bg-custom-amber/10"
                        : "border-[#2a3242] hover:border-custom-amber/50 bg-[#0d1017]"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                      }}
                    />

                    {logoPreview ? (
                      <div className="space-y-3">
                        <div className="w-full h-24 bg-white rounded-xl p-2 flex items-center justify-center">
                          <img
                            src={logoPreview}
                            alt="Aperçu logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <p className="text-[11px] text-custom-amber font-mono">
                          Cliquez ou glissez pour remplacer l'image
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <Upload className="w-8 h-8 text-[#666] mx-auto" />
                        <p className="text-xs text-[#aaa]">
                          Glissez-déposez le logo ici, ou <span className="text-custom-amber underline">parcourez</span>
                        </p>
                        <p className="text-[10px] text-[#555]">
                          Format idéal : PNG transparent ou SVG. Compression automatique côté serveur.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 text-[#aaa] hover:text-white text-xs font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-custom-amber text-black font-extrabold text-xs uppercase tracking-wider hover:bg-custom-amber/90 disabled:opacity-50 transition-all cursor-pointer shadow-[0_0_15px_rgba(252,163,17,0.2)]"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingPartner ? "Enregistrer" : "Ajouter"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* Modal: Confirm Delete Partner                                  */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {partnerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPartnerToDelete(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141820] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Supprimer ce partenaire ?</h3>
                <p className="text-xs text-[#888]">
                  Êtes-vous sûr de vouloir supprimer définitivement{" "}
                  <strong className="text-white">"{partnerToDelete.name}"</strong> de la liste ? Ce
                  logo ne sera plus affiché sur la page d'accueil.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setPartnerToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#aaa] hover:text-white text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-colors"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Supprimer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
