        if (exec_time > seuil_critique)
        {
            lr_error_message("🚨 CRITIQUE : temps d'exécution = %.2f sec", exec_time);
            status_resp = LR_FAIL;
        }
        else if (exec_time > seuil_warning)
        {
            lr_output_message("⚠ Temps d'exécution élevé = %.2f sec", exec_time);
            status_resp = LR_PASS;
        }
        else
        {
            lr_output_message("✔ Temps d'exécution OK = %.2f sec", exec_time);
            status_resp = LR_PASS;
        }

        lr_end_transaction("PUMA_EXECUTION_ALERT", status_resp);


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
    // AFFICHAGE FINAL DES VALEURS ET TEMPS DE RÉPONSE
    // ------------------------------------------------------
    lr_output_message("===== RÉCAPITULATIF FINAL =====");

    for (i = 0; i < auth_index; i++)
    {
        lr_output_message(
            "Itération %d : utilisateurs = %lld | temps réponse = %.3f sec",
            i + 1,
            auth_values[i],
            response_times[i]
        );
    }
Salut,
Je viens de déployer un nouveau script dans APPTEST.
J’ai mis en place un alerting immédiat sur le temps d’exécution : au‑delà de 60 s c’est déjà non conforme, et au‑delà de 120 s c’est critique.
J’ai aussi ajouté un calcul d’attente dynamique basé sur 60 – temps d’exécution pour garder un rythme stable entre les itérations.

J’ai essayé de poser les premiers éléments de contrôle, mais si tu veux on peut regarder ça ensemble pour définir et intégrer les SLA directement dans ISaPP.
