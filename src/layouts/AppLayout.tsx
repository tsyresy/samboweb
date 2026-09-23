import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PresenceProvider } from '@/context/PresenceContext'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const memberLinks: NavItem[] = [
  { to: '/app', label: 'Tableau de bord', end: true },
  { to: '/app/profil', label: 'Mon profil' },
  { to: '/app/carte', label: 'Ma carte de membre' },
  { to: '/app/discussions', label: 'Discussions' },
  { to: '/app/chat', label: 'Chat' },
  { to: '/app/adidy', label: 'Mes adidy' },
  { to: '/app/membres', label: 'Annuaire' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/sambo-logo.png" alt="" className="h-8 w-8 rounded-full object-cover" />
      <span className="font-semibold text-sambo-900">SAMBO</span>
    </div>
  )
}

/** Shared by the desktop sidebar and the mobile drawer. */
function NavContent({ adminLinks, onSignOut }: { adminLinks: NavItem[]; onSignOut: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-sambo-700 text-white' : 'text-sambo-900/80 hover:bg-sambo-100'
    }`

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">
        {memberLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
            {link.label}
          </NavLink>
        ))}

        {adminLinks.length > 0 && (
          <>
            <p className="mt-6 px-3 text-xs font-semibold tracking-wide text-sambo-700/60 uppercase">
              Administration
            </p>
            {adminLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-sambo-900/70 hover:bg-sambo-100"
      >
        Se déconnecter
      </button>
    </>
  )
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'
  const isResponsable = profile?.access_level === 'responsable'
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(pathname)

  // Close the mobile menu once a link has taken us to another page.
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const adminLinks: NavItem[] = [
    ...(isAdmin ? [{ to: '/app/administration/membres', label: 'Gestion des membres' }] : []),
    ...(isAdmin || isResponsable
      ? [{ to: '/app/administration/adidy', label: 'Gestion des adidy' }]
      : []),
    ...(isAdmin ? [{ to: '/app/administration/contenu', label: 'Contenus et messages' }] : []),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-sambo-50 sm:flex-row">
      <aside className="hidden w-64 flex-col border-r border-sambo-200/70 bg-white px-4 py-6 sm:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <NavContent adminLinks={adminLinks} onSignOut={() => signOut()} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sambo-200/70 bg-white/95 px-4 py-2.5 backdrop-blur sm:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-sambo-900 hover:bg-sambo-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 sm:hidden ${menuOpen ? '' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-sambo-950/40 transition-opacity duration-200 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!menuOpen}
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-white px-4 py-4 shadow-xl transition-transform duration-200 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 flex items-center justify-between px-2">
            <Logo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sambo-900 hover:bg-sambo-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <NavContent adminLinks={adminLinks} onSignOut={() => signOut()} />
        </div>
      </div>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <PresenceProvider>
          <Outlet />
        </PresenceProvider>
      </main>
    </div>
  )
}
