import * as functions from 'firebase-functions';

import { deleteCacheFileIfExists, saveAsPageCache, fileFromPath } from './storage-helpers';
import { 
    TREE, 
    saveStatus, failIfStateExists, deleteStatusName,
    emptyQueue 
} from './db-helpers';
import { getTvShowIndexPage } from './network-helpers';
import { parseHtml } from './html-helpers';
import * as TNT from './tntvillage';

/**
 * API HTTP  per richiedere l'aggiornamento dell'indice
 * Esempio: https://firebase.google.com/docs/functions/get-started
 * */
exports.refresh = functions.https.onRequest( (req, res) => {

    const status_name  = TREE.STATUS.KEYS.GET_PAGE_INDEX;
    const status_value = TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX.REQUESTED;

    failIfStateExists(status_name)
        .then( () => {
            // Se arrivo qui, la chiave non esiste, ed è il risulato desiderato
            return saveStatus(status_name, status_value);
        })
        .then( () => {
            // Se arrivo qui, sono riuscito a salvare il nuovo stato
            return res.status(200).send("Richiesta accettata");
        })
        .catch( (get_status_error : Error) => {
            return res.status(500).send(`Richiesta rifiutata, Errore non gestibile, ${get_status_error}`);
        })
  });

/**
 * Quando ricevo il comando GET_PAGE_INDEX, 
 * - elimino, se già presente, la cache della prima pagina
 * - viene riscaricata la prima pagina
 * - controllo il numero di release online con quelle che abbiamo in db
 * - se diverso provoco la distruzione della cache e la sua rigenerazione
 */
exports.getPageIndex = functions.database.ref(`${TREE.STATUS.ROOT}/${TREE.STATUS.KEYS.GET_PAGE_INDEX}`)
    .onCreate( () : Promise<void> => {
        
        const status_name  = TREE.STATUS.KEYS.GET_PAGE_INDEX;
        const status_values = TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX;

        return saveStatus(status_name, status_values.DELETING_OLD_CACHE)
            .then( () =>{ 
                return deleteCacheFileIfExists(1, TNT.CATEGORIES.TV_SHOW);
            })
            .then( () => {
                return saveStatus(status_name, status_values.FETCHING_INDEX);
            })
            .then( () => {
                return getTvShowIndexPage();
            })
            .then( (tnt_response : TNT.Response) => {
                return saveStatus(status_name, status_values.SAVING_CACHE)
                    .then( () => { return tnt_response; });
            })
            .then( (tnt_response : TNT.Response) => {
                return saveAsPageCache(tnt_response.html, tnt_response.cache_file_path);
            })
            .then( () => {
                return deleteStatusName(status_name);
            })
            .catch( reason => {
                console.warn(reason);
            });
    });

/** 
 * Quando un nuovo file viene creato sullo storage,
 * viene letto e ne viene parsato il contenuto HTML
 * per ottenere tutti i dati in esso contenuti 
 */
exports.parseFileWhenCreated = functions.storage.object()
    .onFinalize( (metadata : functions.storage.ObjectMetadata) : Promise<TNT.PageContent> => {
        console.warn("v8 - parseFileWhenCreated");
        return fileFromPath(metadata.name).download()
            .then( (response : [Buffer]) : TNT.PageContent => {
                const html : string = response[0].toString();
                const page_content : TNT.PageContent = parseHtml(html);
                console.log(page_content);
                return page_content;
            })
            .then ( (page_content : TNT.PageContent) => {
                return emptyQueue(TREE.QUEUES.KEYS.DONWLOAD)
                    .then( () => {return page_content} );
            })
            .then ( (page_content : TNT.PageContent) => {
                return enqueue(TREE.QUEUES.KEYS.DONWLOAD, page_content)
                    .then( () => {return page_content} );
            })
    });

/*
// A seguito della creazione di un nodo SINGLE_PAGE
// viene verificato se la pagina è o meno in acche
// quindi NON viene riscaricata se già presente
exports.createPageCache = functions.database.ref(SINGLE_PAGE)
    .onCreate(async (snapshot) => {
        const page_number = snapshot.key;
        await setSinglePageStatus(page_number, 'lookup')
            .catch(async(error) => {
                console.warn('createPageCache error', error);
                await removeStorageIfExists(page_number);
                return false;
            });
        const cached = await isAlreadyCached(page_number);
        let page_content = null;
        if (!cached) {
            await setSinglePageStatus(page_number, 'downloading')
            await removeStorageIfExists(page_number);
            page_content = await getPageContentFromWeb(page_number);
            if (page_content === false) {
                // In caso di errore, semplicemente non creo il file
                return false;
            }
            await saveResponseToStorage(page_number, page_content);
        }
        await removeNode(`${PAGE_INDEX}/${page_number}`)
        return page_content;
    });

*/