import { json_fmt, TitleAndSubtitle, TitleSubEp } from '../objects/result-row';
import { cleanString } from './clean-string';


// Helper privato
const removeThisPattern = (title : string, patternToRemove : string) : TitleAndSubtitle => {

    const cleanPattern     : string =  cleanString(patternToRemove);
    const nearCleanTitle   : string =  cleanString(title);

    if (nearCleanTitle.includes(cleanPattern) ) {

        const regexp        : RegExp = new RegExp(cleanPattern,"ig");
        const new_title     : string = cleanString(nearCleanTitle.replace(regexp, ""));
        const new_subtitle  : string = cleanPattern;

        return <json_fmt>{
            title    : new_title,
            subtitle : new_subtitle
        }

    } else {

        return {
            title
        }
        
    }
}

/**
 * Dato un titolo, rimuove alcune scritte inutili, passandole al sottotitolo
 * @param {string} title_to_clean String col titolo della serie
 * @returns {TitleSubEp} Oggetto di tipo title_data con titolo pulito ed eventuali sottotitolo e espisodi
 * e string con gli episodi
 */
export const cleanTitle = (title_to_clean : string) : TitleSubEp => {

    let out_subtitle : string = null;
    let cleaned : TitleAndSubtitle;

    cleaned = removeThisPattern(title_to_clean, "COMPLETE SEASON");
    if (cleaned.subtitle) { 
        out_subtitle = cleaned.subtitle;
    }

    cleaned = removeThisPattern(cleaned.title, "STAGIONE COMPLETA");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "COMPLETA");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "SEASON FINALE");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "V 1080");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "V 720");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "REPACK");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    // Rimuovo tutti gli spazi multipli
    cleaned.title = cleaned.title.replace(/\s\s/ig, " ").trim();
    // Rimuovo trattino finale, segno di una precedente pulizia
    cleaned.title = cleaned.title.replace(/\-$/, "").trim();

    // Rimuovo numero di serie e numero di episodio (anche in range opzionale)
    const episodes : string  = cleaned.title.match(/s[0-9][0-9](-[0-9][0-9])?e[0-9][0-9](-[0-9][0-9])?/ig)[0].trim();
    let out_title  : string  = cleaned.title.replace(episodes, "");

    // Pulizia finale 
    out_title = cleanString(out_title);
       
    return <TitleSubEp>{ 
        title    : out_title, 
        subtitle : (out_subtitle ? out_subtitle : null) ,
        episodes : (episodes ? episodes : null),
    };
}
