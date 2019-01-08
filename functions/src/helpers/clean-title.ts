import { TitleAndSubtitle, TitleSubEp } from '../objects/result-row';
import { cleanString } from './clean-string';
import { SEAESON_REGEXP_GLOBAL } from './constants';


// Helper privato
const moveToSubtitle = (title: string, patternToMove: string): TitleAndSubtitle => {

    const clean_pattern: string = cleanString(patternToMove);
    let new_title: string = cleanString(title);
    let new_subtitle: string = null;

    if (new_title.includes(clean_pattern)) {

        const regexp: RegExp = new RegExp(clean_pattern, "ig");
        new_title = cleanString(new_title.replace(regexp, ""));
        new_subtitle = clean_pattern;


    }

    return <TitleAndSubtitle>{
        title: new_title,
        subtitle: new_subtitle
    }
}

// Helper usato per decidere se e come appendere nuove stringhe al sottotitolo
// Evita un bug che appendeva una fila di stringhe "null", bug comparso ad inizio settembre 
// 2018
const appendToSubtitle = (actual_subtitle: string, what_to_append: string): string => {

    const cleaned_actual = cleanString(actual_subtitle);
    const cleaned_to_append = cleanString(what_to_append);

    if (cleaned_actual !== null && cleaned_actual !== "") {
        if (cleaned_to_append !== null && cleaned_to_append !== "") {
            return cleaned_actual + " " + cleaned_to_append;
        }
        return cleaned_actual;
    }
    if (cleaned_to_append !== null && cleaned_to_append !== "") {
        return cleaned_actual + " " + cleaned_to_append;
    }
    return "";
}


/**
 * Dato un titolo, rimuove alcune scritte inutili, passandole al sottotitolo
 * @param {string} title_to_clean String col titolo della serie
 * @returns {TitleSubEp} Oggetto di tipo title_data con titolo pulito ed eventuali sottotitolo e espisodi
 * e string con gli episodi
 */
export const separateDataFromTitle = (title_to_clean: string): TitleSubEp => {

    let out_subtitle: string = null;
    let cleaned_obj: TitleAndSubtitle;

    cleaned_obj = moveToSubtitle(title_to_clean, "COMPLETE SEASON");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "STAGIONE COMPLETA");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "COMPLETA");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "SEASON FINALE");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "V 1080");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "V 720");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "VERSIONE 720P");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "VERSIONE 720");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "REPACK");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    cleaned_obj = moveToSubtitle(cleaned_obj.title, "FIXED");
    out_subtitle = appendToSubtitle(out_subtitle, cleaned_obj.subtitle);

    // Rimuovo le parentesi dall'indicazione dell'anno
    cleaned_obj.title = cleaned_obj.title.replace(/\((20[0-9][0-9])\)/ig, "$1").trim();

    // Rimuovo tutti gli spazi multipli
    cleaned_obj.title = cleaned_obj.title.replace(/\s\s/ig, " ").trim();

    // Rimuovo trattino finale, segno di una precedente pulizia
    cleaned_obj.title = cleaned_obj.title.replace(/\-$/, "").trim();

    const episodes_matches: string[] = cleaned_obj.title.match(SEAESON_REGEXP_GLOBAL);

    let episodes: string;
    if (episodes_matches !== null) {
        episodes = episodes_matches[0].trim();
        cleaned_obj.title = cleaned_obj.title.replace(episodes, "").trim();
    }


    // Il punto non è accettato da firebase per le chiavi
    cleaned_obj.title = cleaned_obj.title.replace(/\./g, " ").trim();
    out_subtitle = (out_subtitle ? out_subtitle.replace(/\./g, " ").trim() : null);  // Per esempio AC5.1 => AC51

    // Rimuovo tutti gli spazi multipli
    // Si questo è ripetuto ma i vari replace precedenti possono averlo reso necessario
    cleaned_obj.title = cleaned_obj.title.replace(/\s\s/ig, " ").trim();

    // Formattazione finale (uppercase e trim)
    cleaned_obj.title = cleanString(cleaned_obj.title);

    return <TitleSubEp>{
        title: cleaned_obj.title,
        subtitle: (out_subtitle ? out_subtitle : null),
        episodes: (episodes ? episodes : null),
    };
}
