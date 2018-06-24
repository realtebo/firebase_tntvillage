import * as uuidv5 from 'uuid/v5';

class ResultRow {

    private _magnet_link: string;
    public get magnet_link(): string {
        return this._magnet_link;
    }
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
        this._magnet_link       = magnet_link;
        this.category_id        = category_id;
        this.leech_count        = leech_count;
        this.seed_count         = seed_count;
        this.title_link_text    = title_link_text;
        this.title_text         = title_text;
    };

    public hash () {
        return uuidv5(this.magnet_link, uuidv5.URL);
    };
}

export default ResultRow;