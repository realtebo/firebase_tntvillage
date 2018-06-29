import { PostData } from './post-data';
import { AxiosResponse } from 'axios';


/**
 * Incapsula i dati della query (i dati postati) e del response 
 * come restituito da Axios
 */
class Response {

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
}

export default Response;
