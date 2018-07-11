import * as uuidv5 from 'uuid/v5';
import { cleanString } from './clean-string';

export const makeHash = ( string_to_hash : string ) : string => {
    return uuidv5(cleanString(string_to_hash), uuidv5.URL);
}

export const makeHashAsPath = ( string_to_hash : string ) : string => {
    return makeHash(string_to_hash).split("-").join("/");
}

export const makePathHashFromFullHash = ( full_hash : string ) : string => {
    return full_hash.split("-").join("/");
}