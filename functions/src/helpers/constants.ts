/*
    Testa pure qui: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match

    var regex = var regex = /(s([0-9]{1,2})(-([0-9]{1,2}))?)e([0-9]{1,3})((-([0-9]{1,3})){0,3})$/i;

    console.log('S02-06e01-100'.match(regex));
    console.log('S02e01-50'.match(regex));
    console.log('S02-03e01-50'.match(regex));
    console.log('S1-3e1-102'.match(regex));
    console.log('S01e01-03-01-36'.match(regex));

    Esempio: S02-06e01-100 => [
        0: completo => "S02-06e01-100", 
        1: stagioni => "S02-06", 
        2: numero prima stagione => "02", 
        3: match fino a => "-06", 
        4: numero ultima stagione => "06", 
        5: numero primo episodio => "01", 
        6: match fino a => "-100", 
        7: match ripetizioni del blocco "fino a" => "-100", 
        8: numero ultimo episodio => "100"
    ]

*/

// NB: Se si usa il modificatore 'g', non vengono restituiti i sottogruppi !
export const SEAESON_REGEXP        : RegExp  = /(s([0-9]{1,2})(-([0-9]{1,2}))?)e([0-9]{1,3})((-([0-9]{1,3})){0,3})/i;
export const SEAESON_REGEXP_GLOBAL : RegExp  = /(s([0-9]{1,2})(-([0-9]{1,2}))?)e([0-9]{1,3})((-([0-9]{1,3})){0,3})/ig;

