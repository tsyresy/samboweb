import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function Dashboard() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">
        Bonjour{profile?.first_names ? `, ${profile.first_names}` : ''} 👋
      </h1>
      <p className="mt-2 text-sambo-800/70">
        Bienvenue dans votre espace membre SAMBO. Les prochaines activités, actualités internes
        et raccourcis apparaîtront ici.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {profile?.status === 'valide' ? (
          <Link
            to="/app/carte"
            className="rounded-2xl border border-sambo-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-sambo-700">Ma carte de membre</p>
            <p className="mt-1 text-xs text-sambo-700/60">Voir et télécharger →</p>
          </Link>
        ) : (
          <div className="rounded-2xl border border-sambo-200/70 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-sambo-700">Ma carte de membre</p>
            <p className="mt-1 text-xs text-sambo-700/60">Disponible après validation.</p>
          </div>
        )}
        <div className="rounded-2xl border border-sambo-200/70 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-sambo-700">Mes adidy</p>
          <p className="mt-1 text-xs text-sambo-700/60">Aucune échéance pour le moment.</p>
        </div>
        <div className="rounded-2xl border border-sambo-200/70 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-sambo-700">Prochaine activité</p>
          <p className="mt-1 text-xs text-sambo-700/60">Rien de prévu pour l'instant.</p>
        </div>
      </div>
    </div>
  )
}
