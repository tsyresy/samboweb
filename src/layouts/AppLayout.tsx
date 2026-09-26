import { Suspense, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/PageLoader'
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
      <span className="font-semibold text-ink">SAMBO</span>
    </div>
  )
}

/** One link of the side navigation. The active highlight is a single
 *  shared element that glides from link to link (layoutId). */
function SideLink({ link, pillId }: { link: NavItem; pillId: string }) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      className={({ isActive }) =>
        `relative rounded-xl px-3 py-2 text-sm font-medium ${
          isActive ? 'text-accent' : 'text-ink-muted hover:bg-white/[0.06] hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={pillId}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/[0.13] shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]"
              aria-hidden
            />
          )}
          <span className="relative">{link.label}</span>
        </>
      )}
    </NavLink>
  )
}

/** Shared by the desktop sidebar and the mobile drawer. */
function NavContent({
  adminLinks,
  onSignOut,
  pillId,
}: {
  adminLinks: NavItem[]
  onSignOut: () => void
  pillId: string
}) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">
        {memberLinks.map((link) => (
          <SideLink key={link.to} link={link} pillId={pillId} />
        ))}

        {adminLinks.length > 0 && (
          <>
            <p className="mt-6 mb-1 px-3 text-xs font-semibold text-ink-subtle">Administration</p>
            {adminLinks.map((link) => (
              <SideLink key={link.to} link={link} pillId={pillId} />
            ))}
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-4 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-white/[0.06] hover:text-ink"
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
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="glass-strong sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-y-0 border-l-0 px-4 py-6 sm:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <NavContent adminLinks={adminLinks} onSignOut={() => signOut()} pillId="nav-pill-desktop" />
      </aside>

      {/* Mobile top bar */}
      <header className="glass-strong sticky top-0 z-30 flex items-center justify-between border-x-0 border-t-0 px-4 py-2.5 sm:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-white/10"
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
          className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ease-fluid ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!menuOpen}
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto glass-strong border-y-0 border-l-0 px-4 py-4 shadow-2xl transition-transform duration-300 ease-fluid ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 flex items-center justify-between px-2">
            <Logo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <NavContent adminLinks={adminLinks} onSignOut={() => signOut()} pillId="nav-pill-mobile" />
        </div>
      </div>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <PresenceProvider>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </PresenceProvider>
      </main>
    </div>
  )
}
