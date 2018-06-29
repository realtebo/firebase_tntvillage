import * as uuidv5 from 'uuid/v5';
import axios, { AxiosError } from 'axios';

import { db } from '../app-helpers';
import { json_fmt} from '../objects/result-row';
import { MIRKO, TELEGRAM_API } from '../bot-api/constants';

export const saveEnglishPattern = async (hash, from, chat_id, message_id) => {

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