// Local PostgreSQL verification only. The temporary dependency is not shipped.
const { PGlite } = require('../tmp/database-check/node_modules/@electric-sql/pglite');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; grant usage on schema public to anon, authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
  const userId=randomUUID();
  await db.query('insert into auth.users(id) values ($1)',[userId]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userId]);
  await db.exec(readFileSync(path.join(__dirname, '../supabase/migrations/202610260001_shared_profiles.sql'), 'utf8'));
  const profile = { nickname: 'Fictional DB test', origin: 'Fictional College', major: 'Computer Science',
    term: 'Fall 2026', type: 'Community college', background: 'International', gpa: 3.75,
    englishBackground: 'native', credits: '60', decisions: [['Fictional University', 'Admitted']],
    final: 'Fictional University' };
  async function submit(value, id = randomUUID()) {
    return db.query('select public.submit_transfer_profile($1::uuid,$2::jsonb)', [id, JSON.stringify(value)]);
  }
  await db.exec('set role anon');
  await assert.rejects(submit(profile), /permission denied/);
  await db.exec('reset role; set role authenticated');
  const id = randomUUID();
  await submit(profile, id);
  await submit(profile, id);
  assert.equal((await db.query('select id,profile from public.transfer_profiles')).rows.length, 0, 'Pending data must be private');
  for (const sql of ["insert into public.transfer_profiles(id,profile) values (gen_random_uuid(),'{}')",
    "update public.transfer_profiles set status='approved'", 'delete from public.transfer_profiles']) {
    await assert.rejects(db.exec(sql), /permission denied/);
  }
  for (const bad of [ { ...profile, gpa: 9 }, { ...profile, status: 'approved' },
    { ...profile, nickname: '' }, { ...profile, gpa: null }, { ...profile, decisions: null },
    { ...profile, decisions: [['Fictional University','Admitted'],['fictional university','Rejected']] },
    { ...profile, decisions: [['Fictional University','invented']] }, { ...profile, final: 'Other' },
    { ...profile, englishBackground: 'test' }, { ...profile, activities: 'x'.repeat(2501) } ]) {
    await assert.rejects(submit(bad), undefined, 'Invalid submission must fail in the database');
  }
  await db.exec('reset role');
  assert.equal((await db.query('select id,profile from public.transfer_profiles')).rows.length, 1, 'Retry must not duplicate');
  await db.query("update public.transfer_profiles set status='approved' where id=$1", [id]);
  await db.exec('set role anon');
  assert.equal((await db.query('select id,profile from public.transfer_profiles')).rows.length, 1);
  await db.exec('reset role');
  await db.query("update public.transfer_profiles set status='rejected' where id=$1", [id]);
  await db.exec('set role anon');
  assert.equal((await db.query('select id,profile from public.transfer_profiles')).rows.length, 0);
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userId]);
  await db.exec('set role authenticated');
  for(let i=0;i<4;i++) await submit(profile);
  await assert.rejects(submit(profile), /Submission limit reached/);
  for(let i=0;i<15;i++) {
    await db.exec('reset role'); const otherId=randomUUID();
    await db.query('insert into auth.users(id) values ($1)',[otherId]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[otherId]);
    await db.exec('set role authenticated'); await submit(profile);
  }
  await assert.rejects(submit(profile), /Submission limit reached/);
  await db.exec('reset role');
  await db.exec("update public.transfer_profiles set created_at=now()-interval '2 minutes';");
  await db.exec("insert into public.transfer_profiles(id,submitter_id,profile,created_at) select gen_random_uuid(), (select id from auth.users limit 1), '{}'::jsonb,now()-interval '2 minutes' from generate_series(1,280)");
  await db.exec('set role authenticated');
  await assert.rejects(submit(profile), /Submission limit reached/);
  await db.close();
  console.log('PASS: migration, anonymous read isolation, no visitor writes/approval/deletion, server validation, retry deduplication, moderation visibility, per-session, minute and daily limits.');
})().catch(error => { console.error(error); process.exitCode = 1; });
