import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

// Kept apart from AuthProvider (AuthContext.tsx) so that file exports only
// a component and React Fast Refresh can hot-reload it.

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
