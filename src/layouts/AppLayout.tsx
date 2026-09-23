import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PresenceProvider } from '@/context/PresenceContext'

const memberLinks = [
  { to: '/app', label: 'Tableau de bord', end: true },
  { to: '/app/profil', label: 'Mon profil' },
  { to: '/app/carte', label: 'Ma carte de membre' },
  { to: '/app/discussions', label: 'Discussions' },
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/adidy', label: 'Mes adidy' },
  { to: '/app/membres', label: 'Annuaire' },
]

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'
  const isResponsable = profile?.access_level === 'responsable'

  const adminLinks = [
    ...(isAdmin ? [{ to: '/app/administration/membres', label: 'Gestion des membres' }] : []),
    ...(isAdmin || isResponsable
      ? [{ to: '/app/administration/adidy', label: 'Gestion des adidy' }]
      : []),
    ...(isAdmin ? [{ to: '/app/administration/contenu', label: 'Contenus et messages' }] : []),
  ]

  return (
    <div className="flex min-h-screen bg-sambo-50">
      <aside className="hidden w-64 flex-col border-r border-sambo-200/70 bg-white px-4 py-6 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src="/sambo-logo.png" alt="SAMBO" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-semibold text-sambo-900">SAMBO</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {memberLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-sambo-700 text-white' : 'text-sambo-900/80 hover:bg-sambo-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {adminLinks.length > 0 && (
            <>
              <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-sambo-700/60">
                Administration
              </p>
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-sambo-700 text-white' : 'text-sambo-900/80 hover:bg-sambo-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-sambo-900/70 hover:bg-sambo-100"
        >
          Se déconnecter
        </button>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-8">
        <PresenceProvider>
          <Outlet />
        </PresenceProvider>
      </main>
    </div>
  )
}
