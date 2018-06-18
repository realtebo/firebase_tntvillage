
import { getCachePathFromQuery } from './strings-helpers';
import { bucket } from './app-helpers';
import { File, ApiResponse, FileMetadata } from '@google-cloud/storage';
import * as functions from 'firebase-functions';

/*#########################
 #      GESTIONE CACHE
 #########################*/

/**
 * Salva il contenuto html nello storage come file di cache.
 * Restituisce l'oggetto File appena creato o aggiornato.
 */
const saveAsPageCache = (html: string, cache_file_path: string) : Promise<void> => {

    if (html.length === 0) {
        throw new EmptyContentStorageError(cache_file_path);
    }
    const cache_file_options = { 
        metadata : {
            contentType : 'text/html' 
        }
    };
    const cache_file = bucket.file(cache_file_path);
    
    return cache_file.save(html, cache_file_options);
}

/*
 * Resituisce sempre e solo un boolean
 * Dà true se il file esiste e non è vuoto
const isAlreadyCached = async (page_number : number) : Promise<boolean> => {

    const file = getCacheFileFromStorage (page_number);

    return fileExists(file)
        .then ( () => {
            return getFileSizeByObject(file);
        })
        .then ( (size : number )=> {
            return ( size > 0);
        })
        .catch ( reason => {
            // Se il file non esiste, ritorno false
            if (reason instanceof FileNotExistsStorageError) return false;

            // Arrivo qui se c'è un tipo di errore che NON conosco
            throw reason;
        })
}
*/

/**
 * Rimuove un file di cache partendo dal numero di pagina
 * e dal numero della categoria.
 * Se il file non esisteva, restituisce true, senza generare
 * errori.
 */
const deleteCacheFileIfExists = (page_number: number, category_number: number) : Promise<boolean> => {
    
    const cache_file_path = getCachePathFromQuery(page_number, category_number);
    const cache_file = bucket.file(cache_file_path);
    
    // Delete cache file if exists
    return fileExists(cache_file)
        .then( () => {
            return removeFile (cache_file);
        })
        .catch( reason => {
            if (reason instanceof FileNotExistsStorageError) return true;
            throw reason;
        });
}


/*#########################
 *      LOW_LEVEL
 #########################*/

/**
 * Rimozione di un file partendo dall'oggetto file 
 */
const removeFile = (file_as_object : File) : Promise<boolean> => {
    return file_as_object.delete()
        .then( () => true )
        .catch( error => { throw new FileNotDeletedStorageError(error); } )
}


/**
 * Shortcut, dato un oggetto file restituisce un booleano
 */
const fileExists =  (file_as_object : File) : Promise<boolean> => {
    // file_exists è un array da un solo elemento boolean
    return file_as_object.exists()
        .then( result => {
            if (result[0] === true) {
                return true;
            }
            throw new FileNotExistsStorageError(file_as_object);
        })
}

/**
 * Legge la dimensione di un file
 */
const getFileSizeByObject = (file_as_object : File ) : Promise<number> => {

    // Qui c'è la spiegazione: 
    // https://cloud.google.com/nodejs/docs/reference/storage/1.7.x/global#GetFileMetadataResponse
   return  file_as_object.getMetadata()
        .then ( (metadata : [FileMetadata, ApiResponse]) => {
            const file_metadata = metadata[0];
            const file_size = parseInt(file_metadata['size']);
            return file_size;
        });
}

/*############################
 *         HELPER
 ############################*/

/*
  Metodo unico per risalire al percorso di un file cache dato il
// numero di pagina
const fileNameFromPageNumber = (page_number : number) : string => {
    const padded = pad(page_number, 5);
    return `page-cache/page-${padded}.html`;
    return `/category-${this.post_data.category}/page-${this.post_data.page_number}`;
}
*/
const fileFromPath = ( path: string ) : File => {
    return bucket.file(path);
}


/******************************
 *       ERRORI CUSTOM
 *****************************/

class StorageError extends Error {};

class FileNotDeletedStorageError extends StorageError {

    readonly name="FileNotDeletedStorageError";
};
class FileNotExistsStorageError extends StorageError {

    readonly name="FileNotExistsStorageError";
    readonly file : File;

    constructor(file : File, message?: string) {
        super(message);
        this.file = file;
    }

    toString() : string {
        if (this.message) { return super.toString() };
        let message = "";
        this.file.getSignedUrl()
            .then( url => {
                message = `${this.name}: Il file ${url} non esiste`;
            })
            .catch( reason => {
                message = `${this.name}: Il file non esiste; url ignoto per la segunte ragione ${reason}`;
            });
        return message;
    }
};
class EmptyContentStorageError extends StorageError {

    readonly name="EmptyContentStorageError";
    private readonly cache_path: string;

    constructor(cache_path : string, message?: string) {
        super(message);
        this.cache_path = cache_path;
    }

    toString() : string {
        if (this.message) { return super.toString() };
        return `${this.name}: Impossibile salvare il file ${this.cache_path}, il contenuto da salvare è vuoto`;
    }
};

export { 
    saveAsPageCache, 
    fileExists,
    removeFile,
    deleteCacheFileIfExists,
    fileFromPath,
    FileNotDeletedStorageError,
    FileNotExistsStorageError
};
