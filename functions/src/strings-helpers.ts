const pad = (num:number, size:number): string => {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
};

const getCachePathFromQuery = (page_number: number, category_number: number): string => {
    const padded_page_number = pad(page_number, 5);
    const padded_category_number = pad(category_number, 2);
    return `/category-${padded_category_number}/page-${padded_page_number}.html`;
}

export { getCachePathFromQuery, pad }