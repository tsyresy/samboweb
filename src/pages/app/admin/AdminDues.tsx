import { useEffect, useMemo, useRef, useState } from 'react'
import { downloadCsv, type CsvCell } from '@/lib/csv'
import { DEFAULT_DUES_AMOUNT, DUES_STATUS_LABELS, formatAr, MONTH_NAMES } from '@/lib/dues'
import { categoryLabel } from '@/lib/membership'
import { supabase } from '@/lib/supabase'
import type { DuesStatus, Profile } from '@/types'

const STATUS_OPTIONS = Object.entries(DUES_STATUS_LABELS) as [DuesStatus, string][]

interface RecordRow {
  id: string
  profile_id: string
  status: DuesStatus
  amount_paid: number | null
  payment_date: string | null
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
  const [savedRuleAmount, setSavedRuleAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingRule, setSavingRule] = useState(false)
  const [exporting, setExporting] = useState(false)
  // Answers to an older request (month changed meanwhile) are dropped.
  const requestId = useRef(0)

  // `refresh` reloads after a save without swapping the table for the
  // loading message, so the admin keeps focus while tabbing through a row.
  async function load({ refresh = false } = {}) {
    const current = ++requestId.current
    if (!refresh) setLoading(true)
    setError('')

    const [membersRes, recordsRes, ruleRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('status', 'valide').order('last_name'),
      supabase
        .from('dues_records')
        .select('id, profile_id, status, amount_paid, payment_date, payment_method, reference')
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

    if (current !== requestId.current) return

    if (membersRes.error) {
      setError(membersRes.error.message)
      setLoading(false)
      return
    }

    setMembers(membersRes.data ?? [])
    setRecords(recordsRes.data ?? [])
    setRuleId(ruleRes.data?.id ?? null)
    setSavedRuleAmount(ruleRes.data ? Number(ruleRes.data.amount) : null)
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
    setSavingRule(true)
    setError('')

    // An emptied field means "no specific amount": drop the rule so the
    // month falls back to the default, instead of Number('') silently
    // saving it as 0 Ar (a free month).
    if (ruleAmount.trim() === '') {
      if (ruleId) {
        const { error: deleteError } = await supabase.from('dues_rules').delete().eq('id', ruleId)
        if (deleteError) setError(deleteError.message)
        else {
          setRuleId(null)
          setSavedRuleAmount(null)
        }
      }
      setSavingRule(false)
      return
    }

    const amount = Number(ruleAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Montant invalide : entrez un nombre positif, 0 pour un mois gratuit, ou laissez vide.')
      setSavingRule(false)
      return
    }

    if (ruleId) {
      const { error: updateError } = await supabase.from('dues_rules').update({ amount }).eq('id', ruleId)
      if (updateError) setError(updateError.message)
      else setSavedRuleAmount(amount)
    } else {
      const { data, error: insertError } = await supabase
        .from('dues_rules')
        .insert({ year, month, amount })
        .select('id')
        .single()
      if (insertError) setError(insertError.message)
      else {
        setRuleId(data.id)
        setSavedRuleAmount(amount)
      }
    }

    setSavingRule(false)
  }

  async function updateRecordField(
    profileId: string,
    patch: Partial<Pick<RecordRow, 'status' | 'amount_paid' | 'payment_date' | 'payment_method' | 'reference'>>,
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

    await load({ refresh: true })
  }

  function exportMonth() {
    const due = savedRuleAmount ?? DEFAULT_DUES_AMOUNT
    const rows: CsvCell[][] = [
      ['Membre', 'N° membre', 'Catégorie', 'Statut', 'Montant dû (Ar)', 'Montant payé (Ar)', 'Date de paiement', 'Mode', 'Référence'],
    ]
    for (const m of members) {
      const record = recordByProfile.get(m.id)
      const status = record?.status ?? 'impaye'
      rows.push([
        fullName(m),
        m.member_number,
        categoryLabel(m.category),
        DUES_STATUS_LABELS[status],
        status === 'exempte' ? 0 : due,
        record?.amount_paid,
        record?.payment_date,
        record?.payment_method,
        record?.reference,
      ])
    }
    downloadCsv(`adidy-${year}-${String(month).padStart(2, '0')}.csv`, rows)
  }

  async function exportYear() {
    setExporting(true)
    setError('')
    const { data, error: yearError } = await supabase
      .from('dues_records')
      .select('profile_id, month, status, amount_paid')
      .eq('year', year)
    setExporting(false)
    if (yearError) {
      setError(yearError.message)
      return
    }

    const byMember = new Map<string, Map<number, { status: DuesStatus; amount_paid: number | null }>>()
    for (const r of data ?? []) {
      if (!byMember.has(r.profile_id)) byMember.set(r.profile_id, new Map())
      byMember.get(r.profile_id)!.set(r.month, r)
    }

    const rows: CsvCell[][] = [['Membre', 'N° membre', 'Catégorie', ...MONTH_NAMES, 'Mois payés', 'Total payé (Ar)']]
    for (const m of members) {
      const months = byMember.get(m.id)
      let paidMonths = 0
      let totalPaid = 0
      const cells = MONTH_NAMES.map((_, i) => {
        const record = months?.get(i + 1)
        if (!record) return ''
        if (record.status === 'paye') paidMonths++
        totalPaid += Number(record.amount_paid ?? 0)
        return DUES_STATUS_LABELS[record.status]
      })
      rows.push([fullName(m), m.member_number, categoryLabel(m.category), ...cells, paidMonths, totalPaid])
    }
    downloadCsv(`adidy-${year}-recapitulatif.csv`, rows)
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
            min={2000}
            max={2100}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (Number.isInteger(value) && value >= 2000 && value <= 2100) setYear(value)
            }}
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
              placeholder={String(DEFAULT_DUES_AMOUNT)}
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
          <p className="mt-1 text-xs text-sambo-700/60">
            {ruleId ? 'Montant spécifique à ce mois.' : `Par défaut : ${formatAr(DEFAULT_DUES_AMOUNT)}.`} Laisser
            vide = montant par défaut, 0 = mois gratuit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={exportMonth}
            className="rounded-xl border border-sambo-200 bg-white px-4 py-2 text-sm font-medium text-sambo-800 hover:bg-sambo-50"
          >
            Exporter le mois (CSV)
          </button>
          <button
            type="button"
            onClick={exportYear}
            disabled={exporting}
            className="rounded-xl border border-sambo-200 bg-white px-4 py-2 text-sm font-medium text-sambo-800 hover:bg-sambo-50 disabled:opacity-60"
          >
            {exporting ? 'Export…' : `Récapitulatif ${year} (CSV)`}
          </button>
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
              <th className="px-4 py-3">Date de paiement</th>
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
                      {STATUS_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={record?.amount_paid ?? ''}
                      onBlur={(e) => {
                        const value = e.target.value ? Number(e.target.value) : null
                        if (value !== (record?.amount_paid ?? null)) updateRecordField(m.id, { amount_paid: value })
                      }}
                      className="w-24 rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {/* Keyed on the stored date: filled in by the database
                        when the status becomes « Payé », so the input must
                        remount to show it. */}
                    <input
                      key={record?.payment_date ?? 'none'}
                      type="date"
                      defaultValue={record?.payment_date ?? ''}
                      onBlur={(e) => {
                        const value = e.target.value || null
                        if (value !== (record?.payment_date ?? null)) updateRecordField(m.id, { payment_date: value })
                      }}
                      className="rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={record?.payment_method ?? ''}
                      onBlur={(e) => {
                        const value = e.target.value.trim() || null
                        if (value !== (record?.payment_method ?? null)) updateRecordField(m.id, { payment_method: value })
                      }}
                      className="w-28 rounded-lg border border-sambo-200 px-2 py-1 text-sm focus:border-sambo-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={record?.reference ?? ''}
                      onBlur={(e) => {
                        const value = e.target.value.trim() || null
                        if (value !== (record?.reference ?? null)) updateRecordField(m.id, { reference: value })
                      }}
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
