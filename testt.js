// ===============================
// Déclarations globales
// ===============================
long tab_auth[100];   // tableau de long
int index_auth = 0;   // position actuelle dans le tableau
long seuil_delta = 50; // seuil d'alerte (modifiable)


// ===============================
// Action()
// ===============================
Action()
{
    int i;
    long valeur;
    long delta;

    // Boucle qui tourne 10 fois (modifiable)
    for (i = 0; i < 10; i++)
    {
        lr_output_message("---- Iteration %d ----", i + 1);

        // Extraction de la valeur
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

        // Stockage dans le tableau
        tab_auth[index_auth] = valeur;
        lr_output_message("Stockage : tab_auth[%d] = %ld", index_auth, valeur);

        // Comparaison avec la valeur précédente
        if (index_auth > 0)
        {
            delta = tab_auth[index_auth] - tab_auth[index_auth - 1];
            lr_output_message("Delta entre iteration %d et %d = %ld",
                              index_auth - 1, index_auth, delta);

            // Vérification du seuil
            if (labs(delta) > seuil_delta)
            {
                lr_error_message("⚠️ ALERTE : variation anormale détectée ! Delta = %ld (> %ld)",
                                 delta, seuil_delta);
            }
            else
            {
                lr_output_message("Variation normale (delta = %ld)", delta);
            }
        }

        index_auth++;

        // Pause de 10 minutes (600 secondes)
        lr_output_message("Pause de 10 minutes avant la prochaine iteration...");
        lr_think_time(600);
    }

    // Affichage final du tableau
    lr_output_message("=== Valeurs stockées dans tab_auth ===");
    for (i = 0; i < index_auth; i++) {
        lr_output_message("tab_auth[%d] = %ld", i, tab_auth[i]);
    }

    return 0;
}
