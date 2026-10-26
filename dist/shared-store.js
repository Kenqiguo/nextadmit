/* Public reads over REST; submissions use the official SDK's anonymous sessions. */
(() => {
  const config = window.NEXTADMIT_DATABASE || {};
  const enabled = Boolean(config.url || config.publishableKey);
  let client;
  async function submissionToken() {
    endpoint('');
    if (!window.supabase?.createClient) throw new Error('The submission service could not load. Please refresh and try again.');
    client ||= window.supabase.createClient(config.url, config.publishableKey, {
      auth: { storageKey: 'nextadmit-anonymous-session', detectSessionInUrl: false }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw new Error('Your submission session could not load. Please refresh and try again.');
    if (data.session) return data.session.access_token;
    const signedIn = await client.auth.signInAnonymously();
    if (signedIn.error || !signedIn.data.session) throw new Error('Could not start an anonymous submission session. Please try again or contact the site owner.');
    return signedIn.data.session.access_token;
  }
  const fields = ['nickname', 'term', 'major', 'gpa', 'origin', 'type', 'background',
    'credits', 'final', 'story', 'competitions', 'activities', 'yearLevel',
    'englishBackground', 'englishTest', 'englishScore', 'decisions'];
  const valid = profile => profile && typeof profile === 'object' &&
    typeof profile.nickname === 'string' && typeof profile.origin === 'string' &&
    typeof profile.major === 'string' && typeof profile.term === 'string' &&
    Number.isFinite(profile.gpa) && profile.gpa >= 0 && profile.gpa <= 4 &&
    Array.isArray(profile.decisions) && profile.decisions.length > 0 &&
    profile.decisions.every(d => Array.isArray(d) && d.length === 2 &&
      typeof d[0] === 'string' && ['Admitted', 'Rejected', 'Waitlisted', 'Pending'].includes(d[1]));
  function endpoint(path) {
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url || '') ||
        !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey || '')) {
      throw new Error('Shared submissions are not configured correctly. Please contact the site owner.');
    }
    return config.url.replace(/\/$/, '') + '/rest/v1/' + path;
  }
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(endpoint(path), {
        ...options,
        headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', ...options.headers },
        signal: AbortSignal.timeout(15000)
      });
    } catch (error) {
      if (error.message.startsWith('Shared submissions are not configured')) throw error;
      throw new Error('Could not reach the shared database. Your form is unchanged; please try again.');
    }
    if (!response.ok) {
      if (response.status === 429) throw new Error('Too many submissions right now. Please try again later.');
      const detail = await response.json().catch(() => ({}));
      if (detail.message === 'Submission limit reached. Please try again later.') throw new Error(detail.message);
      throw new Error('The shared database could not complete this request. Please try again or contact the site owner.');
    }
    return response.json();
  }
  window.NextAdmitStore = {
    enabled,
    async list() {
      if (!enabled) return [];
      const rows = await request('transfer_profiles?select=id,profile,created_at&status=eq.approved&order=created_at.desc,id.desc&limit=500');
      if (!Array.isArray(rows) || rows.some(row => !valid(row.profile) ||
          typeof row.id !== 'string' || !Number.isFinite(Date.parse(row.created_at)))) {
        throw new Error('Shared profiles could not be read. Please contact the site owner.');
      }
      return rows.map(row => ({ ...row.profile, id: 'public-' + row.id, createdAt: row.created_at, shared: true }));
    },
    async submit(profile, requestId) {
      if (!enabled) throw new Error('Shared submissions are not configured.');
      if (!valid(profile)) throw new Error('Please check your profile and admission decisions.');
      const clean = Object.fromEntries(fields.filter(key => profile[key] !== undefined).map(key => [key, profile[key]]));
      const token = await submissionToken();
      await request('rpc/submit_transfer_profile', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ p_request_id: requestId, p_profile: clean })
      });
    }
  };
})();
