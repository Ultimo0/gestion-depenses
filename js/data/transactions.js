// Liste principale des transactions
export const transactions = [];

// Index de la transaction actuellement modifiée
export let indexTransactionEnCours = null;

// Modifier l'index de la transaction en cours
export const definirIndexTransactionEnCours = (index) => {
  indexTransactionEnCours = index;
};

// =========================================
// PERSISTANCE localStorage (P5 ÉTAPE 6)
// =========================================

// Clé localStorage
const CLE_STOCKAGE = "kashmo.transactions";

// Vrai si un chargement a été déclaré invalide ou localStorage inaccessible :
// on bloque alors toute sauvegarde pour ne jamais écraser les données originales.
// (la source de vérité reste `transactions` ; pas de second tableau persistant)
let stockageBloque = false;

// Signaler une anomalie sans jamais planter
const signalerAnomalie = (message, ...details) => {
  console.error(`[Kashmo] ${message}`, ...details);
};

// Objet (non null, non tableau) ?
const estObjet = (valeur) => {
  return valeur !== null && typeof valeur === "object" && !Array.isArray(valeur);
};

// Une transaction est-elle valide ?
// description:string ; montant:number fini ≠0 ; type revenu/depense ;
// revenu->montant>0 ; depense->montant<0 ; categorie:string ; date valide.
const estTransactionValide = (transaction) => {
  if (!estObjet(transaction)) {
    return false;
  }

  if (typeof transaction.description !== "string") {
    return false;
  }

  if (
    typeof transaction.montant !== "number" ||
    !Number.isFinite(transaction.montant) ||
    transaction.montant === 0
  ) {
    return false;
  }

  if (transaction.type !== "revenu" && transaction.type !== "depense") {
    return false;
  }

  if (transaction.type === "revenu" && !(transaction.montant > 0)) {
    return false;
  }

  if (transaction.type === "depense" && !(transaction.montant < 0)) {
    return false;
  }

  if (typeof transaction.categorie !== "string") {
    return false;
  }

  if (transaction.date === undefined || transaction.date === null) {
    return false;
  }

  // Date valide (string ISO, timestamp, Date...) ; ne pas fabriquer une date
  const date = new Date(transaction.date);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return true;
};

// Reconstruire un objet transaction propre ; dates restaurées en objets Date
const normaliserTransaction = (transaction) => {
  return {
    description: transaction.description,
    montant: transaction.montant,
    type: transaction.type,
    categorie: transaction.categorie,
    date: new Date(transaction.date),
  };
};

// =========================================
// chargerTransactions()
// =========================================

// Charger les transactions depuis localStorage AVANT le premier affichage.
// - clé absente -> tableau vide, pas d'erreur
// - JSON invalide -> ne rien écraser, conserver l'original, `stockageBloque`, app en mémoire
// - racine non tableau -> idem
// - transactions invalides -> restaurer uniquement les valides en mémoire, `stockageBloque`, ne rien écraser
// - localStorage inaccessible -> ne pas planter, `stockageBloque`
// - `transactions` : `const`, jamais remplacer la référence ; `transactions.push(...)`
export const chargerTransactions = () => {
  stockageBloque = false;

  // 1. Lire la clé
  let brut;

  try {
    brut = window.localStorage.getItem(CLE_STOCKAGE);
  } catch (erreur) {
    stockageBloque = true;
    signalerAnomalie(
      `localStorage inaccessible (lecture). Les données ne seront pas sauvegardées. Clé ${CLE_STOCKAGE}.`,
      erreur,
    );
    return;
  }

  // 2. Clé absente / vide -> tableau vide (transactions déjà []), pas d'erreur
  if (brut === null || brut === undefined || brut === "") {
    return;
  }

  // 3. Analyser le JSON avec gestion d'erreur
  let donnees;

  try {
    donnees = JSON.parse(brut);
  } catch (erreur) {
    stockageBloque = true;
    signalerAnomalie(
      `JSON invalide pour ${CLE_STOCKAGE}. Données originales conservées, sauvegarde bloquée.`,
      erreur,
    );
    return;
  }

  // 4. Racine tableau ?
  if (!Array.isArray(donnees)) {
    stockageBloque = true;
    signalerAnomalie(
      `Racine non tableau pour ${CLE_STOCKAGE}. Données originales conservées, sauvegarde bloquée.`,
    );
    return;
  }

  // 5. Vérifier chaque transaction avant restauration
  let toutesValides = true;
  const valides = [];

  for (const item of donnees) {
    if (estTransactionValide(item)) {
      valides.push(normaliserTransaction(item));
    } else {
      toutesValides = false;
      signalerAnomalie(
        `Transaction invalide ignorée pour ${CLE_STOCKAGE}. Données originales conservées.`,
        item,
      );
    }
  }

  // Restaurer en mémoire sans remplacer la référence `transactions`
  for (const transaction of valides) {
    transactions.push(transaction);
  }

  // 6. Chargement déclaré invalide -> ne pas écraser ; bloquer toute sauvegarde ultérieure
  if (!toutesValides) {
    stockageBloque = true;
    signalerAnomalie(
      `Chargement partiellement invalide pour ${CLE_STOCKAGE}. Données originales conservées, sauvegarde bloquée.`,
    );
  }
};

// =========================================
// sauvegarderTransactions()
// =========================================

// Sauvegarder `transactions` en JSON (objets Date -> chaînes ISO automatiquement).
// - appelé APRÈS mutation réussie, avant actualiserApplication()
// - gestion d'erreur adaptée : localStorage inaccessible / quota dépassé / sérialisation -> ne pas planter
// - ne prétend JAMAIS que les données ont été sauvegardées en cas d'échec (renvoie false + console.error)
// - si un chargement a été déclaré invalide : aucune sauvegarde (préserver les données originales)
// - ne crée pas de second tableau source de vérité
export const sauvegarderTransactions = () => {
  // Chargement invalide non résolu : ne rien écrire
  if (stockageBloque) {
    signalerAnomalie(
      `Sauvegarde ignorée pour ${CLE_STOCKAGE} : chargement invalide non résolu, données originales préservées.`,
    );
    return false;
  }

  try {
    const serialise = JSON.stringify(transactions);
    window.localStorage.setItem(CLE_STOCKAGE, serialise);
    return true;
  } catch (erreur) {
    // localStorage inaccessible, quota dépassé, sérialisation... : conserver en mémoire, ne pas planter
    signalerAnomalie(
      `Échec de sauvegarde ${CLE_STOCKAGE} (accès/quota/sérialisation). Transactions conservées en mémoire, pas de sauvegarde confirmée.`,
      erreur,
    );
    return false;
  }
};
