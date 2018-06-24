import axios, { AxiosResponse } from 'axios';
import * as _ from 'lodash';
import Strings from '../strings-helpers';
import * as Err  from './errors';
import ResultRow from  '../objecsts/result-row';

export const CATEGORIES = {
    ANY : 0,
    TV_SHOW : 29
};

export const QUERY_BASE_URL = 'http://www.tntvillage.scambioetico.org/src/releaselist.php';

export class ResultPage {
    constructor(
        readonly result_rows: ResultRow[], 
        readonly total_pages: number, 
        readonly total_releases: number
    ){};
}



/**
 * Oggetto usato per recuperare i dati da TNTVillage
 */
export class Query {

    private readonly post_data: PostData;

    constructor(post_data: PostData) {
        this.post_data = post_data;
    }

    /**
     * Scarica una pagina da TNTVillage
     */
    public execute() : Promise<Response> {

        const config = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            responseType: 'blob',
        }
        const data_to_post = this.post_data.toString();

        // console.log (`base url: ${QUERY_BASE_URL}`);
        // console.log (`data_to_post: ${data_to_post}`);

        return axios.post(QUERY_BASE_URL, data_to_post, config)
            .then( response => {
                const tntResponse = new Response( this.post_data, response);
                if (response.status !== 200) {
                    throw new Err.StatisCodeError(tntResponse);
                }
                return tntResponse;
            })
            
    }
}

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
            throw new Err.PostError(`Categoria ${category} non valida, usare una delle seguenti: ${CATEGORIES}`);
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

/**
 * Incapsula i dati della query (i dati postati) e del response 
 * come restituito da Axios
 */
export class Response {
    public readonly post_data : PostData;
    public readonly status: number;
    public readonly status_text: string;
    public readonly data: string;
    public readonly data_length: string;

    constructor(post_data: PostData, response: AxiosResponse) {
        this.post_data = post_data;
        this.status = response.status;
        this.status_text = response.statusText;
        this.data = response.data;
        this.data_length = response.data.length
    }

    /**
     * Restituisce il contenuto della pagina
     */
    get html() : string {
        return this.data;
    }

    /**
     * Compone il percorso dove deve essere salvato questo contenuto
     */
    get cache_file_path(): string {
        return Strings.getCachePathFromQuery(this.post_data.page_number, this.post_data.category);
    }
}

