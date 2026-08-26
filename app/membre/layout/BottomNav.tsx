'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Wrench, Megaphone } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/membre', label: 'Accueil', icon: LayoutDashboard },
    { href: '/membre/annonces', label: 'Annonces', icon: Megaphone },
    { href: '/membre/evenements', label: 'Événements', icon: CalendarDays },
    { href: '/membre/projets', label: 'Projets', icon: Wrench },
  ]

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-[#2a2c2c] bg-[#0d0e0e]/95 px-2 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/membre' && pathname.startsWith(link.href))
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-12 w-16 flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-[#fca311]/10 text-[#fca311]'
                : 'text-[#888] hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[10px] font-bold">{link.label}</span>
            {isActive ? <span className="mt-0.5 h-0.5 w-4 rounded-full bg-[#fca311]" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}
