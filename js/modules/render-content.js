import { state } from './state.js';
import { formatBRL, escHtml, escAttr } from './ui.js';
import { tierFor } from './pricing.js';

function markInvalid(el, invalid) {
  if (el) el.classList.toggle('input-invalid', !!invalid);
}

/* ---------------- SERVICOS ---------------- */
export function renderServicos() {
  const el = document.getElementById('servicosGrid');
  el.innerHTML = state.DATA.servicos.map((s, i) => {
    if (state.editMode) {
      return `<div class="card">
        <input class="title-edit" value="${escAttr(s.nome)}" oninput="setServicoNome(${i}, this.value, this)">
        <textarea oninput="setServicoDesc(${i}, this.value, this)">${s.desc}</textarea>
      </div>`;
    }
    return `<div class="card" onclick="openServiceModal(${i})" style="cursor:pointer;">
      <h3>${s.nome}</h3><p>${s.desc}</p>
      <div class="ver-mais">Ver detalhes →</div>
    </div>`;
  }).join('');
}
export function setServicoNome(i, val, el) {
  state.DATA.servicos[i].nome = val;
  markInvalid(el, !val.trim());
}
export function setServicoDesc(i, val) {
  state.DATA.servicos[i].desc = val;
}
export function openServiceModal(i) {
  const s = state.DATA.servicos[i];
  const box = document.getElementById('serviceModalBox');
  let html = `<button class="modal-close" onclick="closeServiceModal()">✕</button><h2>${escHtml(s.nome)}</h2>`;
  if (s.destaque) html += `<div class="modal-destaque">${escHtml(s.destaque)}</div>`;
  if (!s.destaque) html += `<p style="margin-bottom:18px;">${escHtml(s.desc)}</p>`;
  if (s.detalhes && s.detalhes.length) {
    html += s.detalhes.map(d => `<div class="modal-item"><h4>${escHtml(d.titulo)}</h4>${d.desc ? `<p>${escHtml(d.desc)}</p>` : ''}</div>`).join('');
  }
  box.innerHTML = html;
  document.getElementById('serviceModal').classList.add('open');
}
export function closeServiceModal() {
  document.getElementById('serviceModal').classList.remove('open');
}

/* ---------------- PILARES FUNDAMENTAIS ---------------- */
export function renderPilares() {
  const el = document.getElementById('pilaresGrid');
  if (!el) return;
  el.innerHTML = state.DATA.pilares.map((p, i) => {
    if (state.editMode) {
      return `<div class="pilar-card">
        <input class="title-edit" style="font-size:13.5px;" value="${escAttr(p.nome)}" oninput="setPilarNome(${i}, this.value, this)">
        <textarea style="min-height:50px;font-size:12.5px;" oninput="setPilarDesc(${i}, this.value, this)">${p.desc}</textarea>
      </div>`;
    }
    return `<div class="pilar-card"><h4>${p.nome}</h4><p>${p.desc}</p></div>`;
  }).join('');
}
export function setPilarNome(i, val, el) {
  state.DATA.pilares[i].nome = val;
  markInvalid(el, !val.trim());
}
export function setPilarDesc(i, val) {
  state.DATA.pilares[i].desc = val;
}

