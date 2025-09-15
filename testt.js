var allMonths = [];
for (var i = 1; i <= 12; i++) {
  allMonths.push(i);
}

function randomPeriodeSimple() {
  var isSingleValue = Math.random() < 0.5;

  if (isSingleValue) {
    // Valeur unique aléatoire parmi 1 à 12
    return allMonths[Math.floor(Math.random() * allMonths.length)];
  } else {
    // Liste de 4 valeurs distinctes
    var shuffled = allMonths.slice().sort(function() { return 0.5 - Math.random(); });
    return shuffled.slice(0, 4);
  }
}

// Exemple d'utilisation
var periodes_case = randomPeriodeSimple();

console.log(periodes_case);
