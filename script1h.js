// Timestamp actuel (en secondes)
var epochNow = Math.floor(Date.now() / 1000);

// Timestamp passé (1 heure)
var epochPast = epochNow - 43200;

// Sauvegarde dans NeoLoad
context.variableManager.setValue("TO_EPOCH", epochNow.toString());

context.variableManager.setValue("FROM_EPOCH", epochPast.toString());

2026/07/08 15:53:54 INFO  - neoload.LG_INFO: Jetty ThreadPool configuration: MinThread=20; MaxThread=20000; IdleTimeoutMs=10000; QueueSize=6000 
2026/07/08 15:54:24 ERROR - neoload.Connection: Connection to Controller lost. Stop 
