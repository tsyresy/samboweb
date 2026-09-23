-- Phase 2 — journal d'audit
-- Logue automatiquement les changements sensibles sur profiles (statut,
-- catégorie, niveau d'accès, numéro de membre) dans audit_logs.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create function public.log_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
begin
  if new.status is distinct from old.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.category is distinct from old.category then
    changes := changes || jsonb_build_object('category', jsonb_build_object('from', old.category, 'to', new.category));
  end if;
  if new.access_level is distinct from old.access_level then
    changes := changes || jsonb_build_object('access_level', jsonb_build_object('from', old.access_level, 'to', new.access_level));
  end if;
  if new.member_number is distinct from old.member_number then
    changes := changes || jsonb_build_object('member_number', jsonb_build_object('from', old.member_number, 'to', new.member_number));
  end if;

  if changes <> '{}'::jsonb then
    insert into public.audit_logs (actor_user_id, action, target_table, target_id, metadata)
    values (auth.uid(), 'profile_updated', 'profiles', new.id, changes);
  end if;

  return new;
end;
$$;

create trigger profiles_log_changes
  after update on public.profiles
  for each row execute function public.log_profile_changes();
