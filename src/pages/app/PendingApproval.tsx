import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function PendingApproval() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white/[0.04] px-4 text-center">
      <h1 className="text-2xl font-semibold text-ink">Demande en cours d'examen</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        Votre compte a bien été créé. Un administrateur doit encore valider votre adhésion avant
        que vous puissiez accéder à l'espace membre.
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 rounded-full px-5 py-2 text-sm font-medium btn-glass"
      >
        Se déconnecter
      </button>
    </div>
  )
}
