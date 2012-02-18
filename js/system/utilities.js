LE.isA = function(v, type) {
    return typeof v === type;
};

LE.isString = function(v) {
    return LE.isA(v, 'string');
};

LE.inArray = function(needle, haystack) {
    return $.inArray(needle, haystack) !== -1;
};

LE.htmlChars = function(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

LE.pregQuote = function(str, delimiter) {
    // Quote regular expression characters plus an optional character
    //
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/preg_quote
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
};

LE.ucFirst = function(str) {
    // Makes a string's first character uppercase
    //
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/ucfirst
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: ucfirst('kevin van zonneveld');
    // *     returns 1: 'Kevin van zonneveld'
    str += '';
    var f = str.charAt(0).toUpperCase();
    return f + str.substr(1);
};

LE.ksort = function(inputArr) {
    // Sort an array by key  (stripped down from original at http://phpjs.org/functions/ksort:460 to remove dependencies)
    //
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/ksort
    // +   original by: GeekFG (http://geekfg.blogspot.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // %          note 1: The examples are correct, this is a new way
    // %        note 2: This function deviates from PHP in returning a copy of the array instead
    // %        note 2: of acting by reference and returning true; this was necessary because
    // %        note 2: IE does not allow deleting and re-adding of properties without caching
    // %        note 2: of property position; you can set the ini of "phpjs.strictForIn" to true to
    // %        note 2: get the PHP behavior, but use this only if you are in an environment
    // %        note 2: such as Firefox extensions where for-in iteration order is fixed and true
    // %        note 2: property deletion is supported. Note that we intend to implement the PHP
    // %        note 2: behavior by default if IE ever does allow it; only gives shallow copy since
    // %        note 2: is by reference in PHP anyways
    // %        note 3: Since JS objects' keys are always strings, and (the
    // %        note 3: default) SORT_REGULAR flag distinguishes by key type,
    // %        note 3: if the content is a numeric string, we treat the
    // %        note 3: "original type" as numeric.
    // -    depends on: i18n_loc_get_default
    // -    depends on: strnatcmp
    // *     example 1: data = {d: 'lemon', a: 'orange', b: 'banana', c: 'apple'};
    // *     example 1: data = ksort(data);
    // *     results 1: {a: 'orange', b: 'banana', c: 'apple', d: 'lemon'}
    // *     example 2: ini_set('phpjs.strictForIn', true);
    // *     example 2: data = {2: 'van', 3: 'Zonneveld', 1: 'Kevin'};
    // *     example 2: ksort(data);
    // *     results 2: data == {1: 'Kevin', 2: 'van', 3: 'Zonneveld'}
    // *     returns 2: true
    var tmp_arr = {},
        keys = [],
        sorter, i, k, that = this,
        populateArr = {};


    sorter = function (a, b) {
        var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
        if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
        } else if (aNumeric && !bNumeric) {
            return 1;
        } else if (!aNumeric && bNumeric) {
            return -1;
        }            return a > b ? 1 : a < b ? -1 : 0;
    };

     // Make a list of key names
    for (k in inputArr) {
        if (inputArr.hasOwnProperty(k)) {
            keys.push(k);
        }    }
    keys.sort(sorter);

     // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
        k = keys[i];
        tmp_arr[k] = inputArr[k];
    }
    for (i in tmp_arr) {
        if (tmp_arr.hasOwnProperty(i)) {
            populateArr[i] = tmp_arr[i];
        }
    }

    return populateArr;
};

/**
 * sort an html list alphabetically
 * requires ksort function above
 * @param {Boolean} shallow: don't sort child lists
 */
$.fn.sortList = function(shallow) {

    $(this).each(function(i, v) {

        var list   = $(v),
            items  = list.children('li'),
            sorted = {};

        items.each(function(i, v) {
            var li   = $(v),
                text = $.trim(li.text().toLowerCase());
            sorted[text] = li;
        });

        sorted = LE.ksort(sorted);

        $.each(sorted, function(i, v) {
            list.append(v);
        });

        shallow || list.children('li').children('ul, ol').sortList();
    });

    return this;
};

// http://stackoverflow.com/questions/2635814/javascript-capturing-load-event-on-link
LE.loadCSS = function(url, callback) {

    if (!url.match(/^https?:/)) url = LE.baseURI + url;

    var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;

    document.head.appendChild(link);

    if (callback) {
        var img = document.createElement('img');
        img.onerror = callback;
        img.src = url;
    }
};

LE.loadScript = function(url, callback) {

    var script = document.createElement('script');
    if (!url.match(/^https?:/)) url = LE.baseURI + url;
    script.src = url;
    document.head.appendChild(script);
    if (callback) script.onload = callback;
};

/**
 * Load up one or more js and/or css files
 * Fire up a callback when everything's loaded
 */
LE.load = function(resources, callback) {

    resources = $.isArray(resources) ? resources : [resources];

    var loaded = 0,
        cb     = function() {
            ++loaded === resources.length && callback && callback();
        };

    $.each(resources, function(i, v) {

        if (v.match(/\.js$/i)) {
            LE.loadScript(v, cb);
        }
        else {
            LE.loadCSS(v, cb);
        }
    });
};