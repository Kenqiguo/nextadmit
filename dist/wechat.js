(() => {
  const widget = document.getElementById('wechat-widget');
  const toggle = document.getElementById('wechat-toggle');
  const panel = document.getElementById('wechat-panel');
  let drag = null;
  let moved = false;
  function fit() {
    const box = widget.getBoundingClientRect();
    const x = Math.max(12, Math.min(box.left, innerWidth - box.width - 12));
    const y = Math.max(12, Math.min(box.top, innerHeight - box.height - 12));
    widget.style.left = `${x}px`;
    widget.style.top = `${y}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    panel.style.right = x + box.width < Math.min(280, innerWidth - 24) + 12 ? 'auto' : '0';
    panel.style.left = panel.style.right === 'auto' ? '0' : 'auto';
    panel.style.bottom = y < innerHeight / 2 ? 'auto' : '70px';
    panel.style.top = y < innerHeight / 2 ? '70px' : 'auto';
    panel.style.maxHeight = `${Math.max(80, (y < innerHeight / 2 ? innerHeight - y - 82 : y - 24))}px`;
  }
  function close() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const box = widget.getBoundingClientRect();
    drag = { x: event.clientX, y: event.clientY, left: box.left, top: box.top };
    moved = false;
    toggle.setPointerCapture(event.pointerId);
  });
  toggle.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) moved = true;
    if (!moved) return;
    widget.style.left = `${drag.left + dx}px`;
    widget.style.top = `${drag.top + dy}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    fit();
  });
  toggle.addEventListener('pointerup', () => { drag = null; });
  toggle.addEventListener('pointercancel', () => { drag = null; moved = false; });
  toggle.addEventListener('click', () => {
    if (moved) { moved = false; return; }
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    fit();
  });
  widget.querySelector('.wechat-close').addEventListener('click', () => { close(); toggle.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { close(); toggle.focus(); }
  });
  document.addEventListener('click', event => { if (!widget.contains(event.target)) close(); });
  addEventListener('resize', fit);
})();
