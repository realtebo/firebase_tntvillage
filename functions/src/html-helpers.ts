import * as cheerio from 'cheerio';

// NOTA: Google cloud è ancora a Node 6, usare questa sintassi !
// https://nodejs.org/docs/latest-v6.x/api/url.html
import { URL } from 'url';
import { ResultPage } from './tntvillage';
import ResultRow from  './objecsts/result-row';

const getResultRowFromCheerioRowElement = ($ : CheerioStatic, element : CheerioElement) : ResultRow => {
        
    const magnet_link       : string = $(element).find("TD:nth-child(2) A").attr("href");
    const category_link     : string = $(element).find("TD:nth-child(3) A").attr("href");
    const category_id       : number = (category_link ? parseInt(new URL(category_link).searchParams.get('cat')) : 0);
    const leech_count       : number = parseInt($(element).find("TD:nth-child(4)").text());
    const seed_count        : number = parseInt($(element).find("TD:nth-child(5)").text());
    const title_link_text   : string = $(element).find("TD:nth-child(7) A").text();
    const title_text        : string = $(element).find("TD:nth-child(7)").text()

    const row_data = new ResultRow(
        magnet_link,
        category_id,
        leech_count,
        seed_count,
        title_link_text,
        title_text
    );
    return row_data;
};

const parse = (page_content : string) : ResultPage  => {
    
    const $ : CheerioStatic = cheerio.load(page_content);

    const result_rows : ResultRow[] = [];
    $('DIV.showrelease_tb TABLE TR').each( (index :number, element: CheerioElement) : void => {

        let row : ResultRow;
        try {
            row = getResultRowFromCheerioRowElement($, element);
        } catch (e) {
            throw new ParseError(index, "Errore non riconosciuto #1 " + e.message);
        }
        
        try {
            result_rows.push(row); 
        } catch (e) {
            throw new ResultRowError(index, "Errore non riconosciuto #2 " + e.message);
        }
    });

    const page_count      = parseInt($('DIV.pagination FORM SPAN.total').attr('a'));
    const release_count   = parseInt($('DIV.pagination FORM SPAN.total B:nth-child(1)').text());

    const result_page : ResultPage = {
        result_rows    : result_rows,
        total_pages    : page_count,
        total_releases : release_count
    }

    return result_page;
};

class ParseError extends Error {
    
    name  : string  = "ParseError";
    
    readonly index        : number;
    readonly message      : string;

    constructor ( index: number, message? : string  ) {
        super(message);
        this.index = index;
    }

    toString() : string {
        return `${this.name}: Errore alla riga ${this.index} ${this.message ? ": " + this.message : "" }`;
    }
}

class ResultRowError extends Error {
    
    name  : string  = "ResultRowError";
    
    readonly index        : number;
    readonly error_number : number; 
    readonly message      : string;

    constructor ( index: number, message? : string  ) {
        super(message);
        this.index = index;
    }

    toString() : string {
        return `${this.name}: errore alla riga ${this.index} ${this.message ? ": " + this.message : "" }`;
    }
}

export default { 
    parse 
};
