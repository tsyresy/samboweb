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
