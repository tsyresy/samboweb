import { useEffect, useRef, useState } from 'react'
import { DUES_STATUS_LABELS, formatAr, MONTH_NAMES } from '@/lib/dues'
import { ACCESS_LEVEL_LABELS, categoryLabel, VALIDATION_STATUS_LABELS } from '@/lib/membership'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 50

type Filter = 'all' | 'profiles' | 'dues_records' | 'dues_rules'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'profiles', label: 'Membres' },
  { value: 'dues_records', label: "Paiements d'adidy" },
  { value: 'dues_rules', label: 'Montants du mois' },
]

interface Change {
  from: unknown
  to: unknown
}

interface Context {
  profile_id?: string
  year?: number
  month?: number
  category?: string | null
}

interface LogRow {
  id: string
  actor_user_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

interface Person {
  id: string
  user_id: string
  last_name: string | null
  first_names: string | null
}

const FIELD_LABELS: Record<string, string> = {
  status: 'Statut',
  category: 'Catégorie',
  access_level: "Niveau d'accès",
  member_number: 'N° membre',
  amount_paid: 'Montant payé',
  payment_date: 'Date de paiement',
  payment_method: 'Mode',
  reference: 'Référence',
  note: 'Note',
  amount: 'Montant',
}

function personName(p: Person | undefined) {
  if (!p) return 'Un membre supprimé'
  return [p.last_name, p.first_names].filter(Boolean).join(' ') || '(nom non renseigné)'
}

/** « de Rakoto Jean », or « d'un membre supprimé » when the profile is gone. */
function ofPerson(p: Person | undefined) {
  if (!p) return <>d'un membre supprimé</>
  return <>de <strong>{personName(p)}</strong></>
}

function period(ctx: Context | undefined) {
  if (!ctx?.month || !ctx.year) return 'un mois inconnu'
  return `${MONTH_NAMES[ctx.month - 1].toLowerCase()} ${ctx.year}`
}

function formatValue(table: string | null, field: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  const text = String(value)
  if (field === 'amount_paid' || field === 'amount') return formatAr(Number(value))
  if (field === 'payment_date') return new Date(`${text}T00:00:00`).toLocaleDateString('fr-FR')
  if (field === 'category') return categoryLabel(text)
  if (field === 'access_level') return ACCESS_LEVEL_LABELS[text as keyof typeof ACCESS_LEVEL_LABELS] ?? text
  if (field === 'status') {
    const labels: Record<string, string> = table === 'profiles' ? VALIDATION_STATUS_LABELS : DUES_STATUS_LABELS
    return labels[text] ?? text
  }
  return text
}

function changesOf(row: LogRow): [string, Change][] {
  return Object.entries(row.metadata ?? {}).filter(
    (entry): entry is [string, Change] => entry[0] !== 'context' && typeof entry[1] === 'object' && entry[1] !== null,
  )
}

export function AdminAudit() {
  const [filter, setFilter] = useState<Filter>('all')
  const [rows, setRows] = useState<LogRow[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  // People by profile id and by auth user id (actors are logged by user id).
  const [byProfile, setByProfile] = useState<Record<string, Person>>({})
  const [byUser, setByUser] = useState<Record<string, Person>>({})
  // Entries logged before migration 0012 carry no context: looked up here.
  const [recordContext, setRecordContext] = useState<Record<string, Context>>({})
  const requestId = useRef(0)

  async function fetchPage(offset: number) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE)
    if (filter !== 'all') query = query.eq('target_table', filter)
    return query
  }

  async function resolve(newRows: LogRow[]) {
    const legacyRecordIds = newRows
      .filter((r) => r.target_table === 'dues_records' && r.target_id && !r.metadata?.context)
      .map((r) => r.target_id!)
    const contexts: Record<string, Context> = {}
    if (legacyRecordIds.length) {
      const { data } = await supabase
        .from('dues_records')
        .select('id, profile_id, year, month')
        .in('id', legacyRecordIds)
      for (const r of data ?? []) contexts[r.id] = { profile_id: r.profile_id, year: r.year, month: r.month }
    }

    const profileIds = new Set<string>()
    const userIds = new Set<string>()
    for (const r of newRows) {
      if (r.actor_user_id) userIds.add(r.actor_user_id)
      if (r.target_table === 'profiles' && r.target_id) profileIds.add(r.target_id)
      const ctx = (r.metadata?.context as Context | undefined) ?? (r.target_id ? contexts[r.target_id] : undefined)
      if (ctx?.profile_id) profileIds.add(ctx.profile_id)
    }

    const filters = [
      profileIds.size ? `id.in.(${[...profileIds].join(',')})` : null,
      userIds.size ? `user_id.in.(${[...userIds].join(',')})` : null,
    ].filter(Boolean)
    const people: Person[] = []
    if (filters.length) {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, last_name, first_names')
        .or(filters.join(','))
      people.push(...(data ?? []))
    }
    return { contexts, people }
  }

