import * as functions from 'firebase-functions';
import { database } from 'firebase-admin';

import * as TNT from './tntvillage';
import Storage from './storage';
import Db from './db';
import { getPage } from './network-helpers';
import Html from './html-helpers';
import Strings from './strings-helpers';

import PostData from './objects/post-data';
import Response from './objects/response';
import ResultRow from  './objects/result-row';

exports.parseIndex_v7 = functions.https.onRequest( async (req, res) => {

    const v : string = "v25";

    try {
        const cache_path : string         = Strings.getCachePathFromQuery(1, 29);
        const html       : string         = await Storage.readFile(cache_path);
        const result     : TNT.ResultPage = Html.parse(html);

        await Db.saveGlobalStats({page_count: result.total_pages, release_count: result.total_releases });
        result.result_rows.forEach( async (item: ResultRow) : Promise<void> => {
            await Db.saveTorrentRow(item);
        })

        res.contentType('html').status(200).send( v );
    
    } catch(e) {

        res.contentType('html').status(200).send( `${v} - Errore durante il parse: -  ${e.toString()}` );
    }   
});

/**
* API HTTP  per richiedere l'aggiornamento dell'indice
* Esempio: https://firebase.google.com/docs/functions/get-started
* */
exports.refresh = functions.https.onRequest( async (req, res) => {

    const status_name  = Db.TREE.STATUS.KEYS.GET_PAGE_INDEX;
    const status_value = Db.TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX.REQUESTED;
    
    try {
        await Db.failIfStateExists(status_name)
        await Db.saveStatus(status_name, status_value);
        return res.status(200).send("Richiesta accettata");
    } catch ( error ) {
        return res.status(500).send(`Richiesta rifiutata, Errore non gestibile, ${error}`);
    }
});


/**
* Quando ricevo il comando GET_PAGE_INDEX, 
*/

exports.onRequestPageIndex = functions.database.ref(`${Db.TREE.STATUS.ROOT}/${Db.TREE.STATUS.KEYS.GET_PAGE_INDEX}`)
    .onCreate( async (snapshot) => {
        
        const status_name   = Db.TREE.STATUS.KEYS.GET_PAGE_INDEX;
        const status_values = Db.TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX;

        if (snapshot.val() !== status_values.REQUESTED) {
            return;
        }

        try {
            await Db.saveStatus(status_name, status_values.UPDATING_QUEUE);
            await Db.enqueue(Db.TREE.QUEUES.KEYS.FORCE_DONWLOAD, new PostData(1, TNT.CATEGORIES.TV_SHOW));
            await Db.deleteStatusName(status_name);
        } catch (reason) {
            console.warn(reason);
        }

    });

/**
* Gestisce la coda FORCE_DOWNLOAD
* Scarica una pagina cancellandone la precedente cache se esistente
*/
exports.onForceDownload_v17 = functions.database.ref(`${Db.TREE.QUEUES.ROOT}/${Db.TREE.QUEUES.KEYS.FORCE_DONWLOAD}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {
        
        const item_data : PostData     = snapshot.val();
        const { page_number, category} = item_data;
        const item_ref                 = snapshot.ref;

        console.log("item_data", item_data);
        console.log("item_ref", item_ref);
        
        try {
            const new_ref = await Db.moveQueuedItem(item_ref, `${Db.TREE.QUEUES.KEYS.DOWNLOADING}`);
            // await Storage.deleteCacheFileIfExists(page_number, category);

            // Non passato dalla stato DOWNLOADABLE, perchè la scarico a forza, e comunque
            // so già che NON ho in cache la pagina
            console.log("before get Page");
            const response : Response = await getPage(page_number, category );
            console.warn ('response recived');
            console.warn(response);
            console.log("after get Page");
            await Storage.saveResponse(response);
            await Db.moveQueuedItem(new_ref, `${Db.TREE.QUEUES.KEYS.TO_PARSE}`);
        } catch (reason) {
            console.warn("onForceDownload other error ", reason);
        }
        
    });

/**
* Gestisce la coda TO_PARSE
* Legge il contenuto di file e lo parsa
*/    
exports.onToParse_v18 = functions.database.ref(`${Db.TREE.QUEUES.ROOT}/${Db.TREE.QUEUES.KEYS.TO_PARSE}/{push_id}`)
    .onCreate( async (snapshot) :  Promise<void> => {

        const { page_number, category}  = snapshot.val();
        const post_data : PostData  = new PostData (page_number, category);
        const cache_path : string       = post_data.cache_file_path;

        console.info("Parsing", cache_path);

        try {
            
            const new_ref : database.Reference = await Db.moveQueuedItem(snapshot.ref, `${Db.TREE.QUEUES.KEYS.PARSING}`);
            const html    : string             = await Storage.readFile(cache_path);
            const result  : TNT.ResultPage     = Html.parse(html);

            await Db.saveGlobalStats({page_count: result.total_pages, release_count: result.total_releases });
            result.result_rows.forEach( async (item: ResultRow) : Promise<void> => {
                await Db.saveTorrentRow(item);
            })
            await Db.deleteQueuedItem(new_ref);

        } catch (reason) {
            console.warn("onToParse error ", reason.toString());
        }

    });



// Se vengo a sapere che il numero di release è cambiato, setto lo stato GET_PAGE_INDEX.REQUESTED;
// questo farà si che la pagina indice venga riscaricata e la coda di download rigenerata
/*
exports.onReleaseCountChange = functions.database.ref(`${Db.TREE.STATUS.ROOT}/${Db.TREE.STATUS.KEYS.RELEASE_COUNT}`)
.onWrite ((
    change: functions.Change<functions.database.DataSnapshot>, 
    // context: functions.EventContext
) : any => {
    console.log ("v1 onReleaseCountCahnge ");
    
    if (change.before.exists() 
    && change.after.exists()
    && (change.after.val() <= change.before.val() )
) {
    
    const status_name  = Db.TREE.STATUS.KEYS.GET_PAGE_INDEX;
    const status_value = Db.TREE.STATUS.KEY_VALUES.GET_PAGE_INDEX.REQUESTED;
    
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


