import * as _ from 'lodash';
import * as functions from 'firebase-functions';
import * as util from 'util';

import { sendTo } from '../bot-api/send-to';
import { MIRKO } from '../bot-api/constants';
import { refresh } from '../helpers/refresh';
import { saveEnglishPattern } from '../helpers/save-english-pattern';
import { deleteMessageFromChat } from '../helpers/delete-message';
import { deleteShow } from '../helpers/delete-Show';

// Reagisce ai messaggi inviati dagli utenti umani
const handleDirectMessage = async (message) : Promise<void> => {

    const { text, from } = message;
    const { id, first_name, last_name} = from;
    
    switch (text) {
        case '/refresh': {
            // Lo accetto solo da Mirko
            if (id !== MIRKO) {
                await sendTo(MIRKO, "Mittente non approvato per questo comando: " + JSON.stringify(from) );    
            }

            await sendTo(MIRKO, "Ricevuto comando di refresh Da Mirko");
            const result: boolean = await refresh();
            if (!result) {
                console.warn("handleDirectMessage - c'è stato un errore nel refresh");
            }
            break;
        }
        default: {
            await sendTo(MIRKO, "Comando sconosciuto: " + text + " da " + first_name + " " + last_name );
        }
    }
}

// Reagisce ai pulsanti di azione

export const telegram_callback  = async (req : functions.Request, res : functions.Response) : Promise<void> => {
    const body = req.body;

    // Messaggio diretto
    if (body.message) {
       await handleDirectMessage(body.message);

    // Messaggio diretto
    } else if (body.callback_query) {

        // console.log(body.callback_query);

        const query = _.chain(body.callback_query.data)
            .split('&')                         // ["a=b454","c=dhjjh","f=g6hksdfjlksd"]
            .map(_.partial(_.split, _, '=', 2)) // [["a","b454"],["c","dhjjh"],["f","g6hksdfjlksd"]]
            .fromPairs()                        // {"a":"b454","c":"dhjjh","f":"g6hksdfjlksd"}
            .value();

        const message_id : number = <number>body.callback_query.message.message_id;
        const chat_id    : number = <number>body.callback_query.message.chat.id;
        const from_id    : number = <number>body.callback_query.from.id;

        if (query.command === 'is_english') {

            await saveEnglishPattern(<string>query.hash, from_id, chat_id, message_id);

        } else if (query.command === 'delete_message') {

            await deleteMessageFromChat(chat_id, message_id);

        } else if (query.command === 'delete_show') {
            
            await deleteShow(<string>query.hash, chat_id, message_id);

        } else {
            await sendTo(MIRKO, "Callback query non implementata\n" + util.inspect(query));
        }
    } else {
        await sendTo(MIRKO, "Messaggio sconosciuto: " + JSON.stringify(req.body));
    }

    res.send("ok");
}