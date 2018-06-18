// The Firebase Admin SDK to access the Firebase Realtime Database.

import * as TNT from './tntvillage';

/**
 * Shortcut per `getPage(1, TNT.CATEGORIES.TV_SHOW)`;
 */
const getTvShowIndexPage = () : Promise<TNT.Response> => {
    return getPage(1, TNT.CATEGORIES.TV_SHOW);
}

/**
 * Scarica una pagina da TNTVillage 
 * Non verifica l'attuale stato della cache
 * Restituisce il corpo della pagina oppure genera errore
 */
const getPage = (page_number: number, category_number: number) : Promise<TNT.Response> => {
    const post_data: TNT.PostData = new TNT.PostData(page_number, category_number);
    const tnt_query: TNT.Query = new TNT.Query(post_data);
    return tnt_query.execute();
}

export { 
    getPage,
    getTvShowIndexPage
};
