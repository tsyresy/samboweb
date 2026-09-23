import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { categoryLabel } from '@/components/MembershipCardView'
import { supabase } from '@/lib/supabase'

interface VerificationResult {
  card_status: 'active' | 'revoked'
  member_number: string | null
  category: string
}

export function Verify() {
  const { verificationId } = useParams()
  const [result, setResult] = useState<VerificationResult | null | 'not_found'>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!verificationId) return
    supabase
      .from('card_verification')
      .select('card_status, member_number, category')
      .eq('verification_id', verificationId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setResult(data ?? 'not_found')
        }
        setLoading(false)
      })
  }, [verificationId])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center sm:px-6">
      <img src="/sambo-logo.png" alt="SAMBO" className="mb-6 h-16 w-16 rounded-full object-cover" />

      {loading ? (
        <p className="text-sambo-700/60">Vérification…</p>
      ) : error ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
            !
          </div>
          <h1 className="mt-4 text-xl font-semibold text-sambo-950">Erreur de vérification</h1>
          <p className="mt-2 text-sambo-800/70">Réessayez dans un instant.</p>
        </>
      ) : result === 'not_found' ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
            ✕
          </div>
          <h1 className="mt-4 text-xl font-semibold text-sambo-950">Carte introuvable</h1>
          <p className="mt-2 text-sambo-800/70">Ce code ne correspond à aucune carte SAMBO.</p>
        </>
      ) : result?.card_status === 'active' ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sambo-100 text-3xl text-sambo-700">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-semibold text-sambo-950">Carte valide</h1>
          <p className="mt-2 text-sambo-800/70">
            {result.member_number} — {categoryLabel(result.category)}
          </p>
        </>
      ) : (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
            ✕
          </div>
          <h1 className="mt-4 text-xl font-semibold text-sambo-950">Carte révoquée</h1>
          <p className="mt-2 text-sambo-800/70">Cette carte n'est plus valide.</p>
        </>
      )}
    </div>
  )
}
