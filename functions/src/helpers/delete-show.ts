import { json_fmt} from '../objects/result-row';
import { get_snap_from_hash } from '../helpers/get-snap-from-hash';
import { db } from '../app-helpers';
import { sendTo } from '../bot-api/send-to';
import { MIRKO } from '../bot-api/constants';
import { editMessage } from '../bot-api/edit-message';
import { nowAsString } from '../helpers/now-as-string';
import { cleanString } from '../helpers/clean-string';

export const deleteShow = async (hash: string, chat_id: number, message_id: number) => {

    // console.log (`deleteShow hash: ${hash}, chat_id: ${chat_id}, message_id: ${message_id}`);

    try {
        const snap : json_fmt = await get_snap_from_hash(hash);

        const title = cleanString(snap.title);

        await db.ref(`banned_shows/${title}`).set( nowAsString() );

        await sendTo(MIRKO, "Questo show è stato bannato\n" + title);

        await editMessage(chat_id, message_id, `La serie TV ${title} verrà ignorata`);

    } catch ( error ) {
        console.warn ( `deleteShow (hash '${hash}', chat_id '${chat_id}') catched error:` + error);
    }
}