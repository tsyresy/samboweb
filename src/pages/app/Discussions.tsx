import { useEffect, useState, type FormEvent } from 'react'
import { UnpaidWall } from '@/components/UnpaidWall'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface AuthorInfo {
  id: string
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
}

interface PostRow {
  id: string
  author_id: string
  content: string
  status: 'visible' | 'hidden'
  created_at: string
}

interface CommentRow {
  id: string
  post_id: string
  author_id: string
  content: string
  status: 'visible' | 'hidden'
  created_at: string
}

function authorName(author: AuthorInfo | undefined) {
  if (!author) return 'Membre'
  return [author.last_name, author.first_names].filter(Boolean).join(' ') || 'Membre'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function Discussions() {
  const { profile } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'

  const [posts, setPosts] = useState<PostRow[]>([])
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({})
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadPosts() {
    setLoading(true)
    const [postsRes, authorsRes] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('directory_profiles').select('id, last_name, first_names, nickname, photo_url'),
    ])

    if (postsRes.error) {
      setError(postsRes.error.message)
      setLoading(false)
      return
    }

    setPosts(postsRes.data ?? [])
    const authorMap: Record<string, AuthorInfo> = {}
    for (const a of authorsRes.data ?? []) authorMap[a.id] = a
    setAuthors(authorMap)
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadComments(postId: string) {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments((c) => ({ ...c, [postId]: data ?? [] }))
  }

  function toggleExpand(postId: string) {
    setExpanded((e) => ({ ...e, [postId]: !e[postId] }))
    if (!comments[postId]) loadComments(postId)
  }

  async function handleSubmitPost(e: FormEvent) {
    e.preventDefault()
    if (!profile || !newPost.trim()) return
    setPosting(true)
    const { error: insertError } = await supabase
      .from('posts')
      .insert({ author_id: profile.id, content: newPost.trim() })
    setPosting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setNewPost('')
    await loadPosts()
  }

  async function handleSubmitComment(postId: string) {
    const content = commentDrafts[postId]?.trim()
    if (!profile || !content) return
    const { error: insertError } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: profile.id, content })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setCommentDrafts((d) => ({ ...d, [postId]: '' }))
    await loadComments(postId)
  }

  async function handleReport(targetTable: 'posts' | 'comments', targetId: string) {
    const reason = window.prompt('Pourquoi signalez-vous ce contenu ?')
    if (!reason || !profile) return
    await supabase.from('content_reports').insert({
      reporter_id: profile.id,
      target_table: targetTable,
      target_id: targetId,
      reason,
    })
    window.alert('Signalement envoyé, merci.')
  }

  async function toggleVisibility(table: 'posts' | 'comments', id: string, currentStatus: string) {
    const nextStatus = currentStatus === 'visible' ? 'hidden' : 'visible'
    await supabase.from(table).update({ status: nextStatus }).eq('id', id)
    if (table === 'posts') {
      await loadPosts()
    } else {
      const postId = Object.keys(comments).find((pid) => comments[pid].some((c) => c.id === id))
      if (postId) await loadComments(postId)
    }
  }

  if (!profile || loading) return <p className="text-sambo-700/60">Chargement…</p>

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-sambo-950">Discussions</h1>
        <p className="mt-2 text-sambo-800/70">Fil réservé aux membres validés de SAMBO.</p>

        <form onSubmit={handleSubmitPost} className="mt-6 rounded-2xl border border-sambo-200/70 bg-white p-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Partagez quelque chose avec les membres…"
            rows={3}
            className="w-full resize-none rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || !newPost.trim()}
              className="rounded-xl bg-sambo-700 px-4 py-2 text-sm font-medium text-white hover:bg-sambo-800 disabled:opacity-60"
            >
              {posting ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-4">
          {posts.length === 0 && <p className="text-sambo-700/60">Aucune publication pour le moment.</p>}

          {posts.map((post) => {
            const author = authors[post.author_id]
            const isHidden = post.status === 'hidden'
            return (
              <div
                key={post.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  isHidden ? 'border-red-200 opacity-60' : 'border-sambo-200/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {author?.photo_url ? (
                    <img src={author.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sambo-100 text-sm font-semibold text-sambo-700">
                      {authorName(author).charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-sambo-950">{authorName(author)}</p>
                    <p className="text-xs text-sambo-700/60">{formatDate(post.created_at)}</p>
                  </div>
                  {isHidden && (
                    <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Masqué</span>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-line text-sm text-sambo-900/90">{post.content}</p>

                <div className="mt-3 flex items-center gap-4 text-xs text-sambo-700/60">
                  <button type="button" onClick={() => toggleExpand(post.id)} className="hover:underline">
                    {expanded[post.id] ? 'Masquer les commentaires' : 'Commentaires'}
                    {comments[post.id] ? ` (${comments[post.id].length})` : ''}
                  </button>
                  <button type="button" onClick={() => handleReport('posts', post.id)} className="hover:underline">
                    Signaler
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => toggleVisibility('posts', post.id, post.status)}
                      className="hover:underline"
                    >
                      {isHidden ? 'Réafficher' : 'Masquer (admin)'}
                    </button>
                  )}
                </div>

                {expanded[post.id] && (
                  <div className="mt-4 space-y-3 border-t border-sambo-100 pt-3">
                    {(comments[post.id] ?? []).map((c) => {
                      const cAuthor = authors[c.author_id]
                      const cHidden = c.status === 'hidden'
                      return (
                        <div key={c.id} className={cHidden ? 'opacity-60' : ''}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-sambo-950">{authorName(cAuthor)}</span>
                            <span className="text-xs text-sambo-700/50">{formatDate(c.created_at)}</span>
                            {cHidden && <span className="text-xs text-red-600">(masqué)</span>}
                          </div>
                          <p className="text-sm text-sambo-900/80">{c.content}</p>
                          <div className="mt-1 flex gap-3 text-xs text-sambo-700/50">
                            <button type="button" onClick={() => handleReport('comments', c.id)} className="hover:underline">
                              Signaler
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => toggleVisibility('comments', c.id, c.status)}
                                className="hover:underline"
                              >
                                {cHidden ? 'Réafficher' : 'Masquer'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    <div className="flex gap-2">
                      <input
                        value={commentDrafts[post.id] ?? ''}
                        onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                        placeholder="Répondre…"
                        className="flex-1 rounded-full border border-sambo-200 px-3 py-1.5 text-sm focus:border-sambo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitComment(post.id)}
                        className="rounded-full bg-sambo-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-sambo-800"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <UnpaidWall className="order-first h-72 lg:order-none lg:sticky lg:top-8 lg:h-[calc(100dvh-4rem)]" />
    </div>
  )
}
