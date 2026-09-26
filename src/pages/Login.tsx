import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email')),
      password: String(form.get('password')),
    })

    setLoading(false)
    if (error) {
      setError('Email ou mot de passe incorrect.')
      return
    }
    navigate('/app')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Connexion</h1>
      <p className="mt-2 text-sm text-ink-muted">Accédez à votre espace membre SAMBO.</p>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-4 rounded-3xl p-6 sm:p-8">
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
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl btn-primary px-4 py-3 text-sm disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Pas encore membre ?{' '}
        <Link to="/inscription" className="font-medium text-accent hover:underline">
          Inscrivez-vous
        </Link>
      </p>
    </div>
  )
}
