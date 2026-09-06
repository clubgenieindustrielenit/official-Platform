"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  RotateCw,
  Trash2,
  Send,
  Loader2,
  Search,
  Bell,
  LogOut,
  Wrench,
  Download,
  Filter,
  UserPlus,
  Copy,
  Check,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Upload,
  Plus,
  Sparkles,
  Eye,
  GripVertical,
  Calendar,
  MapPin,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Award,
  ExternalLink,
  Shield,
  Phone,
  GraduationCap,
  MoreHorizontal,
  User,
  CalendarDays,
  Layers,
  Briefcase,
  Factory,
  FolderGit2,
  BookOpen,
  Trophy,
  Megaphone,
  Pin,
  Handshake,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/utils/imageCompressor";
import ProjectManager from "@/components/admin/ProjectManager";
import PostCreatorModal from "@/components/admin/PostCreatorModal";
import VisitesManager from "@/components/admin/VisitesManager";
import FormationsManager from "@/components/admin/FormationsManager";
import OpportunitiesManager from "@/components/admin/OpportunitiesManager";
import MemberPassportModal from "@/components/admin/MemberPassportModal";
import ResourcesManager from "@/components/admin/ResourcesManager";
import LeaderboardStats from "@/components/admin/LeaderboardStats";
import AnnouncementFormModal from "@/components/admin/AnnouncementFormModal";
import CalendarManager from "@/components/admin/CalendarManager";
import MemberPoleMultiSelect from "@/components/admin/MemberPoleMultiSelect";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import AnnuaireManager from "@/components/admin/AnnuaireManager";
import PartnersManager from "@/components/admin/PartnersManager";

import Toast, { ToastMessage } from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Sidebar from "@/components/ui/Sidebar";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export interface InvitationRecord {
  id: string;
  email: string;
  role: "membre_actif" | "membre_bureau";
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  created_at: string;
  accepted_at?: string | null;
}

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
  pole_id?: string | null;
  pole_ids?: string[] | null;
  year?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  cv_url?: string | null;
  prepa_section?: string | null;
  prepa_etablissement?: string | null;
  rang_concours?: number | null;
  bio?: string | null;
  annee_concours?: string | null;
  training_availability?: string | null;
  profile_completed_at?: string | null;
  is_active?: boolean;
  created_at: string;
  joined_at?: string;
}

export interface HeroImageRecord {
  id: string;
  image_url: string;
  display_order: number;
  created_at: string;
  uploaded_by?: string;
}

