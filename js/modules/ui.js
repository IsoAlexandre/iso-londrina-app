export function formatBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function escHtml(s) {
  return (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

export function escAttr(s) {
  return (s || '').replace(/"/g, '&quot;');
}

export function uid() {
  return 'i' + Math.random().toString(36).slice(2, 9);
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/**
 * Simple confirmation modal, replaces window.confirm so styling matches the app.
 * Returns a Promise<boolean> resolved true if the user confirms.
 */
export function confirmModal(message, { title = 'Confirmar ação', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' } = {}) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirmModal');
    const box = document.getElementById('confirmModalBox');
    box.innerHTML = `
      <h3>${escHtml(title)}</h3>
      <p>${escHtml(message)}</p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" data-act="cancel">${escHtml(cancelLabel)}</button>
        <button class="btn btn-terracotta" data-act="confirm">${escHtml(confirmLabel)}</button>
      </div>`;
    function close(result) {
      overlay.classList.remove('open');
      overlay.removeEventListener('click', onOverlayClick);
      box.removeEventListener('click', onBoxClick);
      resolve(result);
    }
    function onBoxClick(e) {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      close(act.dataset.act === 'confirm');
    }
    function onOverlayClick(e) {
      if (e.target === overlay) close(false);
    }
    box.addEventListener('click', onBoxClick);
    overlay.addEventListener('click', onOverlayClick);
    overlay.classList.add('open');
  });
}
