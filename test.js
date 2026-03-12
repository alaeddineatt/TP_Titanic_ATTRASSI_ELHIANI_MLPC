lr_start_transaction("T01_GITLAB_PUMA_CHECK");
lr_output_message("Début de la Transaction T01_GITLAB_PUMA_CHECK");

p0 = atoi(lr_eval_string("{action_cable_active_connections_puma_0}"));
p1 = atoi(lr_eval_string("{action_cable_active_connections_puma_1}"));
p2 = atoi(lr_eval_string("{action_cable_active_connections_puma_2}"));
p3 = atoi(lr_eval_string("{action_cable_active_connections_puma_3}"));

totale = p0 + p1 + p2 + p3;
status = LR_PASS;

lr_output_message("Valeurs extraites : %d, %d, %d, %d", p0, p1, p2, p3);
lr_output_message("Totale des valeurs extraites : %d", totale);

if (p0 >= 50 || p1 >= 50 || p2 >= 50 || p3 >= 50) {
    lr_error_message("Transaction KO : une valeur > 50");
    status = LR_FAIL;
}

if (totale >= 200) {
    lr_error_message("Transaction KO : total >= 200");
    status = LR_FAIL;
}

lr_end_transaction("T01_GITLAB_PUMA_CHECK", status);

duration = lr_get_transaction_duration("T01_GITLAB_PUMA_CHECK");
lr_output_message("Durée de la transaction T01_GITLAB_PUMA_CHECK = %f secondes", duration);
