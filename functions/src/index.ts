import * as _ from 'lodash';
import * as functions from 'firebase-functions';
/*
import { database } from 'firebase-admin';

import * as TNT from './tntvillage';
import Storage from './storage';
import Db from './db';
*/
import * as network from './network-helpers';
/*
import Html from './html-helpers';
import * as Strings from './strings-helpers';

import PostData from './objects/post-data';
*/
import Response from './objects/response';
// import ResultRow from  './objects/result-row';
import {SimplyResultRow, json_fmt} from  './objects/result-row';
import axios  from 'axios';

import * as cheerio from 'cheerio';
import { db } from './app-helpers';

const BOT_TOKEN = "605738929:AAG572LSUSUzbVLB-s0ewIQ5LiYK7vTod-s";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/`;
const MIRKO = 315996772;
const RITA  = 108691956; 

const refresh = async () => {

    await sendToMirko("Refreshing v7");

    const snapshot = await db.ref('/refresh').once('value');
    if (snapshot.val() === true) {
        return sendToMirko("Sto già refreshando");
    }

    await db.ref('/refresh').set(true);


    const response : Response = await network.getPage(1, 29 );
    const $ : CheerioStatic   = cheerio.load(response.html);
    const rows : Cheerio      = $('DIV.showrelease_tb TABLE TR:not(:first-child)');

    rows.each( async (index :number, element: CheerioElement) : Promise<void> => {
        const magnet      : string = $(element).find("TD:nth-child(2) A").attr("href").trim();
        const title       : string = $(element).find("TD:nth-child(7) A").text().trim();
        const info        : string = $(element).find("TD:nth-child(7) ").clone().children().remove().end().text().trim();

        const json : json_fmt = {info, title, magnet};
        
        const hash : string = new SimplyResultRow(json).hash;

        await db.ref(`/rows/${hash}`).update(json);
    });

    await sendToMirko("Refreshed");

    await db.ref('/refresh').remove();
}
    
const english_movies : string[] = [
    "[XviD - Eng Ac3 - Sub Ita Eng]",
];

const sendNotification = async (message: string) : Promise<void> => {

    const reply_telegram = {
        "text"    : message,
        "chat_id" : MIRKO,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
    reply_telegram.chat_id = RITA;
    // await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
}

const sendToMirko = async (message: string) : Promise<void> => {
    const reply_telegram = {
        "text"    : message,
        "chat_id" : MIRKO,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
}

exports.callback = functions.https.onRequest( async (req, res) => {

    const body = req.body;

    // Messaggio diretto
    if (body.message) {
        // Richiesta di riscaricare la home di TNTVillage
        if (body.message.text === 'refresh') {
            // Lo accetto solo da Mirko
            if (body.message.from.id === MIRKO) {
                await sendToMirko("Ricevuto comando di refresh Da Mirko");
                await refresh();
            } else {
                await sendToMirko("Mittente non approvato: " + JSON.stringify(body.message.from) );    
            }
        } else {
            await sendToMirko("Comando sconosciuto: " + body.message.text);
        }
    } else {
        await sendToMirko("Non è un messaggio diretto: " + JSON.stringify(req.body));
    }

    res.send("ok");
    
});

exports.onRowChanged_v20 = functions.database.ref(`rows/{hash-segment-1}/{hash-segment-2}/{hash-segment-3}/{hash-segment-4}/{hash-segment-5}`)
    .onWrite ( async (change: functions.Change<functions.database.DataSnapshot>, context: functions.EventContext) : Promise<any> => {
        
        if (!change.after.exists()) return;

        const episode : SimplyResultRow = new SimplyResultRow(change.after.val());
        
        if (episode.notified  === true) return;

        // se trovo il valore cercato restituisco false, facendo uscire some
        const english : boolean = english_movies.some(english_movie => {
            return (episode.info.includes(english_movie));
        });
        if (english) {
            episode.discard_reason = "E' in inglese";
        } 

        if (episode.discarded === true) return;

        await sendNotification(episode.toString());
        episode.notified = true;
        await change.after.ref.update(episode.toJson());
        return;
    });

/*
exports.parseIndex_v7 = functions.https.onRequest( async (req, res) => {

    const v : string = "v25";

    try {
        const cache_path : string         = Strings.getCachePathFromQuery(1, 29);
        const html       : string         = await Storage.readFile(cache_path);
        const result     : TNT.ResultPage = Html.parse(html);

        await Db.saveGlobalStats({page_count: result.total_pages, release_count: result.total_releases });
        result.result_rows.forEach( async (item: ResultRow) : Promise<void> => {
            await Db.saveTorrentRow(item);
        })

        res.contentType('html').status(200).send( v );
    
    } catch(e) {

        res.contentType('html').status(200).send( `${v} - Errore durante il parse: -  ${e.toString()}` );
    }   
});
*/

/**
* API HTTP  per richiedere l'aggiornamento dell'indice
* Esempio: https://firebase.google.com/docs/functions/get-started
*/
/*
exports.refresh = functions.https.onRequest( async (req, res) => {

    const status_name  = Db.TREE.STATUS.KEYS.GET_PAGE_INDEX;
    const status_value = Db.TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX.REQUESTED;
    
    try {
        await Db.failIfStateExists(status_name)
        await Db.saveStatus(status_name, status_value);
        return res.status(200).send("Richiesta accettata");
    } catch ( error ) {
        return res.status(500).send(`Richiesta rifiutata, Errore non gestibile, ${error}`);
    }
});
*/

/**
* Quando ricevo il comando GET_PAGE_INDEX, 
*/

/*
exports.onRequestPageIndex = functions.database.ref(`${Db.TREE.STATUS.ROOT}/${Db.TREE.STATUS.KEYS.GET_PAGE_INDEX}`)
    .onCreate( async (snapshot) => {
        
        const status_name   = Db.TREE.STATUS.KEYS.GET_PAGE_INDEX;
        const status_values = Db.TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX;

        if (snapshot.val() !== status_values.REQUESTED) {
            return;
        }

        try {
            await Db.saveStatus(status_name, status_values.UPDATING_QUEUE);
            await Db.enqueue(Db.TREE.QUEUES.KEYS.FORCE_DONWLOAD, new PostData(1, TNT.CATEGORIES.TV_SHOW));
            await Db.deleteStatusName(status_name);
        } catch (reason) {
            console.warn(reason);
        }

    });

*/

/**
* Gestisce la coda FORCE_DOWNLOAD
* Scarica una pagina cancellandone la precedente cache se esistente
*/
/*
exports.onForceDownload_v19 = functions.database.ref(`${Db.TREE.QUEUES.ROOT}/${Db.TREE.QUEUES.KEYS.FORCE_DONWLOAD}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {
        
        const item_data : PostData     = snapshot.val();
        const { page_number, category} = item_data;
        const item_ref                 = snapshot.ref;

        try {
            const new_ref = await Db.moveQueuedItem(item_ref, `${Db.TREE.QUEUES.KEYS.DOWNLOADING}`);
            await Storage.deleteCacheFileIfExists(page_number, category);

            // Non passato dalla stato DOWNLOADABLE, perchè la scarico a forza, e comunque
            // so già che NON ho in cache la pagina
            const response : Response = await getPage(page_number, category );
            if ( response.status !== 200) {
                return;
            }
            await Storage.saveAsPageCache (response.html, response.cache_file_path);
            await Db.moveQueuedItem(new_ref, `${Db.TREE.QUEUES.KEYS.TO_PARSE}`);

        } catch (reason) {
            console.warn("onForceDownload other error ", reason);
        }
        
    });
