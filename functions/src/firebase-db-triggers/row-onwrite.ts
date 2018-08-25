import * as functions from 'firebase-functions';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';
import { nowAsString } from '../helpers/now-as-string';
import { cleanTechData } from '../helpers/clean-english-pattern';

export const row_onwrite = async (
    change: functions.Change<functions.database.DataSnapshot>, 
    context: functions.EventContext
) : Promise<any> => {

    // Se la scrittura ha provocato la cancellazione della riga, esco
    // Questo evento non dovrebbe verificarsi nel normale flusso di lavoro
    // ma si verifica quando cancello a mano qualcosa dal db
    if (!change.after.exists()) {
        return;
    }

    // Uso i segment del path del db per ricavarne la stringa
    // hashata flat
    const full_hash : string = [ 
        context.params.seg_1, 
        context.params.seg_2,
    ].join("-");

    // Carico le info sull'episodio
    const tv_show : SimplyResultRow = new SimplyResultRow(change.after.val());
    
    // Ignoro questo episodio se è stato scartato per qualche ragione
    // - Per vedere il perchè, consultare il campo discarded_reason
    if (tv_show.discarded) {
        return
    }

    // Evito di rinotificare due volte un episodio
    const notification_registry = await db.ref("notified/" + full_hash ).once('value');
    if (notification_registry.exists()) {
        return;
    } 

    // Idem, in questo caso è una notifica in coda non ancora spedita
    const queued_notification_registry = await db.ref("to_notify/" + full_hash ).once('value');
    if (queued_notification_registry.exists()) {
        return;
    } 

    // Verifico se riconosco un pattern inglese, e scarto l'episodio se è in inglese
    const tech_data_cleaned = cleanTechData(tv_show.tech_data);
    const known_as_english = await db.ref(`english_patterns/${tech_data_cleaned}`).once('value');
    if (known_as_english.exists()) {
        await change.after.ref.update({ discard_reason : "E' in inglese"});
        return;
    }

    // Solo a questo punto sono libero di metterlo in coda come da notificare
    const date_to_set : string = nowAsString();
    await db.ref("to_notify/" + full_hash).set(date_to_set);
    return;
}