import { Link } from 'react-router-dom'
import type { NewsPost } from '@/data/news'

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <Link
      to={`/actualites/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sambo-200/70 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-sambo-100">
        <img
          src={post.images[0]}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-medium text-sambo-950 group-hover:text-sambo-700">{post.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-sambo-800/70">{post.excerpt}</p>
        <span className="mt-3 text-sm font-medium text-sambo-700">Lire la suite →</span>
      </div>
    </Link>
  )
}
