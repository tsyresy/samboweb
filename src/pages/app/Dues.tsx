import { useEffect, useMemo, useState } from 'react'
import { PaymentFrequencyChart } from '@/components/PaymentFrequencyChart'
import { useAuth } from '@/context/auth'
import {
  DEFAULT_DUES_AMOUNT,
  DUES_STATUS_LABELS,
  fetchMyDuesTotal,
  formatAr,
  MONTH_NAMES,
  type DuesTotal,
} from '@/lib/dues'
import { supabase } from '@/lib/supabase'
import type { DuesStatus, MembershipCategory } from '@/types'

const STATUS_STYLES: Record<DuesStatus, string> = {
  paye: 'bg-white/10 text-accent',
  impaye: 'bg-red-500/15 text-danger',
  exempte: 'bg-white/10 text-accent',
  en_attente: 'bg-gold-400/20 text-gold-300',
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

export function Dues() {
  const { profile } = useAuth()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [rules, setRules] = useState<RuleRow[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [totalDue, setTotalDue] = useState<DuesTotal | null>(null)
  // Year whose data is on screen; anything else means it is still loading.
  const [loadedYear, setLoadedYear] = useState<number | null>(null)
  const loading = loadedYear !== year

  useEffect(() => {
    if (!profile) return
    let cancelled = false

    Promise.all([
      supabase.from('dues_rules').select('month, category, amount, currency').eq('year', year),
      supabase
        .from('dues_records')
        .select('month, status, amount_paid, payment_date')
        .eq('profile_id', profile.id)
        .eq('year', year),
      fetchMyDuesTotal(),
    ]).then(([rulesRes, recordsRes, total]) => {
      if (cancelled) return
      setRules(rulesRes.data ?? [])
      setRecords(recordsRes.data ?? [])
      setTotalDue(total)
      setLoadedYear(year)
    })
    return () => {
      cancelled = true
    }
  }, [profile, year])

  // Mirrors the unpaid_dues_detail view (migration 0010): this year,
  // every month up to now is due at the rule's amount or the default;
  // earlier years only for months that had an amount set.
  const monthly = useMemo(() => {
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const rule =
        rules.find((r) => r.month === month && r.category === profile?.category) ??
        rules.find((r) => r.month === month && r.category === null)
      const record = records.find((r) => r.month === month)
      const amount = rule ? rule.amount : year >= nowYear ? DEFAULT_DUES_AMOUNT : null
      const isPast = year < nowYear || (year === nowYear && month <= nowMonth)
      const status: DuesStatus | null =
        record?.status ?? (isPast && amount !== null && amount > 0 ? 'impaye' : null)
      return { month, rule, amount, status }
    })
  }, [rules, records, profile, year])

  if (!profile || loading) {
    return <p className="text-ink-subtle">Chargement…</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Mes adidy</h1>
      <p className="mt-2 text-ink-muted">
        Suivi de vos cotisations mensuelles. Le paiement se fait auprès du trésorier — l'admin
        marque ici ce qui a été réglé.
      </p>

      {totalDue && (
        <div
          className={`mt-6 rounded-2xl border p-5 ${
            totalDue.amount > 0 ? 'border-red-400/30 bg-red-500/10' : 'border-line bg-white/[0.06]'
          }`}
        >
          <p className="text-sm font-medium text-ink-muted">Total dû à ce jour</p>
          <p className={`mt-1 text-3xl font-bold ${totalDue.amount > 0 ? 'text-danger' : 'text-accent'}`}>
            {formatAr(totalDue.amount)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {totalDue.months > 0
              ? `${totalDue.months} mois impayé${totalDue.months > 1 ? 's' : ''}, toutes années confondues.`
              : 'Vous êtes à jour. Misaotra !'}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="rounded-full px-3 py-1 text-sm btn-glass"
        >
          ←
        </button>
        <span className="text-sm font-medium text-ink">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="rounded-full px-3 py-1 text-sm btn-glass"
        >
          →
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {monthly.map(({ month, rule, amount, status }) => (
          <div
            key={month}
            className="flex items-center justify-between rounded-xl border border-line glass p-4"
          >
            <div>
              <p className="font-medium text-ink">{MONTH_NAMES[month - 1]}</p>
              <p className="text-xs text-ink-subtle">
                {amount === null ? '—' : amount === 0 ? 'Gratuit' : formatAr(amount)}
                {!rule && amount !== null && ' (par défaut)'}
              </p>
            </div>
            {status && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
                {DUES_STATUS_LABELS[status]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12">
        <PaymentFrequencyChart />
      </div>
    </div>
  )
}
