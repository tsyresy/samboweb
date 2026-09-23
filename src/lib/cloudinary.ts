import { supabase } from '@/lib/supabase'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

/** Builds a delivery URL for a public Cloudinary asset (logo, news photos, gallery). */
export function cloudinaryUrl(publicIdOrUrl: string, transform = 'f_auto,q_auto') {
  if (publicIdOrUrl.startsWith('http')) return publicIdOrUrl
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicIdOrUrl}`
}

/**
 * Unsigned upload for public content only (news photos, gallery, testimonials).
 * Member photos and anything private must go through a signed upload
 * from a Supabase Edge Function instead, so access stays controlled.
 */
export async function uploadPublicImage(file: File) {
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', preset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error("Échec de l'envoi de l'image")
  return res.json() as Promise<{ secure_url: string; public_id: string }>
}

/**
 * Signed upload for a member's own private photo. Gets a one-time
 * signature from the `cloudinary-sign` Edge Function (which holds the
 * Cloudinary API secret server-side) and uploads directly to Cloudinary
 * from the browser — the secret never passes through client code.
 */
export async function uploadSignedPhoto(file: File) {
  const { data: signData, error: signError } = await supabase.functions.invoke('cloudinary-sign')
  if (signError || !signData) {
    throw new Error("Impossible d'obtenir une autorisation d'envoi. Réessayez plus tard.")
  }

  const { signature, timestamp, api_key, cloud_name, folder } = signData as {
    signature: string
    timestamp: number
    api_key: string
    cloud_name: string
    folder: string
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', api_key)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error("Échec de l'envoi de la photo")
  return res.json() as Promise<{ secure_url: string; public_id: string }>
}
