import { dbGet, dbPut } from './db.js';
import { state } from './state.js';
import { validateDataTree } from './validate.js';
import { showToast, confirmModal } from './ui.js';

const CONFIG_STORE = 'config';
const CONFIG_KEY = 'dataLayer';

let factoryDefaults = null;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function fetchFactoryDefaults() {
  if (factoryDefaults) return factoryDefaults;
  const res = await fetch('./data/default-data.json');
  if (!res.ok) throw new Error('Não foi possível carregar data/default-data.json');
  factoryDefaults = await res.json();
  return factoryDefaults;
}

/**
 * Loads DATA into state: factory defaults as the base, shallow-merged at the
 * top level with whatever was saved locally (same semantics as the prototype's
 * Object.assign(defaults, saved) — a saved top-level key fully replaces the
 * default array/object for that key, it does not merge item-by-item).
 */
export async function loadDataLayer() {
  const defaults = await fetchFactoryDefaults();
  let saved = null;
  try { saved = await dbGet(CONFIG_STORE, CONFIG_KEY); } catch (e) { /* sem dados salvos ainda */ }
  state.DATA = saved ? Object.assign(deepClone(defaults), saved) : deepClone(defaults);
}

/**
 * Validates and persists the live DATA. Returns { valid, errors } — caller is
 * responsible for surfacing errors and must not treat a failed validation as
 * having saved anything (nothing is written to IndexedDB on failure).
 */
export async function saveDataLayer() {
  const result = validateDataTree(state.DATA);
  if (!result.valid) return result;
  await dbPut(CONFIG_STORE, CONFIG_KEY, state.DATA);
  showToast('Alterações salvas neste dispositivo');
  return result;
}

export async function restoreFactoryDefaults() {
  const ok = await confirmModal(
    'Isso vai apagar todos os preços e textos editados neste tablet e voltar aos valores originais do app. Não afeta o cadastro do cliente nem o carrinho atual.',
    { title: 'Restaurar padrão de fábrica', confirmLabel: 'Restaurar' }
  );
  if (!ok) return false;
  const defaults = await fetchFactoryDefaults();
  state.DATA = deepClone(defaults);
  await dbPut(CONFIG_STORE, CONFIG_KEY, state.DATA);
  showToast('Dados restaurados ao padrão de fábrica');
  return true;
}

export function exportDataLayer() {
  const envelope = {
    app: 'iso-londrina',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: state.DATA,
  };
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `iso-londrina-dados-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Arquivo de dados exportado');
}

/**
 * Reads, validates and (after user confirmation) applies an imported data
 * file. Never touches the "session" store — cliente/cart/examList in progress
 * are structurally untouched by this function.
 */
export async function importDataLayer(file) {
  let parsed;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch (e) {
    showToast('Arquivo inválido: não é um JSON legível');
    return { valid: false, errors: [{ path: 'raiz', message: 'JSON malformado' }] };
  }

  const candidate = parsed && parsed.data ? parsed.data : parsed;
  const result = validateDataTree(candidate);
  if (!result.valid) {
    const preview = result.errors.slice(0, 5).map(e => e.message).join('\n');
    showToast(`Importação recusada: ${result.errors.length} erro(s) encontrado(s)`);
    console.warn('[import] erros de validação:', result.errors);
    await confirmModal(
      `O arquivo tem ${result.errors.length} problema(s) e não pode ser importado:\n\n${preview}${result.errors.length > 5 ? '\n...' : ''}`,
      { title: 'Não foi possível importar', confirmLabel: 'Entendi', cancelLabel: 'Fechar' }
    );
    return result;
  }

  const ok = await confirmModal(
    'Isso vai substituir TODOS os preços e textos atuais pelos valores deste arquivo. O cadastro do cliente e o carrinho em andamento não serão afetados.',
    { title: 'Confirmar importação', confirmLabel: 'Importar e substituir' }
  );
  if (!ok) return { valid: true, errors: [], cancelled: true };

  state.DATA = candidate;
  await dbPut(CONFIG_STORE, CONFIG_KEY, state.DATA);
  showToast('Dados importados com sucesso');
  return { valid: true, errors: [] };
}
