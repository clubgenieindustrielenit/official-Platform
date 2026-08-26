import { createClient } from '@/lib/supabase/server'
import { isBureauOrAdmin, getRoleLabel, Role } from '@/lib/types/roles'
import { Users, Shield, Award } from 'lucide-react'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  role: Role
  pole_id: string | null
  pole_ids?: string[] | null
  points_total: number
  year: string | null
  avatar_url: string | null
  poles: { name: string } | null
}

export default async function AnnuairePage() {
  const supabase = await createClient()
  const [{ data: profiles }, { data: allPoles }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, poles(name)')
      .order('first_name', { ascending: true }),
    supabase
      .from('poles')
      .select('id, name')
      .order('name', { ascending: true })
  ])

  const typedProfiles = (profiles ?? []) as Profile[]
  const bureau = typedProfiles.filter((p) => isBureauOrAdmin(p.role))
  const members = typedProfiles.filter((p) => !isBureauOrAdmin(p.role))

  const polesMap = new Map((allPoles || []).map((p: any) => [p.id, p.name]))

  // Group members by official poles
  const membersByPole: Record<string, Profile[]> = {}
  ;(allPoles || []).forEach((p: any) => {
    membersByPole[p.name] = []
  })
  membersByPole['Membres Généraux'] = []

  members.forEach((m) => {
    const memberPoleIds: string[] = (m.pole_ids && m.pole_ids.length > 0)
      ? m.pole_ids
      : (m.pole_id ? [m.pole_id] : [])

    if (memberPoleIds.length === 0) {
      membersByPole['Membres Généraux'].push(m)
    } else {
      memberPoleIds.forEach((pid) => {
        const pName = polesMap.get(pid)
        if (pName) {
          if (!membersByPole[pName]) membersByPole[pName] = []
          membersByPole[pName].push(m)
        }
      })
    }
  })

  // Filter out empty general members group if 0
  const activePoleGroups = Object.entries(membersByPole).filter(
    ([name, list]) => list.length > 0 || name !== 'Membres Généraux'
  )

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#181a1a] via-[#141515] to-[#121313] border border-[#2a2c2c] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#fca311] text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Communauté & Réseau ENIT</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Annuaire & Organigramme
          </h1>
          <p className="text-[#aaa] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Retrouvez tous les membres actifs, les responsables de pôles et les membres du bureau du Club GI ENIT.
          </p>
        </div>
      </div>

      {/* Bureau Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2a2c2c] pb-3">
          <Shield className="w-4 h-4 text-[#fca311]" />
          <h2 className="font-display text-lg font-bold text-white">Bureau Exécutif & Responsables</h2>
          <span className="text-xs text-[#888] font-mono">({bureau.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bureau.map((member) => (
            <div
              key={member.id}
              className="bg-[#141515] border border-[#2a2c2c] hover:border-[#fca311]/50 rounded-3xl p-5 flex flex-col items-center text-center space-y-3 transition-all duration-300 shadow-lg group relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#1e2020] border border-[#fca311]/30 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-xl text-[#fca311]">
                    {member.first_name?.[0]}{member.last_name?.[0]}
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold text-white text-sm group-hover:text-[#fca311] transition-colors">
                  {member.first_name} {member.last_name}
                </p>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-lg bg-[#fca311]/10 border border-[#fca311]/20 text-[#fca311] text-[10px] font-bold uppercase tracking-wider">
                  {getRoleLabel(member.role)}
                </span>
                {member.poles && (
                  <p className="text-[11px] text-[#888] font-mono mt-1">
                    Pôle {member.poles.name.replace(/^Pôle\s+/i, '')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Membres par pôle */}
      {activePoleGroups.map(([poleName, poleMembers]) => (
        <section key={poleName} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2a2c2c] pb-3">
            <Award className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display text-lg font-bold text-white">
              {poleName === 'Membres Généraux' ? poleName : `Pôle ${poleName.replace(/^Pôle\s+/i, '')}`}
            </h2>
            <span className="text-xs text-[#888] font-mono">({poleMembers.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {poleMembers.map((member) => (
              <div
                key={member.id}
                className="bg-[#141515] border border-[#2a2c2c] hover:border-white/20 rounded-2xl p-4 flex items-center gap-3 transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1e2020] border border-[#2a2c2c] flex items-center justify-center shrink-0 overflow-hidden">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-xs text-[#aaa]">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-xs truncate">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-[10px] text-[#888] font-mono mt-0.5">
                    {member.year ? `${member.year} GI` : 'Membre Actif'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}