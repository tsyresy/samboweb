import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src="/sambo-logo.png"
            alt="SAMBO"
            className="mx-auto mb-6 h-20 w-20 rounded-full object-cover shadow-lg"
          />
          <h1 className="text-4xl font-semibold tracking-tight text-sambo-950 sm:text-5xl">
            L'association étudiante SAMBO
          </h1>
          <p className="mt-4 text-lg text-sambo-800/80">
            Une communauté d'étudiants unis autour de projets, d'entraide et de solidarité.
            Découvrez notre histoire, nos réalisations et rejoignez-nous.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/inscription"
              className="rounded-full bg-sambo-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sambo-800"
            >
              Rejoindre SAMBO
            </Link>
            <Link
              to="/don"
              className="rounded-full border border-sambo-300 bg-white px-6 py-3 text-sm font-medium text-sambo-900 transition-colors hover:bg-sambo-100"
            >
              Faire un don
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-sambo-200/60 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-sambo-950">Qui sommes-nous ?</h2>
          <p className="mt-3 max-w-3xl text-sambo-800/80">
            SAMBO accompagne ses membres tout au long de leur parcours étudiant : entraide entre
            promotions, activités associatives, projets solidaires et vie de campus. Notre bureau
            veille au bon fonctionnement de l'association et à la transparence de sa gestion.
          </p>
          <Link
            to="/a-propos"
            className="mt-4 inline-block text-sm font-medium text-sambo-700 hover:underline"
          >
            En savoir plus sur notre histoire →
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-sambo-950">Actualités récentes</h2>
          <p className="mt-2 text-sm text-sambo-700/70">
            Les dernières nouvelles de l'association arriveront bientôt ici.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-sambo-200/70 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 h-32 w-full rounded-xl bg-sambo-100" />
                <p className="text-sm text-sambo-700/60">Actualité à venir</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sambo-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold">Envie de nous rejoindre ou de contribuer ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sambo-100/80">
            Que vous soyez étudiant, partenaire ou sympathisant, il existe une façon de soutenir
            SAMBO.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-sambo-900 hover:bg-sambo-100"
            >
              Nous contacter
            </Link>
            <Link
              to="/don"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Faire un don
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
