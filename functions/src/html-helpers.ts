
import * as htmlparser from 'htmlparser2';
import * as Domhandler from 'domhandler';
import * as _ from 'lodash';
import { PageContent } from './tntvillage';
import { inspect }  from 'util';

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
const findChildrenByName = (parent_dom, tag_name : string) : any [] => {
    if (!parent_dom.children) return null;
    return _.filter(parent_dom.children, item => {
        if (!item.name) return false;
        return (item.name === tag_name);
    });
}
/*
const getChildrenDictionaryByTagName = (parent_dom, tag_name : string) =>  {

}
*/

const htmlParserHandler = (error, dom) : void  => {
        
    console.warn ("htmlParserHandler v82" );
    parseHtmlResult = '';

    if (error) { parseHtmlResult = "<PRE>\n" + error.toString() + "<PRE>\n"; return; }

    // Prendo tra i tag radice solo il div che contiene la tabella
    const div_showrelease_tb    = findByNameAndClass (dom, "div", "showrelease_tb");
    const table_element         = findChildByBame (div_showrelease_tb, "table");
    const table_rows : any[]    = findChildrenByName(table_element, "tr");

    // { row_index : {  cell_index : [ cell_children_keys ]  }  }
    const table_cells : any     = _.map(table_rows, (row, row_index) => {

        const table_td = findChildrenByName (row, "td");
        const table_td_children = _.map(table_td, (cell, col_index : number)=> { 

            const children_keys = _.map(cell.children, (child, child_index) => {
                
                const keys = _.keys(child);
                if (row_index == 0) {
                    console.log (`row ${row_index}, col ${col_index}`, keys);
                }
                
                return { child_index : child_index, child_keys : keys };
            });
            return { col_index: col_index, children_keys : children_keys};
        });
        const row_data = { row_index: row_index, cells : table_td_children };
        return row_data;
    });

    parseHtmlResult = "<PRE>\n" + inspect(table_cells) + "<PRE>\n";
};

const parseHtml = (page_content : string) : PageContent => {

    const parser = new htmlparser.Parser(new Domhandler(htmlParserHandler));
    parser.write(page_content);
    parser.end();

    return new PageContent(parseHtmlResult, 0, 0);
};

let parseHtmlResult : string; 

export { parseHtml, parseHtmlResult };
