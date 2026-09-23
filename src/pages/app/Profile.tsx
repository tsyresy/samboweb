import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { UNIVERSITY_ESTABLISHMENTS, STUDY_LEVELS } from '@/data/universities'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { uploadSignedPhoto } from '@/lib/cloudinary'

const CATEGORY_LABELS: Record<string, string> = {
  membre_standard: 'Membre standard',
  membre_bureau: 'Membre de bureau',
  sojabe: 'Sojabe',
  partenaire: 'Partenaire',
  sponsor: 'Sponsor',
}

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente de validation',
  valide: 'Validé',
  refuse: 'Refusé',
  suspendu: 'Suspendu',
}

interface EmergencyContact {
  contact_name: string
  contact_phone: string
}

export function Profile() {
  const { profile } = useAuth()

  const [form, setForm] = useState({
    nickname: '',
    phone: '',
    phone_secondary: '',
    residence: '',
    still_studying: true,
    faculty: '',
    program: '',
    study_level: '',
    student_id: '',
    show_phone_in_directory: false,
    show_email_in_directory: false,
  })
  const [emergency, setEmergency] = useState<EmergencyContact>({ contact_name: '', contact_phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    if (!profile) return

    setForm({
      nickname: profile.nickname ?? '',
      phone: profile.phone ?? '',
      phone_secondary: profile.phone_secondary ?? '',
      residence: profile.residence ?? '',
      still_studying: profile.still_studying,
      faculty: profile.faculty ?? '',
      program: profile.program ?? '',
      study_level: profile.study_level ?? '',
      student_id: profile.student_id ?? '',
      show_phone_in_directory: profile.show_phone_in_directory,
      show_email_in_directory: profile.show_email_in_directory,
    })
    setPhotoUrl(profile.photo_url)

    supabase
      .from('emergency_contacts')
      .select('contact_name, contact_phone')
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEmergency(data)
        setLoading(false)
      })
  }, [profile])

  if (!profile || loading) {
    return <p className="text-sambo-700/60">Chargement…</p>
  }

  const mentions = UNIVERSITY_ESTABLISHMENTS.find((e) => e.name === form.faculty)?.mentions ?? []

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingPhoto(true)
    setPhotoError('')

    try {
      const { secure_url } = await uploadSignedPhoto(file)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: secure_url })
        .eq('id', profile.id)

      if (updateError) throw new Error(updateError.message)
      setPhotoUrl(secure_url)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Échec de l'envoi de la photo.")
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSaved(false)
    setError('')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nickname: form.nickname || null,
        phone: form.phone,
        phone_secondary: form.phone_secondary || null,
        residence: form.residence,
        still_studying: form.still_studying,
        faculty: form.still_studying ? form.faculty || null : null,
        program: form.still_studying ? form.program || null : null,
        study_level: form.still_studying ? form.study_level || null : null,
        student_id: form.still_studying ? form.student_id || null : null,
        show_phone_in_directory: form.show_phone_in_directory,
        show_email_in_directory: form.show_email_in_directory,
      })
      .eq('id', profile.id)

    if (profileError) {
      setSaving(false)
      setError(profileError.message)
      return
    }

    const { error: emergencyError } = await supabase
      .from('emergency_contacts')
      .upsert(
        { profile_id: profile.id, contact_name: emergency.contact_name, contact_phone: emergency.contact_phone },
        { onConflict: 'profile_id' },
      )

    setSaving(false)
    if (emergencyError) {
      setError(emergencyError.message)
      return
    }

    setSaved(true)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-sambo-950">Mon profil</h1>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 rounded-2xl border border-sambo-200/70 bg-white p-5 text-sm">
        <div>
          <p className="text-sambo-700/60">Numéro de membre</p>
          <p className="font-medium text-sambo-950">{profile.member_number ?? '—'}</p>
        </div>
        <div>
          <p className="text-sambo-700/60">Catégorie</p>
          <p className="font-medium text-sambo-950">{CATEGORY_LABELS[profile.category]}</p>
        </div>
        <div>
          <p className="text-sambo-700/60">Statut</p>
          <p className="font-medium text-sambo-950">{STATUS_LABELS[profile.status]}</p>
        </div>
      </div>

      {profile.status === 'valide' ? (
        <Link to="/app/carte" className="mt-4 inline-block text-sm font-medium text-sambo-700 hover:underline">
          Voir ma carte de membre →
        </Link>
      ) : (
        <p className="mt-4 text-sm text-sambo-700/60">
          Carte de membre disponible une fois votre adhésion validée.
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sambo-100 text-2xl font-semibold text-sambo-700">
            {(profile.first_names ?? profile.email ?? '?').charAt(0)}
          </div>
        )}
        <div>
          <label
            htmlFor="photo"
            className="inline-block cursor-pointer rounded-lg border border-sambo-200 px-3 py-1.5 text-sm font-medium text-sambo-900 hover:bg-sambo-100"
          >
            {uploadingPhoto ? 'Envoi…' : 'Changer ma photo'}
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            disabled={uploadingPhoto}
            onChange={handlePhotoChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-sambo-700/60">
            Portrait de face récent, sans filtre ni accessoire masquant le visage.
          </p>
          {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Identité</legend>
          <div>
            <label className="block text-sm font-medium text-sambo-900" htmlFor="nickname">
              Surnom / nom de guerre
            </label>
            <input
              id="nickname"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Contact</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-sambo-900" htmlFor="phone">
                Téléphone
              </label>
              <input
                id="phone"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sambo-900" htmlFor="phone_secondary">
                Second téléphone
              </label>
              <input
                id="phone_secondary"
                value={form.phone_secondary}
                onChange={(e) => setForm((f) => ({ ...f, phone_secondary: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Résidence</legend>
          <label className="block text-sm font-medium text-sambo-900" htmlFor="residence">
            Adresse ou quartier de résidence
          </label>
          <input
            id="residence"
            required
            value={form.residence}
            onChange={(e) => setForm((f) => ({ ...f, residence: e.target.value }))}
            className="w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Études</legend>
          <label className="flex items-center gap-2 text-sm text-sambo-800/80">
            <input
              type="checkbox"
              checked={!form.still_studying}
              onChange={(e) => setForm((f) => ({ ...f, still_studying: !e.target.checked }))}
            />
            Je n'étudie plus
          </label>

          {form.still_studying && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-sambo-900" htmlFor="faculty">
                  Faculté / établissement
                </label>
                <select
                  id="faculty"
                  value={form.faculty}
                  onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value, program: '' }))}
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
                >
                  <option value="">—</option>
                  {UNIVERSITY_ESTABLISHMENTS.map((est) => (
                    <option key={est.name} value={est.name}>
                      {est.sigle ? `${est.sigle} — ${est.name}` : est.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sambo-900" htmlFor="program">
                  Mention / parcours
                </label>
                <select
                  id="program"
                  value={form.program}
                  disabled={!form.faculty}
                  onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none disabled:bg-sambo-100"
                >
                  <option value="">—</option>
                  {mentions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sambo-900" htmlFor="study_level">
                  Niveau d'étude
                </label>
                <select
                  id="study_level"
                  value={form.study_level}
                  onChange={(e) => setForm((f) => ({ ...f, study_level: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
                >
                  <option value="">—</option>
                  {STUDY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sambo-900" htmlFor="student_id">
                  Identifiant carte étudiant
                </label>
                <input
                  id="student_id"
                  value={form.student_id}
                  onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-sambo-900">Contact d'urgence</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-sambo-900" htmlFor="emergency_contact_name">
                Nom du contact familial
              </label>
              <input
                id="emergency_contact_name"
                value={emergency.contact_name}
                onChange={(e) => setEmergency((c) => ({ ...c, contact_name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sambo-900" htmlFor="emergency_contact_phone">
                Téléphone du contact
              </label>
              <input
                id="emergency_contact_phone"
                value={emergency.contact_phone}
                onChange={(e) => setEmergency((c) => ({ ...c, contact_phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-sambo-200 px-3 py-2 text-sm focus:border-sambo-500 focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-lg font-medium text-sambo-900">Visibilité dans l'annuaire</legend>
          <p className="text-sm text-sambo-800/70">
            Choisissez les coordonnées que les autres membres validés peuvent voir dans
            l'annuaire.
          </p>
          <label className="flex items-center gap-2 text-sm text-sambo-800/80">
            <input
              type="checkbox"
              checked={form.show_phone_in_directory}
              onChange={(e) => setForm((f) => ({ ...f, show_phone_in_directory: e.target.checked }))}
            />
            Afficher mon téléphone
          </label>
          <label className="flex items-center gap-2 text-sm text-sambo-800/80">
            <input
              type="checkbox"
              checked={form.show_email_in_directory}
              onChange={(e) => setForm((f) => ({ ...f, show_email_in_directory: e.target.checked }))}
            />
            Afficher mon email
          </label>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-sambo-700">Profil mis à jour.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-sambo-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sambo-800 disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
