Action()
{
    /* déclarations */
    int keysCount = 0;
    int valsCount = 0;
    int i = 0;
    int loopCount = 0;
    long totalSum = 0;
    char evalBuf[256];
    char *rawKey = NULL;
    char *valStr = NULL;
    char cleanKey[128];
    long valNum = 0;



    web_reg_save_param_regexp(
        "ParamName=Number_of_connected_users_keysParam",
        "RegExp=Number_of_connected_users(\\[[^\\]]+\\]|\\{[^}]+\\})\\s*[0-9]+",
        "Ordinal=All",
        "NotFound=warning",
        LAST);	

    web_reg_save_param_regexp(
        "ParamName=Number_of_connected_users_values",
        "RegExp=Number_of_connected_users(?:\\[[^\\]]+\\]|\\{[^}]+\\})\\s*([0-9]+)",
        "Ordinal=All",
        "NotFound=warning",
        LAST);

	
	/*APPEL POUR RECUPERER LES METRIQUES*/

	web_url("metrics", 
		"URL=https://mon-endpoint/-/metrics", 
		"TargetFrame=", 
		"Resource=1", 
		"RecContentType=text/plain", 
		"Referer=", 
		"Snapshot=t1.inf", 
		LAST);

    
    /* Comptage des captures */
    keysCount = lr_paramarr_len("Number_of_connected_users_keysParam");
    valsCount = lr_paramarr_len("Number_of_connected_users_values");
    
    lr_output_message("DEBUG: captures trouvées -> clés_brutes=%d  valeurs=%d", keysCount, valsCount);

    if (keysCount == 0 && valsCount == 0) {
        lr_error_message("ERREUR: aucune occurrence trouvée. Activez 'Data returned by server' et vérifiez la réponse.");
    }

    /* Itérer sur le plus petit des deux pour éviter débordement */
    loopCount = (keysCount < valsCount) ? keysCount : valsCount;
    totalSum = 0;
    
    for (i = 1; i <= loopCount; i++) {
        /* récupérer la clé brute {rawKeyParam_i} */
        snprintf(evalBuf, sizeof(evalBuf), "{Number_of_connected_users_keysParam_%d}", i);
        rawKey = lr_eval_string(evalBuf);

        /* récupérer la valeur {valParam_i} */
        snprintf(evalBuf, sizeof(evalBuf), "{Number_of_connected_users_values_%d}", i);
        valStr = lr_eval_string(evalBuf);

        /* Nettoyer la clé brute pour enlever [ ] ou { } */
        cleanKey[0] = '\0';
        if (rawKey && rawKey[0] != '\0') {
            int len = (int)strlen(rawKey);
            if (len >= 3) {
                /* copier sans le premier et le dernier caractère */
                int copyLen = len - 2;
                if (copyLen > (int)sizeof(cleanKey)-1) copyLen = (int)sizeof(cleanKey)-1;
                strncpy(cleanKey, rawKey + 1, copyLen);
                cleanKey[copyLen] = '\0';
            } else {
                /* cas improbable */
                strncpy(cleanKey, rawKey, sizeof(cleanKey)-1);
                cleanKey[sizeof(cleanKey)-1] = '\0';
            }
        }    

        /* Vérifications et conversion de la valeur */
        if (valStr && valStr[0] != '\0') {
            /* si nécessaire, nettoyer valStr des séparateurs (ex: 1,234) ici */
            valNum = atol(valStr);
            totalSum += valNum;

            /* Messages de debug clairs */
            lr_output_message("DEBUG PAIR %d : key_raw=%s  -> key_clean=%s  |  value_str=%s  |  value_num=%ld",
                              i,
                              rawKey ? rawKey : "(null)",
                              cleanKey[0] ? cleanKey : "(empty)",
                              valStr,
                              valNum);
        } else {
            lr_output_message("WARN PAIR %d : valeur manquante pour key_raw=%s", i, rawKey ? rawKey : "(null)");
        }
    }

    /* Sauvegarder et afficher la somme finale */
    lr_save_int((int)totalSum, "sum_of_connected");
    lr_output_message("RESULTAT: somme totale calculée = %ld", totalSum);

    /* Si mismatch entre counts, afficher un warning */
    if (keysCount != valsCount) {
        lr_output_message("WARNING: nombre de clés_brutes (%d) != nombre de valeurs (%d). Itération faite sur %d éléments.",
                          keysCount, valsCount, loopCount);
    }
	return 0;
}
