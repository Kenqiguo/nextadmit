const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../dist/shared-store.js'), 'utf8');
const profile = { nickname: 'Fictional test', origin: 'Test College', major: 'Computer Science',
  term: 'Fall 2026', gpa: 3.5, decisions: [['Test University', 'Admitted']] };
function setup(config, fetch) {
  const context = { window: { NEXTADMIT_DATABASE: config, supabase: { createClient: () => ({auth:{getSession: async()=>({data:{session:{access_token:'test-session'}},error:null})}}) } }, fetch, AbortSignal };
  vm.runInNewContext(source, context);
  return context.window.NextAdmitStore;
}
const config = { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' };
test('unconfigured demo does not make network requests', async () => {
  const store = setup({}, () => { throw Error('Unexpected network request'); });
  assert.equal(store.enabled, false);
  assert.equal((await store.list()).length, 0);
});
test('read query requests approved records only; database metadata wins over payload', async () => {
  const store = setup(config, async (url, options) => {
    assert.match(url, /status=eq.approved/);
    assert.equal(options.headers.apikey, config.publishableKey);
    return { ok: true, json: async () => [{ id: 'row-1', created_at: '2026-10-26T12:00:00Z',
      profile: { ...profile, id: 's1', shared: false, createdAt: 'bad' } }] };
  });
  const [row] = await store.list();
  assert.equal(row.id, 'public-row-1');
  assert.equal(row.shared, true);
  assert.equal(row.createdAt, '2026-10-26T12:00:00Z');
});
test('submission strips local metadata and cannot approve itself', async () => {
  const store = setup(config, async (url, options) => {
    assert.match(url, /rpc\/submit_transfer_profile$/);
    assert.equal(options.headers.Authorization, 'Bearer test-session');
    const body = JSON.parse(options.body);
    assert.equal(body.p_request_id, 'same-retry-id');
    assert.equal(body.p_profile.nickname, profile.nickname);
    for (const key of ['id', 'shared', 'status', 'createdAt']) assert.equal(key in body.p_profile, false);
    return { ok: true, json: async () => 'same-retry-id' };
  });
  await store.submit({ ...profile, id: 'local-1', status: 'approved', shared: true }, 'same-retry-id');
});
test('invalid GPA and malformed decisions are rejected', async () => {
  const store = setup(config, () => { throw Error('Unexpected network request'); });
  await assert.rejects(store.submit({ ...profile, gpa: 4.5 }, 'id'), /check your profile/);
  await assert.rejects(store.submit({ ...profile, decisions: [['Test', 'Fake']] }, 'id'), /check your profile/);
});
test('connection and submission-limit failures do not report success', async () => {
  const offline = setup(config, async () => { throw Error('offline'); });
  await assert.rejects(offline.submit(profile, 'id'), /form is unchanged/);
  const limited = setup(config, async () => ({ ok: false, status: 400,
    json: async () => ({ message: 'Submission limit reached. Please try again later.' }) }));
  await assert.rejects(limited.submit(profile, 'id'), /Submission limit reached/);
});
test('secret keys and non-Supabase destinations are refused', async () => {
  for (const bad of [{ ...config, publishableKey: 'sb_secret_private' },
    { ...config, url: 'https://elsewhere.example' }]) {
    const store = setup(bad, () => { throw Error('Unexpected network request'); });
    await assert.rejects(store.list(), /not configured correctly/);
  }
});
