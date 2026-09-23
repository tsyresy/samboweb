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

  async function load() {
    setLoading(true)
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

  if (loading) return <p className="text-sambo-700/60">Chargement…</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Contenus et messages</h1>
      <p className="mt-2 text-sambo-800/70">Signalements des discussions internes.</p>

      {reports.length === 0 ? (
        <p className="mt-8 text-sambo-700/60">Aucun signalement.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((r) => {
            const target = targets[r.target_id]
            return (
              <div
                key={r.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  r.status === 'nouveau' ? 'border-gold-400/60' : 'border-sambo-200/70 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-sambo-700/60">
                    {r.target_table === 'posts' ? 'Publication' : 'Commentaire'} — {r.status === 'nouveau' ? 'nouveau' : 'traité'}
                  </span>
                  <span className="text-xs text-sambo-700/50">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-sambo-900/90">
                  <span className="font-medium">Motif : </span>
                  {r.reason}
                </p>
                {target && (
                  <p className="mt-1 rounded-lg bg-sambo-50 p-2 text-sm text-sambo-800/80">
                    « {target.content} » {target.status === 'hidden' && <em>(déjà masqué)</em>}
                  </p>
                )}
                {r.status === 'nouveau' && (
                  <div className="mt-3 flex gap-2">
                    {target?.status !== 'hidden' && (
                      <button
                        type="button"
                        onClick={() => hideContent(r)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Masquer le contenu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissReport(r)}
                      className="rounded-lg border border-sambo-200 px-3 py-1.5 text-xs font-medium text-sambo-900 hover:bg-sambo-100"
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
