import { createClient } from '@/lib/supabase/server'
import ProjectsListClient, { ProjectItem } from '@/components/membre/projects/ProjectsListClient'
import { FolderGit2 } from 'lucide-react'

export default async function ProjetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id || ''

  // Fetch all club projects with poles, lead, and team members
  const { data: projectsData, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      status,
      progress,
      deadline,
      google_form_url,
      created_at,
      poles (id, name, color, icon),
      lead:profiles!lead_id (id, first_name, last_name, avatar_url),
      project_members (
        user_id,
        profiles (id, first_name, last_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects for member:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
  }

  const rawProjects = (projectsData || []) as any[]

  const formattedProjects: ProjectItem[] = rawProjects.map((p) => {
    const members = p.project_members || []
    const isUserMember = members.some((m: any) => m.user_id === userId)
    const isUserLead = p.lead?.id === userId

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status || 'planned',
      progress: p.progress || 0,
      deadline: p.deadline,
      google_form_url: p.google_form_url || null,
      created_at: p.created_at,
      poles: p.poles,
      lead: p.lead,
      project_members: members,
      isUserMember,
      isUserLead,
    }
  })

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#181a1a] via-[#141515] to-[#121313] border border-[#2a2c2c] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#fca311] text-xs font-bold uppercase tracking-wider">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Gestion de Projets & Équipes</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Projets & Initiatives du Club
          </h1>
          <p className="text-[#aaa] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Explorez les projets transversaux du Club GI ENIT, collaborez avec votre pôle et suivez l&apos;avancement des tâches en temps réel.
          </p>
        </div>
      </div>

      <ProjectsListClient projects={formattedProjects} userId={userId} />
    </div>
  )
}
