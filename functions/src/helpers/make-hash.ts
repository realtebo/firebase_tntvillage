import * as uuidv5 from 'uuid/v5';
import * as _ from 'lodash';
import { cleanString } from './clean-string';

// Data una stringa, ne fà l'hash e lo trasforma in un UIID
// Lasciarlo privato, perchè l'hash deve poi essere accorciato a solo due segmenti
const makeHash = ( string_to_hash : string ) : string => {
    return uuidv5(cleanString(string_to_hash), uuidv5.URL);
}

// Data una stringa, restituisce la stringa hashata sotto forma di path
// pronta per l'uso col db
// Es: af4456/00b3a
export const makeHashAsPath = ( string_to_hash : string ) : string => {
    const hashed_array : string[]   = makeHash(string_to_hash).split("-");
    const first_two_only : string[] = _.take(hashed_array, 2);
    return first_two_only.join("/");
}

// Data una stringa hashata piatta, ricava il percorso
// Utile nella lettura delle notifiche pendenti o già fatte che per 
// praticità sono state salvate come stringhe piatte
// Le stringhe piatte si usano per esempio 
// Es: af4456-00b3a -> af4456/00b3a
export const makePathHashFromFullHash = ( full_hash : string ) : string => {
    return full_hash.split("-").join("/");
}