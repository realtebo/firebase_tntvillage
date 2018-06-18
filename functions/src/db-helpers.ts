import { db } from './app-helpers';
import * as _ from "lodash";
import { PostData } from './tntvillage';
import { database } from 'firebase-admin';
import { DataSnapshot } from 'firebase-functions/lib/providers/database';

const TREE = {
    "STATUS" : {
        "ROOT" : '/status',
        "KEYS" : {
            "GET_PAGE_INDEX" : 'getPageIndex'
        },
        "KEY_VALUES" : {
            "GET_PAGE_INDEX" : {
                'REQUESTED'          : 'requested',
                'DELETING_OLD_CACHE' : 'deleting_old_cache',
                'FETCHING_INDEX'     : 'fetching_index',
                'SAVING_CACHE'       : 'saving_cache',
                'CREATING_QUEUE'     : 'creating_queue',
                'CACHE_SAVED'        : 'cache_saved',
            }
        }
    },
    "QUEUES" : {
        "ROOT" : '/queues',
        "KEYS" : {
            "DONWLOAD"     : 'download',
            "DONWLOADABLE" : 'downloadable',
            "DONWLOADING"  : 'downloading',
            "PARSABLE"     : 'parsable',
        }
    }
};

const ONLINE_RELEASE_COUNT = '/online_release_count';

// La function aggiorna a db il campo ONLINE_RELEASE_COUNT, che viene sorvegliato
// altrove per verificare se la cache va cancellata o meno
const setReleaseCount = async (release_count) => {
    await db.ref(ONLINE_RELEASE_COUNT).set(release_count);
    return true;
}

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

const moveQueuedItem = (oldRef : database.Reference, new_queue: string) : Promise<void> => {
    return oldRef.once('value')
        .then( (snap : DataSnapshot) =>  {
            return db.ref(`${TREE.QUEUES.ROOT}/${new_queue}`).push( snap.val())
        })
        .then( () => {
            return oldRef.remove();
        });
}


/***************************
 *          OTHERS
 ***************************/


const getStatusValue = ( status_name ) : Promise<string> => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).once("value")
        .then( (snapshot) => {
            if ( !snapshot.exists() ) {
                throw new KeyDoesNotExistsError(status_name);
            }
            return snapshot.val();
        });
}

const failIfStateExists = (status_name) : Promise<void> => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).once("value")
        .then( (snapshot) => {
            if (snapshot.exists()) {
                throw new KeyAlreadyExistsError(status_name); 
            } 
            // Resolve th promise
            return;
        });
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
    saveStatus, failIfStateExists,
    emptyQueue, enqueue, moveQueuedItem, deleteQueuedItem
};