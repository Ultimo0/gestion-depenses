// =========================================
// STATISTIQUES (P5 ÉTAPE 7) — calculs purs, sans effet de bord
// =========================================
//
// Source unique : `transactions` (js/data/transactions.js).
// Ne mute JAMAIS les transactions. Ne crée pas de second tableau persistant.
// `montant` : number fini ; revenu -> >0 ; dépense -> <0 ; dépenses = Math.abs(montant<0).
// `categorie` : `transaction.categorie || "Non catégorisée"`. `date` : Date valide (sinon exclu).
// `montant` invalide / `montant===0` / `type` invalide / `date` invalide -> exclu.

// Filtres autorisés
export const FILTRES_PERIODE = [
  "ce-mois",
  "mois-precedent",
  "cette-annee",
  "toute-periode",
];

// Libellé catégorie vide
const CATEGORIE_INCONNUE = "Non catégorisée";

// Objet (non null, non tableau) ?
const estObjet = (valeur) => {
  return valeur !== null && typeof valeur === "object" && !Array.isArray(valeur);
};

// Date valide ? (ne pas fabriquer une date)
export const estDateValide = (valeur) => {
  if (valeur === undefined || valeur === null) {
    return false;
  }

  const date = new Date(valeur);

  return !Number.isNaN(date.getTime());
};

// Une transaction est-elle exploitable pour les statistiques ?
export const transactionValide = (transaction) => {
  if (!estObjet(transaction)) {
    return false;
  }

  if (typeof transaction.montant !== "number" || !Number.isFinite(transaction.montant)) {
    return false;
  }

  if (transaction.montant === 0) {
    return false;
  }

  if (transaction.type !== "revenu" && transaction.type !== "depense") {
    return false;
  }

  // Cohérence signe / type (ne pas recalculer silencieusement une donnée corrompue)
  if (transaction.type === "revenu" && !(transaction.montant > 0)) {
    return false;
  }

  if (transaction.type === "depense" && !(transaction.montant < 0)) {
    return false;
  }

  if (!estDateValide(transaction.date)) {
    return false;
  }

  return true;
};

// Catégorie d'affichage
export const categorieAffichage = (transaction) => {
  const categorie = transaction && transaction.categorie;

  if (typeof categorie === "string" && categorie.trim() !== "") {
    return categorie;
  }

  return CATEGORIE_INCONNUE;
};

// =========================================
// PÉRIODES
// =========================================

// Premier jour du mois `now`, heure 00:00 locale
const debutMois = (date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);

