import * as uuidv5 from 'uuid/v5';

interface json_fmt {
    magnet : string,
    title  : string,
    episodes: string,
    info   : string,
    tech_data : string,
    discard_reason? : string,
    notified? : boolean,
    last_seen? : string,
};

class SimplyResultRow{

    private magnet : string;
    private title  : string;
    public info   : string;
    public tech_data : string;
    public discard_reason : string;
    public episodes : string;
    public last_seen: string;
    
    constructor(json : json_fmt){
        this.magnet     = json.magnet;
        this.title      = json.title;
        this.info       = json.info;
        this.episodes   = json.episodes;
        this.tech_data  = json.tech_data;
        if (json.discard_reason) {
            this.discard_reason = json.discard_reason;
        }
        if (json.last_seen) {
            this.last_seen = json.last_seen;
        } else {
            this.last_seen = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
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
        return this.title 
                + "\n" + this.episodes
                + "\n" + this.tech_data
                + "\n" + this.info 
                + "\n" + this.last_seen
                + (this.discard_reason ? "\n" + "Scatato perchè: " + this.discard_reason : "");
    }

    public toJson = () : json_fmt => {
        const out  : json_fmt = {
            "magnet" : this.magnet, 
            "title" : this.title, 
            "info" : this.info, 
            "tech_data" : this.tech_data,
            "episodes" : this.episodes,
            "last_seen" : this.last_seen,
        };
        if (this.discard_reason) {
            out.discard_reason = this.discard_reason;
        }
        return out;
    }
}

export { SimplyResultRow, json_fmt };