/* ---------------- TREINAMENTOS ---------------- */
export function setModalidade(m) {
  state.modalidade = m;
  state.trainOpen = {};
  renderModalidadeToggle();
  renderTreinamentos();
}
export function renderModalidadeToggle() {
  const el = document.getElementById('modalidadeToggle');
  if (!el) return;
  el.innerHTML = `
    <button class="risk-btn${state.modalidade === 'formacao' ? ' selected' : ''}" onclick="setModalidade('formacao')">Formação / Inicial</button>
    <button class="risk-btn${state.modalidade === 'reciclagem' ? ' selected' : ''}" onclick="setModalidade('reciclagem')">Reciclagem</button>`;
}
export function renderTreinamentos() {
  renderModalidadeToggle();
  const list = state.DATA.treinamentos[state.modalidade];
  const el = document.getElementById('trainGrid');
  el.innerHTML = list.map((t, i) => {
    const badge = t.nr ? `<span class="badge">${t.nr}</span>` : `<span class="badge nr-none">Extra</span>`;
    const semPreco = t.v1 === null;
    if (state.editMode) {
      return `<div class="train-card" style="cursor:default;">
        <div class="train-top">${badge}
          <div style="flex:1;">
            <input value="${escAttr(t.nome)}" oninput="setTreinoField('${state.modalidade}', ${i}, 'nome', this.value, this)">
            <input value="${escAttr(t.carga)}" placeholder="Carga horária" oninput="setTreinoField('${state.modalidade}', ${i}, 'carga', this.value, this)" style="max-width:110px;">
            <div style="display:flex;gap:6px;margin-top:6px;">
              <input class="num-small" type="number" value="${t.v1 ?? ''}" placeholder="1 pessoa" oninput="setTreinoField('${state.modalidade}', ${i}, 'v1', this.value, this)">
              <input class="num-small" type="number" value="${t.v6 ?? ''}" placeholder="6-10" oninput="setTreinoField('${state.modalidade}', ${i}, 'v6', this.value, this)">
              <input class="num-small" type="number" value="${t.v11 ?? ''}" placeholder="11+" oninput="setTreinoField('${state.modalidade}', ${i}, 'v11', this.value, this)">
            </div>
          </div>
        </div>
      </div>`;
    }
    const key = state.modalidade + '_' + i;
    const isOpen = !!state.trainOpen[key];
    const qty = state.trainQty[key] !== undefined ? state.trainQty[key] : 1;
    const tier = semPreco ? null : tierFor(t, qty);
    const total = tier ? tier.valorPessoa * qty : 0;
    return `<div class="train-card" onclick="${semPreco ? '' : `toggleTrain('${key}', event)`}">
        <div class="train-top">${badge}
          <div>
            <div class="txt">${t.nome}</div>
            <div class="carga">${t.carga}</div>
          </div>
        </div>
        ${semPreco ? `<div class="indisponivel" style="margin-top:8px;">Consulte disponibilidade e valor com a equipe comercial</div>` : `
        <table class="tier-table">
          <tr><td>1 a 5 participantes</td><td class="tv">${formatBRL(t.v1)} /pessoa</td></tr>
          <tr><td>6 a 10 participantes</td><td class="tv">${formatBRL(t.v6)} /pessoa</td></tr>
          <tr><td>Acima de 11</td><td class="tv">${formatBRL(t.v11)} /pessoa</td></tr>
        </table>`}
        ${isOpen && !semPreco ? `
        <div class="train-expand" onclick="event.stopPropagation()">
          <div class="qty-row">
            <label>Quantidade de participantes</label>
            <input type="number" min="1" value="${qty}" oninput="setTrainQty('${key}', this.value)">
          </div>
          <div class="calc-line">${qty} pessoa(s) × ${formatBRL(tier.valorPessoa)} (${tier.label}) = <b>${formatBRL(total)}</b></div>
          <button class="btn btn-sage btn-sm" onclick="addTrainToCart('${key}', ${i})">+ Adicionar ao orçamento</button>
        </div>` : ''}
      </div>`;
  }).join('');
  renderTreinamentosOutros();
}
export function renderTreinamentosOutros() {
  const el = document.getElementById('trainGridOutros');
  if (!el) return;
  el.innerHTML = state.DATA.treinamentos.outros.map((t, i) => {
    const badge = t.nr ? `<span class="badge">${t.nr}</span>` : `<span class="badge nr-none">Extra</span>`;
    if (state.editMode) {
      return `<div class="train-card" style="cursor:default;">
        <div class="train-top">${badge}
          <div style="flex:1;">
            <input value="${escAttr(t.nome)}" oninput="setOutroField(${i}, 'nome', this.value, this)">
            <div style="display:flex;gap:8px;margin-top:6px;">
              <input class="num-small" type="number" value="${t.valorPessoa}" oninput="setOutroField(${i}, 'valorPessoa', this.value, this)" title="Valor por pessoa">
              <input class="num-small" type="number" value="${t.minimoPessoas}" oninput="setOutroField(${i}, 'minimoPessoas', this.value, this)" title="Mínimo de pessoas">
            </div>
          </div>
        </div>
      </div>`;
    }
    const key = 'outros_' + i;
    const isOpen = !!state.trainOpen[key];
    const qty = state.trainQty[key] !== undefined ? state.trainQty[key] : t.minimoPessoas;
    const usedQty = Math.max(qty, t.minimoPessoas);
    const total = t.valorPessoa * usedQty;
    return `<div class="train-card" onclick="toggleTrain('${key}', event)">
        <div class="train-top">${badge}
          <div>
            <div class="txt">${t.nome}</div>
            <div class="price-line">${t.valorPessoa > 0 ? `R$ ${t.valorPessoa.toFixed(2).replace('.', ',')} / pessoa · mínimo ${t.minimoPessoas} pessoa(s)` : 'Consulte valor com a equipe comercial'}</div>
          </div>
        </div>
        ${isOpen && t.valorPessoa > 0 ? `
        <div class="train-expand" onclick="event.stopPropagation()">
          <div class="qty-row">
            <label>Quantidade de pessoas</label>
            <input type="number" min="1" value="${qty}" oninput="setTrainQty('${key}', this.value)">
          </div>
          <div class="calc-line">${usedQty} pessoa(s) × ${formatBRL(t.valorPessoa)} = <b>${formatBRL(total)}</b></div>
          <button class="btn btn-sage btn-sm" onclick="addOutroToCart(${i})">+ Adicionar ao orçamento</button>
        </div>` : ''}
      </div>`;
  }).join('');
}
export function toggleTrain(key) {
  if (state.editMode) return;
  state.trainOpen[key] = !state.trainOpen[key];
  renderTreinamentos();
}
export function setTrainQty(key, val) {
  state.trainQty[key] = parseInt(val) || 1;
  renderTreinamentos();
}
export function setTreinoField(modalidade, i, field, val, el) {
  const t = state.DATA.treinamentos[modalidade][i];
  if (field === 'nome' || field === 'carga') {
    t[field] = val;
    if (field === 'nome') markInvalid(el, !val.trim());
  } else {
    const num = val === '' ? null : (parseFloat(val) || 0);
    t[field] = num;
    markInvalid(el, num !== null && num < 0);
  }
}
export function setOutroField(i, field, val, el) {
  const t = state.DATA.treinamentos.outros[i];
  if (field === 'nome') {
    t.nome = val;
    markInvalid(el, !val.trim());
  } else if (field === 'valorPessoa') {
    const num = parseFloat(val) || 0;
    t.valorPessoa = num;
    markInvalid(el, num < 0);
  } else if (field === 'minimoPessoas') {
    const num = parseInt(val) || 1;
    t.minimoPessoas = num;
    markInvalid(el, num < 1);
  }
}

