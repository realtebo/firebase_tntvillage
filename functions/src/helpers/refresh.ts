import * as cheerio from 'cheerio';

import { db } from '../app-helpers';
import * as network from '../network-helpers';
import Response from '../objects/response';
import { SimplyResultRow, json_fmt, TitleSubEp } from '../objects/result-row';
import { separateDataFromTitle } from './clean-title';
import { searchImage } from './search-image';
import { database } from 'firebase-admin';
import { makeHashAsPath } from './make-hash';
import { cleanString } from './clean-string';
import { nowAsString } from './now-as-string';

export const refresh = async () : Promise<boolean> => {

    const snapshot = await db.ref('refresh').once('value');
    if (snapshot.exists()) {
        throw new Error("refresh flag presente, refresh interrotto");
    }

    await db.ref('refresh').set(true);

    const response : Response = await network.getPage(1, 29 );
    const $ : CheerioStatic   = cheerio.load(response.html);
    const rows : Cheerio      = $('DIV.showrelease_tb TABLE TR:not(:first-child)');

    await rows.each( async (index :number, element: CheerioElement) : Promise<void> => {
        const magnet      : string = $(element).find("TD:nth-child(2) A").attr("href").trim();
        let title         : string = $(element).find("TD:nth-child(7) A").text().trim();
        let info          : string = $(element).find("TD:nth-child(7) ").clone().children().remove().end().text().trim();
        
        // Title esce da qua già passato da cleanTitle, il quale lo passa anche a cleanString
        const title_and_sub  : TitleSubEp = separateDataFromTitle(title);
        
        title                     = (title_and_sub.title);
        const subtitle  : string  = (title_and_sub.subtitle ? title_and_sub.subtitle : null);
        const episodes  : string  = title_and_sub.episodes;

        // Tolgo i dati tecnici dalle altre info, e pulisco il tutto
        // Si noti che tech_data sono privati di '[', ']', e '.' perchè non sono validi
        // nelle chiavi
        const matches  : RegExpMatchArray | null  = info.match(/\[[^\]]*\]/ig);  
        let tech_data  : string                   = (matches ? matches[0] : "").trim();
        info                                      = cleanString(info.replace(tech_data, "").trim());
        tech_data                                 = tech_data.replace('[','').replace(']','');
        tech_data                                 = cleanString(tech_data.replace('.',''));
        
        // Cerco l'immagine della serie tv
        const hash           : string                = makeHashAsPath(magnet);
        const episode_ref    : database.Reference    = db.ref(`rows/${hash}`);
        const image_url      : string                = await searchImage(episode_ref, title);
        let discard_reason   : string;

        // Verifico se è una delle serie tv che si è deciso di ignorare
        let banned                 : boolean               = false;
        const show_already_banned  : database.DataSnapshot = await db.ref(`banned_shows/${title}`).once('value');
        if (show_already_banned.exists()) {
            await db.ref(`banned_shows/${title}`).remove();
            discard_reason = 'Serie TV ignorata';
            banned         = true;
        }
        // Verifica alternativa, usando il nuovo sistema ad albero
        const show_already_banned_v2  : database.DataSnapshot = await db.ref(`tv_show/${title}/banned`).once('value');
        if (show_already_banned_v2.exists()) {
            if (show_already_banned_v2.val() === true) {
                discard_reason = 'Serie TV ignorata';
                banned         = true;
            }
        }

        // Ho tutti i dati per provvedere all'aggiornamento di questa riga
        // La classe SimplyResultRow fa alcune 'cose' e potenzialmente altre 
        // in fase di input/outpt, non è un passaggio inutile
        const json_input  : json_fmt        = {
            info, title, subtitle, magnet, episodes, tech_data, image_url, banned, discard_reason
        };
        const row         : SimplyResultRow = new SimplyResultRow(json_input);

        let json_output : json_fmt;
        try {
            json_output = row.toJson();
            console.info('Refresh - Da Input', json_input, 'ottengo', json_output );
        } catch (e) {
            console.warn ("Refresh - row.toJson() throwed " + e.message ," from input: ", json_input, "to the row object", row) ;
        }

        try {
            await episode_ref.update(json_output);
        } catch (e) {
            console.warn ("Refresh - episoderef.update throwed " + e.message, "from input ", json_input, ", while update updating the object", json_output);
        }

        try {
            await saveRowAsTreeInfo (row);
        } catch (e) {
            console.warn ("Refresh - saveRowAsTreeInfo throwed " + e.message, "from input ", json_input, "with the row obj", row);
        }
    });
        
    await db.ref('refresh').remove();

    return true;
}

const saveRowAsTreeInfo = async (row : SimplyResultRow) : Promise<void> => {
    
    const tree_ref  : database.Reference    = db.ref(`tv_show/${row.title}`);
    const tree_snap : database.DataSnapshot = await tree_ref.once("value");

    const now_as_string : string = nowAsString();

    if (tree_snap.exists()) {
        tree_ref.update({ 
            updated_on:   now_as_string,
            banned:       row.banned,
            banned_since: now_as_string,
        });

    } else {
        tree_ref.set({ 
            created_on:   now_as_string ,
            banned:       row.banned,
            banned_since: now_as_string,
        })
    }
}