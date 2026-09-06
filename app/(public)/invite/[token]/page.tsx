"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, Clock, XCircle, ArrowRight, Loader2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RoleBadge from "@/components/ui/RoleBadge";
import PreinscriptionForm from "@/components/membre/PreinscriptionForm";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [statusState, setStatusState] = useState<"valid" | "expired" | "invalid">("valid");
  
  // Step management: 'account' -> 'preinscription'
  const [step, setStep] = useState<"account" | "preinscription">("account");
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const effectiveRole = useMemo(() => {
    return (urlRole || invitation?.role || "membre_actif").toLowerCase();
  }, [urlRole, invitation?.role]);

  const roleDetails = useMemo(() => {
    if (effectiveRole.includes("bureau")) {
      return { label: "Membre du Bureau", color: "text-[#fca311]", statut: "actif" as const };
    }
    if (effectiveRole.includes("senior")) {
      return { label: "Membre Senior", color: "text-amber-400", statut: "senior" as const };
    }
    if (effectiveRole.includes("alumni")) {
      return { label: "Alumni • Réseau Diplômé", color: "text-purple-400", statut: "alumni" as const };
    }
    return { label: "Membre Actif", color: "text-sky-400", statut: "actif" as const };
  }, [effectiveRole]);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("token", token)
          .single();

        if (error || !data) {
          setStatusState("invalid");
          setLoading(false);
          return;
        }

        const now = new Date();
        const expiresAt = new Date(data.expires_at);

        if (data.status === "cancelled" || data.status === "accepted") {
          setStatusState("invalid");
        } else if (data.status === "expired" || expiresAt < now) {
          setStatusState("expired");
        } else {
          setInvitation(data);
          setStatusState("valid");
        }
      } catch (err) {
        setStatusState("invalid");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchInvitation();
    }
  }, [token, supabase]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      setUserFirstName(firstName);
      setUserLastName(lastName);

      // 1. Activate account via server-side API
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errorMsg =
          (data && typeof data.error === "string" && data.error) ||
          "Une erreur est survenue lors de l'activation de votre compte.";
        setError(errorMsg);
        return;
      }

      setCreatedUserId(data.userId);

      // 2. Sign in to create active Supabase session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInError) {
        console.warn("Sign-in warning:", signInError);
      }

      // 3. Transition to Preinscription Step
      setStep("preinscription");
    } catch (err: any) {
      const displayMsg =
        typeof err?.message === "string"
          ? err.message
          : "Erreur de connexion. Veuillez réessayer.";
      setError(displayMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-custom-amber animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-custom-navy/20 via-black to-black pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-custom-amber/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 flex justify-center">
        <AnimatePresence mode="wait">
          {statusState === "valid" && invitation && step === "account" && (
            <motion.div
              key="step-account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg"
            >
              <div className="bg-[#14213d]/90 border border-[#333535] rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-custom-amber/10 border border-custom-amber/30 text-custom-amber mb-4 shadow-[0_0_20px_rgba(252,163,17,0.15)]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Vous avez été invité au Club Génie Industriel ENIT ✨
                  </h1>
                  <div className="mt-3 flex justify-center">
                    <RoleBadge role={effectiveRole} />
                  </div>
                  <p className="text-sm text-[#a0a0a0] mt-3">
                    Votre invitation vous donne accès en tant que{" "}
                    <span className={`font-semibold ${roleDetails.color}`}>
                      {roleDetails.label}
                    </span>{" "}
                    ({invitation.email})
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAccept} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                      Nom complet
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-[#555] group-focus-within:text-custom-amber transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Prénom Nom"
                        className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3.5 pl-11 pr-4 text-[#e2e2e2] text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-[#555]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                      Mot de passe
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-[#555] group-focus-within:text-custom-amber transition-colors" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        minLength={6}
                        className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3.5 pl-11 pr-12 text-[#e2e2e2] text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-[#555]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#555] hover:text-[#fff] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-[#555] group-focus-within:text-custom-amber transition-colors" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        minLength={6}
                        className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-3.5 pl-11 pr-12 text-[#e2e2e2] text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(252,163,17,0.15)] placeholder-[#555]"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    type="submit"
                    className="w-full mt-6 bg-[#fca311] hover:bg-[#ffc887] text-black font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-[0_0_20px_rgba(252,163,17,0.2)]"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Continuer vers mon profil</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: Formulaire de préinscription */}
          {statusState === "valid" && invitation && step === "preinscription" && createdUserId && (
            <motion.div
              key="step-preinscription"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <PreinscriptionForm
                userId={createdUserId}
                initialEmail={invitation.email}
                initialFirstName={userFirstName}
                initialLastName={userLastName}
                initialStatutMembre={roleDetails.statut}
                onSuccess={() => {
                  const targetRoute = effectiveRole.includes("bureau") ? "/bureau" : "/membre";
                  router.push(targetRoute);
                }}
              />
            </motion.div>
          )}

          {statusState === "expired" && (
            <motion.div
              key="expired"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#14213d]/90 border border-[#333535] rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl max-w-lg w-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-custom-amber/10 border border-custom-amber/30 text-custom-amber mx-auto flex items-center justify-center mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Cette invitation a expiré</h1>
              <p className="text-sm text-[#a0a0a0] mb-8 leading-relaxed">
                La durée de validité est passée. Contactez un membre du bureau pour recevoir une nouvelle invitation.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-custom-amber text-black font-bold text-sm hover:bg-[#ffc887] transition-colors"
              >
                Retour au site
              </Link>
            </motion.div>
          )}

          {statusState === "invalid" && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#14213d]/90 border border-[#333535] rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl max-w-lg w-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 mx-auto flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Invitation non trouvée</h1>
              <p className="text-sm text-[#a0a0a0] mb-8 leading-relaxed">
                Ce lien n'existe pas ou a déjà été utilisé / annulé.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-custom-amber text-black font-bold text-sm hover:bg-[#ffc887] transition-colors"
              >
                Retour au site
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
