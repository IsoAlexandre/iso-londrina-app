import { state } from './state.js';
import { formatBRL, escHtml } from './ui.js';
import { cartTotal } from './session.js';

const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function dataPorExtenso() {
  const d = new Date();
  return `Londrina, ${d.getDate()} de ${MESES_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

export function escopoLine(item) {
  if (item.tipo === 'Plano') return `Gestão de saúde ocupacional — ${item.nome}${item.detalhe ? ' (' + item.detalhe + ')' : ''}`;
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
export function getEscopoLines() {
  return state.cart.length ? state.cart.map(escopoLine) : ['(nenhum item adicionado ao orçamento)'];
}
export function getExamLines() {
  return state.examList.length
    ? state.examList.map(i => `${i.nome}: ${formatBRL(i.valor)}`)
    : ['(nenhum exame informado)'];
}
export function getInvestimentoText() {
  const parcelas = getParcelas();
  const total = cartTotal();
  let text = `Pela prestação dos serviços descritos nesta proposta, o valor total é de ${formatBRL(total)}`;
  if (parcelas) text += `, podendo ser dividido em até ${parcelas} parcelas iguais de ${formatBRL(total / parcelas)}`;
  text += '.';
  return text;
}
export const CONDICOES_GERAIS = [
  'O início dos serviços será definido conforme alinhamento entre as partes após aceite formal da proposta;',
  'Condições de faturamento e pagamento a serem definidas em contrato específico;',
  'Eventuais serviços adicionais, não previstos no escopo acima, serão objeto de orçamento complementar;',
];

export function buildProposalText() {
  const lines = [];
  lines.push(dataPorExtenso());
  lines.push('');
  lines.push('PROPOSTA COMERCIAL');
  lines.push('Serviços Especializados em Medicina do Trabalho');
  lines.push('');
  lines.push(`À empresa ${state.cliente.empresa || '[EMPRESA]'},`);
  lines.push('');
  lines.push('O ISO — Instituto de Saúde Ocupacional de Londrina vem apresentar proposta técnica e comercial para a prestação de serviços de Medicina do Trabalho, elaborada de acordo com a legislação vigente e as necessidades específicas de vossa organização, com o objetivo de assegurar a saúde ocupacional dos colaboradores e a conformidade legal da empresa.');
  lines.push('');
  lines.push('1. ESCOPO DOS SERVIÇOS');
  getEscopoLines().forEach(l => lines.push('- ' + l));
  lines.push('');
  lines.push('2. TABELA DE EXAMES COMPLEMENTARES');
  lines.push('Exames complementares — pagos conforme utilização:');
  getExamLines().forEach(l => lines.push('- ' + l));
  lines.push('');
  lines.push('3. COORDENAÇÃO');
  lines.push(`A coordenação da área de Saúde Ocupacional ficará sob responsabilidade do ${state.DATA.coordenacao.saude}, e a coordenação da área de Segurança do Trabalho ficará sob responsabilidade do ${state.DATA.coordenacao.seguranca}.`);
  lines.push('');
  lines.push('4. INVESTIMENTO');
  lines.push(getInvestimentoText());
  lines.push('');
  lines.push('5. CONDIÇÕES GERAIS');
  CONDICOES_GERAIS.forEach(c => lines.push('- ' + c));
  lines.push('');
  lines.push('Atenciosamente,');
  lines.push(state.cliente.vendedorNome || '[Representante Comercial]');
  lines.push('Representante Comercial');
  if (state.cliente.vendedorTelefone) lines.push('Cel. ' + state.cliente.vendedorTelefone);
  return lines.join('\n');
}

export function buildProposalHTML() {
  const escopoRows = getEscopoLines().map(l => `<li style="margin-bottom:4px;">${escHtml(l)}</li>`).join('');
  const examRows = getExamLines().map(l => `<li style="margin-bottom:4px;">${escHtml(l)}</li>`).join('');
  const invText = getInvestimentoText().replace(/(R\$\s?[\d.,]+)/g, '<b>$1</b>');
  return `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:720px;margin:0 auto;color:#222;line-height:1.6;">
      <p style="font-style:italic;margin-bottom:0;">${dataPorExtenso()}</p>
      <h1 style="font-size:22px;margin:18px 0 0;letter-spacing:.02em;">PROPOSTA COMERCIAL</h1>
      <p style="font-style:italic;margin-top:2px;color:#555;">Serviços Especializados em Medicina do Trabalho</p>
      <p style="margin-top:22px;">À empresa <b>${escHtml(state.cliente.empresa || '[EMPRESA]')}</b>,</p>
      <p>O ISO — Instituto de Saúde Ocupacional de Londrina vem apresentar proposta técnica e comercial para a prestação de serviços de Medicina do Trabalho, elaborada de acordo com a legislação vigente e as necessidades específicas de vossa organização, com o objetivo de assegurar a saúde ocupacional dos colaboradores e a conformidade legal da empresa.</p>

      <h3 style="font-size:15.5px;margin-top:26px;">1. ESCOPO DOS SERVIÇOS</h3>
      <p>A prestação de serviços contemplará:</p>
      <ul style="padding-left:22px;">${escopoRows}</ul>

      <h3 style="font-size:15.5px;margin-top:22px;">2. TABELA DE EXAMES COMPLEMENTARES</h3>
      <p>Exames complementares — pagos conforme utilização:</p>
      <ul style="padding-left:22px;">${examRows}</ul>

      <h3 style="font-size:15.5px;margin-top:22px;">3. COORDENAÇÃO</h3>
      <p>A coordenação da área de Saúde Ocupacional ficará sob responsabilidade do ${escHtml(state.DATA.coordenacao.saude)}, e a coordenação da área de Segurança do Trabalho ficará sob responsabilidade do ${escHtml(state.DATA.coordenacao.seguranca)}.</p>

      <h3 style="font-size:15.5px;margin-top:22px;">4. INVESTIMENTO</h3>
      <p>${invText}</p>

      <h3 style="font-size:15.5px;margin-top:22px;">5. CONDIÇÕES GERAIS</h3>
      <ul style="padding-left:22px;">
        ${CONDICOES_GERAIS.map(c => `<li>${escHtml(c)}</li>`).join('')}
      </ul>

      <p style="margin-top:34px;">Atenciosamente,</p>
      <p style="margin-bottom:0;"><b>${escHtml(state.cliente.vendedorNome || '[Representante Comercial]')}</b><br>
      Representante Comercial${state.cliente.vendedorTelefone ? '<br>Cel. ' + escHtml(state.cliente.vendedorTelefone) : ''}</p>

      <p style="font-size:11.5px;color:#888;margin-top:40px;border-top:1px solid #ddd;padding-top:12px;">ISO Londrina — Instituto de Saúde Ocupacional de Londrina — (43) 99131-6454 — contato@isolondrina.com.br — R. Francisco Feijó Sanches, 284 — Londrina/PR</p>
    </div>`;
}

export function printProposal() {
  document.getElementById('printArea').innerHTML = buildProposalHTML();
  window.print();
}
