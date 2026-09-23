import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** True while the initial session is being restored. */
  loading: boolean
  /** True while the profile row for the current session's user hasn't been
   *  fetched yet. Access-level checks (ProtectedRoute) must wait for this
   *  to clear — otherwise they can act on a stale/null profile left over
   *  from before the session settled. */
  profileLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
