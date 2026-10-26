-- Run once in a dedicated NextAdmit Supabase project's SQL editor.
-- Visitors can read approved profiles and submit through one validated function.
-- Approval and deletion are performed by the owner in the Supabase dashboard.
begin;

create schema if not exists nextadmit_private;
revoke all on schema nextadmit_private from public, anon;
grant usage on schema nextadmit_private to authenticated;

create table public.transfer_profiles (
  id uuid primary key,
  submitter_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  profile jsonb not null check (jsonb_typeof(profile) = 'object' and octet_length(profile::text) <= 24000)
);
create index transfer_profiles_public_order on public.transfer_profiles (created_at desc, id desc) where status = 'approved';
create index transfer_profiles_submission_time on public.transfer_profiles (created_at);
create index transfer_profiles_submitter_time on public.transfer_profiles (submitter_id, created_at desc);

alter table public.transfer_profiles enable row level security;
revoke all on public.transfer_profiles from public, anon, authenticated;
grant select (id, created_at, status, profile) on public.transfer_profiles to anon, authenticated;
create policy "Read approved profiles only" on public.transfer_profiles
  for select to anon, authenticated using (status = 'approved');

create function nextadmit_private.submit_transfer_profile(p_request_id uuid, p_profile jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  field text;
  decision jsonb;
  school text;
  seen text[] := '{}';
  allowed text[] := array['nickname','term','major','gpa','origin','type','background',
    'credits','final','story','competitions','activities','yearLevel',
    'englishBackground','englishTest','englishScore','decisions'];
begin
  if auth.uid() is null then
    raise exception 'A submission session is required.' using errcode = '42501';
  end if;
  if p_request_id is null or p_profile is null or jsonb_typeof(p_profile) <> 'object'
    or octet_length(p_profile::text) > 24000 then
    raise exception 'Invalid submission.' using errcode = '22023';
  end if;
  for field in select jsonb_object_keys(p_profile) loop
    if not (field = any(allowed)) then
      raise exception 'Unexpected profile field.' using errcode = '22023';
    end if;
    if field not in ('gpa', 'decisions') and jsonb_typeof(p_profile->field) <> 'string' then
      raise exception 'Invalid text field.' using errcode = '22023';
    end if;
  end loop;
  foreach field in array array['nickname','term','major','origin','type','background'] loop
    if coalesce(length(btrim(p_profile->>field)), 0) = 0 then
      raise exception 'Required field is missing.' using errcode = '22023';
    end if;
  end loop;
  if length(p_profile->>'nickname') > 30 or length(p_profile->>'origin') > 100
    or length(coalesce(p_profile->>'final','')) > 100
    or length(coalesce(p_profile->>'yearLevel','')) > 100
    or length(coalesce(p_profile->>'story','')) > 2500
    or length(coalesce(p_profile->>'activities','')) > 2500
    or length(coalesce(p_profile->>'competitions','')) > 2000
    or length(coalesce(p_profile->>'englishScore','')) > 160 then
    raise exception 'Profile text is too long.' using errcode = '22023';
  end if;
  if not (p_profile->>'term' = any(array['Fall 2026','Spring 2026','Fall 2025']))
    or not (p_profile->>'major' = any(array['Computer Science','Business','Engineering','Psychology','Economics']))
    or not (p_profile->>'type' = any(array['Community college','US four-year university','International university']))
    or not (p_profile->>'background' = any(array['International','Domestic']))
    or not (coalesce(p_profile->>'englishBackground','not-shared') = any(array['native','test','waived','not-taken','not-shared'])) then
    raise exception 'Invalid profile choice.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_profile->'gpa') is distinct from 'number' then
    raise exception 'GPA must be a number.' using errcode = '22023';
  end if;
  if (p_profile->>'gpa')::numeric not between 0 and 4 then
    raise exception 'GPA must be between 0 and 4.' using errcode = '22023';
  end if;
  if coalesce(p_profile->>'credits','') <> '' then
    if not (p_profile->>'credits' ~ '^[0-9]{1,3}$') then
      raise exception 'Invalid credits.' using errcode = '22023';
    end if;
    if (p_profile->>'credits')::integer > 300 then
      raise exception 'Invalid credits.' using errcode = '22023';
    end if;
  end if;
  if p_profile->>'englishBackground' = 'test' then
    if coalesce(length(btrim(p_profile->>'englishScore')),0) = 0 or
       not (coalesce(p_profile->>'englishTest','') = any(array['TOEFL iBT','IELTS Academic','Duolingo English Test','Other'])) then
      raise exception 'Please provide your English test and score.' using errcode = '22023';
    end if;
  end if;
  if jsonb_typeof(p_profile->'decisions') is distinct from 'array' then
    raise exception 'Admission decisions are required.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_profile->'decisions') not between 1 and 30 then
    raise exception 'Provide between 1 and 30 admission decisions.' using errcode = '22023';
  end if;
  for decision in select value from jsonb_array_elements(p_profile->'decisions') loop
    if jsonb_typeof(decision) <> 'array' then
      raise exception 'Invalid admission decision.' using errcode = '22023';
    end if;
    if jsonb_array_length(decision) <> 2 or jsonb_typeof(decision->0) <> 'string'
      or jsonb_typeof(decision->1) <> 'string' then
      raise exception 'Invalid admission decision.' using errcode = '22023';
    end if;
    school := btrim(decision->>0);
    if length(school) not between 1 and 100 or lower(school) = any(seen)
      or not (decision->>1 = any(array['Admitted','Rejected','Waitlisted','Pending'])) then
      raise exception 'Invalid or duplicate admission decision.' using errcode = '22023';
    end if;
    seen := array_append(seen, lower(school));
  end loop;
  if btrim(coalesce(p_profile->>'final','')) <> '' and not exists (
    select 1 from jsonb_array_elements(p_profile->'decisions') as d(value)
    where lower(btrim(value->>0)) = lower(btrim(p_profile->>'final')) and value->>1 = 'Admitted'
  ) then
    raise exception 'Final choice must be an admitted university.' using errcode = '22023';
  end if;

  -- Serialize submission checks. These are site-wide bounds, not a per-person CAPTCHA.
  perform pg_advisory_xact_lock(2601026);
  -- A retry with the same UUID never creates a second submission.
  if exists (select 1 from public.transfer_profiles where id = p_request_id) then
    if exists (select 1 from public.transfer_profiles where id = p_request_id and submitter_id = auth.uid()) then
      return p_request_id;
    end if;
    raise exception 'Submission ID is already in use.' using errcode = '22023';
  end if;
  if (select count(*) from public.transfer_profiles where created_at > now() - interval '1 minute') >= 20
    or (select count(*) from public.transfer_profiles where created_at > now() - interval '24 hours') >= 300 then
    raise exception 'Submission limit reached. Please try again later.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.transfer_profiles where submitter_id = auth.uid() and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Submission limit reached. Please try again later.' using errcode = 'P0001';
  end if;
  insert into public.transfer_profiles (id, submitter_id, profile) values (p_request_id, auth.uid(), p_profile);
  return p_request_id;
end;
$$;
revoke all on function nextadmit_private.submit_transfer_profile(uuid, jsonb) from public, anon;
grant execute on function nextadmit_private.submit_transfer_profile(uuid, jsonb) to authenticated;

-- Exposed wrapper has no elevated privileges; privileged code stays outside public.
create function public.submit_transfer_profile(p_request_id uuid, p_profile jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select nextadmit_private.submit_transfer_profile(p_request_id, p_profile);
$$;
revoke all on function public.submit_transfer_profile(uuid, jsonb) from public, anon;
grant execute on function public.submit_transfer_profile(uuid, jsonb) to authenticated;
commit;
