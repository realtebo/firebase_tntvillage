import { db } from './app-helpers';
import * as _ from "lodash";
import { PostData } from './tntvillage';
import { database } from 'firebase-admin';
import { DataSnapshot } from 'firebase-functions/lib/providers/database';

const TREE = {
    "STATUS" : {
        "ROOT" : '/status',
        "KEYS" : {
            "GET_PAGE_INDEX" : 'getPageIndex',
            "RELEASE_COUNT"  : 'releaseCount',
            "TOTAL_PAGES"    : 'totalPages',
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
 *      QUEUE HANDLING
 ***************************/


const saveStatus = ( status_name, status_value ) : Promise<void> => {

    // search key by value
    const valid_status_name = _.findKey(TREE.STATUS.KEYS, searched_status_name => searched_status_name === status_name);
    if ( !valid_status_name ) {
        throw new InvalidStatusKeyError(status_name);
    }

    // search key by value
    const valid_status_value = _.findKey(TREE.STATUS.KEY_VALUES[valid_status_name], searched_status_value  => searched_status_value === status_value);
    if ( !valid_status_value) {
        throw new InvalidStatusValueError(status_name, status_value);
    }

    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).set(status_value);
}

const deleteStatusName = (status_name : string) : Promise<void> => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).remove();
}

const emptyQueue = (queue_name : string) : Promise<void> => {
    return db.ref(`${TREE.QUEUES.ROOT}/${queue_name}`).remove();
}

const enqueue = (queue_name : string, post_data: PostData)  : database.ThenableReference => {
    return db.ref(`${TREE.QUEUES.ROOT}/${queue_name}`).push(post_data);
}

const deleteQueuedItem = (ref: database.Reference) : Promise<void> => {
    return ref.remove();
};

const moveQueuedItem = async (old_ref : database.Reference, new_queue: string) : Promise<database.Reference> => {
    
    const snapshot : DataSnapshot = await old_ref.once('value');
    const new_ref : database.Reference = await db.ref(`${TREE.QUEUES.ROOT}/${new_queue}`).push(snapshot.val());
    await old_ref.remove();
    return new_ref;
}


/***************************
 *         STATUS
 ***************************/

const updateReleaseCount = (release_count : number) : Promise<void> => {
    const status_name = TREE.STATUS.KEYS.RELEASE_COUNT;
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).set(release_count);
}

const getStatusValue = ( status_name : string ) : Promise<string> => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).once("value")
        .then( (snapshot) => {
            if ( !snapshot.exists() ) {
                throw new KeyDoesNotExistsError(status_name);
            }
            return snapshot.val();
        });
}

 const failIfStateExists = (status_name : string) : Promise<void> => {
    return  getStatusValue(status_name)
        .then( () => {
            throw new KeyAlreadyExistsError(status_name);
        })
        .catch( reason => {
            if (reason instanceof KeyDoesNotExistsError) {
                // Assorbo l'errore, perchè per questa function è
                // ok se la chiave  NON esiste
                return;
            }
            throw new Error(reason);
        } )
}


/***************************
 *      CUSTOM ERRORS
 ***************************/

abstract class DbError extends Error {

};
abstract class KeyDbError extends DbError {
    
    readonly key: string = '';

    constructor(key : string, message?: string) {
        super(message);
        this.key = key;
    }
};
class KeyAlreadyExistsError extends KeyDbError {
    
    readonly name="KeyAlreadyExistsError";

    toString() : String {
        if (this.message) { return super.toString() };
        return `${this.name}: La chiave ${this.key} esiste già`;
    }
};
class KeyDoesNotExistsError extends KeyDbError {

    readonly name="KeyDoesNotExistsError";

    toString() : String {
        if (this.message) { return super.toString() };
        return `${this.name}: La chiave ${this.key} non esiste`;
    }
};
abstract class StatusDbError extends DbError {
    
    protected status_name: string = '';

    constructor(status_name : string, message?: string) {
        super(message);
        this.status_name = status_name;
    }
};
class InvalidStatusKeyError extends StatusDbError {
    
    readonly name = "InvalidStatusKeyError";

    toString() : String {
        if (this.message) { return super.toString() };
        return `${this.name}: lo stato ${this.status_name} non è valido`;
    }
}
class InvalidStatusValueError extends StatusDbError {
    
    readonly status_value : string;
    readonly name = "InvalidStatusValueError";

    constructor(status_name : string, status_value : string, message?: string) {
        super(message);
        this.status_name = status_name;
        this.status_value = status_value;
    }

    toString() : String {
        if (this.message) { return super.toString() };
        return `${this.name}: ${this.status_name} non prevede il valore ${this.status_value}`;
    }
}

export { 
    TREE,
    // removeNode, mustUpdateCache, getStatusValue,
    deleteStatusName, 
    saveStatus, failIfStateExists, updateReleaseCount,
    emptyQueue, enqueue, moveQueuedItem, deleteQueuedItem,
    KeyAlreadyExistsError
};
