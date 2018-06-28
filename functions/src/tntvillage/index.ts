
import ResultRow from  '../objects/result-row';

export const CATEGORIES = {
    ANY : 0,
    TV_SHOW : 29
};

export class ResultPage {
    constructor(
        readonly result_rows: ResultRow[], 
        readonly total_pages: number, 
        readonly total_releases: number
    ){};
}



