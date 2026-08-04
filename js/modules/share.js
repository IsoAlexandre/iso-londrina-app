import { state } from './state.js';
import { showToast } from './ui.js';
import { buildProposalText } from './proposal.js';
import { generateProposalPDF, proposalFilename } from './pdf.js';

export function emailProposal() {
  const subject = encodeURIComponent('Proposta Comercial - ISO Londrina');
  const body = encodeURIComponent(buildProposalText());
  const to = encodeURIComponent(state.cliente.email || '');
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

export function whatsappProposal() {
  const text = encodeURIComponent(buildProposalText());
  const digits = (state.cliente.telefone || '').replace(/\D/g, '');
  let phonePart = '';
  if (digits) { phonePart = digits.length <= 11 ? '55' + digits : digits; }
  const url = phonePart ? `https://wa.me/${phonePart}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, '_blank');
}

/**
 * Shares the generated PDF via the native OS share sheet (WhatsApp, Gmail,
 * etc.) when the browser supports sharing files. Falls back to downloading
 * the PDF locally when Web Share with files isn't supported — the existing
 * mailto/wa.me text buttons remain available as a separate, always-working
 * fallback regardless.
 */
export async function sharePDF() {
  let doc;
  try {
    doc = generateProposalPDF();
  } catch (e) {
    console.error('[sharePDF] falha ao gerar PDF', e);
    showToast('Não foi possível gerar o PDF');
    return;
  }
  const filename = proposalFilename();
  const blob = doc.output('blob');

  const canUseWebShare = 'canShare' in navigator && (() => {
    try {
      const testFile = new File([blob], filename, { type: 'application/pdf' });
      return navigator.canShare({ files: [testFile] });
    } catch (e) { return false; }
  })();

  if (canUseWebShare) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    try {
      await navigator.share({ files: [file], title: 'Proposta Comercial - ISO Londrina', text: 'Proposta Comercial - ISO Londrina' });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return; // user cancelled the share sheet
      console.warn('[sharePDF] navigator.share falhou, usando download', e);
    }
  }

  doc.save(filename);
  showToast('PDF baixado — anexe manualmente no e-mail ou WhatsApp');
}
