import * as cheerio from 'cheerio';

// NOTA: Google cloud è ancora a Node 6, usare questa sintassi !
// https://nodejs.org/docs/latest-v6.x/api/url.html
import { URL } from 'url';
import * as _ from 'lodash';

const parse = (page_content : string) : string  => {

    const $ : CheerioStatic = cheerio.load(page_content);

    // Recupero le righe
    const rows : Cheerio = $('DIV.showrelease_tb TABLE TR');
    const mapped : any = rows.map( (row_index: number, element : CheerioElement) : any => {
        const magnet_link = $(element).find("TD:nth-child(2) A").attr("href");
        const row_data =  { [row_index] : {
            magnet_link     : magnet_link,
            category_id     : new URL($(element).find("TD:nth-child(3) A").attr("href")).searchParams.get('cat'),
            leech_count     : $(element).find("TD:nth-child(4)").text(),
            seed_count      : $(element).find("TD:nth-child(5)").text(),
            // I dati seguenti sono nella stessa row ma è corretto
            title_children  : $(element).find("TD:nth-child(7)").children().length,
            title_link_text : $(element).find("TD:nth-child(7) A").text(),
            title_text      : $(element).find("TD:nth-child(7)").text(),
        }};
        return row_data;
    }).get();   // non dimenticare MAI il get dopo un map quando usi Cheerio!

    // solo per debug
    const html2 = [ 

        $.html($("<H2>").html("parse 45")),

        $.html(
            $("<PRE>").html(JSON.stringify(mapped[1], null, 2))
        )
    ].join("\n");

    return html2;
    
};



export default { parse };
