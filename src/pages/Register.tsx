import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UNIVERSITY_ESTABLISHMENTS, STUDY_LEVELS } from '@/data/universities'
import { uploadSignedPhoto } from '@/lib/cloudinary'
import { supabase } from '@/lib/supabase'
import type { MembershipCategory } from '@/types'
import { CATEGORY_LABELS } from '@/lib/membership'

const STRENGTH_LEVELS = [
  { label: 'Trop court', barColor: 'bg-red-500', textColor: 'text-danger' },
  { label: 'Faible', barColor: 'bg-red-500', textColor: 'text-danger' },
  { label: 'Moyen', barColor: 'bg-gold-500', textColor: 'text-gold-300' },
  { label: 'Correct', barColor: 'bg-gold-400', textColor: 'text-gold-300' },
  { label: 'Fort', barColor: 'bg-sambo-500', textColor: 'text-accent' },
  { label: 'Très fort', barColor: 'bg-accent', textColor: 'text-accent' },
]

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return { score, ...STRENGTH_LEVELS[Math.min(score, STRENGTH_LEVELS.length - 1)] }
}

/** As the user types digits, auto-insert the jj/mm/aaaa slashes. Native
 *  <input type="date"> can't be forced into this display format — Chrome
 *  ignores the page's `lang` and always follows the OS/browser locale
 *  (confirmed showing "mm/dd/yyyy" even with <html lang="fr">) — so this
 *  is a plain masked text input instead. */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

/** Validates a jj/mm/aaaa string and converts it to the ISO (yyyy-mm-dd)
 *  format Postgres needs — ISO is the only format that's unambiguous
 *  regardless of the database's DateStyle setting. Returns null if the
 *  date is incomplete or not a real calendar date (e.g. 31/02). */
function displayDateToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const day = Number(dd)
  const month = Number(mm)
  const year = Number(yyyy)
  if (month < 1 || month > 12) return null
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return null
  return `${yyyy}-${mm}-${dd}`
}

