import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { DuesStatus, MembershipCategory } from '@/types'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const STATUS_LABELS: Record<DuesStatus, string> = {
  paye: 'Payé',
  impaye: 'Impayé',
  exempte: 'Exempté',
  en_attente: 'En attente',
}

const STATUS_STYLES: Record<DuesStatus, string> = {
  paye: 'bg-sambo-100 text-sambo-700',
  impaye: 'bg-red-100 text-red-700',
  exempte: 'bg-sambo-100 text-sambo-700',
  en_attente: 'bg-gold-400/20 text-gold-600',
}

interface RuleRow {
  month: number
  category: MembershipCategory | null
  amount: number
  currency: string
}

interface RecordRow {
  month: number
  status: DuesStatus
  amount_paid: number | null
  payment_date: string | null
}

interface UnpaidMember {
  id: string
  member_number: string | null
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
  category: MembershipCategory
}

function fullName(m: UnpaidMember) {
  return [m.last_name, m.first_names].filter(Boolean).join(' ') || '(nom non renseigné)'
}

export function Dues() {
  const { profile } = useAuth()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [rules, setRules] = useState<RuleRow[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [unpaid, setUnpaid] = useState<UnpaidMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    setLoading(true)

    Promise.all([
      supabase.from('dues_rules').select('month, category, amount, currency').eq('year', year),
      supabase
        .from('dues_records')
        .select('month, status, amount_paid, payment_date')
        .eq('profile_id', profile.id)
        .eq('year', year),
      supabase.from('unpaid_members').select('*'),
    ]).then(([rulesRes, recordsRes, unpaidRes]) => {
      setRules(rulesRes.data ?? [])
      setRecords(recordsRes.data ?? [])
      setUnpaid(unpaidRes.data ?? [])
      setLoading(false)
    })
  }, [profile, year])

  const monthly = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const rule =
        rules.find((r) => r.month === month && r.category === profile?.category) ??
        rules.find((r) => r.month === month && r.category === null)
      const record = records.find((r) => r.month === month)
      return { month, rule, record }
    })
  }, [rules, records, profile])

  if (!profile || loading) {
    return <p className="text-sambo-700/60">Chargement…</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Mes adidy</h1>
      <p className="mt-2 text-sambo-800/70">
        Suivi de vos cotisations mensuelles. Le paiement se fait auprès du trésorier — l'admin
        marque ici ce qui a été réglé.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="rounded-full border border-sambo-200 px-3 py-1 text-sm text-sambo-900 hover:bg-sambo-100"
        >
          ←
        </button>
        <span className="text-sm font-medium text-sambo-950">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="rounded-full border border-sambo-200 px-3 py-1 text-sm text-sambo-900 hover:bg-sambo-100"
        >
          →
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {monthly.map(({ month, rule, record }) => {
          const status = record?.status ?? (rule ? 'impaye' : null)
          return (
            <div
              key={month}
              className="flex items-center justify-between rounded-xl border border-sambo-200/70 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-sambo-950">{MONTH_NAMES[month - 1]}</p>
                <p className="text-xs text-sambo-700/60">
                  {rule ? `${rule.amount.toLocaleString('fr-FR')} ${rule.currency}` : 'Montant non défini'}
                </p>
              </div>
              {status && (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {unpaid.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-sambo-950">Membres avec des cotisations impayées</h2>
          <p className="mt-1 text-sm text-sambo-700/60">
            Liste visible par tous les membres, sans les montants ni détails de paiement.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unpaid.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-sambo-200/70 bg-white p-4 shadow-sm"
              >
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sambo-100 text-base font-semibold text-sambo-700">
                    {fullName(m).charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sambo-950">{fullName(m)}</p>
                  {m.nickname && <p className="truncate text-xs text-sambo-700/60">« {m.nickname} »</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
