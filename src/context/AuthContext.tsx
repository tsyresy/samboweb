import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/context/auth'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'


/** What was fetched, tagged with which user it's for — lets `profile` and
 *  `profileLoading` both be derived at render time from a comparison with
 *  the current `userId`, instead of tracked as separately-updated async
 *  state that can go stale for one render right after the user changes. */
interface LoadedProfile {
  userId: string
  profile: Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null)

  useEffect(() => {
    // onAuthStateChange alone (no separate getSession() call) — it always
    // fires once immediately with the current session on subscribe, and
    // using both sources as independent triggers invites exactly the kind
    // of intermediate/stale state this file is now careful to avoid.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession((prev) => {
        // A session momentarily reported as null next to a real previous
        // one (not an actual sign-out) is treated as noise, not a logout.
        if (!newSession && prev && event !== 'SIGNED_OUT') return prev
        return newSession
      })
      setLoading(false)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  const profile = loaded && loaded.userId === userId ? loaded.profile : null
  const profileLoading = !!userId && loaded?.userId !== userId

  useEffect(() => {
    if (!userId || loaded?.userId === userId) return

    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setLoaded({ userId, profile: data })
      })

    return () => {
      cancelled = true
    }
  }, [userId, loaded])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileLoading,
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
