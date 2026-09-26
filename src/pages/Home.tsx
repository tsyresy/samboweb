import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { NEWS_POSTS } from '@/data/news'
import { NewsCard } from '@/components/NewsCard'

const HERO_VIDEO_URL = 'https://res.cloudinary.com/j9i1lkuc/video/upload/v1790171703/animation_Sambo.mp4'

function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // Respect reduced-motion: leave the video paused on its first frame
    // instead of looping it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause()
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        src={HERO_VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-transparent" />
    </div>
  )
}

export function Home() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <HeroVideoBackground />
        <div className="relative mx-auto max-w-2xl text-center">
          <img
            src="/sambo-logo.png"
            alt="SAMBO"
            className="mx-auto mb-6 h-20 w-20 rounded-full object-cover shadow-lg"
          />
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            L'association étudiante SAMBO
          </h1>
          <p className="mt-4 text-lg text-ink">
            Une communauté d'étudiants unis autour de projets, d'entraide et de solidarité.
            Découvrez notre histoire, nos réalisations et rejoignez-nous.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/inscription"
              className="btn-primary rounded-full px-6 py-3 text-sm"
            >
              Rejoindre SAMBO
            </Link>
            <Link
              to="/don"
              className="btn-glass rounded-full px-6 py-3 text-sm font-medium"
            >
              Faire un don
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6">
        <div className="glass mx-auto max-w-6xl rounded-3xl px-6 py-10 sm:px-10">
          <h2 className="text-2xl font-semibold text-ink">Qui sommes-nous ?</h2>
          <p className="mt-3 max-w-3xl text-ink-muted">
            SAMBO accompagne ses membres tout au long de leur parcours étudiant : entraide entre
            promotions, activités associatives, projets solidaires et vie de campus. Notre bureau
            veille au bon fonctionnement de l'association et à la transparence de sa gestion.
          </p>
          <Link
            to="/a-propos"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            En savoir plus sur notre histoire →
          </Link>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Actualités et réalisations</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Ce que SAMBO fait pour ses membres et sa communauté.
              </p>
            </div>
            <Link
              to="/actualites"
              className="text-sm font-medium text-accent hover:underline"
            >
              Voir toutes les actualités →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {NEWS_POSTS.slice(0, 3).map((post) => (
              <NewsCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="glass mx-auto max-w-6xl rounded-3xl px-6 py-12 text-center sm:px-10">
          <h2 className="text-2xl font-semibold">Envie de nous rejoindre ou de contribuer ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-muted">
            Que vous soyez étudiant, partenaire ou sympathisant, il existe une façon de soutenir
            SAMBO.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="btn-primary rounded-full px-6 py-3 text-sm"
            >
              Nous contacter
            </Link>
            <Link
              to="/don"
              className="btn-glass rounded-full px-6 py-3 text-sm font-medium"
            >
              Faire un don
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
