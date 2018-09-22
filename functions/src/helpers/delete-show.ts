import { json_fmt} from '../objects/result-row';
import { get_snap_from_hash } from '../helpers/get-snap-from-hash';
import { db } from '../app-helpers';
import { editMessage } from '../bot-api/edit-message';
import { nowAsString } from '../helpers/now-as-string';
import { cleanString } from '../helpers/clean-string';

export const deleteShow = async (hash: string, chat_id: number, message_id: number) => {

    try {
        const snap : json_fmt = await get_snap_from_hash(hash);

        if (typeof snap.title !== 'undefined') {

            const title = cleanString(snap.title);

            // Verifica alternativa, usando il nuovo sistema ad albero
            await db.ref(`tv_show/${title}`).update({ 
                'banned'        : true,
                'banned_since'  : nowAsString()
            });

            await editMessage(chat_id, message_id, `La serie TV ${title} verrà ignorata`);
        } else {
            await editMessage(chat_id, message_id, `C'è stato un errore, sarà possibile eliminare la serie la prossima volta`);
        }

    } catch ( error ) {
        console.warn ( `deleteShow (hash '${hash}', chat_id '${chat_id}') catched error:` + error);
    }
    
}