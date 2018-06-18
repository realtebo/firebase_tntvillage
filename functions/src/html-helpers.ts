import * as htmlparser from 'htmlparser2';
import { PageContent } from './tntvillage';

const parseHtml = (page_content : string) : PageContent => {
    
    let in_total_span = false;
    let text_counter = 0;
    let release_count = 0;
    let tot_pages = 0;
    const parser = new htmlparser.Parser({
        onopentag: function(name, attribs){
            if(name === "span" && attribs.class === "total"){
                in_total_span =true;
            }
        },
        ontext: function(text){
            if (!in_total_span) {
                return;
            }
        
            text_counter++;
       
            if (text_counter === 2 ) {
                release_count = parseInt(text);
                return;
            }
            if (text_counter === 6 ) {
                tot_pages = parseInt(text);
                return;
            }
        },
        onclosetag: function(tagname){
            if(tagname === "span" && in_total_span){
                in_total_span= false;
            }
        }
    }, {
        decodeEntities: true
    });
    parser.write(page_content);
    parser.end();

    return  new PageContent(tot_pages, release_count);
};

export { parseHtml };
