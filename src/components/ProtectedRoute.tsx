import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { AccessLevel } from '@/types'

export function ProtectedRoute({
  children,
  requireAccessLevel,
}: {
  children: ReactNode
  requireAccessLevel?: AccessLevel | AccessLevel[]
}) {
  const allowedLevels = requireAccessLevel
    ? Array.isArray(requireAccessLevel)
      ? requireAccessLevel
      : [requireAccessLevel]
    : null
  const { session, profile, loading, profileLoading } = useAuth()

  if (loading || (session && profileLoading)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sambo-700">
        Chargement…
      </div>
    )
  }

  if (!session) return <Navigate to="/connexion" replace />

  if (profile && profile.status !== 'valide') {
    return <Navigate to="/app/en-attente" replace />
  }

  if (allowedLevels && (!profile || !allowedLevels.includes(profile.access_level))) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
