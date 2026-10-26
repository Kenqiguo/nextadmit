(() => {
  if (!NextAdmitStore.enabled) return;
  $('#explore .notice').textContent = 'Community profiles are self-reported, not verified admission records. Fictional examples are labeled separately. Older browser-only profiles remain private. Showing up to 500 latest approved community profiles.';
  $('#share .notice').textContent = 'Submissions are stored in our shared database and become public after review. Use a nickname. Do not include contact details, student IDs, or other private information.';
  const consent = $('#share-form .check');
  consent.lastChild.textContent = ' I agree to store this submission in the shared database and display its contents publicly after review. I have permission to share this information.';
  consent.querySelector('input').checked = false;
  $('#share-form button[type="submit"]').textContent = 'Submit for review ↗';
  const storyNote = document.querySelector('.story-note p');
  if (storyNote) storyNote.textContent = 'This is an early prototype. Fictional example profiles are labeled. Community submissions are self-reported and appear publicly after review. Older browser-only records stay private. Shared experiences are not admission guarantees.';
  const status = document.createElement('div');
  status.className = 'shared-status';
  status.setAttribute('role', 'status');
  const message = document.createElement('span');
  const refresh = document.createElement('button');
  refresh.className = 'text-button';
  refresh.type = 'button';
  refresh.textContent = 'Refresh community profiles';
  status.append(message, refresh);
  $('#explore .notice').after(status);
  let loading = false;
  async function load() {
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    message.textContent = 'Loading community profiles…';
    try {
      sharedProfiles = await NextAdmitStore.list();
      render();
      message.textContent = `${sharedProfiles.length} approved community profiles loaded. Fictional examples and your older private records are also available below.`;
    } catch (error) {
      message.textContent = 'Community profiles could not refresh. Previously loaded profiles, fictional examples, and older browser-only records are still shown.';
    } finally {
      loading = false;
      refresh.disabled = false;
    }
  }
  refresh.addEventListener('click', load);
  load();
})();
