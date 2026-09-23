import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UNIVERSITY_ESTABLISHMENTS, STUDY_LEVELS } from '@/data/universities'
import { supabase } from '@/lib/supabase'
import type { MembershipCategory } from '@/types'

const CATEGORIES: { value: MembershipCategory; label: string }[] = [
  { value: 'membre_standard', label: 'Membre standard' },
  { value: 'membre_bureau', label: 'Membre de bureau' },
  { value: 'sojabe', label: 'Sojabe' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'sponsor', label: 'Sponsor' },
]

export function Register() {
  const navigate = useNavigate()
  const [stillStudying, setStillStudying] = useState(true)
  const [establishment, setEstablishment] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const mentions = UNIVERSITY_ESTABLISHMENTS.find((e) => e.name === establishment)?.mentions ?? []

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = new FormData(e.currentTarget)
    const password = String(form.get('password'))
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: String(form.get('email')),
      password,
      options: {
        data: {
          last_name: form.get('last_name'),
          first_names: form.get('first_names'),
          cin_number: form.get('cin_number'),
          nickname: form.get('nickname') || null,
          birth_date: form.get('birth_date'),
          phone: form.get('phone'),
          phone_secondary: form.get('phone_secondary') || null,
          residence: form.get('residence'),
          category: form.get('category'),
          still_studying: stillStudying,
          faculty: stillStudying ? form.get('faculty') : null,
          program: stillStudying ? form.get('program') : null,
          study_level: stillStudying ? form.get('study_level') : null,
          student_id: stillStudying ? form.get('student_id') : null,
          emergency_contact_name: form.get('emergency_contact_name'),
          emergency_contact_phone: form.get('emergency_contact_phone'),
        },
      },
    })

    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }

    navigate('/inscription/confirmation')
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-sambo-950">Rejoindre SAMBO</h1>
      <p className="mt-3 text-sambo-800/80">
        Votre demande sera examinée par un administrateur avant l'activation de votre accès
        membre.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Catégorie souhaitée</legend>
          <select
            name="category"
            required
            defaultValue=""
            className="w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          >
            <option value="" disabled>
              Choisissez une catégorie
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Identité</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom" name="last_name" required />
            <Field label="Prénom(s)" name="first_names" required />
            <Field label="Numéro CIN" name="cin_number" required />
            <Field label="Surnom / nom de guerre" name="nickname" />
            <Field label="Date de naissance" name="birth_date" type="date" required />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Contact</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Téléphone" name="phone" type="tel" required />
            <Field label="Second téléphone (facultatif)" name="phone_secondary" type="tel" />
            <Field label="Email" name="email" type="email" required className="sm:col-span-2" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Accès</legend>
          <Field label="Mot de passe (8 caractères minimum)" name="password" type="password" required />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Résidence</legend>
          <Field label="Adresse ou quartier de résidence" name="residence" required />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Études</legend>
          <label className="flex items-center gap-2 text-sm text-sambo-800/80">
            <input
              type="checkbox"
              checked={!stillStudying}
              onChange={(e) => setStillStudying(!e.target.checked)}
            />
            Je n'étudie plus
          </label>

          {stillStudying && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-sambo-900">Faculté / établissement</label>
                <select
                  name="faculty"
                  required={stillStudying}
                  value={establishment}
                  onChange={(e) => setEstablishment(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Choisissez un établissement
                  </option>
                  {UNIVERSITY_ESTABLISHMENTS.map((est) => (
                    <option key={est.name} value={est.name}>
                      {est.sigle ? `${est.sigle} — ${est.name}` : est.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sambo-900">Mention / parcours</label>
                <select
                  name="program"
                  required={stillStudying}
                  disabled={!establishment}
                  defaultValue=""
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none disabled:bg-sambo-100"
                >
                  <option value="" disabled>
                    {establishment ? 'Choisissez une mention' : "Sélectionnez d'abord un établissement"}
                  </option>
                  {mentions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sambo-900">Niveau d'étude</label>
                <select
                  name="study_level"
                  required={stillStudying}
                  defaultValue=""
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Choisissez un niveau
                  </option>
                  {STUDY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="Identifiant carte étudiant" name="student_id" required={stillStudying} />
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Contact d'urgence</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom du contact familial" name="emergency_contact_name" required />
            <Field
              label="Téléphone du contact"
              name="emergency_contact_phone"
              type="tel"
              required
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-lg font-medium text-sambo-900">Photo</legend>
          <p className="text-sm text-sambo-800/70">
            Portrait de face récent, sans filtre ni accessoire masquant le visage.
          </p>

          <label
            htmlFor="photo"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-sambo-300 bg-sambo-50 px-6 py-8 text-center transition-colors hover:border-sambo-500 hover:bg-sambo-100"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Aperçu"
                className="h-24 w-24 rounded-full border border-sambo-200 object-cover"
              />
            ) : (
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-sambo-500"
              >
                <path d="M4 8a1 1 0 0 1 1-1h2.5l1-1.5h7l1 1.5H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            )}
            <span className="text-sm font-medium text-sambo-700">
              {photoPreview ? 'Changer la photo' : 'Cliquez pour ajouter une photo'}
            </span>
          </label>
          <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

          <p className="text-xs text-sambo-700/60">
            L'envoi définitif de la photo vous sera demandé après validation de votre compte.
          </p>
        </fieldset>

        <label className="flex items-start gap-2 text-sm text-sambo-800/80">
          <input type="checkbox" required className="mt-1" />
          J'accepte les règles d'utilisation et je suis informé(e) de l'usage fait de mes données
          personnelles.
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sambo-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-sambo-800 disabled:opacity-60"
        >
          {loading ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-sambo-800/70">
        Déjà membre ?{' '}
        <Link to="/connexion" className="font-medium text-sambo-700 hover:underline">
          Connectez-vous
        </Link>
      </p>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  className,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-sambo-900">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
      />
    </div>
  )
}
