import { state } from './state.js';
import { showToast } from './ui.js';
import { saveDataLayer, exportDataLayer, importDataLayer, restoreFactoryDefaults } from './data.js';

let renderAll = () => {};
export function setEditModeRenderHook(fn) { renderAll = fn; }

export function toggleEdit() {
  state.editMode = !state.editMode;
  document.getElementById('btnEdit').textContent = state.editMode ? '✕ Sair da edição' : '✎ Editar dados';
  document.getElementById('btnSave').style.display = state.editMode ? 'inline-block' : 'none';
  document.getElementById('editToolsExtra').style.display = state.editMode ? 'flex' : 'none';
  renderAll();
}

export async function saveAll() {
  const result = await saveDataLayer();
  if (!result.valid) {
    const preview = result.errors.slice(0, 5).map(e => e.message).join('\n');
    showToast(`Não foi possível salvar: ${result.errors.length} campo(s) inválido(s)`);
    console.warn('[saveAll] erros de validação:', result.errors);
    window.alert(`Corrija antes de salvar (${result.errors.length} problema(s)):\n\n${preview}${result.errors.length > 5 ? '\n...' : ''}`);
  }
}

export async function doRestoreDefaults() {
  const changed = await restoreFactoryDefaults();
  if (changed) renderAll();
}

export function doExportData() {
  exportDataLayer();
}

export function triggerImportPicker() {
  document.getElementById('importFileInput').click();
}

export async function onImportFileSelected(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  const result = await importDataLayer(file);
  if (result.valid && !result.cancelled) renderAll();
}
