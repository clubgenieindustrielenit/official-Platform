"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const { logoUrl } = useSiteSettings();
  
  const router = useRouter();
  const supabase = createClient();

  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || cooldown > 0) return;
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(false);

    try {
      const res = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 || data.error?.toLowerCase()?.includes("rate limit")) {
          setCooldown(60);
          throw new Error(
            "Un email de réinitialisation vous a déjà été envoyé très récemment. Veuillez vérifier votre boîte de réception (et spams) ou patienter une minute avant de réessayer."
          );
        }
        throw new Error(data.error || "Impossible d'envoyer l'email de réinitialisation.");
      }

      setForgotSuccess(true);
      setCooldown(60);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
        setCooldown(60);
        setForgotError(
          "Un email de réinitialisation vous a déjà été envoyé récemment. Veuillez vérifier votre boîte de réception (et spams) ou patienter 60 secondes avant de réessayer."
        );
      } else {
        setForgotError(msg || "Impossible d'envoyer l'email de réinitialisation.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const redirectUserByRole = async (user: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || "membre_actif";

    if (role === "admin") {
      router.replace("/admin");
    } else if (role === "membre_bureau" || role === "bureau") {
      router.replace("/bureau");
    } else {
      router.replace("/membre");
    }
  };

  React.useEffect(() => {
    const checkExistingUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await redirectUserByRole(user);
      }
    };
    checkExistingUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error("Utilisateur introuvable.");

      router.refresh();
      await redirectUserByRole(data.user);

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12 relative overflow-hidden transition-colors duration-200">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-custom-navy/20 via-transparent to-transparent z-0 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-custom-amber/5 blur-[100px] z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-muted hover:text-custom-amber text-xs font-semibold uppercase tracking-wider mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{t("common.back", "Retour au site")}</span>
        </Link>

        {/* Form Container */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-surface-border mb-6 shadow-[0_0_15px_rgba(252,163,17,0.1)] bg-surface-input flex items-center justify-center">
              <img src={logoUrl} alt="CGI ENIT" className="w-full h-full object-contain p-1.5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("login.title", "Club Génie Industriel ENIT")}
            </h1>
            <p className="text-muted text-sm">
              {t("login.subtitle", "Connectez-vous à votre espace")}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                {t("login.email", "Email")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-muted group-focus-within:text-custom-amber transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.email_placeholder", "prenom.nom@enit.utm.tn")}
                  className="w-full bg-surface-input border border-surface-border focus:border-custom-amber rounded-xl py-3.5 pl-11 pr-4 text-foreground text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-muted"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {t("login.password", "Mot de passe")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                    setForgotSuccess(false);
                    setForgotError(null);
                  }}
                  className="text-xs text-custom-amber hover:underline font-medium cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-muted group-focus-within:text-custom-amber transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-input border border-surface-border focus:border-custom-amber rounded-xl py-3.5 pl-11 pr-12 text-foreground text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full mt-4 bg-[#fca311] hover:bg-[#ffc887] text-black font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-[0_0_20px_rgba(252,163,17,0.2)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{t("login.submit", "Se connecter")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
          
          <div className="mt-6 text-center pt-4 border-t border-surface-border space-y-2">
            <p className="text-[11px] text-muted/70">
              {t("login.help_text", "Problème de connexion ?")}{" "}
              {t("login.contact_admin", "Contactez l'administrateur du système.")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-muted hover:text-foreground text-xl cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-custom-amber/10 border border-custom-amber/30 rounded-2xl text-custom-amber">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Mot de passe oublié ?</h3>
                  <p className="text-xs text-muted">Saisissez votre email pour recevoir le lien de réinitialisation.</p>
                </div>
              </div>

              {forgotSuccess ? (
                <div className="space-y-4 my-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-200">Email envoyé avec succès !</p>
                      <p className="mt-1 text-[#bbb]">
                        Un lien de réinitialisation a été envoyé à <strong>{forgotEmail}</strong>. Veuillez consulter votre boîte mail (et vos spams).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full bg-surface-input hover:bg-surface-border text-foreground font-semibold py-3 rounded-xl transition-colors text-sm cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendResetEmail} className="space-y-4 mt-4">
                  {forgotError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Adresse Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-muted group-focus-within:text-custom-amber transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="prenom.nom@enit.utm.tn"
                        className="w-full bg-surface-input border border-surface-border focus:border-custom-amber rounded-xl py-3 pl-11 pr-4 text-foreground text-sm outline-none transition-all duration-300 placeholder-muted"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="w-1/3 bg-surface-input hover:bg-surface-border text-muted hover:text-foreground font-semibold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || cooldown > 0}
                      className="w-2/3 bg-custom-amber hover:bg-[#ffc887] text-black font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(252,163,17,0.2)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {forgotLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : cooldown > 0 ? (
                        <span>Patienter ({cooldown}s)</span>
                      ) : (
                        <>
                          <span>Envoyer le lien</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
