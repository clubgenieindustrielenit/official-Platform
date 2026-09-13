'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react'

type Registration = Database['public']['Tables']['event_registrations']['Row']

type Props = {
  activityId: string
  initialRegistration: Registration | null
  isFull: boolean
  userId: string
}

export default function RegistrationButton({ activityId, initialRegistration, isFull, userId }: Props) {
  const supabase = createClient()
  const [registration, setRegistration] = useState<Registration | null>(initialRegistration)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!userId) {
      setError("Session expirée, recharge la page.")
      return
    }

    setIsLoading(true)
    setError(null)

    // UI optimiste : on crée un faux objet en attendant la réponse
    const optimisticReg: Registration = {
      id: 'temp-id',
      activity_id: activityId,
      user_id: userId,
      status: isFull ? 'waitlisted' : 'confirmed',
      queue_position: null,
      attended: null,
      created_at: new Date().toISOString()
    }
    setRegistration(optimisticReg)

    try {
      const res = await fetch("/api/activities/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: activityId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegistration(null);
        setError(data.error || "Une erreur est survenue. Réessaie.");
      } else {
        if (data.registration) {
          setRegistration(data.registration);
        }
      }
    } catch (err: any) {
      setRegistration(null);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!registration || registration.id === 'temp-id') return;
    setIsLoading(true);
    setError(null);

    // UI optimiste
    const previousState = registration;
    setRegistration(null);

    try {
      const res = await fetch(
        `/api/activities/register?activity_id=${activityId}&id=${registration.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setRegistration(previousState);
        setError(data.error || "Annulation impossible pour le moment.");
      }
    } catch (err: any) {
      setRegistration(previousState);
      setError(err.message || "Annulation impossible pour le moment.");
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu visuel selon l'état
  if (registration && registration.status === 'confirmed') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-success font-mono text-sm">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Inscrit
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full py-3 border border-danger/50 text-danger hover:bg-danger/10 transition-colors font-body text-sm rounded-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isLoading ? 'Annulation...' : 'Se désister'}
        </motion.button>
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-danger text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    )
  }

  if (registration && registration.status === 'waitlisted') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-warning font-mono text-sm">
          <Clock className="h-4 w-4" aria-hidden="true" />
          En liste d&apos;attente
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full py-3 border border-muted/50 text-muted hover:bg-card transition-colors font-body text-sm rounded-md disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Quitter la file
        </motion.button>
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-danger text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    )
  }

  // État non inscrit
  return (
    <div className="space-y-2">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleRegister}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`w-full py-3 font-body text-sm rounded-md transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
          isFull
            ? 'bg-card border border-warning/50 text-warning hover:bg-warning/10'
            : 'bg-accent text-bg hover:bg-accent/90 font-medium'
        }`}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isLoading ? 'Traitement...' : (isFull ? "Rejoindre la liste d'attente" : "S'inscrire")}
      </motion.button>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-danger text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
