import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

/** Profile ids of the members currently connected to the member space. */
const PresenceContext = createContext<Set<string>>(new Set())

/**
 * Joins a shared Realtime Presence channel for as long as the member is
 * inside /app (mounted by AppLayout), so the green "en ligne" dot reflects
 * being connected anywhere in the member space, not just on the Chat tab.
 * Presence is ephemeral: a closed tab or lost connection drops the member
 * out of the set automatically after Realtime's heartbeat timeout.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const profileId = profile?.id
  const [online, setOnline] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profileId) return

    const channel = supabase.channel('presence:membres', {
      config: { presence: { key: profileId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnline(new Set(Object.keys(channel.presenceState())))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ online_at: new Date().toISOString() })
      })

    return () => {
      supabase.removeChannel(channel)
      setOnline(new Set())
    }
  }, [profileId])

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>
}

export function useOnlineMembers() {
  return useContext(PresenceContext)
}
