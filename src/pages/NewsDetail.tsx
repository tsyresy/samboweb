import { Link, Navigate, useParams } from 'react-router-dom'
import { NEWS_POSTS } from '@/data/news'

export function NewsDetail() {
  const { slug } = useParams()
  const post = NEWS_POSTS.find((p) => p.slug === slug)

  if (!post) return <Navigate to="/actualites" replace />

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link to="/actualites" className="text-sm font-medium text-accent hover:underline">
        ← Toutes les actualités
      </Link>

      <h1 className="mt-4 text-3xl font-semibold text-ink">{post.title}</h1>

      <div className="mt-8 space-y-4">
        {post.images.map((src) => (
          <img key={src} src={src} alt="" className="w-full rounded-2xl object-cover" />
        ))}
      </div>

      <div className="mt-8 whitespace-pre-line leading-relaxed text-ink">{post.body}</div>
    </article>
  )
}
