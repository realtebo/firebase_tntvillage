export const cleanString = ( a_string : string ) : string => {
    if (a_string === null) return null;
    return a_string.trim().toUpperCase();
}
