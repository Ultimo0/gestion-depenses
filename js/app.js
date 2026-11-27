// =========================================
// IMPORTATION DES MODULES
// =========================================

// Données des transactions
import {
  transactions,
  indexTransactionEnCours,
  definirIndexTransactionEnCours,
} from "./data/transactions.js";

// Fonctions de calcul
import {
  calculerSolde,
  calculerRevenus,
  calculerDepenses,
} from "./data/calculs.js";

// Gestion des devises
import { definirDeviseActuelle, formaterMontant } from "./services/devises.js";

// Fonctions utilitaires
import { obtenirGroupeDate } from "./utils/dates.js";
import { iconesCategories } from "./utils/formatage.js";

// Affichage du tableau de bord
import { afficherSolde, afficherResumeFinancier } from "./pages/dashboard.js";

// Affichage des transactions
import { afficherTransactions } from "./pages/transactions.js";

// =========================================
// RÉCUPÉRATION DES ÉLÉMENTS HTML
// =========================================

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

// Fenêtre modale
const modal = document.getElementById("modal-formulaire");

// Boutons de la fenêtre modale
const boutonOuvrir = document.getElementById("btn-ouvrir-formulaire");
const boutonFermer = document.getElementById("btn-fermer-modal");

// Champs du formulaire
const description = document.querySelector("#champ-description");
const montant = document.querySelector("#champ-montant");
const categorie = document.querySelector("#champ-categorie");
const type = document.getElementById("champ-type");

// Sélecteur de devise
const selectDevise = document.getElementById("select-devise");

// =========================================
// DIAGNOSTIC DES ÉLÉMENTS DOM
// =========================================

// Signaler proprement qu'un élément DOM est absent.
// Jamais d'exception non maîtrisée ; jamais d'opération silencieuse sur un élément null.
const signalerElementManquant = (nom, selecteur) => {
  console.error(
    `[Kashmo] Élément DOM manquant : ${nom} (${selecteur}). ` +
      "Opération dépendante annulée proprement.",
  );
};

// Un élément DOM est-il réellement présent (non-null ET rattaché au document) ?
const elementPresent = (element) => {
  return (
    element !== null && element !== undefined && element.isConnected !== false
  );
};

// Éléments DOM indispensables à une opération financière (ajout / modification).
// Renvoie la liste des sélecteurs manquants (tableau vide = tout est présent).
const elementsTransactionManquants = () => {
  const manquants = [];

  // Le formulaire porte l'opération ; sans lui aucune soumission ne peut être traitée
  if (!elementPresent(formulaire)) {
    manquants.push("#formulaire");
  }

  // La modale héberge le formulaire et le workflow de saisie ; sans elle l'opération n'est pas pilotable
  if (!elementPresent(modal)) {
    manquants.push("#modal-formulaire");
  }

  // Champs de données indispensables : aucune donnée financière ne peut être lue sans eux
  if (!elementPresent(description)) {
    manquants.push("#champ-description");
  }

  if (!elementPresent(montant)) {
    manquants.push("#champ-montant");
  }

  if (!elementPresent(type)) {
    manquants.push("#champ-type");
  }

  if (!elementPresent(categorie)) {
    manquants.push("#champ-categorie");
  }

  return manquants;
};

// =========================================
// MODIFIER LE TITRE
// =========================================

// Modifier le titre (h1 facultatif : son absence n'empêche pas le reste de l'app)
if (elementPresent(titre)) {
  titre.textContent = "Kashmo";
} else {
  signalerElementManquant("titre", "h1");
}

// =========================================
// RÉINITIALISATION DU FORMULAIRE ET DU MODE MODIFICATION
// =========================================

// Réinitialiser les champs du formulaire et quitter le mode modification
const reinitialiserFormulaire = () => {
  // Revenir au mode "nouvelle transaction"
  definirIndexTransactionEnCours(null);

  // Vider les champs du formulaire si présents ; ne rien faire sinon
  if (elementPresent(description)) {
    description.value = "";
  }

  if (elementPresent(montant)) {
    montant.value = "";
  }

  if (elementPresent(categorie)) {
    categorie.value = "";
  }

  if (elementPresent(type)) {
    type.value = "";
  }
};

// Fermer la fenêtre modale sans enregistrer, en réinitialisant formulaire et mode
const fermerModal = () => {
  // Masquer la modale si présente ; sinon tracer, sans exception
  if (elementPresent(modal)) {
    modal.classList.add("modal-cachee");
  } else {
    signalerElementManquant("modal-formulaire", "#modal-formulaire");
  }

  // Toujours réinitialiser formulaire et mode (cette opération est sûre sans modale)
  reinitialiserFormulaire();
};

// =========================================
// ACTUALISATION DE L'APPLICATION
// =========================================

