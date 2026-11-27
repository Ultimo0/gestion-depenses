// =========================================
// UTILITAIRES DE SÉCURITÉ DOM (rendu)
// =========================================

// Un élément DOM existe-t-il (non-null) ?
const elementPresent = (element) => {
  return element !== null && element !== undefined;
};

// Un élément DOM cible existe-t-il ET reste-t-il connecté au document ?
const cibleRenduPresente = (element) => {
  return elementPresent(element) && element.isConnected !== false;
};

// Signaler proprement qu'une cible de rendu est absente, sans exception non maîtrisée
const signalerCibleManquante = (nom, selecteur) => {
  console.error(
    `[Kashmo] Cible de rendu manquante : ${nom} (${selecteur}). ` +
      "Rendu annulé proprement pour cet élément.",
  );
};

// =========================================
// AFFICHER LE SOLDE
// =========================================

// Afficher le solde
// Signature conservée : (elementSolde, calculerSolde, formaterMontant)
export const afficherSolde = (elementSolde, calculerSolde, formaterMontant) => {
  // Cible de rendu `#solde` : vérifier présence + connexion avant manipulation
  if (!cibleRenduPresente(elementSolde)) {
    signalerCibleManquante("solde", "#solde");
    return;
  }

  const soldeTotal = calculerSolde();

  elementSolde.textContent = "Solde : " + formaterMontant(soldeTotal);
};

// =========================================
// AFFICHER LE RÉSUMÉ FINANCIER
// =========================================

// Afficher le résumé financier
// Signature conservée :
// (elementRevenus, elementDepenses, calculerRevenus, calculerDepenses, formaterMontant)
export const afficherResumeFinancier = (
  elementRevenus,
  elementDepenses,
  calculerRevenus,
  calculerDepenses,
  formaterMontant,
) => {
  // `#total-revenus` : vérifier présence + connexion ; absence indépendante de l'autre cible
  if (cibleRenduPresente(elementRevenus)) {
    elementRevenus.textContent = formaterMontant(calculerRevenus());
  } else {
    signalerCibleManquante("total-revenus", "#total-revenus");
  }

  // `#total-depenses` : vérifier présence + connexion ; mise à jour indépendante
  if (cibleRenduPresente(elementDepenses)) {
    elementDepenses.textContent = formaterMontant(calculerDepenses());
  } else {
    signalerCibleManquante("total-depenses", "#total-depenses");
  }
};
