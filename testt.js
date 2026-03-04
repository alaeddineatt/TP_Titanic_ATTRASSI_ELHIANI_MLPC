// ===============================
// Déclarations globales
// ===============================
long tab_auth[100];      // tableau de long
int index_auth = 0;      // position actuelle
long seuil_delta = 50;   // seuil d'alerte (modifiable)


// ===============================
// Action()
// ===============================
Action()
{
    int i;
    long valeur;
    long delta;

    // Boucle de 10 itérations (modifiable)
    for (i = 0; i < 10; i++)
    {
        lr_output_message("---- Iteration %d ----", i + 1);

        // Extraction
        web_reg_save_param_ex(
            "ParamName=total_auth_ppl",
            "LB=total_auth_ppl=",
            "RB=;",
            LAST);

        web_url("ma_requete",
            "URL=http://monserveur/app",
            "Resource=0",
            LAST);

        // Conversion en long
        valeur = atol(lr_eval_string("{total_auth_ppl}"));

        // Stockage
        tab_auth[index_auth] = valeur;
        lr_output_message("Stockage : tab_auth[%d] = %ld", index_auth, valeur);

        // Comparaison si ce n'est pas la première valeur
        if (index_auth > 0)
        {
            delta = tab_auth[index_auth] - tab_auth[index_auth - 1];

            lr_output_message("Delta entre iteration %d et %d = %ld",
                              index_auth - 1, index_auth, delta);

            // ===============================
            // GESTION DE TOUS LES CAS
            // ===============================

            // 1. Variation trop forte (positive ou négative)
            if (labs(delta) > seuil_delta)
            {
                lr_error_message("⚠️ ALERTE : variation anormale détectée ! Delta = %ld (> %ld)",
                                 delta, seuil_delta);
            }

            // 2. Cas delta positif (hausse)
            if (delta > 0)
            {
                lr_output_message("Hausse détectée : +%ld", delta);

                if (delta > seuil_delta)
                {
                    lr_error_message("⚠️ ALERTE : hausse anormale ! Delta = %ld", delta);
                }
            }

            // 3. Cas delta négatif (baisse)
            if (delta < 0)
            {
                lr_output_message("Baisse détectée : %ld", delta);

                if (labs(delta) > seuil_delta)
                {
                    lr_error_message("⚠️ ALERTE : baisse anormale ! Delta = %ld", delta);
                }
            }

            // 4. Cas delta nul
            if (delta == 0)
            {
                lr_output_message("Aucune variation détectée (delta = 0)");
            }
        }

        index_auth++;

        // Pause de 10 minutes
        lr_output_message("Pause de 10 minutes...");
        lr_think_time(600);
    }

    // Affichage final du tableau
    lr_output_message("=== Valeurs stockées ===");
    for (i = 0; i < index_auth; i++) {
        lr_output_message("tab_auth[%d] = %ld", i, tab_auth[i]);
    }

    return 0;
}
