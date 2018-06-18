import axios, { AxiosResponse } from 'axios';
import * as _ from 'lodash';
import { getCachePathFromQuery } from './strings-helpers';

const TNTVILLAGE_CATEGORY_CODES = {
    ANY : 0,
    TV_SHOW : 29
};

const TNTVILLAGE_QUERY_BASE_URL = 'http://www.tntvillage.scambioetico.org/src/releaselist.php';

/**
 * Oggetto usato per recuperare i dati da TNTVillage
 */
class TntVillageQuery {

    private readonly post_data: TntVillagePostData;

    constructor(post_data: TntVillagePostData) {
        this.post_data = post_data;
    }

    /**
     * Scarica una pagina da TNTVillage
     */
    public execute() : Promise<TntVillageResponse> {

        const config = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            responseType: 'blob',
        }
        const data_to_post = this.post_data.toString();

        // console.log (`base url: ${TNTVILLAGE_QUERY_BASE_URL}`);
        // console.log (`data_to_post: ${data_to_post}`);

        return axios.post(TNTVILLAGE_QUERY_BASE_URL, data_to_post, config)
            .then( response => {
                const tntResponse = new TntVillageResponse( this.post_data, response);
                if (response.status !== 200) {
                    throw new TntVillaStatusCodeError(tntResponse);
                }
                return tntResponse;
            })
            
    }
}

/**
 * Incapsula i dati per una query (i dati postati)
 */
class TntVillagePostData {

    public readonly page_number: number;
    public readonly category: number;
    public readonly search: string;

    constructor(page_number: number, category: number, search: string = '') {

        if (page_number <=0) {
            throw new TntVillagePostError(`${page_number} non valido`);
        } 
        this.page_number = page_number;

        const valid_cat_number = _.findKey(TNTVILLAGE_CATEGORY_CODES, item_val => item_val === category);
        if (valid_cat_number === undefined) {
            throw new TntVillagePostError(`Categoria ${category} non valida, usare una delle seguenti: ${TNTVILLAGE_CATEGORY_CODES}`);
        }
        this.category = category;

        this.search = search.trim();
    }

    public toString() : string {
        return `cat=${this.category}&page=${this.page_number}&srcrel=${this.search}`;
    }
}

/**
 * Incapsula i dati della query (i dati postati) e del response 
 * come restituito da Axios
 */
class TntVillageResponse {
    public readonly post_data : TntVillagePostData;
    public readonly status: number;
    public readonly status_text: string;
    public readonly data: string;
    public readonly data_length: string;

    constructor(post_data: TntVillagePostData, response: AxiosResponse) {
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
        return getCachePathFromQuery(this.post_data.page_number, this.post_data.category);
    }
}

/**
 * Dati estrapolati da una pagina
 */
class TntVillagePageContent {
    constructor (readonly total_pages: number, readonly total_releases: number) {};
}


/*###############################
  #     CUSTOM ERRORS
  ##############################*/

class TntVillagePostError extends Error {

    readonly name : string = "TntVillageResponseError";
}

abstract class TntVillageResponseError extends Error {

    readonly name : string = "TntVillageResponseError";
    readonly response: TntVillageResponse;

    constructor(response: TntVillageResponse, message?: string) {
        super(message);
        this.response = response;
    }
}

class TntVillaStatusCodeError extends TntVillageResponseError {
    
    readonly name : string = "TntVillaStatusCodeError";

    toString() {
        if (this.message) { return super.toString() };
        return `${this.name}: Ricevuto stato HTTP ${this.response.status} nel caricare la pagina ${this.response.post_data.page_number}`;
    }
}

export { 
    TntVillagePostError as Error, 
    TNTVILLAGE_CATEGORY_CODES as CATEGORIES,
    TntVillageQuery as Query,
    TntVillagePostData as PostData,
    TntVillageResponse as Response,
    TntVillagePageContent as PageContent,
 };


