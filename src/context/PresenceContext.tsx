import type { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/auth'
import { PresenceContext } from '@/context/presence'
import { openChannel } from '@/lib/realtime'

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

    let current: RealtimeChannel | null = null
    const close = openChannel('presence:membres', { config: { presence: { key: profileId } } }, (channel) => {
      current = channel
      channel
        .on('presence', { event: 'sync' }, () => {
          setOnline(new Set(Object.keys(channel.presenceState())))
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') channel.track({ online_at: new Date().toISOString() })
        })
    })

    // A closed or reloaded tab otherwise lingers as "en ligne" for others
    // until the server notices the dead socket (tens of seconds): announce
    // the departure explicitly while the page can still send it.
    const leave = () => current?.untrack()
    window.addEventListener('pagehide', leave)

    return () => {
      window.removeEventListener('pagehide', leave)
      close()
      setOnline(new Set())
    }
  }, [profileId])

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>
}
