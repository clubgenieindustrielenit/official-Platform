'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database } from '@/lib/supabase/database.types'
import { isBureauOrAdmin } from '@/lib/types/roles'
import {
  Zap,
  CalendarDays,
  Factory,
  GraduationCap,
  Cog,
  Megaphone,
  CalendarRange,
  Users,
  Trophy,
  BookOpen,
  Briefcase,
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  poles: { name: string } | null
}
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider'

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const { logoUrl } = useSiteSettings()
  
  const links = [
    { href: '/membre', label: 'Dashboard', icon: Zap },
    { href: '/membre/annonces', label: 'Annonces', icon: Megaphone },
    { href: '/membre/evenements', label: 'Événements', icon: CalendarDays },
    { href: '/membre/visites', label: 'Visites Industrielles', icon: Factory },
    { href: '/membre/formations', label: 'Formations', icon: GraduationCap },
    { href: '/membre/projets', label: 'Projets', icon: Cog },
    { href: '/membre/opportunites', label: 'Stages & Opportunités', icon: Briefcase },
    { href: '/membre/ressources', label: 'Ressources & Supports', icon: BookOpen },
    { href: '/membre/calendrier', label: 'Calendrier', icon: CalendarRange },
    { href: '/membre/annuaire', label: 'Annuaire', icon: Users },
  ]

  return (
    <aside className="hidden fixed top-[76px] bottom-0 left-0 z-30 w-64 flex-col border-r border-[#2a2c2c] bg-[#0d0e0e] shadow-2xl lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-[#2a2c2c] bg-[#141515] px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#121414] border border-[#fca311]/30 overflow-hidden">
          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight text-white leading-none">
            CGI ENIT
          </span>
          <span className="text-[10px] text-[#666] uppercase tracking-wider mt-1">
            Génie Industriel
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/membre' && pathname.startsWith(link.href))
          const Icon = link.icon
          return (
            <Link 
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 ${
                isActive 
                  ? 'bg-[#fca311] text-black shadow-md' 
                  : 'text-[#888] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span>{link.label}</span>
            </Link>
          )
        })}
        
        {isBureauOrAdmin(profile.role) && (
          <div className="mt-6 border-t border-[#2a2c2c] px-2 pt-5">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">
                Espace Responsable
              </span>
              <span className="text-[10px] bg-[#fca311]/10 text-[#fca311] px-2 py-0.5 rounded-md font-bold border border-[#fca311]/20">
                {profile.role === 'admin' ? 'Admin' : 'Bureau'}
              </span>
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-[#2a2c2c] bg-[#141515] p-3">
        <Link href="/membre/profil" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition-colors group">
          <div className="w-9 h-9 rounded-full bg-[#fca311]/10 border border-[#fca311]/30 shrink-0 flex items-center justify-center">
            <span className="font-bold text-xs text-[#fca311]">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate group-hover:text-[#fca311] transition-colors">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-[10px] text-[#666] truncate">
              {profile.poles?.name ? `Pôle ${profile.poles.name.replace(/^Pôle\s+/i, '')}` : 'Membre ENIT'}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}