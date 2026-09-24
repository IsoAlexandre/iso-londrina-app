import { dbGet, dbPut } from './db.js';
import { state, emptySession } from './state.js';
import { showToast, confirmModal, uid, formatBRL } from './ui.js';
import { tierFor } from './pricing.js';
import { goTo } from './nav.js';

const SESSION_STORE = 'session';
const SESSION_KEY = 'current';

let writeTimer = null;

function persistNow() {
  const snapshot = {
    cliente: state.cliente,
    cart: state.cart,
    examList: state.examList,
    numParcelas: state.numParcelas,
    savedAt: new Date().toISOString(),
  };
  dbPut(SESSION_STORE, SESSION_KEY, snapshot).catch(e => console.warn('[session] falha ao salvar', e));
}

function persistDebounced() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(persistNow, 500);
}

// Flush on tab hidden/closed so an abrupt shutdown loses at most the very last keystroke.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { clearTimeout(writeTimer); persistNow(); }
});

export async function loadSessionLayer() {
  let saved = null;
  try { saved = await dbGet(SESSION_STORE, SESSION_KEY); } catch (e) { /* nada salvo ainda */ }
  if (saved) {
    state.cliente = Object.assign(emptySession().cliente, saved.cliente || {});
    state.cart = saved.cart || [];
    state.examList = saved.examList || [];
    state.numParcelas = saved.numParcelas ?? null;
  }
}

// Render hooks are injected from main.js after all render modules are wired,
// avoiding a hard import cycle between session.js and the render modules.
let renderHooks = { updateCartBadge() {}, renderCart() {}, renderClienteBox() {}, renderExamInfoList() {}, renderExames() {}, renderAll() {} };
export function setSessionRenderHooks(hooks) { Object.assign(renderHooks, hooks); }

export function updateCliente(field, value) {
  state.cliente[field] = value;
  renderHooks.renderClienteBox();
  persistDebounced();
}

export function onCnpjInput(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 14);
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
  input.value = v;
  state.cliente.cnpj = v;
  persistDebounced();
}

export function addToCart(item) {
  state.cart.push(Object.assign({ id: uid() }, item));
  renderHooks.updateCartBadge();
  renderHooks.renderCart();
  showToast('Item adicionado ao orçamento');
  persistNow();
}

export function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  renderHooks.updateCartBadge();
  renderHooks.renderCart();
  persistNow();
}

export function cartTotal() {
  return state.cart.reduce((s, i) => s + (i.valor || 0), 0);
}

export function addPlanoToCart() {
  if (!state.currentPlano) { showToast('Ajuste a quantidade de funcionários para uma faixa válida'); return; }
  addToCart({
    tipo: 'Plano',
    nome: `Plano ${state.currentPlano.grau}`,
    detalhe: `${state.currentPlano.funcionarios} funcionário(s)`,
    valor: state.currentPlano.valor,
    funcionarios: state.currentPlano.funcionarios,
  });
}

export function addTrainToCart(key, i) {
  const t = state.DATA.treinamentos[state.modalidade][i];
  const qty = state.trainQty[key] !== undefined ? state.trainQty[key] : 1;
  const tier = tierFor(t, qty);
  const total = tier.valorPessoa * qty;
  const modLabel = state.modalidade === 'formacao' ? 'Formação/Inicial' : 'Reciclagem';
  addToCart({
    tipo: 'Treinamento',
    nome: t.nome + (t.nr ? ` (${t.nr})` : ''),
    detalhe: `${modLabel} · ${qty} pessoa(s) × ${formatBRL(tier.valorPessoa)} (${tier.label})`,
    valor: total,
  });
}

export function addOutroToCart(i) {
  const t = state.DATA.treinamentos.outros[i];
  const key = 'outros_' + i;
  const qty = Math.max(state.trainQty[key] !== undefined ? state.trainQty[key] : t.minimoPessoas, t.minimoPessoas);
  const total = t.valorPessoa * qty;
  addToCart({
    tipo: 'Treinamento',
    nome: t.nome,
    detalhe: `${qty} pessoa(s) × ${formatBRL(t.valorPessoa)}`,
    valor: total,
  });
}

export function addExamToCart(idx) {
  const e = state.DATA.exames[idx];
  state.examAdded[idx] = true;
  state.examList.push({ id: uid(), nome: e[0], valor: e[1] });
  renderHooks.renderExames();
  renderHooks.renderExamInfoList();
  showToast('Exame adicionado à tabela informativa');
  persistNow();
}

export function removeFromExamList(id) {
  const item = state.examList.find(i => i.id === id);
  state.examList = state.examList.filter(i => i.id !== id);
  if (item) {
    const idx = state.DATA.exames.findIndex(e => e[0] === item.nome);
    if (idx >= 0) state.examAdded[idx] = false;
  }
  renderHooks.renderExames();
  renderHooks.renderExamInfoList();
  persistNow();
}

export function addNexoToCart() {
  const n = state.DATA.nexo.niveis.find(x => x.id === state.nexoSelected);
  const valor = parseFloat(document.getElementById('nexoValorFinal').value) || 0;
  addToCart({ tipo: 'Nexo Causal', nome: n.nome, detalhe: '', valor });
}

/** "Novo orçamento" — explicit, confirmed reset before starting the next client meeting. */
export async function newBudget() {
  const ok = await confirmModal(
    'Isso vai apagar os dados do cadastro atual, o carrinho e a lista de exames. Esta ação não pode ser desfeita.',
    { title: 'Novo orçamento', confirmLabel: 'Limpar e começar novo' }
  );
  if (!ok) return;
  const empty = emptySession();
  state.cliente = empty.cliente;
  state.cart = empty.cart;
  state.examList = empty.examList;
  state.numParcelas = empty.numParcelas;
  state.examAdded = {};
  state.trainOpen = {};
  state.trainQty = {};
  state.nexoSelected = 1;
  state.selectedRisk = null;
  state.currentPlano = null;
  await dbPut(SESSION_STORE, SESSION_KEY, empty);
  renderHooks.renderAll();
  goTo('cadastro');
  showToast('Novo orçamento iniciado');
}
