
import *  as htmlparser from 'htmlparser2';
import * as domhandler from 'domhandler';
import * as _ from 'lodash';
import { PageContent } from './tntvillage';

// Trova un unico elemento in una collection/arrray
const findByNameAndClass = (dom, name : string, class_name : string) => {
    return _.find(dom, item => {
        return (
            (item.name === name) 
            && (item.attribs.class === class_name)
        );
    });
}

// Trova un unico elemento in una collection/arrray
const findByName = (dom, name) => {
    return _.find(dom, item => {
        if (!item.name) return false;
        return (item.name === name);
    });
}

// Prende i children, se ce ne sono, e cerca un SINGOLO tag per nome
const findChildByBame = (parent_dom, tag_name) => {
    if (!parent_dom.children) return null;
    return findByName(parent_dom.children, tag_name);
}

// Prende i children, se ce ne sono, cerca TUTTI i tag per nome
const findChildrenByName = (parent_dom, tag_name : string) : any []=> {
    if (!parent_dom.children) return null;
    return _.filter(parent_dom.children, item => {
        if (!item.name) return false;
        return (item.name === tag_name);
    });
}

const parseHtml = (page_content : string) : PageContent => {

    let table_content;
    const handler = new domhandler( (error, dom) =>  {
        
        console.warn ("handler v58" );

        if (error) { console.log ("error", error); return new PageContent("error " + error, 0 ,0); }

        // Prendo tra i tag radice solo il div che contiene la tabella
        const div_showrelease_tb    = findByNameAndClass (dom, "div", "showrelease_tb");
        const table_element         = findChildByBame (div_showrelease_tb, "table");
        const table_rows : any[]    = findChildrenByName(table_element, "tr");
        const table_cells : any[][] = _.map(table_rows, (item, key) => {
            console.log ("riga ", key);
            const cells = findChildrenByName (item.children, "td");
            console.log (cells);
            return cells;
        }) 
        console.log("table_cells nella riga successiva");
        console.log(table_cells);
        return table_cells;

        table_content +=  _.map(table_rows, (item, key) => {
            
            console.log("valuto ... ", key, item.type, item.name, item.data);

            if ( item === null) { 
                console.log (" ... skippo");
                return {}; 
            }

            const out = {
                // type     : item.type,
                name     : item.name, 
                attribs  : (item.attribs ? _.keys(item.attribs) : null ),
                children : (item.children ? item.children.length : null),
                data     : (item.data ? item.data : null),
            };
            console.log ("added item: ", out);
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
