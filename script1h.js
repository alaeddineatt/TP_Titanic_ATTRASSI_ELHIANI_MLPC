Je veux que tu m'explique la logique derrière ce script VUGEN et les variables utilisées, ensuite genere un fichier js qui pourra gérer l'ensembles des variables l'idée c'est de transcrire ce script vugen en du neoload.
Voilà le script en question : 

"Action()
{
	/* Calcul des temps EPOCH à partir de l'heure d'exécution */
	long epoch_now;
	long epoch_past;
	char epoch_now_str[20];
	char epoch_past_str[20];
	
	// Temps EPOCH a l'instant de l'exécution
	epoch_now = time(NULL);
	
	// Calcul du temps dans le passé 
	// 1 heure 
	epoch_past = epoch_now - 3600;
	// 1 jour 
	//epoch_past = epoch_now - (24*3600);
	// 30 jours
	// epoch_past = epoch_now - (30*24*3600);
	
	/* Sauvegarde des temps générés dans des variables Vugen */
	sprintf(epoch_now_str,"%ld",epoch_now);
	sprintf(epoch_past_str,"%ld",epoch_past);

	lr_save_string(epoch_now_str,"TO_EPOCH");
	lr_save_string(epoch_past_str,"FROM_EPOCH");
	
	web_cache_cleanup();
	web_cleanup_cookies();
	web_set_max_html_param_len("9999999");
	web_set_sockets_option("SSL_VERSION", "AUTO");
	// Encodage du mot de passe du T0000037 - à refaire proprement :)
	lr_save_string(lr_decrypt("69ef0d89a540fe6fc6cbde7d6ced366586659432184f4643ab1bb9b02aa8520bbb803323eb8280fa2fdcb22f29bbaef66382db50b8c73f54ec920af0cf"),"PassT37");
	
	web_set_user("T0000037",lr_eval_string("{PassT37}"),"{ODL_HOST}:{ODL_PORT}");
	
	/* Parameters expected: ODL_HOST, ODL_PORT, ODL_USER, ODL_PASS */
	// Récupération des token d'authentification API BVD 
	lr_start_transaction("ODL_IdM_Login");

	web_reg_save_param_json(
		"ParamName=ODL_TOKEN",
		"QueryString=$.token.id",
		"NotFound=error",
		LAST);
		
	web_reg_save_param_json(
		"ParamName=ODL_REFRESH",
		"QueryString=$.refreshToken",
		"NotFound=warning",
		LAST);
	
	lr_save_string(lr_decrypt("69ef0dca279577fa87dca9415c6a4c"),"PassTestUser");
		
	web_add_header("Content-Type", "application/json");

	web_custom_request("POST_IdM_Token",
		"URL=https://{ODL_HOST}:{ODL_PORT}/idm-service/v3.0/tokens?auth=database",
		"Method=POST",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t1.inf", 
		"Body={\"passwordCredentials\":{\"username\":\"test_user\",\"password\":\"{PassTestUser}\"},\"tenantName\":\"Provider\"}",
		LAST);
	
	if (strlen(lr_eval_string("{ODL_TOKEN}")) < 20) {
		lr_end_transaction("ODL_IdM_Login", LR_FAIL);
		lr_error_message("IdM did not return a token");
		return -1;
	}
	
	lr_end_transaction("ODL_IdM_Login", LR_PASS);
	
	lr_think_time(05);
	// Récupération du dataset relatif à la table à explorer dans Vertica
	lr_start_transaction("ODL_GET_DataSetMetadata");
	
	// raw = opsb_synthetic_trans - Données disponibles : https://docs.microfocus.com/doc/115/25.3/opsb_synthetic_trans
	// 1h (données agrégées) = opsb_synthetic_trans_1h - Données disponibles : https://docs.microfocus.com/doc/115/25.3/opsb_synthetic_trans_1h
	// 1d (données agrégées) = opsb_synthetic_trans_1d - Données disponibles : https://docs.microfocus.com/doc/115/25.3/opsb_synthetic_trans_1d
	// Locations : cmdb_entity_relation_location_ci_latest
	/* Grab the id of the dataset named 'opsb_synthetic_trans' */
	web_reg_save_param_regexp(
		"ParamName=DATASET_RAWDATA",
		"RegExp=\"id\":\"(\\d+)\"[^}]*\"name\":\"opsb_synthetic_trans\"",
		"Ordinal=1",
		LAST);
	
	web_reg_save_param_regexp(
		"ParamName=DATASET_SYNTH1H",
		"RegExp=\"id\":\"(\\d+)\"[^}]*\"name\":\"opsb_synthetic_trans_1h\"",
		"Ordinal=1",
		LAST);
	
	web_reg_save_param_regexp(
		"ParamName=DATASET_SYNTH1D",
		"RegExp=\"id\":\"(\\d+)\"[^}]*\"name\":\"opsb_synthetic_trans_1d\"",
		"Ordinal=1",
		LAST);

	web_reg_save_param_regexp(
		"ParamName=DATASET_LOCATIONS",
		"RegExp=\"id\":\"(\\d+)\"[^}]*\"name\":\"cmdb_entity_relation_location_ci_latest\"",
		"Ordinal=1",
		LAST);	
	
	web_add_auto_header("X-Auth-Token", lr_eval_string("{ODL_TOKEN}"));

	web_add_header("Accept", "application/json");

	web_url("GET_DataSetMetadata",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSetMetadata",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t2.inf", 		
		LAST);
	
	lr_output_message("Resolved dataset id = %s",lr_eval_string("{DATASET_ID}"));	
	
	lr_end_transaction("ODL_GET_DataSetMetadata", LR_AUTO);
	
	lr_think_time(05);
	
	// Récupération des métriques en fonction de la table utilisée précédemment 
	// Filtres utilisés : 
	// filter\=txn_name+eq+{TRANS_NAME} = Filtre par le nom de la transaction (ex. : 02_HomePage)
	// filter\=application_name+eq+{APP_NAME} = Filtre par le nom de l'application (ex. : 4YOU)
	// filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH} = Filtre pour l'intervale de temps utilisé (de {FROM_EPOCH} à {TO_EPOCH}, généré en début de script)
	// filter\=location_name+eq+{LOC_NAME} = Filtre par le nom de la sonde dans BVD (ex. : W5864444)
	// filter\=status_id+eq+0 = Filtre pour le statut de la transaction. 0 = OK / 1 = KO / 2 = Timeout (outlier) / 6 = Erreur script. Possibles combinaisons de codes 
	// Champs retournés 
	// Par défaut (sans critère "fields") = Toutes les données disponibles dans la table
	// Sinon = Seulement les données caractérisées dans le domaine "fields" est retourné (ex. : fields\=timestamp_utc_s,application_name,location_name,txn_name,status_id,txn_availability_status,txn_response_time_ms)
	// Selon les tables utilisées, la liste des champs disponible est dans la documentation fournie plus haut 
	
	lr_start_transaction("ODL_GET_SyntheticTransRAW");
	// Données brutes 

	web_add_header("Accept", "application/json");
       
	// W586285_NTSIEGE_HQ_THALES
	// Récupère les informations pour l'intervale de temps défini pour une transaction d'un script depuis une sonde 
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_RAWDATA}?filter\=txn_name+eq+{TRANS_NAME}&filter\=application_name+eq+{APP_NAME}&filter\=location_name+eq+{LOC_NAME}&filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH}&fields\=timestamp_utc_s,application_name,location_name,txn_name,status_id,txn_availability_status,txn_response_time_ms&start=1",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t4.inf", 	
		LAST);	
	
	web_reg_find("Text=application_name","SaveCount=Nb_Application",LAST);
	// Récupère les informations pour l'intervale de temps défini pour une transaction depuis une sonde / Tous les scripts concernés 
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_RAWDATA}?filter\=txn_name+eq+{TRANS_NAME}&filter\=location_name+eq+{LOC_NAME}&filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH}&fields\=timestamp_utc_s,application_name,location_name,txn_name,status_id,txn_availability_status,txn_description,txn_response_time_ms&start=1",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t5.inf", 	
		LAST);	
	
	web_reg_find("Text=application_name","SaveCount=Nb_Application",LAST);
	// Récupère les informations pour l'intervale de temps défini depuis une sonde / Tous les scripts concernés, toutes les transactions concernées 
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_RAWDATA}?filter\=location_name+eq+{LOC_NAME}&filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH}&start=1",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t6.inf", 	
		LAST);		

	web_reg_find("Text=application_name","SaveCount=Nb_Application",LAST);
	// Récupère les informations pour l'intervale de temps défini depuis une sonde / Tous les scripts concernés, toutes les transactions concernées - seulement celles qui sont OK
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_RAWDATA}?&filter\=status_id+eq+0&filter\=location_name+eq+{LOC_NAME}&filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH}&start=1",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t6.inf", 	
		LAST);	
	
	lr_end_transaction("ODL_GET_SyntheticTransRAW", LR_AUTO);
	
	lr_think_time(05);
	
	lr_start_transaction("ODL_GET_SyntheticTrans1H");
	// Récupère les informations agrégées (1 heure) pour l'intervale de temps défini pour une transaction d'une application
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_SYNTH1H}?filter\=txn_name+eq+{TRANS_NAME}&filter\=application_name+eq+{APP_NAME}&filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH}&fields\=timestamp_utc_s,application_name,location_name,txn_name,status_id,txn_availability_status_avg,txn_response_time_ms_avg,location_cmdb_global_id&start=1&count=10000",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t8.inf", 	
		LAST);	
	
	lr_end_transaction("ODL_GET_SyntheticTrans1H", LR_AUTO);
	
	lr_think_time(05);
	
	lr_start_transaction("ODL_GET_SyntheticTrans1D");
	// Récupère les informations agrégées (1 jour) pour l'intervale de temps défini pour une transaction d'une application
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_SYNTH1D}?filter\=txn_name+eq+{TRANS_NAME}&filter\=application_name+eq+{APP_NAME}&filter\=timestamp_utc_s+gt+{FROM_EPOCH}&filter\=timestamp_utc_s+lt+{TO_EPOCH}&fields\=timestamp_utc_s,application_name,location_name,txn_name,status_id,txn_availability_status_avg,txn_response_time_ms_avg,location_cmdb_global_id&start=1&count=10000",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t8.inf", 	
		LAST);		
	
	lr_end_transaction("ODL_GET_SyntheticTrans1D", LR_AUTO);	
	
	lr_think_time(05);
	
	lr_start_transaction("ODL_GET_Locations");
	// Récupère les informations concernant les localisations de BVD - Vide pour l'instant, à voir avec les PS	
	web_custom_request("GET_SyntheticTrans",
		"URL=https://{ODL_HOST}:{ODL_PORT}/itom-data-ingestion-store/urest/v2/dataSet/{DATASET_LOCATIONS}?&start=1",
		"Method=GET",
		"Resource=0",
		"RecContentType=application/json",
		"Snapshot=t7.inf", 	
		LAST);	
	
	lr_end_transaction("ODL_GET_Locations", LR_AUTO);		
	
	return 0;
}
"
