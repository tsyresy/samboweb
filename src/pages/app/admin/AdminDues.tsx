import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DuesStatus, Profile } from '@/types'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const STATUS_OPTIONS: { value: DuesStatus; label: string }[] = [
  { value: 'impaye', label: 'Impayé' },
  { value: 'paye', label: 'Payé' },
  { value: 'exempte', label: 'Exempté' },
  { value: 'en_attente', label: 'En attente' },
]

interface RecordRow {
  id: string
  profile_id: string
  status: DuesStatus
  amount_paid: number | null
  payment_method: string | null
  reference: string | null
}

function fullName(p: Profile) {
  return [p.last_name, p.first_names].filter(Boolean).join(' ') || '(nom non renseigné)'
}

export function AdminDues() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [members, setMembers] = useState<Profile[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [ruleAmount, setRuleAmount] = useState('')
  const [ruleId, setRuleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingRule, setSavingRule] = useState(false)

  async function load() {
    setLoading(true)
    setError('')

    const [membersRes, recordsRes, ruleRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'valide').order('last_name'),
      supabase
        .from('dues_records')
        .select('id, profile_id, status, amount_paid, payment_method, reference')
        .eq('year', year)
        .eq('month', month),
      supabase
        .from('dues_rules')
        .select('id, amount')
        .eq('year', year)
        .eq('month', month)
        .is('category', null)
        .maybeSingle(),
    ])

    if (membersRes.error) {
      setError(membersRes.error.message)
      setLoading(false)
      return
    }

    setMembers(membersRes.data ?? [])
    setRecords(recordsRes.data ?? [])
    setRuleId(ruleRes.data?.id ?? null)
    setRuleAmount(ruleRes.data ? String(ruleRes.data.amount) : '')
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const recordByProfile = useMemo(() => {
    const map = new Map<string, RecordRow>()
    for (const r of records) map.set(r.profile_id, r)
    return map
  }, [records])

  async function saveRule() {
    const amount = Number(ruleAmount)
    if (Number.isNaN(amount) || amount < 0) return
    setSavingRule(true)

    if (ruleId) {
      await supabase.from('dues_rules').update({ amount }).eq('id', ruleId)
    } else {
      const { data } = await supabase
        .from('dues_rules')
        .insert({ year, month, amount })
        .select('id')
        .single()
      if (data) setRuleId(data.id)
    }

    setSavingRule(false)
  }

  async function updateRecordField(
    profileId: string,
    patch: Partial<Pick<RecordRow, 'status' | 'amount_paid' | 'payment_method' | 'reference'>>,
  ) {
    const existing = recordByProfile.get(profileId)

    // Upsert rather than a manual insert-vs-update branch: two fields on
    // the same not-yet-existing row can be edited in quick succession
    // (e.g. the status select, then the amount input's blur) before the
    // first write's result has refreshed local state, so a plain insert
    // for the second field would race and hit the (profile_id, year,
    // month) unique constraint. Upsert makes "create if missing,
    // otherwise update" atomic at the database level.
    const { error: upsertError } = await supabase.from('dues_records').upsert(
      {
        id: existing?.id,
        profile_id: profileId,
        year,
        month,
        rule_id: ruleId,
        ...patch,
      },
      { onConflict: 'profile_id,year,month' },
    )

    if (upsertError) {
      setError(upsertError.message)
      return
    }

    await load()
  }

  if (loading) return <p className="text-sambo-700/60">Chargement…</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Gestion des adidy</h1>
      <p className="mt-2 text-sambo-800/70">
        Le paiement se fait en interne avec le trésorier — enregistrez ici ce qui a été réglé.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-sambo-900" htmlFor="year">
            Année
          </label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-28 rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-sambo-900" htmlFor="month">
            Mois
          </label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-sambo-900" htmlFor="rule_amount">
            Montant du mois (Ar)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="rule_amount"
              type="number"
              value={ruleAmount}
              onChange={(e) => setRuleAmount(e.target.value)}
              className="w-32 rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={saveRule}
              disabled={savingRule}
              className="rounded-xl bg-sambo-700 px-4 py-2 text-sm font-medium text-white hover:bg-sambo-800 disabled:opacity-60"
            >
              {savingRule ? '…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sambo-200/70 bg-white">
        <table className="min-w-full divide-y divide-sambo-200/70 text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-sambo-700/60">
              <th className="px-4 py-3">Membre</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Montant payé</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Référence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sambo-200/70">
            {members.map((m) => {
              const record = recordByProfile.get(m.id)
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sambo-950">{fullName(m)}</p>
                    {m.member_number && <p className="text-xs text-sambo-700/60">{m.member_number}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={record?.status ?? 'impaye'}
                      onChange={(e) => updateRecordField(m.id, { status: e.target.value as DuesStatus })}
                      className="rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={record?.amount_paid ?? ''}
                      onBlur={(e) =>
                        updateRecordField(m.id, {
                          amount_paid: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-24 rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={record?.payment_method ?? ''}
                      onBlur={(e) => updateRecordField(m.id, { payment_method: e.target.value || null })}
                      className="w-28 rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={record?.reference ?? ''}
                      onBlur={(e) => updateRecordField(m.id, { reference: e.target.value || null })}
                      className="w-32 rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
