export function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-sambo-950">À propos de SAMBO</h1>
      <p className="mt-4 text-sambo-800/80">
        Cette page présentera bientôt l'histoire complète de l'association : sa création, sa
        mission, ses valeurs et les grandes étapes qui ont marqué son parcours.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <h2 className="text-lg font-medium text-sambo-900">Mission</h2>
          <p className="mt-2 text-sm text-sambo-800/70">Contenu à venir.</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-sambo-900">Valeurs</h2>
          <p className="mt-2 text-sm text-sambo-800/70">Contenu à venir.</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-sambo-900">Étapes marquantes</h2>
          <p className="mt-2 text-sm text-sambo-800/70">Contenu à venir.</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-sambo-950">Le bureau</h2>
        <p className="mt-2 text-sm text-sambo-800/70">
          La présentation du président et des membres du bureau sera ajoutée ici une fois le
          contenu fourni par l'association.
        </p>
      </div>
    </div>
  )
}
