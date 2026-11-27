// Déterminer le jour d'une transaction
export const obtenirGroupeDate = (dateTransaction) => {
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
