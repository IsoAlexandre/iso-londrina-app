import { state } from './state.js';
import { formatBRL, escHtml, escAttr } from './ui.js';
import { parseFaixa } from './pricing.js';
import { cartTotal } from './session.js';

function markInvalid(el, invalid) {
  if (el) el.classList.toggle('input-invalid', !!invalid);
}

/* ---------------- CADASTRO ---------------- */
export function renderCadastroFields() {
  document.getElementById('cli_empresa').value = state.cliente.empresa;
  document.getElementById('cli_cnpj').value = state.cliente.cnpj;
  document.getElementById('cli_responsavel').value = state.cliente.responsavel;
  document.getElementById('cli_telefone').value = state.cliente.telefone;
  document.getElementById('cli_email').value = state.cliente.email;
  document.getElementById('cli_vendedor').value = state.cliente.vendedorNome;
  document.getElementById('cli_vendedor_tel').value = state.cliente.vendedorTelefone;
  const box = document.getElementById('cadastroStatus');
  if (state.cliente.empresa && state.cliente.responsavel) {
    box.className = 'cadastro-status';
    box.textContent = '✓ Cadastro preenchido — pode seguir para Orçamentos.';
  } else {
    box.className = 'cadastro-status incompleto';
    box.textContent = '⚠ Preencha ao menos o nome da empresa e o responsável antes de gerar o orçamento final.';
  }
}
export function renderClienteBox() {
  const box = document.getElementById('clienteBox');
  if (!box) return;
  if (state.cliente.empresa || state.cliente.responsavel) {
    box.innerHTML = `
      <div class="info"><b>${escHtml(state.cliente.empresa || '(empresa não informada)')}</b> — ${escHtml(state.cliente.responsavel || 'responsável não informado')}
        <div style="color:var(--muted);margin-top:2px;">${escHtml(state.cliente.telefone || '')} ${state.cliente.telefone && state.cliente.email ? '·' : ''} ${escHtml(state.cliente.email || '')}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="goTo('cadastro')">Editar cadastro</button>`;
  } else {
    box.innerHTML = `
      <div class="info warn">⚠ Cadastro ainda não preenchido</div>
      <button class="btn btn-terracotta btn-sm" onclick="goTo('cadastro')">Preencher cadastro</button>`;
  }
  renderCadastroFields();
}

/* ---------------- CARRINHO ---------------- */
export function updateCartBadge() {
  const b = document.getElementById('cartBadge');
  if (b) b.textContent = state.cart.length;
}
export function renderOrcamentosView() {
  renderClienteBox();
  renderCart();
  renderExamInfoList();
}
export function renderCart() {
  const list = document.getElementById('cartList');
  if (!list) return;
  if (state.cart.length === 0) {
    list.innerHTML = `<div class="cart-empty">Nenhum item adicionado ainda. Adicione o plano, treinamentos, exames ou Nexo Causal.</div>`;
    return;
  }
  const rows = state.cart.map(i => `
    <div class="cart-item">
      <span class="tag">${escHtml(i.tipo)}</span>
      <div class="desc">${escHtml(i.nome)}${i.detalhe ? `<div class="sub">${escHtml(i.detalhe)}</div>` : ''}</div>
      <div class="val">${formatBRL(i.valor)}</div>
      <button class="rm" onclick="removeFromCart('${i.id}')" title="Remover">✕</button>
    </div>`).join('');
  list.innerHTML = rows + `<div class="cart-total"><span class="lbl">Total geral</span><span class="amt">${formatBRL(cartTotal())}</span></div>`;
}

/* ---------------- ORCAMENTO POR GRAU DE RISCO ---------------- */
export function renderRiskToggle() {
  const el = document.getElementById('riskToggle');
  const grades = Object.keys(state.DATA.orcamento);
  if (!state.selectedRisk) state.selectedRisk = grades[0];
  el.innerHTML = grades.map(g => `
    <button class="risk-btn${g === state.selectedRisk ? ' selected' : ''}" onclick="setRisk('${escAttr(g)}')">${g}</button>
  `).join('');
}
export function setRisk(g) {
  state.selectedRisk = g;
  renderRiskToggle();
  renderTiersEdit();
  calcOrcamento();
}
export function renderTiersEdit() {
  const wrap = document.getElementById('tiersEdit');
  if (!state.editMode) { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  wrap.style.display = 'block';
  const tiers = state.DATA.orcamento[state.selectedRisk] || [];
  wrap.innerHTML = `<h4>Editar faixas — ${state.selectedRisk}</h4>` + tiers.map((t, i) => `
    <div class="orc-editrow">
      <span>${t.faixa}</span>
      <input type="number" value="${t.valor}" oninput="setOrcamentoValor('${escAttr(state.selectedRisk)}', ${i}, this.value, this)">
    </div>
  `).join('');
}
export function setOrcamentoValor(grau, i, val, el) {
  const num = parseFloat(val) || 0;
  state.DATA.orcamento[grau][i].valor = num;
  markInvalid(el, num < 0);
  calcOrcamento();
}
export function calcOrcamento() {
  const n = parseInt(document.getElementById('numFunc').value) || 0;
  const card = document.getElementById('resultCard');
  const tiers = state.DATA.orcamento[state.selectedRisk] || [];
  const match = tiers.find(t => { const r = parseFaixa(t.faixa); return n >= r.min && n <= r.max; });
  const maxTier = tiers.reduce((mx, t) => Math.max(mx, parseFaixa(t.faixa).max), 0);
  if (match) {
    state.currentPlano = { grau: state.selectedRisk, faixa: match.faixa, valor: match.valor, funcionarios: n };
    card.innerHTML = `
      <div class="r-label">${state.selectedRisk} · ${match.faixa}</div>
      <div class="r-value">${formatBRL(match.valor)}</div>
      <div class="r-detail">Valor de proposta estimado para ${n} funcionário(s).</div>`;
  } else if (n > maxTier && maxTier > 0) {
    // Acima da maior faixa cadastrada — proposta sob consulta, sem valor fechado.
    state.currentPlano = null;
    card.innerHTML = `
      <div class="r-label">${state.selectedRisk}</div>
      <div class="r-value" style="font-size:20px;">Consulte a equipe comercial</div>
      <div class="r-detail">Para ${n} funcionário(s) a proposta é personalizada. Fale com o time comercial.</div>`;
  } else {
    state.currentPlano = null;
    card.innerHTML = `
      <div class="r-label">${state.selectedRisk}</div>
      <div class="r-value" style="font-size:20px;">Fora das faixas cadastradas</div>
      <div class="r-detail">Ajuste a quantidade de funcionários.</div>`;
  }
}

/* ---------------- EXAMES — TABELA INFORMATIVA ---------------- */
export function renderExamInfoList() {
  const el = document.getElementById('examInfoList');
  if (!el) return;
  if (state.examList.length === 0) {
    el.innerHTML = `<div class="exam-info-empty">Nenhum exame adicionado ainda.</div>`;
    return;
  }
  el.innerHTML = state.examList.map(i => `
    <div class="exam-info-row">
      <span>${escHtml(i.nome)}</span>
      <span class="val">${formatBRL(i.valor)}</span>
      <button class="rm" onclick="removeFromExamList('${i.id}')" title="Remover">✕</button>
    </div>`).join('');
}
