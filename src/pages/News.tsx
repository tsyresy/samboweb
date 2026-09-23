import { NEWS_POSTS } from '@/data/news'
import { NewsCard } from '@/components/NewsCard'

export function News() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-sambo-950">Actualités et réalisations</h1>
      <p className="mt-3 max-w-2xl text-sambo-800/80">
        Les événements, projets et moments marquants de la vie de SAMBO.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {NEWS_POSTS.map((post) => (
          <NewsCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
