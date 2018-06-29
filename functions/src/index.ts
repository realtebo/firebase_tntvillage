import * as functions from 'firebase-functions';
import * as network from './network-helpers';
import * as _ from 'lodash';

import Response from './objects/response';
import {SimplyResultRow, json_fmt} from  './objects/result-row';
import axios, { AxiosError }  from 'axios';

import * as cheerio from 'cheerio';
import { db } from './app-helpers';

import * as util from 'util';
import * as uuidv5 from 'uuid/v5';

const BOT_TOKEN = "605738929:AAG572LSUSUzbVLB-s0ewIQ5LiYK7vTod-s";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/`;
const MIRKO = 315996772;
const RITA  = 108691956; 

const refresh = async () : Promise<boolean> => {

    const snapshot = await db.ref('refresh').once('value');
    if (snapshot.exists()) return false; 

    await db.ref('refresh').set(true);

    const response : Response = await network.getPage(1, 29 );
    const $ : CheerioStatic   = cheerio.load(response.html);
    const rows : Cheerio      = $('DIV.showrelease_tb TABLE TR:not(:first-child)');

    await rows.each( async (index :number, element: CheerioElement) : Promise<void> => {
        const magnet      : string = $(element).find("TD:nth-child(2) A").attr("href").trim();
        let title         : string = $(element).find("TD:nth-child(7) A").text().trim();
        let info          : string = $(element).find("TD:nth-child(7) ").clone().children().remove().end().text().trim();

        // Rimuovo numero di serie e numero di episodio (anche in range opzionale)
        const episodes    : string  = title.match(/s[0-9][0-9](-[0-9][0-9])?e[0-9][0-9](-[0-9][0-9])?/ig)[0].trim();
        title                       = title.replace(episodes, "").trim();

        // Separo le info tecniche dalle altre note
        const matches               = info.match(/\[[^\]]*\]/ig);  
        const tech_data   : string  = (matches ? matches[0] : "").trim();
        info                        = info.replace(tech_data, "").trim();

        const json : json_fmt = {info, title, magnet, episodes, tech_data};
        const row : SimplyResultRow = new SimplyResultRow(json);
        const hash : string = row.hash;

        // console.log ("Aggiorno ", hash);
        await db.ref(`rows/${hash}`).update(row.toJson());
    });
        
    await db.ref('refresh').remove();

    return true;
}
    
const sendNotificationForHash = async (hash : string) : Promise<void> => {

    const hash_path : string = hash.split("-").join("/");

    const episode = await db.ref(`rows/${hash_path}`).once('value');
    const row : SimplyResultRow = new SimplyResultRow(episode.val());

    // console.log (`sendNotificationForHash ${hash} - Notifica da inviare ${row.toString()}`);

    const keyboard = { "inline_keyboard" : [  
        [
         { "text": "E' in inglese",  "callback_data" :  `command=is_english&hash=${hash_path}`	},
         // { "text": "Ignora serie",  "callback_data" :  `command=ignore_show&hash=${hash_path}` },
         // { "text": "Ignora stagione",  "callback_data" :  `command=ignor_season&hash=${hash_path}` }
       ]
    ]};

    const reply_telegram = {
        "text"    : row.toString(),
        "chat_id" : MIRKO,
        "reply_markup" : keyboard,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
    reply_telegram.chat_id = RITA;
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
}

const sendToMirko = async (message: string) : Promise<void> => {
    const reply_telegram = {
        "text"    : message,
        "chat_id" : MIRKO,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram);
}

// Chiamato da https://cron-job.org/
exports.refresh = functions.https.onRequest( async (req, res) => {
    const result: boolean = await refresh();
    if (!result) {
        res.status(500).send("Errore nel refresh via cronjob");
        return;
    } else {
        res.status(200).send("Cronjob refresh ok");
    }
});

// Risponde agli eventi di Telegram
exports.callback = functions.https.onRequest( async (req, res) => {

    const body = req.body;

    // Messaggio diretto
    if (body.message) {
        // Richiesta di riscaricare la home di TNTVillage
        if (body.message.text === 'refresh') {
            // Lo accetto solo da Mirko
            if (body.message.from.id === MIRKO) {
                await sendToMirko("Ricevuto comando di refresh Da Mirko");
                const result: boolean = await refresh();
                if (!result) {
                    res.status(500).send("Errore nel refresh");
                    return;
                }
            } else {
                await sendToMirko("Mittente non approvato per questo comando: " + JSON.stringify(body.message.from) );    
            }
        } else {
            await sendToMirko("Comando sconosciuto: " + body.message.text);
        }
    // Messaggio diretto
    } else if (body.callback_query) {

        console.log(body.callback_query);

        const command =_.chain(req.body.callback_query.data)
            .split('&')                         // ["a=b454","c=dhjjh","f=g6hksdfjlksd"]
            .map(_.partial(_.split, _, '=', 2)) // [["a","b454"],["c","dhjjh"],["f","g6hksdfjlksd"]]
            .fromPairs()                        // {"a":"b454","c":"dhjjh","f":"g6hksdfjlksd"}
            .value();
        if (command.command === 'is_english') {
            await saveEnglishPattern(
                command.hash, 
                body.callback_query.from, 
                body.callback_query.message.chat.id, 
                body.callback_query.message.message_id
            );
            // await sendToMirko("Callback is_english\n" + util.inspect(command) + "\n" + );
        } else {
            await sendToMirko("Callback query non implementata\n" + util.inspect(command));
        }
    } else {
        await sendToMirko("Messaggio sconosciuto: " + JSON.stringify(req.body));
    }

    res.send("ok");
    
});

const saveEnglishPattern = async (hash, from, chat_id, message_id) => {

    const hash_path = hash.split("-").join("/");
    const episode_snap = await db.ref(`rows/${hash_path}`).once('value');

    const snap : json_fmt = episode_snap.val();

    const tech_data      = snap.tech_data;
    const tech_data_hash = uuidv5(tech_data, uuidv5.URL);
    
    await db.ref('english_patterns/' + tech_data_hash).set(tech_data.trim());

    const reply_telegram = {
        "text"          : "Questo pattern è stato segnalato come inglese\n" + snap.tech_data,
        "chat_id"       : MIRKO,
    }

    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram)
        .catch( (error : AxiosError) => {
            console.warn("Telegram KO", error.response.data);
        }) ;    


    const reply_telegram_from = {
        "text"          : "Segnalazione ricevuta",
        "chat_id"       : from.id,
    }
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram_from);     

    const reply_telegram_to_change_text = {
        "chat_id"       : chat_id,
        "message_id"    : message_id,
        "text"          : "Messaggio eliminato, il contenuto era in inglese",
    }

    await axios.post(TELEGRAM_API + "editMessageText", reply_telegram_to_change_text)
        .catch( (error : AxiosError) => {
            console.warn("Telegram KO", error.response.data);
        }) 
}

// E' variato qualche dato di un episodio
exports.onRowChanged_v28 = functions.database.ref(`rows/{seg_1}/{seg_2}/{seg_3}/{seg_4}/{seg_5}`)
    .onWrite ( async (change: functions.Change<functions.database.DataSnapshot>, context: functions.EventContext) : Promise<any> => {

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
        // { '6ab241a9-2794-5f4f-b79b-6104f426eb1f': '[XviD - Eng Mp3 - Sub Ita Eng]', 'fsdf sd ': 'fs dfs dfds' }

        // Iteration is stopped once predicate returns truthy
        const english : boolean = _.some(english_movies_snap, (pattern) => {
            const out : boolean = (episode.tech_data.includes(pattern));
            console.log (`test '${episode.tech_data}' with '${pattern}' - esit ${out}`);
            return out;
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
    });

// E' stata aggiunta una nuova notifica in coda
exports.onToBeNotified_v5 = functions.database.ref(`to_notify/{hash}`)
    .onCreate( async (snapshot) => {
        const hash = snapshot.key;
        console.log ("Notifica accodata", hash);
        const hash_path = hash.split("-").join("/");
        
        await sendNotificationForHash(hash_path);

        // Sposto come modificato
        const date_to_set : string = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
        await db.ref("notified/" + hash).set(date_to_set);
        await snapshot.ref.remove();
    });

