import { state } from './state.js';
import { formatBRL } from './ui.js';
import { cartTotal } from './session.js';
import { dataPorExtenso, getEscopoLines, getExamLines, getInvestimentoText, CONDICOES_GERAIS } from './proposal.js';

const MARGIN = 44;
const PAGE_W = 595.28;  // A4 pt
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

function sanitizeFilename(s) {
  return (s || 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'cliente';
}

/**
 * Builds the proposal PDF, mirroring the same sections/content as
 * buildProposalText()/buildProposalHTML() via the shared helpers in
 * proposal.js. Manual Y-offset tracking with explicit page breaks — jsPDF
 * does not auto-paginate.
 */
export function generateProposalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  function ensureSpace(needed) {
    if (y + needed > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; }
  }
  function paragraph(text, { size = 10.5, font = 'helvetica', style = 'normal', gap = 14, color = [30, 30, 30] } = {}) {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    lines.forEach(line => {
      ensureSpace(gap);
      doc.text(line, MARGIN, y);
      y += gap;
    });
  }
  function heading(text, { size = 12.5, gap = 20 } = {}) {
    ensureSpace(gap + 6);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, MARGIN, y);
    y += gap;
  }
  function bulletList(lines) {
    lines.forEach(l => paragraph('•  ' + l, { size: 10.5, gap: 14 }));
  }

  // Header
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(80, 80, 80);
  doc.text(dataPorExtenso(), MARGIN, y);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(20, 20, 20);
  doc.text('PROPOSTA COMERCIAL', MARGIN, y);
  y += 18;

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text('Serviços Especializados em Medicina do Trabalho', MARGIN, y);
  y += 26;

  paragraph(`À empresa ${state.cliente.empresa || '[EMPRESA]'},`, { size: 11, gap: 16 });
  y += 4;
  paragraph('O ISO — Instituto de Saúde Ocupacional de Londrina vem apresentar proposta técnica e comercial para a prestação de serviços de Medicina do Trabalho, elaborada de acordo com a legislação vigente e as necessidades específicas de vossa organização, com o objetivo de assegurar a saúde ocupacional dos colaboradores e a conformidade legal da empresa.');

  heading('1. ESCOPO DOS SERVIÇOS');
  bulletList(getEscopoLines());

  heading('2. TABELA DE EXAMES COMPLEMENTARES');
  paragraph('Exames complementares — pagos conforme utilização:', { gap: 14 });
  if (state.examList.length === 0) {
    bulletList(['(nenhum exame informado)']);
  } else {
    state.examList.forEach(item => {
      ensureSpace(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      doc.text(item.nome, MARGIN, y, { maxWidth: CONTENT_W - 90 });
      doc.setFont('helvetica', 'bold');
      doc.text(formatBRL(item.valor), MARGIN + CONTENT_W, y, { align: 'right' });
      y += 15;
    });
  }

  heading('3. COORDENAÇÃO');
  paragraph(`A coordenação da área de Saúde Ocupacional ficará sob responsabilidade do ${state.DATA.coordenacao.saude}, e a coordenação da área de Segurança do Trabalho ficará sob responsabilidade do ${state.DATA.coordenacao.seguranca}.`);

  heading('4. INVESTIMENTO');
  paragraph(getInvestimentoText());

  heading('5. CONDIÇÕES GERAIS');
  bulletList(CONDICOES_GERAIS);

  y += 24;
  ensureSpace(60);
  paragraph('Atenciosamente,', { gap: 16 });
  paragraph(state.cliente.vendedorNome || '[Representante Comercial]', { style: 'bold', gap: 14 });
  paragraph('Representante Comercial', { size: 9.5, gap: 12, color: [110, 110, 110] });
  if (state.cliente.vendedorTelefone) paragraph('Cel. ' + state.cliente.vendedorTelefone, { size: 9.5, gap: 12, color: [110, 110, 110] });

  // Footer on every page
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('ISO Londrina — Instituto de Saúde Ocupacional de Londrina — (43) 99131-6454 — contato@isolondrina.com.br', MARGIN, PAGE_H - 24);
    doc.text(`${p}/${pageCount}`, PAGE_W - MARGIN, PAGE_H - 24, { align: 'right' });
  }

  return doc;
}

export function proposalFilename() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `Proposta_ISO_Londrina_${sanitizeFilename(state.cliente.empresa)}_${today}.pdf`;
}

export function downloadProposalPDF() {
  const doc = generateProposalPDF();
  doc.save(proposalFilename());
}
