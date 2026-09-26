import { forwardRef, useEffect, useState } from 'react'
import { generateQrDataUrl } from '@/lib/qrcode'
import type { Profile } from '@/types'

interface MembershipCardViewProps {
  profile: Profile
  roleLabel: string
  verificationId: string
}

const BOX_BORDER = '#B5B7B8'
const RED = '#D02B30'
const GREEN = '#34A750'

/**
 * The physical card face: 8.5cm x 5.5cm (landscape), rendered in real cm
 * units so it prints/exports at true size regardless of screen DPI.
 * Layout reproduces Assets/reference carte membre.png exactly: photo top
 * left, logo + member id top center, a QR box top right (taller than the
 * photo box, reaching down to the divider line), attribution/role under
 * the photo, a black divider, then Nom / Prénom lines and a signature
 * space, with red and green ribbon accents in the top-right and
 * bottom-left corners.
 */
export const MembershipCardView = forwardRef<HTMLDivElement, MembershipCardViewProps>(
  function MembershipCardView({ profile, roleLabel, verificationId }, ref) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const lastName = profile.last_name ?? ''
    const firstNames = profile.first_names ?? ''

    useEffect(() => {
      const verifyUrl = `${window.location.origin}/verifier/${verificationId}`
      generateQrDataUrl(verifyUrl).then(setQrDataUrl)
    }, [verificationId])

    return (
      <div
        ref={ref}
        style={{ width: '8.5cm', height: '5.5cm' }}
        className="relative overflow-hidden rounded-[0.1cm] border border-sambo-200 bg-white shadow-lg"
      >
        {/* Corner ribbon accents */}
        <svg
          viewBox="0 0 8.5 5.5"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <path
            d="M 8.5,0 L 8.5,1.65 C 7.9,1.8 7.55,1.38 7.1,1.15 C 6.6,0.95 6.15,1.15 5.85,0.85 C 5.6,0.6 5.75,0.15 6.1,0 Z"
            fill={RED}
          />
          <path
            d="M 0,5.5 L 0,3.85 C 0.6,3.7 0.95,4.12 1.4,4.32 C 1.9,4.52 2.35,4.32 2.65,4.62 C 2.9,4.87 2.75,5.32 2.4,5.5 Z"
            fill={GREEN}
          />
        </svg>

        {/* Photo box */}
        <div
          className="absolute flex items-center justify-center overflow-hidden rounded-[0.2cm]"
          style={{
            left: '0.7cm',
            top: '0.55cm',
            width: '2.18cm',
            height: '2.15cm',
            border: `0.045cm solid ${BOX_BORDER}`,
            background: '#F1F3F4',
          }}
        >
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[0.22cm] font-medium text-sambo-700/50">photo</span>
          )}
        </div>

        {/* Logo + member number */}
        <div className="absolute flex flex-col items-center" style={{ left: '3.2cm', top: '0.25cm', width: '2.1cm' }}>
          <img src="/sambo-logo.png" alt="SAMBO" className="h-[1.45cm] w-[1.45cm] rounded-full object-cover" />
          <p className="mt-[0.15cm] whitespace-nowrap text-[0.2cm] font-medium text-sambo-700/70">
            {profile.member_number ?? '—'}
          </p>
        </div>

        {/* QR box */}
        <div
          className="absolute flex items-center justify-center overflow-hidden rounded-[0.2cm]"
          style={{
            left: '5.0cm',
            top: '0.55cm',
            width: '3.08cm',
            height: '3.17cm',
            border: `0.045cm solid ${BOX_BORDER}`,
            background: '#E5E6E6',
          }}
        >
          {qrDataUrl ? (
            <div className="relative" style={{ width: '2.7cm', height: '2.7cm' }}>
              <img src={qrDataUrl} alt="Code QR de vérification" className="h-full w-full" />
              <img
                src="/sambo-logo.png"
                alt=""
                style={{ width: '0.4cm', height: '0.4cm' }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white object-cover"
              />
            </div>
          ) : (
            <span className="text-[0.22cm] font-medium text-sambo-700/50">Qr code</span>
          )}
        </div>

        {/* Attribution / role */}
        <div
          className="absolute border-b-2 border-dashed pb-[0.03cm]"
          style={{ left: '0.7cm', top: '2.95cm', width: '4.2cm', borderColor: BOX_BORDER }}
        >
          <span className="text-[0.24cm] font-bold text-sambo-900/70">{roleLabel}</span>
        </div>

        {/* Divider */}
        <div className="absolute inset-x-0" style={{ top: '3.76cm', height: '0.03cm', background: '#000' }} />

        {/* Nom / Prénom / signature — explicit absolute positions, not
            stacked margins, so nothing can drift past the card's bottom
            edge (and get silently clipped by overflow-hidden) as text
            metrics vary slightly across browsers/fonts. */}
        <div
          className="absolute flex items-baseline gap-[0.15cm] border-b border-dotted border-sambo-900/60 pb-[0.04cm]"
          style={{ left: '0.7cm', top: '3.95cm', width: '7.1cm' }}
        >
          <span className="whitespace-nowrap text-[0.24cm] font-bold text-sambo-950">Nom:</span>
          <span className="text-[0.22cm] text-sambo-950">{lastName}</span>
        </div>
        <div
          className="absolute flex items-baseline gap-[0.15cm] border-b border-dotted border-sambo-900/60 pb-[0.04cm]"
          style={{ left: '0.7cm', top: '4.45cm', width: '7.1cm' }}
        >
          <span className="whitespace-nowrap text-[0.24cm] font-bold text-sambo-950">Prenom:</span>
          <span className="text-[0.22cm] text-sambo-950">{firstNames}</span>
        </div>
        <p
          className="absolute text-right text-[0.18cm] text-sambo-900/70"
          style={{ left: '0.7cm', top: '4.95cm', width: '7.1cm' }}
        >
          signature:
        </p>
      </div>
    )
  },
)
