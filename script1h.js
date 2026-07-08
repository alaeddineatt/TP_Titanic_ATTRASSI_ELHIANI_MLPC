// Timestamp actuel (en secondes)
var epochNow = Math.floor(Date.now() / 1000);

// Timestamp passé (1 heure)
var epochPast = epochNow - 43200;

// Sauvegarde dans NeoLoad
context.variableManager.setValue("TO_EPOCH", epochNow.toString());
context.variableManager.setValue("FROM_EPOCH", epochPast.toString());
