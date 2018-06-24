import * as _ from 'lodash';
import Strings from '../strings-helpers';
import * as Err from '../tntvillage/errors';
import { CATEGORIES } from '../tntvillage';

/**
 * Incapsula i dati per una query (i dati postati)
 */
export class PostData {

    public readonly page_number: number;
    public readonly category: number;
    public readonly search: string;

    constructor(page_number: number, category: number, search: string = '') {

        if (page_number <=0) {
            throw new Err.PostError(`${page_number} non valido`);
        } 
        this.page_number = page_number;

        const valid_cat_number = _.findKey(CATEGORIES, item_val => item_val === category);
        if (valid_cat_number === undefined) {
            throw new Err.PostError(`Categoria ${category} non valida, usare una delle seguenti: ${CATEGORIES.ANY} o ${CATEGORIES.TV_SHOW}`);
        }
        this.category = category;

        this.search = search.trim();
    }

    public toString() : string {
        return `cat=${this.category}&page=${this.page_number}&srcrel=${this.search}`;
    }

    get cache_file_path(): string {
        const path : string = Strings.getCachePathFromQuery(this.page_number, this.category);
        console.warn ('PostData cache_file_path', this.page_number, this.category, path);
        return path;
    }
}

export default PostData;