const actualiserApplication = () => {
  // 1. Actualiser l'historique des transactions.
  // `#liste-transactions` est indispensable au rendu de la liste ;
  // son absence n'empêche pas les mises à jour chiffrées ci-dessous.
  if (elementPresent(liste)) {
    afficherTransactions(
      liste,
      transactions,
      obtenirGroupeDate,
      formaterMontant,
      iconesCategories,
      gererModification,
      gererSuppression,
    );
  } else {
    signalerElementManquant("liste-transactions", "#liste-transactions");
  }

  // 2. Actualiser le solde (élément `#solde` facultatif, aucune exception)
  if (elementPresent(elementSolde)) {
    afficherSolde(elementSolde, calculerSolde, formaterMontant);
  } else {
    signalerElementManquant("solde", "#solde");
  }

  // 3. Actualiser les revenus et les dépenses.
  // `afficherResumeFinancier` exige les deux cibles : n'appeler que si les deux sont présentes.
  if (elementPresent(elementRevenus) && elementPresent(elementDepenses)) {
    afficherResumeFinancier(
      elementRevenus,
      elementDepenses,
      calculerRevenus,
      calculerDepenses,
      formaterMontant,
    );
  } else {
    signalerElementManquant(
      "resume-financier",
      "#total-revenus / #total-depenses",
    );
  }
};

// =========================================
// GESTION DE LA MODIFICATION
// =========================================

const gererModification = (transaction, index) => {
  // Vérifier que l'index correspond réellement à une transaction existante
  const transactionExistante =
    Number.isInteger(index) && index >= 0 && index < transactions.length
      ? transactions[index]
      : undefined;

  // Index invalide : ne pas entrer en mode modification, rester en mode ajout
  if (transactionExistante === undefined) {
    reinitialiserFormulaire();
    return;
  }

  // R-S3-10 : la demande de modification doit concerner exactement la transaction présente à cet index
  if (transactionExistante !== transaction) {
    // Référence de transaction incohérente : ne rien modifier, ne pas ouvrir la modale
    reinitialiserFormulaire();
    console.error(
      "[Kashmo] Modification annulée : la transaction demandée ne correspond pas à transactions[index].",
    );
    return;
  }

  // Éléments DOM indispensables à la modification :
  // formulaire complet + modale pour ouvrir/préremplir ; sinon annuler proprement
  const manquants = elementsTransactionManquants();

  if (manquants.length > 0) {
    // Ne pas rentrer en mode modification, ne pas modifier la transaction
    reinitialiserFormulaire();
    signalerElementManquant(
      "modification",
      `éléments manquants : ${manquants.join(", ")}`,
    );
    return;
  }

  // Repartir d'un formulaire vide et d'un mode propre
  reinitialiserFormulaire();

  // Mémoriser la transaction à modifier
  definirIndexTransactionEnCours(index);

  // Remplir le formulaire avec les anciennes valeurs
  description.value = transactionExistante.description;
  montant.value = Math.abs(transactionExistante.montant);
  type.value = transactionExistante.type;
  categorie.value = transactionExistante.categorie;

  // Ouvrir la fenêtre de modification
  modal.classList.remove("modal-cachee");
};

// =========================================
// GESTION DE LA SUPPRESSION
// =========================================

const gererSuppression = (index) => {
  const confirmation = confirm(
    "Voulez-vous vraiment supprimer cette transaction ?",
  );

  if (confirmation) {
    // R-S3-8 : valider l'index avant TOUTE suppression ; index invalide → rien modifier
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= transactions.length
    ) {
      console.error(
        `[Kashmo] Suppression annulée : index invalide (${index}). transactions.length=${transactions.length}.`,
      );
      return;
    }

    transactions.splice(index, 1);

    // Ne pas conserver d'index de modification périmé après suppression
    definirIndexTransactionEnCours(null);

    actualiserApplication();
  }
};

// =========================================
// GESTION DE LA FENÊTRE MODALE
// =========================================

// Ouvrir la fenêtre pour une nouvelle transaction
// Écouteur inscrit seulement si le bouton existe
if (elementPresent(boutonOuvrir)) {
  boutonOuvrir.addEventListener("click", () => {
    // Toujours repartir d'un formulaire vide et du mode "nouvelle transaction"
    reinitialiserFormulaire();

    // Ouvrir la modale si présente ; sinon aucune exception
    if (elementPresent(modal)) {
      modal.classList.remove("modal-cachee");
    } else {
      signalerElementManquant("modal-formulaire", "#modal-formulaire");
    }
  });
} else {
  signalerElementManquant("btn-ouvrir-formulaire", "#btn-ouvrir-formulaire");
}

// Fermer avec le bouton X (sans enregistrer)
// Écouteur inscrit seulement si le bouton existe
if (elementPresent(boutonFermer)) {
  boutonFermer.addEventListener("click", () => {
    fermerModal();
  });
} else {
  signalerElementManquant("btn-fermer-modal", "#btn-fermer-modal");
}

