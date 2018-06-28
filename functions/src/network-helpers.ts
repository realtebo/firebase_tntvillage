// The Firebase Admin SDK to access the Firebase Realtime Database.

import Response from './objects/response';
import PostData from './objects/post-data';
import Query from './objects/query';
import { CATEGORIES } from './tntvillage';

/**
 * Shortcut per `getPage(1, CATEGORIES.TV_SHOW)`;
 */
const getTvShowIndexPage = () : Promise<Response> => {
    return getPage(1, CATEGORIES.TV_SHOW);
}

/**
 * Scarica una pagina da TNTVillage 
 * Non verifica l'attuale stato della cache
 * Non genera errore
 */
const getPage = async (page_number: number, category_number: number) : Promise<Response> => {
    // console.log (`getPage: Page ${page_number} - Cat ${category_number}`)
    const post_data: PostData = new PostData(page_number, category_number);
    const tnt_query: Query = new Query(post_data);
    const response : Response = await tnt_query.execute();
    if (response.status !== 200 ) {
        console.warn ('errore in getPage', response);
    }
    return response;
}

export { 
    getPage,
    getTvShowIndexPage,

};
