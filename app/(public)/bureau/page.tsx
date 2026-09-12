"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Search,
  Sparkles,
  FolderGit2,
  Factory,
  GraduationCap,
  Briefcase,
  Megaphone,
  BookOpen,
  Trophy,
  CalendarDays,
  Menu,
  LogOut,
  Loader2,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Phone,
  Calendar,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import Sidebar, { BUREAU_NAV_ITEMS } from "@/components/ui/Sidebar";
import MemberPassportModal from "@/components/admin/MemberPassportModal";
import MemberPoleMultiSelect from "@/components/admin/MemberPoleMultiSelect";
import PostCreatorModal from "@/components/admin/PostCreatorModal";
import ProjectManager from "@/components/admin/ProjectManager";
import VisitesManager from "@/components/admin/VisitesManager";
import FormationsManager from "@/components/admin/FormationsManager";
import OpportunitiesManager from "@/components/admin/OpportunitiesManager";
import ResourcesManager from "@/components/admin/ResourcesManager";
import LeaderboardStats from "@/components/admin/LeaderboardStats";
import AnnouncementFormModal from "@/components/admin/AnnouncementFormModal";
import CalendarManager from "@/components/admin/CalendarManager";
import ContenuTab from "@/components/admin/ContenuTab";
import TestimonialsTab from "@/components/admin/TestimonialsTab";
import FeedbacksTab from "@/components/admin/FeedbacksTab";

import Toast, { ToastMessage } from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export interface MemberRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "membre_bureau" | "membre_actif" | "bureau" | "membre";
  phone?: string | null;
  classe?: string | null;
  statut_membre?: "senior" | "actif" | "alumni" | null;
  statut_membre_verified?: boolean;
  points_total?: number;
  avatar_url?: string | null;
  pole_id?: string | null;
  pole_ids?: string[];
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  photo_urls?: string[];
  category: string;
  date: string;
  location?: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  created_by?: string;
}

