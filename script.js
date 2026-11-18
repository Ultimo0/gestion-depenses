/* =========================================
   1. INITIALISATION DES DONNÉES
========================================= */

// Tableau contenant toutes les transactions
const transactions = [
  { description: "Salaire", montant: 5000 },
  { description: "Loyer", montant: -1500 },
  { description: "commerce", montant: 1000 },
];

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
const description = document.querySelector("#champ-description");
const montant = document.querySelector("#champ-montant");
const categorie = document.querySelector("#champ-categorie");

// Modifier le titre
titre.textContent = "Gestion de mes dépenses";

/* =========================================
   3. FONCTIONS DE CALCUL
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

/* =========================================
   4. FONCTIONS D'AFFICHAGE
========================================= */

// Afficher les transactions
const afficherTransactions = () => {
  // Vider la liste avant de la reconstruire
  liste.innerHTML = "";

  // Parcourir les transactions avec leur index
  for (const [index, transaction] of transactions.entries()) {
    const element = document.createElement("li");
    const texteDescription = document.createElement("span");
    const texteMontant = document.createElement("span");
    const texteCategorie = document.createElement("span");
    const boutonSupprimer = document.createElement("button");

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

    // Identifier les revenus et les dépenses
    if (transaction.montant < 0) {
      element.classList.add("depense");
    } else {
      element.classList.add("revenu");
    }

    // Afficher la description et le montant
    texteDescription.textContent = transaction.description;
    texteMontant.textContent =
      transaction.montant.toLocaleString("fr-FR") + " FCFA";
    texteCategorie.textContent = transaction.categorie || "Non catégorisée";

    // Ajouter les éléments à la liste HTML
    element.appendChild(texteDescription);
    element.appendChild(texteMontant);
    element.appendChild(texteCategorie);
    element.appendChild(boutonSupprimer);
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
   5. GESTION DES ÉVÉNEMENTS
========================================= */

// Écouter le clic sur le bouton Ajouter
formulaire.addEventListener("submit", (event) => {
  event.preventDefault();

  // Récupérer et convertir les valeurs des champs
  const montantConverti = Number(montant.value.trim());
  const valeurDescription = description.value.trim();
  const valeurCategorie = categorie.value;

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

  // Ajouter la nouvelle transaction au tableau
  transactions.push({
    description: valeurDescription,
    montant: montantConverti,
    categorie: valeurCategorie,
  });

  // Actualiser les affichages
  actualiserApplication();

  // Vider les champs du formulaire
  description.value = "";
  montant.value = "";
  categorie.value = "";
});

/* =========================================
   6. INITIALISATION DE L'APPLICATION
========================================= */

// Afficher les informations dès le démarrage
actualiserApplication();
