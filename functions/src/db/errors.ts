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
    InvalidStatusKeyError   as InvalidStatusKey,
    InvalidStatusValueError as InvalidStatusValue,
    KeyDoesNotExistsError   as KeyDoesNotExists,
    KeyAlreadyExistsError   as KeyAlreadyExists,    
};
