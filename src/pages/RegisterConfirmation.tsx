import { Link } from 'react-router-dom'

export function RegisterConfirmation() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-sambo-950">Demande envoyée</h1>
      <p className="mt-4 text-sambo-800/80">
        Votre compte a été créé et votre demande d'adhésion est en attente de validation par un
        administrateur. Vous recevrez l'accès à votre espace membre dès son approbation.
      </p>
      <Link
        to="/connexion"
        className="mt-8 inline-block rounded-full bg-sambo-700 px-6 py-3 text-sm font-medium text-white hover:bg-sambo-800"
      >
        Aller à la connexion
      </Link>
    </div>
  )
}
