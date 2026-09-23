# E-Sambo

Site vitrine et application web privée de l'association étudiante SAMBO.

Voir `Historiques.md` pour l'état d'avancement détaillé, phase par phase.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router
- Supabase (Auth, Postgres, RLS) — schéma dans `supabase/migrations/`
- Cloudinary (médias publics ; les uploads privés passent par une Edge Function signée, à venir)

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (voir docs/)
npm run dev
```

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production (`tsc -b && vite build`)
- `npm run preview` — sert le build de production en local
- `npm run lint` — oxlint