/* ---------------- EXAMES ---------------- */
export function renderExames() {
  const q = (document.getElementById('examSearch').value || '').toLowerCase().trim();
  const body = document.getElementById('examBody');
  const list = state.DATA.exames.map((e, i) => ({ nome: e[0], valor: e[1], idx: i })).filter(e => e.nome.toLowerCase().includes(q));
  document.getElementById('examCount').textContent = `${list.length} exame(s) encontrado(s)`;
  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="3"><div class="exam-empty">Nenhum exame encontrado para "${escHtml(q)}"</div></td></tr>`;
    return;
  }
  body.innerHTML = list.map(e => {
    if (state.editMode) {
      return `<tr>
        <td><input class="name-input" value="${escAttr(e.nome)}" oninput="setExameField(${e.idx}, 'nome', this.value, this)"></td>
        <td class="val"><input type="number" step="0.01" value="${e.valor}" oninput="setExameField(${e.idx}, 'valor', this.value, this)"></td>
        <td></td>
      </tr>`;
    }
    const added = !!state.examAdded[e.idx];
    return `<tr>
      <td>${e.nome}</td>
      <td class="val">${formatBRL(e.valor)}</td>
      <td class="act"><button class="btn-add${added ? ' added' : ''}" onclick="addExamToCart(${e.idx})">${added ? '✓ Adicionado' : '+ Adicionar'}</button></td>
    </tr>`;
  }).join('');
}
export function setExameField(idx, field, val, el) {
  if (field === 'nome') {
    state.DATA.exames[idx][0] = val;
    markInvalid(el, !val.trim());
  } else {
    const num = parseFloat(val) || 0;
    state.DATA.exames[idx][1] = num;
    markInvalid(el, num < 0);
  }
}

/* ---------------- NEXO CAUSAL ---------------- */
export function renderNexo() {
  const grid = document.getElementById('nivelGrid');
  if (!grid) return;
  grid.innerHTML = state.DATA.nexo.niveis.map(n => {
    const selected = state.nexoSelected === n.id;
    if (state.editMode) {
      return `<div class="nivel-card${selected ? ' selected' : ''}">
        <h4>${n.nome}</h4>
        <p>${n.desc}</p>
        <input type="number" value="${n.valor}" oninput="updateNexoValor(${n.id}, this.value, this)" title="Valor">
      </div>`;
    }
    return `<div class="nivel-card${selected ? ' selected' : ''}" onclick="selectNivel(${n.id})">
      <h4>${n.nome}</h4>
      <div class="faixa">${formatBRL(n.valor)}</div>
      <p>${n.desc}</p>
    </div>`;
  }).join('');
  const atual = state.DATA.nexo.niveis.find(n => n.id === state.nexoSelected);
  const valInput = document.getElementById('nexoValorFinal');
  if (atual && valInput && !valInput.dataset.touched) valInput.value = atual.valor;
}
export function updateNexoValor(id, val, el) {
  const n = state.DATA.nexo.niveis.find(x => x.id === id);
  const num = parseFloat(val) || 0;
  n.valor = num;
  markInvalid(el, num < 0);
}
export function selectNivel(id) {
  state.nexoSelected = id;
  document.getElementById('nexoValorFinal').dataset.touched = '';
  renderNexo();
}
