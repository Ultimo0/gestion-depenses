// =========================================
// PAGE STATISTIQUES (P5 ÉTAPE 7) — rendu SVG natif, sans dépendance
// =========================================
//
// `transactions` : source unique. `formaterMontant` : service devises existant.
// `#view-statistiques` : vérifier présence + connexion avant manipulation.

import {
  calculerTotaux,
  repartitionDepensesParCategorie,
  comparaisonRevenusDepenses,
  evolutionMensuelle,
  FILTRES_PERIODE,
} from "../data/stats.js";

// Étiquettes filtres
const LIBELLES_FILTRES = {
  "ce-mois": "Ce mois",
  "mois-precedent": "Mois précédent",
  "cette-annee": "Cette année",
  "toute-periode": "Toute la période",
};

// Couleurs Kashmo
const COULEURS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#64748b",
  "#0b1730",
];

const ACCENT = "#2563eb";
const REVENU = "#16a34a";
const DEPENSE = "#dc2626";

// Période active (état UI local, pas de persistance, pas de second store)
let periodeActive = "ce-mois";

// Élément présent + connecté ?
const elementPresent = (element) => {
  return element !== null && element !== undefined && element.isConnected !== false;
};

// Échapper le HTML
const echapper = (texte) => {
  return String(texte === null || texte === undefined ? "" : texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// =========================================
// GRAPHIQUES SVG NATIFS
// =========================================

// Graphique circulaire / en anneau : dépenses par catégorie
const svgCamembert = (repartition, formaterMontant) => {
  const { total, categories } = repartition;

  if (categories.length === 0 || total <= 0) {
    return `<svg class="stat-svg" viewBox="0 0 100 100" role="img" aria-label="Répartition des dépenses par catégorie : aucune donnée"><title>Aucune dépense sur la période</title><circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="14"/><text x="50" y="54" text-anchor="middle" font-size="10" fill="#64748b">Aucune dépense</text></svg>`;
  }

  const rayon = 40;
  const circonference = 2 * Math.PI * rayon;
  let decalage = 0;
  let arcs = "";

  for (let i = 0; i < categories.length; i += 1) {
    const c = categories[i];
    const longueur = (c.pourcentage / 100) * circonference;
    const couleur = COULEURS[i % COULEURS.length];

    arcs += `<circle cx="50" cy="50" r="${rayon}" fill="none" stroke="${couleur}" stroke-width="14" stroke-dasharray="${longueur} ${circonference - longueur}" stroke-dashoffset="${-decalage}" transform="rotate(-90 50 50)"><title>${echapper(c.categorie)} : ${echapper(formaterMontant(c.montant))} (${c.pourcentage.toFixed(1)}%)</title></circle>`;

    decalage += longueur;
  }

  // Légende SVG
  let legende = `<g font-size="5" fill="#0f172a">`;
  const parPage = categories.slice(0, 8);

  for (let i = 0; i < parPage.length; i += 1) {
    const c = parPage[i];
    const couleur = COULEURS[i % COULEURS.length];
    const y = 14 + i * 6;
    legende += `<rect x="108" y="${y - 4}" width="4" height="4" rx="1" fill="${couleur}"/><text x="115" y="${y}">${echapper(c.categorie)}</text>`;
  }

  legende += `</g>`;

  return `<svg class="stat-svg" viewBox="0 0 160 100" role="img" aria-label="Répartition des dépenses par catégorie, total ${echapper(formaterMontant(total))}"><title>Dépenses par catégorie</title><circle cx="50" cy="50" r="${rayon}" fill="none" stroke="#e2e8f0" stroke-width="14"/>${arcs}<text x="50" y="52" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">${echapper(formaterMontant(total))}</text>${legende}</svg>`;
};

// Graphique en barres : revenus / dépenses
const svgBarres = (comparaison, formaterMontant) => {
  const max = Math.max(comparaison.revenus, comparaison.depenses, 1);
  const hRev = (comparaison.revenus / max) * 70;
  const hDep = (comparaison.depenses / max) * 70;

  return `<svg class="stat-svg" viewBox="0 0 160 100" role="img" aria-label="Comparaison revenus ${echapper(formaterMontant(comparaison.revenus))} et dépenses ${echapper(formaterMontant(comparaison.depenses))}"><title>Revenus / dépenses</title>
    <line x1="10" y1="85" x2="150" y2="85" stroke="#e2e8f0" stroke-width="1"/>
    <rect x="35" y="${85 - hRev}" width="30" height="${hRev}" rx="3" fill="${REVENU}"><title>Revenus : ${echapper(formaterMontant(comparaison.revenus))}</title></rect>
    <rect x="95" y="${85 - hDep}" width="30" height="${hDep}" rx="3" fill="${DEPENSE}"><title>Dépenses : ${echapper(formaterMontant(comparaison.depenses))}</title></rect>
    <text x="50" y="98" text-anchor="middle" font-size="7" fill="#64748b">Revenus</text>
    <text x="110" y="98" text-anchor="middle" font-size="7" fill="#64748b">Dépenses</text>
    <text x="50" y="${85 - hRev - 3}" text-anchor="middle" font-size="6" fill="${REVENU}">${echapper(formaterMontant(comparaison.revenus))}</text>
    <text x="110" y="${85 - hDep - 3}" text-anchor="middle" font-size="6" fill="${DEPENSE}">${echapper(formaterMontant(comparaison.depenses))}</text>
  </svg>`;
};

// Graphique linéaire : évolution mensuelle
const svgLigne = (evolution, formaterMontant) => {
  // Absence totale de données : message explicite plutôt qu'une zone vide.
  // (`mois sans transaction` restent inclus avec des valeurs 0 ; ici on teste l'absence de TOUTE transaction.)
  const aucuneDonnee =
    !Array.isArray(evolution) ||
    evolution.length === 0 ||
    evolution.every(
      (m) =>
        (m.count === undefined ? (m.revenus || 0) + (m.depenses || 0) : m.count) === 0 &&
        !(m.revenus > 0) &&
        !(m.depenses > 0),
    );

  if (aucuneDonnee) {
    return `<svg class="stat-svg" viewBox="0 0 160 100" role="img" aria-label="Évolution mensuelle : aucune donnée"><title>Aucune donnée</title><text x="50" y="54" text-anchor="middle" font-size="9" fill="#64748b">Aucune donnée</text></svg>`;
  }

  const largeur = 160;
  const hauteur = 100;
  const marge = 12;
  const n = evolution.length;
  const valeurs = [];

  for (const m of evolution) {
    const rev = Number.isFinite(m.revenus) ? m.revenus : 0;
    const dep = Number.isFinite(m.depenses) ? m.depenses : 0;
    valeurs.push(rev, dep);
  }

  // Normalisation sûre : maximum numérique fini, jamais NaN/Infinity/0
  let maxV = 0;
  for (const v of valeurs) if (Number.isFinite(v) && v > maxV) maxV = v;
  if (!Number.isFinite(maxV) || maxV <= 0) maxV = 1;

  const plotW = largeur - 2 * marge;
  const plotH = hauteur - 2 * marge;

  // x constant au centre quand un seul mois ; sinon étalement
  const xPour = (i) => {
    if (n === 1) return marge + plotW / 2;
    return marge + (i / (n - 1)) * plotW;
  };

  const yPour = (valeur) => {
    const v = Number.isFinite(valeur) ? valeur : 0;
    const clamped = Math.min(Math.max(v, 0), maxV);
    return hauteur - marge - (clamped / maxV) * plotH;
  };

  const pointsRev = [];
  const pointsDep = [];
  let marqueursRev = "";
  let marqueursDep = "";

  for (let i = 0; i < n; i += 1) {
    const rev = Number.isFinite(evolution[i].revenus) ? evolution[i].revenus : 0;
    const dep = Number.isFinite(evolution[i].depenses) ? evolution[i].depenses : 0;
    const x = xPour(i);
    const yRev = yPour(rev);
    const yDep = yPour(dep);

    pointsRev.push(`${x.toFixed(1)},${yRev.toFixed(1)}`);
    pointsDep.push(`${x.toFixed(1)},${yDep.toFixed(1)}`);

    // marqueurs par point : indispensable si n===1 (un <polyline> à 1 point ne trace rien) + lisibilité
    marqueursRev += `<circle cx="${x.toFixed(1)}" cy="${yRev.toFixed(1)}" r="1.5" fill="${REVENU}"><title>${echapper(evolution[i].mois)} revenus ${echapper(formaterMontant(rev))}</title></circle>`;
    marqueursDep += `<circle cx="${x.toFixed(1)}" cy="${yDep.toFixed(1)}" r="1.5" fill="${DEPENSE}"><title>${echapper(evolution[i].mois)} dépenses ${echapper(formaterMontant(dep))}</title></circle>`;
  }

  // étiquettes mois (max ~6)
  let labels = "";
  const pas = Math.max(1, Math.ceil(n / 6));

  for (let i = 0; i < n; i += pas) {
    const x = xPour(i);
    labels += `<text x="${x.toFixed(1)}" y="${hauteur - 1}" text-anchor="middle" font-size="5" fill="#64748b">${echapper(evolution[i].mois)}</text>`;
  }

  const titre = evolution.map((m) => `${m.mois} : +${formaterMontant(Number.isFinite(m.revenus) ? m.revenus : 0)} / -${formaterMontant(Number.isFinite(m.depenses) ? m.depenses : 0)}`).join(" ; ");

  // <polyline> exige >= 2 points : ne tracer la ligne que si n >= 2 ; les marqueurs couvrent toujours chaque point
  const ligneRev = n >= 2 ? `<polyline points="${pointsRev.join(" ")}" fill="none" stroke="${REVENU}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : "";
  const ligneDep = n >= 2 ? `<polyline points="${pointsDep.join(" ")}" fill="none" stroke="${DEPENSE}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : "";

  return `<svg class="stat-svg" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Évolution mensuelle" width="100%" preserveAspectRatio="xMidYMid meet"><title>${echapper(titre)}</title>
    <line x1="${marge}" y1="${hauteur - marge}" x2="${largeur - marge}" y2="${hauteur - marge}" stroke="#e2e8f0" stroke-width="1"/>
    ${ligneRev}${marqueursRev}
    ${ligneDep}${marqueursDep}
    ${labels}
  </svg>`;
};

// =========================================
// RENDU DE LA VUE
// =========================================

export const afficherStatistiques = (element, transactions, options) => {
  if (!elementPresent(element)) {
    console.error("[Kashmo] Cible de rendu manquante : statistiques (#view-statistiques). Rendu annulé.");
    return;
  }

  const formaterMontant = options && options.formaterMontant ? options.formaterMontant : (x) => String(x);
  const calculerSolde = options && options.calculerSolde ? options.calculerSolde : () => 0;
  const periode = periodeActive;
  const liste = Array.isArray(transactions) ? transactions : [];
  const now = new Date();

  // ---- Solde actuel GLOBAL (indépendant du filtre) ----
  const soldeActuel = calculerSolde();

  // ---- Toutes les stats appliquent le même filtre ----
  const totaux = calculerTotaux(liste, periode, now);
  const repartition = repartitionDepensesParCategorie(liste, periode, now);
  const comparaison = comparaisonRevenusDepenses(liste, periode, now);
  const evolution = evolutionMensuelle(liste, periode, now);

  // ---- Boutons filtres ----
  let filtresHtml = `<div class="stat-filtres" role="group" aria-label="Période">`;

  for (const f of FILTRES_PERIODE) {
    const actif = f === periode;
    filtresHtml += `<button type="button" class="stat-filtre${actif ? " actif" : ""}" data-periode="${f}" aria-pressed="${actif ? "true" : "false"}">${echapper(LIBELLES_FILTRES[f] || f)}</button>`;
  }

  filtresHtml += `</div>`;

  // ---- Cartes chiffrées ----
  const carte = (label, valeur, classe) => `<div class="stat-carte ${classe || ""}"><span class="stat-carte-label">${echapper(label)}</span><span class="stat-carte-valeur">${echapper(valeur)}</span></div>`;

  let html = `
    <h2 id="titre-statistiques" class="titre-vue">Statistiques</h2>
    <div class="stat-cartes">
      ${carte("Solde actuel", formaterMontant(soldeActuel), "stat-carte-solde")}
      ${carte("Revenus", formaterMontant(totaux.revenus), "stat-carte-revenu")}
      ${carte("Dépenses", formaterMontant(totaux.depenses), "stat-carte-depense")}
      ${carte("Résultat période", formaterMontant(totaux.soldePeriode), "stat-carte-periode")}
    </div>
    ${filtresHtml}
    <div class="stat-graphiques">
      <article class="stat-graphique"><h3>Répartition des dépenses par catégorie</h3>${svgCamembert(repartition, formaterMontant)}</article>
      <article class="stat-graphique"><h3>Comparaison revenus / dépenses</h3>${svgBarres(comparaison, formaterMontant)}</article>
      <article class="stat-graphique stat-graphique-large"><h3>Évolution financière mensuelle</h3>${svgLigne(evolution, formaterMontant)}</article>
    </div>
  `;

  element.innerHTML = html;

  // ---- Écouteurs filtres (vérifier présence + connexion) ----
  const boutons = element.querySelectorAll(".stat-filtre");

  for (const bouton of boutons) {
    if (!elementPresent(bouton)) {
      continue;
    }

    bouton.addEventListener("click", () => {
      const p = bouton.getAttribute("data-periode");

      if (FILTRES_PERIODE.includes(p)) {
        periodeActive = p;
        afficherStatistiques(element, transactions, options);
      }
    });
  }
};
