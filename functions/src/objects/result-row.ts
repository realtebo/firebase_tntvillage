import { makeHashAsPath } from '../helpers/make-hash';
import { nowAsString } from '../helpers/now-as-string';

/**
 * @interface
 */
interface TitleAndSubtitle {
    title  : string,
    subtitle?: string,
}

/**
 * @interface
 */
interface TitleSubEp extends TitleAndSubtitle {
    episodes: string,
}

/**
 * @interface
 */
interface json_fmt extends TitleSubEp {
    magnet : string,
    info   : string,
    tech_data : string,
    discard_reason? : string,
    notified? : boolean,
    last_seen? : string,
    image_url? : string,
};

class SimplyResultRow{

    public magnet           : string;
    public title            : string;
    public subtitle         : string;
    public info             : string;
    public tech_data        : string;
    public discard_reason   : string;
    public episodes         : string;
    public last_seen        : string;
    public image_url        : string;
    
    constructor(json : json_fmt){

        this.magnet     = json.magnet;
        this.title      = json.title;

        if (json.subtitle) {
            this.subtitle = json.subtitle;
        }

        this.info       = json.info;
        this.episodes   = json.episodes;
        this.tech_data  = json.tech_data;

        if (json.discard_reason) {
            this.discard_reason = json.discard_reason;
        }

        if (json.last_seen) {
            this.last_seen = json.last_seen;
        } else {
            this.last_seen = nowAsString();
        }
        
        if (json.image_url) {
            this.image_url = json.image_url;
        }
    };

    get hash () : string {
        const out : string = makeHashAsPath(this.magnet);
        return out;
    };   

    get discarded() : boolean {
        return (typeof this.discard_reason !== 'undefined');
    }

    public toString = () : string =>  {
        return this.title 
                + (this.subtitle ? "\n" + this.subtitle : "");
                + "\n" + this.episodes
                + "\n" + this.tech_data
                + "\n" + this.info 
                + "\n" + this.last_seen
                + (this.discard_reason ? "\n" + "Scatato perchè: " + this.discard_reason : "");
    }

    public toHtml = () : string => {
        return "<b>" + this.title + "</b>"
            + (this.subtitle ? "\n" + this.subtitle : "")
            + "\n" + this.episodes
            + "\n" + this.tech_data
            + "\n" + this.info ;
    }

    public toJson = () : json_fmt => {
        const out  : json_fmt = {
            "magnet"    : this.magnet, 
            "title"     : this.title, 
            "info"      : this.info, 
            "tech_data" : this.tech_data,
            "episodes"  : this.episodes,
            "last_seen" : this.last_seen,
            'image_url' : this.image_url,
        };
        if (this.discard_reason) {
            out.discard_reason = this.discard_reason;
        }
        if (this.subtitle) {
            out.subtitle = this.subtitle;
        }
        return out;
    }
}

export { SimplyResultRow, json_fmt, TitleAndSubtitle, TitleSubEp };
