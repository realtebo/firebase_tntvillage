import * as functions from 'firebase-functions';
import * as _ from 'lodash';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';
import { nowAsString } from '../helpers/now-as-string';

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

    const tv_show       : SimplyResultRow = new SimplyResultRow(change.after.val());
    const title_cleaned : string          = tv_show.title.trim().toUpperCase();

    if (tv_show.discarded) {
        console.log(`${full_hash} scartato: ${tv_show.discard_reason}`);
        
        // Eseguo la migrazione al nuovo modello di flag
        
        // Quello vecchio era hash => titolo
        const old_banned_flag = await db.ref('banned_shows/' + title_cleaned).once('value');
        if (old_banned_flag.exists()) {
            old_banned_flag.remove();
        }

        // Il nuovo è titolo => data
        const show_already_banned = await db.ref(`banned_shows/${title_cleaned}`).once('value');
        if (!show_already_banned.exists()) {
            await db.ref(`banned_shows/${title_cleaned}`).set( nowAsString() );
        }
        return;
    }

    const notification_registry = await db.ref("notified/" + full_hash ).once('value');
    if (notification_registry.exists()) {
        console.log(`${full_hash} già notificato`);
        return;
    } 

    const queued_notification_registry = await db.ref("to_notify/" + full_hash ).once('value');
    if (queued_notification_registry.exists()) {
        console.log(`${full_hash} già in coda da notificare`);
        return;
    } 




    const english_movies_ref  = await db.ref('english_patterns').once('value');
    const english_movies_snap = english_movies_ref.val();

    // Si ferma e setta true al primo true che gli viene restituito
    let english : boolean = false;
    try {
        english = _.some(english_movies_snap, (pattern) => {
            return (tv_show.tech_data.trim().toUpperCase() === pattern.trim().toUpperCase() );
        });
    } catch (e) {
        console.warn ( 
            "_.some(english_movies_snap) ha generato " + e.message 
            + ", è di tipo " + (typeof english_movies_snap), 
            "dump", english_movies_snap
        );
    }

    if (english) {
        await change.after.ref.update({ discard_reason : "E' in inglese"});
        return;
    } 


    // Verifico se è una delle serie tv che si è deciso di ignorare
    const banned_shows_ref  = await db.ref('banned_shows').once('value');    
    const banned_shows_snap = banned_shows_ref.val();

    
    // _.some(collection, [callback=identity], [thisArg])
    // 
    // Checks if the callback returns a truey value for any element of a collection. 
    // The function returns as soon as it finds a passing value 
    // and does not iterate over the entire collection. 
    // The callback is bound to thisArg and invoked with three arguments; (value, index|key, collection).
    //
    // (boolean): Returns true if all elements passed the callback check, else false.

    const show_is_banned : boolean = _.some(banned_shows_snap, (value, key) : boolean=> {

        const value_cleaned = value.trim().toUpperCase();
        const key_cleaned   = key.trim().toUpperCase();

        // Confronto sia chiave che nome
        // dal 11.07.2018 infatti, uso i nomi degli show come chiavi
        // Perchè l'esito sia true,  il nome dello show non deve comparire ne in chiave ne in valore
        return (
            ( title_cleaned !== key_cleaned ) 
            &&
            ( title_cleaned !== value_cleaned ) 
        );
    })

    if (show_is_banned) {
        await change.after.ref.update({ discard_reason : "Serie TV ignorata"});
        return;
    } 



    // Solo a questo punto sono libero di metterlo in coda come da notificare
    const date_to_set : string = nowAsString();
    // console.log ("Segno da notificare", full_hash)
    await db.ref("to_notify/" + full_hash).set(date_to_set);
    return;
}