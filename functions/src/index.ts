import * as functions from 'firebase-functions';
import * as _  from 'lodash';
import { 
    saveAsPageCache, fileFromPath, cacheFileExists,
    deleteCacheFileIfExists,
    deleteCacheFileIfEmpty 
} from './storage-helpers';
import { 
    TREE, 
    saveStatus, failIfStateExists, deleteStatusName,
    emptyQueue, enqueue, moveQueuedItem, deleteQueuedItem
} from './db-helpers';
import { getTvShowIndexPage, getPage } from './network-helpers';
import { parseHtml } from './html-helpers';
import * as TNT from './tntvillage';
import { database } from 'firebase-admin';

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
 * - se diverso provoco la distruzione della cache (della sola pagina indice !!!! )
 * - e la sua rigenerazione
 * - inoltre prepara la coda di download
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
            .then( () : Promise<TNT.Response> => {
                return getTvShowIndexPage();
            })
            .then( (tnt_response : TNT.Response) : Promise<TNT.Response> => {
                return saveStatus(status_name, status_values.SAVING_CACHE)
                    .then( () => { return tnt_response; });
            })
            .then( (tnt_response : TNT.Response) : Promise<string> => {
                return saveAsPageCache(tnt_response.html, tnt_response.cache_file_path)
                    .then( () => { return tnt_response.html; });
            })
            .then( (html : string) : Promise<string> => {
                return saveStatus(status_name, status_values.CREATING_QUEUE)
                    .then( () => { return html; });
            })
            .then( (html : string) : Promise<string> => {
                return emptyQueue(TREE.QUEUES.KEYS.DONWLOAD)
                    .then( () => { return html; });
            })
            .then( (html : string) => {

                const page_content : TNT.PageContent = parseHtml(html);

                // Forzatura 
                const page_number : number = _.min([10, page_content.total_pages]);

                for (let x = 1;  x <= page_number ; x++) {
                    enqueue(TREE.QUEUES.KEYS.DONWLOAD, new TNT.PostData(x,TNT.CATEGORIES.TV_SHOW));
                }
                return;
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
        console.warn("v10 - parseFileWhenCreated - metadata.name");
        return fileFromPath(metadata.name).download()
            .then( (response : [Buffer]) : TNT.PageContent => {
                const html : string = response[0].toString();
                const page_content : TNT.PageContent = parseHtml(html);
                return page_content;
            })
    });

/**
 * Quando un item viene messo in coda di download, lo sposto
 * nella coda 'downloadble', cioè scaricabile 
 * prima di decidere cosa fare, valuto se ho o meno la cache
 * se non ce l'ho, scarico la pagina e la salvo nello storage
 */
exports.downloadPageWhenQueued = functions.database.ref(`${TREE.QUEUES.ROOT}/${TREE.QUEUES.KEYS.DONWLOAD}/{push_id}`)
    .onCreate( (snapshot : functions.database.DataSnapshot) : Promise<void> => {
        
        const item : TNT.PostData       = snapshot.val();
        const ref  : database.Reference = snapshot.ref;
        
        return moveQueuedItem(ref, `${TREE.QUEUES.KEYS.DONWLOADABLE}`)
            .then( () : Promise<boolean> => {
                return cacheFileExists(item.page_number, item.category);
            })
            .then( () : Promise<boolean> => {
                return deleteCacheFileIfEmpty(item.page_number, item.category);
            })
            .then( () : Promise<TNT.Response> => {
                return getPage(item.page_number, item.category )
            }) 
            .then( (response : TNT.Response) : Promise<TNT.Response> => {
                return deleteCacheFileIfExists(response.post_data.page_number, response.post_data.category )
                    .then( () => { return response; });
            })
            .then( (response : TNT.Response) : Promise<void> => {
                return saveAsPageCache(response.html, response.cache_file_path);
            })
            .then( () => {
                return deleteQueuedItem(ref);
            })
    });


    