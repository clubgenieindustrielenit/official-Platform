'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { getRoleLabel } from '@/lib/types/roles'
import NotificationBell from '@/components/membre/notifications/NotificationBell'
import { useI18n } from '@/lib/i18n/context'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  poles: { name: string } | null
}

export default function UserHeader({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useI18n()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-[76px] z-20 flex h-16 items-center justify-between border-b border-[#2a2c2c] bg-[#0d0e0e]/90 px-4 backdrop-blur-md lg:px-8">
      <Link 
        href="/membre/profil"
        className="flex items-center gap-3 group p-1 -ml-1 rounded-xl hover:bg-white/[0.04] transition-colors"
        title="Voir / Éditer mon profil"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fca311]/10 border border-[#fca311]/30 group-hover:border-[#fca311] transition-colors">
           <span className="font-bold text-xs text-[#fca311]">
            {profile.first_name?.[0] || 'U'}{profile.last_name?.[0] || 'A'}
           </span>
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-none group-hover:text-[#fca311] transition-colors">
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-[10px] text-[#666] leading-none mt-1">
            {profile.poles?.name ? `Pôle ${profile.poles.name.replace(/^Pôle\s+/i, '')}` : 'Membre ENIT'} · {getRoleLabel(profile.role)}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Points indicator */}
        <div className="bg-[#141515] border border-[#2a2c2c] flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5">
          <span className="text-[10px] text-[#666] uppercase tracking-wider font-bold hidden sm:block">
            {t('common.points', 'Points')}
          </span>
          <motion.span 
            className="text-sm font-black text-[#fca311]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {profile.points_total || 0}
          </motion.span>
        </div>

        {/* Notifications */}
        <NotificationBell userId={profile.id} />

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title={t('nav.logout', 'Se déconnecter')}
          aria-label={t('nav.logout', 'Se déconnecter')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2a2c2c] bg-[#141515] text-[#888] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 cursor-pointer"
        >
          {loggingOut ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}