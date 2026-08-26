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
  { id: "stats", label: "Stats & Classement", icon: Trophy },
  { id: "visites", label: "Visites d'Entreprise", icon: Factory },
  { id: "ressources", label: "Ressources Club", icon: BookOpen },
  { id: "projets", label: "Gestion des Projets", icon: FolderGit2 },
  { id: "formations", label: "Gestion des Formations", icon: GraduationCap },
  { id: "opportunites", label: "Opportunités & Stages", icon: Briefcase },
  { id: "activities", label: "Activités du Club", icon: Sparkles },
  { id: "annonces", label: "Annonces & Posts", icon: Megaphone },
  { id: "calendrier", label: "Calendrier", icon: CalendarDays },
  { id: "hero", label: "Hero Carousel", icon: Image },
  { id: "parametres", label: "Logo & Marque", icon: Settings },
];

interface SidebarProps {
  activeItem: string;
  onSelectTab: (id: string) => void;
  onSignOut: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeItem,
  onSelectTab,
  onSignOut,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const { logoUrl } = useSiteSettings();

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between min-h-[calc(100vh-65px)] md:min-h-0">
      <div className="space-y-1">
        {isMobile && (
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2a2c2c]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#121414] border border-custom-amber/40 p-1 flex items-center justify-center">
                <img src={logoUrl} alt="CGI ENIT" className="w-full h-full object-contain" />
              </div>
              <span className="text-white font-bold text-sm font-mono tracking-wide">
                CGI ENIT Admin
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#888] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">
          Navigation Admin
        </div>

        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (isMobile && onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? "bg-custom-amber/15 text-custom-amber font-semibold border border-custom-amber/30 shadow-[0_0_15px_rgba(252,163,17,0.1)]"
                  : "text-[#a0a0a0] hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-custom-amber" : "text-[#777] group-hover:text-white"}`} />
                <span>{item.label}</span>
              </div>
              {item.isComingSoon && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#888] font-normal">
                  Bientôt
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-[#2a2c2c] mt-auto">
        <button
          onClick={() => {
            onSignOut();
            if (isMobile && onClose) onClose();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (md et +) */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[#1a1c1c] border-r border-[#2a2c2c] min-h-[calc(100vh-65px)] p-4 justify-between shrink-0 sticky top-0 h-screen">
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
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#1a1c1c] border-r border-[#2a2c2c] p-4 flex flex-col justify-between z-50 md:hidden overflow-y-auto shadow-2xl"
            >
              {renderContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
