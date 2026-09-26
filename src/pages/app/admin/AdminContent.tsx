import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ReportRow {
  id: string
  reporter_id: string
  target_table: 'posts' | 'comments'
  target_id: string
  reason: string
  status: 'nouveau' | 'traite'
  created_at: string
}

interface TargetContent {
  content: string
  status: 'visible' | 'hidden'
}

export function AdminContent() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [targets, setTargets] = useState<Record<string, TargetContent>>({})
  const [loading, setLoading] = useState(true)

  // Also used to refresh after an action: no loading state, the list
  // stays in place.
  async function load() {
    const { data } = await supabase
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: false })

    const rows = data ?? []
    setReports(rows)

    const byTable: Record<'posts' | 'comments', string[]> = { posts: [], comments: [] }
    for (const r of rows) byTable[r.target_table].push(r.target_id)

    const [postsRes, commentsRes] = await Promise.all([
      byTable.posts.length
        ? supabase.from('posts').select('id, content, status').in('id', byTable.posts)
        : Promise.resolve({ data: [] }),
      byTable.comments.length
        ? supabase.from('comments').select('id, content, status').in('id', byTable.comments)
        : Promise.resolve({ data: [] }),
    ])

    const map: Record<string, TargetContent> = {}
    for (const p of postsRes.data ?? []) map[p.id] = { content: p.content, status: p.status }
    for (const c of commentsRes.data ?? []) map[c.id] = { content: c.content, status: c.status }
    setTargets(map)
    setLoading(false)
  }

  useEffect(() => {
    // False positive: the function awaits the server before any setState.
    // oxlint-disable-next-line react/set-state-in-effect
    load()
  }, [])

  async function hideContent(report: ReportRow) {
    await supabase.from(report.target_table).update({ status: 'hidden' }).eq('id', report.target_id)
    await supabase.from('content_reports').update({ status: 'traite' }).eq('id', report.id)
    await load()
  }

  async function dismissReport(report: ReportRow) {
    await supabase.from('content_reports').update({ status: 'traite' }).eq('id', report.id)
    await load()
  }

  if (loading) return <p className="text-ink-subtle">Chargement…</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Contenus et messages</h1>
      <p className="mt-2 text-ink-muted">Signalements des discussions internes.</p>

      {reports.length === 0 ? (
        <p className="mt-8 text-ink-subtle">Aucun signalement.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((r) => {
            const target = targets[r.target_id]
            return (
              <div
                key={r.id}
                className={`rounded-2xl border glass p-4 ${
                  r.status === 'nouveau' ? 'border-gold-400/60' : 'border-line opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    {r.target_table === 'posts' ? 'Publication' : 'Commentaire'} — {r.status === 'nouveau' ? 'nouveau' : 'traité'}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink">
                  <span className="font-medium">Motif : </span>
                  {r.reason}
                </p>
                {target && (
                  <p className="mt-1 rounded-lg bg-white/[0.04] p-2 text-sm text-ink-muted">
                    « {target.content} » {target.status === 'hidden' && <em>(déjà masqué)</em>}
                  </p>
                )}
                {r.status === 'nouveau' && (
                  <div className="mt-3 flex gap-2">
                    {target?.status !== 'hidden' && (
                      <button
                        type="button"
                        onClick={() => hideContent(r)}
                        className="btn-danger rounded-lg px-3 py-1.5 text-xs"
                      >
                        Masquer le contenu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissReport(r)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium btn-glass"
                    >
                      Marquer traité
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
