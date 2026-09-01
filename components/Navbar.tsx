"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

export default function Navbar() {
  const router = useRouter();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logoUrl } = useSiteSettings();
  const [user, setUser] = useState<any>(null);
  const [dashboardHref, setDashboardHref] = useState<string>("/membre");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardHrefForUser = async (u: any) => {
    if (!u) return "/membre";
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.id)
        .maybeSingle();

      const role = profile?.role || u.user_metadata?.role || "membre_actif";
      if (role === "admin") return "/admin";
      if (role === "bureau" || role === "membre_bureau") return "/bureau";
      return "/membre";
    } catch {
      return "/membre";
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const href = await getDashboardHrefForUser(user);
        setDashboardHref(href);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        const href = await getDashboardHrefForUser(u);
        setDashboardHref(href);
      } else {
        setDashboardHref("/membre");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setDashboardHref("/membre");
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { name: t("nav.home", "Accueil"), href: "/#hero" },
    { name: t("nav.about", "À Propos & Historique"), href: "/#about" },
    { name: t("nav.activities", "Activités du Club"), href: "/#activities" },
    { name: t("nav.roadmaps", "Roadmaps"), href: "/#roadmaps" },
    { name: t("nav.testimonials", "Témoignages"), href: "/#testimonials" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled
          ? "bg-black/90 backdrop-blur-xl border-custom-navy/60 py-3 shadow-2xl"
          : "bg-gradient-to-b from-black/90 via-black/40 to-transparent border-transparent py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden bg-[#121414] border-2 border-custom-amber/40 group-hover:border-custom-amber transition-all duration-300 shadow-[0_0_20px_rgba(252,163,17,0.25)] group-hover:shadow-[0_0_30px_rgba(252,163,17,0.5)] flex-shrink-0"
            >
              <img src={logoUrl} alt="CGI ENIT Logo" className="w-full h-full object-contain p-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-white font-black text-base tracking-wide leading-none group-hover:text-custom-amber transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                CGI ENIT
              </span>
              <span className="text-[10px] font-bold text-custom-amber/90 uppercase tracking-widest mt-1 drop-shadow">
                Génie Industriel
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
              >
                <a
                  href={link.href}
                  className="relative text-custom-gray/70 hover:text-custom-white text-xs font-semibold uppercase tracking-wider transition-colors duration-300 group py-1"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-custom-amber transition-all duration-300 group-hover:w-full" />
                </a>
              </motion.div>
            ))}
          </div>

          {/* Desktop CTA Button */}
          <motion.div
            className="hidden md:flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {user ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-[10px] font-bold text-custom-gray hover:text-red-400 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  {t("nav.logout", "Déconnexion")}
                </button>
                <Link
                  href={dashboardHref}
                  className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-custom-amber text-custom-black font-bold text-xs tracking-wider uppercase overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_20px_rgba(252,163,17,0.15)] hover:shadow-[0_0_25px_rgba(252,163,17,0.35)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>{t("nav.dashboard", "Mon Dashboard")}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-custom-amber text-custom-black font-bold text-xs tracking-wider uppercase overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_20px_rgba(252,163,17,0.15)] hover:shadow-[0_0_25px_rgba(252,163,17,0.35)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>{t("nav.portal_login", "Connexion Portal")}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="text-custom-gray hover:text-custom-amber transition-colors p-2"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed inset-x-0 top-[65px] bg-black/95 backdrop-blur-xl border-b border-custom-navy/60 overflow-hidden z-45"
          >
            <div className="px-6 py-8 space-y-4 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-custom-gray/80 hover:text-custom-amber text-sm font-semibold py-2 transition-colors uppercase tracking-wider border-b border-custom-navy/20"
                >
                  {link.name}
                </a>
              ))}

              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-custom-amber text-custom-black font-bold text-sm tracking-wider uppercase hover:bg-custom-amber/90 transition-colors mt-4"
                  >
                    <span>{t("nav.dashboard", "Mon Dashboard")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full mt-2 text-xs font-bold text-custom-gray hover:text-red-400 py-3 uppercase tracking-wider text-center transition-colors"
                  >
                    {t("nav.logout", "Déconnexion")}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-4">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-custom-amber text-custom-black font-bold text-sm tracking-wider uppercase hover:bg-custom-amber/90 transition-colors"
                  >
                    <span>{t("nav.portal_login", "Connexion Portal")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
