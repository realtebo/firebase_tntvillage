import * as functions from 'firebase-functions';
import * as _  from 'lodash';
import { 
    saveAsPageCache, cacheFileExists,
    deleteCacheFileIfExists, readFile
} from './storage-helpers';
import { 
    TREE, 
    saveStatus, failIfStateExists, deleteStatusName,
    emptyQueue, enqueue, moveQueuedItem, deleteQueuedItem,
    updateReleaseCount,
} from './db-helpers';
import { getPage } from './network-helpers';
import * as TNT from './tntvillage';
import { parseHtml } from './html-helpers';
import { DataSnapshot } from 'firebase-functions/lib/providers/database';
import { database } from 'firebase-admin';


/**
* API HTTP  per richiedere l'aggiornamento dell'indice
* Esempio: https://firebase.google.com/docs/functions/get-started
* */
exports.refresh = functions.https.onRequest( async (req, res) => {

    const status_name  = TREE.STATUS.KEYS.GET_PAGE_INDEX;
    const status_value = TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX.REQUESTED;
    
    try {
        await failIfStateExists(status_name)
        await saveStatus(status_name, status_value);
        return res.status(200).send("Richiesta accettata");
    } catch ( error ) {
        return res.status(500).send(`Richiesta rifiutata, Errore non gestibile, ${error}`);
    }
});


/**
* Quando ricevo il comando GET_PAGE_INDEX, 
*/

exports.onRequestPageIndex = functions.database.ref(`${TREE.STATUS.ROOT}/${TREE.STATUS.KEYS.GET_PAGE_INDEX}`)
    .onCreate( async (snapshot) => {
        
        const status_name   = TREE.STATUS.KEYS.GET_PAGE_INDEX;
        const status_values = TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX;

        if (snapshot.val() !== status_values.REQUESTED) {
            return;
        }

        try {
            await saveStatus(status_name, status_values.UPDATING_QUEUE);
            await enqueue(TREE.QUEUES.KEYS.FORCE_DONWLOAD, new TNT.PostData(1, TNT.CATEGORIES.TV_SHOW));
            await deleteStatusName(status_name);
        } catch (reason) {
            console.warn(reason);
        }

    });

/**
* Gestisce la coda FORCE_DOWNLOAD
* Scarica una pagina cancellandone la precedente cache se esistente
*/
exports.onForceDownload_v7 = functions.database.ref(`${TREE.QUEUES.ROOT}/${TREE.QUEUES.KEYS.FORCE_DONWLOAD}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {
        
        const item : TNT.PostData      = snapshot.val();
        const { page_number, category} = item;

        const item_ref = snapshot.ref;
        
        try {
            const new_ref = await moveQueuedItem(item_ref, `${TREE.QUEUES.KEYS.DOWNLOADING}`);
            await deleteCacheFileIfExists(page_number, category);
            // Non passato dalla stato DOWNLOADABLE, perchè la scarico a forza, e comunque
            // so già che NON ho in cache la pagina
            const response : TNT.Response = await getPage(page_number, category );
            await saveAsPageCache(response.html, response.cache_file_path);
            await moveQueuedItem(new_ref, `${TREE.QUEUES.KEYS.TO_PARSE}`);
        } catch (reason) {
            console.warn("onForceDownload other error ", reason);
        }
        
    });

/**
* Gestisce la coda TO_PARSE
* Legge il contenuto di file e lo parsa
*/    
exports.onToParse_v13 = functions.database.ref(`${TREE.QUEUES.ROOT}/${TREE.QUEUES.KEYS.TO_PARSE}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {

        const item : TNT.PostData  = snapshot.val();
        const cache_path : string  = item.cache_file_path;

        if (cache_path === 'undefined') {
            console.warn("cache_path è tuttora vuoto!");    
            console.warn(item);    
            console.warn(item.page_number);    
            console.warn(item.category);    
            console.warn(item.cache_file_path);
            return;
        }

        console.warn("parsing ", item, cache_path);

        try {
            
            const new_ref : database.Reference   = await moveQueuedItem(snapshot.ref, `${TREE.QUEUES.KEYS.PARSING}`);
            const html : string                  = await readFile(cache_path);
            const page_content : TNT.PageContent = await parseHtml(html);
            
            await saveStatus(TREE.STATUS.KEYS.RELEASE_COUNT, page_content.total_releases);
            await saveStatus(TREE.STATUS.KEYS.TOTAL_PAGES, page_content.total_pages);

            await saveAsPageCache(page_content.table_content, cache_path);

            await deleteQueuedItem(new_ref);

        } catch (reason) {
            console.warn("onToParse error ", reason);
        }

    });



// Se vengo a sapere che il numero di release è cambiato, setto lo stato GET_PAGE_INDEX.REQUESTED;
// questo farà si che la pagina indice venga riscaricata e la coda di download rigenerata
/*
exports.onReleaseCountChange = functions.database.ref(`${TREE.STATUS.ROOT}/${TREE.STATUS.KEYS.RELEASE_COUNT}`)
.onWrite ((
    change: functions.Change<functions.database.DataSnapshot>, 
    // context: functions.EventContext
) : any => {
    console.log ("v1 onReleaseCountCahnge ");
    
    if (change.before.exists() 
    && change.after.exists()
    && (change.after.val() <= change.before.val() )
) {
    
    const status_name  = TREE.STATUS.KEYS.GET_PAGE_INDEX;
    const status_value = TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX.REQUESTED;
    
    return failIfStateExists(status_name)
    .then( () => {
        // Se arrivo qui, la chiave non esiste, ed è il risulato desiderato
        return saveStatus(status_name, status_value);
    }
);

} else {
    return; 
}
});
*/


