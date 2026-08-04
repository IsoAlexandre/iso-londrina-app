import { state } from './modules/state.js';
import { buildNav, goTo } from './modules/nav.js';
import { loadDataLayer } from './modules/data.js';
import { loadSessionLayer, setSessionRenderHooks, updateCliente, onCnpjInput, removeFromCart, addPlanoToCart, addTrainToCart, addOutroToCart, addExamToCart, removeFromExamList, addNexoToCart, newBudget } from './modules/session.js';
import {
  renderServicos, openServiceModal, closeServiceModal, setServicoNome, setServicoDesc,
  renderPilares, setPilarNome, setPilarDesc,
  setModalidade, renderTreinamentos, toggleTrain, setTrainQty, setTreinoField, setOutroField,
  renderExames, setExameField,
  renderNexo, updateNexoValor, selectNivel,
} from './modules/render-content.js';
import {
  renderCadastroFields, renderClienteBox, renderOrcamentosView, renderCart, updateCartBadge,
  renderRiskToggle, setRisk, renderTiersEdit, setOrcamentoValor, calcOrcamento,
  renderExamInfoList,
} from './modules/render-budget.js';
import { printProposal } from './modules/proposal.js';
import { emailProposal, whatsappProposal, sharePDF } from './modules/share.js';
import { toggleEdit, saveAll, doExportData, triggerImportPicker, onImportFileSelected, doRestoreDefaults, setEditModeRenderHook } from './modules/editmode.js';

function renderAll() {
  renderServicos();
  renderPilares();
  renderTreinamentos();
  renderRiskToggle();
  renderTiersEdit();
  renderExames();
  calcOrcamento();
  renderNexo();
  updateCartBadge();
  renderClienteBox();
}

// Templates still use plain onclick="fn(...)"/oninput="fn(...)" attributes (ported
// as-is from the original prototype) rather than addEventListener/data-action —
// deliberate, documented tradeoff (see plan). Consolidated here in one spot so the
// "leak" onto window is auditable.
Object.assign(window, {
  goTo: id => goTo(id, renderOrcamentosView),
  toggleEdit, saveAll, doExportData, triggerImportPicker, onImportFileSelected, doRestoreDefaults,
  updateCliente, onCnpjInput, removeFromCart, addPlanoToCart, addTrainToCart, addOutroToCart,
  addExamToCart, removeFromExamList, addNexoToCart, newBudget,
  openServiceModal, closeServiceModal, setServicoNome, setServicoDesc,
  setPilarNome, setPilarDesc,
  setModalidade, toggleTrain, setTrainQty, setTreinoField, setOutroField,
  renderExames, setExameField,
  updateNexoValor, selectNivel,
  setRisk, setOrcamentoValor, calcOrcamento, renderCart,
  printProposal, emailProposal, whatsappProposal, sharePDF,
});

setSessionRenderHooks({ updateCartBadge, renderCart, renderClienteBox, renderExamInfoList, renderExames, renderAll });
setEditModeRenderHook(renderAll);

// Nexo "valor final" input: once the user edits it manually, stop overwriting it
// when a different nível is selected.
document.addEventListener('input', e => {
  if (e.target && e.target.id === 'nexoValorFinal') e.target.dataset.touched = '1';
});

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast(reg);
        }
      });
    });
  } catch (e) {
    console.warn('[sw] falha ao registrar service worker', e);
  }
}

function showUpdateToast(reg) {
  const bar = document.getElementById('updateBar');
  if (!bar) return;
  bar.classList.add('show');
  bar.querySelector('button').onclick = () => {
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}

async function boot() {
  await loadDataLayer();
  await loadSessionLayer();
  buildNav();
  renderAll();
  registerServiceWorker();
}

boot();
