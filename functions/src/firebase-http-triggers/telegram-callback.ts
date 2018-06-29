import * as _ from 'lodash';
import * as functions from 'firebase-functions';
import * as util from 'util';

import { sendToMirko } from '../bot-api/send-to-mirko';
import { MIRKO } from '../bot-api/constants';
import { refresh } from '../helpers/refresh';
import { saveEnglishPattern } from '../helpers/save-english-pattern';
import { deleteMessageFromChat} from '../helpers/delete-message';

export const telegram_callback  = async (req : functions.Request, res : functions.Response) : Promise<void> => {
    const body = req.body;

    // Messaggio diretto
    if (body.message) {
        // Richiesta di riscaricare la home di TNTVillage
        if (body.message.text === '/refresh') {
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

        // console.log(body.callback_query);

        const command = _.chain(req.body.callback_query.data)
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
        } else if (command.command === 'delete_message') {
            await deleteMessageFromChat(
                body.callback_query.message.chat.id, 
                body.callback_query.message.message_id
            );
        } else {
            await sendToMirko("Callback query non implementata\n" + util.inspect(command));
        }
    } else {
        await sendToMirko("Messaggio sconosciuto: " + JSON.stringify(req.body));
    }

    res.send("ok");
}