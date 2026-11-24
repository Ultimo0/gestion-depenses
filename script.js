/* =========================================
   1. INITIALISATION DES DONNÉES
========================================= */

// Tableau contenant toutes les transactions
const transactions = [];
let indexTransactionEnCours = null;

// Devises disponibles dans Kashmo
const devisesDisponibles = {
  XAF: {
    nom: "Franc CFA",
    symbole: "FCFA",
  },
  EUR: {
    nom: "Euro",
    symbole: "€",
  },
  USD: {
    nom: "Dollar américain",
    symbole: "$",
  },
  GBP: {
    nom: "Livre sterling",
    symbole: "£",
  },
  CAD: {
    nom: "Dollar canadien",
    symbole: "$ CA",
  },
  CHF: {
    nom: "Franc suisse",
    symbole: "CHF",
  },
};

// Devise utilisée par défaut
let deviseActuelle = "XAF";

// Récupérer le symbole de la devise actuelle
const obtenirSymboleDevise = () => {
  return devisesDisponibles[deviseActuelle].symbole;
};

// Formater un montant selon la devise actuelle
const formaterMontant = (montant) => {
  return `${montant.toLocaleString("fr-FR")} ${obtenirSymboleDevise()}`;
};

/* =========================================
   2. RÉCUPÉRATION DES ÉLÉMENTS HTML
========================================= */

// Titre
const titre = document.querySelector("h1");

// Solde
const elementSolde = document.querySelector("#solde");

// Résumé financier
const elementRevenus = document.querySelector("#total-revenus");
const elementDepenses = document.querySelector("#total-depenses");

// Liste des transactions
const liste = document.querySelector("#liste-transactions");

// Formulaire
const formulaire = document.querySelector("#formulaire");
// Éléments de la fenêtre modale
const modal = document.getElementById("modal-formulaire");
const boutonOuvrir = document.getElementById("btn-ouvrir-formulaire");
const boutonFermer = document.getElementById("btn-fermer-modal");
const description = document.querySelector("#champ-description");
const montant = document.querySelector("#champ-montant");
const categorie = document.querySelector("#champ-categorie");
const type = document.getElementById("champ-type");
const selectDevise = document.getElementById("select-devise");

// Ouvrir la fenêtre
boutonOuvrir.addEventListener("click", function () {
  modal.classList.remove("modal-cachee");
});

// Fermer avec le bouton X
boutonFermer.addEventListener("click", function () {
  modal.classList.add("modal-cachee");
});

// Fermer en cliquant sur le fond sombre
modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.classList.add("modal-cachee");
  }
});

// Fermer avec la touche Échap
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    modal.classList.add("modal-cachee");
  }
});

//Changement de devise
selectDevise.addEventListener("change", () => {
  deviseActuelle = selectDevise.value;
  actualiserApplication();
});

// Modifier le titre
titre.textContent = "Kashmo";

/* =========================================
    FONCTIONS DE CALCUL
========================================= */

// Calculer le solde total
const calculerSolde = () => {
  return transactions.reduce((total, transaction) => {
    return total + transaction.montant;
  }, 0);
};

// Calculer les revenus
const calculerRevenus = () => {
  return transactions
    .filter((transaction) => transaction.montant > 0)
    .reduce((total, transaction) => total + transaction.montant, 0);
};

// Calculer les dépenses
const calculerDepenses = () => {
  return transactions
    .filter((transaction) => transaction.montant < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.montant), 0);
};

