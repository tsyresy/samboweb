import { useState } from 'react'

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000]

export function Donate() {
  const [amount, setAmount] = useState<number | null>(10000)
  const [customAmount, setCustomAmount] = useState('')

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-sambo-950">Faire un don</h1>
      <p className="mt-3 text-sambo-800/80">
        Votre soutien aide SAMBO à financer ses projets et activités. Les moyens de paiement en
        ligne (Stripe, PayPal, Orange Money) seront activés une fois les comptes marchands de
        l'association configurés.
      </p>

      <div className="mt-8 rounded-2xl border border-sambo-200/70 bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm font-medium text-sambo-900">Montant (Ar)</p>
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
                  ? 'border-sambo-700 bg-sambo-700 text-white'
                  : 'border-sambo-200 text-sambo-900 hover:bg-sambo-100'
              }`}
            >
              {preset.toLocaleString('fr-FR')}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium text-sambo-900" htmlFor="custom-amount">
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
          className="mt-2 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
        />

        <p className="mt-3 text-xs text-sambo-700/60">
          Moyen de paiement : bientôt disponible.
        </p>

        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-xl bg-sambo-300 px-4 py-3 text-sm font-medium text-white"
        >
          Paiement en ligne à venir
        </button>
      </div>
    </div>
  )
}
