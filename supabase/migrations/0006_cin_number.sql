-- Ajoute le numéro de Carte d'Identité Nationale (CIN) au profil, capturé
-- dès l'inscription.
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

alter table public.profiles add column cin_number text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_profile_id uuid;
begin
  insert into public.profiles (
    user_id, last_name, first_names, nickname, birth_date,
    phone, phone_secondary, email, residence,
    still_studying, faculty, program, study_level, student_id,
    cin_number,
    category
  ) values (
    new.id,
    meta ->> 'last_name',
    meta ->> 'first_names',
    meta ->> 'nickname',
    nullif(meta ->> 'birth_date', '')::date,
    meta ->> 'phone',
    meta ->> 'phone_secondary',
    new.email,
    meta ->> 'residence',
    coalesce((meta ->> 'still_studying')::boolean, true),
    meta ->> 'faculty',
    meta ->> 'program',
    meta ->> 'study_level',
    meta ->> 'student_id',
    meta ->> 'cin_number',
    coalesce((meta ->> 'category')::public.membership_category_t, 'membre_standard')
  )
  returning id into v_profile_id;

  if (meta ->> 'emergency_contact_name') is not null then
    insert into public.emergency_contacts (profile_id, contact_name, contact_phone)
    values (
      v_profile_id,
      meta ->> 'emergency_contact_name',
      meta ->> 'emergency_contact_phone'
    );
  end if;

  return new;
end;
$$;
