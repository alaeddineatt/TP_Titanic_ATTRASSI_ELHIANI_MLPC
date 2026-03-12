// ======================================================
// GLOBAL DECLARATIONS
// ======================================================

// Tableau pour stocker les valeurs extraites
double auth_values[100];

// Tableau pour stocker les temps de réponse
double response_times[100];

// Compteur d'itérations
int auth_index = 0;

// Valeur extraite
double current_value;

// Delta en pourcentage
double delta_pct;

// Temps de réponse
double exec_time;      // durée de la transaction principale
double wasted_time;    // wasted time
double wait_time;      // attente dynamique

// Seuils
double seuil_normal  = 60.0;
double seuil_critique = 120.0;

// Status
int status_main;
int status_resp;

// Somme des temps de réponse
double total_response_time = 0.0;


// ======================================================
// ACTION
// ======================================================

Action()
{
    int i;

    for (i = 0; i < 10; i++)
    {
        lr_output_message("===== ITERATION %d =====", i + 1);

        // ------------------------------------------------------
        // TRANSACTION PRINCIPALE : PUMA_CHECK
        // ------------------------------------------------------
        lr_start_transaction("PUMA_CHECK");
        status_main = LR_PASS;

        // Extraction de total_auth_ppl
        web_reg_save_param_ex(
            "ParamName=total_auth_ppl",
            "LB=total_auth_ppl=",
            "RB=;",
            LAST);

        web_url("PUMA_Request",
            "URL=http://example.com/puma",
            "Resource=0",
            LAST);

        // Conversion
        current_value = atof(lr_eval_string("{total_auth_ppl}"));
        lr_output_message("Valeur extraite = %.3f", current_value);

        // Calcul du delta %
        if (auth_index > 0)
        {
            double previous = auth_values[auth_index - 1];

            if (previous != 0)
            {
                delta_pct = ((current_value - previous) / previous) * 100.0;
                lr_output_message("Delta en pourcentage = %.2f %%", delta_pct);
            }
            else
            {
                lr_output_message("Delta impossible : valeur précédente = 0");
            }
        }
        else
        {
            lr_output_message("Première itération : pas de delta");
        }

        // Stockage de la valeur
        auth_values[auth_index] = current_value;

        // Fin de la transaction principale
        lr_end_transaction("PUMA_CHECK", status_main);


        // ------------------------------------------------------
        // RÉCUPÉRATION DES TEMPS
        // ------------------------------------------------------
        exec_time   = lr_get_transaction_duration("PUMA_CHECK");
        wasted_time = lr_get_transaction_wasted_time("PUMA_CHECK");

        lr_output_message("Execution time = %.3f sec", exec_time);
        lr_output_message("Wasted time    = %.3f sec", wasted_time);

        // Stockage du temps de réponse
        response_times[auth_index] = exec_time;

        // Ajout à la somme totale
        total_response_time += exec_time;


        // ------------------------------------------------------
        // ATTENTE DYNAMIQUE
        // ------------------------------------------------------
        wait_time = 60.0 - exec_time;
        if (wait_time < 0)
            wait_time = 0;

        lr_output_message("Attente dynamique = %.3f sec", wait_time);

        lr_think_time(wait_time);

        // Incrément de l'index
        auth_index++;
    }

    // ------------------------------------------------------
    // TRANSACTION D'ALERTE SUR LA SOMME DES TEMPS DE RÉPONSE
    // ------------------------------------------------------
    lr_start_transaction("PUMA_TOTAL_RESPONSE_ALERT");

    lr_output_message("Somme totale des temps de réponse = %.3f sec", total_response_time);

    if (total_response_time > seuil_critique)
    {
        lr_error_message("ALERTE CRITIQUE : somme des temps = %.2f sec", total_response_time);
        status_resp = LR_FAIL;
    }
    else if (total_response_time > seuil_normal)
    {
        lr_output_message("Temps total NORMAL : %.2f sec", total_response_time);
        status_resp = LR_PASS;
    }
    else
    {
        lr_output_message("Temps total OK : %.2f sec", total_response_time);
        status_resp = LR_PASS;
    }

    lr_end_transaction("PUMA_TOTAL_RESPONSE_ALERT", status_resp);


    // ------------------------------------------------------
    // AFFICHAGE FINAL DES VALEURS ET TEMPS DE RÉPONSE
    // ------------------------------------------------------
    lr_output_message("===== RÉCAPITULATIF FINAL =====");

    for (i = 0; i < auth_index; i++)
    {
        lr_output_message("Itération %d : valeur = %.3f | temps réponse = %.3f sec",
            i + 1,
            auth_values[i],
            response_times[i]
        );
    }

    return 0;
}
