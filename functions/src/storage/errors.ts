import { File } from '@google-cloud/storage';

/******************************
 *       ERRORI CUSTOM
 *****************************/

abstract class StorageError extends Error {};

class PathUndefined extends StorageError {

    readonly name="PathUndefinedStorageError";
};

class PathEmpty extends StorageError {

    readonly name="PathEmptyStorageError";
};

class FileNotDeleted extends StorageError {

    readonly name="FileNotDeletedStorageError";
};

class FileNotExists extends StorageError {

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

class EmptyContent extends StorageError {

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

export default {
    PathUndefined,
    PathEmpty,
    FileNotDeleted,
    FileNotExists,
    EmptyContent
}