  function merge(contexts: Record<string, Context>, people: Person[]) {
    setRecordContext((prev) => ({ ...prev, ...contexts }))
    setByProfile((prev) => ({ ...prev, ...Object.fromEntries(people.map((p) => [p.id, p])) }))
    setByUser((prev) => ({ ...prev, ...Object.fromEntries(people.map((p) => [p.user_id, p])) }))
  }

  useEffect(() => {
    const current = ++requestId.current
    setLoading(true)
    setError('')
    ;(async () => {
      const { data, error: fetchError } = await fetchPage(0)
      if (current !== requestId.current) return
      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }
      const page = (data ?? []) as LogRow[]
      const visible = page.slice(0, PAGE_SIZE)
      const { contexts, people } = await resolve(visible)
      if (current !== requestId.current) return
      merge(contexts, people)
      setRows(visible)
      setHasMore(page.length > PAGE_SIZE)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function loadMore() {
    const current = requestId.current
    setLoadingMore(true)
    const { data, error: fetchError } = await fetchPage(rows.length)
    if (current !== requestId.current) return
    if (fetchError) {
      setError(fetchError.message)
      setLoadingMore(false)
      return
    }
    const page = (data ?? []) as LogRow[]
    const visible = page.slice(0, PAGE_SIZE)
    const { contexts, people } = await resolve(visible)
    if (current !== requestId.current) return
    merge(contexts, people)
    setRows((prev) => [...prev, ...visible])
    setHasMore(page.length > PAGE_SIZE)
    setLoadingMore(false)
  }

  function describe(row: LogRow) {
    const ctx = (row.metadata?.context as Context | undefined) ?? (row.target_id ? recordContext[row.target_id] : undefined)
    switch (row.action) {
      case 'profile_updated':
        return <>a modifié le profil {ofPerson(byProfile[row.target_id ?? ''])}</>
      case 'dues_record_created':
        return <>a enregistré l'adidy de {period(ctx)} {ofPerson(byProfile[ctx?.profile_id ?? ''])}</>
      case 'dues_record_updated':
        return <>a corrigé l'adidy de {period(ctx)} {ofPerson(byProfile[ctx?.profile_id ?? ''])}</>
      case 'dues_rule_created':
        return <>a fixé le montant de {period(ctx)}</>
      case 'dues_rule_updated':
        return <>a modifié le montant de {period(ctx)}</>
      case 'dues_rule_deleted':
        return <>a remis le montant de {period(ctx)} au montant par défaut</>
      default:
        return <>{row.action}</>
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Journal d'audit</h1>
      <p className="mt-2 text-sambo-800/70">
        Qui a changé quoi, et quand : validations et rôles des membres, paiements d'adidy, montants mensuels. Le
        journal est rempli par la base de données elle-même et ne peut pas être modifié.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer le journal">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={
              filter === f.value
                ? 'rounded-full bg-sambo-700 px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-sambo-200 bg-white px-4 py-1.5 text-sm font-medium text-sambo-800 hover:bg-sambo-50'
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sambo-700/60">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-sambo-200 bg-white p-6 text-sm text-sambo-700/70">
          Aucune entrée pour ce filtre.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-sambo-200/70 rounded-2xl border border-sambo-200/70 bg-white">
          {rows.map((row) => {
            const changes = changesOf(row)
            const actor = row.actor_user_id ? byUser[row.actor_user_id] : undefined
            return (
              <li key={row.id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <p className="text-sm text-sambo-900">
                    <strong>{row.actor_user_id ? personName(actor) : 'Système'}</strong> {describe(row)}
                  </p>
                  <time dateTime={row.created_at} className="shrink-0 text-xs tabular-nums text-sambo-700/60">
                    {new Date(row.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </time>
                </div>
                {changes.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-sm text-sambo-800/80">
                    {changes.map(([field, change]) => (
                      <li key={field} className="break-words">
                        <span className="text-sambo-700/60">{FIELD_LABELS[field] ?? field} :</span>{' '}
                        {formatValue(row.target_table, field, change.from)} →{' '}
                        <span className="font-medium text-sambo-950">{formatValue(row.target_table, field, change.to)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {!loading && hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 rounded-xl border border-sambo-200 bg-white px-4 py-2 text-sm font-medium text-sambo-800 hover:bg-sambo-50 disabled:opacity-60"
        >
          {loadingMore ? 'Chargement…' : 'Afficher plus'}
        </button>
      )}
    </div>
  )
}
