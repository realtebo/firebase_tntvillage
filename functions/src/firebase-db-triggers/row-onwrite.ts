import * as functions from 'firebase-functions';
import * as _ from 'lodash';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';

export const row_onwrite = async (change: functions.Change<functions.database.DataSnapshot>, context: functions.EventContext) : Promise<any> => {

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

    const episode : SimplyResultRow = new SimplyResultRow(change.after.val());

    if (episode.discarded) {
        // console.log(`${full_hash} scartato: ${episode.discard_reason}`);
        return;
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

    const english_movies_ref = await db.ref('english_patterns').once('value');
    const english_movies_snap = english_movies_ref.val();

    // Si ferma e setta true al primo true che gli viene restituito
    const english : boolean = _.some(english_movies_snap, (pattern) => {
        return (episode.tech_data.includes(pattern));
    });

    if (english) {
        // console.log(`${full_hash} è stato scartato perché in inglese`);
        await change.after.ref.update({ discard_reason : "E' in inglese"});
        return;
    } 

    // Solo a questo punto sono libero di metterlo in coda come da notificare
    const date_to_set : string = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
    // console.log ("Segno da notificare", full_hash)
    await db.ref("to_notify/" + full_hash).set(date_to_set);
    return;
}