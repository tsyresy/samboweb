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
    <div className="flex min-h-screen flex-col items-center justify-center bg-sambo-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-sambo-950">Demande en cours d'examen</h1>
      <p className="mt-3 max-w-md text-sambo-800/80">
        Votre compte a bien été créé. Un administrateur doit encore valider votre adhésion avant
        que vous puissiez accéder à l'espace membre.
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-6 rounded-full border border-sambo-300 px-5 py-2 text-sm font-medium text-sambo-900 hover:bg-sambo-100"
      >
        Se déconnecter
      </button>
    </div>
  )
}
