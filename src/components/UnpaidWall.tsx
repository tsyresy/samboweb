import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UnpaidMember {
  id: string
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
  unpaid_months: number
}

// Below this many cards per loop, the list is repeated so the scroll
// never shows a gap in the middle of the column.
const MIN_CARDS_PER_LOOP = 8

function fullName(m: UnpaidMember) {
  return [m.last_name, m.first_names].filter(Boolean).join(' ') || 'Membre'
}

function UnpaidCard({ member }: { member: UnpaidMember }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-400/30 glass p-3">
      {member.photo_url ? (
        <img src={member.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-red-400/30" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-lg font-semibold text-danger ring-2 ring-red-400/30">
          {fullName(member).charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{fullName(member)}</p>
        {member.nickname && <p className="truncate text-xs text-ink-subtle">« {member.nickname} »</p>}
        <p className="mt-0.5 text-xs font-medium text-danger">
          {member.unpaid_months} mois impayé{member.unpaid_months > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

/**
 * "Membres TSY NAHALOHA ADIDY" — an endlessly scrolling column of every
 * validated member with at least one unpaid adidy up to today (see the
 * unpaid_members view, migration 0008). Names, photos and a month count
 * only, never amounts. Hovering pauses the scroll so a card can be read.
 */
export function UnpaidWall({ className = '' }: { className?: string }) {
  const [members, setMembers] = useState<UnpaidMember[] | null>(null)

  useEffect(() => {
    supabase
      .from('unpaid_members')
      .select('id, last_name, first_names, nickname, photo_url, unpaid_months')
      .order('unpaid_months', { ascending: false })
      .then(({ data }) => setMembers(data ?? []))
  }, [])

  const repeats = members?.length ? Math.ceil(MIN_CARDS_PER_LOOP / members.length) : 0
  const loop = Array.from({ length: repeats }, () => members ?? []).flat()
  // ~3.5s per card keeps the pace readable regardless of list length.
  const duration = `${Math.max(loop.length * 3.5, 20)}s`

  return (
    <aside className={`flex flex-col overflow-hidden rounded-3xl border border-red-400/30 bg-red-500/10 ${className}`}>
      <div className="border-b border-red-400/30 glass-strong px-4 py-4 text-center">
        <h2 className="text-xl leading-tight font-extrabold tracking-tight text-danger uppercase">
          Membres TSY NAHALOHA ADIDY
        </h2>
        <p className="mt-1 text-xs text-ink-muted">Cotisations non réglées à la date du jour</p>
      </div>

      {members === null ? (
        <p className="p-4 text-center text-sm text-ink-subtle">Chargement…</p>
      ) : members.length === 0 ? (
        <p className="p-6 text-center text-sm font-medium text-accent">
          Tout le monde est à jour. Misaotra betsaka !
        </p>
      ) : (
        <div className="scroll-wall relative min-h-0 flex-1 overflow-hidden motion-reduce:overflow-y-auto">
          <div
            className="animate-scroll-up flex flex-col gap-3 p-3 motion-reduce:animate-none"
            style={{ ['--scroll-duration' as string]: duration }}
          >
            {/* Two identical halves: translating by -50% lands exactly where
                it started, which is what makes the loop seamless. */}
            {[0, 1].map((half) =>
              loop.map((m, i) => (
                <div key={`${half}-${i}-${m.id}`} aria-hidden={half === 1 || i >= members.length}>
                  <UnpaidCard member={m} />
                </div>
              )),
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
