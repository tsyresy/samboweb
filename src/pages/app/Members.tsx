import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MembershipCategory } from '@/types'
import { CATEGORY_LABELS } from '@/lib/membership'

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

function fullName(m: DirectoryEntry) {
  return [m.last_name, m.first_names].filter(Boolean).join(' ') || '(nom non renseigné)'
}

export function Members() {
  const [members, setMembers] = useState<DirectoryEntry[]>([])
  const [positions, setPositions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<MembershipCategory | ''>('')

  useEffect(() => {
    Promise.all([
      supabase.from('directory_profiles').select('*'),
      supabase.from('public_office_team').select('profile_id, position_title'),
    ]).then(([membersRes, positionsRes]) => {
      setLoading(false)
      if (membersRes.error) {
        setError(membersRes.error.message)
        return
      }
      setMembers(membersRes.data ?? [])
      const posMap: Record<string, string> = {}
      for (const p of positionsRes.data ?? []) posMap[p.profile_id] = p.position_title
      setPositions(posMap)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
      if (category && m.category !== category) return false
      if (!q) return true
      const haystack = [m.last_name, m.first_names, m.nickname, m.member_number, positions[m.id]]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [members, search, category, positions])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Annuaire des membres</h1>
      <p className="mt-2 text-sambo-800/70">
        Recherchez un membre par nom, prénom, surnom, numéro ou fonction.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full max-w-sm rounded-full border border-sambo-200 px-4 py-2 text-sm focus:border-sambo-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MembershipCategory | '')}
          className="rounded-full border border-sambo-200 px-4 py-2 text-sm focus:border-sambo-500 focus:outline-none"
        >
          <option value="">Toutes catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

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
                <p className="text-xs text-sambo-700/60">
                  {positions[m.id] ?? CATEGORY_LABELS[m.category]}
                </p>
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
