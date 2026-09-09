"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  ArrowRight, 
  Home, 
  Info, 
  Activity, 
  Compass, 
  MessageSquare,
  Linkedin,
  Instagram,
  Facebook,
  Mail,
  LogOut,
  Zap,
  CalendarDays,
  Factory,
  GraduationCap,
  Cog,
  Megaphone,
  CalendarRange,
  BookOpen,
  Briefcase,
  Edit3,
  Shield,
  ChevronDown,
  Globe
} from "lucide-react";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { getRoleLabel } from "@/lib/types/roles";
import EditProfileModal, { ProfileData } from "@/components/membre/EditProfileModal";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logoUrl } = useSiteSettings();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("Membre");
  const [dashboardHref, setDashboardHref] = useState<string>("/membre");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showPublicLinks, setShowPublicLinks] = useState(false);

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

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchUserData = async (u: any) => {
    if (!u) {
      setProfile(null);
      setUserRole("Membre");
      setDashboardHref("/membre");
      return;
    }
    try {
      const supabase = createClient();
      const { data: prof } = await supabase
        .from("profiles")
        .select("*, poles(*)")
        .eq("id", u.id)
        .maybeSingle();

      setProfile(prof || null);

      const role = prof?.role || u.user_metadata?.role || "membre_actif";
      let roleName = getRoleLabel(role, prof?.statut_membre);
      let href = "/membre";

      if (role === "admin") {
        href = "/admin";
      } else if (role === "bureau" || role === "membre_bureau") {
        href = "/bureau";
      }
      setDashboardHref(href);
      setUserRole(roleName);
    } catch {
      setDashboardHref("/membre");
      setUserRole("Membre");
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        await fetchUserData(u);
      } else {
        setProfile(null);
        setDashboardHref("/membre");
        setUserRole("Membre");
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
    setProfile(null);
    setDashboardHref("/membre");
    setIsOpen(false);
    router.push('/');
    router.refresh();
  };

  const publicNavLinks = [
    { name: t("nav.home", "Accueil"), href: "/#hero", icon: <Home className="w-4 h-4" /> },
    { name: t("nav.about", "À Propos & Historique"), href: "/#about", icon: <Info className="w-4 h-4" /> },
    { name: t("nav.activities", "Activités du Club"), href: "/#activities", icon: <Activity className="w-4 h-4" /> },
    { name: t("nav.roadmaps", "Roadmaps"), href: "/#roadmaps", icon: <Compass className="w-4 h-4" /> },
    { name: t("nav.testimonials", "Témoignages"), href: "/#testimonials", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const memberNavLinks = [
    { href: "/membre", label: "Dashboard", icon: Zap },
    { href: "/membre/annonces", label: "Annonces", icon: Megaphone },
    { href: "/membre/evenements", label: "Événements", icon: CalendarDays },
    { href: "/membre/visites", label: "Visites Industrielles", icon: Factory },
    { href: "/membre/formations", label: "Formations", icon: GraduationCap },
    { href: "/membre/projets", label: "Projets", icon: Cog },
    { href: "/membre/opportunites", label: "Stages & Opportunités", icon: Briefcase },
    { href: "/membre/ressources", label: "Ressources & Supports", icon: BookOpen },
    { href: "/membre/calendrier", label: "Calendrier", icon: CalendarRange },
  ];

  // Format Pole Display
  const poleLabel = profile?.poles?.name 
    ? (profile.poles.name.toLowerCase().startsWith("pôle") ? profile.poles.name : `Pôle ${profile.poles.name}`)
    : "Génie Industriel";

  const memberFullName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "Membre";

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : memberFullName.substring(0, 2).toUpperCase();

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled
            ? "bg-black/90 backdrop-blur-xl border-custom-navy/60 py-3 shadow-2xl"
            : "bg-gradient-to-b from-black/90 via-black/40 to-transparent border-transparent py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-[#121414] border-2 border-custom-amber/40 group-hover:border-custom-amber transition-all duration-300 shadow-[0_0_20px_rgba(252,163,17,0.25)] group-hover:shadow-[0_0_30px_rgba(252,163,17,0.5)] flex-shrink-0"
              >
                <img src={logoUrl} alt="CGI ENIT Logo" className="w-full h-full object-contain p-1 sm:p-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-white font-black text-sm sm:text-base tracking-wide leading-none group-hover:text-custom-amber transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  CGI ENIT
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-custom-amber/90 uppercase tracking-widest mt-0.5 sm:mt-1 drop-shadow">
                  Génie Industriel
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {publicNavLinks.map((link, index) => (
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
                    className="text-[10px] font-bold text-custom-gray hover:text-red-400 transition-colors uppercase tracking-wider cursor-pointer px-2 py-1"
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

            {/* Mobile Menu Trigger Button */}
            <div className="md:hidden flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-xl bg-custom-navy/60 border border-custom-gray/10 flex items-center justify-center text-custom-gray hover:text-custom-amber hover:border-custom-amber/40 transition-colors"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="w-5 h-5 text-custom-amber" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Slide-over Drawer & Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-[88%] max-w-sm bg-gradient-to-b from-[#0e1117] via-[#0b0d13] to-black border-l border-custom-navy/80 shadow-2xl z-50 flex flex-col justify-between overflow-hidden md:hidden"
            >
              {/* Drawer Top Bar */}
              <div className="p-5 pb-3 border-b border-custom-navy/50 flex items-center justify-between shrink-0 bg-[#121417]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black border border-custom-amber/40 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(252,163,17,0.15)]">
                    <img src={logoUrl} alt="CGI ENIT" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm leading-tight tracking-wide">CGI ENIT</h3>
                    <p className="text-[10px] text-custom-amber font-mono font-bold uppercase">
                      {user ? "Espace Membre" : "Navigation Mobile"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-custom-navy/60 border border-custom-gray/10 flex items-center justify-center text-custom-gray hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Middle Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* 1. IF LOGGED IN: MEMBER PROFILE CARD (MATCHING PIC 1) */}
                {user && (
                  <div className="p-3.5 rounded-2xl bg-[#14171e] border border-custom-navy/80 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-black border-2 border-custom-amber/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(252,163,17,0.2)]">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={memberFullName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="font-extrabold text-sm text-custom-amber">
                              {initials}
                            </span>
                          )}
                        </div>
                        {/* Name & Pole */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-white truncate leading-snug">
                            {memberFullName}
                          </p>
                          <p className="text-[11px] text-custom-gray/60 font-medium truncate">
                            {poleLabel}
                          </p>
                        </div>
                      </div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors shrink-0"
                        title="Déconnexion"
                        aria-label="Déconnexion"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Edit Profile Button (Action demanded by user) */}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-custom-navy/80 hover:bg-custom-navy text-custom-amber text-xs font-bold border border-custom-amber/30 hover:border-custom-amber transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Éditer mon profil</span>
                    </button>
                  </div>
                )}

                {/* 2. NAVIGATION LIST */}
                {user ? (
                  // MEMBER NAVIGATION (MATCHING PIC 1 EXACTLY)
                  <div className="space-y-1">
                    <div className="px-2 pt-1 pb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-custom-gray/50">
                      <span>Menu Membre</span>
                      <span className="font-mono text-custom-amber">{userRole}</span>
                    </div>

                    {memberNavLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== "/membre" && pathname?.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                            isActive
                              ? "bg-[#fca311] text-black shadow-lg shadow-[#fca311]/20 scale-[1.01]"
                              : "text-[#a0a0a0] hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive ? "text-black scale-105" : "text-[#777]"
                            }`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                          )}
                        </Link>
                      );
                    })}

                    {/* Admin/Bureau link if applicable */}
                    {(userRole === "Admin" || userRole === "Bureau") && (
                      <Link
                        href={dashboardHref}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-custom-amber bg-custom-amber/10 border border-custom-amber/30 hover:bg-custom-amber/20 transition-all mt-2"
                      >
                        <Shield className="w-4 h-4 shrink-0" />
                        <span className="flex-1">Espace {userRole}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Collapsible Public Navigation for members */}
                    <div className="pt-3 border-t border-custom-navy/40 mt-3">
                      <button
                        onClick={() => setShowPublicLinks(!showPublicLinks)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-custom-gray/60 hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-custom-amber/60" />
                          <span>Navigation Site Public</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPublicLinks ? "rotate-180 text-custom-amber" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {showPublicLinks && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-1 pt-1 pl-2"
                          >
                            {publicNavLinks.map((link) => (
                              <a
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-custom-gray/70 hover:text-custom-amber hover:bg-white/[0.04] transition-colors"
                              >
                                {link.icon}
                                <span>{link.name}</span>
                              </a>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  // PUBLIC NAVIGATION (WHEN NOT LOGGED IN)
                  <div className="space-y-1">
                    <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-custom-gray/50">
                      <span>Menu Principal</span>
                    </div>

                    {publicNavLinks.map((link, i) => (
                      <motion.a
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 + 0.05 }}
                        className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-custom-gray/80 hover:text-custom-amber hover:bg-custom-navy/50 text-xs font-bold tracking-wide transition-all duration-200 group"
                      >
                        <span className="text-custom-gray/40 group-hover:text-custom-amber transition-colors">
                          {link.icon}
                        </span>
                        <span className="flex-1">{link.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-custom-amber" />
                      </motion.a>
                    ))}

                    <div className="pt-4">
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-custom-amber text-custom-black font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(252,163,17,0.25)] hover:bg-custom-amber/90 transition-all"
                      >
                        <span>{t("nav.portal_login", "Connexion Portal")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer with Social Links */}
              <div className="p-4 border-t border-custom-navy/50 bg-[#0d0e12] shrink-0 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  {[
                    { icon: <Linkedin className="w-3.5 h-3.5" />, href: "https://www.linkedin.com/company/club-g%C3%A9nie-industriel-enit/?viewAsMember=true", label: "LinkedIn" },
                    { icon: <Instagram className="w-3.5 h-3.5" />, href: "https://www.instagram.com/club.genieindustriel.enit?fbclid=IwY2xjawUJbqlwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMXZFQ3Yxdzg4amt5c0syTmhzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe5_pGM4k0_z8UfZjuZ5Zo1XfXP1lCY4GjzsizFfBSXj00qJrnDXk2BQBykB4_aem_jwpEJZ3i_k_i-zZE7-4rxQ", label: "Instagram" },
                    { icon: <Facebook className="w-3.5 h-3.5" />, href: "https://www.facebook.com/ClubGIEnit", label: "Facebook" },
                    { icon: <Mail className="w-3.5 h-3.5" />, href: "mailto:clubgenieindustrielenit@gmail.com", label: "Email" },
                  ].map((s, idx) => (
                    <a
                      key={idx}
                      href={s.href}
                      target={s.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={s.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      aria-label={s.label}
                      className="w-8 h-8 rounded-xl bg-custom-navy/60 border border-custom-gray/10 flex items-center justify-center text-custom-gray hover:text-custom-amber hover:border-custom-amber/30 transition-colors"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>

                <p className="text-[10px] text-center text-custom-gray/40">
                  &copy; {new Date().getFullYear()} Club Génie Industriel ENIT
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal on Mobile & Desktop */}
      {profile && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profile={profile}
          onProfileUpdated={async () => {
            if (user) await fetchUserData(user);
            router.refresh();
          }}
        />
      )}
    </>
  );
}


