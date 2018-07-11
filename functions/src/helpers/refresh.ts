import * as cheerio from 'cheerio';

import { db } from '../app-helpers';
import * as network from '../network-helpers';
import Response from '../objects/response';
import { SimplyResultRow, json_fmt, TitleSubEp } from '../objects/result-row';
import { cleanTitle } from './clean-title';
import { searchImage } from './search-image';
import { database } from 'firebase-admin';
import { makeHashAsPath } from './make-hash';
import { cleanString } from './clean-string';

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
        
        const title_and_sub  : TitleSubEp = cleanTitle(title);
        
        title                     = (title_and_sub.title);
        const subtitle  : string  = (title_and_sub.subtitle ? title_and_sub.subtitle : null);
        const episodes  : string  = title_and_sub.episodes;

        // Separo le info tecniche dalle altre note e pulisco il tutto
        const matches  : RegExpMatchArray | null  = info.match(/\[[^\]]*\]/ig);  
        let tech_data  : string                   = (matches ? matches[0] : "").trim();
        tech_data                                 = cleanString(tech_data.replace('[','').replace(']',''));
        info                                      = cleanString(info.replace(tech_data, "").trim());

        // Cerco l'immagine della serie tv
        const hash         : string                = makeHashAsPath(magnet);
        const episode_ref  : database.Reference    = db.ref(`rows/${hash}`);
        const episode_snap : database.DataSnapshot = await episode_ref.once("value");
        let image_url      : string;

        // Per evitare chiamate API inutili, verifico se ce l'avevo già a db
        if (!episode_snap.exists()) {
            image_url = await searchImage(title);
        } else {
            const value : json_fmt = episode_snap.val();
            image_url = value.image_url;
            if (!image_url) {
                image_url = await searchImage(title);
            }
        }

        // Ho tutti i dati per provvedere all'aggiornamento di questa riga
        // La classe SimplyResultRow fa alcune 'cose' e potenzialmente altre 
        // in fase di input/outpt, non è un passaggio inutile
        const json_input  : json_fmt        = {info, title, subtitle, magnet, episodes, tech_data, image_url};
        const row         : SimplyResultRow = new SimplyResultRow(json_input);

        let json_output : json_fmt;
        try {
            json_output = row.toJson();
        } catch (e) {
            console.warn ("Refresh row.toJson throwed " + e.message + " with the row", row) ;
        }

        try {
            await episode_ref.update(json_output);
        } catch (e) {
            console.warn ("Refresh episode_ref.update throwed " + e.message + " with the object", json_output);
        }
    });
        
    await db.ref('refresh').remove();

    return true;
}