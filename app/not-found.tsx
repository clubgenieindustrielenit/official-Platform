"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, AlertTriangle, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-custom-gray flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-custom-amber/10 blur-[140px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-custom-navy/30 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-xl w-full text-center relative z-10 space-y-8 py-12"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-custom-navy/60 border border-custom-amber/30 text-custom-amber text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(252,163,17,0.15)]">
          <AlertTriangle className="w-4 h-4 text-custom-amber animate-pulse" />
          <span>Erreur 404 • Page Introuvable</span>
        </div>

        {/* 404 Big Numbers */}
        <div className="relative">
          <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-custom-gray to-custom-navy tracking-tighter select-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
            <span className="text-9xl font-black text-custom-amber blur-2xl">404</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-custom-white tracking-tight">
            Flux interrompu ou ressource introuvable
          </h2>
          <p className="text-sm sm:text-base text-custom-gray/70 max-w-md mx-auto leading-relaxed">
            La page que vous essayez d'atteindre n'existe pas, a été déplacée ou est temporairement inaccessible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-custom-amber text-custom-black font-extrabold text-sm tracking-wide transition-all duration-300 hover:bg-custom-amber/90 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_20px_rgba(252,163,17,0.25)]"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-custom-gray/20 hover:border-custom-amber/40 bg-custom-navy/40 text-custom-white font-bold text-sm tracking-wide transition-all duration-300 hover:bg-custom-navy/80 hover:scale-[1.03] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Page précédente</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-custom-navy/40 flex items-center justify-center gap-2 text-xs text-custom-gray/40">
          <ShieldAlert className="w-3.5 h-3.5 text-custom-amber/60" />
          <span>Club Génie Industriel ENIT • Plateforme Officielle</span>
        </div>
      </motion.div>
    </div>
  );
}
