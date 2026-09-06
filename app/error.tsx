"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCw, Home, AlertOctagon, Terminal } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Platform Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-custom-gray flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[150px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-custom-navy/30 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-xl w-full text-center relative z-10 space-y-8 py-12"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
          <span>Incident Système Détecté</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Une anomalie temporaire est survenue
          </h1>
          <p className="text-sm sm:text-base text-custom-gray/70 max-w-md mx-auto leading-relaxed">
            Le système a rencontré une interruption imprévue lors du traitement de votre demande. Nos mécanismes de sécurité ont isolé l'incident.
          </p>
        </div>

        {/* Diagnostic box if digest available */}
        {error.digest && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-custom-navy/60 border border-custom-gray/10 text-xs font-mono text-custom-gray/60">
            <Terminal className="w-3.5 h-3.5 text-custom-amber" />
            <span>Code incident : {error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-custom-amber text-custom-black font-extrabold text-sm tracking-wide transition-all duration-300 hover:bg-custom-amber/90 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_20px_rgba(252,163,17,0.25)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer la requête</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-custom-gray/20 hover:border-custom-amber/40 bg-custom-navy/40 text-custom-white font-bold text-sm tracking-wide transition-all duration-300 hover:bg-custom-navy/80 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        {/* Footer note */}
        <div className="pt-8 border-t border-custom-navy/40 flex items-center justify-center gap-2 text-xs text-custom-gray/40">
          <span>Club Génie Industriel ENIT • Monitoring & Résilience Système</span>
        </div>
      </motion.div>
    </div>
  );
}
