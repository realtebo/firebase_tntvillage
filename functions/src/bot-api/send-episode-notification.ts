import axios, { AxiosError } from 'axios';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';
import { MIRKO, RITA, TELEGRAM_API } from '../bot-api/constants';
import { makePathHashFromFullHash } from '../helpers/make-hash';
import { database } from 'firebase-functions';

export const sendEpisodeNotification = async (hash : string) : Promise<void> => {

    const hash_path : string                = makePathHashFromFullHash(hash);
    const episode   : database.DataSnapshot = await db.ref(`rows/${hash_path}`).once('value');
    const row       : SimplyResultRow       = new SimplyResultRow(episode.val());

    // Icone
    const england_flag = String.fromCodePoint(0x1F1EC, 0x1F1E7);
    const find_icon    = String.fromCodePoint(0x1F50D);
    const reycle_bin   = String.fromCodePoint(0x1F5D1, 0xFE0F);
    const ban_icon     = String.fromCodePoint(0x1F6AB);

    const keyboard = { "inline_keyboard" : [  
        [
            { "text"            : england_flag + " E' in inglese", 
              "callback_data"   :  `command=is_english&hash=${hash_path}`	},

            { "text"            : find_icon + " Google",  
              "url"             :  `https://www.google.it/search?q=${row.title}` },
        ], [
            { "text"            : reycle_bin + " Cancella messaggio",  
              "callback_data"   :  `command=delete_message` },

            { "text"            : ban_icon + " Ignora Serie",  
              "callback_data"   :  `command=delete_show&hash=${hash_path}` }
        ]
    ]};

    // Funzionalità sperimentali
    
    const reply_telegram = {
        "chat_id"               : MIRKO,
        "photo"                 : row.image_url,
        "caption"               : row.toHtml(),
        "parse_mode"            : "HTML",
        "disable_notification"  : true,
        "reply_markup"          : keyboard,
    }

    await axios.post(TELEGRAM_API + "sendPhoto", reply_telegram)
        .catch( (error : AxiosError) => {
            console.warn("Telegram sendPhoto KO", error.response.data);
        });    
    
    /*
    const reply_telegram = {
        "text"                  : row.toHtml(),
        'parse_mode'            : "HTML",
        "disable_notification"  : true,
        "chat_id"               : MIRKO,
        "reply_markup"          : keyboard,
    }

    // Invio a Mirko
    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram)
        .catch( (error : AxiosError) => {
            console.warn("Telegram KO", error.response.data);
        });
    */
    
    // Decideo se inviare a Rita
    const rita = await db.ref('rita').once('value');

    if (rita.val() !== 'off') {
        reply_telegram.chat_id = RITA;
        /*
        await axios.post(TELEGRAM_API + "sendMessage", reply_telegram)
            .catch( (error : AxiosError) => {
                console.warn("Telegram KO", error.response.data);
            });
        */
        await axios.post(TELEGRAM_API + "sendPhoto", reply_telegram)
            .catch( (error : AxiosError) => {
                console.warn("Telegram sendPhoto KO", error.response.data);
            }); 
    } else {
        console.info ( "Spedizione a Rita disattiva !");
    }

    // Funzionalità sperimentali
    /*
    const reply_telegram_experimental = {
        "chat_id"               : MIRKO,
        "photo"                 : row.image_url,
        "caption"               : row.toHtml(),
        "parse_mode"            : "HTML",
        "disable_notification"  : true,
        "reply_markup"          : keyboard,
    }

    await axios.post(TELEGRAM_API + "sendPhoto", reply_telegram_experimental)
        .catch( (error : AxiosError) => {
            console.warn("Telegram sendPhoto KO", error.response.data);
        });  
    */
    
}
