"use client";

import React from "react";
import {
  Mail,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Image,
  Sparkles,
  FolderGit2,
  X,
  Factory,
  BookOpen,
  Trophy,
  GraduationCap,
  Briefcase,
  Megaphone,
  CalendarDays,
  Handshake,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isComingSoon?: boolean;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "invitations", label: "Invitations", icon: Mail },
  { id: "membres", label: "Membres & Statuts", icon: Users },
  { id: "annuaire", label: "Annuaire du Club", icon: FileText },
  { id: "stats", label: "Stats & Classement", icon: Trophy },
  { id: "visites", label: "Visites d'Entreprise", icon: Factory },
  { id: "ressources", label: "Ressources Club", icon: BookOpen },
  { id: "projets", label: "Gestion des Projets", icon: FolderGit2 },
  { id: "formations", label: "Gestion des Formations", icon: GraduationCap },
  { id: "opportunites", label: "Opportunités & Stages", icon: Briefcase },
  { id: "activities", label: "Activités du Club", icon: Sparkles },
  { id: "annonces", label: "Annonces & Posts", icon: Megaphone },
  { id: "temoignages", label: "Témoignages", icon: MessageSquare },
  { id: "calendrier", label: "Calendrier", icon: CalendarDays },
  { id: "partenaires", label: "Partenaires & Logos", icon: Handshake },
  { id: "contenu", label: "Contenu du Site", icon: FileText },
  { id: "hero", label: "Hero Carousel", icon: Image },
  { id: "parametres", label: "Logo & Marque", icon: Settings },
];

export const BUREAU_NAV_ITEMS: NavItem[] = [
  { id: "membres", label: "Membres & Statuts", icon: Users },
  { id: "activities", label: "Activités du Club", icon: Sparkles },
  { id: "projets", label: "Gestion des Projets", icon: FolderGit2 },
  { id: "visites", label: "Visites d'Entreprise", icon: Factory },
  { id: "formations", label: "Gestion des Formations", icon: GraduationCap },
  { id: "opportunites", label: "Opportunités & Stages", icon: Briefcase },
  { id: "annonces", label: "Annonces & Posts", icon: Megaphone },
  { id: "ressources", label: "Ressources Club", icon: BookOpen },
  { id: "stats", label: "Stats & Classement", icon: Trophy },
  { id: "calendrier", label: "Calendrier", icon: CalendarDays },
  { id: "contenu", label: "Contenu du Site", icon: FileText },
  { id: "temoignages", label: "Témoignages", icon: MessageSquare },
];

interface SidebarProps {
  activeItem: string;
  onSelectTab: (id: string) => void;
  onSignOut: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  items?: NavItem[];
  title?: string;
}

export default function Sidebar({
  activeItem,
  onSelectTab,
  onSignOut,
  isOpen = false,
  onClose,
  items = ADMIN_NAV_ITEMS,
  title = "CGI ENIT Admin",
}: SidebarProps) {
  const { logoUrl } = useSiteSettings();

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 1. FIXED TOP HEADER (LOGO + CLUB INFO) */}
      <div className="shrink-0 pb-3 mb-2 border-b border-[#2a2c2c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/90 border border-custom-amber/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(252,163,17,0.15)]">
              <img
                src={logoUrl}
                alt="Club Génie Industriel ENIT"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-sm font-mono tracking-wide flex items-center gap-1.5">
                <span>CGI ENIT</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-custom-amber/15 text-custom-amber border border-custom-amber/30 rounded font-sans uppercase font-bold">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-[#777] truncate">Génie Industriel ENIT</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 text-[#888] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="pt-3 px-1 text-[10px] font-bold uppercase tracking-wider text-[#666] flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[9px] font-mono text-[#555]">{items.length} rubriques</span>
        </div>
      </div>

      {/* 2. DYNAMIC SCROLLABLE NAVIGATION LIST */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 pr-1 custom-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelectTab(item.id);
                if (isMobile && onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group cursor-pointer relative ${
                isActive
                  ? "bg-custom-amber/15 text-custom-amber font-bold border border-custom-amber/35 shadow-[0_0_15px_rgba(252,163,17,0.12)]"
                  : "text-[#a0a0a0] hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-custom-amber" : "text-[#777] group-hover:text-white"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-custom-amber shadow-[0_0_8px_#fca311] shrink-0" />
              )}

              {item.isComingSoon && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#888] font-normal shrink-0">
                  Bientôt
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 3. FIXED BOTTOM LOGOUT SECTION */}
      <div className="pt-3 border-t border-[#2a2c2c] mt-2 shrink-0">
        <button
          onClick={() => {
            onSignOut();
            if (isMobile && onClose) onClose();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-red-400 hover:bg-red-500/15 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all cursor-pointer group"
        >
          <LogOut className="w-4 h-4 text-red-400 transition-transform group-hover:-translate-x-1" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (md et +) - Fixed height, sticky top, smooth inner scroll */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[#1a1c1c] border-r border-[#2a2c2c] h-screen sticky top-0 p-4 shrink-0 overflow-hidden z-30 shadow-lg">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer (< md) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#1a1c1c] border-r border-[#2a2c2c] p-4 flex flex-col z-50 md:hidden shadow-2xl overflow-hidden"
            >
              {renderContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