// Bornes d'une période : { start, end } ; `start` inclus, `end` exclus ; `null` = ouvert.
export const bornerPeriode = (periode, now = new Date()) => {
  const reference = estDateValide(now) ? new Date(now) : new Date();

  if (periode === "ce-mois") {
    const start = debutMois(reference);
    const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end };
  }

  if (periode === "mois-precedent") {
    const end = debutMois(reference); // 1er du mois actuel exclu
    const start = new Date(reference.getFullYear(), reference.getMonth() - 1, 1, 0, 0, 0, 0);
    return { start, end };
  }

  if (periode === "cette-annee") {
    const start = new Date(reference.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(reference.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
    return { start, end };
  }

  // `toute-periode` (défaut) : toutes les transactions valides
  return { start: null, end: null };
};

// Une transaction est-elle dans la période (start inclus, end exclus, dates locales) ?
export const dansPeriode = (transaction, periode, now = new Date()) => {
  const { start, end } = bornerPeriode(periode, now);

  if (!estDateValide(transaction.date)) {
    return false;
  }

  const t = new Date(transaction.date).getTime();

  if (start !== null && t < start.getTime()) {
    return false;
  }

  if (end !== null && t >= end.getTime()) {
    return false;
  }

  return true;
};

// Transactions valides ET dans la période (pas de mutation, pas de double comptage)
export const transactionsFiltrees = (transactions, periode, now = new Date()) => {
  if (!Array.isArray(transactions)) {
    return [];
  }

  return transactions.filter(
    (transaction) =>
      transactionValide(transaction) && dansPeriode(transaction, periode, now),
  );
};

// =========================================
// TOTAUX
// =========================================

// Totaux pour une période (le solde actuel global N'EST PAS ici ; voir calculerSolde / `soldeActuel`)
export const calculerTotaux = (transactions, periode, now = new Date()) => {
  const filtrees = transactionsFiltrees(transactions, periode, now);

  let revenus = 0;
  let depenses = 0;
  let nbRevenus = 0;
  let nbDepenses = 0;

  for (const transaction of filtrees) {
    if (transaction.montant > 0) {
      revenus += transaction.montant; // revenu
      nbRevenus += 1;
    } else {
      depenses += Math.abs(transaction.montant); // dépense
      nbDepenses += 1;
    }
  }

  return {
    revenus,
    depenses,
    soldePeriode: revenus - depenses, // résultat financier de la période (≠ solde actuel global)
    nbTransactions: filtrees.length,
    nbRevenus,
    nbDepenses,
  };
};

// =========================================
// RÉPARTITION DES DÉPENSES PAR CATÉGORIE
// =========================================

export const repartitionDepensesParCategorie = (transactions, periode, now = new Date()) => {
  const filtrees = transactionsFiltrees(transactions, periode, now);
  const parCategorie = new Map();

  for (const transaction of filtrees) {
    if (transaction.montant >= 0) {
      continue; // seules les dépenses (montant < 0)
    }

    const categorie = categorieAffichage(transaction);
    const montant = Math.abs(transaction.montant);

    parCategorie.set(categorie, (parCategorie.get(categorie) || 0) + montant);
  }

  let total = 0;

  for (const montant of parCategorie.values()) {
    total += montant;
  }

  const liste = [];

  for (const [categorie, montant] of parCategorie) {
    liste.push({
      categorie,
      montant,
      pourcentage: total > 0 ? (montant / total) * 100 : 0,
    });
  }

  // Tri décroissant par montant
  liste.sort((a, b) => b.montant - a.montant);

  return { total, categories: liste };
};

// =========================================
// COMPARAISON REVENUS / DÉPENSES
// =========================================

export const comparaisonRevenusDepenses = (transactions, periode, now = new Date()) => {
  const totaux = calculerTotaux(transactions, periode, now);

  return {
    revenus: totaux.revenus,
    depenses: totaux.depenses,
    solde: totaux.soldePeriode,
    difference: totaux.revenus - totaux.depenses,
    ratio: totaux.depenses > 0 ? totaux.revenus / totaux.depenses : null,
  };
};

// =========================================
// ÉVOLUTION MENSUELLE
// =========================================

// Clé mois "YYYY-MM" (mois local 1-based)
export const cleMois = (valeur) => {
  const date = new Date(valeur);
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
};

// Regrouper par mois { "YYYY-MM": { revenus, depenses, solde, count } }
export const regrouperParMois = (transactions, periode, now = new Date()) => {
  const filtrees = transactionsFiltrees(transactions, periode, now);
  const parMois = new Map();

  for (const transaction of filtrees) {
    const cle = cleMois(transaction.date);

    if (!parMois.has(cle)) {
      parMois.set(cle, { revenus: 0, depenses: 0, solde: 0, count: 0 });
    }

    const bucket = parMois.get(cle);

    if (transaction.montant > 0) {
      bucket.revenus += transaction.montant;
      bucket.solde += transaction.montant;
    } else {
      bucket.depenses += Math.abs(transaction.montant);
      bucket.solde -= Math.abs(transaction.montant);
    }

    bucket.count += 1;
  }

  return parMois;
};

// Liste ordonnée des clés mois à afficher (mois sans transaction inclus, valeurs 0)
export const moisAvecValeurs = (transactions, periode, now = new Date()) => {
  const reference = estDateValide(now) ? new Date(now) : new Date();
  const liste = [];

  const pousserMois = (annee, mois) => {
    liste.push(`${annee}-${String(mois + 1).padStart(2, "0")}`);
  };

  if (periode === "ce-mois") {
    pousserMois(reference.getFullYear(), reference.getMonth());
  } else if (periode === "mois-precedent") {
    const d = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
    pousserMois(d.getFullYear(), d.getMonth());
  } else if (periode === "cette-annee") {
    for (let mois = 0; mois < 12; mois += 1) {
      pousserMois(reference.getFullYear(), mois);
    }
  } else {
    // `toute-periode` : du mois de la 1re transaction valide au mois actuel
    const valides = transactionsFiltrees(transactions, "toute-periode", reference);
    if (valides.length === 0) {
      return [];
    }

    let min = null;
    for (const transaction of valides) {
      const t = new Date(transaction.date).getTime();
      if (min === null || t < min) min = t;
    }

    let curseur = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1);
    const fin = debutMois(reference);

    // sécurité
    let garde = 0;
    while (curseur.getTime() <= fin.getTime() && garde < 6000) {
      pousserMois(curseur.getFullYear(), curseur.getMonth());
      curseur = new Date(curseur.getFullYear(), curseur.getMonth() + 1, 1);
      garde += 1;
    }
  }

  return liste;
};

// Évolution mensuelle complète : [{ mois, revenus, depenses, solde, count }], mois sans transaction => 0
export const evolutionMensuelle = (transactions, periode, now = new Date()) => {
  const parMois = regrouperParMois(transactions, periode, now);
  const mois = moisAvecValeurs(transactions, periode, now);

  return mois.map((cle) => {
    const bucket = parMois.get(cle) || { revenus: 0, depenses: 0, solde: 0, count: 0 };

    return {
      mois: cle,
      revenus: bucket.revenus,
      depenses: bucket.depenses,
      solde: bucket.solde,
      count: bucket.count,
    };
  });
};
