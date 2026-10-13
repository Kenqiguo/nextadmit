function applicationTermValue(term) {
  const match = /^(Spring|Summer|Fall|Winter)\s+(\d{4})$/.exec(term || '');
  return match ? Number(match[2]) * 10 + {Winter:0,Spring:1,Summer:2,Fall:3}[match[1]] : null;
}
function submissionTime(profile) {
  const explicit = Date.parse(profile.createdAt || '');
  if (Number.isFinite(explicit)) return explicit;
  const legacy = /^local-(\d+)$/.exec(profile.id || '');
  return legacy ? Number(legacy[1]) : null;
}
function sortProfiles(profiles, mode) {
  const value = mode === 'submitted' ? submissionTime : r => applicationTermValue(r.term);
  if (!['new','old','submitted'].includes(mode)) return profiles;
  return [...profiles].sort((a,b) => {
    const x=value(a), y=value(b);
    if(x===null && y===null)return 0;
    if(x===null)return 1;
    if(y===null)return -1;
    return mode==='old' ? x-y : y-x;
  });
}
