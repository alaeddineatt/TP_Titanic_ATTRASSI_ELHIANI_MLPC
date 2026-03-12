// ===============================
// Déclarations globales
// ===============================
long tab_auth[100];
int index_auth = 0;
long seuil_delta = 50;



if (p1 >= 50 || p2 >= 50 || p3 >= 50 || p4 >= 50) {
        lr_error_message("Une valeur PUMA dépasse 50 !");
        lr_end_transaction("TR_PUMA", LR_FAIL);
        return 0;
    }

    if (totale >= 200) {
        lr_error_message("La somme des PUMA dépasse 200 !");
        lr_end_transaction("TR_PUMA", LR_FAIL);
        return 0;
    }

    // Fin de transaction OK
    lr_end_transaction("TR_PUMA", LR_PASS);

    // Récupération de la durée
    duration = lr_get_transaction_duration("TR_PUMA");
    lr_output_message("Durée de la transaction TR_PUMA = %f secondes", duration);

// ===============================
// Action()
// ===============================
Action()
{
    int i;
    long valeur;
    long delta;

    for (i = 0; i < 10; i++)
    {
        lr_output_message("---- Iteration %d ----", i + 1);

        // ===============================
        // Début de transaction
        // ===============================
        lr_start_transaction("PUMA_CHECK");

        // Status par défaut : PASS
        int status = LR_PASS;

        // Extraction
        web_reg_save_param_ex(
            "ParamName=total_auth_ppl",
            "LB=total_auth_ppl=",
            "RB=;",
            LAST);

        web_url("PUMA_Request",
            "URL=http://monserveur/app",
            "Resource=0",
            LAST);

        // Conversion
        valeur = atol(lr_eval_string("{total_auth_ppl}"));
        tab_auth[index_auth] = valeur;

        lr_output_message("Valeur extraite = %ld", valeur);

        // ===============================
        // Calcul du delta
        // ===============================
        if (index_auth > 0)
        {
            long prev = tab_auth[index_auth - 1];
            delta = valeur - prev;

            lr_output_message("Delta brut = %ld", delta);

            // Conversion du delta en secondes
            double delta_seconds = (double)delta;
            lr_output_message("Delta en secondes = %.2f sec", delta_seconds);

            // ===============================
            // GESTION DE TOUS LES CAS
            // ===============================

            // Variation anormale
            if (labs(delta) > seuil_delta)
            {
                lr_error_message("ALERTE : variation anormale ! Delta = %ld", delta);
                status = LR_FAIL;
            }

            // Hausse
            if (delta > 0)
            {
                lr_output_message("Hausse détectée : +%ld", delta);
            }

            // Baisse
            if (delta < 0)
            {
                lr_output_message("Baisse détectée : %ld", delta);
            }

            // Delta nul
            if (delta == 0)
            {
                lr_output_message("Aucune variation détectée (delta = 0)");
            }
        }
        else
        {
            lr_output_message("Première valeur, pas de delta.");
        }

        index_auth++;

        // ===============================
        // Fin de transaction (UNE SEULE FOIS)
        // ===============================
        lr_end_transaction("PUMA_CHECK", status);

        // ===============================
        // Temps d'exécution réel
        // ===============================
        double exec_time = lr_get_transaction_duration("PUMA_CHECK");
        lr_output_message("Temps d'exécution de PUMA_CHECK = %.2f sec", exec_time);

        // ===============================
        // Temps d'attente dynamique
        // ===============================
        double attente = 60.0 - exec_time;
        if (attente < 0)
            attente = 0;

        lr_output_message("Temps d'attente dynamique = %.2f sec", attente);

        lr_think_time(attente);
    }

    return 0;
}
