"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Mail,
  Smartphone,
  Monitor,
  Eye,
  ChevronLeft,
  Sparkles,
  Shield,
  GraduationCap,
  Users,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { generateInviteEmailHtml, getRoleConfig } from "@/lib/email/inviteEmailTemplate";

const ROLES = [
  { id: "membre_actif", label: "Membre Actif (1ère Année)", icon: Users, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { id: "senior", label: "Membre Senior (2ème Année)", icon: Sparkles, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "alumni", label: "Alumni (Diplômé / 3ème A+)", icon: GraduationCap, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "membre_bureau", label: "Membre du Bureau", icon: Shield, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
];

export default function InviteEmailPreviewPage() {
  const [selectedRole, setSelectedRole] = useState("membre_actif");
  const [recipientEmail, setRecipientEmail] = useState("etudiant.enit@enit.utm.tn");
  const [duration, setDuration] = useState(7);
  const [viewDevice, setViewDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const sampleInviteLink = useMemo(() => {
    return `http://localhost:3000/invite/e4b01e23-2895-4673-9a3b-c2e3532c2596?role=${selectedRole}`;
  }, [selectedRole]);

  const emailHtml = useMemo(() => {
    return generateInviteEmailHtml({
      email: recipientEmail.trim() || "etudiant.enit@enit.utm.tn",
      role: selectedRole,
      inviteLink: sampleInviteLink,
      duration,
      appUrl: "http://localhost:3000",
    });
  }, [selectedRole, recipientEmail, duration, sampleInviteLink]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(emailHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleInfo = getRoleConfig(selectedRole);

  return (
    <div className="min-h-screen bg-[#0b0d0e] text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-[#25282a] bg-[#121415]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-custom-amber transition-colors font-mono uppercase"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour Admin</span>
          </Link>
          <div className="h-4 w-px bg-[#25282a]" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Aperçu de l'Email d'Invitation</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-custom-amber/20 text-custom-amber border border-custom-amber/30">
                  Live Preview
                </span>
              </h1>
              <p className="text-[11px] text-[#777]">
                Visualisez le rendu exact de l'e-mail envoyé aux membres selon leur rôle
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Device Switcher */}
          <div className="bg-[#181a1b] border border-[#2a2c2e] p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewDevice("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewDevice === "desktop"
                  ? "bg-custom-amber text-black font-bold shadow-sm"
                  : "text-[#888] hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setViewDevice("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewDevice === "mobile"
                  ? "bg-custom-amber text-black font-bold shadow-sm"
                  : "text-[#888] hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "HTML Copié !" : "Copier HTML"}</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Left Controls / Right Email Frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Controls Sidebar */}
        <aside className="lg:col-span-4 border-r border-[#25282a] bg-[#101213] p-6 space-y-6 overflow-y-auto">
          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#888] font-mono uppercase tracking-wider block">
              1. Sélectionnez le rôle à tester :
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-custom-amber bg-custom-amber/10 ring-1 ring-custom-amber shadow-lg"
                        : "border-[#25282a] bg-[#151718] hover:border-[#383b3d] text-[#aaa]"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-custom-amber text-black border-custom-amber"
                          : "bg-white/5 border-white/10 text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-[#ddd]"}`}>
                        {r.label}
                      </div>
                      <div className="text-[10px] text-[#777] mt-0.5">
                        {r.id === "alumni"
                          ? "Présentation orientée réseau & retour d'expérience"
                          : r.id === "senior"
                          ? "Présentation orientée mentorat & projets"
                          : r.id === "membre_bureau"
                          ? "Présentation orientée pilotage & administration"
                          : "Présentation membre actif standard"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email parameter */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#888] font-mono uppercase tracking-wider block">
              2. Adresse e-mail destinataire :
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="etudiant@enit.utm.tn"
              className="w-full bg-[#181a1b] border border-[#2a2c2e] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Duration parameter */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#888] font-mono uppercase tracking-wider block">
              3. Durée de validité (jours) :
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#181a1b] border border-[#2a2c2e] focus:border-custom-amber rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer"
            >
              <option value={3}>3 jours</option>
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
            </select>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-2xl bg-[#151718] border border-[#25282a] space-y-2 text-xs">
            <div className="font-bold text-custom-amber flex items-center gap-1.5">
              <span>✨ Améliorations Appliquées :</span>
            </div>
            <ul className="text-[11px] text-[#999] space-y-1.5 list-disc list-inside">
              <li>Design haute fidélité avec badge doré CGI ENIT</li>
              <li>Encadré de rôle personnalisé avec texte et icône distincts</li>
              <li>Bouton d'action doré avec effet de brillance</li>
              <li>Indicateur clair d'expiration du lien</li>
              <li>Compatible Dark Mode et tous clients de messagerie</li>
            </ul>
          </div>
        </aside>

        {/* Email Live Preview Canvas */}
        <main className="lg:col-span-8 bg-[#070809] p-6 sm:p-10 flex flex-col items-center justify-start overflow-y-auto min-h-[600px]">
          {/* Simulated Email Client Window */}
          <div
            className={`w-full transition-all duration-300 rounded-3xl border border-[#25282a] shadow-2xl overflow-hidden bg-[#0e1011] flex flex-col ${
              viewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"
            }`}
          >
            {/* Email Header Bar */}
            <div className="bg-[#151718] border-b border-[#25282a] px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>

              <div className="text-[11px] text-[#888] font-mono truncate max-w-xs sm:max-w-md">
                De : <span className="text-white">Club Génie Industriel ENIT</span> &lt;invites@mail.clubgenieindustrielenit.org&gt;
              </div>

              <div className="text-[10px] text-[#666] font-mono">
                {viewDevice === "mobile" ? "📱 Mobile" : "💻 Desktop"}
              </div>
            </div>

            {/* Subject Line Bar */}
            <div className="bg-[#121415] border-b border-[#222527] px-5 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#888]">Objet :</span>
                <span className="font-bold text-white">
                  Invitation Officielle — Club Génie Industriel ENIT
                </span>
              </div>
              <span className="text-[10px] text-[#666] font-mono">15:32</span>
            </div>

            {/* Email Render Frame */}
            <div className="p-4 sm:p-6 bg-[#0b0d0e] overflow-x-auto flex justify-center">
              <iframe
                title="Email Preview"
                srcDoc={emailHtml}
                className="w-full border-none rounded-2xl"
                style={{
                  minHeight: viewDevice === "mobile" ? "750px" : "680px",
                  height: "100%",
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
