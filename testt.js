// Génère la liste des mois
var allMonths = [];
for (var i = 0; i <= 12; i++) {
  allMonths.push(i);
}

// Fonction pour générer aléatoirement une valeur ou une liste
function randomPeriode() {
  var singleOrList = Math.random() < 0.5;
  if (singleOrList) {
    // Retourne une valeur unique
    var value = allMonths[Math.floor(Math.random() * allMonths.length)];
    return value;
  } else {
    // Retourne une sous-liste
    var nb = Math.floor(Math.random() * 12) + 1;
    // Mélanger
    var monthsCopy = allMonths.slice();
    monthsCopy.sort(function() { return 0.5 - Math.random(); });
    var list = monthsCopy.slice(0, nb);
    return list;
  }
}

// Génération et stockage dans contexte NeoLoad
var periodes_case = randomPeriode();

if (Array.isArray(periodes_case)) {
  var taille = periodes_case.length;
  logger.debug("Le paramètre est une liste : " + JSON.stringify(periodes_case) + ", taille = " + taille);
  // Stock la liste en variable NeoLoad (conversion en chaîne)
  context.variableManager.setValue("periodes_case", periodes_case.join(','));
  context.variableManager.setValue("periodes_case_taille", String(taille));
} else {
  var taille = 1;
  logger.debug("Le paramètre est une valeur unique : " + periodes_case);
  context.variableManager.setValue("periodes_case", String(periodes_case));
  context.variableManager.setValue("periodes_case_taille", String(taille));
}

// Utilisation dans le script NeoLoad :
// ${periodes_case} pour la valeur/liste, ${periodes_case_taille} pour la taille
