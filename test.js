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
