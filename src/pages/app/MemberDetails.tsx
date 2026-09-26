import { type ReactNode, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { categoryLabel } from '@/lib/membership'
import { supabase } from '@/lib/supabase'
import type { MemberCardDetails } from '@/types/database'

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR')
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

/** Full record of a member, reached by scanning their card's QR code
 *  (sambo://membre/<id>). Same data the mobile app will show. */
export function MemberDetails() {
  const { verificationId } = useParams()
  const [member, setMember] = useState<MemberCardDetails | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!verificationId) return
    let cancelled = false
    supabase.rpc('member_card_details', { p_verification_id: verificationId }).then(({ data, error: rpcError }) => {
      if (cancelled) return
      if (rpcError) {
        setError(rpcError.message)
        setState('error')
      } else if (!data) {
        setState('not_found')
      } else {
        setMember(data)
        setState('ready')
      }
    })
    return () => {
      cancelled = true
    }
  }, [verificationId])

  if (state === 'loading') return <p className="text-ink-subtle">Chargement…</p>

  if (state !== 'ready' || !member) {
    return (
      <div className="glass max-w-xl rounded-2xl p-6">
        <h1 className="text-lg font-semibold text-ink">
          {state === 'not_found' ? 'Carte introuvable' : 'Impossible d’afficher ce membre'}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {state === 'not_found' ? 'Ce code ne correspond à aucune carte SAMBO.' : error}
        </p>
        <Link to="/app/membres" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
          Retour à l’annuaire
        </Link>
      </div>
    )
  }

  const name = [member.last_name, member.first_names].filter(Boolean).join(' ')
  const fullName = name || '(nom non renseigné)'
  const active = member.card_status === 'active' && member.status === 'valide'

  return (
    <div className="max-w-3xl">
      <div className="glass flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/10">
          {member.photo_url ? (
            <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-accent">
              {name.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold break-words text-ink">{fullName}</h1>
          {member.nickname && <p className="text-sm text-ink-muted">« {member.nickname} »</p>}
          <p className="mt-1 text-sm text-ink-muted">
            {member.position ?? categoryLabel(member.category)}
            {member.member_number && ` · ${member.member_number}`}
          </p>
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              active ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-danger'
            }`}
          >
            {active ? 'Carte valide' : 'Carte révoquée ou membre suspendu'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Section title="Identité">
          <Field label="Nom" value={member.last_name} />
          <Field label="Prénom(s)" value={member.first_names} />
          <Field label="Date de naissance" value={formatDate(member.birth_date)} />
          <Field label="Numéro CIN" value={member.cin_number} />
          <Field label="Catégorie" value={categoryLabel(member.category)} />
          <Field label="Fonction au bureau" value={member.position} />
        </Section>

        <Section title="Contact">
          <Field label="Téléphone" value={member.phone} />
          <Field label="Second téléphone" value={member.phone_secondary} />
          <Field label="Email" value={member.email} />
          <Field label="Résidence" value={member.residence} />
        </Section>

        <Section title="Études">
          <Field label="Situation" value={member.still_studying ? 'Étudiant(e)' : 'N’étudie plus'} />
          <Field label="Faculté / établissement" value={member.faculty} />
          <Field label="Mention / parcours" value={member.program} />
          <Field label="Niveau" value={member.study_level} />
          <Field label="Carte étudiant" value={member.student_id} />
        </Section>

        <Section title="Contact d’urgence">
          <Field label="Nom" value={member.emergency_contact_name} />
          <Field label="Téléphone" value={member.emergency_contact_phone} />
        </Section>

        <p className="text-xs text-ink-subtle">
          Carte émise le {formatDate(member.issued_at)}
          {member.revoked_at && ` · révoquée le ${formatDate(member.revoked_at)}`}. Ces informations sont réservées
          aux membres validés.
        </p>
      </div>
    </div>
  )
}
