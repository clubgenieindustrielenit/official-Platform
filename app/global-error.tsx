"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-black text-white antialiased min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>Erreur Critique Système</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Interruption globale de service
          </h1>

          <p className="text-sm text-neutral-400">
            Une erreur critique est survenue au niveau du serveur. Veuillez recharger la page ou revenir à l'accueil.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#fca311] text-black font-extrabold text-sm hover:bg-[#fca311]/90 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold text-sm hover:bg-neutral-800 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
