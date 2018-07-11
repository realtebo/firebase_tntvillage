import { db } from '../app-helpers';
import { sendEpisodeNotification } from '../bot-api/send-episode-notification';
import { nowAsString } from '../helpers/now-as-string';

export const to_notify_oncreate = async (snapshot) => {
    const hash = snapshot.key;
    // console.log ("Notifica accodata", hash);
    const hash_path = hash.split("-").join("/");
    
    await sendEpisodeNotification(hash_path);

    // Sposto come modificato
    const date_to_set : string = nowAsString();
    await db.ref("notified/" + hash).set(date_to_set);
    await snapshot.ref.remove();
}