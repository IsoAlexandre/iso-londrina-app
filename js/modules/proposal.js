import { state } from './state.js';
import { formatBRL, escHtml } from './ui.js';
import { cartTotal } from './session.js';

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function dataPorExtenso() {
  const d = new Date();
  return `Londrina, ${d.getDate()} de ${MESES_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Fixed checklist of services included in every "Plano Grau I e II" —
 * content never varies by client, only the headcount in the block header
 * does. Keep in sync across buildProposalText/HTML and pdf.js (which reads
 * it via getEscopoBlocks() below, so there is a single source of truth).
 */
export const PLANO_ESCOPO_ITENS = [
  { texto: 'Elaboração PGR - Programa de Gerenciamento de Riscos', check: true },
  { texto: 'Elaboração PCMSO - Programa de Controle Médico de Saúde Ocupacional', check: true },
  { texto: 'Elaboração de relatório analítico', check: false },
  { texto: 'Elaboração LTCAT - Laudo Técnico das Condições Ambientais do Trabalho (Inclusa avaliação quantitativa de Ruído, Calor e Luminosidade)', check: true },
  { texto: 'Elaboração LI - Laudo de Insalubridade', check: true },
  { texto: 'Gestão dos eventos eSocial de SST (S2220 - ASO, S2240 - Ambiente de Trabalho (PPP) e S2210 - CAT)', check: true },
  { texto: 'Visita técnica inicial para avaliação ambiental', check: true },
  { texto: 'Envio e Controle de vencimentos dos exames ocupacionais', check: true },
];

export const ISO_BRAND = 'ISO LONDRINA';
export const ISO_TAGLINE = 'Instituto de Saúde Ocupacional de Londrina · Medicina e Segurança do Trabalho';
export const ISO_ENDERECO = 'Rua Francisco Feijó Sanches, 284, Petrópolis · Londrina-PR';
export const INTRO_TEXT = 'O ISO — Instituto de Saúde Ocupacional de Londrina vem apresentar proposta técnica e comercial para a prestação de serviços de Medicina do Trabalho, elaborada de acordo com a legislação vigente e as necessidades específicas de vossa organização, com o objetivo de assegurar a saúde ocupacional dos colaboradores e a conformidade legal da empresa.';
export const EXAMES_NOTA = 'Exames complementares não inclusos no valor acima; cobrados conforme utilização, pelos valores da tabela do item 2.';

// Carts saved before `funcionarios` was stored on the item only carry the
// headcount inside `detalhe` ("... 17 funcionário(s)"), so fall back to it.
function planoFuncionarios(item) {
  if (item.funcionarios != null) return item.funcionarios;
  const m = /(\d+)\s*funcion/.exec(item.detalhe || '');
  return m ? Number(m[1]) : null;
}

function planoEscopoHeader(item) {
  const n = planoFuncionarios(item);
  const func = n == null ? '— funcionários' : `${n} funcionário${n === 1 ? '' : 's'}`;
  return `Gestão de Saúde Ocupacional — ${item.nome} (${func})`;
}

export function escopoLine(item) {
  if (item.tipo === 'Treinamento') return `Treinamento: ${item.nome}`;
  if (item.tipo === 'Nexo Causal') return `${item.nome} — Avaliação de Nexo Causal/Concausal Ocupacional`;
  return item.nome;
}

export function getParcelas() {
  const el = document.getElementById('numParcelas');
  const n = parseInt(el ? el.value : '') || 0;
  return n > 0 ? n : null;
}

/**
 * Shared section-content helpers — text/HTML/PDF builders all call these so
 * the three output formats can never drift apart on what each section says.
 */
export function getEscopoBlocks() {
  if (!state.cart.length) return [{ tipo: 'linha', texto: '(nenhum item adicionado ao orçamento)' }];
  return state.cart.map(item => item.tipo === 'Plano'
    ? { tipo: 'plano', header: planoEscopoHeader(item), itens: PLANO_ESCOPO_ITENS }
    : { tipo: 'linha', texto: escopoLine(item) });
}
export function getExamLines() {
  return state.examList.length
    ? state.examList.map(i => `${i.nome}: ${formatBRL(i.valor)}`)
    : ['(nenhum exame informado)'];
}
export function getInvestimento() {
  const total = cartTotal();
  const parcelas = getParcelas();
  return {
    total: formatBRL(total),
    parcelas,
    parcelamento: parcelas ? `${parcelas} × ${formatBRL(total / parcelas)}` : null,
  };
}
export function coordenacaoText() {
  return `A coordenação da área de Saúde Ocupacional ficará sob responsabilidade do ${state.DATA.coordenacao.saude}, e a coordenação da área de Segurança do Trabalho ficará sob responsabilidade do ${state.DATA.coordenacao.seguranca}.`;
}
export function contatoLine() {
  const cel = state.cliente.vendedorTelefone;
  return `Fone: (43) 3356-4040${cel ? ' · Cel. ' + cel : ''} · www.isolondrina.com.br · contato@isolondrina.com.br`;
}
export const CONDICOES_GERAIS = [
  'O início dos serviços será definido conforme alinhamento entre as partes após aceite formal da proposta;',
  'Condições de faturamento e pagamento a serem definidas em contrato específico;',
  'Eventuais serviços adicionais, não previstos no escopo acima, serão objeto de orçamento complementar;',
];

export function buildProposalText() {
  const cel = state.cliente.vendedorTelefone;
  const inv = getInvestimento();
  const rule = '────────────────────────';
  const lines = [];
  lines.push(ISO_BRAND);
  lines.push(ISO_TAGLINE);
  lines.push(rule);
  lines.push(dataPorExtenso());
  lines.push('');
  lines.push('PROPOSTA COMERCIAL');
  lines.push('Serviços Especializados em Medicina do Trabalho');
  lines.push('');
  lines.push(`À empresa ${state.cliente.empresa || '[EMPRESA]'}`);
  lines.push('');
  lines.push(INTRO_TEXT);
  lines.push('');
  lines.push('1. ESCOPO DOS SERVIÇOS');
  getEscopoBlocks().forEach(b => {
    if (b.tipo === 'plano') {
      lines.push('▪ ' + b.header);
      b.itens.forEach(it => lines.push('   ' + (it.check ? '✓ ' : '') + it.texto));
    } else {
      lines.push('▪ ' + b.texto);
    }
  });
  lines.push('');
  lines.push('2. TABELA DE EXAMES COMPLEMENTARES');
  lines.push('Exames complementares — pagos conforme utilização:');
  getExamLines().forEach(l => lines.push('▪ ' + l));
  lines.push('');
  lines.push('3. COORDENAÇÃO');
  lines.push(coordenacaoText());
  lines.push('');
  lines.push('4. INVESTIMENTO');
  lines.push('Pela prestação dos serviços descritos nesta proposta:');
  lines.push(`VALOR TOTAL: ${inv.total}`);
  if (inv.parcelamento) lines.push(`PARCELAMENTO: ${inv.parcelamento} (em até ${inv.parcelas} parcelas iguais)`);
  if (state.examList.length) lines.push(EXAMES_NOTA);
  lines.push('');
  lines.push('5. CONDIÇÕES GERAIS');
  CONDICOES_GERAIS.forEach(c => lines.push('▪ ' + c));
  lines.push('');
  lines.push('Atenciosamente,');
  lines.push(state.cliente.vendedorNome || '[Representante Comercial]');
  lines.push('Representante Comercial');
  if (cel) lines.push('Cel. ' + cel);
  lines.push(rule);
  lines.push(ISO_ENDERECO);
  lines.push(contatoLine());
  return lines.join('\n');
}

function sectionTitle(num, title) {
  return `<h2 class="pd-section-title"><span class="pd-section-num">${num}.</span> ${title}</h2>`;
}

function escopoBlockHtml(b) {
  if (b.tipo === 'plano') {
    const itens = b.itens.map(it => `<li class="${it.check ? 'is-check' : 'is-plain'}">${it.check ? '<span class="pd-check-mark">✓</span>' : ''}${escHtml(it.texto)}</li>`).join('');
    return `<div class="pd-escopo-row pd-escopo-plano"><div class="pd-escopo-head">${escHtml(b.header)}</div><ul class="pd-checklist">${itens}</ul></div>`;
  }
  return `<div class="pd-escopo-row pd-escopo-line">${escHtml(b.texto)}</div>`;
}

function examRowsHtml() {
  if (!state.examList.length) return `<div class="pd-exam-row"><span>(nenhum exame informado)</span><span></span></div>`;
  return state.examList.map(i => `<div class="pd-exam-row"><span>${escHtml(i.nome)}</span><span class="pd-exam-val">${formatBRL(i.valor)}</span></div>`).join('');
}

function investimentoHtml() {
  const inv = getInvestimento();
  let boxes = `
          <div class="pd-invest-box pd-invest-box--total">
            <span class="pd-invest-label">Valor Total</span>
            <span class="pd-invest-value">${inv.total}</span>
            <span class="pd-invest-hint">pela prestação dos serviços descritos</span>
          </div>`;
  if (inv.parcelamento) {
    boxes += `
          <div class="pd-invest-box pd-invest-box--parc">
            <span class="pd-invest-label">Parcelamento</span>
            <span class="pd-invest-value">${inv.parcelamento}</span>
            <span class="pd-invest-hint">em até ${inv.parcelas} parcelas iguais</span>
          </div>`;
  }
  let html = `<div class="pd-invest${inv.parcelamento ? '' : ' pd-invest--single'}">${boxes}</div>`;
  if (state.examList.length) html += `<p class="pd-invest-note">${EXAMES_NOTA}</p>`;
  return html;
}

/**
 * Print layout: @page has zero margin (the only reliable way to stop the
 * browser injecting URL/date/page-number headers and footers), so vertical
 * page margins come from the table's <thead>/<tfoot> spacers — print engines
 * repeat those on every page — and side margins from .pd-doc padding. The
 * footer is position:fixed, which print engines also repeat on every page.
 */
export function buildProposalHTML() {
  const cel = state.cliente.vendedorTelefone;
  const escopoHtml = getEscopoBlocks().map(escopoBlockHtml).join('');
  return `
    <div class="pd-doc">
      <table class="pd-page">
        <thead><tr><td><div class="pd-page-top"></div></td></tr></thead>
        <tfoot><tr><td><div class="pd-page-bottom"></div></td></tr></tfoot>
        <tbody><tr><td>
          <header class="pd-brand">
            <div class="pd-brand-name">${ISO_BRAND}</div>
            <div class="pd-brand-sub">${ISO_TAGLINE}</div>
          </header>

          <div class="pd-date">${escHtml(dataPorExtenso())}</div>

          <div class="pd-title-wrap">
            <h1 class="pd-title">PROPOSTA COMERCIAL</h1>
            <p class="pd-subtitle">Serviços Especializados em Medicina do Trabalho</p>
          </div>

          <div class="pd-client">
            <span class="pd-client-label">À empresa</span>
            <span class="pd-client-name">${escHtml(state.cliente.empresa || '[EMPRESA]')}</span>
          </div>

          <p class="pd-text">${INTRO_TEXT}</p>

          <section class="pd-section">
            ${sectionTitle(1, 'ESCOPO DOS SERVIÇOS')}
            <div class="pd-escopo">${escopoHtml}</div>
          </section>

          <section class="pd-section">
            ${sectionTitle(2, 'TABELA DE EXAMES COMPLEMENTARES')}
            <p class="pd-note">Exames complementares — pagos conforme utilização:</p>
            <div class="pd-exam-table">
              <div class="pd-exam-row pd-exam-head"><span>Exame</span><span>Valor unitário</span></div>
              ${examRowsHtml()}
            </div>
          </section>

          <section class="pd-section pd-keep">
            ${sectionTitle(3, 'COORDENAÇÃO')}
            <p class="pd-text">${escHtml(coordenacaoText())}</p>
          </section>

          <section class="pd-section pd-keep">
            ${sectionTitle(4, 'INVESTIMENTO')}
            <p class="pd-text">Pela prestação dos serviços descritos nesta proposta:</p>
            ${investimentoHtml()}
          </section>

          <section class="pd-section pd-keep">
            ${sectionTitle(5, 'CONDIÇÕES GERAIS')}
            <ul class="pd-list">
              ${CONDICOES_GERAIS.map(c => `<li>${escHtml(c)}</li>`).join('')}
            </ul>
          </section>

          <div class="pd-sign pd-keep">
            <p class="pd-text">Atenciosamente,</p>
            <div class="pd-sign-line"></div>
            <div class="pd-sign-name">${escHtml(state.cliente.vendedorNome || '[Representante Comercial]')}</div>
            <div class="pd-sign-role">Representante Comercial</div>
            ${cel ? `<div class="pd-sign-phone">Cel. ${escHtml(cel)}</div>` : ''}
          </div>
        </td></tr></tbody>
      </table>

      <footer class="pd-footer">
        <div class="pd-footer-line">${ISO_ENDERECO}</div>
        <div class="pd-footer-line pd-footer-contact">${escHtml(contatoLine())}</div>
      </footer>
    </div>`;
}

export function printProposal() {
  document.getElementById('printArea').innerHTML = buildProposalHTML();
  window.print();
}
