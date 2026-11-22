/* =========================================
   1. INITIALISATION DES DONNÉES
========================================= */

// Tableau contenant toutes les transactions
const transactions = [];

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

/* =========================================
   FONCTIONS D'AFFICHAGE
========================================= */

// Afficher les transactions
const afficherTransactions = () => {
  // Vider la liste avant de la reconstruire
  liste.innerHTML = "";

  // Parcourir les transactions avec leur index
  for (const [index, transaction] of transactions.entries()) {
    const element = document.createElement("li");
    element.classList.add("transaction-item");
    const texteDescription = document.createElement("span");
    const texteMontant = document.createElement("span");
    const texteCategorie = document.createElement("span");
    const boutonSupprimer = document.createElement("button");
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

    // Créer le bouton de suppression
    boutonSupprimer.textContent = "Supprimer";

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

    texteMontant.textContent = `
  ${signe}${montantAbsolu.toLocaleString("fr-FR")} FCFA`;
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
    element.appendChild(boutonSupprimer);

    // Ajouter la transaction à la liste
    liste.appendChild(element);
  }
};

// Afficher le solde
const afficherSolde = () => {
  const soldeTotal = calculerSolde();

  elementSolde.textContent =
    "Solde : " + soldeTotal.toLocaleString("fr-FR") + " FCFA";
};

// Afficher le résumé financier
const afficherResumeFinancier = () => {
  // Afficher le total des revenus
  elementRevenus.textContent =
    calculerRevenus().toLocaleString("fr-FR") + " FCFA";

  // Afficher le total des dépenses
  elementDepenses.textContent =
    calculerDepenses().toLocaleString("fr-FR") + " FCFA";
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

  // Ajouter la nouvelle transaction au tableau
  transactions.push({
    description: valeurDescription,
    montant: montantFinal,
    type: valeurType,
    categorie: valeurCategorie,
  });

  // Actualiser les affichages
  actualiserApplication();

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