export default function BureauPage() {
  const router = useRouter();
  const supabase = createClient();
  const { logoUrl } = useSiteSettings();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("membres");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [poles, setPoles] = useState<Array<{ id: string; name: string; color?: string; icon?: string }>>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Member search & modal
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<MemberRecord | null>(null);

  // Activity modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);

  // Announcement modal
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);

  // Points Modal State
  const [pointsModal, setPointsModal] = useState<{
    isOpen: boolean;
    member: MemberRecord | null;
    amount: string;
    reason: string;
    submitting: boolean;
  }>({
    isOpen: false,
    member: null,
    amount: "10",
    reason: "",
    submitting: false,
  });

  // Toast & Confirm Modal
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: "success" | "error" | "info", message: string) => {
    setToasts((prev) => [...prev, { id: Math.random().toString(36).substring(2, 9), type, message }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [modalConfig, setModalConfig] = useState<any>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Auth Guard
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        const role = profile?.role || user.user_metadata?.role || "membre";

        if (role !== "bureau" && role !== "membre_bureau" && role !== "admin") {
          router.push(role === "admin" ? "/admin" : "/dashboard");
          return;
        }

        setCurrentUser(user);
      } catch {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, [router, supabase]);

  // Fetch Members & Poles
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data: memberData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (memberData) {
        setMembers(memberData);
        setSelectedMemberForDetails((prev) =>
          prev ? memberData.find((m: any) => m.id === prev.id) || null : null
        );
      }

      const { data: polesData } = await supabase
        .from("poles")
        .select("id, name, color, icon")
        .order("name");

      if (polesData) setPoles(polesData);
    } catch {
      // handled silently
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  // Fetch Activities
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      if (res.ok && data.activities) setActivities(data.activities);
    } catch {}
  }, []);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, poles(name)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error && data) setAnnouncements(data);
    } catch {}
  }, [supabase]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchActivities();
      fetchAnnouncements();
    }
  }, [currentUser, fetchData, fetchActivities, fetchAnnouncements]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Member pole update
  const handleChangeMemberPoles = async (member: MemberRecord, newPoleIds: string[]) => {
    try {
      const primaryPoleId = newPoleIds.length > 0 ? newPoleIds[0] : null;
      const res = await fetch("/api/admin/members/pole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: member.id,
          pole_ids: newPoleIds,
          pole_id: primaryPoleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'assignation.");

      addToast("success", `Pôles de ${member.first_name || member.email} mis à jour !`);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? { ...m, pole_ids: newPoleIds, pole_id: primaryPoleId, ...(data.profile ? data.profile : {}) }
            : m
        )
      );
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de l'assignation.");
    }
  };

  // Member status verification
  const handleVerifyMemberStatus = async (member: MemberRecord) => {
    try {
      const res = await fetch("/api/admin/members/verify-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.id, verified: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de validation");

      addToast("success", `Statut de ${member.first_name || member.email} validé !`);
      fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de la validation.");
    }
  };

  // Points Modal handlers
  const handleOpenPointsModal = (member: MemberRecord) => {
    setPointsModal({
      isOpen: true,
      member,
      amount: "10",
      reason: "Participation active au club",
      submitting: false,
    });
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsModal.member) return;
    const parsedAmount = parseInt(pointsModal.amount, 10);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      addToast("error", "Montant de points valide requis.");
      return;
    }
    if (!pointsModal.reason.trim()) {
      addToast("error", "Motif requis.");
      return;
    }

    setPointsModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: pointsModal.member.id,
          amount: parsedAmount,
          reason: pointsModal.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'attribution.");

      addToast("success", `${parsedAmount > 0 ? "+" : ""}${parsedAmount} pts attribués à ${pointsModal.member.first_name || pointsModal.member.email}`);
      setPointsModal((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      addToast("error", err.message);
    } finally {
      setPointsModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Activity Handlers
  const handleToggleActivityStatus = async (act: ActivityRecord) => {
    const newStatus = act.status === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/admin/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: act.id, title: act.title, description: act.description, content: act.content, category: act.category, date: act.date, location: act.location, status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur de modification.");
      addToast("success", `Activité ${newStatus === "published" ? "publiée" : "masquée"}`);
      fetchActivities();
    } catch (err: any) { addToast("error", err.message); }
  };

  const handleDeleteActivity = (act: ActivityRecord) => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer l'activité ?",
      message: `"${act.title}" sera supprimée définitivement.`,
      confirmText: "Supprimer", variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/activities?id=${act.id}`, { method: "DELETE" });
        if (res.ok) { addToast("success", "Supprimée."); fetchActivities(); }
        else addToast("error", "Erreur lors de la suppression.");
      },
    });
  };

  // Announcement Handlers
  const handleDeleteAnnouncement = (id: string) => {
    setModalConfig({
      isOpen: true, title: "Supprimer l'annonce ?",
      message: "L'annonce sera retirée pour tous les membres.",
      confirmText: "Supprimer", variant: "danger",
      onConfirm: async () => {
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (!error) { addToast("success", "Annonce supprimée."); fetchAnnouncements(); }
        else addToast("error", error.message);
      },
    });
  };

  const handleTogglePinAnnouncement = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase.from("announcements").update({ pinned: !currentPinned }).eq("id", id);
    if (!error) { addToast("success", currentPinned ? "Annonce désépinglée." : "Annonce épinglée !"); fetchAnnouncements(); }
  };

  // Filtered members search
  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const query = memberSearch.toLowerCase();
    const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
    return fullName.includes(query) || m.email.toLowerCase().includes(query) || (m.classe && m.classe.toLowerCase().includes(query));
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0d0e0e] flex items-center justify-center text-[#fca311]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e0e] text-white flex flex-col font-sans">
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        onConfirm={() => { modalConfig.onConfirm(); setModalConfig((p: any) => ({ ...p, isOpen: false })); }}
        onCancel={() => setModalConfig((p: any) => ({ ...p, isOpen: false }))}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0d0e0e]/90 backdrop-blur border-b border-[#2a2c2c] px-4 md:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-[#333535] text-white hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#121414] border border-[#fca311]/40 p-1 flex items-center justify-center">
            <img src={logoUrl} alt="CGI ENIT" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black text-white tracking-wide">
              Espace Membre du Bureau
            </h1>
            <p className="text-[10px] text-[#888]">Gestion opérationnelle du Club Génie Industriel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href="/" className="text-xs text-[#888] hover:text-white transition-colors hidden sm:block">
            ← Site public
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeItem={activeTab}
          onSelectTab={(id) => setActiveTab(id)}
          onSignOut={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          items={BUREAU_NAV_ITEMS}
          title="Nav Bureau"
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden space-y-6">

          {/* TAB 1: MEMBRES */}
          {activeTab === "membres" && (
            <div className="space-y-6">
              <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#2a2c2c]">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#fca311]" />
                      <span>Membres & Statuts du Club</span>
                    </h2>
                    <p className="text-xs text-[#888] mt-0.5">
                      Consultez la liste des membres, attribuez des points d'engagement et validez les statuts.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#555] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Rechercher par nom, email, classe..."
                      className="w-full bg-[#0d0e0e] border border-[#2a2c2c] focus:border-[#fca311] rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {loadingData ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#fca311]" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#2a2c2c] text-[#888] uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">Membre</th>
                          <th className="py-3 px-4">Pôles Assignés</th>
                          <th className="py-3 px-4">Statut Membre</th>
                          <th className="py-3 px-4">Classe</th>
                          <th className="py-3 px-4">Points</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2c2c]">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-[#666]">
                              Aucun membre trouvé.
                            </td>
                          </tr>
                        ) : (
                          filteredMembers.map((row) => (
                            <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#1a1c1c] border border-[#2a2c2c] flex items-center justify-center font-bold text-[#fca311] text-xs shrink-0 overflow-hidden">
                                    {row.avatar_url ? (
                                      <img src={row.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{row.first_name ? row.first_name[0] : row.email[0].toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-xs">
                                      {row.first_name || row.last_name ? `${row.first_name || ""} ${row.last_name || ""}` : row.email.split("@")[0]}
                                    </div>
                                    <div className="text-[11px] text-[#888]">{row.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <MemberPoleMultiSelect
                                  memberId={row.id}
                                  assignedPoleIds={row.pole_ids}
                                  fallbackPoleId={row.pole_id}
                                  poles={poles}
                                  onChange={(newPoleIds) => handleChangeMemberPoles(row, newPoleIds)}
                                />
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="capitalize font-semibold text-xs bg-white/5 px-2 py-0.5 rounded border border-[#2a2c2c]">
                                    {row.statut_membre || "actif"}
                                  </span>
                                  {row.statut_membre_verified ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                      <CheckCircle2 className="w-3 h-3" /> Vérifié
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleVerifyMemberStatus(row)}
                                      className="inline-flex items-center gap-1 text-[10px] text-yellow-400 font-semibold bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/20 transition-colors"
                                    >
                                      <Clock className="w-3 h-3" /> Valider
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-[#aaa]">{row.classe || "Non renseignée"}</td>

                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-[#fca311] bg-[#fca311]/10 px-2.5 py-1 rounded-lg border border-[#fca311]/20">
                                  {row.points_total || 0} pts
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenPointsModal(row)}
                                    className="px-2.5 py-1 rounded-lg bg-[#fca311]/10 border border-[#fca311]/30 text-[#fca311] hover:bg-[#fca311]/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <Award className="w-3.5 h-3.5" /> +Pts
                                  </button>
                                  <button
                                    onClick={() => setSelectedMemberForDetails(row)}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-[#2a2c2c] text-white hover:bg-white/10 text-xs font-semibold transition-colors"
                                  >
                                    Passeport
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITES */}
          {activeTab === "activities" && (
            <div className="space-y-6">
              <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2c2c]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#fca311]" />
                    <h2 className="font-bold text-sm">Gestion des Activités du Club</h2>
                  </div>
                  <button
                    onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fca311] hover:bg-[#ffc95e] text-black font-bold text-xs transition-colors shadow-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nouvelle activité
                  </button>
                </div>

                <div className="divide-y divide-[#2a2c2c]">
                  {activities.length === 0 ? (
                    <div className="py-12 text-center text-[#666] text-xs">Aucune activité enregistrée.</div>
                  ) : (
                    activities.map((act) => {
                      const cover = act.photo_urls?.[0] || act.image_url;
                      return (
                        <div key={act.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#1e2020] border border-[#2a2c2c] shrink-0">
                            {cover ? (
                              <img src={cover} alt={act.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#444]"><ImageIcon className="w-5 h-5" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 bg-white/5 font-semibold text-white">
                                {act.category}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${act.status === "published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                                {act.status === "published" ? "Publiée" : "Brouillon"}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-white truncate">{act.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleToggleActivityStatus(act)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#888] hover:text-white transition-colors">
                              {act.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }} className="p-2 rounded-lg bg-white/5 hover:bg-[#fca311]/10 text-[#888] hover:text-[#fca311] transition-colors">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteActivity(act)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-[#888] hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJETS */}
          {activeTab === "projets" && <ProjectManager />}

          {/* TAB 4: VISITES D'ENTREPRISE */}
          {activeTab === "visites" && <VisitesManager onShowToast={addToast} />}

          {/* TAB 5: FORMATIONS */}
          {activeTab === "formations" && <FormationsManager onShowToast={addToast} />}

          {/* TAB 6: OPPORTUNITES */}
          {activeTab === "opportunites" && <OpportunitiesManager onShowToast={addToast} />}

          {/* TAB 7: ANNONCES */}
          {activeTab === "annonces" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#141515] border border-[#2a2c2c] rounded-2xl p-6">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#fca311]" />
                    <span>Annonces & Communication Club</span>
                  </h2>
                  <p className="text-xs text-[#888]">Diffusez des messages officiels aux membres du club.</p>
                </div>
                <button
                  onClick={() => { setEditingAnnouncement(null); setIsAnnouncementModalOpen(true); }}
                  className="px-4 py-2 rounded-xl bg-[#fca311] hover:bg-[#ffc95e] text-black font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Publier une annonce
                </button>
              </div>

              <div className="grid gap-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-[#141515] border border-[#2a2c2c] rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {ann.pinned && <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">📌 Épinglée</span>}
                        <h3 className="font-bold text-sm text-white">{ann.title}</h3>
                      </div>
                      <p className="text-xs text-[#aaa] whitespace-pre-wrap">{ann.content}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleTogglePinAnnouncement(ann.id, ann.pinned)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#888] hover:text-white">
                        📌
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-[#888] hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: RESSOURCES */}
          {activeTab === "ressources" && <ResourcesManager onShowToast={addToast} />}

          {/* TAB 9: STATS & CLASSEMENT */}
          {activeTab === "stats" && <LeaderboardStats onShowToast={addToast} />}

          {/* TAB 10: CALENDRIER */}
          {activeTab === "calendrier" && <CalendarManager />}

          {/* TAB 11: CONTENU DU SITE */}
          {activeTab === "contenu" && <ContenuTab addToast={addToast} />}

          {/* TAB 12: TEMOIGNAGES */}
          {activeTab === "temoignages" && <TestimonialsTab addToast={addToast} />}

          {/* TAB 13: RETOURS & BUGS */}
          {activeTab === "feedbacks" && (
            <FeedbacksTab
              addToast={addToast}
              openConfirmModal={(cfg) => setModalConfig({ ...cfg, isOpen: true })}
            />
          )}

        </main>
      </div>

      {/* Member Passport Detail Modal */}
      {selectedMemberForDetails && (
        <MemberPassportModal
          userId={selectedMemberForDetails.id}
          onClose={() => setSelectedMemberForDetails(null)}
        />
      )}

      {/* Post Creator Modal (Activities) */}
      <PostCreatorModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        editingActivity={editingActivity}
        onSave={async (fd) => {
          const res = await fetch("/api/admin/activities", {
            method: editingActivity ? "PUT" : "POST",
            body: fd,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur de sauvegarde.");
          addToast("success", editingActivity ? "Activité mise à jour !" : "Activité créée !");
          fetchActivities();
        }}
      />

      {/* Announcement Modal */}
      <AnnouncementFormModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        editing={editingAnnouncement}
        poles={poles}
        onSaved={() => {
          fetchAnnouncements();
          addToast("success", "Annonce enregistrée !");
        }}
      />

      {/* Points Modal */}
      {pointsModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141515] border border-[#2a2c2c] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#fca311]" />
              <span>Attribuer des points</span>
            </h3>
            <p className="text-xs text-[#888]">
              Membre : <strong className="text-white">{pointsModal.member?.first_name || pointsModal.member?.email}</strong>
            </p>

            <form onSubmit={handleAwardPoints} className="space-y-4">
              <div>
                <label className="block text-xs text-[#888] mb-1">Nombre de points (+ ou -)</label>
                <input
                  type="number"
                  value={pointsModal.amount}
                  onChange={(e) => setPointsModal((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="ex: 15 ou -5"
                  className="w-full bg-[#0d0e0e] border border-[#2a2c2c] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#fca311]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#888] mb-1">Motif de l'attribution</label>
                <input
                  type="text"
                  value={pointsModal.reason}
                  onChange={(e) => setPointsModal((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="ex: Organisation de l'événement hackathon"
                  className="w-full bg-[#0d0e0e] border border-[#2a2c2c] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#fca311]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPointsModal((p) => ({ ...p, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-white hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pointsModal.submitting}
                  className="px-4 py-2 rounded-xl bg-[#fca311] hover:bg-[#ffc95e] text-black font-bold text-xs flex items-center gap-2"
                >
                  {pointsModal.submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Valider les points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
