// Récupérer le tableau central des transactions
import { transactions } from "./transactions.js";

// Calculer le solde total
export const calculerSolde = () => {
  return transactions.reduce((total, transaction) => {
    return total + transaction.montant;
  }, 0);
};

// Calculer les revenus
export const calculerRevenus = () => {
  return transactions
    .filter((transaction) => transaction.montant > 0)
    .reduce((total, transaction) => total + transaction.montant, 0);
};

// Calculer les dépenses
export const calculerDepenses = () => {
  return transactions
    .filter((transaction) => transaction.montant < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.montant), 0);
};
