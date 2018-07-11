import * as GoogleImages from 'google-images';
import { CUSTOM_SEARCH_ENGINE_ID, GOOGLE_API_SEARCH_KEY } from '../google-api/constants';

/**
 * Dato un titolo, più pulito possibile, cerco una immagine da allegare al messaggio
 * 
 * Uso il mio cse: https://cse.google.com/cse/setup/basic?cx=009127734400381924296:ck3vf-rvnka
 */
export const searchImage = async (title : string) : Promise<string> => {
    
    const client = new GoogleImages(CUSTOM_SEARCH_ENGINE_ID, GOOGLE_API_SEARCH_KEY);
    
    // Ho tolto serie tv perché posso inserirle come Parole chiave nel CSE
    const images = await client.search(`"${title}"`, {size: 'medium'});

    // Fix: ovviamente NON è detto che tutti i tioli diano immagini
    if (typeof images[0] === "undefined" ) {
        console.warn("Nessuna immagine trovata per '" + title + "'. Dati ricevuti dal search: " + typeof images, images);
        return "";
    }
    return images[0].url;
};
