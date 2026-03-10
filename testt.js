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

        // ===============================
        // Début de transaction
        // ===============================
        lr_start_transaction("Check_total_auth_ppl");

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

        // Vérification extraction
        lr_output_message("Valeur extraite = [%s]", lr_eval_string("{total_auth_ppl}"));

        // Conversion en long
        valeur = atol(lr_eval_string("{total_auth_ppl}"));

        // Stockage dans le tableau
        tab_auth[index_auth] = valeur;
        lr_output_message("Stockage : tab_auth[%d] = %ld", index_auth, valeur);

        // ===============================
        // Comparaison si ce n'est pas la première valeur
        // ===============================
        if (index_auth > 0)
        {
            long prev = tab_auth[index_auth - 1];
            delta = valeur - prev;

            lr_output_message("Valeur précédente = %ld", prev);
            lr_output_message("Delta = %ld", delta);

            // ===============================
            // GESTION DE TOUS LES CAS
            // ===============================

            // 1. Variation trop forte (positive ou négative)
            if (labs(delta) > seuil_delta)
            {
                lr_error_message("⚠️ ALERTE : variation anormale détectée ! Delta = %ld (> %ld)",
                                 delta, seuil_delta);
                lr_end_transaction("Check_total_auth_ppl", LR_FAIL);
            }
            else
            {
                lr_output_message("Variation normale (delta = %ld)", delta);
                lr_end_transaction("Check_total_auth_ppl", LR_PASS);
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
        else
        {
            // Première valeur → pas de delta
            lr_output_message("Première valeur, pas de delta à calculer.");
            lr_end_transaction("Check_total_auth_ppl", LR_PASS);
        }

        index_auth++;

        // Pause de 10 minutes
        lr_output_message("Pause de 10 minutes...");
        lr_think_time(600);
    }

    // ===============================
    // Affichage final du tableau
    // ===============================
    lr_output_message("=== Valeurs stockées ===");
    for (i = 0; i < index_auth; i++) {
        lr_output_message("tab_auth[%d] = %ld", i, tab_auth[i]);
    }

    return 0;
}