export function Register() {
  const navigate = useNavigate()
  const [stillStudying, setStillStudying] = useState(true)
  const [establishment, setEstablishment] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [birthDateDisplay, setBirthDateDisplay] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nativeDateRef = useRef<HTMLInputElement>(null)

  const mentions = UNIVERSITY_ESTABLISHMENTS.find((e) => e.name === establishment)?.mentions ?? []
  const strength = getPasswordStrength(password)
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    const birthDateIso = displayDateToIso(birthDateDisplay)
    if (!birthDateIso) {
      setError('Date de naissance invalide. Format attendu : jj/mm/aaaa.')
      return
    }

    const form = new FormData(e.currentTarget)
    setLoading(true)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: String(form.get('email')),
      password,
      options: {
        data: {
          last_name: form.get('last_name'),
          first_names: form.get('first_names'),
          cin_number: form.get('cin_number'),
          nickname: form.get('nickname') || null,
          birth_date: birthDateIso,
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

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    // Upload the photo now that signUp has established a real session
    // (email confirmation is disabled, so this works immediately) —
    // previously this was silently dropped, leaving new members with no
    // photo until they re-uploaded it from their profile.
    if (photoFile && signUpData.session) {
      try {
        const { secure_url } = await uploadSignedPhoto(photoFile)
        await supabase.from('profiles').update({ photo_url: secure_url }).eq('user_id', signUpData.session.user.id)
      } catch {
        // Don't block registration success on a photo upload hiccup —
        // the member can still add it from /app/profil.
      }
    }

    setLoading(false)
    navigate('/inscription/confirmation')
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Rejoindre SAMBO</h1>
      <p className="mt-3 text-ink-muted">
        Votre demande sera examinée par un administrateur avant l'activation de votre accès
        membre.
      </p>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-8 rounded-3xl p-6 sm:p-8">
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-ink">Catégorie souhaitée</legend>
          <select
            name="category"
            required
            defaultValue=""
            className="w-full rounded-xl px-3 py-2 text-sm field"
          >
            <option value="" disabled>
              Choisissez une catégorie
            </option>
            {(Object.entries(CATEGORY_LABELS) as [MembershipCategory, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-ink">Identité</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom" name="last_name" required />
            <Field label="Prénom(s)" name="first_names" required />
            <Field label="Numéro CIN" name="cin_number" required />
            <Field label="Surnom / nom de guerre" name="nickname" />
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-ink">
                Date de naissance
              </label>
              <div className="relative mt-1">
                <input
                  id="birth_date"
                  inputMode="numeric"
                  placeholder="jj/mm/aaaa"
                  required
                  value={birthDateDisplay}
                  onChange={(e) => setBirthDateDisplay(formatDateInput(e.target.value))}
                  maxLength={10}
                  className="w-full rounded-xl py-2 pl-3 pr-10 text-sm field"
                />
                <button
                  type="button"
                  aria-label="Choisir dans le calendrier"
                  onClick={() => {
                    const el = nativeDateRef.current
                    if (!el) return
                    if (typeof el.showPicker === 'function') el.showPicker()
                    else el.focus()
                  }}
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-accent hover:text-accent"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="5.5" width="16" height="15" rx="2" />
                    <path strokeLinecap="round" d="M8 3.5v4M16 3.5v4M4 10h16" />
                  </svg>
                </button>
                {/* Native picker, invisible but functional — showPicker() needs
                    the element rendered (not display:none), so it's shrunk to
                    nothing rather than hidden. Only used for its calendar UI;
                    the visible field above stays the source of truth for
                    display/typing in jj/mm/aaaa. */}
                <input
                  ref={nativeDateRef}
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute h-0 w-0 opacity-0"
                  onChange={(e) => {
                    const iso = e.target.value
                    if (!iso) return
                    const [y, m, d] = iso.split('-')
                    setBirthDateDisplay(`${d}/${m}/${y}`)
                  }}
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-ink">Contact</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Téléphone" name="phone" type="tel" required />
            <Field label="Second téléphone (facultatif)" name="phone_secondary" type="tel" />
            <Field label="Email" name="email" type="email" required className="sm:col-span-2" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-ink">Accès</legend>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Mot de passe (8 caractères minimum)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
            />

            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {STRENGTH_LEVELS.slice(1).map((level, i) => (
                    <div
                      key={level.label}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        i < strength.score ? strength.barColor : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p key={strength.label} className={`animate-pop-in mt-1 text-xs ${strength.textColor}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-ink">
              Confirmer le mot de passe
            </label>
            <input
              id="password_confirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
            />

            {passwordConfirm && (
              <p
                key={passwordsMatch ? 'match' : 'mismatch'}
                className={`animate-pop-in mt-1 flex items-center gap-1.5 text-xs ${
                  passwordsMatch ? 'text-accent' : 'text-danger'
                }`}
              >
                {passwordsMatch ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                )}
                {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
              </p>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-ink">Résidence</legend>
          <Field label="Adresse ou quartier de résidence" name="residence" required />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-ink">Études</legend>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
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
                <label className="block text-sm font-medium text-ink">Faculté / établissement</label>
                <select
                  name="faculty"
                  required={stillStudying}
                  value={establishment}
                  onChange={(e) => setEstablishment(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
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
                <label className="block text-sm font-medium text-ink">Mention / parcours</label>
                <select
                  name="program"
                  required={stillStudying}
                  disabled={!establishment}
                  defaultValue=""
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
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
                <label className="block text-sm font-medium text-ink">Niveau d'étude</label>
                <select
                  name="study_level"
                  required={stillStudying}
                  defaultValue=""
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
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
          <legend className="text-lg font-medium text-ink">Contact d'urgence</legend>
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
          <legend className="text-lg font-medium text-ink">Photo</legend>
          <p className="text-sm text-ink-muted">
            Portrait de face récent, sans filtre ni accessoire masquant le visage.
          </p>

          <label
            htmlFor="photo"
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line-strong bg-white/[0.04] px-6 py-8 text-center transition-colors hover:border-accent hover:bg-white/10"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Aperçu"
                className="h-24 w-24 rounded-full border border-line object-cover"
              />
            ) : (
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-accent"
              >
                <path d="M4 8a1 1 0 0 1 1-1h2.5l1-1.5h7l1 1.5H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            )}
            <span className="text-sm font-medium text-accent">
              {photoPreview ? 'Changer la photo' : 'Cliquez pour ajouter une photo'}
            </span>
          </label>
          <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

          <p className="text-xs text-ink-subtle">
            La photo est envoyée avec votre inscription. Vous pourrez la changer depuis votre
            profil une fois connecté(e).
          </p>
        </fieldset>

        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input type="checkbox" required className="mt-1" />
          J'accepte les règles d'utilisation et je suis informé(e) de l'usage fait de mes données
          personnelles.
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl btn-primary px-4 py-3 text-sm disabled:opacity-60"
        >
          {loading ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Déjà membre ?{' '}
        <Link to="/connexion" className="font-medium text-accent hover:underline">
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
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-xl px-3 py-2 text-sm field"
      />
    </div>
  )
}
