
import *  as htmlparser from 'htmlparser2';
import * as domhandler from 'domhandler';
import * as _ from 'lodash';
import { PageContent } from './tntvillage';

const parseHtml = (page_content : string) : PageContent => {

    let table_content;

    const handler = new domhandler( (error, dom) =>  {
        
        console.log ("handler v28" );

        if (error) { console.log ("error", error); return new PageContent("error " + error, 0 ,0); }

        // Prendo solo il div che contiene la tabella
        const div_showrelease_tb = _.find(dom, item => {
            return item.name === "div" && item.attribs.class === "showrelease_tb";
        });

        table_content +=  _.map(div_showrelease_tb, (item) => {
            
            if ( item === null) { return {}; }
            const out = {
                // type     : item.type,
                name     : item.name, 
                attribs  : (item.attribs ? _.keys(item.attribs) : null ),
                children : (item.children ? item.children.length : null)
            };
            console.log (out);
            return out;
        });

        return true;
    });

    const parser = new htmlparser.Parser(handler);

    parser.write(page_content);
    parser.end();

    return  new PageContent(table_content, 0, 0);
};

export { parseHtml };
