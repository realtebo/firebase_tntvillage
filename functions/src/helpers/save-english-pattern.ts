import { db } from '../app-helpers';
import { json_fmt} from '../objects/result-row';
import { MIRKO  } from '../bot-api/constants';
import { get_snap_from_hash } from './get-snap-from-hash';
import { makeHash } from './make-hash';
import { sendTo } from '../bot-api/send-to';
import { editMessage } from '../bot-api/edit-message';

export const saveEnglishPattern = async (hash : string, from_id : number, chat_id: number, message_id : number) => {

    const snap : json_fmt = await get_snap_from_hash(hash);

    const tech_data      = snap.tech_data.trim().toUpperCase();
    const tech_data_hash = makeHash(tech_data);
    
    await db.ref('english_patterns/' + tech_data_hash).set(tech_data);

    await sendTo(MIRKO, "Questo pattern è stato segnalato come inglese\n" + snap.tech_data);

    await editMessage(chat_id, message_id, "Messaggio rimosso, il contenuto era in lingua inglese");
}