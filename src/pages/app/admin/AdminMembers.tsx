import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AccessLevel, MembershipCategory, Profile, ValidationStatus } from '@/types'
import { ACCESS_LEVEL_LABELS, CATEGORY_LABELS } from '@/lib/membership'

interface OfficePosition {
  id: string
  title: string
}

interface PositionAssignment {
  id: string
  profile_id: string
  position_id: string
}

const STATUS_FILTERS: { value: ValidationStatus | 'tous'; label: string }[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'valide', label: 'Validés' },
  { value: 'suspendu', label: 'Suspendus' },
  { value: 'refuse', label: 'Refusés' },
  { value: 'tous', label: 'Tous' },
]

function fullName(p: Profile) {
  const name = [p.last_name, p.first_names].filter(Boolean).join(' ')
  return name || '(nom non renseigné)'
}

async function nextMemberNumber(): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('member_number')
    .not('member_number', 'is', null)
    .order('member_number', { ascending: false })
    .limit(1)

  const last = data?.[0]?.member_number ?? ''
  const lastDigits = Number.parseInt(last.replace(/\D/g, ''), 10)
  const next = Number.isFinite(lastDigits) ? lastDigits + 1 : 1
  return `SAMBO-${String(next).padStart(4, '0')}`
}

export function AdminMembers() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [positions, setPositions] = useState<OfficePosition[]>([])
  const [assignments, setAssignments] = useState<PositionAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | 'tous'>('en_attente')
  const [search, setSearch] = useState('')

  async function loadAll() {
    setLoading(true)
    setError('')

    const [profilesRes, positionsRes, assignmentsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('office_positions').select('id, title').order('title'),
      supabase.from('position_assignments').select('id, profile_id, position_id').is('end_date', null),
    ])

    if (profilesRes.error) {
      setError(profilesRes.error.message)
      setLoading(false)
      return
    }

    setProfiles(profilesRes.data ?? [])
    setPositions(positionsRes.data ?? [])
    setAssignments(assignmentsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const assignmentByProfile = useMemo(() => {
    const map = new Map<string, PositionAssignment>()
    for (const a of assignments) map.set(a.profile_id, a)
    return map
  }, [assignments])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return profiles.filter((p) => {
      if (statusFilter !== 'tous' && p.status !== statusFilter) return false
      if (!q) return true
      const haystack = [p.last_name, p.first_names, p.nickname, p.email, p.member_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [profiles, statusFilter, search])

  function patchLocalProfile(id: string, patch: Partial<Profile>) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  async function setStatus(profile: Profile, status: ValidationStatus) {
    setBusyId(profile.id)
    setError('')

    const patch: Partial<Profile> = { status }
    if (status === 'valide' && !profile.member_number) {
      patch.member_number = await nextMemberNumber()
    }

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', profile.id)
      .select()
      .single()

    setBusyId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    if (data) patchLocalProfile(profile.id, data)
  }

  async function setCategory(profile: Profile, category: MembershipCategory) {
    setBusyId(profile.id)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ category })
      .eq('id', profile.id)
    setBusyId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    patchLocalProfile(profile.id, { category })
  }

  async function setAccessLevel(profile: Profile, access_level: AccessLevel) {
    setBusyId(profile.id)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ access_level })
      .eq('id', profile.id)
    setBusyId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }
    patchLocalProfile(profile.id, { access_level })
  }

  async function assignPosition(profile: Profile, positionId: string) {
    setBusyId(profile.id)
    setError('')

    const current = assignmentByProfile.get(profile.id)
    if (current) {
      const { error: endError } = await supabase
        .from('position_assignments')
        .update({ end_date: new Date().toISOString().slice(0, 10) })
        .eq('id', current.id)
      if (endError) {
        setBusyId(null)
        setError(endError.message)
        return
      }
    }

    if (positionId) {
      const { error: insertError } = await supabase
        .from('position_assignments')
        .insert({ profile_id: profile.id, position_id: positionId })
      if (insertError) {
        setBusyId(null)
        setError(insertError.message)
        return
      }
    }

    await loadAll()
    setBusyId(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Gestion des membres</h1>
      <p className="mt-2 text-ink-muted">
        Validez les candidatures, attribuez les catégories et les fonctions du bureau.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-line glass p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-accent-strong text-on-accent font-semibold'
                  : 'text-ink-muted hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, numéro…"
          className="flex-1 min-w-[220px] rounded-full px-4 py-1.5 text-sm field"
        />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="mt-8 text-ink-subtle">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-ink-subtle">Aucun membre pour ce filtre.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line glass">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                <th className="px-4 py-3">Membre</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Fonction</th>
                <th className="px-4 py-3">Accès</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const isBusy = busyId === p.id
                const currentPositionId = assignmentByProfile.get(p.id)?.position_id ?? ''

                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-ink">{fullName(p)}</p>
                      {p.nickname && <p className="text-xs text-ink-subtle">« {p.nickname} »</p>}
                      <p className="text-xs text-ink-subtle">{p.email}</p>
                      {p.member_number && (
                        <p className="mt-1 text-xs font-medium text-accent">{p.member_number}</p>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <select
                        value={p.category}
                        disabled={isBusy}
                        onChange={(e) => setCategory(p, e.target.value as MembershipCategory)}
                        className="rounded-lg px-2 py-1 text-sm field"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <select
                        value={currentPositionId}
                        disabled={isBusy}
                        onChange={(e) => assignPosition(p, e.target.value)}
                        className="rounded-lg px-2 py-1 text-sm field"
                      >
                        <option value="">— Aucune —</option>
                        {positions.map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.title}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <select
                        value={p.access_level}
                        disabled={isBusy}
                        onChange={(e) => setAccessLevel(p, e.target.value as AccessLevel)}
                        className="rounded-lg px-2 py-1 text-sm field"
                      >
                        {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.status === 'valide'
                            ? 'bg-white/10 text-accent'
                            : p.status === 'en_attente'
                              ? 'bg-gold-400/20 text-gold-300'
                              : 'bg-red-500/15 text-danger'
                        }`}
                      >
                        {STATUS_FILTERS.find((f) => f.value === p.status)?.label ?? p.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        {p.status === 'en_attente' && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setStatus(p, 'valide')}
                              className="rounded-lg btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setStatus(p, 'refuse')}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium btn-glass disabled:opacity-50"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        {p.status === 'valide' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setStatus(p, 'suspendu')}
                            className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Suspendre
                          </button>
                        )}
                        {(p.status === 'suspendu' || p.status === 'refuse') && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setStatus(p, 'valide')}
                            className="rounded-lg btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                          >
                            Réactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
