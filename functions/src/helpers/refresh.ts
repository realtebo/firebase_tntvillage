import * as cheerio from 'cheerio';

import { db } from '../app-helpers';
import * as network from '../network-helpers';
import Response from '../objects/response';
import { SimplyResultRow, json_fmt } from '../objects/result-row';

export const refresh = async () : Promise<boolean> => {

    const snapshot = await db.ref('refresh').once('value');
    if (snapshot.exists()) return false; 

    await db.ref('refresh').set(true);

    const response : Response = await network.getPage(1, 29 );
    const $ : CheerioStatic   = cheerio.load(response.html);
    const rows : Cheerio      = $('DIV.showrelease_tb TABLE TR:not(:first-child)');

    await rows.each( async (index :number, element: CheerioElement) : Promise<void> => {
        const magnet      : string = $(element).find("TD:nth-child(2) A").attr("href").trim();
        let title         : string = $(element).find("TD:nth-child(7) A").text().trim();
        let info          : string = $(element).find("TD:nth-child(7) ").clone().children().remove().end().text().trim();

        // Rimuovo numero di serie e numero di episodio (anche in range opzionale)
        const episodes    : string  = title.match(/s[0-9][0-9](-[0-9][0-9])?e[0-9][0-9](-[0-9][0-9])?/ig)[0].trim();
        title                       = title.replace(episodes, "").trim();

        // Separo le info tecniche dalle altre note
        const matches               = info.match(/\[[^\]]*\]/ig);  
        const tech_data   : string  = (matches ? matches[0] : "").trim();
        info                        = info.replace(tech_data, "").trim();

        const json : json_fmt = {info, title, magnet, episodes, tech_data};
        const row : SimplyResultRow = new SimplyResultRow(json);
        const hash : string = row.hash;

        // console.log ("Aggiorno ", hash);
        await db.ref(`rows/${hash}`).update(row.toJson());
    });
        
    await db.ref('refresh').remove();

    return true;
}