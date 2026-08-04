/**
 * Single mutable state object shared across modules. Kept as one object (rather
 * than individually exported reassignable primitives) so other modules can
 * mutate properties directly without running into ES module "cannot reassign
 * imported binding" restrictions.
 */
export const state = {
  DATA: null,          // price/text data layer, set by data.js on boot
  editMode: false,
  selectedRisk: null,
  modalidade: 'formacao',
  currentPlano: null,
  nexoSelected: 1,

  cliente: { empresa: '', cnpj: '', responsavel: '', telefone: '', email: '', vendedorNome: '', vendedorTelefone: '' },
  cart: [],
  examList: [],
  numParcelas: null,

  trainOpen: {},
  trainQty: {},
  examAdded: {},
};

export function emptySession() {
  return {
    cliente: { empresa: '', cnpj: '', responsavel: '', telefone: '', email: '', vendedorNome: '', vendedorTelefone: '' },
    cart: [],
    examList: [],
    numParcelas: null,
  };
}
