import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/auth'

const links = [
  { to: '/a-propos', label: 'À propos' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/contact', label: 'Contact' },
  { to: '/don', label: 'Faire un don' },
]

export function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="glass-strong sticky top-0 z-40 border-x-0 border-t-0">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/sambo-logo.png" alt="SAMBO" className="h-9 w-9 rounded-full object-cover" />
          <span className="text-lg font-semibold text-ink">SAMBO</span>
        </Link>

        <div className="glass hidden items-center gap-1 rounded-full p-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  isActive
                    ? 'bg-white/[0.14] text-ink shadow-[inset_0_1px_0_oklch(1_0_0/0.1)]'
                    : 'text-ink-muted hover:bg-white/[0.07] hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              to="/app"
              className="rounded-full btn-primary px-4 py-2 text-sm"
            >
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                to="/connexion"
                className="rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-white/[0.07] hover:text-ink"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="rounded-full btn-primary px-4 py-2 text-sm"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-white/10 md:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeWidth="2"
              strokeLinecap="round"
              d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
            />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-line px-4 pb-4 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-white/10 hover:text-ink"
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mt-2 flex gap-2">
            {user ? (
              <Link
                to="/app"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full btn-primary px-4 py-2 text-center text-sm"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  to="/connexion"
                  onClick={() => setOpen(false)}
                  className="btn-glass flex-1 rounded-full px-4 py-2 text-center text-sm font-medium"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full btn-primary px-4 py-2 text-center text-sm"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
