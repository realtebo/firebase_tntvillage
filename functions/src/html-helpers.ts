import * as htmlparser from 'htmlparser2';
import { PageContent } from './tntvillage';

const parseHtml = (page_content : string) : PageContent => {
    
    let in_total_span = false;
    let text_counter = 0;
    let release_count = 0;
    let tot_pages = 0;
    let in_release_table_div = false;

    let table_content : string = "";

    const parser = new htmlparser.Parser({
        onopentag: function(name : string, attribs ){
            if(name === "span" && attribs.class === "total"){
                in_total_span =true;
            }
            if (name === 'div' && attribs.class === "ahowrelease_tb") {
                in_release_table_div = true;
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

            if (in_release_table_div) {
                table_content += text + "\n";
            }
        },
        onclosetag: function(tagname){
            if(tagname === "span" && in_total_span){
                in_total_span = false;
            }

            if (tagname === "div" && in_release_table_div) {
                in_release_table_div = false;
            }
        }
    }, {
        decodeEntities: true
    });
    parser.write(page_content);
    parser.end();

    return  new PageContent(table_content, tot_pages, release_count);
};

export { parseHtml };
