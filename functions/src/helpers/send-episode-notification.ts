import axios, { AxiosError } from 'axios';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';
import { MIRKO, RITA, TELEGRAM_API } from '../bot-api/constants';

export const sendEpisodeNotification = async (hash : string) : Promise<void> => {

    const hash_path : string = hash.split("-").join("/");

    const episode = await db.ref(`rows/${hash_path}`).once('value');
    const row : SimplyResultRow = new SimplyResultRow(episode.val());

    // console.log (`sendNotificationForHash ${hash} - Notifica da inviare ${row.toString()}`);

    const england_flag = String.fromCodePoint(0x1F1EC, 0x1F1E7);
    const find_icon    = String.fromCodePoint(0x1F50D);
    const reycle_bin   = String.fromCodePoint(0x1F5D1, 0xFE0F);

    const keyboard = { "inline_keyboard" : [  
        [
            { "text"            : england_flag + " E' in inglese", 
              "callback_data"   :  `command=is_english&hash=${hash_path}`	},

            { "text"            : find_icon + " Google",  
              "url"             :  `https://www.google.it/search?q=${row.title}` },
        ], [
            { "text"            : reycle_bin + " Cancella messaggio",  
              "callback_data"   :  `command=delete_message` }
        ]
    ]};

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
    
    // Decideo se inviare a Rita
    const rita = await db.ref('rita').once('value');
    if (rita.val() !== 'off') {
        reply_telegram.chat_id = RITA;
        await axios.post(TELEGRAM_API + "sendMessage", reply_telegram)
            .catch( (error : AxiosError) => {
                console.warn("Telegram KO", error.response.data);
            });
    } else {
        console.log ( "Spedizione a Rita disattiva !");
    }

    // Funzionalità sperimentali
    /*
    const keyboard_experimental = { "inline_keyboard" : [  
        [
         { "text": england_flag + " E' in inglese",  "callback_data" :  `command=is_english&hash=${hash_path}`	},
         { "text": find_icon + "Google",  "url" :  `https://www.google.it/search?q=${row.title}` },
       ],
       [
          { "text": "Cancella messaggio",  "callback_data" :  `command=delete_message` }
       ]
    ]};

    const reply_telegram_experimental = {
        ...reply_telegram,
        "reply_markup"       : keyboard_experimental,
        "chat_id"           : MIRKO,
    }

    await axios.post(TELEGRAM_API + "sendMessage", reply_telegram_experimental)
        .catch( (error : AxiosError) => {
            console.warn("Telegram KO", error.response.data);
        });  
    */
}
