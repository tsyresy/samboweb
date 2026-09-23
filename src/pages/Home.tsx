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
      <div className="absolute inset-0 bg-gradient-to-b from-sambo-950/70 via-sambo-950/60 to-sambo-50" />
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
          <p className="mt-4 text-lg text-sambo-100/90">
            Une communauté d'étudiants unis autour de projets, d'entraide et de solidarité.
            Découvrez notre histoire, nos réalisations et rejoignez-nous.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/inscription"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-sambo-900 transition-colors hover:bg-sambo-100"
            >
              Rejoindre SAMBO
            </Link>
            <Link
              to="/don"
              className="rounded-full border border-white/50 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-sambo-950">Actualités et réalisations</h2>
              <p className="mt-2 text-sm text-sambo-700/70">
                Ce que SAMBO fait pour ses membres et sa communauté.
              </p>
            </div>
            <Link
              to="/actualites"
              className="text-sm font-medium text-sambo-700 hover:underline"
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
