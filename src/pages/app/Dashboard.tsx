import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchMyDuesTotal, formatAr, type DuesTotal } from '@/lib/dues'

export function Dashboard() {
  const { profile } = useAuth()
  const isValidated = profile?.status === 'valide'
  const [dues, setDues] = useState<DuesTotal | null>(null)

  useEffect(() => {
    if (isValidated) fetchMyDuesTotal().then(setDues)
  }, [isValidated])

  const owes = !!dues && dues.amount > 0

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
        <Link
          to="/app/adidy"
          className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
            owes ? 'border-red-200 bg-red-50' : 'border-sambo-200/70 bg-white'
          }`}
        >
          <p className="text-sm font-medium text-sambo-700">Mes adidy — total dû</p>
          {dues === null ? (
            <p className="mt-1 text-xs text-sambo-700/60">Chargement…</p>
          ) : (
            <>
              <p className={`mt-1 text-2xl font-bold ${owes ? 'text-red-700' : 'text-sambo-700'}`}>
                {formatAr(dues.amount)}
              </p>
              <p className="mt-0.5 text-xs text-sambo-700/60">
                {owes
                  ? `${dues.months} mois impayé${dues.months > 1 ? 's' : ''} · Voir le détail →`
                  : 'Vous êtes à jour. Misaotra !'}
              </p>
            </>
          )}
        </Link>
        <div className="rounded-2xl border border-sambo-200/70 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-sambo-700">Prochaine activité</p>
          <p className="mt-1 text-xs text-sambo-700/60">Rien de prévu pour l'instant.</p>
        </div>
      </div>
    </div>
  )
}
