import { cleanString } from './clean-string';

export const cleanTechData = ( string_to_clean : string ) : string => {
    let out : string = cleanString(string_to_clean);
    out = string_to_clean.replace(/\./g, '');
    return out.trim().toUpperCase();
}
