import { Link } from 'react-router-dom'
import type { NewsPost } from '@/data/news'

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <Link
      to={`/actualites/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line glass glass-link"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-white/10">
        <img
          src={post.images[0]}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-medium text-ink group-hover:text-accent">{post.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{post.excerpt}</p>
        <span className="mt-3 text-sm font-medium text-accent">Lire la suite →</span>
      </div>
    </Link>
  )
}
