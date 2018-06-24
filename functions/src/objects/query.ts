import axios from 'axios';
import { QUERY_BASE_URL } from '../tntvillage';
import * as Err  from '../tntvillage/errors';
import PostData from './post-data';
import Response from './response';

/**
 * Oggetto usato per recuperare i dati da TNTVillage
 */
class Query {

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

export default Query;
