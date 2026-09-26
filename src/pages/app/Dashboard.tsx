import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NewsCard } from '@/components/NewsCard'
import { useAuth } from '@/context/auth'
import { NEWS_POSTS } from '@/data/news'
import { fetchMyDuesTotal, formatAr, type DuesTotal } from '@/lib/dues'
import { supabase } from '@/lib/supabase'

interface RecentPost {
  id: string
  content: string
  created_at: string
  author: { name: string; photo_url: string | null } | null
}

const RECENT_POSTS = 3

async function fetchRecentPosts(): Promise<RecentPost[]> {
  const { data: posts } = await supabase
    .from('posts')
    .select('id, author_id, content, created_at')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(RECENT_POSTS)
  if (!posts?.length) return []

  const { data: authors } = await supabase
    .from('directory_profiles')
    .select('id, last_name, first_names, photo_url')
    .in('id', [...new Set(posts.map((p) => p.author_id))])
  const byId = new Map((authors ?? []).map((a) => [a.id, a]))

  return posts.map((p) => {
    const a = byId.get(p.author_id)
    return {
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      author: a
        ? { name: [a.last_name, a.first_names].filter(Boolean).join(' ') || 'Membre', photo_url: a.photo_url }
        : null,
    }
  })
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function Dashboard() {
  const { profile } = useAuth()
  const isValidated = profile?.status === 'valide'
  const [dues, setDues] = useState<DuesTotal | null>(null)
  const [posts, setPosts] = useState<RecentPost[] | null>(null)

  useEffect(() => {
    if (!isValidated) return
    fetchMyDuesTotal().then(setDues)
    fetchRecentPosts().then(setPosts)
  }, [isValidated])

  const owes = !!dues && dues.amount > 0

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">
        Bonjour{profile?.first_names ? `, ${profile.first_names}` : ''} 👋
      </h1>
      <p className="mt-2 text-ink-muted">
        Bienvenue dans votre espace membre SAMBO.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {profile?.status === 'valide' ? (
          <Link
            to="/app/carte"
            className="rounded-2xl border border-line glass glass-link p-5"
          >
            <p className="text-sm font-medium text-accent">Ma carte de membre</p>
            <p className="mt-1 text-xs text-ink-subtle">Voir et télécharger →</p>
          </Link>
        ) : (
          <div className="rounded-2xl border border-line glass p-5">
            <p className="text-sm font-medium text-accent">Ma carte de membre</p>
            <p className="mt-1 text-xs text-ink-subtle">Disponible après validation.</p>
          </div>
        )}
        <Link
          to="/app/adidy"
          className={`glass-link rounded-2xl border p-5 ${
            owes ? 'border-red-400/30 bg-red-500/10' : 'border-line glass'
          }`}
        >
          <p className="text-sm font-medium text-accent">Mes adidy — total dû</p>
          {dues === null ? (
            <p className="mt-1 text-xs text-ink-subtle">Chargement…</p>
          ) : (
            <>
              <p className={`mt-1 text-2xl font-bold ${owes ? 'text-danger' : 'text-accent'}`}>
                {formatAr(dues.amount)}
              </p>
              <p className="mt-0.5 text-xs text-ink-subtle">
                {owes
                  ? `${dues.months} mois impayé${dues.months > 1 ? 's' : ''} · Voir le détail →`
                  : 'Vous êtes à jour. Misaotra !'}
              </p>
            </>
          )}
        </Link>
        <div className="rounded-2xl border border-line glass p-5">
          <p className="text-sm font-medium text-accent">Prochaine activité</p>
          <p className="mt-1 text-xs text-ink-subtle">Rien de prévu pour l'instant.</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Dernières publications</h2>
            <Link to="/app/discussions" className="text-sm font-medium text-accent hover:underline">
              Tout voir →
            </Link>
          </div>

          <div className="mt-3 space-y-3">
            {posts === null ? (
              <p className="text-sm text-ink-subtle">Chargement…</p>
            ) : posts.length === 0 ? (
              <Link
                to="/app/discussions"
                className="block rounded-2xl border border-dashed border-line-strong glass p-5 text-sm text-accent hover:bg-white/[0.04]"
              >
                Aucune publication pour l'instant. Soyez le premier à partager quelque chose →
              </Link>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  to="/app/discussions"
                  className="flex gap-3 rounded-2xl border border-line glass glass-link p-4"
                >
                  {post.author?.photo_url ? (
                    <img src={post.author.photo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-accent">
                      {(post.author?.name ?? 'M').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-ink">{post.author?.name ?? 'Membre'}</span>
                      <span className="ml-2 text-xs text-ink-subtle">{timeAgo(post.created_at)}</span>
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-ink-muted">{post.content}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {NEWS_POSTS[0] && (
          <section>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Dernière actualité</h2>
              <Link to="/actualites" className="text-sm font-medium text-accent hover:underline">
                Toutes →
              </Link>
            </div>
            <div className="mt-3">
              <NewsCard post={NEWS_POSTS[0]} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
