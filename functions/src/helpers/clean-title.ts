import { json_fmt, TitleAndSubtitle, TitleSubEp } from '../objects/result-row';

// Helper privato
const removeThisPattern = (title : string, patternToRemove : string) : TitleAndSubtitle => {

    if (title.trim().toUpperCase().includes(patternToRemove.trim().toUpperCase()) ) {
        const regexp        : RegExp = new RegExp(patternToRemove,"ig");
        const new_title     : string = title.replace(regexp, "").trim();
        const new_subtitle  : string = patternToRemove.trim().toUpperCase();

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
    const episodes   : string  = cleaned.title.match(/s[0-9][0-9](-[0-9][0-9])?e[0-9][0-9](-[0-9][0-9])?/ig)[0].trim();
    const out_title  : string  = cleaned.title.replace(episodes, "").trim();
       
    return <TitleSubEp>{ 
        title    : out_title, 
        subtitle : (out_subtitle ? out_subtitle : null) ,
        episodes : (episodes ? episodes : null),
    };
}