export interface ActivityRecord {
  id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  photo_urls?: string[];
  category: "Workshop" | "Hackathon" | "Visite" | "Formation" | "Conférence" | "Autre";
  date: string;
  location?: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  created_by?: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("invitations");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data states
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImageRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingHeroImages, setLoadingHeroImages] = useState(false);
  const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<MemberRecord | null>(null);
  const [selectedMemberForPassport, setSelectedMemberForPassport] = useState<string | null>(null);
  const [polesMap, setPolesMap] = useState<Record<string, string>>({});

  // Club Activities Management states
  const [adminActivities, setAdminActivities] = useState<ActivityRecord[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("Toutes");

  // Activity Form Modal States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [poles, setPoles] = useState<{ id: string; name: string }[]>([]);

  // Hero carousel upload & preview states
  const [uploadingHero, setUploadingHero] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Logo management state
  const { logoUrl, setLogoUrl } = useSiteSettings();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);

  const handleLogoUpload = async () => {
    if (!pendingLogoFile) return;
    
    if (!pendingLogoFile.type.startsWith("image/")) {
      addToast("error", "Veuillez sélectionner un fichier image valide.");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingLogoFile);

      const res = await fetch("/api/admin/settings/logo", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Échec de l'envoi du logo");

      setLogoUrl(result.url);
      setPendingLogoFile(null);
      setPreviewLogoUrl(null);
      addToast("success", "Logo mis à jour avec succès !");
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors du téléversement du logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoReset = async () => {
    setModalConfig({
      isOpen: true,
      title: "Réinitialiser le logo",
      message: "Voulez-vous supprimer le logo personnalisé et rétablir le logo par défaut du club ?",
      confirmText: "Réinitialiser",
      variant: "warning",
      onConfirm: async () => {
        setUploadingLogo(true);
        try {
          const res = await fetch("/api/admin/settings/logo", {
            method: "DELETE",
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Erreur lors de la réinitialisation");

          setLogoUrl(result.url);
          addToast("success", "Logo réinitialisé au logo par défaut !");
        } catch (err: any) {
          addToast("error", err.message || "Erreur lors de la réinitialisation du logo.");
        } finally {
          setUploadingLogo(false);
        }
      },
    });
  };

  // Form states (Invitations)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"membre_actif" | "membre_bureau" | "senior" | "alumni">("membre_actif");
  const [inviteDuration, setInviteDuration] = useState<number>(7);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Member search
  const [memberSearch, setMemberSearch] = useState("");

  // Pagination states
  const [invitePage, setInvitePage] = useState(1);
  const itemsPerPage = 6;

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: "success" | "error" | "info", message: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Confirm Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setModalConfig({
      isOpen: true,
      title: "Déconnexion de l'espace Admin",
      message: "Êtes-vous sûr de vouloir vous déconnecter de votre session administrateur ?",
      confirmText: "Se déconnecter",
      variant: "danger",
      onConfirm: async () => {
        await supabase.auth.signOut();
        router.push("/login");
      },
    });
  };

  // Auth Guard check
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch role from profiles table (source of truth)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role || "membre";
        if (role !== "admin") {
          router.push(role === "bureau" || role === "membre_bureau" ? "/bureau" : "/dashboard");
          return;
        }

        setCurrentUser(user);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, [router, supabase]);

  // Fetch Invitations and Members
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data: inviteData, error: inviteErr } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!inviteErr && inviteData) {
        const now = new Date();
        const updatedInvites = inviteData.map((inv) => {
          if (inv.status === "pending" && new Date(inv.expires_at) < now) {
            return { ...inv, status: "expired" as const };
          }
          return inv;
        });
        setInvitations(updatedInvites);
      }

      const { data: memberData, error: memberErr } = await supabase
        .from("profiles")
        .select("*")
        .order("joined_at", { ascending: false });

      if (!memberErr && memberData) {
        setMembers(memberData);
        setSelectedMemberForDetails((prev) =>
          prev ? memberData.find((m: any) => m.id === prev.id) || null : null
        );
      }

      const { data: polesData } = await supabase
        .from("poles")
        .select("id, name, color, icon")
        .order("name");
      if (polesData) {
        setPoles(polesData);
        const map: Record<string, string> = {};
        polesData.forEach((p: any) => {
          map[p.id] = p.name;
        });
        setPolesMap(map);
      }
    } catch (err) {
      // Database loading error handled silently
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  // Fetch Hero Carousel Images
  const fetchHeroImages = useCallback(async () => {
    setLoadingHeroImages(true);
    try {
      const res = await fetch("/api/admin/hero-carousel");
      const data = await res.json();
      if (res.ok && data.images) {
        setHeroImages(data.images);
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setLoadingHeroImages(false);
    }
  }, []);

  // Fetch Activities
  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      if (res.ok && data.activities) {
        setAdminActivities(data.activities);
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingAnnouncements(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, poles(name)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error && data) setAnnouncements(data);

      const { data: polesData } = await supabase.from("poles").select("id, name").order("name");
      if (polesData) setPoles(polesData);
    } catch (err: any) {
      addToast("error", "Erreur lors du chargement des annonces.");
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (activeTab === "annonces") fetchAnnouncements();
  }, [activeTab, fetchAnnouncements]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchHeroImages();
      fetchActivities();
    }
  }, [currentUser, fetchData, fetchHeroImages, fetchActivities]);

  const openNewActivityModal = () => {
    setEditingActivity(null);
    setIsActivityModalOpen(true);
  };

  const openEditActivityModal = (act: ActivityRecord) => {
    setEditingActivity(act);
    setIsActivityModalOpen(true);
  };

  const handleToggleActivityStatus = async (act: ActivityRecord) => {
    const newStatus = act.status === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/admin/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: act.id,
          title: act.title,
          description: act.description,
          content: act.content,
          category: act.category,
          date: act.date,
          location: act.location,
          status: newStatus,
          imageUrl: act.image_url,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la modification du statut.");
      }

      addToast("success", `Activité ${newStatus === "published" ? "publiée" : "mise en brouillon"}`);
      fetchActivities();
    } catch (err: any) {
      addToast("error", err.message || "Erreur de changement de statut.");
    }
  };

  const handleDeleteActivity = (act: ActivityRecord) => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer cette activité ?",
      message: `Voulez-vous supprimer définitivement "${act.title}" ?`,
      confirmText: "Oui, supprimer",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/activities?id=${act.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Erreur de suppression.");
          }
          addToast("success", "Activité supprimée.");
          fetchActivities();
        } catch (err: any) {
          addToast("error", err.message || "Erreur lors de la suppression.");
        }
      },
    });
  };

  // Live preview cycle timer for Hero Carousel
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          duration: inviteDuration,
          created_by: currentUser?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création de l'invitation.");
      }

      if (result.emailSent) {
        addToast("success", `✉️ Invitation envoyée par email à ${inviteEmail}`);
      } else if (result.resendError) {
        // Invitation saved in DB but email failed — show the real error
        addToast("info", `Invitation créée mais email non envoyé: ${result.resendError} — Lien: ${result.inviteLink}`);
      } else {
        addToast("success", `Invitation créée ! Lien: ${result.inviteLink}`);
      }

      setInviteEmail("");
      fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de l'envoi de l'invitation.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    addToast("info", "Lien d'invitation copié dans le presse-papier !");
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleResendInvite = async (invitation: InvitationRecord) => {
    try {
      await supabase
        .from("invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);

      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitation.email,
          role: invitation.role,
          duration: 7,
          created_by: currentUser?.id,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      addToast("success", `Invitation renvoyée à ${invitation.email}`);
      fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de la relance.");
    }
  };

  const handleCancelInvite = (invitation: InvitationRecord) => {
    setModalConfig({
      isOpen: true,
      title: "Annuler cette invitation ?",
      message: `L'invitation pour ${invitation.email} ne sera plus utilisable.`,
      confirmText: "Oui, annuler",
      variant: "warning",
      onConfirm: async () => {
        try {
          await supabase
            .from("invitations")
            .update({ status: "cancelled" })
            .eq("id", invitation.id);

          addToast("info", "Invitation annulée.");
          fetchData();
        } catch (err: any) {
          addToast("error", err.message || "Erreur lors de l'annulation.");
        }
      },
    });
  };

  const handleDeleteInvite = (invitation: InvitationRecord) => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer l'enregistrement ?",
      message: `Cette action retirera définitivement l'historique pour ${invitation.email}.`,
      confirmText: "Supprimer définitivement",
      variant: "danger",
      onConfirm: async () => {
        try {
          await supabase.from("invitations").delete().eq("id", invitation.id);
          addToast("success", "Enregistrement supprimé.");
          fetchData();
        } catch (err: any) {
          addToast("error", err.message || "Erreur lors de la suppression.");
        }
      },
    });
  };

  const handleChangeRole = async (
    member: MemberRecord,
    newRole: "admin" | "membre_bureau" | "membre_actif"
  ) => {
    if (member.role === newRole) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", member.id);

      if (error) throw error;

      addToast("success", `Rôle de ${member.email} mis à jour : ${newRole}`);
      fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors du changement de rôle.");
    }
  };

  const handleChangeMemberPoles = async (
    member: MemberRecord,
    newPoleIds: string[]
  ) => {
    try {
      const primaryPoleId = newPoleIds.length > 0 ? newPoleIds[0] : null;
      const { error } = await supabase
        .from("profiles")
        .update({
          pole_ids: newPoleIds,
          pole_id: primaryPoleId,
        })
        .eq("id", member.id);

      if (error) throw error;

      addToast("success", `Pôles de ${member.first_name || member.email} mis à jour avec succès !`);
      
      // Update local members state immediately
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? { ...m, pole_ids: newPoleIds, pole_id: primaryPoleId }
            : m
        )
      );

      if (selectedMemberForDetails?.id === member.id) {
        setSelectedMemberForDetails((prev) =>
          prev ? { ...prev, pole_ids: newPoleIds, pole_id: primaryPoleId } : null
        );
      }
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de l'assignation des pôles.");
    }
  };

  const handleChangePole = async (
    member: MemberRecord,
    newPoleId: string | null
  ) => {
    const nextPoleIds = newPoleId ? [newPoleId] : [];
    await handleChangeMemberPoles(member, nextPoleIds);
  };

  const handleDeleteMember = (member: MemberRecord) => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer le membre ?",
      message: `Êtes-vous sûr de vouloir retirer ${member.email} du club ? Son accès sera révoqué.`,
      confirmText: "Supprimer le membre",
      variant: "danger",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("id", member.id);

          if (error) throw error;

          addToast("success", "Membre supprimé avec succès.");
          fetchData();
        } catch (err: any) {
          addToast("error", err.message || "Erreur lors de la suppression.");
        }
      },
    });
  };

  // --- STATUT MEMBRE VERIFICATION ---
  const handleVerifyMemberStatus = async (member: MemberRecord) => {
    try {
      const res = await fetch("/api/admin/members/verify-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: member.id, verified: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de validation");

      addToast("success", `Statut de ${member.first_name || member.email} vérifié et validé !`);
      fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de la validation du statut.");
    }
  };

  // --- POINTS ATTRIBUTION STATE & HANDLER ---
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
      addToast("error", "Veuillez entrer un montant de points valide.");
      return;
    }
    if (!pointsModal.reason.trim()) {
      addToast("error", "Veuillez préciser le motif de l'attribution.");
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
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'attribution");

      addToast("success", `${parsedAmount > 0 ? "+" : ""}${parsedAmount} points attribués à ${pointsModal.member.first_name || pointsModal.member.email} !`);
      setPointsModal((prev) => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors de l'attribution des points.");
    } finally {
      setPointsModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // --- HERO CAROUSEL ACTIONS ---
  const processAndUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploadingHero(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Compress photo client-side before upload
        const compressedFile = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressedFile);

        const res = await fetch("/api/admin/hero-carousel", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        addToast("success", `${successCount} photo(s) ajoutée(s) au carrousel hero !`);
        fetchHeroImages();
      }
      if (failCount > 0) {
        addToast("error", `${failCount} photo(s) n'ont pas pu être téléversées.`);
      }
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors du téléversement.");
    } finally {
      setUploadingHero(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processAndUploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processAndUploadFiles(e.dataTransfer.files);
    }
  };

  const handleReorderHeroImage = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === heroImages.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...heroImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const itemsToUpdate = updated.map((img, idx) => ({
      ...img,
      display_order: idx,
    }));

    setHeroImages(itemsToUpdate);

    try {
      const res = await fetch("/api/admin/hero-carousel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToUpdate.map((img) => ({
            id: img.id,
            display_order: img.display_order,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur de réordonnancement.");
      }
      addToast("info", "Ordre du carrousel mis à jour.");
    } catch (err: any) {
      addToast("error", err.message || "Erreur lors du réordonnancement.");
      fetchHeroImages();
    }
  };

  const handleDeleteHeroImage = (image: HeroImageRecord) => {
    setModalConfig({
      isOpen: true,
      title: "Supprimer cette photo ?",
      message: "Cette image sera retirée du carrousel de la page d'accueil.",
      confirmText: "Oui, supprimer",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/hero-carousel?id=${image.id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Erreur de suppression.");
          }

          addToast("success", "Photo retirée avec succès.");
          fetchHeroImages();
        } catch (err: any) {
          addToast("error", err.message || "Erreur lors de la suppression.");
        }
      },
    });
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase().trim();
    return (
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.first_name && m.first_name.toLowerCase().includes(q)) ||
      (m.last_name && m.last_name.toLowerCase().includes(q)) ||
      (m.classe && m.classe.toLowerCase().includes(q)) ||
      (m.statut_membre && m.statut_membre.toLowerCase().includes(q)) ||
      (m.role && m.role.toLowerCase().includes(q))
    );
  });

  // Pagination logic
  const totalInvitePages = Math.ceil(invitations.length / itemsPerPage) || 1;
  const paginatedInvitations = invitations.slice(
    (invitePage - 1) * itemsPerPage,
    invitePage * itemsPerPage
  );

  // Filtered Activities
  const filteredAdminActivities = adminActivities.filter((act) => {
    const matchCat = activityCategoryFilter === "Toutes" || act.category === activityCategoryFilter;
    const q = activitySearch.toLowerCase().trim();
    const matchQ = !q || act.title.toLowerCase().includes(q) || (act.location && act.location.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0d0e0e] flex items-center justify-center text-[#fca311]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e0e] text-white flex flex-col md:flex-row font-sans">
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        onConfirm={() => {
          modalConfig.onConfirm();
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        activeItem={activeTab}
        onSelectTab={setActiveTab}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="h-16 border-b border-[#1a1c1c] px-4 sm:px-8 flex items-center justify-between bg-[#121414] sticky top-0 z-20">
          {/* Mobile Left: Hamburger Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[#a0a0a0] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Ouvrir la navigation admin"
            >
              <Menu className="w-6 h-6 text-custom-amber" />
            </button>
          </div>

          {/* Desktop Left: Icon + Section Title */}
          <div className="hidden md:flex items-center gap-3">
            {activeTab === "invitations" && <Mail className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "membres" && <Users className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "annuaire" && <FileText className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "activities" && <Sparkles className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "hero" && <ImageIcon className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "visites" && <Factory className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "projets" && <FolderGit2 className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "formations" && <GraduationCap className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "opportunites" && <Briefcase className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "ressources" && <BookOpen className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "stats" && <Trophy className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "annonces" && <Megaphone className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "temoignages" && <MessageSquare className="w-5 h-5 text-[#fca311]" />}
            {activeTab === "partenaires" && <Handshake className="w-5 h-5 text-[#fca311]" />}
            {["contenu", "parametres"].includes(activeTab) && (
              <Wrench className="w-5 h-5 text-[#fca311]" />
            )}
            <h2 className="text-xl font-extrabold text-white tracking-tight font-mono uppercase">
              {activeTab === "invitations"
                ? "Invitations"
                : activeTab === "membres"
                ? "Club Members"
                : activeTab === "annuaire"
                ? "Annuaire des Membres"
                : activeTab === "projets"
                ? "Gestion des Projets"
                : activeTab === "formations"
                ? "Gestion des Formations"
                : activeTab === "opportunites"
                ? "Opportunités & Stages"
                : activeTab === "visites"
                ? "Visites d'Entreprise"
                : activeTab === "ressources"
                ? "Ressources Club"
                : activeTab === "stats"
                ? "Stats & Classement"
                : activeTab === "activities"
                ? "Activités du Club"
                : activeTab === "annonces"
                ? "Annonces & Posts"
                : activeTab === "temoignages"
                ? "Gestion des Témoignages"
                : activeTab === "partenaires"
                ? "Partenaires & Sponsors"
                : activeTab === "hero"
                ? "Hero Carousel"
                : "CGI ENIT"}
            </h2>
          </div>

          {/* Mobile Center: Centered CGI ENIT Logo */}
          <div className="flex md:hidden items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#121414] border border-custom-amber/40 p-1 flex items-center justify-center">
              <img src={logoUrl} alt="CGI ENIT" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-sm font-mono tracking-wide">
              CGI ENIT
            </span>
          </div>

          {/* Right Area: Bell + Dynamic Red Highlighted Logout Button + Avatar Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="p-2 text-[#888] hover:text-white transition-colors relative" title="Notifications">
              <Bell className="w-5 h-5" />
            </button>

            {/* Dynamic Highlighted Red Logout Button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer group shrink-0"
              title="Déconnexion de l'espace administration"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline font-mono uppercase text-[11px] tracking-wider">
                Déconnexion
              </span>
            </button>

            <div className="h-6 w-[1px] bg-[#222]" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white font-mono">
                  {currentUser?.user_metadata?.first_name || "Admin User"}
                </div>
                <div className="text-[10px] text-[#fca311] font-mono tracking-wider uppercase">
                  SUPER ADMIN
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#1e2020] border border-[#333535] flex items-center justify-center text-white font-mono text-sm font-bold shadow">
                {currentUser?.email?.substring(0, 2).toUpperCase() || "AD"}
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: INVITATIONS */}
          {activeTab === "invitations" && (
            <div className="space-y-6">
              {/* Top Grid: Form + Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* New Invitation Form */}
                <div className="lg:col-span-8 bg-[#14213d] border border-[#333535] rounded-xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-6 text-white font-mono font-bold text-sm">
                    <UserPlus className="w-4 h-4 text-[#fca311]" />
                    <span>New invitation</span>
                  </div>

                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Email Input */}
                      <div className="md:col-span-5 space-y-1.5">
                        <label className="text-[10px] font-bold text-[#888] font-mono uppercase tracking-wider">
                          EMAIL ADDRESS
                        </label>
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full bg-[#121414] border border-[#333535] focus:border-[#fca311] rounded-lg py-2.5 px-3 text-xs text-white font-mono outline-none"
                        />
                      </div>

                      {/* Role Dropdown */}
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[10px] font-bold text-[#888] font-mono uppercase tracking-wider">
                          ROLE
                        </label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full bg-[#121414] border border-[#333535] focus:border-[#fca311] rounded-lg py-2.5 px-3 text-xs text-white font-mono outline-none cursor-pointer"
                        >
                          <option value="membre_actif">Active Member (1ère Année)</option>
                          <option value="senior">Senior Member (2ème Année)</option>
                          <option value="alumni">Alumni (3ème Année+ / Diplômé)</option>
                          <option value="membre_bureau">Board Member (Membre Bureau)</option>
                        </select>
                      </div>

                      {/* Validity Dropdown */}
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-[#888] font-mono uppercase tracking-wider">
                          VALIDITY
                        </label>
                        <select
                          value={inviteDuration}
                          onChange={(e) => setInviteDuration(Number(e.target.value))}
                          className="w-full bg-[#121414] border border-[#333535] focus:border-[#fca311] rounded-lg py-2.5 px-3 text-xs text-white font-mono outline-none cursor-pointer"
                        >
                          <option value={3}>3 days</option>
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <a
                        href="/preview/invite-email"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#333535] bg-[#121414] hover:bg-[#1a1d1d] text-[#888] hover:text-[#fca311] text-xs font-mono transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aperçu de l'Email d'invitation ↗</span>
                      </a>

                      <button
                        type="submit"
                        disabled={sendingInvite}
                        className="bg-[#fca311] hover:bg-[#ffc887] text-black font-bold font-mono text-xs uppercase px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {sendingInvite ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>GENERATE & SEND INVITATION</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Stats Panel */}
                <div className="lg:col-span-4 bg-[#14213d] border border-[#333535] rounded-xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-white font-mono font-bold text-sm mb-4">
                    <Clock className="w-4 h-4 text-[#fca311]" />
                    <span>Quick Metrics</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#121414] border border-[#333535] rounded-lg p-4 text-center">
                      <div className="text-2xl font-black font-mono text-[#fca311]">
                        {invitations.filter((i) => i.status === "pending").length}
                      </div>
                      <div className="text-[10px] font-mono text-[#888] uppercase mt-1">
                        Pending Invites
                      </div>
                    </div>
                    <div className="bg-[#121414] border border-[#333535] rounded-lg p-4 text-center">
                      <div className="text-2xl font-black font-mono text-green-400">
                        {invitations.filter((i) => i.status === "accepted").length}
                      </div>
                      <div className="text-[10px] font-mono text-[#888] uppercase mt-1">
                        Accepted
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#2a2c2c] flex justify-between items-center text-[10px] font-mono text-[#777]">
                    <span>TOTAL GENERATED</span>
                    <span className="text-white font-bold">{invitations.length}</span>
                  </div>
                </div>
              </div>

              {/* Invitations Table */}
              <div className="bg-[#14213d] border border-[#333535] rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-[#888] font-bold uppercase tracking-wider">
                    INVITATION LOGS ({invitations.length})
                  </div>
                  <button
                    onClick={fetchData}
                    className="p-1.5 text-[#888] hover:text-white transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#2a2c2c] text-[#888] uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">RECIPIENT EMAIL</th>
                        <th className="py-3 px-4">TARGET ROLE</th>
                        <th className="py-3 px-4">STATUS</th>
                        <th className="py-3 px-4">EXPIRES AT</th>
                        <th className="py-3 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2c2c]">
                      {paginatedInvitations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#666]">
                            No invitations created yet.
                          </td>
                        </tr>
                      ) : (
                        paginatedInvitations.map((row) => (
                          <tr key={row.id} className="hover:bg-[#1e2020]/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{row.email}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-[#1e2020] border border-[#333535] text-[10px] text-[#ccc]">
                                {row.role === "membre_bureau" ? "Board Member" : "Active Member"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {row.status === "pending" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                              {row.status === "accepted" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> Accepted
                                </span>
                              )}
                              {row.status === "expired" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                                  <AlertCircle className="w-3 h-3" /> Expired
                                </span>
                              )}
                              {row.status === "cancelled" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-bold">
                                  <Ban className="w-3 h-3" /> Cancelled
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[#888]">
                              {new Date(row.expires_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {row.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleCopyLink(row.token)}
                                      title="Copy Link"
                                      className="p-1.5 rounded text-[#fca311] hover:bg-[#fca311]/10 transition-colors"
                                    >
                                      {copiedToken === row.token ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleCancelInvite(row)}
                                      title="Cancel Invitation"
                                      className="p-1.5 rounded text-[#888] hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {(row.status === "expired" || row.status === "cancelled") && (
                                  <button
                                    onClick={() => handleResendInvite(row)}
                                    title="Resend Invite"
                                    className="p-1.5 rounded text-[#888] hover:text-white hover:bg-white/10 transition-colors"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteInvite(row)}
                                  title="Delete Log"
                                  className="p-1.5 rounded text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalInvitePages > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t border-[#2a2c2c] text-xs font-mono text-[#888]">
                    <span>
                      Page {invitePage} of {totalInvitePages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={invitePage === 1}
                        onClick={() => setInvitePage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded border border-[#333535] hover:bg-[#1e2020] disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={invitePage === totalInvitePages}
                        onClick={() => setInvitePage((p) => Math.min(totalInvitePages, p + 1))}
                        className="px-3 py-1 rounded border border-[#333535] hover:bg-[#1e2020] disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === "membres" && (
            <div className="space-y-6">
              <div className="bg-[#14213d] border border-[#333535] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#2a2c2c]">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-custom-amber" />
                      <span>Membres & Gestion des Statuts</span>
                    </h2>
                    <p className="text-xs text-[#888] mt-0.5">
                      Gérez les statuts (Senior, Actif, Alumni), attribuez des points et validez les préinscriptions.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#555] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Rechercher par nom, email, classe..."
                      className="w-full bg-[#121414] border border-[#333535] focus:border-[#fca311] rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2a2c2c] text-[#888] uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">MEMBRE</th>
                        <th className="py-3 px-4">PÔLES ASSIGNÉS</th>
                        <th className="py-3 px-4">STATUT MEMBRE</th>
                        <th className="py-3 px-4">CLASSE & PARCOURS</th>
                        <th className="py-3 px-4">POINTS TOTAL</th>
                        <th className="py-3 px-4">RÔLE ACCÈS</th>
                        <th className="py-3 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2c2c]">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#666]">
                            Aucun membre trouvé.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((row) => (
                          <tr key={row.id} className="hover:bg-[#1e2020]/50 transition-colors">
                            {/* Member info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1e2020] border border-[#333535] flex items-center justify-center font-bold text-custom-amber text-xs shrink-0 overflow-hidden shadow-sm">
                                  {row.avatar_url ? (
                                    <img
                                      src={row.avatar_url}
                                      alt={row.first_name || "Membre"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span>
                                      {row.first_name ? row.first_name[0] : row.email.substring(0, 1).toUpperCase()}
                                      {row.last_name ? row.last_name[0] : ""}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">
                                    {row.first_name || row.last_name
                                      ? `${row.first_name || ""} ${row.last_name || ""}`
                                      : row.email.split("@")[0]}
                                  </div>
                                  <div className="text-[11px] text-[#888]">{row.email}</div>
                                  {row.phone && (
                                    <div className="text-[10px] text-[#666] flex items-center gap-1 mt-0.5">
                                      <Phone className="w-3 h-3 text-[#555]" />
                                      <span>{row.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Poles Multi-Select */}
                            <td className="py-3.5 px-4">
                              <MemberPoleMultiSelect
                                memberId={row.id}
                                assignedPoleIds={row.pole_ids}
                                fallbackPoleId={row.pole_id}
                                poles={poles}
                                onChange={(newPoleIds) =>
                                  handleChangeMemberPoles(row, newPoleIds)
                                }
                              />
                            </td>

                            {/* Statut Membre + Verification */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <span
                                  className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                                    row.statut_membre === "senior"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : row.statut_membre === "alumni"
                                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  }`}
                                >
                                  {row.statut_membre || "Actif"}
                                </span>

                                <div>
                                  {row.statut_membre_verified ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Vérifié</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyMemberStatus(row)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-custom-amber/15 hover:bg-custom-amber/25 text-custom-amber text-[10px] font-bold transition-colors cursor-pointer"
                                      title="Valider le statut de ce membre"
                                    >
                                      <Shield className="w-3 h-3" />
                                      <span>Vérifier</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Classe & Parcours */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5 text-[11px]">
                                <div className="font-bold text-white">
                                  {row.statut_membre === "alumni"
                                    ? `Promotion : ${row.year || row.classe || "Alumni"}`
                                    : row.classe || "Non renseigné"}
                                </div>
                                {row.prepa_section && (
                                  <div className="text-[10px] text-[#888]">
                                    Prépa: {row.prepa_section} ({row.prepa_etablissement || "?"})
                                    {row.rang_concours ? ` · Rang #${row.rang_concours}` : ""}
                                  </div>
                                )}
                                {(row.bio || row.training_availability) && (
                                  <div className="text-[10px] text-custom-amber/80 font-mono">
                                    Concours: {row.bio || row.training_availability}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  {row.linkedin_url && (
                                    <a
                                      href={row.linkedin_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-0.5"
                                    >
                                      <span>LinkedIn</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                  {row.cv_url && (
                                    <span className="text-[10px] text-emerald-400 font-semibold">
                                      ✓ CV joint
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Points total + Button */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-custom-amber text-xs font-mono">
                                  {row.points_total || 0} pts
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPointsModal(row)}
                                  className="p-1 rounded-md bg-[#1e2020] hover:bg-custom-amber/20 text-[#aaa] hover:text-custom-amber transition-colors cursor-pointer"
                                  title="Attribuer ou ajuster des points"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Role Select */}
                            <td className="py-3.5 px-4">
                              <select
                                value={row.role}
                                onChange={(e) =>
                                  handleChangeRole(row, e.target.value as any)
                                }
                                className="bg-[#121414] border border-[#333535] focus:border-[#fca311] text-[10px] uppercase font-bold text-white rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                              >
                                <option value="membre_actif">Membre Actif</option>
                                <option value="membre_bureau">Membre Bureau</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedMemberForPassport(row.id)}
                                  className="p-1.5 rounded-lg text-custom-amber hover:bg-custom-amber/15 transition-colors cursor-pointer"
                                  title="Générer le Passeport GI / Bilan Annuel d'Activité"
                                >
                                  <Award className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setSelectedMemberForDetails(row)}
                                  className="p-1.5 rounded-lg text-[#888] hover:text-custom-amber hover:bg-custom-amber/10 transition-colors cursor-pointer"
                                  title="Voir le profil et les détails complets"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(row)}
                                  className="p-1.5 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Supprimer le membre"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANNUAIRE DES MEMBRES */}
          {activeTab === "annuaire" && (
            <AnnuaireManager
              members={members}
              polesMap={polesMap}
              onSelectMember={(m) => setSelectedMemberForDetails(m)}
              onOpenPassport={(id) => setSelectedMemberForPassport(id)}
            />
          )}

          {/* TAB 3: HERO CAROUSEL MANAGER */}
          {activeTab === "hero" && (
            <div className="space-y-8">
              {/* Header & Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Drag and Drop Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`lg:col-span-7 bg-[#14213d] border-2 border-dashed ${
                    isDragOver ? "border-[#fca311] bg-[#14213d]/80" : "border-[#333535]"
                  } rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center transition-all duration-200 relative overflow-hidden`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    id="hero-file-input"
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-[#121414] border border-[#333535] flex items-center justify-center text-[#fca311] mb-4 shadow-lg">
                    {uploadingHero ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white font-mono mb-1">
                    {uploadingHero ? "Compression & Upload en cours..." : "Téléverser de nouvelles photos"}
                  </h3>
                  <p className="text-xs text-[#888] font-mono max-w-md mb-6">
                    Glissez-déposez vos images ici ou cliquez pour choisir des fichiers.
                    Les images sont automatiquement optimisées (max 1920px).
                  </p>

                  <label
                    htmlFor="hero-file-input"
                    className={`bg-[#fca311] hover:bg-[#ffc887] text-black font-bold font-mono text-xs uppercase px-6 py-3 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-lg ${
                      uploadingHero ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sélectionner des images</span>
                  </label>
                </div>

                {/* Live Preview Card */}
                <div className="lg:col-span-5 bg-[#14213d] border border-[#333535] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
                      <Eye className="w-4 h-4 text-[#fca311]" />
                      <span>Aperçu Live Carrousel</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#888] bg-[#121414] px-2 py-0.5 rounded border border-[#2a2c2c]">
                      {heroImages.length} image(s)
                    </span>
                  </div>

                  <div className="relative h-48 rounded-xl overflow-hidden border border-[#333535] bg-black group">
                    {heroImages.length > 0 ? (
                      <>
                        <img
                          src={heroImages[previewIndex % heroImages.length]?.image_url}
                          alt="Hero Preview"
                          className="w-full h-full object-cover transition-opacity duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 text-left">
                          <span className="text-[9px] font-mono uppercase bg-[#fca311] text-black px-2 py-0.5 rounded font-bold">
                            Live Hero Preview
                          </span>
                          <h4 className="text-sm font-extrabold text-white mt-1 drop-shadow">
                            LIVE YOUR BEST EXPERIENCES
                          </h4>
                        </div>
                        {/* Slide Indicator Dots */}
                        <div className="absolute top-3 right-3 flex gap-1">
                          {heroImages.map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === previewIndex % heroImages.length
                                  ? "w-4 bg-[#fca311]"
                                  : "w-1.5 bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-[#121414]">
                        <Sparkles className="w-8 h-8 text-[#555] mb-2" />
                        <p className="text-xs text-[#888] font-mono">
                          Aucune image personnalisée. Le carrousel utilise les images par défaut.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2c2c] flex justify-between items-center text-[10px] font-mono text-[#888]">
                    <span>AUTOMATIC AUTOPLAY</span>
                    <span className="text-green-400 font-bold">4.0s CYCLING</span>
                  </div>
                </div>
              </div>

              {/* Active Photos Preview Grid & Management */}
              <div className="bg-[#14213d] border border-[#333535] rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-[#2a2c2c] pb-4">
                  <div>
                    <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                      <span>Photos actives dans le carrousel</span>
                      <span className="text-xs font-normal text-[#888] font-mono">
                        ({heroImages.length} photo{heroImages.length > 1 ? "s" : ""})
                      </span>
                    </h3>
                    <p className="text-xs text-[#888] font-mono mt-0.5">
                      Utilisez les flèches pour modifier la séquence d'affichage sur le site.
                    </p>
                  </div>

                  <button
                    onClick={fetchHeroImages}
                    disabled={loadingHeroImages}
                    className="p-2 text-[#888] hover:text-white transition-colors"
                  >
                    <RotateCw className={`w-4 h-4 ${loadingHeroImages ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {loadingHeroImages ? (
                  <div className="py-16 text-center text-[#fca311]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-mono text-[#888]">Chargement du carrousel...</p>
                  </div>
                ) : heroImages.length === 0 ? (
                  <div className="py-16 text-center text-[#666] font-mono space-y-3">
                    <ImageIcon className="w-12 h-12 text-[#333] mx-auto" />
                    <p className="text-sm text-[#888]">Aucune image dans le carrousel pour l&apos;instant.</p>
                    <p className="text-xs text-[#555]">
                      Le site affiche actuellement les images statiques par défaut. Téléversez-en de nouvelles ci-dessus !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {heroImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className="bg-[#121414] border border-[#333535] hover:border-[#fca311]/50 rounded-xl overflow-hidden shadow-lg transition-all group relative flex flex-col"
                      >
                        {/* Order Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur border border-[#333535] text-[#fca311] font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow">
                          #{idx + 1}
                        </div>

                        {/* Image Preview Container */}
                        <div className="relative h-44 w-full bg-black overflow-hidden">
                          <img
                            src={img.image_url}
                            alt={`Hero Slide ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Card Info & Reorder Controls */}
                        <div className="p-4 flex-1 flex flex-col justify-between bg-[#121414] border-t border-[#2a2c2c]">
                          <div className="text-[10px] font-mono text-[#777] mb-3">
                            Ajoutée le{" "}
                            {new Date(img.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                            {/* Reorder Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleReorderHeroImage(idx, "up")}
                                title="Déplacer vers la gauche / haut"
                                className="p-1.5 rounded bg-[#1e2020] border border-[#333535] text-[#aaa] hover:text-[#fca311] hover:border-[#fca311]/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={idx === heroImages.length - 1}
                                onClick={() => handleReorderHeroImage(idx, "down")}
                                title="Déplacer vers la droite / bas"
                                className="p-1.5 rounded bg-[#1e2020] border border-[#333535] text-[#aaa] hover:text-[#fca311] hover:border-[#fca311]/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteHeroImage(img)}
                              title="Supprimer la photo"
                              className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* TAB 4: LOGO & BRANDING SETTINGS */}
          {activeTab === "parametres" && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <Settings className="w-5 h-5 text-custom-amber" />
                  <span>Gestion de l&apos;Identité Visuelle (Logo)</span>
                </h2>
                <p className="text-xs text-[#888] font-mono mt-1">
                  Modifiez ou réinitialisez le logo officiel du club affiché dans la barre de navigation, le pied de page et les pages publiques.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload & Change Box */}
                <div className="bg-[#14213d] border border-[#333535] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-custom-amber" />
                      <span>Téléverser un nouveau logo</span>
                    </h3>
                    <p className="text-xs text-[#888] font-mono mb-6">
                      Format recommandé : PNG avec fond transparent (max 2 Mo).
                    </p>

                    <label className="border-2 border-dashed border-[#333535] hover:border-custom-amber bg-[#121414] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingLogo}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setPendingLogoFile(file);
                            setPreviewLogoUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-xl bg-custom-amber/10 border border-custom-amber/20 flex items-center justify-center text-custom-amber mb-3 group-hover:scale-110 transition-transform">
                        {uploadingLogo ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-white font-mono text-center">
                        {uploadingLogo ? "Téléversement..." : "Cliquez ou glissez une image ici"}
                      </span>
                      <span className="text-[10px] text-[#666] font-mono mt-1">PNG, SVG, WEBP, JPG</span>
                    </label>
                  </div>
                </div>

                {/* Preview & Actions Box */}
                <div className="bg-[#14213d] border border-[#333535] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-custom-amber" />
                      <span>Aperçu du Logo Actuel</span>
                    </h3>

                    {/* Logo display card */}
                    <div className="bg-[#0c0d0d] border border-[#2a2c2c] rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group">
                      {/* Grid background accent */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:1rem_1rem]" />

                      <div className="relative z-10 w-24 h-24 rounded-2xl overflow-hidden bg-black/60 border border-custom-amber/30 p-2 shadow-2xl flex items-center justify-center">
                        <img
                          src={previewLogoUrl || logoUrl}
                          alt="Logo CGI ENIT"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className={`relative z-10 text-[11px] font-mono mt-3 ${previewLogoUrl ? 'text-custom-amber font-bold' : 'text-[#888]'}`}>
                        {previewLogoUrl ? 'Aperçu (non sauvegardé)' : 'Rendu en direct sur le site'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#2a2c2c] flex flex-col sm:flex-row gap-3">
                    {previewLogoUrl && (
                      <button
                        onClick={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="w-full px-4 py-2.5 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Approuver</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogoReset}
                      disabled={uploadingLogo}
                      className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Réinitialiser</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITIES MANAGEMENT */}
          {activeTab === "activities" && (
            <div className="space-y-8">
              {/* Header & Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-custom-amber" />
                    <span>Gestion des Activités du Club</span>
                  </h2>
                  <p className="text-xs text-[#888] font-mono mt-1">
                    Publiez et gérez les ateliers, hackathons, conférences, visites et formations affichés sur le site.
                  </p>
                </div>
                <button
                  onClick={openNewActivityModal}
                  className="bg-custom-amber hover:bg-custom-amber/90 text-black font-extrabold text-xs uppercase px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(252,163,17,0.2)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Activité</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#14213d] border border-[#333535] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-[#888] uppercase">Total Activités</div>
                    <div className="text-2xl font-black text-white font-mono">{adminActivities.length}</div>
                  </div>
                  <Sparkles className="w-8 h-8 text-custom-amber/40" />
                </div>
                <div className="bg-[#14213d] border border-[#333535] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-[#888] uppercase">Publiées</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {adminActivities.filter((a) => a.status === "published").length}
                    </div>
                  </div>
                  <Eye className="w-8 h-8 text-emerald-400/40" />
                </div>
                <div className="bg-[#14213d] border border-[#333535] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-[#888] uppercase">Brouillons</div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {adminActivities.filter((a) => a.status === "draft").length}
                    </div>
                  </div>
                  <FileText className="w-8 h-8 text-amber-400/40" />
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-[#14213d] border border-[#333535] rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher par titre ou lieu..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="w-full bg-[#0c0d0d] border border-[#2a2c2c] focus:border-custom-amber rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-[#555] outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {["Toutes", "Workshop", "Hackathon", "Visite", "Formation", "Conférence"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActivityCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        activityCategoryFilter === cat
                          ? "bg-custom-amber text-black font-bold"
                          : "bg-[#0c0d0d] text-[#888] hover:text-white border border-[#2a2c2c]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activities Grid */}
              {loadingActivities ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-custom-amber animate-spin" />
                </div>
              ) : filteredAdminActivities.length === 0 ? (
                <div className="bg-[#14213d] border border-[#333535] rounded-2xl p-12 text-center text-[#888] space-y-3 font-mono">
                  <Sparkles className="w-10 h-10 text-[#444] mx-auto" />
                  <div className="text-white font-bold text-base">Aucune activité trouvée</div>
                  <p className="text-xs">Créez votre première activité en cliquant sur le bouton ci-dessus.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAdminActivities.map((act) => (
                    <div
                      key={act.id}
                      className="bg-[#14213d] border border-[#333535] hover:border-custom-amber/40 rounded-2xl p-5 flex flex-col justify-between transition-all space-y-4 relative group"
                    >
                      {/* Image preview */}
                      {act.image_url ? (
                        <div className="w-full h-40 rounded-xl overflow-hidden bg-black border border-[#2a2c2c] relative">
                          <img src={act.image_url} alt={act.title} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 backdrop-blur border border-custom-amber/30 text-[10px] font-mono text-custom-amber uppercase">
                            {act.category}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-xl bg-[#0c0d0d] border border-[#2a2c2c] flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-[#444]" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          {!act.image_url && (
                            <span className="px-2 py-0.5 rounded bg-custom-amber/10 border border-custom-amber/30 text-[10px] font-mono text-custom-amber uppercase">
                              {act.category}
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleActivityStatus(act)}
                            className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                              act.status === "published"
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                            }`}
                          >
                            {act.status === "published" ? "Publiée" : "Brouillon"}
                          </button>
                        </div>

                        <h3 className="text-white font-extrabold text-base leading-snug line-clamp-2">
                          {act.title}
                        </h3>
                        <p className="text-xs text-[#888] line-clamp-2">{act.description}</p>
                      </div>

                      {/* Footer details & Actions */}
                      <div className="pt-4 border-t border-[#2a2c2c] space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#777]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-custom-amber" />
                            {new Date(act.date).toLocaleDateString("fr-FR")}
                          </span>
                          {act.location && (
                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                              <MapPin className="w-3 h-3 text-custom-amber" />
                              {act.location}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => openEditActivityModal(act)}
                            className="px-3 py-1.5 rounded-lg bg-[#1e2020] border border-[#333535] hover:border-custom-amber/40 text-xs font-mono font-bold text-white hover:text-custom-amber transition-all flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Éditer</span>
                          </button>

                          <button
                            onClick={() => handleDeleteActivity(act)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-mono font-bold text-red-400 transition-all flex items-center gap-1.5"
                          >
                        <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATE / EDIT ACTIVITY MODAL — Instagram 3-step flow */}
          <PostCreatorModal
            isOpen={isActivityModalOpen}
            onClose={() => setIsActivityModalOpen(false)}
            editingActivity={editingActivity}
            onSave={async (fd) => {
              const res = await fetch('/api/admin/activities', {
                method: editingActivity ? 'PUT' : 'POST',
                body: fd,
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Erreur.');
              addToast('success', editingActivity ? 'Activité mise à jour !' : 'Activité créée !');
              setIsActivityModalOpen(false);
              fetchActivities();
            }}
          />

          {/* TAB: PROJETS */}
          {activeTab === "projets" && <ProjectManager />}

          {/* TAB: FORMATIONS */}
          {activeTab === "formations" && <FormationsManager onShowToast={addToast} />}

          {/* TAB: OPPORTUNITES & STAGES */}
          {activeTab === "opportunites" && <OpportunitiesManager onShowToast={addToast} />}

          {/* TAB: STATS & CLASSEMENT */}
          {activeTab === "stats" && <LeaderboardStats onShowToast={addToast} />}

          {/* TAB: VISITES D'ENTREPRISE */}
          {activeTab === "visites" && <VisitesManager onShowToast={addToast} />}

          {/* TAB: RESSOURCES CLUB */}
          {activeTab === "ressources" && <ResourcesManager onShowToast={addToast} />}

          {/* TAB: CALENDRIER */}
          {activeTab === "calendrier" && <CalendarManager />}

          {/* TAB: ANNONCES & POSTS */}
          {activeTab === "annonces" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-[#fca311]" />
                    Annonces & Posts du Club
                  </h2>
                  <p className="text-xs text-[#888] mt-1">
                    Créez et publiez des communications officielles visibles par tous les membres et sur la page publique.
                  </p>
                </div>
                <button
                  onClick={() => { setEditingAnnouncement(null); setIsAnnouncementModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fca311] text-black font-bold text-xs hover:bg-[#ffc887] transition-all shadow-[0_0_15px_rgba(252,163,17,0.2)] cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle annonce
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
                <input
                  type="text"
                  placeholder="Rechercher une annonce..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  className="w-full bg-[#1a1c1c] border border-[#2a2c2c] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#fca311]/50 transition-colors"
                />
              </div>

              {/* Announcements List */}
              {loadingAnnouncements ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[#fca311] animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements
                    .filter((a) =>
                      announcementSearch === "" ||
                      a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                      (a.content || "").toLowerCase().includes(announcementSearch.toLowerCase())
                    )
                    .map((a) => (
                      <div
                        key={a.id}
                        className={`bg-[#1a1c1c] border rounded-2xl p-5 transition-all ${
                          a.pinned
                            ? "border-[#fca311]/40 shadow-[0_0_15px_rgba(252,163,17,0.08)]"
                            : "border-[#2a2c2c] hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {a.pinned && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#fca311] bg-[#fca311]/15 px-2 py-0.5 rounded-lg border border-[#fca311]/30">
                                  <Pin className="w-3 h-3" /> Épinglé
                                </span>
                              )}
                              {a.poles && (
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                                  Pôle {a.poles.name}
                                </span>
                              )}
                              <span className="text-[10px] text-[#666] font-mono">
                                {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <h3 className="font-bold text-white text-sm truncate">{a.title}</h3>
                            {a.excerpt && (
                              <p className="text-xs text-[#888] mt-1 line-clamp-2">{a.excerpt}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Toggle Pin */}
                            <button
                              onClick={async () => {
                                await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
                                addToast("success", a.pinned ? "Annonce désépinglée." : "Annonce épinglée.");
                                fetchAnnouncements();
                              }}
                              title={a.pinned ? "Désépingler" : "Épingler"}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                a.pinned
                                  ? "text-[#fca311] bg-[#fca311]/10 hover:bg-[#fca311]/20"
                                  : "text-[#666] hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <Pin className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => { setEditingAnnouncement(a); setIsAnnouncementModalOpen(true); }}
                              title="Modifier"
                              className="p-2 rounded-lg text-[#666] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                setModalConfig({
                                  isOpen: true,
                                  title: "Supprimer l'annonce",
                                  message: `Voulez-vous supprimer définitivement "${a.title}" ?`,
                                  confirmText: "Supprimer",
                                  variant: "danger",
                                  onConfirm: async () => {
                                    await supabase.from("announcements").delete().eq("id", a.id);
                                    addToast("success", "Annonce supprimée.");
                                    fetchAnnouncements();
                                  },
                                });
                              }}
                              title="Supprimer"
                              className="p-2 rounded-lg text-[#666] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {announcements.filter((a) =>
                    announcementSearch === "" ||
                    a.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                    (a.content || "").toLowerCase().includes(announcementSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-16 bg-[#1a1c1c] rounded-3xl border border-dashed border-[#2a2c2c] space-y-3">
                      <Megaphone className="w-10 h-10 text-[#444] mx-auto" />
                      <p className="text-sm font-bold text-white">Aucune annonce</p>
                      <p className="text-xs text-[#888]">Créez votre première annonce pour informer les membres.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Announcement Create/Edit Modal — rendered inline */}
              <AnnouncementFormModal
                isOpen={isAnnouncementModalOpen}
                onClose={() => { setIsAnnouncementModalOpen(false); setEditingAnnouncement(null); }}
                editing={editingAnnouncement}
                poles={poles}
                onSaved={() => { fetchAnnouncements(); addToast("success", editingAnnouncement ? "Annonce mise à jour !" : "Annonce publiée !"); }}
              />
            </div>
          )}

          {/* TAB: TEMOIGNAGES */}
          {activeTab === "temoignages" && <TestimonialsManager onShowToast={addToast} />}

          {/* TAB: PARTENAIRES */}
          {activeTab === "partenaires" && <PartnersManager onNotify={addToast} />}

          {/* MEMBER PROFILE & DETAILS MODAL */}
          <AnimatePresence>
            {selectedMemberForDetails && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-[#141515] border border-[#333535] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between pb-5 border-b border-[#2a2c2c] gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e2020] to-[#14213d] border-2 border-custom-amber/40 flex items-center justify-center font-bold text-custom-amber text-lg shrink-0 shadow-lg">
                        {selectedMemberForDetails.first_name ? selectedMemberForDetails.first_name[0].toUpperCase() : selectedMemberForDetails.email.substring(0, 1).toUpperCase()}
                        {selectedMemberForDetails.last_name ? selectedMemberForDetails.last_name[0].toUpperCase() : ""}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-white">
                            {selectedMemberForDetails.first_name || selectedMemberForDetails.last_name
                              ? `${selectedMemberForDetails.first_name || ""} ${selectedMemberForDetails.last_name || ""}`
                              : selectedMemberForDetails.email.split("@")[0]}
                          </h3>
                          <span
                            className={`inline-block text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                              selectedMemberForDetails.role === "admin"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : selectedMemberForDetails.role === "membre_bureau" || selectedMemberForDetails.role === "bureau"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {selectedMemberForDetails.role === "admin"
                              ? "Admin"
                              : selectedMemberForDetails.role === "membre_bureau" || selectedMemberForDetails.role === "bureau"
                              ? "Membre Bureau"
                              : "Membre Actif"}
                          </span>
                        </div>
                        <p className="text-[#888] text-xs font-mono mt-0.5">{selectedMemberForDetails.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMemberForDetails(null)}
                      className="p-2 text-[#888] hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Highlights Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-[#888] uppercase font-semibold block">Points</span>
                      <span className="text-base font-bold text-custom-amber font-mono">
                        {selectedMemberForDetails.points_total || 0} pts
                      </span>
                    </div>
                    <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-[#888] uppercase font-semibold block">
                        {selectedMemberForDetails.statut_membre === "alumni" ? "Promotion" : "Classe"}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {selectedMemberForDetails.statut_membre === "alumni"
                          ? selectedMemberForDetails.year || selectedMemberForDetails.classe || "Alumni"
                          : selectedMemberForDetails.classe || "N/A"}
                      </span>
                    </div>
                    <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-[#888] uppercase font-semibold block">Statut Club</span>
                      <span className="text-xs font-bold text-white capitalize">
                        {selectedMemberForDetails.statut_membre || "Actif"}
                      </span>
                    </div>
                    <div className="bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-3 text-center">
                      <span className="text-[10px] text-[#888] uppercase font-semibold block">Validation</span>
                      {selectedMemberForDetails.statut_membre_verified ? (
                        <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Vérifié
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-400">En attente</span>
                      )}
                    </div>
                  </div>

                  {/* Detail Sections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Contact & Identité */}
                    <div className="bg-[#181a1a] border border-[#2a2c2c] rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-2 text-custom-amber">
                        <User className="w-3.5 h-3.5" />
                        <span>Contact & Compte</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Téléphone :</span>
                          <span className="text-white font-mono">
                            {selectedMemberForDetails.phone || "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Inscription :</span>
                          <span className="text-white">
                            {new Date(selectedMemberForDetails.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#888]">Profil complété :</span>
                          <span className="text-white">
                            {selectedMemberForDetails.profile_completed_at
                              ? new Date(selectedMemberForDetails.profile_completed_at).toLocaleDateString("fr-FR")
                              : "Non"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cursus Académique & Prépa */}
                    <div className="bg-[#181a1a] border border-[#2a2c2c] rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-2 text-custom-amber">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Parcours & Prépa</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Section Prépa :</span>
                          <span className="text-white font-bold">
                            {selectedMemberForDetails.prepa_section || "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Établissement :</span>
                          <span className="text-white">
                            {selectedMemberForDetails.prepa_etablissement || "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Rang Concours :</span>
                          <span className="text-custom-amber font-mono font-bold">
                            {selectedMemberForDetails.rang_concours ? `#${selectedMemberForDetails.rang_concours}` : "Non renseigné"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#888]">Année Concours :</span>
                          <span className="text-white font-mono">
                            {selectedMemberForDetails.bio || selectedMemberForDetails.training_availability || "Non renseigné"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rôle & Pôle Club */}
                    <div className="bg-[#181a1a] border border-[#2a2c2c] rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-2 text-custom-amber">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Organisation Club</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Pôles assignés :</span>
                          <MemberPoleMultiSelect
                            memberId={selectedMemberForDetails.id}
                            assignedPoleIds={selectedMemberForDetails.pole_ids}
                            fallbackPoleId={selectedMemberForDetails.pole_id}
                            poles={poles}
                            onChange={(newPoleIds) => {
                              handleChangeMemberPoles(selectedMemberForDetails, newPoleIds);
                              setSelectedMemberForDetails((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      pole_ids: newPoleIds,
                                      pole_id: newPoleIds[0] || null,
                                    }
                                  : null
                              );
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-[#252727]">
                          <span className="text-[#888]">Rôle actuel :</span>
                          <select
                            value={selectedMemberForDetails.role}
                            onChange={(e) => {
                              const newRole = e.target.value as any;
                              handleChangeRole(selectedMemberForDetails, newRole);
                              setSelectedMemberForDetails((prev) => prev ? { ...prev, role: newRole } : null);
                            }}
                            className="bg-[#121414] border border-[#333535] text-[10px] text-white rounded-lg px-2 py-1 outline-none cursor-pointer"
                          >
                            <option value="membre_actif">Membre Actif</option>
                            <option value="membre_bureau">Membre Bureau</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#888]">Statut Vérification :</span>
                          {selectedMemberForDetails.statut_membre_verified ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Validé
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                handleVerifyMemberStatus(selectedMemberForDetails);
                                setSelectedMemberForDetails((prev) => prev ? { ...prev, statut_membre_verified: true } : null);
                              }}
                              className="px-2 py-0.5 rounded bg-custom-amber/20 hover:bg-custom-amber/30 text-custom-amber text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Vérifier maintenant
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Liens & Documents */}
                    <div className="bg-[#181a1a] border border-[#2a2c2c] rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-2 text-custom-amber">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Documents & Réseaux</span>
                      </h4>
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[#888] block text-[10px] mb-1">LinkedIn :</span>
                          {selectedMemberForDetails.linkedin_url ? (
                            <a
                              href={selectedMemberForDetails.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors"
                            >
                              <span>Ouvrir LinkedIn</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[#666] text-[11px]">Aucun lien renseigné</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[#888] block text-[10px] mb-1">Curriculum Vitae :</span>
                          {selectedMemberForDetails.cv_url ? (
                            <a
                              href={selectedMemberForDetails.cv_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Consulter le CV (PDF)</span>
                            </a>
                          ) : (
                            <span className="text-[#666] text-[11px]">Aucun CV importé</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer / Actions */}
                  <div className="flex flex-wrap items-center justify-between pt-4 border-t border-[#2a2c2c] gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const id = selectedMemberForDetails.id;
                          setSelectedMemberForDetails(null);
                          setSelectedMemberForPassport(id);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-custom-amber hover:bg-[#ffc887] text-black font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(252,163,17,0.3)]"
                      >
                        <Award className="w-4 h-4" />
                        <span>Passeport GI (Bilan Annuel)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const member = selectedMemberForDetails;
                          setSelectedMemberForDetails(null);
                          handleOpenPointsModal(member);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer border border-white/10"
                      >
                        <Sparkles className="w-4 h-4 text-custom-amber" />
                        <span>Attribuer des points</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMemberForDetails(null)}
                      className="px-5 py-2.5 rounded-xl bg-[#1e2020] hover:bg-[#252828] border border-[#333535] text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Fermer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MEMBER PASSPORT MODAL */}
          <AnimatePresence>
            {selectedMemberForPassport && (
              <MemberPassportModal
                userId={selectedMemberForPassport}
                onClose={() => setSelectedMemberForPassport(null)}
              />
            )}
          </AnimatePresence>

          {/* POINTS ATTRIBUTION MODAL */}
          <AnimatePresence>
            {pointsModal.isOpen && pointsModal.member && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#141515] border border-[#333535] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 my-8"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#2a2c2c]">
                    <div className="flex items-center gap-2 font-bold text-sm text-white font-mono">
                      <Sparkles className="w-4 h-4 text-custom-amber" />
                      <span>Attribuer des points</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPointsModal((prev) => ({ ...prev, isOpen: false }))}
                      className="text-[#888] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">
                      {pointsModal.member.first_name} {pointsModal.member.last_name}
                    </h4>
                    <p className="text-xs text-[#888] font-mono">
                      Solde actuel : <span className="text-custom-amber font-bold">{pointsModal.member.points_total || 0} pts</span>
                    </p>
                  </div>

                  <form onSubmit={handleAwardPoints} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#888] uppercase">
                        Montant de points (+ ou -)
                      </label>
                      <input
                        type="number"
                        required
                        value={pointsModal.amount}
                        onChange={(e) =>
                          setPointsModal((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        placeholder="Ex: 15 ou -5"
                        className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3.5 text-sm text-white font-mono outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#888] uppercase">
                        Motif d&apos;attribution *
                      </label>
                      <input
                        type="text"
                        required
                        value={pointsModal.reason}
                        onChange={(e) =>
                          setPointsModal((prev) => ({ ...prev, reason: e.target.value }))
                        }
                        placeholder="Ex: Organisation du Hackathon Indus"
                        className="w-full bg-[#1e2020] border border-[#333535] focus:border-custom-amber rounded-xl py-2.5 px-3.5 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a2c2c]">
                      <button
                        type="button"
                        onClick={() => setPointsModal((prev) => ({ ...prev, isOpen: false }))}
                        className="px-4 py-2 rounded-xl border border-[#333535] text-xs font-semibold text-[#aaa] hover:bg-white/5"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={pointsModal.submitting}
                        className="px-5 py-2 rounded-xl bg-custom-amber text-black font-bold text-xs hover:bg-[#ffc887] transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {pointsModal.submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Valider l'attribution"
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* FALLBACK FOR UNIMPLEMENTED TABS */}
          {activeTab !== "invitations" &&
            activeTab !== "membres" &&
            activeTab !== "annuaire" &&
            activeTab !== "stats" &&
            activeTab !== "visites" &&
            activeTab !== "ressources" &&
            activeTab !== "projets" &&
            activeTab !== "formations" &&
            activeTab !== "opportunites" &&
            activeTab !== "activities" &&
            activeTab !== "annonces" &&
            activeTab !== "temoignages" &&
            activeTab !== "partenaires" &&
            activeTab !== "calendrier" &&
            activeTab !== "hero" &&
            activeTab !== "parametres" && (
              <div className="py-12 flex items-center justify-center">
                <div className="bg-[#14213d] border border-[#333535] rounded-2xl p-10 text-center max-w-lg w-full shadow-2xl space-y-6 font-mono">
                  <div className="w-16 h-16 rounded-full bg-[#1e2020] border border-[#333535] text-[#fca311] mx-auto flex items-center justify-center shadow">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-white uppercase tracking-wider">
                      COMING SOON
                    </h3>
                    <div className="h-[2px] w-12 bg-[#fca311] mx-auto" />
                  </div>

                  <p className="text-xs text-[#888] leading-relaxed">
                    This feature is coming soon in the next version of the{" "}
                    <span className="text-white font-bold">CGI ENIT portal</span>.
                  </p>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setActiveTab("invitations")}
                      className="bg-[#fca311] hover:bg-[#ffc887] text-black font-bold text-xs uppercase px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
