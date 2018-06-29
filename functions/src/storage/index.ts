import { bucket } from '../app-helpers';
import { File } from '@google-cloud/storage';
import Err  from './errors';


/*#########################
 #      GESTIONE CACHE
 #########################*/


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
    saveAsPageCache,
    fileExists, 
    removeFile, readFile,
};
