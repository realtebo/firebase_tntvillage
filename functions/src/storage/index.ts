import Strings  from '../strings-helpers';
import { bucket } from '../app-helpers';
import { File, ApiResponse, FileMetadata } from '@google-cloud/storage';
import Err  from './errors';
import Response from '../objects/response';

/*#########################
 #      GESTIONE CACHE
 #########################*/

 /**
  * Scorcatoia
  */
 const saveResponse = (response : Response) : Promise<void>=> {
    console.log(`saveRsponse v1`);
    const file_path : string = response.cache_file_path;
    console.log(`saveRsponse v1`, file_path);
    return saveAsPageCache (response.html, file_path);
 }

/**
 * Salva il contenuto html nello storage come file di cache.
 * Restituisce l'oggetto File appena creato o aggiornato.
 */
const saveAsPageCache = (html: string, cache_file_path: string) : Promise<void> => {

    console.log(`saveAsPageCache v1 -  ${cache_file_path}`);

    if (html.length === 0) {
        throw new Err.EmptyContent(cache_file_path);
    }
    const cache_file_options = { 
        metadata : {
            contentType : 'text/html' 
        }
    };
    const cache_file = bucket.file(cache_file_path);
    
    return cache_file.save(html, cache_file_options);
}

const cacheFileExists = (page_number: number, category_number: number) : Promise<boolean> => {

    console.log(`cacheFileExists v1 -  ${page_number} - ${category_number}`);

    const cache_file_path = Strings.getCachePathFromQuery(page_number, category_number);
    const cache_file = bucket.file(cache_file_path);

    return fileExists(cache_file)
        .then ( () => {
            return true;
        })
        .catch ( reason => {
            // Se il file non esiste, ritorno false
            if (reason instanceof Err.FileNotExists) return false;

            // Arrivo qui se c'è un tipo di errore che NON conosco
            throw reason;
        })
}

/**
 * Rimuove un file di cache partendo dal numero di pagina
 * e dal numero della categoria.
 * Se il file non esisteva, restituisce true, senza generare
 * errori.
 */
const deleteCacheFileIfExists = (page_number: number, category_number: number) : Promise<boolean> => {

    console.warn(`deleteCacheFileIfExists v10 -  ${page_number} - ${category_number} - `+ (typeof Strings.getCachePathFromQuery));
    return Promise.resolve(true);
    /*
    const cache_file_path : string = Strings.getCachePathFromQuery(page_number, category_number);
    const cache_file      : File   = bucket.file(cache_file_path);
    
    // Delete cache file if exists
    return fileExists(cache_file)
        .then( () => {
            return removeFile (cache_file);
        })
        .catch( reason => {
            if (reason instanceof Err.FileNotExists) return true;
            throw reason;
        });
    */
}

/*#########################
 *      LOW_LEVEL
 #########################*/

/**
 * Rimozione di un file partendo dall'oggetto file 
 */
const removeFile = async (file_as_object : File) : Promise<boolean> => {
    
    try {
        await file_as_object.delete();
    } catch (error) { 
        if (error.code ===  404 ) {
            // Il file semplicemente non esiste più, non è un errore
            return true;
        }
        throw error; 
    }
    return true;
}


/**
 * Shortcut, dato un oggetto file restituisce un booleano
 */
const fileExists =  (file_as_object : File) : Promise<boolean> => {
    // file_exists è un array da un solo elemento boolean
    return file_as_object.exists()
        .then( (result : [Boolean]) => {
            if (result[0] === true) {
                return true;
            }
            throw new Err.FileNotExists(file_as_object);
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

/**
 * Scorciatoia
 */
const fileFromPath = ( path: string ) : File => {

    if(typeof path === "undefined") {
        throw new Err.PathUndefined();
    }

    if (path.trim().length  === 0) {
        throw new Err.PathEmpty();
    }
    return bucket.file(path);
}

const readFile = async ( path: string) : Promise<string> => {

    if (typeof path === 'undefined') {
        throw new Err.PathUndefined();
    }
    const file : File            = await fileFromPath(path);
    const fileContent : [Buffer] = await file.download();
    const html : string          = await fileContent[0].toString();
    return html
}

export default { 
    saveAsPageCache, saveResponse,
    fileExists, cacheFileExists,
    removeFile, readFile,
    deleteCacheFileIfExists,
};
