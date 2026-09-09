import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './layout/Sidebar'
import BottomNav from './layout/BottomNav'
import UserHeader from './layout/UserHeader'

import { SiteSettingsProvider } from '@/components/providers/SiteSettingsProvider'
import Navbar from '@/components/Navbar'
import FeedbackFloatingButton from '@/components/feedback/FeedbackFloatingButton'

export default async function MembreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=no_user')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, poles(*)')
    .eq('id', user.id)
    .maybeSingle()

  const profile = profileData || {
    id: user.id,
    first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Membre',
    last_name: user.user_metadata?.last_name || '',
    role: 'membre_actif',
    points_total: 0,
    avatar_url: user.user_metadata?.avatar_url || null,
    is_active: true,
    poles: null,
  }

  return (
    <SiteSettingsProvider>
      <Navbar />
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#0d0e0e] text-white pt-[76px]">
        {/* Sidebar Desktop */}
        <Sidebar profile={profile} />
        
        {/* Contenu principal */}
        <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
          <UserHeader profile={profile} />
          <main className="relative flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
            {children}
          </main>
        </div>

        {/* Navigation Mobile */}
        <BottomNav />

        {/* Bouton Flottant de Feedback (Bugs & Suggestions) */}
        <FeedbackFloatingButton />
      </div>
    </SiteSettingsProvider>
  )
}