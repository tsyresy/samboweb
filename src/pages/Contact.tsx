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
        <h1 className="text-2xl font-semibold text-ink">Message envoyé</h1>
        <p className="mt-3 text-ink-muted">
          Merci de nous avoir contactés. Un responsable de l'association reviendra vers vous
          prochainement.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Contact et collaboration</h1>
      <p className="mt-3 text-ink-muted">
        Une question, une proposition de partenariat ? Écrivez-nous.
      </p>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-4 rounded-3xl p-6 sm:p-8">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Nom complet
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
          />
        </div>

        <div>
          <label htmlFor="request_type" className="block text-sm font-medium text-ink">
            Type de demande
          </label>
          <select
            id="request_type"
            name="request_type"
            defaultValue={REQUEST_TYPES[0]}
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
          >
            {REQUEST_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-ink">
            Objet
          </label>
          <input
            id="subject"
            name="subject"
            required
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-ink">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input type="checkbox" required className="mt-1" />
          J'accepte d'être recontacté au sujet de ma demande.
        </label>

        {status === 'error' && <p className="text-sm text-danger">{errorMessage}</p>}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded-xl btn-primary px-4 py-3 text-sm disabled:opacity-60"
        >
          {status === 'sending' ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </div>
  )
}
