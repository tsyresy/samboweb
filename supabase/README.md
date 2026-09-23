# Migrations Supabase — E-Sambo

## Comment appliquer une migration

1. Ouvrir https://supabase.com/dashboard/project/svifjplsxoeccesskfsu/sql/new
2. Coller le contenu du fichier de migration le plus récent dans
   `supabase/migrations/`.
3. Cliquer **Run**.

(Alternative : `supabase login` avec le compte propriétaire du projet, puis
`supabase link --project-ref svifjplsxoeccesskfsu` et
`supabase db push`.)

Voir `Historiques.md` à la racine du projet pour le détail de ce que chaque
migration fait et ce qui reste à faire.
