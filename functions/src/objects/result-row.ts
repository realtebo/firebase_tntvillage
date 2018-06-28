import * as uuidv5 from 'uuid/v5';

interface json_fmt {
    magnet : string,
    title  : string,
    info   : string,
    discard_reason? : string,
    notified? : boolean,
};

class SimplyResultRow{

    private magnet : string;
    private title  : string;
    public info   : string;
    public discard_reason : string;
    public notified : boolean;

  
    constructor(json : json_fmt){
        this.magnet = json.magnet;
        this.title  = json.title;
        this.info   = json.info;
        if (json.discard_reason) {
            this.discard_reason = json.discard_reason;
        }
        if (json.notified) {
            this.notified = json.notified;
        }
    };

    get hash () : string {
        const out : string = uuidv5(this.magnet, uuidv5.URL).split("-").join("/");
        return out;
    };   

    get discarded() : boolean {
        return (typeof this.discard_reason !== 'undefined');
    }

    public toString = () : string =>  {
        return this.title + "\n" + this.info + (this.discard_reason ? "\n" + "Scatato perchè: " + this.discard_reason : "");
    }

    public toJson = () : json_fmt => {
        const out  : json_fmt = {
            "magnet" : this.magnet, 
            "title" : this.title, 
            "info" : this.info, 
        };
        if (this.discard_reason) {
            out.discard_reason = this.discard_reason;
        }
        if (this.notified) {
            out.notified = this.notified;
        }
        return out;
    }
}

class ResultRow {

    readonly magnet_link: string;
    readonly category_id: number;
    readonly leech_count: number;
    readonly seed_count: number;
    readonly title_link_text: string;
    readonly title_text: string;

    constructor(
        magnet_link: string,
        category_id: number,
        leech_count: number,
        seed_count: number,
        title_link_text: string,
        title_text: string
    ){
        this.magnet_link        = magnet_link;
        this.category_id        = category_id;
        this.leech_count        = leech_count;
        this.seed_count         = seed_count;
        this.title_link_text    = title_link_text;
        this.title_text         = title_text;
    };

    get hash () : string {
        const out : string = uuidv5(this.magnet_link, uuidv5.URL);
        return out;
    };
}

export { SimplyResultRow, json_fmt };

export default ResultRow;