// Fermer en cliquant sur le fond sombre (sans enregistrer)
// Écouteur inscrit seulement si la modale existe
if (elementPresent(modal)) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      fermerModal();
    }
  });
} else {
  signalerElementManquant("modal-formulaire", "#modal-formulaire");
}

// Fermer avec la touche Échap (sans enregistrer)
// `document` est toujours présent ; `fermerModal` est sûre si la modale est absente
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    fermerModal();
  }
});

// =========================================
// GESTION DES DEVISES
// =========================================

// Écouteur inscrit seulement si le sélecteur de devise existe
if (elementPresent(selectDevise)) {
  selectDevise.addEventListener("change", () => {
    // Re-vérifier la présence avant de lire la valeur
    if (!elementPresent(selectDevise)) {
      return;
    }

    // `definirDeviseActuelle` ignore déjà toute valeur inconnue (secours XAF)
    definirDeviseActuelle(selectDevise.value);
    actualiserApplication();
  });
} else {
  // Sélecteur facultatif : son absence n'empêche pas le reste, mais on trace
  signalerElementManquant("select-devise", "#select-devise");
}

// =========================================
// GESTION DU FORMULAIRE
// =========================================

// Écouteur inscrit seulement si le formulaire existe.
// Sans `#formulaire`, aucune opération financière ne peut être déclenchée.
if (elementPresent(formulaire)) {
  formulaire.addEventListener("submit", (event) => {
    // Toujours empêcher l'envoi natif du navigateur
    event.preventDefault();

    // Re-vérifier le formulaire lui-même
    if (!elementPresent(formulaire)) {
      signalerElementManquant("formulaire", "#formulaire");
      return;
    }

    // -----------------------------------------
    // GARDE DOM : aucune opération financière avec des données DOM manquantes
    // -----------------------------------------
    const champsManquants = elementsTransactionManquants();

    if (champsManquants.length > 0) {
      // Ne rien ajouter, ne rien modifier, ne rien effacer ; annuler proprement
      signalerElementManquant(
        "champs de transaction",
        `éléments manquants : ${champsManquants.join(", ")}`,
      );
      return;
    }

    // Récupérer et convertir les valeurs des champs (lectures sécurisées)
    const montantBrut = (montant.value ?? "").trim();
    const montantConverti = Number(montantBrut);
    const valeurDescription = (description.value ?? "").trim();
    const valeurCategorie = categorie.value ?? "";
    const valeurType = type.value ?? "";

    // -----------------------------------------
    // VALIDATIONS MÉTIER (inchangées, ordre et messages préservés)
    // -----------------------------------------

    // Vérifier que la description n'est pas vide
    if (valeurDescription === "") {
      alert("Description vide !");
      return;
    }

    // Vérifier que le montant n'est pas vide
    if (montantBrut === "") {
      alert("Montant vide !");
      return;
    }

    // Vérifier que le montant est un nombre valide
    if (!Number.isFinite(montantConverti)) {
      alert("Saisissez un nombre valide");
      return;
    }

    // Vérifier que le montant saisi est positif (le signe est déterminé par le type)
    if (montantConverti < 0) {
      alert("Saisissez un montant positif (supérieur à zéro)");
      return;
    }

    // Vérifier que le montant est différent de zéro
    if (montantConverti === 0) {
      alert("Saisissez un montant différent de zéro");
      return;
    }

    // Vérifier que le type de transaction est valide
    if (valeurType !== "revenu" && valeurType !== "depense") {
      alert("Choisissez un type de transaction");
      return;
    }

    // Déterminer automatiquement le signe selon le type choisi
    // Revenu : montant strictement positif ; Dépense : montant strictement négatif
    const montantAbsolu = Math.abs(montantConverti);
    let montantFinal;

    if (valeurType === "revenu") {
      montantFinal = montantAbsolu;
    } else {
      montantFinal = -montantAbsolu;
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
      const indexTransaction = indexTransactionEnCours;

      // Vérifier que l'index correspond réellement à une transaction existante
      const transaction =
        Number.isInteger(indexTransaction) &&
        indexTransaction >= 0 &&
        indexTransaction < transactions.length
          ? transactions[indexTransaction]
          : undefined;

      // Ne rien écraser si l'index est invalide
      if (transaction !== undefined) {
        transaction.description = valeurDescription;
        transaction.montant = montantFinal;
        transaction.type = valeurType;
        transaction.categorie = valeurCategorie;
      } else {
        // Index périmé : revenir au mode ajout sans erreur
        definirIndexTransactionEnCours(null);
      }
    }

    // Actualiser les affichages
    actualiserApplication();

    // Fermer la fenêtre modale, réinitialiser le formulaire et le mode de modification
    fermerModal();
  });
} else {
  // Formulaire indispensable : sans lui, aucune opération financière n'est possible
  signalerElementManquant("formulaire", "#formulaire");
}

// =========================================
// INITIALISATION DE L'APPLICATION
// =========================================

actualiserApplication();
