import axios, { AxiosResponse, AxiosError } from 'axios';
import PostData from './post-data';
import Response from './response';

const QUERY_BASE_URL = 'http://www.tntvillage.scambioetico.org/src/releaselist.php';

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
            .then( (response: AxiosResponse ) => {
                const tntResponse = new Response( this.post_data, response);
                return tntResponse;
            })
            .catch((reason : AxiosError) => {
                console.warn(reason);
                const tntResponse  = new Response(this.post_data, {
                    data : '',
                    statusText : 'Errore ' + reason.code + ', ' + reason.message, 
                    status : parseInt(reason.code),
                    headers : null,
                    config : reason.config,
                });
                return tntResponse;
            })
            
    }
}

export default Query;
