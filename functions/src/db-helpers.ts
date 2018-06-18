import { db } from './app-helpers';
import * as _ from "lodash";

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
                'CACHE_SAVED'        : 'cache_saved',
            }
        }
    }
};

const ONLINE_RELEASE_COUNT = '/online_release_count';

// Riceve il numero di release attualmente online
// e risponde con un booleano per indicare se la cache attuale
// va invalidata o meno. La risposta vale per l'intera cache non per
// una singola pagina
const mustUpdateCache = async( online_release_count ) => {
    
    const snapshot = await db.ref(ONLINE_RELEASE_COUNT).once("value");
    const actual_value_in_db = snapshot.val();
    console.log (`Online ci sono ${online_release_count}, in cache ne abbiamo ${actual_value_in_db}` );
    if (actual_value_in_db !== online_release_count) {
        console.log (`C'è la necessità di canellare la cache attuale` );
        return true;
    }
    console.log (`La cache attuale va ancora bene` );
    return false;
}

// Forza la rigenerazione della cache creando, per ciascuna pagina
// da 1 a tot_pages, e forza l'aggiornamento di ONLINE_RELEASE_COUNT 
/*
const setPageIndex = async ({ tot_pages, release_count }) => {

    await setReleaseCount(release_count);
    if (tot_pages === 0) {
        console.warn("setPageIndex - Qualcosa non va, il numero d page è", tot_pages);
        return false;
    }
    for (let page_number = 1; page_number <= tot_pages ; page_number++) {
        await db.ref(`creatingIndex`).set(`${page_number}/${tot_pages}`);
        await setSinglePageStatus(page_number, 'to_read');
    }
    await db.ref(`creatingIndex`).remove();
    return true;
}
*/

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

const deleteStatusName = (status_name : string) => {
    return db.ref(`${TREE.STATUS.ROOT}/${status_name}`).remove();
}

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
};