import { db } from '../app-helpers';
import * as _ from "lodash";
import ResultRow from '../objects/result-row';
import ReleaseStats from '../objects/release-stats';
import PostData from '../objects/post-data';
import { database } from 'firebase-admin';
import { DataSnapshot } from 'firebase-functions/lib/providers/database';
import * as Err from './errors';

const TREE = {
    "STATISTICS" : {
        "ROOT" : '/statistiscs',
        "KEYS" : {
            'WEB_PAGES'    : 'web_pages',
            'WEB_RELEASES' : 'web_releases'
        }
    },
    "STATUS" : {
        "ROOT" : '/status',
        "KEYS" : {
            "GET_PAGE_INDEX" : 'getPageIndex',
        },
        "KEY_VALUES" : {
            "GET_PAGE_INDEX" : {
                'REQUESTED'          : 'requested',
                'UPDATING_QUEUE'     : 'updating_queue',
            }
        }
    },
    "QUEUES" : {
        "ROOT" : '/queues',
        "KEYS" : {
            "FORCE_DONWLOAD"    : 'force_download',
            "DONWLOAD"          : 'download',
            "DONWLOADABLE"      : 'downloadable',
            "DOWNLOADING"       : 'downloading',
            "TO_PARSE"          : 'to_parse',
            "PARSING"           : "parsing",
        }
    },
    "MAGNETS" : {
        "ROOT" : '/magnets',   
    }
};

// Imposta lo stato della singola pagina
// Attualmente viene sorvegliato solo l'evento di CREAZIONE
// di ${PAGE_INDEX}/${page_number}, per cui il
// scatena un evento solo se il nodo prima non esisteva 
/*
const setSinglePageStatus = async (page_number, status) => {
    await db.ref(`${PAGE_INDEX}/${page_number}`).set(status);
}
*/


/***************************
 *      TORRENT DATA
 ***************************/
const saveTorrentRow = (row: ResultRow) : Promise<void> => {
    
    // console.log ('saveTorrentRow v6');
    try {
        const hash: string = row.hash;
        return db.ref(`${TREE.MAGNETS.ROOT}/${hash}`).set(row);
    } catch (e) {
        console.warn(' row cannot be saved', typeof row, row);
        throw new Err.RowNotSaved(e);
    }
}

/***************************
 *      STATISTICS
 ***************************/
const saveGlobalStats = async (stats : ReleaseStats ) : Promise<boolean> => {
    await db.ref(`${TREE.STATISTICS.ROOT}/${TREE.STATISTICS.KEYS.WEB_PAGES}`).set(stats.page_count);
    await db.ref(`${TREE.STATISTICS.ROOT}/${TREE.STATISTICS.KEYS.WEB_RELEASES}`).set(stats.release_count);
    return true;
}

const getPageCount = async () : Promise<number> => {
    const page_count : DataSnapshot = await db.ref(`${TREE.STATISTICS.ROOT}/${TREE.STATISTICS.KEYS.WEB_PAGES}`).once('value')
    return page_count.val();
}

/***************************
 *      STATUS HANDLING
 ***************************/
const saveStatus = ( status_name, status_value ) : Promise<void> => {

    // search key by value
    const valid_status_name = _.findKey(TREE.STATUS.KEYS, item_status_name => item_status_name === status_name);
    if ( !valid_status_name ) {
        throw new Err.InvalidStatusKey(status_name);
    }

    if (TREE.STATUS.KEY_VALUES[status_name]) {
        // Se ho l'elenco dei valori validi, verifoc che quello passato sia uno di quelli validi
        const valid_status_value = _.findKey(TREE.STATUS.KEY_VALUES[valid_status_name], item_status_value  => item_status_value === status_value);
        if ( !valid_status_value) {
            throw new Err.InvalidStatusValue(status_name, status_value);
        }
    }

    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).set(status_value);
}

const deleteStatusName = (status_name : string) : Promise<void> => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).remove();
}

/***************************
 *      QUEUE HANDLING
 ***************************/
const emptyQueue = (queue_name : string) : Promise<void> => {
    return db.ref(`${TREE.QUEUES.ROOT}/${queue_name}`).remove();
}

const enqueue = (queue_name : string, post_data: PostData)  : Promise<void> => {
    // console.log (`enqueue v2 - ${post_data.toString()} `);
    return db.ref(`${TREE.QUEUES.ROOT}/${queue_name}/${post_data.toString()}`).set(post_data);
}

const deleteQueuedItem = (ref: database.Reference) : Promise<void> => {
    console.log (`deleteQueuedItem v1 ${ref.key} `);
    return ref.remove();
};

const moveQueuedItem = async (old_ref : database.Reference, new_queue: string) : Promise<database.Reference> => {
    
    const snapshot : DataSnapshot = await old_ref.once('value');
    const key      : string       = snapshot.key;
    // console.log (`moveQueuedItem v4 ${key} to ${new_queue} `);
    const new_ref : database.Reference = await db.ref(`${TREE.QUEUES.ROOT}/${new_queue}/${key}`)
    new_ref.set(snapshot.val());
    await old_ref.remove();
    return new_ref;
}

/***************************
 *         STATUS
 ***************************/


const getStatusValue = ( status_name : string ) : Promise<string> => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).once("value")
        .then( (snapshot) => {
            if ( !snapshot.exists() ) {
                throw new Err.KeyDoesNotExists(status_name);
            }
            return snapshot.val();
        });
}

 const failIfStateExists = (status_name : string) : Promise<void> => {
    return  getStatusValue(status_name)
        .then( () => {
            throw new Err.KeyAlreadyExists(status_name);
        })
        .catch( reason => {
            if (reason instanceof Err.KeyDoesNotExists) {
                // Assorbo l'errore, perchè per questa function è
                // ok se la chiave  NON esiste
                return;
            }
            throw new Error(reason);
        } )
}




export default { 
    TREE,
    saveTorrentRow,
    // removeNode, mustUpdateCache, getStatusValue,
    deleteStatusName, 
    saveStatus, failIfStateExists, 
    emptyQueue, enqueue, moveQueuedItem, deleteQueuedItem,
    saveGlobalStats, getPageCount
};
