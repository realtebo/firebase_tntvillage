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
 * Restituisce il corpo della pagina oppure genera errore
 */
const getPage = (page_number: number, category_number: number) : Promise<Response> => {
    const post_data: PostData = new PostData(page_number, category_number);
    const tnt_query: Query = new Query(post_data);
    return tnt_query.execute();
}

export { 
    getPage,
    getTvShowIndexPage
};
