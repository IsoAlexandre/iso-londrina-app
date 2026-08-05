/** Pure calculation helpers, no DOM access — shared by render and session modules. */

export function tierFor(t, qty) {
  if (qty >= 11) return { label: 'acima de 11 participantes', valorPessoa: t.v11 };
  if (qty >= 6) return { label: '6 a 10 participantes', valorPessoa: t.v6 };
  return { label: '1 a 5 participantes', valorPessoa: t.v1 };
}

export function parseFaixa(str) {
  const nums = str.match(/\d+/g).map(Number);
  // Faixas de valor único (ex.: "6 funcionários") têm apenas um número — usa-o como min e max.
  return { min: nums[0], max: nums.length > 1 ? nums[1] : nums[0] };
}
