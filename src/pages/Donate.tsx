import { useState } from 'react'

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000]

export function Donate() {
  const [amount, setAmount] = useState<number | null>(10000)
  const [customAmount, setCustomAmount] = useState('')

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Faire un don</h1>
      <p className="mt-3 text-ink-muted">
        Votre soutien aide SAMBO à financer ses projets et activités. Les moyens de paiement en
        ligne (Stripe, PayPal, Orange Money) seront activés une fois les comptes marchands de
        l'association configurés.
      </p>

      <div className="mt-8 rounded-2xl border border-line glass p-6">
        <p className="mb-3 text-sm font-medium text-ink">Montant (Ar)</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset)
                setCustomAmount('')
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                amount === preset
                  ? 'border-accent bg-accent/15 text-ink'
                  : 'border-line text-ink hover:bg-white/10'
              }`}
            >
              {preset.toLocaleString('fr-FR')}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="custom-amount">
          Ou montant libre
        </label>
        <input
          id="custom-amount"
          type="number"
          min={0}
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value)
            setAmount(null)
          }}
          placeholder="Montant en Ariary"
          className="mt-2 w-full rounded-xl px-3 py-2 text-sm field"
        />

        <p className="mt-3 text-xs text-ink-subtle">
          Moyen de paiement : bientôt disponible.
        </p>

        <button
          type="button"
          disabled
          className="btn-glass mt-6 w-full cursor-not-allowed rounded-xl px-4 py-3 text-sm font-medium text-ink-muted opacity-70"
        >
          Paiement en ligne à venir
        </button>
      </div>
    </div>
  )
}
