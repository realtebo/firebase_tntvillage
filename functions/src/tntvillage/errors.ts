import Response from '../objects/response';

/*###############################
  #     CUSTOM ERRORS
  ##############################*/

class TntVillagePostError extends Error {

    readonly name : string = "TntVillageResponseError";
}

abstract class TntVillageResponseError extends Error {

    readonly name : string = "TntVillageResponseError";
    readonly response: Response;

    constructor(response: Response, message?: string) {
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
    TntVillagePostError     as PostError,
    TntVillageResponseError as ResponseError,
    TntVillaStatusCodeError as StatisCodeError,
};