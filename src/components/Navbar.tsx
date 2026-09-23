import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

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
    <header className="sticky top-0 z-40 border-b border-sambo-200/60 bg-sambo-50/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/sambo-logo.png" alt="SAMBO" className="h-9 w-9 rounded-full object-cover" />
          <span className="text-lg font-semibold text-sambo-900">SAMBO</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-sambo-700' : 'text-sambo-900/70 hover:text-sambo-700'
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
              className="rounded-full bg-sambo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sambo-800"
            >
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                to="/connexion"
                className="text-sm font-medium text-sambo-900/80 hover:text-sambo-700"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                className="rounded-full bg-sambo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sambo-800"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="text-sambo-900 md:hidden"
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
        <div className="flex flex-col gap-1 border-t border-sambo-200/60 px-4 pb-4 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-sambo-900/80 hover:bg-sambo-100"
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mt-2 flex gap-2">
            {user ? (
              <Link
                to="/app"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-sambo-700 px-4 py-2 text-center text-sm font-medium text-white"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  to="/connexion"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-sambo-300 px-4 py-2 text-center text-sm font-medium text-sambo-900"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-sambo-700 px-4 py-2 text-center text-sm font-medium text-white"
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
