import * as functions from 'firebase-functions';
import * as _ from 'lodash';

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
        // console.log(`${full_hash} cancellato`);
        return;
    }

    const tv_show           : SimplyResultRow = new SimplyResultRow(change.after.val());
    const title_cleaned     : string          = cleanString(tv_show.title);
    const tech_data_cleaned : string          = cleanString(tv_show.tech_data);

    if (tv_show.discarded) {
        // console.log(`${full_hash} - ${title_cleaned} scartato: ${tv_show.discard_reason}`);
        return
    }

    const notification_registry = await db.ref("notified/" + full_hash ).once('value');
    if (notification_registry.exists()) {
        // console.log(`${full_hash} già notificato`);
        return;
    } 

    const queued_notification_registry = await db.ref("to_notify/" + full_hash ).once('value');
    if (queued_notification_registry.exists()) {
        // console.log(`${full_hash} già in coda da notificare`);
        return;
    } 


    // Verifico se riconosco un pattern inglese
    const known_as_english = await db.ref(`english_patterns/${tech_data_cleaned}`).once('value');
    if (known_as_english.exists()) {
        await change.after.ref.update({ discard_reason : "E' in inglese"});
        return;
    }

    // Verifico se è una delle serie tv che si è deciso di ignorare
    const show_already_banned = await db.ref(`banned_shows/${title_cleaned}`).once('value');
    if (show_already_banned.exists()) {
        await change.after.ref.update({ discard_reason : "Serie TV ignorata"});
        return;
    }

    // Solo a questo punto sono libero di metterlo in coda come da notificare
    const date_to_set : string = nowAsString();
    // console.log ("Segno da notificare", full_hash)
    await db.ref("to_notify/" + full_hash).set(date_to_set);
    return;
}