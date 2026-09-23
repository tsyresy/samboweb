import { forwardRef, useEffect, useState } from 'react'
import { generateQrDataUrl } from '@/lib/qrcode'
import type { Profile } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  membre_standard: 'Membre standard',
  membre_bureau: 'Membre de bureau',
  sojabe: 'Sojabe',
  partenaire: 'Partenaire',
  sponsor: 'Sponsor',
}

interface MembershipCardViewProps {
  profile: Profile
  roleLabel: string
  verificationId: string
}

/**
 * The physical card face: 5.5cm x 8.5cm, rendered in real cm units so it
 * prints/exports at true size regardless of screen DPI. Layout follows the
 * association's spec: photo, role/attribution, member id, name, then a QR
 * (~50% of the card) with a small SAMBO logo centered on it.
 */
export const MembershipCardView = forwardRef<HTMLDivElement, MembershipCardViewProps>(
  function MembershipCardView({ profile, roleLabel, verificationId }, ref) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const fullName = [profile.last_name, profile.first_names].filter(Boolean).join(' ') || '—'

    useEffect(() => {
      const verifyUrl = `${window.location.origin}/verifier/${verificationId}`
      generateQrDataUrl(verifyUrl).then(setQrDataUrl)
    }, [verificationId])

    return (
      <div
        ref={ref}
        style={{ width: '5.5cm', height: '8.5cm' }}
        className="flex flex-col overflow-hidden rounded-[0.15cm] border border-sambo-200 bg-white shadow-lg"
      >
        <div className="flex items-center gap-[0.1cm] bg-sambo-800 px-[0.2cm] py-[0.12cm]">
          <img src="/sambo-logo.png" alt="" style={{ width: '0.4cm', height: '0.4cm' }} className="rounded-full object-cover" />
          <span className="text-[0.24cm] font-semibold tracking-wide text-white">SAMBO</span>
        </div>

        <div className="flex flex-1 flex-col items-center px-[0.25cm] pt-[0.2cm]">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt=""
              style={{ width: '1.6cm', height: '1.6cm' }}
              className="rounded-full border border-sambo-200 object-cover"
            />
          ) : (
            <div
              style={{ width: '1.6cm', height: '1.6cm' }}
              className="flex items-center justify-center rounded-full bg-sambo-100 text-[0.5cm] font-semibold text-sambo-700"
            >
              {(profile.first_names ?? '?').charAt(0)}
            </div>
          )}

          <p className="mt-[0.15cm] text-center text-[0.18cm] font-medium uppercase tracking-wide text-sambo-700">
            {roleLabel}
          </p>
          <p className="text-center text-[0.16cm] text-sambo-700/70">
            {profile.member_number ?? '—'}
          </p>
          <p className="mt-[0.08cm] text-center text-[0.22cm] font-semibold leading-tight text-sambo-950">
            {fullName}
          </p>

          <div className="relative mt-[0.2cm] flex flex-1 items-center justify-center">
            {qrDataUrl && (
              <div className="relative" style={{ width: '4.2cm', height: '4.2cm' }}>
                <img src={qrDataUrl} alt="Code QR de vérification" className="h-full w-full" />
                <img
                  src="/sambo-logo.png"
                  alt=""
                  style={{ width: '0.55cm', height: '0.55cm' }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
)

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category
}
