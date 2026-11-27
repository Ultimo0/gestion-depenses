// =========================================
// UTILITAIRES DE SÉCURITÉ DOM (rendu)
// =========================================

// Un noeud DOM existe-t-il (non-null) ?
const noeudPresent = (noeud) => {
  return noeud !== null && noeud !== undefined;
};

// Un élément DOM cible existe-t-il ET reste-t-il connecté au document ?
const cibleRenduPresente = (element) => {
  return noeudPresent(element) && element.isConnected !== false;
};

// Signaler proprement un problème de rendu DOM, sans exception non maîtrisée
const signalerRendu = (message) => {
  console.error(`[Kashmo] Rendu transactions : ${message}`);
};

// Créer un noeud DOM et vérifier qu'il est bien instancié
const creerNoeud = (tag) => {
  const noeud = document.createElement(tag);

  if (!noeudPresent(noeud)) {
    signalerRendu(`document.createElement("${tag}") n'a pas renvoyé de noeud.`);
    return null;
  }

  return noeud;
};

// Ajouter un enfant seulement si parent et enfant existent ; jamais d'exception
const ajouterEnfant = (parent, enfant) => {
  if (!noeudPresent(parent)) {
    signalerRendu("appendChild annulé : parent absent.");
    return;
  }

  if (!noeudPresent(enfant)) {
    signalerRendu("appendChild annulé : enfant absent.");
    return;
  }

  parent.appendChild(enfant);
};

// =========================================
// AFFICHER LES TRANSACTIONS
// =========================================

// Afficher les transactions
// Signature conservée :
// (liste, transactions, obtenirGroupeDate, formaterMontant,
//  iconesCategories, onModifier, onSupprimer)
export const afficherTransactions = (
  liste,
  transactions,
  obtenirGroupeDate,
  formaterMontant,
  iconesCategories,
  onModifier,
  onSupprimer,
) => {
  // Cible de rendu `#liste-transactions` : vérifier présence + connexion avant manipulation
  if (!cibleRenduPresente(liste)) {
    signalerRendu("cible de rendu manquante : liste-transactions (#liste-transactions). Rendu annulé proprement.");
    return;
  }

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

  // Parcourir les groupes de transactions
  for (const [groupeDate, transactionsDuJour] of groupes) {
    // Créer le conteneur du titre
    const elementTitre = creerNoeud("li");

    if (!noeudPresent(elementTitre)) {
      continue;
    }

    // Créer le titre du groupe
    const titreGroupe = creerNoeud("h3");

    if (noeudPresent(titreGroupe)) {
      titreGroupe.textContent = groupeDate;
      titreGroupe.classList.add("transaction-date-groupe");

      // Organiser le titre
      ajouterEnfant(elementTitre, titreGroupe);
    }

    // Ajouter le titre du groupe à la liste (vérifier que `liste` reste connectée)
    if (cibleRenduPresente(liste)) {
      liste.appendChild(elementTitre);
    } else {
      signalerRendu("appendChild annulé : #liste-transactions déconnectée.");
      return;
    }

    // Parcourir les transactions de ce groupe
    for (const elementGroupe of transactionsDuJour) {
      const transaction = elementGroupe.transaction;

      // Récupérer l'index de la transaction
      const index = elementGroupe.index;

      // Créer l'élément HTML de la transaction
      const element = creerNoeud("li");

      if (!noeudPresent(element)) {
        continue;
      }

      element.classList.add("transaction-item");

      // Créer les boutons d'action
      const actions = creerNoeud("div");

      if (noeudPresent(actions)) {
        actions.classList.add("transaction-actions");
      }

      const boutonModifier = creerNoeud("button");

      if (noeudPresent(boutonModifier)) {
        boutonModifier.classList.add("transaction-modifier");
        boutonModifier.setAttribute("aria-label", "Modifier la transaction");
        boutonModifier.title = "Modifier";

        // Créer le bouton de modification avec son icône SVG originale
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

        // Déclencher la modification
        boutonModifier.addEventListener("click", () => {
          onModifier(transaction, index);
        });
      }

      const boutonSupprimer = creerNoeud("button");

      if (noeudPresent(boutonSupprimer)) {
        boutonSupprimer.classList.add("transaction-supprimer");
        boutonSupprimer.setAttribute("aria-label", "Supprimer la transaction");
        boutonSupprimer.title = "Supprimer";

        // Créer le bouton de suppression avec son icône SVG originale
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

        // Déclencher la suppression
        boutonSupprimer.addEventListener("click", () => {
          onSupprimer(index);
        });
      }

      // Identifier le type de transaction
      if (transaction.type === "revenu") {
        element.classList.add("revenu");
      } else {
        element.classList.add("depense");
      }

      // Créer l'icône de la transaction
      const icone = creerNoeud("div");

      if (noeudPresent(icone)) {
        icone.classList.add("transaction-icone");

        // Choisir l'icône selon la catégorie
        icone.innerHTML =
          iconesCategories[transaction.categorie] || iconesCategories.Autres;
      }

      // Créer les informations de la transaction
      const informations = creerNoeud("div");

      if (noeudPresent(informations)) {
        informations.classList.add("transaction-informations");
      }

      const description = creerNoeud("span");

      if (noeudPresent(description)) {
        description.classList.add("transaction-description");
        description.textContent = transaction.description;
      }

      // Créer les détails de la transaction
      const details = creerNoeud("div");

      if (noeudPresent(details)) {
        details.classList.add("transaction-details");
      }

      // Afficher le type
      const texteType = creerNoeud("span");

      if (noeudPresent(texteType)) {
        texteType.textContent =
          transaction.type === "revenu" ? "Revenu" : "Dépense";

        texteType.classList.add("transaction-type");
      }

      // Afficher la catégorie
      const categorie = creerNoeud("span");

      if (noeudPresent(categorie)) {
        categorie.classList.add("transaction-categorie");

        categorie.textContent = transaction.categorie || "Non catégorisée";
      }

      // Organiser les détails
      ajouterEnfant(details, texteType);
      ajouterEnfant(details, categorie);

      // Ajouter les informations
      ajouterEnfant(informations, description);
      ajouterEnfant(informations, details);

      // Créer le montant
      const montant = creerNoeud("span");

      if (noeudPresent(montant)) {
        montant.classList.add("transaction-montant");

        const signe = transaction.type === "revenu" ? "+" : "−";

        montant.textContent = `${signe}${formaterMontant(Math.abs(transaction.montant))}`;
      }

      // Assembler la transaction
      ajouterEnfant(element, icone);
      ajouterEnfant(element, informations);
      ajouterEnfant(element, montant);

      // Regrouper les boutons d'action
      ajouterEnfant(actions, boutonModifier);
      ajouterEnfant(actions, boutonSupprimer);

      // Ajouter les actions à la transaction
      ajouterEnfant(element, actions);

      // Ajouter la transaction à la liste (vérifier que `liste` reste connectée)
      if (cibleRenduPresente(liste)) {
        liste.appendChild(element);
      } else {
        signalerRendu("appendChild annulé : #liste-transactions déconnectée.");
        return;
      }
    }
  }
};
