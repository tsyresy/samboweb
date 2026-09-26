-- Journal d'audit des adidy complet
--
-- 1. Le trigger d'audit de dues_records ne se déclenchait que sur UPDATE.
--    L'écran admin enregistre par upsert : la toute première saisie d'un
--    paiement (création de la ligne) n'était donc jamais journalisée, seules
--    les corrections suivantes l'étaient. Il couvre désormais INSERT, et
--    trace aussi la date de paiement et la note.
-- 2. Chaque entrée porte son contexte (membre, année, mois) dans
--    metadata.context, pour que le journal reste lisible même si la ligne
--    est supprimée plus tard.
-- 3. Les montants mensuels (dues_rules) sont journalisés : création,
--    modification, suppression (retour au montant par défaut).
--
-- À exécuter dans Supabase Dashboard → SQL Editor → Run.

create or replace function public.log_dues_record_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changes jsonb := '{}'::jsonb;
  old_row public.dues_records;
begin
  -- On INSERT there is no previous state: every field goes from null.
  if tg_op = 'UPDATE' then
    old_row := old;
  end if;

  if new.status is distinct from old_row.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', old_row.status, 'to', new.status));
  end if;
  if new.amount_paid is distinct from old_row.amount_paid then
    changes := changes || jsonb_build_object('amount_paid', jsonb_build_object('from', old_row.amount_paid, 'to', new.amount_paid));
  end if;
  if new.payment_date is distinct from old_row.payment_date then
    changes := changes || jsonb_build_object('payment_date', jsonb_build_object('from', old_row.payment_date, 'to', new.payment_date));
  end if;
  if new.payment_method is distinct from old_row.payment_method then
    changes := changes || jsonb_build_object('payment_method', jsonb_build_object('from', old_row.payment_method, 'to', new.payment_method));
  end if;
  if new.reference is distinct from old_row.reference then
    changes := changes || jsonb_build_object('reference', jsonb_build_object('from', old_row.reference, 'to', new.reference));
  end if;
  if new.note is distinct from old_row.note then
    changes := changes || jsonb_build_object('note', jsonb_build_object('from', old_row.note, 'to', new.note));
  end if;

  if changes <> '{}'::jsonb then
    insert into public.audit_logs (actor_user_id, action, target_table, target_id, metadata)
    values (
      auth.uid(),
      case when tg_op = 'INSERT' then 'dues_record_created' else 'dues_record_updated' end,
      'dues_records',
      new.id,
      changes || jsonb_build_object(
        'context', jsonb_build_object('profile_id', new.profile_id, 'year', new.year, 'month', new.month)
      )
    );
  end if;

  return new;
end;
$$;

drop trigger dues_records_log_changes on public.dues_records;

create trigger dues_records_log_changes
  after insert or update on public.dues_records
  for each row execute function public.log_dues_record_changes();

create function public.log_dues_rule_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rule public.dues_rules;
begin
  if tg_op = 'DELETE' then
    rule := old;
  else
    rule := new;
  end if;

  if tg_op = 'UPDATE' and new.amount is not distinct from old.amount then
    return new;
  end if;

  insert into public.audit_logs (actor_user_id, action, target_table, target_id, metadata)
  values (
    auth.uid(),
    case tg_op
      when 'INSERT' then 'dues_rule_created'
      when 'UPDATE' then 'dues_rule_updated'
      else 'dues_rule_deleted'
    end,
    'dues_rules',
    rule.id,
    jsonb_build_object(
      'amount', jsonb_build_object(
        'from', case when tg_op = 'INSERT' then null else old.amount end,
        'to', case when tg_op = 'DELETE' then null else new.amount end
      ),
      'context', jsonb_build_object('year', rule.year, 'month', rule.month, 'category', rule.category)
    )
  );

  return rule;
end;
$$;

create trigger dues_rules_log_changes
  after insert or update or delete on public.dues_rules
  for each row execute function public.log_dues_rule_changes();

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
