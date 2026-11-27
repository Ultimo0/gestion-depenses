// =========================================
// IMPORTATION DES MODULES
// =========================================

// Données des transactions
import {
  transactions,
  indexTransactionEnCours,
  definirIndexTransactionEnCours,
  chargerTransactions,
  sauvegarderTransactions,
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

// Page Statistiques (P5 ÉTAPE 7)
import { afficherStatistiques } from "./pages/statistiques.js";

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

  // 4. Actualiser la page Statistiques (P5 ÉTAPE 7). `#view-statistiques` conservée dans le DOM (hidden).
  const elementStatistiques = document.getElementById("view-statistiques");

  if (elementPresent(elementStatistiques)) {
    afficherStatistiques(elementStatistiques, transactions, {
      formaterMontant: formaterMontant,
      calculerSolde: calculerSolde,
    });
  } else {
    signalerElementManquant("view-statistiques", "#view-statistiques");
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

    // Mutation -> sauvegarde -> actualisation (P5 ÉTAPE 6)
    sauvegarderTransactions();
    actualiserApplication();
  }
};

// =========================================
// GESTION DE LA FENÊTRE MODALE
// =========================================

// Ouvrir la fenêtre pour une nouvelle transaction
// Écouteur inscrit seulement si le bouton existe
if (elementPresent(boutonOuvrir)) {
  // Comportement P4 inchangé : repartir d'un formulaire vide + ouvrir la modale
  const ouvrirFormulaire = () => {
    // Toujours repartir d'un formulaire vide et du mode "nouvelle transaction"
    reinitialiserFormulaire();

    // Ouvrir la modale si présente ; sinon aucune exception
    if (elementPresent(modal)) {
      modal.classList.remove("modal-cachee");
    } else {
      signalerElementManquant("modal-formulaire", "#modal-formulaire");
    }
  };

  // Un glissement ne doit jamais déclencher l'ouverture du formulaire
  let suppressClickAfterDrag = false;

  boutonOuvrir.addEventListener("click", (event) => {
    if (suppressClickAfterDrag) {
      // Le clic engendré par la fin d'un glissement est neutralisé
      suppressClickAfterDrag = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Clic simple (souris, tactile sans déplacement, clavier) -> ouvrir
    ouvrirFormulaire();
  });

  // =========================================
  // P5 ÉTAPE 4 : BOUTON FLOTTANT DÉPLAÇABLE (sans persistance)
  // =========================================

  // Seuil de mouvement (px) distinguant un clic d'un glissement
  const SEUIL_GLISSER = 6;
  // Pas de déplacement clavier (px)
  const PAS_CLAVIER = 10;
  // Marge de sécurité aux bords (px)
  const MARGE_BORD = 8;
  // Classe pendant le déplacement (désactive les animations gênantes)
  const CLASSE_GLISSER = "en-glissement";

  // Pas de localStorage / sessionStorage / cookie : aucune persistance.
  // La position initiale (CSS) est restaurée au rechargement.

  let pointeurActif = null;
  let departX = 0;
  let departY = 0;
  let departLeft = 0;
  let departTop = 0;
  let enGlissement = false;

  // Fenêtre visible
  const largeurFenetre = () => {
    if (window.visualViewport && window.visualViewport.width) {
      return window.visualViewport.width;
    }
    return window.innerWidth || document.documentElement.clientWidth || 0;
  };

  const hauteurFenetre = () => {
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
    return window.innerHeight || document.documentElement.clientHeight || 0;
  };

  // Forcer un positionnement absolu gauche/haut (sans toucher à la position CSS initiale au repos)
  const assurerPositionAbsolue = () => {
    if (!elementPresent(boutonOuvrir)) {
      return null;
    }

    const rect = boutonOuvrir.getBoundingClientRect();

    boutonOuvrir.style.left = rect.left + "px";
    boutonOuvrir.style.top = rect.top + "px";
    boutonOuvrir.style.right = "auto";
    boutonOuvrir.style.bottom = "auto";

    return boutonOuvrir.getBoundingClientRect();
  };

  // Déplacer en restant dans les limites visibles et sans recouvrir la navigation
  const deplacerBouton = (left, top) => {
    if (!elementPresent(boutonOuvrir)) {
      return;
    }

    const rect = boutonOuvrir.getBoundingClientRect();
    const largeur = rect.width;
    const hauteur = rect.height;
    const vw = largeurFenetre();
    const vh = hauteurFenetre();

    // Borne haut/bas de base
    const minLeft = MARGE_BORD;
    const maxLeft = Math.max(minLeft, vw - largeur - MARGE_BORD);
    const minTop = MARGE_BORD;
    let maxTop = Math.max(minTop, vh - hauteur - MARGE_BORD);

    // Ne pas recouvrir la barre de navigation fixe : s'arrêter au-dessus
    const nav = document.querySelector(".onglets-fixes");

    if (elementPresent(nav)) {
      const nr = nav.getBoundingClientRect();

      if (nr.height > 0 && nr.top < vh) {
        maxTop = Math.min(maxTop, Math.max(minTop, nr.top - hauteur - MARGE_BORD));
      }
    }

    const clampedLeft = Math.min(Math.max(left, minLeft), maxLeft);
    const clampedTop = Math.min(Math.max(top, minTop), maxTop);

    boutonOuvrir.style.left = clampedLeft + "px";
    boutonOuvrir.style.top = clampedTop + "px";
    boutonOuvrir.style.right = "auto";
    boutonOuvrir.style.bottom = "auto";
  };

  const commencerGlissement = () => {
    assurerPositionAbsolue();

    if (elementPresent(boutonOuvrir)) {
      boutonOuvrir.classList.add(CLASSE_GLISSER);
    }
  };

  const terminerGlissement = (event) => {
    if (pointeurActif === null) {
      return;
    }

    const etaitGlissement = enGlissement;

    pointeurActif = null;
    enGlissement = false;

    if (elementPresent(boutonOuvrir)) {
      boutonOuvrir.classList.remove(CLASSE_GLISSER);

      if (
        event &&
        typeof boutonOuvrir.releasePointerCapture === "function"
      ) {
        try {
          if (boutonOuvrir.hasPointerCapture && boutonOuvrir.hasPointerCapture(event.pointerId)) {
            boutonOuvrir.releasePointerCapture(event.pointerId);
          }
        } catch (err) {
          // Capture déjà relâchée : sans conséquence
        }
      }
    }

    return etaitGlissement;
  };

  // --- Pointer Events (souris + tactile + stylet) ---
  boutonOuvrir.addEventListener("pointerdown", (event) => {
    if (!elementPresent(boutonOuvrir)) {
      return;
    }

    // Souris : bouton principal uniquement
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointeurActif = event.pointerId;
    departX = event.clientX;
    departY = event.clientY;
    enGlissement = false;

    const rect = boutonOuvrir.getBoundingClientRect();
    departLeft = rect.left;
    departTop = rect.top;

    if (typeof boutonOuvrir.setPointerCapture === "function") {
      try {
        boutonOuvrir.setPointerCapture(event.pointerId);
      } catch (err) {
        // Capture indisponible : sans conséquence
      }
    }
  });

  boutonOuvrir.addEventListener("pointermove", (event) => {
    if (pointeurActif === null || event.pointerId !== pointeurActif) {
      return;
    }

    if (!elementPresent(boutonOuvrir)) {
      return;
    }

    const dx = event.clientX - departX;
    const dy = event.clientY - departY;

    // Seuil : sous le seuil, ce n'est pas encore un glissement
    if (!enGlissement) {
      if (Math.hypot(dx, dy) < SEUIL_GLISSER) {
        return;
      }

      enGlissement = true;
      commencerGlissement();
    }

    // Un glissement déplace le bouton et n'ouvre jamais le formulaire
    event.preventDefault();
    deplacerBouton(departLeft + dx, departTop + dy);
  });

  boutonOuvrir.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointeurActif) {
      return;
    }

    const etaitGlissement = terminerGlissement(event);

    // Si on a glissé : neutraliser le `click` engendré par le navigateur
    if (etaitGlissement) {
      suppressClickAfterDrag = true;
      event.preventDefault();
    }
  });

  boutonOuvrir.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== pointeurActif) {
      return;
    }

    // Annulation : terminer sans ouvrir ; neutraliser un éventuel click
    const etaitGlissement = terminerGlissement(event);

    if (etaitGlissement) {
      suppressClickAfterDrag = true;
    }
  });

  // --- Alternative clavier accessible (le bouton natif reste activable Enter/Espace pour ouvrir) ---
  boutonOuvrir.addEventListener("keydown", (event) => {
    if (!elementPresent(boutonOuvrir)) {
      return;
    }

    const touches = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

    if (!touches.includes(event.key)) {
      return; // Enter/Espace -> click natif -> ouvrir ; autres touches inchangées
    }

    // Flèches : déplacer le bouton, sans ouvrir le formulaire
    event.preventDefault();

    const rect = assurerPositionAbsolue();

    if (!rect) {
      return;
    }

    const pas = event.shiftKey ? PAS_CLAVIER * 4 : PAS_CLAVIER;
    let left = rect.left;
    let top = rect.top;

    if (event.key === "ArrowLeft") left -= pas;
    if (event.key === "ArrowRight") left += pas;
    if (event.key === "ArrowUp") top -= pas;
    if (event.key === "ArrowDown") top += pas;

    deplacerBouton(left, top);
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

      // Mutation -> sauvegarde -> actualisation (P5 ÉTAPE 6)
      sauvegarderTransactions();
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

        // Mutation -> sauvegarde -> actualisation (P5 ÉTAPE 6)
        sauvegarderTransactions();
      } else {
        // Index périmé : revenir au mode ajout sans erreur (aucune sauvegarde)
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
// NAVIGATION À CINQ ONGLETS (P5 ÉTAPE 2)
// =========================================

// Vues autorisées (doivent correspondre aux data-view dans index.html)
const VUES_AUTORISEES = [
  "accueil",
  "transactions",
  "statistiques",
  "epargne",
  "profil",
];

// Sélecteurs des sections et des boutons (structure P5-Étape1)
const SELECTEUR_VUES = ".vue[data-view]";
const SELECTEUR_ONGLETS = ".onglets-fixes .onglet";

// Afficher une vue parmi les cinq autorisées, masquer les quatre autres.
// - ne jamais retirer ni recréer les sections (elles restent connectées au DOM, isConnected préservé)
// - vérifier la présence des éléments DOM avant de les manipuler
// - refuser proprement un nom de vue inconnu (console.error, sans exception, sans rien masquer)
// - mettre à jour aria-current="page" sur les boutons de navigation
// - ne pas modifier les données, la logique métier, les validations P1/P2, les sécurités P3/P4
const afficherVue = (nomVue) => {
  // Nom de vue valide ?
  if (typeof nomVue !== "string" || !VUES_AUTORISEES.includes(nomVue)) {
    console.error(
      `[Kashmo] Vue inconnue : ${nomVue}. Vues autorisées : ${VUES_AUTORISEES.join(", ")}.`,
    );
    return;
  }

  // Sections existantes (présence + connexion). On ne recrée rien.
  const sections = document.querySelectorAll(SELECTEUR_VUES);

  // Localiser la vue demandée via data-view ; vérifier sa présence
  let vueCible = null;

  for (const section of sections) {
    if (
      elementPresent(section) &&
      section.getAttribute("data-view") === nomVue
    ) {
      vueCible = section;
      break;
    }
  }

  // Vue demandée absente ou déconnectée : ne rien masquer, ne rien modifier, signaler
  if (!elementPresent(vueCible)) {
    console.error(
      `[Kashmo] Vue manquante ou déconnectée : ${nomVue}. Aucun changement de navigation.`,
    );
    return;
  }

  // Afficher la vue cible + masquer les quatre autres ; jamais retirer du DOM
  for (const section of sections) {
    if (!elementPresent(section)) {
      console.error(
        `[Kashmo] Section de vue manquante ou déconnectée : ${
          section.getAttribute("data-view") ?? "?"
        }.`,
      );
      continue;
    }

    const estCible = section === vueCible;
    section.hidden = !estCible;
  }

  // Mettre à jour aria-current="page" sur les boutons (vérifier la présence)
  const boutons = document.querySelectorAll(SELECTEUR_ONGLETS);

  for (const bouton of boutons) {
    if (!elementPresent(bouton)) {
      continue;
    }

    if (bouton.getAttribute("data-view") === nomVue) {
      bouton.setAttribute("aria-current", "page");
    } else {
      bouton.removeAttribute("aria-current");
    }
  }
};

// Enregistrer les cinq écouteurs de navigation (boutons vérifiés présents + connectés)
const boutonsNavigation = document.querySelectorAll(SELECTEUR_ONGLETS);

for (const bouton of boutonsNavigation) {
  if (!elementPresent(bouton)) {
    continue;
  }

  bouton.addEventListener("click", (event) => {
    // Pas de rechargement ; navigation immédiate
    event.preventDefault();

    // Re-vérifier la cible au déclenchement ; nom issu de data-view
    if (!elementPresent(bouton)) {
      return;
    }

    afficherVue(bouton.getAttribute("data-view"));
  });
}

// =========================================
// INITIALISATION DE L'APPLICATION
// =========================================

// P5 ÉTAPE 6 : restaurer les transactions persistées UNE SEULE FOIS,
// AVANT le premier affichage. (localStorage lu ici, `transactions` rempli.)
chargerTransactions();

// Vue par défaut : Accueil + synchronisation visuelle/ARIA
afficherVue("accueil");

// Puis rendu normal P4 (non modifié)
actualiserApplication();
