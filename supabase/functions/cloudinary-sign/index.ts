// Signs a Cloudinary upload on the server so the API secret never reaches
// the client. Called by the frontend before a direct browser -> Cloudinary
// upload (see src/lib/cloudinary.ts, uploadSignedPhoto).
//
// Requires these secrets to be set on the Supabase project
// (Dashboard -> Edge Functions -> Secrets, or `supabase secrets set`):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
// SUPABASE_URL and SUPABASE_ANON_KEY are provided automatically by the
// Edge Runtime.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME')!
const API_KEY = Deno.env.get('CLOUDINARY_API_KEY')!
const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')!

// Browsers send a CORS preflight (OPTIONS) before the real POST, and
// expect these headers on every response, preflight included — without
// them the browser blocks the request entirely before it even reaches
// the "Unauthorized"/success logic below.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha1(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Photos are scoped to the calling member's own user id — nobody can
  // sign an upload into someone else's folder.
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `sambo/profiles/${user.id}`
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = await sha1(paramsToSign + API_SECRET)

  return new Response(
    JSON.stringify({ signature, timestamp, api_key: API_KEY, cloud_name: CLOUD_NAME, folder }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
