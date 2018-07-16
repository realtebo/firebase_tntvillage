import * as functions from 'firebase-functions';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';
import { nowAsString } from '../helpers/now-as-string';
import { cleanString } from '../helpers/clean-string';

export const row_onwrite = async (
    change: functions.Change<functions.database.DataSnapshot>, 
    context: functions.EventContext
) : Promise<any> => {

    const full_hash : string = [ 
        context.params.seg_1, 
        context.params.seg_2,
        context.params.seg_3,
        context.params.seg_4,
        context.params.seg_5,
    ].join("-");

    if (!change.after.exists()) {
        return;
    }

    const tv_show           : SimplyResultRow = new SimplyResultRow(change.after.val());
    const tech_data_cleaned : string          = cleanString(tv_show.tech_data);

    if (tv_show.discarded) {
        return
    }

    const notification_registry = await db.ref("notified/" + full_hash ).once('value');
    if (notification_registry.exists()) {
        return;
    } 

    const queued_notification_registry = await db.ref("to_notify/" + full_hash ).once('value');
    if (queued_notification_registry.exists()) {
        return;
    } 


    // Verifico se riconosco un pattern inglese
    const known_as_english = await db.ref(`english_patterns/${tech_data_cleaned}`).once('value');
    if (known_as_english.exists()) {
        await change.after.ref.update({ discard_reason : "E' in inglese"});
        return;
    }

    // Verifico se è una delle serie tv che si è deciso di ignorare
    let title_cleaned  : string = cleanString(tv_show.title);
    // Sostituisco punto-spazio con spazio, altrimenti non posso usarlo come chiavo
    title_cleaned = title_cleaned.replace(". ", " ");
    const show_already_banned = await db.ref(`banned_shows/${title_cleaned}`).once('value');
    if (show_already_banned.exists()) {
        await change.after.ref.update({ discard_reason : "Serie TV ignorata"});
        return;
    }

    // Solo a questo punto sono libero di metterlo in coda come da notificare
    const date_to_set : string = nowAsString();
    await db.ref("to_notify/" + full_hash).set(date_to_set);
    return;
}