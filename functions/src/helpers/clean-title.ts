import { TitleAndSubtitle, TitleSubEp } from '../objects/result-row';
import { cleanString } from './clean-string';
import { SEAESON_REGEXP_GLOBAL } from './constants';


// Helper privato
const moveToSubtitle = (title : string, patternToMove : string) : TitleAndSubtitle => {

    const clean_pattern : string = cleanString(patternToMove);
    let new_title       : string = cleanString(title);
    let new_subtitle    : string = null;

    if (new_title.includes(clean_pattern) ) {

        const regexp : RegExp = new RegExp(clean_pattern,"ig");
        new_title             = cleanString(new_title.replace(regexp, ""));
        new_subtitle          = clean_pattern;
    }

    return <TitleAndSubtitle>{
        title    : new_title,
        subtitle : new_subtitle
    }
}

/**
 * Dato un titolo, rimuove alcune scritte inutili, passandole al sottotitolo
 * @param {string} title_to_clean String col titolo della serie
 * @returns {TitleSubEp} Oggetto di tipo title_data con titolo pulito ed eventuali sottotitolo e espisodi
 * e string con gli episodi
 */
export const separateDataFromTitle = (title_to_clean : string) : TitleSubEp => {

    let out_subtitle : string = null;
    let cleaned_obj  : TitleAndSubtitle;

    cleaned_obj = moveToSubtitle(title_to_clean, "COMPLETE SEASON");
    out_subtitle = cleaned_obj.subtitle;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "STAGIONE COMPLETA");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "COMPLETA");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "SEASON FINALE");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "V 1080");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "V 720");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "VERSIONE 720P");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "REPACK");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    cleaned_obj = moveToSubtitle(cleaned_obj.title, "FIXED");
    out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned_obj.subtitle : cleaned_obj.subtitle) ;
    
    // Rimuovo le parentesi dall'indicazione dell'anno
    cleaned_obj.title = cleaned_obj.title.replace(/\((20[0-9][0-9])\)/ig, "$1").trim();

    // Rimuovo tutti gli spazi multipli
    cleaned_obj.title = cleaned_obj.title.replace(/\s\s/ig, " ").trim();
    
    // Rimuovo trattino finale, segno di una precedente pulizia
    cleaned_obj.title = cleaned_obj.title.replace(/\-$/, "").trim();

    const episodes_matches : string[] = cleaned_obj.title.match(SEAESON_REGEXP_GLOBAL);
   
    if (episodes_matches === null) {
        throw new Error(`Impossibile matchare stagione/episodi dal titolo ${cleaned_obj.title}`);
    }
    const episodes         : string   = episodes_matches[0].trim();
    
    
    cleaned_obj.title = cleaned_obj.title.replace(episodes, "");

    // Il punto non è accettato da firebase per le chiavi
    cleaned_obj.title     = cleaned_obj.title.replace(".", " ");
    out_subtitle  = (out_subtitle ? out_subtitle.replace(".", " ") : null);  // Per esempio AC5.1 => AC51

    // Rimuovo tutti gli spazi multipli
    // Si questo è ripetuto ma i vari replace precedenti possono averlo reso necessario
    cleaned_obj.title = cleaned_obj.title.replace(/\s\s/ig, " ").trim();

    // Formattazione finale (uppercase e trim)
    cleaned_obj.title = cleanString(cleaned_obj.title);
    
    return <TitleSubEp>{ 
        title    : cleaned_obj.title, 
        subtitle : (out_subtitle ? out_subtitle : null) ,
        episodes : (episodes ? episodes : null),
    };
}
