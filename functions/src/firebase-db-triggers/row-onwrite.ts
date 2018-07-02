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

    const tv_show : SimplyResultRow = new SimplyResultRow(change.after.val());

    if (tv_show.discarded) {
        // console.log(`${full_hash} scartato: ${tv_show.discard_reason}`);
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
        return (tv_show.tech_data.trim().toUpperCase() === pattern.trim().toUpperCase() );
    });

    if (english) {
        await change.after.ref.update({ discard_reason : "E' in inglese"});
        return;
    } 



    const banned_shows_ref = await db.ref('banned_shows').once('value');    
    const banned_shows_snap = banned_shows_ref.val();
    const show_is_banned : boolean = _.some(banned_shows_snap, (pattern) => {
        return (tv_show.title.trim().toUpperCase() === pattern);
    })
    if (show_is_banned) {
        await change.after.ref.update({ discard_reason : "Serie TV ignorata"});
        return;
    } 



    // Solo a questo punto sono libero di metterlo in coda come da notificare
    const date_to_set : string = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
    // console.log ("Segno da notificare", full_hash)
    await db.ref("to_notify/" + full_hash).set(date_to_set);
    return;
}