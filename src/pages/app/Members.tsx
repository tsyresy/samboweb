import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MembershipCategory } from '@/types'

interface DirectoryEntry {
  id: string
  member_number: string | null
  last_name: string | null
  first_names: string | null
  nickname: string | null
  category: MembershipCategory
  photo_url: string | null
  phone: string | null
  email: string | null
}

const CATEGORY_LABELS: Record<MembershipCategory, string> = {
  membre_standard: 'Membre standard',
  membre_bureau: 'Membre de bureau',
  sojabe: 'Sojabe',
  partenaire: 'Partenaire',
  sponsor: 'Sponsor',
}

function fullName(m: DirectoryEntry) {
  return [m.last_name, m.first_names].filter(Boolean).join(' ') || '(nom non renseigné)'
}

export function Members() {
  const [members, setMembers] = useState<DirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('directory_profiles')
      .select('*')
      .then(({ data, error: fetchError }) => {
        setLoading(false)
        if (fetchError) {
          setError(fetchError.message)
          return
        }
        setMembers(data ?? [])
      })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) =>
      [m.last_name, m.first_names, m.nickname, m.member_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [members, search])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Annuaire des membres</h1>
      <p className="mt-2 text-sambo-800/70">
        Recherchez un membre par nom, prénom, surnom ou numéro de membre.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher…"
        className="mt-6 w-full max-w-sm rounded-full border border-sambo-200 px-4 py-2 text-sm focus:border-sambo-500 focus:outline-none"
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sambo-700/60">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sambo-700/60">Aucun membre trouvé.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-2xl border border-sambo-200/70 bg-white p-4 shadow-sm"
            >
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sambo-100 text-lg font-semibold text-sambo-700">
                  {fullName(m).charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-sambo-950">{fullName(m)}</p>
                {m.nickname && <p className="truncate text-xs text-sambo-700/60">« {m.nickname} »</p>}
                <p className="text-xs text-sambo-700/60">{CATEGORY_LABELS[m.category]}</p>
                {m.phone && <p className="mt-1 text-xs text-sambo-800/80">{m.phone}</p>}
                {m.email && <p className="truncate text-xs text-sambo-800/80">{m.email}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
