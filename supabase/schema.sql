begin;
create table if not exists public.namiya_admins(email text primary key);
alter table public.namiya_admins enable row level security;
create or replace function public.namiya_is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.namiya_admins where email=lower(auth.jwt()->>'email')) and auth.uid() is not null;
$$;
create table if not exists public.namiya_stories(
 issue text primary key check(issue ~ '^\d{3}$'),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 status text not null default 'draft' check(status in ('draft','published','scheduled')),
 publish_at timestamptz,
 updated_at timestamptz not null default now(),
 check(status<>'scheduled' or publish_at is not null)
);
alter table public.namiya_stories enable row level security;
create policy "published stories" on public.namiya_stories for select to anon,authenticated using(status='published' or (status='scheduled' and publish_at<=now()) or public.namiya_is_admin());
create policy "admin story writes" on public.namiya_stories for all to authenticated using(public.namiya_is_admin()) with check(public.namiya_is_admin());
create or replace view public.namiya_public_stories with(security_invoker=true) as select * from public.namiya_stories where status='published' or(status='scheduled' and publish_at<=now());
grant select on public.namiya_public_stories to anon,authenticated;
create or replace function public.namiya_timestamp() returns trigger language plpgsql set search_path=public,pg_temp as $$begin new.updated_at=clock_timestamp();return new;end;$$;
create trigger namiya_story_timestamp before update on public.namiya_stories for each row execute function public.namiya_timestamp();
create table if not exists public.namiya_settings(id text primary key check(id='hero'), path text not null);
alter table public.namiya_settings enable row level security;
create policy "read hero" on public.namiya_settings for select using(true);
create policy "admin hero writes" on public.namiya_settings for all to authenticated using(public.namiya_is_admin()) with check(public.namiya_is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('namiya','namiya',false,5242880,array['image/jpeg']) on conflict(id) do nothing;
create policy "admin photo uploads" on storage.objects for insert to authenticated with check(bucket_id='namiya' and public.namiya_is_admin());
create policy "read visible photos" on storage.objects for select to anon,authenticated using(bucket_id='namiya' and (
 public.namiya_is_admin() or exists(select 1 from public.namiya_settings where path=name)
 or exists(select 1 from public.namiya_stories s where (s.status='published' or (s.status='scheduled' and s.publish_at<=now())) and s.payload->'images' ? ('cloud/'||name))
));
create table if not exists public.namiya_comments(
 id uuid primary key default gen_random_uuid(),issue text not null references public.namiya_stories(issue),
 visitor uuid not null,author text not null check(length(author) between 1 and 80),instagram text not null default '' check(length(instagram)<=100),
 body text not null check(length(body) between 1 and 2000),approved boolean not null default false,created_at timestamptz not null default now()
);
alter table public.namiya_comments enable row level security;
create policy "admin comments" on public.namiya_comments for all to authenticated using(public.namiya_is_admin()) with check(public.namiya_is_admin());
create table if not exists public.namiya_likes(issue text references public.namiya_stories(issue),visitor uuid,primary key(issue,visitor));
alter table public.namiya_likes enable row level security;
create or replace function public.namiya_feedback(p_issue text) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select case when exists(select 1 from public.namiya_stories where issue=p_issue and (status='published' or(status='scheduled' and publish_at<=now()))) then
 jsonb_build_object('likes',(select count(*) from public.namiya_likes where issue=p_issue),'comments',coalesce((select jsonb_agg(jsonb_build_object('id',id,'author',author,'instagram',instagram,'body',body,'created_at',created_at) order by created_at) from (select * from public.namiya_comments where issue=p_issue and approved order by created_at desc limit 100) c),'[]'::jsonb)) else null end;
$$;
create or replace function public.namiya_like(p_issue text,p_visitor uuid,p_liked boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.namiya_stories where issue=p_issue and(status='published' or(status='scheduled' and publish_at<=now()))) then raise exception 'Story unavailable';end if;
 if p_liked then insert into public.namiya_likes values(p_issue,p_visitor) on conflict do nothing;else delete from public.namiya_likes where issue=p_issue and visitor=p_visitor;end if;
end;$$;
create or replace function public.namiya_comment(p_issue text,p_visitor uuid,p_author text,p_instagram text,p_body text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.namiya_stories where issue=p_issue and(status='published' or(status='scheduled' and publish_at<=now()))) then raise exception 'Story unavailable';end if;
 perform pg_advisory_xact_lock(hashtext(p_visitor::text));
 if exists(select 1 from public.namiya_comments where visitor=p_visitor and created_at>now()-interval '1 minute') then raise exception 'Please wait one minute';end if;
 insert into public.namiya_comments(issue,visitor,author,instagram,body) values(p_issue,p_visitor,trim(p_author),trim(p_instagram),trim(p_body));
end;$$;
grant select on public.namiya_stories,public.namiya_settings to anon,authenticated;
grant insert,update,delete on public.namiya_stories,public.namiya_settings,public.namiya_comments to authenticated;
grant select on public.namiya_comments to authenticated;
revoke all on public.namiya_admins,public.namiya_likes from anon,authenticated;
revoke all on function public.namiya_timestamp() from public,anon,authenticated;
revoke all on function public.namiya_is_admin(),public.namiya_feedback(text),public.namiya_like(text,uuid,boolean),public.namiya_comment(text,uuid,text,text,text) from public;
grant execute on function public.namiya_is_admin(),public.namiya_feedback(text),public.namiya_like(text,uuid,boolean),public.namiya_comment(text,uuid,text,text,text) to anon,authenticated;
commit;
