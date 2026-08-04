/**
 * Shared validation rules for the price/text data layer. Used both by the
 * edit-mode Save action and by JSON import, so both paths enforce identical
 * rules and neither can persist an invalid tree.
 */

export function isNonEmptyText(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isNonNegativeNumberOrNull(v) {
  return v === null || (typeof v === 'number' && isFinite(v) && v >= 0);
}

export function isNonNegativeNumber(v) {
  return typeof v === 'number' && isFinite(v) && v >= 0;
}

export function isPositiveInt(v) {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1;
}

/**
 * Validates the whole data-layer object tree. Returns { valid, errors } where
 * errors is a list of { path, message } — path is a human-readable pointer
 * used both to highlight offending inputs and to summarize import failures.
 */
export function validateDataTree(DATA) {
  const errors = [];
  const push = (path, message) => errors.push({ path, message });

  if (!DATA || typeof DATA !== 'object') {
    return { valid: false, errors: [{ path: 'raiz', message: 'Arquivo de dados inválido ou vazio.' }] };
  }

  (DATA.servicos || []).forEach((s, i) => {
    if (!isNonEmptyText(s.nome)) push(`servicos[${i}].nome`, `Serviço #${i + 1}: nome não pode ficar vazio.`);
  });

  (DATA.pilares || []).forEach((p, i) => {
    if (!isNonEmptyText(p.nome)) push(`pilares[${i}].nome`, `Pilar #${i + 1}: nome não pode ficar vazio.`);
  });

  ['formacao', 'reciclagem'].forEach(mod => {
    (DATA.treinamentos?.[mod] || []).forEach((t, i) => {
      if (!isNonEmptyText(t.nome)) push(`treinamentos.${mod}[${i}].nome`, `Treinamento (${mod}) #${i + 1}: nome não pode ficar vazio.`);
      ['v1', 'v6', 'v11'].forEach(k => {
        if (!isNonNegativeNumberOrNull(t[k])) push(`treinamentos.${mod}[${i}].${k}`, `Treinamento (${mod}) #${i + 1}: valor "${k}" não pode ser negativo.`);
      });
    });
  });
  (DATA.treinamentos?.outros || []).forEach((t, i) => {
    if (!isNonEmptyText(t.nome)) push(`treinamentos.outros[${i}].nome`, `Outro treinamento #${i + 1}: nome não pode ficar vazio.`);
    if (!isNonNegativeNumber(t.valorPessoa)) push(`treinamentos.outros[${i}].valorPessoa`, `Outro treinamento #${i + 1}: valor por pessoa não pode ser negativo.`);
    if (!isPositiveInt(t.minimoPessoas)) push(`treinamentos.outros[${i}].minimoPessoas`, `Outro treinamento #${i + 1}: mínimo de pessoas deve ser um número inteiro >= 1.`);
  });

  Object.entries(DATA.orcamento || {}).forEach(([grau, tiers]) => {
    (tiers || []).forEach((t, i) => {
      if (!isNonEmptyText(t.faixa)) push(`orcamento[${grau}][${i}].faixa`, `Orçamento "${grau}" faixa #${i + 1}: descrição não pode ficar vazia.`);
      if (!isNonNegativeNumber(t.valor)) push(`orcamento[${grau}][${i}].valor`, `Orçamento "${grau}" faixa #${i + 1}: valor não pode ser negativo.`);
    });
  });

  (DATA.exames || []).forEach((e, i) => {
    if (!isNonEmptyText(e[0])) push(`exames[${i}][0]`, `Exame #${i + 1}: nome não pode ficar vazio.`);
    if (!isNonNegativeNumber(e[1])) push(`exames[${i}][1]`, `Exame #${i + 1}: valor não pode ser negativo.`);
  });

  (DATA.nexo?.niveis || []).forEach((n, i) => {
    if (!isNonEmptyText(n.nome)) push(`nexo.niveis[${i}].nome`, `Nível Nexo #${i + 1}: nome não pode ficar vazio.`);
    if (!isNonNegativeNumber(n.valor)) push(`nexo.niveis[${i}].valor`, `Nível Nexo #${i + 1}: valor não pode ser negativo.`);
  });

  return { valid: errors.length === 0, errors };
}
