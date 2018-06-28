const pad = (num:number, size:number): string => {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
};

const getCachePathFromQuery = (page_number: number, category_number: number) : string => {
    const padded_page_number     : string = pad(page_number, 5);
    const padded_category_number : string = pad(category_number, 2);
    const out : string = `/category-${padded_category_number}/page-${padded_page_number}.html`;
    return out;
}

export { 
    getCachePathFromQuery, 
    pad 
}
