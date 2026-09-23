import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

const REQUEST_TYPES = ['Question générale', 'Partenariat', 'Presse', 'Autre']

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const form = new FormData(e.currentTarget)
    const { error } = await supabase.from('contact_requests').insert({
      name: String(form.get('name')),
      email: String(form.get('email')),
      subject: String(form.get('subject')),
      request_type: String(form.get('request_type')),
      message: String(form.get('message')),
    })

    if (error) {
      setStatus('error')
      setErrorMessage("Le formulaire n'est pas encore raccordé à la base de données.")
      return
    }

    setStatus('sent')
    e.currentTarget.reset()
  }

  if (status === 'sent') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-sambo-950">Message envoyé</h1>
        <p className="mt-3 text-sambo-800/80">
          Merci de nous avoir contactés. Un responsable de l'association reviendra vers vous
          prochainement.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-sambo-950">Contact et collaboration</h1>
      <p className="mt-3 text-sambo-800/80">
        Une question, une proposition de partenariat ? Écrivez-nous.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-sambo-900">
            Nom complet
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-sambo-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="request_type" className="block text-sm font-medium text-sambo-900">
            Type de demande
          </label>
          <select
            id="request_type"
            name="request_type"
            defaultValue={REQUEST_TYPES[0]}
            className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          >
            {REQUEST_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-sambo-900">
            Objet
          </label>
          <input
            id="subject"
            name="subject"
            required
            className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-sambo-900">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-sambo-800/80">
          <input type="checkbox" required className="mt-1" />
          J'accepte d'être recontacté au sujet de ma demande.
        </label>

        {status === 'error' && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-xl bg-sambo-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sambo-800 disabled:opacity-60"
        >
          {status === 'sending' ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </div>
  )
}
