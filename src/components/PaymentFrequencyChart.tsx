import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

// Dark theme: the bright brand green (accent-strong) reads as a solid data
// mark on the green-black gradient; darker greens sink into it.
const BAR = '#3fc27f'
const BAR_HOVER = '#8ae6b1'
const GRID = 'rgb(255 255 255 / 0.08)'
const INK_MUTED = '#a9bdb1'

const HEIGHT = 220
const PAD = { top: 16, right: 8, bottom: 28, left: 28 }

interface DayCount {
  day: number
  payers: number
}

interface MonthData {
  days: DayCount[]
  inMonth: number
  outsideMonth: number
  members: number
}

function niceTicks(max: number) {
  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : 10
  const top = Math.max(step, Math.ceil(max / step) * step)
  return Array.from({ length: top / step + 1 }, (_, i) => i * step)
}

/** Column with a 4px rounded data-end and a square baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, h, w / 2)
  const base = y + h
  return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`
}

/**
 * Daily count of members who paid a given month's adidy, by payment day,
 * from the aggregate-only payment_frequency view (migration 0011): no
 * names, no amounts. Bars grow in on load and on month change.
 */
export function PaymentFrequencyChart() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [data, setData] = useState<MonthData | null>(null)
  const [grown, setGrown] = useState(false)
  const [hover, setHover] = useState<DayCount | null>(null)
  const [width, setWidth] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  const daysInMonth = new Date(period.year, period.month, 0).getDate()
  const isCurrentMonth = period.year === now.getFullYear() && period.month === now.getMonth() + 1
  const monthLabel = `${MONTH_NAMES[period.month - 1]} ${period.year}`

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase
        .from('payment_frequency')
        .select('payment_date, payers')
        .eq('year', period.year)
        .eq('month', period.month),
      supabase.from('directory_profiles').select('id', { count: 'exact', head: true }),
    ]).then(([freqRes, membersRes]) => {
      if (cancelled) return
      const byDay = new Map<number, number>()
      let outsideMonth = 0
      for (const row of freqRes.data ?? []) {
        const [y, m, d] = row.payment_date.split('-').map(Number)
        if (y === period.year && m === period.month) byDay.set(d, (byDay.get(d) ?? 0) + row.payers)
        else outsideMonth += row.payers
      }
      const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, payers: byDay.get(i + 1) ?? 0 }))
      setData({
        days,
        inMonth: days.reduce((sum, d) => sum + d.payers, 0),
        outsideMonth,
        members: membersRes.count ?? 0,
      })
      setGrown(false)
      // Next frame: flip to full height so the bars transition up from 0.
      requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && setGrown(true)))
    })
    return () => {
      cancelled = true
    }
  }, [period, daysInMonth])

  function shiftMonth(delta: number) {
    setPeriod(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  const total = data ? data.inMonth + data.outsideMonth : 0
  const max = data ? Math.max(...data.days.map((d) => d.payers), 1) : 1
  const ticks = niceTicks(max)
  const yMax = ticks[ticks.length - 1]
  const plotW = Math.max(width - PAD.left - PAD.right, 0)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const band = plotW / daysInMonth
  const barW = Math.max(Math.min(24, band - 2), 1)
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH
  const xLabels = [1, 5, 10, 15, 20, 25, daysInMonth]

  return (
    <section className="rounded-3xl border border-line glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Paiements de l'adidy de {monthLabel}</h2>
          <p className="text-sm text-ink-muted">Nombre de membres ayant payé, jour par jour</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
            className="rounded-full px-3 py-1 text-sm btn-glass"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Mois suivant"
            className="rounded-full px-3 py-1 text-sm btn-glass disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${data ? '' : 'opacity-40'}`}>
        <p className="text-sm text-ink-muted">
          <span className="text-3xl font-bold text-ink tabular-nums">{total}</span>
          <span className="ml-2">
            membre{total > 1 ? 's' : ''} sur {data?.members ?? '…'} {total > 1 ? 'ont' : 'a'} payé
            {data && data.members > 0 && ` · ${Math.round((total / data.members) * 100)} %`}
          </span>
        </p>
        {data && data.outsideMonth > 0 && (
          <p className="mt-0.5 text-xs text-ink-muted">
            dont {data.outsideMonth} réglé{data.outsideMonth > 1 ? 's' : ''} en dehors du mois (non
            représenté{data.outsideMonth > 1 ? 's' : ''} sur le graphique)
          </p>
        )}
      </div>

      <div ref={boxRef} className="relative mt-4" onPointerLeave={() => setHover(null)}>
        {width > 0 && data && (
          <svg width={width} height={HEIGHT} role="group" aria-label={`Paiements par jour, ${monthLabel}`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK_MUTED}>
                  {t}
                </text>
              </g>
            ))}

            {data.days.map((d, i) => {
              const cx = PAD.left + band * i + band / 2
              const h = (d.payers / yMax) * plotH
              return (
                <g key={`${period.year}-${period.month}-${d.day}`}>
                  {d.payers > 0 && (
                    <path
                      d={barPath(cx - barW / 2, y(d.payers), barW, h)}
                      fill={hover?.day === d.day ? BAR_HOVER : BAR}
                      style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'bottom',
                        transform: grown ? 'scaleY(1)' : 'scaleY(0)',
                        transition: `transform 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 18}ms, fill 120ms`,
                      }}
                    />
                  )}
                  {/* Full-height hit target, wider than the bar. */}
                  <rect
                    x={PAD.left + band * i}
                    y={PAD.top}
                    width={band}
                    height={plotH}
                    fill="transparent"
                    tabIndex={d.payers > 0 ? 0 : -1}
                    aria-label={`${d.day} ${MONTH_NAMES[period.month - 1]}  ${d.payers} paiement${d.payers > 1 ? 's' : ''}`}
                    onPointerEnter={() => setHover(d)}
                    onFocus={() => setHover(d)}
                    onBlur={() => setHover(null)}
                    className="outline-none"
                  />
                </g>
              )
            })}

            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={PAD.top + plotH}
              y2={PAD.top + plotH}
              stroke="rgb(255 255 255 / 0.25)"
              strokeWidth={1}
            />
            {xLabels.map((day) => (
              <text
                key={day}
                x={PAD.left + band * (day - 1) + band / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={11}
                fill={INK_MUTED}
              >
                {day}
              </text>
            ))}
          </svg>
        )}

        {hover && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border glass-strong px-3 py-2 text-xs whitespace-nowrap"
            style={{
              left: Math.min(Math.max(PAD.left + band * (hover.day - 1) + band / 2, 60), width - 60),
              top: 0,
            }}
          >
            <p className="text-base font-semibold text-ink tabular-nums">
              {hover.payers} paiement{hover.payers > 1 ? 's' : ''}
            </p>
            <p className="text-ink-muted">
              {hover.day} {MONTH_NAMES[period.month - 1]}
            </p>
          </div>
        )}

        {data && data.inMonth === 0 && (
          <p className="absolute inset-x-0 top-16 text-center text-sm text-ink-subtle">
            Aucun paiement enregistré ce mois-ci pour l'instant.
          </p>
        )}
      </div>

      {data && data.inMonth > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
            Voir les données en tableau
          </summary>
          <table className="mt-2 w-full max-w-xs text-left text-xs">
            <thead>
              <tr className="text-ink-subtle">
                <th className="py-1 font-medium">Jour</th>
                <th className="py-1 text-right font-medium">Paiements</th>
              </tr>
            </thead>
            <tbody>
              {data.days
                .filter((d) => d.payers > 0)
                .map((d) => (
                  <tr key={d.day} className="border-t border-line">
                    <td className="py-1 text-ink">
                      {d.day} {MONTH_NAMES[period.month - 1]}
                    </td>
                    <td className="py-1 text-right text-ink tabular-nums">{d.payers}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  )
}
