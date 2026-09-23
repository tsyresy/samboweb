import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import { categoryLabel, MembershipCardView } from '@/components/MembershipCardView'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface CardRow {
  verification_id: string
  status: 'active' | 'revoked'
}

export function MembershipCard() {
  const { profile } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)
  const [card, setCard] = useState<CardRow | null>(null)
  const [roleLabel, setRoleLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!profile) return

    async function load() {
      const [cardRes, assignmentRes] = await Promise.all([
        supabase
          .from('membership_cards')
          .select('verification_id, status')
          .eq('profile_id', profile!.id)
          .maybeSingle(),
        supabase
          .from('position_assignments')
          .select('position_id')
          .eq('profile_id', profile!.id)
          .is('end_date', null)
          .maybeSingle(),
      ])

      setCard(cardRes.data)

      if (assignmentRes.data) {
        const { data: position } = await supabase
          .from('office_positions')
          .select('title')
          .eq('id', assignmentRes.data.position_id)
          .maybeSingle()
        setRoleLabel(position?.title ?? categoryLabel(profile!.category))
      } else {
        setRoleLabel(categoryLabel(profile!.category))
      }

      setLoading(false)
    }

    load()
  }, [profile])

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 })
      const link = document.createElement('a')
      link.download = `carte-membre-${profile?.member_number ?? 'sambo'}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  if (!profile || loading) {
    return <p className="text-sambo-700/60">Chargement…</p>
  }

  if (profile.status !== 'valide') {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-sambo-950">Ma carte de membre</h1>
        <p className="mt-3 text-sambo-800/70">
          Votre carte sera disponible une fois votre adhésion validée par un administrateur.
        </p>
      </div>
    )
  }

  if (!card) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-sambo-950">Ma carte de membre</h1>
        <p className="mt-3 text-sambo-800/70">
          Votre carte n'a pas encore été générée. Réessayez dans un instant, ou contactez un
          administrateur si cela persiste.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-sambo-950">Ma carte de membre</h1>

      {card.status === 'revoked' && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          Cette carte est révoquée et n'est plus valide.
        </p>
      )}

      <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row">
        <MembershipCardView ref={cardRef} profile={profile} roleLabel={roleLabel} verificationId={card.verification_id} />

        <div className="max-w-xs text-sm text-sambo-800/70">
          <p>
            Le QR code renvoie vers une page de vérification publique : elle confirme seulement
            que la carte est valide, sans révéler vos informations personnelles.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="mt-4 rounded-xl bg-sambo-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sambo-800 disabled:opacity-60"
          >
            {downloading ? 'Génération…' : 'Télécharger (PNG)'}
          </button>
        </div>
      </div>
    </div>
  )
}
