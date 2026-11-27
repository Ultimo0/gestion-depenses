// Devises disponibles dans Kashmo
export const devisesDisponibles = {
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

// Devise utilisée par défaut et devise de secours
const DEVISE_PAR_DEFAUT = "XAF";

// Devise utilisée par défaut
export let deviseActuelle = DEVISE_PAR_DEFAUT;

// Vérifier qu'une devise existe réellement dans la liste
const deviseExiste = (devise) => {
  return (
    typeof devise === "string" &&
    Object.prototype.hasOwnProperty.call(devisesDisponibles, devise)
  );
};

// Modifier la devise actuelle ; devise inconnue ou invalide → secours XAF
export const definirDeviseActuelle = (devise) => {
  deviseActuelle = deviseExiste(devise) ? devise : DEVISE_PAR_DEFAUT;
};

// Récupérer le symbole de la devise actuelle ; secours XAF si devise inconnue
export const obtenirSymboleDevise = () => {
  const deviseSecours = devisesDisponibles[DEVISE_PAR_DEFAUT];

  // Devise inconnue, invalide ou absente : pas d'erreur, secours XAF
  if (!deviseExiste(deviseActuelle)) {
    return deviseSecours.symbole;
  }

  const devise = devisesDisponibles[deviseActuelle];

  return (devise && devise.symbole) || deviseSecours.symbole;
};

// Formater un montant selon la devise actuelle ; montant non fini → sécurisé
export const formaterMontant = (montant) => {
  // Montant non numérique ou non fini (NaN, ±Infinity, null, ...) : pas d'exception
  const montantValide = Number.isFinite(montant) ? montant : 0;

  return `${montantValide.toLocaleString("fr-FR")} ${obtenirSymboleDevise()}`;
};
