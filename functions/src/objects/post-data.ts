/**
 * Incapsula i dati per una query (i dati postati)
 */

class PostData {

    public readonly page_number: number;
    public readonly category: number;
    public readonly search: string;

    constructor(page_number: number, category: number, search: string = '') {

        if (page_number <=0) {
            throw new Error(`${page_number} non valido`);
        } 
        this.page_number = page_number;

        // const valid_cat_number = _.findKey(CATEGORIES, item_val => item_val === category);
        /*if (valid_cat_number === undefined) {
            throw new Err.PostError(`Categoria ${category} non valida, usare una delle seguenti: ${CATEGORIES.ANY} o ${CATEGORIES.TV_SHOW}`);
        }
        */
        this.category = category;

        this.search = search.trim();
    }

    public toString() : string {
        return `cat=${this.category}&page=${this.page_number}&srcrel=${this.search}`;
    }

}

export default PostData;
