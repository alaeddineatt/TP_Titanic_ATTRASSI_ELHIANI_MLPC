Description fonctionnelle	Valeur nominale	Représentation conseillée
Connexions WebSockets ouvertes	Varie selon l'usage	Jauge temporelle
Volume des notifications diffusées	Compteur croissant	Taux (rate())
Notifications en attente d'envoi	0 (Alerte si > 0)	Jauge temporelle
Réplicas de base de données disponibles	Selon topologie	Jauge temporelle
Requêtes en attente de connexion DB	0 (Alerte si > 0)	Jauge temporelle
Volume d'appels au stockage Git	Compteur croissant	Taux (rate())
Requêtes bloquées (Rate Limiting)	0 ou très faible	Taux (rate())
Authentifications réussies	Compteur croissant	Taux (rate())
Requêtes absentes du cache Redis	Compteur croissant	Taux (rate())
Erreurs de connexion Redis	0 (Alerte si > 0)	Taux (rate())
Volume d'exécution de requêtes SQL	Compteur croissant	Taux (rate())
Volume global de requêtes Web HTTP	Compteur croissant	Taux (rate())
Processus Web de traitement occupés	Varie selon la charge	Jauge temporelle
Requêtes HTTP en file d'attente	0 (Alerte si > 0)	Jauge temporelle
Temps d'exécution du Garbage Collector	Compteur croissant	Taux (rate())
Mémoire vive (RAM) consommée	Varie selon l'usage	Jauge temporelle



/* Fonction générique de traitement d'un groupe déjà capturé */
void process_metric_group(char *metricName,
                          char *paramKeys,
                          char *paramValues)
{
    int i;
    int keysCount, valsCount, loopCount;
    long totalSum = 0;
    long valNum = 0;

    char evalBuf[256];
    char cleanKey[128];
    char *rawKey = NULL;
    char *valStr = NULL;
    char saveName[128];

    /* Comptage des occurrences */
    keysCount = lr_paramarr_len(paramKeys);
    valsCount = lr_paramarr_len(paramValues);
    loopCount = (keysCount < valsCount) ? keysCount : valsCount;

    lr_output_message("DEBUG [%s] : clés=%d | valeurs=%d | loop=%d",
                      metricName, keysCount, valsCount, loopCount);

    if (loopCount == 0) {
        lr_error_message("ERREUR: aucune paire clé/valeur trouvée pour %s", metricName);
        return;
    }

    /* Boucle sur les paires */
    for (i = 1; i <= loopCount; i++) {

        /* clé */
        sprintf(evalBuf, "{%s_%d}", paramKeys, i);
        rawKey = lr_eval_string(evalBuf);

        /* valeur */
        sprintf(evalBuf, "{%s_%d}", paramValues, i);
        valStr = lr_eval_string(evalBuf);

        /* nettoyage clé éventuel */
        cleanKey[0] = '\0';
        if (rawKey && rawKey[0] != '\0') {
            int len = (int)strlen(rawKey);
            if (len >= 3) {
                int copyLen = len - 2;
                if (copyLen > (int)sizeof(cleanKey) - 1) {
                    copyLen = (int)sizeof(cleanKey) - 1;
                }
                strncpy(cleanKey, rawKey + 1, copyLen);
                cleanKey[copyLen] = '\0';
            } else {
                strncpy(cleanKey, rawKey, sizeof(cleanKey) - 1);
                cleanKey[sizeof(cleanKey) - 1] = '\0';
            }
        }

        /* conversion valeur */
        valNum = 0;
        if (valStr && valStr[0] != '\0') {
            valNum = atol(valStr);
            totalSum += valNum;
        }

        lr_output_message("DEBUG [%s] #%d : rawKey=%s | cleanKey=%s | valStr=%s | valNum=%ld",
                          metricName,
                          i,
                          rawKey ? rawKey : "(null)",
                          cleanKey[0] ? cleanKey : "(empty)",
                          valStr ? valStr : "(null)",
                          valNum);
    }

    /* sauvegarde de la somme */
    sprintf(saveName, "sum_%s", metricName);
    lr_save_int((int)totalSum, saveName);

    lr_output_message("RESULTAT %s : somme totale = %ld (stockée dans {%s})",
                      metricName, totalSum, saveName);
    
    
}
