begin;
alter table public.namiya_stories add column if not exists position integer not null default 0;
update public.namiya_stories set position=issue::integer where position=0;
create or replace view public.namiya_public_stories with(security_invoker=true) as select * from public.namiya_stories where status='published' or(status='scheduled' and publish_at<=now());
create table if not exists public.namiya_site(id text primary key check(id='main'),payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'));
alter table public.namiya_site enable row level security;
create policy "read site copy" on public.namiya_site for select to anon,authenticated using(true);
create policy "admin site copy" on public.namiya_site for all to authenticated using(public.namiya_is_admin()) with check(public.namiya_is_admin());
grant select on public.namiya_site to anon,authenticated;
grant insert,update on public.namiya_site to authenticated;
create or replace function public.namiya_reorder(p_issues text[]) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if not public.namiya_is_admin() then raise exception 'Administrator access required';end if;
 if cardinality(p_issues)>100 or cardinality(p_issues)<>(select count(distinct item) from unnest(p_issues) item) then raise exception 'Invalid story order';end if;
 if exists(select 1 from unnest(p_issues) item where not exists(select 1 from public.namiya_stories where issue=item)) then raise exception 'Story no longer exists';end if;
 update public.namiya_stories s set position=ordered.ordinality from unnest(p_issues) with ordinality as ordered(issue,ordinality) where s.issue=ordered.issue;
end;$$;
revoke all on function public.namiya_reorder(text[]) from public,anon;
grant execute on function public.namiya_reorder(text[]) to authenticated;
commit;
