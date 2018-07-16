import * as GoogleImages from 'google-images';
import { CUSTOM_SEARCH_ENGINE_ID, GOOGLE_API_SEARCH_KEY } from '../google-api/constants';
import { database } from 'firebase-admin';
import { json_fmt } from '../objects/result-row';
import { sendTo } from '../bot-api/send-to';
import { MIRKO } from '../bot-api/constants';
import _ = require('lodash');

/**
 * Dato un titolo, più pulito possibile, cerco una immagine da allegare al messaggio
 * 
 * Uso il mio cse: https://cse.google.com/cse/setup/basic?cx=009127734400381924296:ck3vf-rvnka
 */
export const searchImage = async (episode_ref : database.Reference,  title : string) : Promise<string> => {

    
    const episode_snap : database.DataSnapshot = await episode_ref.once("value");
    let image_url      : string;

    // Per evitare chiamate API inutili, verifico se ce l'avevo già a db
    if (!episode_snap.exists()) {
        image_url = await doImageSearch(title);
    } else {
        const value : json_fmt = episode_snap.val();
        image_url = value.image_url;
        if (!image_url) {
            image_url = await doImageSearch(title);
        }
    }

    return image_url;
};

const doImageSearch = async (title : string) : Promise<string> => {
    
    const client = new GoogleImages(CUSTOM_SEARCH_ENGINE_ID, GOOGLE_API_SEARCH_KEY);
    
    // Ho tolto serie tv perché posso inserirle come Parole chiave nel CSE
    const images = await client.search(`"${title}"`, {size: 'medium'});

    

    // DEBUGGONE

    let images_for_msg : any;
    if (typeof images[0] !== "undefined") {

        // LISTO il titolo E TUTTE LE IMMAGINI TROVATE 
        await sendTo(MIRKO, "Ho cercato " + title);
        images_for_msg = _.each(images, async (row, index) => {
            let data   = _.omit(row, ['thumbnail', 'size']);
            data       = _.slice(data, 0, 3);
            const msg  = _.map(data, (value, key) => `${key}: ${value}`);
            await sendTo(MIRKO, `${title} - ${index}` + "\n" + msg.join("\n"));
        });
    } else {

        // LISTO il titolo E --- BOH
        console.warn (title, images);
        images_for_msg = images;
        await sendTo(MIRKO, "Ho cercato " + title + "\nRisultati: " + JSON.stringify(images_for_msg));
    }

    

    // Fix: ovviamente NON è detto che tutti i tioli diano immagini
    if (typeof images[0] === "undefined" ) {
        console.warn("Nessuna immagine trovata per '" + title + "'. Dati ricevuti dal search: " + typeof images, images);
        return "";
    }
    return images[0].url;

}