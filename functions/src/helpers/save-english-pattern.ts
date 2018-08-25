import { db } from '../app-helpers';
import { json_fmt} from '../objects/result-row';
import { MIRKO  } from '../bot-api/constants';
import { get_snap_from_hash } from './get-snap-from-hash';
import { sendTo } from '../bot-api/send-to';
import { editMessage } from '../bot-api/edit-message';
import { nowAsString } from './now-as-string';
import { cleanTechData } from './clean-english-pattern';

export const saveEnglishPattern = async (hash : string, from_id : number, chat_id: number, message_id : number) => {

    const snap : json_fmt = await get_snap_from_hash(hash);

    const tech_data = cleanTechData(snap.tech_data);
    
    await db.ref('english_patterns/' + tech_data).set(nowAsString());

    await sendTo(MIRKO, "Questo pattern è stato segnalato come inglese\n" + snap.tech_data);

    await editMessage(chat_id, message_id, "Messaggio rimosso, il contenuto era in lingua inglese");
}