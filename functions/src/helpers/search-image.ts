import * as GoogleImages from 'google-images';
import { CUSTOM_SEARCH_ENGINE_ID, GOOGLE_API_SEARCH_KEY } from '../google-api/constants';

/**
 * Dato un titolo, più pulito possibile, cerco una immagine da allegare al messaggio
 * 
 */
export const searchImage = async (title : string) : Promise<string> => {
    
    const client = new GoogleImages(CUSTOM_SEARCH_ENGINE_ID, GOOGLE_API_SEARCH_KEY);
    
    const images = await client.search(`"${title}" "serie tv"`, {size: 'medium'})
    return images[0].url;
};
