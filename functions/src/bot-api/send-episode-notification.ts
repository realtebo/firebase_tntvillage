import axios, { AxiosError } from 'axios';
import * as admin from 'firebase-admin';

import { db } from '../app-helpers';
import { SimplyResultRow } from '../objects/result-row';
import { MIRKO, RITA, TELEGRAM_API } from '../bot-api/constants';
import { makePathHashFromFullHash } from '../helpers/make-hash';

export const sendEpisodeNotification = async (hash : string) : Promise<void> => {

    const hash_path : string                        = makePathHashFromFullHash(hash);
    const episode   : admin.database.DataSnapshot   = await db.ref(`rows/${hash_path}`).once('value');
    const row       : SimplyResultRow               = new SimplyResultRow(episode.val());

    // Decideo se inviare a Rita
    const rita = await db.ref('rita').once('value');

    // Icone
    
    const england_flag = String.fromCodePoint(0x1F1EC, 0x1F1E7);
    const find_icon    = String.fromCodePoint(0x1F50D);
    const reycle_bin   = String.fromCodePoint(0x1F5D1, 0xFE0F);
    const ban_icon     = String.fromCodePoint(0x1F6AB);


    // Tastiera delle azioni
    const keyboard = { "inline_keyboard" : [  
        [
            { "text"            : england_flag, 
              "callback_data"   :  `command=is_english&hash=${hash_path}`	},

            { "text"            : find_icon,  
              "url"             :  `https://www.google.it/search?q=${row.title}` },

            { "text"            : reycle_bin,  
              "callback_data"   :  `command=delete_message` },
        ], [
            { "text"            : ban_icon + " Ignora Serie",  
              "callback_data"   :  `command=delete_show&hash=${hash_path}` }
        ]
    ]};

    // Testo del messaggio
    let message_html : string  = row.toHtml();
    if ( rita.val() === 'off' ) {
        message_html += "\n<b>Notifiche a Rita disattivate !</b>";
    }

    // Composizione oggetto da inviare a telegram
    const reply_telegram = {
        "chat_id"               : MIRKO,
        "text"                  : message_html,
        "parse_mode"            : "HTML",
        "disable_notification"  : true,
        "reply_markup"          : keyboard,
    }

    // Spedizione
    await axios
        // Invio a Mirko
        .post(TELEGRAM_API + "sendMessage", reply_telegram)
        // Invio a Rita, se abilitato
        .then( () => {
            if (rita.val() !== 'off') {
                reply_telegram.chat_id = RITA;
                axios.post(TELEGRAM_API + "sendMessage", reply_telegram)
            }
        })
        .catch( (error : AxiosError) => {
            console.warn("sendEpisodeNotification #1 - Telegram sendMessage KO", error.response.data, " - dati inviati al bot: ", reply_telegram);
        });    
    
}
