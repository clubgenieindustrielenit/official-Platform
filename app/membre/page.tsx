import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import { formatActivityDate, getActivityTypeLabel } from '@/lib/utils'
import AnimatedPoints from '@/components/membre/dashboard/AnimatedPoints'
import AnimatedAnnouncementList from '@/components/membre/dashboard/AnimatedAnnouncementList'
import {
  Zap,
  CalendarDays,
  GraduationCap,
  FolderGit2,
  Factory,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react'

type Activity = Database['public']['Tables']['activities']['Row']

type Announcement = {
  id: string
  title: string
  excerpt: string | null
  created_at: string
}



type UpcomingRegistration = {
  activities: Activity | null
  status: 'confirmed' | 'waitlisted'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  if (!userId) return null

  const inSevenDays = new Date()
  inSevenDays.setDate(inSevenDays.getDate() + 7)

  const [
    profileRes,
    membersRes,
    upcomingRegsRes,
    activeProjectsRes,
    announcementsRes,
    agendaRes
  ] = await Promise.all([
    supabase.from('profiles').select('points_total').eq('id', userId).maybeSingle(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('event_registrations').select('activities(*), status').eq('user_id', userId).in('status', ['confirmed', 'waitlisted']).gt('activities.date_start', new Date().toISOString()).order('activities.date_start', { ascending: true }).limit(2),
    supabase.from('projects').select('id, title, progress, status, lead_id, poles(name), project_members(user_id)').neq('status', 'done').order('created_at', { ascending: false }).limit(4),
    supabase.from('announcements').select('id, title, excerpt, created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('activities').select('id, title, type, date_start').gt('date_start', new Date().toISOString()).lt('date_start', inSevenDays.toISOString()).order('date_start', { ascending: true })
  ])

  const profileData = profileRes.data as { points_total?: number } | null
  const totalMembers = membersRes.count ?? 0
  
  const upcomingRegs = (upcomingRegsRes.data ?? []) as unknown as UpcomingRegistration[]
  const nextEvent = upcomingRegs.find(r => r.activities?.type === 'event')?.activities
  const nextFormation = upcomingRegs.find(r => r.activities?.type === 'formation')?.activities
  
  const rawProjects = (activeProjectsRes.data ?? []) as any[]
  const activeProjects = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    progress: p.progress,
    status: p.status,
    poles: p.poles,
    isMember: p.lead_id === userId || (p.project_members || []).some((m: any) => m.user_id === userId),
  }))
  const announcements = (announcementsRes.data ?? []) as unknown as Announcement[]
  const agenda = (agendaRes.data ?? []) as unknown as Activity[]

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome with Quick Metrics */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#181a1a] via-[#141515] to-[#121313] border border-[#2a2c2c] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#fca311]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#fca311]/10 border border-[#fca311]/20 text-[#fca311] text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Espace Membre Actif</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tableau de Bord
            </h1>
            <p className="text-[#aaa] text-xs sm:text-sm max-w-xl leading-relaxed">
              Bienvenue sur votre portail CGI ENIT. Suivez vos activités, inscrivez-vous aux formations et pilotez vos projets.
            </p>
          </div>

          {/* Points widget (synced from profiles.points_total) */}
          <div className="flex items-center gap-3 bg-[#1e2020] border border-[#2a2c2c] rounded-2xl p-4 sm:p-5 shrink-0 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#fca311]/10 border border-[#fca311]/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#fca311]" />
            </div>
            <div>
              <p className="text-[10px] text-[#888] font-mono uppercase tracking-widest mb-1">Mes Points</p>
              <div className="flex items-baseline gap-1">
                <AnimatedPoints points={profileData?.points_total || 0} />
                <span className="text-xs text-[#fca311] font-bold">pts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Main Action Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Next Event Card */}
        <div className="group relative flex flex-col justify-between bg-[#141515] border border-[#2a2c2c] hover:border-sky-500/40 rounded-3xl p-6 shadow-xl transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Prochain Événement</span>
              </span>
              <span className="text-[10px] font-mono text-[#666]">Club</span>
            </div>

            {nextEvent ? (
              <>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-sky-400 transition-colors leading-snug line-clamp-2">
                  {nextEvent.title}
                </h3>
                <div className="space-y-1 text-xs text-[#aaa] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{formatActivityDate(nextEvent.date_start)}</span>
                  </div>
                  {nextEvent.location && (
                    <div className="flex items-center gap-1.5 text-[#888]">
                      <MapPin className="w-3.5 h-3.5 text-[#666]" />
                      <span className="truncate">{nextEvent.location}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#888] py-4">Aucune inscription active à un événement.</p>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-[#2a2c2c]">
            {nextEvent ? (
              <Link
                href={`/membre/evenements/${nextEvent.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <span>Voir le détail</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/membre/evenements"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#888] hover:text-white transition-colors"
              >
                <span>Découvrir les événements</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Next Formation Card */}
        <div className="group relative flex flex-col justify-between bg-[#141515] border border-[#2a2c2c] hover:border-emerald-500/40 rounded-3xl p-6 shadow-xl transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Prochaine Formation</span>
              </span>
              <span className="text-[10px] font-mono text-[#666]">Tech</span>
            </div>

            {nextFormation ? (
              <>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                  {nextFormation.title}
                </h3>
                <div className="space-y-1 text-xs text-[#aaa] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formatActivityDate(nextFormation.date_start)}</span>
                  </div>
                  {nextFormation.location && (
                    <div className="flex items-center gap-1.5 text-[#888]">
                      <MapPin className="w-3.5 h-3.5 text-[#666]" />
                      <span className="truncate">{nextFormation.location}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-[#888] py-4">Pas de formation planifiée pour le moment.</p>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-[#2a2c2c]">
            {nextFormation ? (
              <Link
                href={`/membre/formations/${nextFormation.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Accéder à la formation</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/membre/formations"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#888] hover:text-white transition-colors"
              >
                <span>Explorer les formations</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="group relative flex flex-col justify-between bg-[#141515] border border-[#2a2c2c] hover:border-[#fca311]/40 rounded-3xl p-6 shadow-xl transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-[#fca311]/10 text-[#fca311] border border-[#fca311]/20">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Projets en Cours</span>
              </span>
              <Link href="/membre/projets" className="text-[10px] font-mono text-[#888] hover:text-[#fca311]">
                Tous →
              </Link>
            </div>

            {activeProjects.length > 0 ? (
              <ul className="space-y-2.5">
                {activeProjects.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/membre/projets/${p.id}`}
                      className="block p-2.5 rounded-2xl bg-[#1e2020] hover:bg-[#252828] border border-[#2a2c2c] transition-colors group/item"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs text-white group-hover/item:text-[#fca311] transition-colors truncate">
                          {p.title}
                        </p>
                        {p.isMember && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-[#fca311]/20 text-[#fca311] font-bold shrink-0">
                            Membre
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-[#141515] rounded-full overflow-hidden">
                          <div className="h-full bg-[#fca311] rounded-full" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#888]">{p.progress || 0}%</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#888] py-4">Aucun projet actif dans le club.</p>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-[#2a2c2c]">
            <Link
              href="/membre/projets"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#fca311] hover:text-[#ffc887] transition-colors"
            >
              <span>Accéder à l&apos;espace projets</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Announcements & 7-Day Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <span>Dernières Annonces du Club</span>
            </h2>
            <Link href="/membre/annonces" className="text-xs font-semibold text-[#fca311] hover:underline">
              Toutes les annonces →
            </Link>
          </div>

          {announcements.length > 0 ? (
            <AnimatedAnnouncementList announcements={announcements} />
          ) : (
            <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-8 text-center text-[#888]">
              <p className="text-xs">Aucune annonce récente pour le moment.</p>
            </div>
          )}
        </div>

        {/* Right: 7 Days Agenda */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <span>Cette Semaine</span>
            </h2>
            <Link href="/membre/calendrier" className="text-xs font-semibold text-[#fca311] hover:underline">
              Calendrier →
            </Link>
          </div>

          <div className="bg-[#141515] border border-[#2a2c2c] rounded-3xl p-5 space-y-3.5 shadow-xl">
            {agenda.length > 0 ? (
              agenda.map((act) => (
                <Link 
                  key={act.id} 
                  href={`/membre/${act.type === 'event' ? 'evenements' : act.type === 'visit' ? 'visites' : 'formations'}/${act.id}`}
                  className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center w-11 h-11 bg-[#1e2020] rounded-xl border border-[#2a2c2c] shrink-0">
                    <span className="text-[9px] uppercase text-[#fca311] font-mono font-bold leading-none">
                      {new Date(act.date_start).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-white leading-none mt-1">
                      {new Date(act.date_start).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-[#fca311] truncate transition-colors">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-[#888] font-mono mt-0.5">
                      {getActivityTypeLabel(act.type)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-white transition-colors" />
                </Link>
              ))
            ) : (
              <p className="text-xs text-[#888] text-center py-6">
                Aucune activité prévue pour les 7 prochains jours.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}