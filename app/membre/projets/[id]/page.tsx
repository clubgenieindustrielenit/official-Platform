import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/membre/projects/KanbanBoard";
import { ExternalLink, Sparkles, FolderGit2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  lead_id: string | null;
  google_form_url: string | null;
  poles: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

type ProjectMember = {
  id: string;
};

type ProjectTask = {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  assignee_id: string | null;
  created_at: string;
};

type ProjectMemberProfile = {
  profiles: { id: string; first_name: string | null; last_name: string | null };
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const project = (
    await supabase
      .from("projects")
      .select("*, poles(name), profiles:lead_id(first_name, last_name)")
      .eq("id", id)
      .single()
  ).data as Project | null;

  if (!project) notFound();

  // Vérifier si l'user est membre
  const membership = (
    await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", id)
      .eq("user_id", userId || "")
      .single()
  ).data as ProjectMember | null;

  const isMember = !!membership || project.lead_id === userId;

  // Récupérer les tâches
  const tasks = (
    (
      await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", id)
    ).data ?? []
  ) as ProjectTask[];

  // Récupérer les membres du projet pour les avatars
  const members = (
    (
      await supabase
        .from("project_members")
        .select("profiles(id, first_name, last_name)")
        .eq("project_id", id)
    ).data ?? []
  ) as unknown as ProjectMemberProfile[];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Return button */}
      <div>
        <Link
          href="/membre/projets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#888] hover:text-custom-amber transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Retour aux projets du club</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141515] border border-[#2a2c2c] p-6 rounded-3xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-custom-amber font-mono font-bold uppercase tracking-wider bg-custom-amber/10 px-2.5 py-0.5 rounded-lg border border-custom-amber/20">
              {project.poles?.name || "Projet Transversal"}
            </span>
            {isMember && (
              <span className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                ✓ Membre de l&apos;équipe
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#aaa] pt-1">
            <span>
              Responsable:{" "}
              <strong className="text-white">
                {project.profiles?.first_name} {project.profiles?.last_name}
              </strong>
            </span>
            {project.deadline && (
              <span className="font-mono text-[#888]">
                Échéance: {new Date(project.deadline).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>

        {/* Member Avatars */}
        <div className="flex items-center -space-x-2">
          {members.map((m, idx) => (
            <div
              key={m.profiles?.id || idx}
              title={`${m.profiles?.first_name || ""} ${m.profiles?.last_name || ""}`}
              className="w-9 h-9 rounded-full bg-[#1e2020] border-2 border-[#141515] flex items-center justify-center text-xs font-bold text-custom-amber"
            >
              {(m.profiles?.first_name?.[0] || "?")}
              {(m.profiles?.last_name?.[0] || "?")}
            </div>
          ))}
        </div>
      </div>

      {/* Description if present */}
      {project.description && (
        <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 sm:p-6 text-xs text-[#ccc] leading-relaxed whitespace-pre-line">
          {project.description}
        </div>
      )}

      {/* Google Form Application Banner (Inscription comme les visites) */}
      {project.google_form_url && !isMember && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-custom-navy/80 via-[#1a233b] to-[#141515] border border-custom-amber/40 shadow-[0_0_30px_rgba(252,163,17,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-custom-amber/15 border border-custom-amber/30 flex items-center justify-center text-custom-amber shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Rejoindre ce projet (Candidature officielle)
              </h3>
              <p className="text-xs text-[#aaa] mt-0.5 leading-relaxed">
                Ce projet recrute de nouveaux membres. Remplissez le formulaire de candidature pour intégrer l&apos;équipe.
              </p>
            </div>
          </div>

          <a
            href={project.google_form_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-custom-amber hover:bg-[#ffc887] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(252,163,17,0.35)] shrink-0"
          >
            <span>Postuler via Google Form 🚀</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Kanban Board */}
      <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-6 shadow-xl">
        <KanbanBoard projectId={id} initialTasks={tasks || []} isMember={isMember} />
      </div>
    </div>
  );
}