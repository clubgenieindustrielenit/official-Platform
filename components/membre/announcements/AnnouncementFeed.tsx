'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Megaphone, CalendarDays } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  pinned: boolean
  created_at: string
  pole_id: string | null
  poles: { name: string } | null
}

export default function AnnouncementFeed({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState(initialAnnouncements)

  useEffect(() => {
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        async (payload) => {
          const { data: newAnnouncement } = await supabase
            .from('announcements')
            .select('*, poles(name)')
            .eq('id', payload.new.id)
            .single()
          
          if (newAnnouncement) {
            setAnnouncements(prev => [newAnnouncement as Announcement, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {announcements.map((a) => (
          <motion.div
            key={a.id}
            layout
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`bg-[#141515] border rounded-3xl p-6 shadow-xl transition-all ${
              a.pinned 
                ? 'border-[#fca311]/50 bg-gradient-to-br from-[#1c1a14] to-[#141515] shadow-[0_0_25px_rgba(252,163,17,0.1)]' 
                : 'border-[#2a2c2c] hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[#fca311] bg-[#fca311]/15 px-3 py-1 rounded-xl border border-[#fca311]/30">
                    <Pin className="w-3 h-3" />
                    <span>Épinglé</span>
                  </span>
                )}
                {a.poles && (
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-xl border border-sky-500/20">
                    Pôle {a.poles.name.replace(/^Pôle\s+/i, '')}
                  </span>
                )}
              </div>
              <time className="text-xs text-[#888] font-mono shrink-0 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#666]" />
                <span>
                  {new Date(a.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </time>
            </div>

            <h2 className="font-display text-xl font-bold text-white mb-2 leading-snug">
              {a.title}
            </h2>

            {a.content && (
              <p className="text-[#bbb] text-sm leading-relaxed whitespace-pre-line">
                {a.content}
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {announcements.length === 0 && (
        <div className="text-center py-16 bg-[#141515] rounded-3xl border border-dashed border-[#2a2c2c] space-y-3">
          <Megaphone className="w-10 h-10 text-[#444] mx-auto" />
          <h3 className="text-base font-bold text-white">Aucune annonce pour le moment</h3>
          <p className="text-xs text-[#888]">Les communications officielles du bureau apparaîtront ici.</p>
        </div>
      )}
    </div>
  )
}