*/

/**
* Gestisce la coda FORCE_DOWNLOAD
* Scarica una pagina cancellandone la precedente cache se esistente
*/
/*
exports.onDownload_v3 = functions.database.ref(`${Db.TREE.QUEUES.ROOT}/${Db.TREE.QUEUES.KEYS.DONWLOAD}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {
        
        const { page_number, category} = snapshot.val();
        const item_ref                 = snapshot.ref;

        try {

            const new_ref = await Db.moveQueuedItem(item_ref, `${Db.TREE.QUEUES.KEYS.DONWLOADABLE}`);
            const already_cached : boolean = await Storage.cacheFileExists(page_number, category)

            if (!already_cached) { 
                const response : Response = await getPage(page_number, category );
                if (response.status !== 200) {
                    return;
                }
                await Storage.saveAsPageCache (response.html, response.cache_file_path);
            }
            await Db.moveQueuedItem(new_ref, `${Db.TREE.QUEUES.KEYS.TO_PARSE}`);
            
        } catch (reason) {
            console.warn("onDownload catched error", reason);
        }
        
    });

/**
* Gestisce la coda TO_PARSE
* Legge il contenuto di file e lo parsa
*/    
/*
exports.onToParse_24 = functions.database.ref(`${Db.TREE.QUEUES.ROOT}/${Db.TREE.QUEUES.KEYS.TO_PARSE}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {

        const { page_number, category}  = snapshot.val();
        const post_data : PostData      = new PostData (page_number, category);
        const cache_path : string       = post_data.cache_file_path;

        try {

            const new_ref : database.Reference = await Db.moveQueuedItem(snapshot.ref, `${Db.TREE.QUEUES.KEYS.PARSING}`);
            const html    : string             = await Storage.readFile(cache_path);
            const result  : TNT.ResultPage     = Html.parse(html);

            await Db.saveGlobalStats({page_count: result.total_pages, release_count: result.total_releases });
            // await Db.saveGlobalStats({page_count: 2, release_count: 3 });
            result.result_rows.forEach( async (item: ResultRow) : Promise<void> => {
                await Db.saveTorrentRow(item);
            })
            await Db.deleteQueuedItem(new_ref);

        } catch (reason) {
            console.warn("onToParse error ", reason.toString());
        }

    });



// Se vengo a sapere che il numero di release è cambiato, setto lo stato GET_PAGE_INDEX.REQUESTED;
// rigenero la coda di download (non forzato)
exports.onReleaseCountChange_v8 = functions.database.ref(`${Db.TREE.STATISTICS.ROOT}/${Db.TREE.STATISTICS.KEYS.WEB_RELEASES}`)
.onWrite ( async (
    change: functions.Change<functions.database.DataSnapshot>, 
    // context: functions.EventContext
) : Promise<any> => {

    let before : number;
    let after : number;
    if (!change.after.exists()) {
        return;
    }

    if (!change.before.exists) {
        before = 0;
    } else {
        before = change.before.val();
    }

    after = Math.max(change.after.val(), before+1);
    console.log('before', before, 'after', after);

    if  (after >= before ) {
        console.log(`changed releases from ${before} to ${after} `);
        try {
            const total_pages : number = await Db.getPageCount();
            console.log(`actual page count ${total_pages}`);
            for (let p : number = 2; p <=total_pages; p++) {
                console.log('enqueue page', p, 'di', total_pages)
                await Db.enqueue(Db.TREE.QUEUES.KEYS.DONWLOAD, new PostData(p, TNT.CATEGORIES.TV_SHOW));
            }
        } catch (reason) {
            console.warn('pnRelease count change catched ', reason);
        }
    } else {
        return; 
    }
});


*/