// Bibliothèque des icônes SVG de Kashmo
const iconesCategories = {
  Salaire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15h.01M17 9h.01M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>`,

  Vente: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z"/><path d="M3 9h18M9 21v-7h6v7"/></svg>`,

  Transport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1-8H6l-1 8Z"/><path d="m7 9 2-4h6l2 4M5 13h14"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>`,

  Nourriture: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v7a3 3 0 0 0 6 0V3M6 3v18M18 3v18M18 3c-3 3-3 7 0 9"/></svg>`,

  Internet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>`,

  Loisirs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12a4 4 0 0 1 4 4v5a2 2 0 0 1-3.2 1.6L15 16H9l-3.8 2.6A2 2 0 0 1 2 17v-5a4 4 0 0 1 4-4Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/></svg>`,

  Autres: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>`,
};

// Déterminer le jour d'une transaction
const obtenirGroupeDate = (dateTransaction) => {
  const aujourdHui = new Date();

  const hier = new Date();
  hier.setDate(aujourdHui.getDate() - 1);

  const date = new Date(dateTransaction);

  if (date.toDateString() === aujourdHui.toDateString()) {
    return "Aujourd'hui";
  }

  if (date.toDateString() === hier.toDateString()) {
    return "Hier";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/* =========================================
   FONCTIONS D'AFFICHAGE
========================================= */

// Afficher les transactions
const afficherTransactions = () => {
  // Vider la liste avant de la reconstruire
  liste.innerHTML = "";

  // Préparer les groupes de transactions
  const groupes = new Map();

  // Classer les transactions selon leur date
  for (const [index, transaction] of transactions.entries()) {
    const groupeDate = obtenirGroupeDate(transaction.date);

    if (!groupes.has(groupeDate)) {
      groupes.set(groupeDate, []);
    }

    groupes.get(groupeDate).push({
      transaction: transaction,
      index: index,
    });
  }

  // Parcourir les transactions avec leur index
  for (const [groupeDate, transactionsDuJour] of groupes) {
    // Créer le conteneur du titre
    const elementTitre = document.createElement("li");

    // Créer le titre du groupe
    const titreGroupe = document.createElement("h3");

    titreGroupe.textContent = groupeDate;
    titreGroupe.classList.add("transaction-date-groupe");

    // Organiser le titre
    elementTitre.appendChild(titreGroupe);
    liste.appendChild(elementTitre);

    // Parcourir les transactions de ce groupe
    for (const elementGroupe of transactionsDuJour) {
      const transaction = elementGroupe.transaction;
      const index = elementGroupe.index;
      const element = document.createElement("li");
      element.classList.add("transaction-item");
      const texteDescription = document.createElement("span");
      const texteMontant = document.createElement("span");
      const texteCategorie = document.createElement("span");
      const boutonSupprimer = document.createElement("button");
      const boutonModifier = document.createElement("button");
      const actions = document.createElement("div");
      const informations = document.createElement("div");
      const details = document.createElement("div");
      const icone = document.createElement("div");

      // Organiser les éléments de la transaction
      informations.classList.add("transaction-informations");
      details.classList.add("transaction-details");
      icone.classList.add("transaction-icone");

      texteDescription.classList.add("transaction-description");
      texteCategorie.classList.add("transaction-categorie");
      texteMontant.classList.add("transaction-montant");
      boutonSupprimer.classList.add("transaction-supprimer");
      boutonModifier.classList.add("transaction-modifier");
      actions.classList.add("transaction-actions");

      // Créer le bouton de modification
      boutonModifier.innerHTML = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>
  </svg>
`;

      boutonModifier.setAttribute("aria-label", "Modifier la transaction");
      boutonModifier.title = "Modifier";

      // Créer le bouton de suppression
      boutonSupprimer.innerHTML = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#e11d48"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 6h18"/>
    <path d="M8 6V4h8v2"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v5"/>
    <path d="M14 11v5"/>
  </svg>
`;

      boutonSupprimer.setAttribute("aria-label", "Supprimer la transaction");
      boutonSupprimer.title = "Supprimer";

      // Préparer la modification de la transaction
      boutonModifier.addEventListener("click", () => {
        indexTransactionEnCours = index;

        // Remplir le formulaire avec les informations existantes
        description.value = transaction.description;
        montant.value = Math.abs(transaction.montant);
        type.value = transaction.type;
        categorie.value = transaction.categorie;

        // Afficher le formulaire
        modal.classList.remove("modal-cachee");
      });

      // Écouter le clic sur le bouton Supprimer
      boutonSupprimer.addEventListener("click", () => {
        const confirmation = confirm(
          "Voulez-vous vraiment supprimer cette transaction ?",
        );

        if (confirmation) {
          // Supprimer la transaction du tableau
          transactions.splice(index, 1);

          // Actualiser les affichages
          actualiserApplication();
        }
      });

      // Identifier le type de transaction
      if (transaction.type === "revenu") {
        element.classList.add("revenu");
      } else {
        element.classList.add("depense");
      }

      // Afficher la description et le montant
      texteDescription.textContent = transaction.description;
      const montantAbsolu = Math.abs(transaction.montant);

      const signe = transaction.type === "revenu" ? "+" : "−";

      texteMontant.textContent = `${signe}${formaterMontant(montantAbsolu)}`;
      texteCategorie.textContent = transaction.categorie || "Non catégorisée";

      // Choisir l'icône selon la catégorie
      icone.innerHTML =
        iconesCategories[transaction.categorie] || iconesCategories.Autres;

      const texteType = document.createElement("span");

      texteType.textContent =
        transaction.type === "revenu" ? "Revenu" : "Dépense";

      texteType.classList.add("transaction-type");

      // Organiser le type et la catégorie
      details.appendChild(texteType);
      details.appendChild(texteCategorie);

      // Regrouper les informations
      informations.appendChild(texteDescription);
      informations.appendChild(details);

      // Assembler la transaction
      element.appendChild(icone);
      element.appendChild(informations);
      element.appendChild(texteMontant);
      actions.appendChild(boutonModifier);
      actions.appendChild(boutonSupprimer);

      element.appendChild(actions);

      // Ajouter la transaction à la liste
      liste.appendChild(element);
    }
  }
};

// Afficher le solde
const afficherSolde = () => {
  const soldeTotal = calculerSolde();

  elementSolde.textContent = "Solde : " + formaterMontant(soldeTotal);
};

// Afficher le résumé financier
const afficherResumeFinancier = () => {
  // Afficher le total des revenus
  elementRevenus.textContent = formaterMontant(calculerRevenus());

  // Afficher le total des dépenses
  elementDepenses.textContent = formaterMontant(calculerDepenses());
};

// Actualiser tous les affichages
const actualiserApplication = () => {
  afficherTransactions();
  afficherSolde();
  afficherResumeFinancier();
};

/* =========================================
   GESTION DES ÉVÉNEMENTS
========================================= */

// Écouter le clic sur le bouton Ajouter
formulaire.addEventListener("submit", (event) => {
  event.preventDefault();

  // Récupérer et convertir les valeurs des champs
  const montantConverti = Number(montant.value.trim());
  const valeurDescription = description.value.trim();
  const valeurCategorie = categorie.value;
  const valeurType = type.value;

  // Vérifier que la description n'est pas vide
  if (valeurDescription === "") {
    alert("Description vide !");
    return;
  }

  // Vérifier que le montant n'est pas vide
  if (montant.value.trim() === "") {
    alert("Montant vide !");
    return;
  }

  // Vérifier que le montant est un nombre valide
  if (!Number.isFinite(montantConverti)) {
    alert("Saisissez un nombre valide");
    return;
  }

  if (montantConverti === 0) {
    alert("Saisissez un montant différent de zéro");
    return;
  }

  // Déterminer automatiquement le type de transaction
  let montantFinal;

  if (valeurType === "revenu") {
    montantFinal = montantConverti;
  } else {
    montantFinal = -montantConverti;
  }

  if (indexTransactionEnCours === null) {
    // Ajouter une nouvelle transaction
    transactions.push({
      description: valeurDescription,
      montant: montantFinal,
      type: valeurType,
      categorie: valeurCategorie,
      date: new Date(),
    });
  } else {
    // Modifier la transaction existante
    const transaction = transactions[indexTransactionEnCours];

    transaction.description = valeurDescription;
    transaction.montant = montantFinal;
    transaction.type = valeurType;
    transaction.categorie = valeurCategorie;
  }

  // Actualiser les affichages
  actualiserApplication();
  indexTransactionEnCours = null;

  // Vider les champs du formulaire
  description.value = "";
  montant.value = "";
  categorie.value = "";
  type.value = "";
});

/* =========================================
   INITIALISATION DE L'APPLICATION
========================================= */

// Afficher les informations dès le démarrage
actualiserApplication();
