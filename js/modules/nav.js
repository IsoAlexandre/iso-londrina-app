export const VIEWS = [
  { id: 'inicio', label: 'Início', ic: '⌂', sub: 'Apresentação institucional' },
  { id: 'sobre', label: 'Sobre Nós', ic: '◆', sub: 'Nossa história, missão e visão' },
  { id: 'servicos', label: 'Serviços', ic: '✚', sub: 'Hall completo de soluções' },
  { id: 'cadastro', label: 'Cadastro', ic: '🗂', sub: 'Dados da empresa e do responsável' },
  { id: 'orcamentos', label: 'Orçamentos', ic: '🧮', sub: 'Proposta consolidada' },
  { id: 'treinamentos', label: 'Treinamentos', ic: '🎓', sub: 'Catálogo de capacitações NR' },
  { id: 'exames', label: 'Orçamento de Exames', ic: '🔍', sub: 'Busca de valores por exame' },
  { id: 'nexo', label: 'Nexo Causal/Concausal', ic: '⚕', sub: 'Avaliação de doenças ocupacionais' },
];

export function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = VIEWS.map(v => `
    <button class="nav-item${v.id === 'inicio' ? ' active' : ''}" data-nav="${v.id}" onclick="goTo('${v.id}')">
      <span class="ic">${v.ic}</span>${v.label}
      ${v.id === 'orcamentos' ? `<span class="nav-badge" id="cartBadge">0</span>` : ''}
    </button>`).join('');
}

export function goTo(id, onEnterOrcamentos) {
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.dataset.view === id));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.nav === id));
  const v = VIEWS.find(x => x.id === id);
  document.getElementById('pageTitle').textContent = v.label;
  document.getElementById('pageSub').textContent = v.sub;
  if (id === 'orcamentos' && typeof onEnterOrcamentos === 'function') onEnterOrcamentos();
}
