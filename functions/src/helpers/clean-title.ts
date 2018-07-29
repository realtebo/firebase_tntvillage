import { TitleAndSubtitle, TitleSubEp } from '../objects/result-row';
import { cleanString } from './clean-string';


// Helper privato
const removeThisPattern = (title : string, patternToRemove : string) : TitleAndSubtitle => {

    const clean_pattern        : string =  cleanString(patternToRemove);
    const semi_cleaned_title   : string =  cleanString(title);

    if (semi_cleaned_title.includes(clean_pattern) ) {

        const regexp        : RegExp = new RegExp(clean_pattern,"ig");
        const new_title     : string = cleanString(semi_cleaned_title.replace(regexp, ""));
        const new_subtitle  : string = clean_pattern;

        return <TitleAndSubtitle>{
            title    : new_title,
            subtitle : new_subtitle
        }

    } else {

        return <TitleAndSubtitle>{
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
export const separateDataFromTitle = (title_to_clean : string) : TitleSubEp => {

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

    cleaned = removeThisPattern(cleaned.title, "VERSIONE 720P");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "REPACK");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    cleaned = removeThisPattern(cleaned.title, "FIXED");
    if (cleaned.subtitle) { 
        out_subtitle = (out_subtitle ? out_subtitle + " " + cleaned.subtitle : cleaned.subtitle) ;
    }

    // Rimuovo le parentesi dall'indicazione dell'anno
    cleaned.title = cleaned.title.replace(/\((20[0-9][0-9])\)/ig, "$1").trim();

    // Rimuovo tutti gli spazi multipli
    cleaned.title = cleaned.title.replace(/\s\s/ig, " ").trim();
    
    // Rimuovo trattino finale, segno di una precedente pulizia
    cleaned.title = cleaned.title.replace(/\-$/, "").trim();

    // Rimuovo numero di serie (anche in range opzione) 
    // e il numero di episodio (anche in range opzionale e anche se a tre cifre, per. es per "Il Segreto")
    const episodes : string  = cleaned.title.match(/s[0-9][0-9](-[0-9][0-9])?e[0-9][0-9]([0-9])?(-[0-9][0-9]([0-9])?)?/ig)[0].trim();
    cleaned.title = cleaned.title.replace(episodes, "");

    // Il punto non è accettato da firebase per le chiavi
    cleaned.title  = cleaned.title.replace(".", " ");

    // Rimuovo tutti gli spazi multipli
    // Si questo è ripetuto ma i vari replace precedenti possono averlo reso necessario
    cleaned.title = cleaned.title.replace(/\s\s/ig, " ").trim();

    // Formattazione finale (uppercase e trim)
    cleaned.title = cleanString(cleaned.title);
       
    const seasons : any  = episodes.match(/s([0-9][0-9](-[0-9][0-9])?)e/ig);

    console.info("Sperimentale: identificazione stagione", cleaned.title, episodes, seasons);

    return <TitleSubEp>{ 
        title    : cleaned.title, 
        subtitle : (out_subtitle ? out_subtitle : null) ,
        episodes : (episodes ? episodes : null),
    };
}
