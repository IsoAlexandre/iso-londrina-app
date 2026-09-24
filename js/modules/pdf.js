import { state } from './state.js';
import { formatBRL } from './ui.js';
import {
  dataPorExtenso, getEscopoBlocks, getInvestimento, coordenacaoText, contatoLine, CONDICOES_GERAIS,
  ISO_BRAND, ISO_TAGLINE, ISO_ENDERECO, INTRO_TEXT, EXAMES_NOTA,
} from './proposal.js';

const PAGE_W = 595.28;  // A4 pt
const PAGE_H = 841.89;
const MARGIN_X = 48;
const TOP = 44;
const FOOTER_TOP = PAGE_H - 50;       // footer rule y
const BOTTOM = FOOTER_TOP - 16;       // last usable content baseline
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// Same palette as the .pd-* print CSS: pastel fills/borders, darker text.
const C = {
  ink: [51, 53, 46], muted: [107, 106, 94], white: [255, 255, 255],
  blue: [79, 114, 145], blueMid: [127, 167, 201], blueLight: [191, 215, 232], blueTint: [234, 241, 247],
  green: [78, 138, 98], sage: [127, 174, 141], greenTint: [238, 245, 240],
  salmon: [201, 117, 87], line: [213, 222, 227],
};

function sanitizeFilename(s) {
  return (s || 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'cliente';
}

/**
 * Builds the proposal PDF, mirroring the same sections/content/layout as
 * buildProposalHTML() (print) via the shared helpers in proposal.js. Manual
 * Y-offset tracking with explicit page breaks — jsPDF does not auto-paginate.
 * Helvetica has no "✓" glyph, so check marks and bullets are drawn as shapes.
 */
export function generateProposalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = TOP;

  const font = (style, size, color) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const ensureSpace = needed => {
    if (y + needed > BOTTOM) { doc.addPage(); y = TOP; }
  };
  // Width-aware centered text with letter-spacing (jsPDF's align:center ignores charSpace).
  const spacedCenter = (text, yy, charSpace) => {
    const w = doc.getTextWidth(text) + charSpace * (text.length - 1);
    doc.text(text, (PAGE_W - w) / 2, yy, { charSpace });
  };
  const paragraph = (text, { style = 'normal', size = 9.6, color = C.ink, lh = 13.5, x = MARGIN_X, width = CONTENT_W } = {}) => {
    font(style, size, color);
    doc.splitTextToSize(text, width).forEach(line => {
      ensureSpace(lh);
      doc.text(line, x, y);
      y += lh;
    });
  };
  const square = (x, yy, color) => {
    doc.setFillColor(...color);
    doc.rect(x, yy - 5, 3.6, 3.6, 'F');
  };
  const checkMark = (x, yy) => {
    doc.setDrawColor(...C.green);
    doc.setLineWidth(1.3);
    doc.lines([[2.4, 2.6], [4.6, -6]], x, yy - 3.4);
  };
  const section = (num, title, keepWithNext = 60) => {
    y += 12;
    ensureSpace(keepWithNext);
    doc.setFillColor(...C.blueTint);
    doc.rect(MARGIN_X, y, CONTENT_W, 19, 'F');
    doc.setFillColor(...C.blue);
    doc.rect(MARGIN_X, y, 3.2, 19, 'F');
    doc.setDrawColor(...C.blueLight);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_X, y + 19, MARGIN_X + CONTENT_W, y + 19);
    font('bold', 10.4, C.salmon);
    const numTxt = `${num}. `;
    doc.text(numTxt, MARGIN_X + 10, y + 13);
    font('bold', 10.4, C.blue);
    doc.text(title, MARGIN_X + 10 + doc.getTextWidth(numTxt), y + 13, { charSpace: 0.3 });
    y += 19 + 14;
  };

  // ---- Brand header
  font('bold', 21, C.blue);
  spacedCenter(ISO_BRAND, y + 14, 4.5);
  font('normal', 8.4, C.muted);
  spacedCenter(ISO_TAGLINE, y + 28, 0.15);
  y += 38;
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(1.6);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  doc.setDrawColor(...C.sage);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_X, y + 3.5, PAGE_W - MARGIN_X, y + 3.5);
  y += 22;

  font('italic', 9.2, C.muted);
  doc.text(dataPorExtenso(), PAGE_W - MARGIN_X, y, { align: 'right' });
  y += 24;

  font('bold', 18.5, C.blue);
  doc.text('PROPOSTA COMERCIAL', MARGIN_X, y, { charSpace: 0.9 });
  y += 16;
  font('italic', 10.4, C.salmon);
  doc.text('Serviços Especializados em Medicina do Trabalho', MARGIN_X, y);
  y += 14;

  // ---- Client bar
  doc.setFillColor(...C.blueTint);
  doc.rect(MARGIN_X, y, CONTENT_W, 22, 'F');
  doc.setFillColor(...C.salmon);
  doc.rect(MARGIN_X, y, 3.2, 22, 'F');
  font('normal', 9.2, C.muted);
  doc.text('À empresa', MARGIN_X + 11, y + 14.5);
  const labelW = doc.getTextWidth('À empresa ');
  font('bold', 10.2, C.blue);
  doc.text((state.cliente.empresa || '[EMPRESA]').toUpperCase(), MARGIN_X + 11 + labelW + 2, y + 14.5, { maxWidth: CONTENT_W - labelW - 24 });
  y += 22 + 18;

  paragraph(INTRO_TEXT);

  // ---- 1. Escopo
  section(1, 'ESCOPO DOS SERVIÇOS');
  getEscopoBlocks().forEach((b, idx) => {
    if (idx > 0) {
      doc.setDrawColor(...C.line);
      doc.setLineWidth(0.6);
      doc.line(MARGIN_X, y - 9, MARGIN_X + CONTENT_W, y - 9);
    }
    if (b.tipo === 'plano') {
      ensureSpace(40);
      paragraph(b.header, { style: 'bold', color: C.blue, x: MARGIN_X + 10, width: CONTENT_W - 20 });
      y += 2;
      b.itens.forEach(it => {
        const lines = doc.splitTextToSize(it.texto, CONTENT_W - 36);
        ensureSpace(lines.length * 12.8);
        if (it.check) checkMark(MARGIN_X + 11, y);
        font('normal', 9.4, C.ink);
        lines.forEach(line => { doc.text(line, MARGIN_X + 25, y); y += 12.8; });
      });
    } else {
      ensureSpace(14);
      square(MARGIN_X + 11, y, C.salmon);
      paragraph(b.texto, { x: MARGIN_X + 22, width: CONTENT_W - 32 });
    }
    y += 12;
  });
  y -= 12;

  // ---- 2. Exames
  section(2, 'TABELA DE EXAMES COMPLEMENTARES');
  paragraph('Exames complementares — pagos conforme utilização:', { style: 'italic', size: 9, color: C.muted });
  y += 3;
  y += 1;
  ensureSpace(40);
  doc.setFillColor(...C.blue);
  doc.rect(MARGIN_X, y - 11, CONTENT_W, 18, 'F');
  font('bold', 7.8, C.white);
  doc.text('EXAME', MARGIN_X + 10, y, { charSpace: 0.4 });
  doc.text('VALOR UNITÁRIO', MARGIN_X + CONTENT_W - 10, y, { align: 'right' });
  y += 20;
  const exams = state.examList.length ? state.examList : [{ nome: '(nenhum exame informado)', valor: null }];
  exams.forEach(item => {
    font('normal', 9.4, C.ink);
    const lines = doc.splitTextToSize(item.nome, CONTENT_W - 110);
    ensureSpace(lines.length * 12.5 + 6);
    lines.forEach((line, i) => doc.text(line, MARGIN_X + 10, y + i * 12.5));
    if (item.valor != null) {
      font('bold', 9.4, C.blue);
      doc.text(formatBRL(item.valor), MARGIN_X + CONTENT_W - 10, y, { align: 'right' });
    }
    y += (lines.length - 1) * 12.5 + 7;
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, y, MARGIN_X + CONTENT_W, y);
    y += 13;
  });
  y -= 13;

  // ---- 3. Coordenação
  section(3, 'COORDENAÇÃO');
  paragraph(coordenacaoText());

  // ---- 4. Investimento
  const inv = getInvestimento();
  section(4, 'INVESTIMENTO', 140);
  paragraph('Pela prestação dos serviços descritos nesta proposta:');
  y += 1;
  const boxH = 58;
  const gap = 10;
  const boxW = inv.parcelamento ? (CONTENT_W - gap) / 2 : CONTENT_W / 2;
  const drawBox = (x, fill, border, label, value, hint) => {
    doc.setFillColor(...fill);
    doc.setDrawColor(...border);
    doc.setLineWidth(1.2);
    doc.roundedRect(x, y, boxW, boxH, 7, 7, 'FD');
    const cx = x + boxW / 2;
    font('bold', 7.6, C.muted);
    const lw = doc.getTextWidth(label) + 1.4 * (label.length - 1);
    doc.text(label, cx - lw / 2, y + 15, { charSpace: 1.4 });
    font('bold', 17, C.blue);
    doc.text(value, cx, y + 35, { align: 'center' });
    font('italic', 8, C.muted);
    doc.text(hint, cx, y + 49, { align: 'center' });
  };
  drawBox(MARGIN_X, C.greenTint, C.sage, 'VALOR TOTAL', inv.total, 'pela prestação dos serviços descritos');
  if (inv.parcelamento) {
    drawBox(MARGIN_X + boxW + gap, C.blueTint, C.blueMid, 'PARCELAMENTO', inv.parcelamento, `em até ${inv.parcelas} parcelas iguais`);
  }
  y += boxH + 14;
  if (state.examList.length) paragraph(EXAMES_NOTA, { style: 'italic', size: 8.3, color: C.muted, lh: 11.5 });

  // ---- 5. Condições gerais
  section(5, 'CONDIÇÕES GERAIS');
  CONDICOES_GERAIS.forEach(c => {
    ensureSpace(14);
    square(MARGIN_X + 1, y, C.salmon);
    paragraph(c, { x: MARGIN_X + 13, width: CONTENT_W - 13 });
    y += 1.5;
  });

  // ---- Assinatura
  y += 16;
  ensureSpace(90);
  paragraph('Atenciosamente,');
  y += 26;
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_X, y, MARGIN_X + 176, y);
  y += 15;
  paragraph((state.cliente.vendedorNome || '[Representante Comercial]').toUpperCase(), { style: 'bold', size: 10.2, color: C.blue });
  paragraph('Representante Comercial', { color: C.muted });
  if (state.cliente.vendedorTelefone) paragraph('Cel. ' + state.cliente.vendedorTelefone, { color: C.muted });

  // ---- Footer on every page (no page numbering, by design)
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.sage);
    doc.setLineWidth(1);
    doc.line(MARGIN_X, FOOTER_TOP, PAGE_W - MARGIN_X, FOOTER_TOP);
    font('normal', 7.8, C.muted);
    doc.text(ISO_ENDERECO, PAGE_W / 2, FOOTER_TOP + 13, { align: 'center' });
    font('bold', 7.8, C.blue);
    doc.text(contatoLine(), PAGE_W / 2, FOOTER_TOP + 24, { align: 'center' });
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
