import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="glass-strong border-x-0 border-b-0 text-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/sambo-logo.png" alt="SAMBO" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-semibold">SAMBO</span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-muted">
            <Link to="/a-propos" className="hover:text-white">
              À propos
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link to="/don" className="hover:text-white">
              Faire un don
            </Link>
            <Link to="/connexion" className="hover:text-white">
              Espace membre
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-ink-subtle">
          © {new Date().getFullYear()} SAMBO. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
