// Liste principale des transactions
export const transactions = [];

// Index de la transaction actuellement modifiée
export let indexTransactionEnCours = null;

// Modifier l'index de la transaction en cours
export const definirIndexTransactionEnCours = (index) => {
  indexTransactionEnCours = index;
};
