/**
 * storage.js
 * A hopefully robust and flexible means of getting and setting local storage items in a namespaced, object-oriented way.
 * Items are converted to JSON strings before saving, and parsed back to their original forms when retrieved
 * Incorporates the facility for validation rules to centralise business logic
 * Requires jquery.js
 * Limitations:
 * Basic structure of data object, default values, and validation rules, are set on initialisation and can't be changed
 * Otherwise we could end up with inconsistencies if data is being set and retrieved in different windows/frames
 *
 * Example usage:
 *
 * Initialisation:
 *
 * storage.init('mystore', {
 *      somekey: ['default value', function(v) { return typeof v === 'string'; }],
 *      otherkey: {
 *          subkey: ['this can be any value'],
 *          subkey2: [5, function(v) { return v > 0; }]
 *      }
 * });
 *
 * Retrieving values:
 *
 * storage.get('somekey') returns localStorage.getItem('mystore.somekey') or default value ('default value')
 * storage.get('otherkey') returns object of localStorage items for each subkey, or default values
 *
 * Setting values:
 *
 * storage.set('somekey', 'new value') - calls localStorage.setItem('mystore.somekey', 'new value')
 * storage.set('somekey', 5) - item will not be saved as it fails the validation rule
 * storage.set({otherkey:{subkey: 'another new value'}})
 * storage.set('otherkey', {subkey: 'another new value'}) - equivalent to the above; or:
 * storage.set('otherkey.subkey', 'another new value')
 */

window.storage = (function($) {

var Model,      // maps the structure of the namespaced items, and contains default values and validation rules
    StoreName,  // just the base name of the data store - this'll prefix all keys saved in local storage
    Debug;      // whether to show JSON errors in firebug console

// http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object
function clone(obj){

    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor(); // changed (twice)

    for(var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}
    
/**
 * Retrieve item or items from local storage
 * @param   {String} k       item key - omit to retrieve all values. This is the only publicly available argument.
 * @param   {Mixed}  getRule whether to retrieve the validation rule, item value, or both - values can be true, false or 'both'
 * @param   {Object} obj     copy of model object, or portion thereof - only used when function calls itself recursively
 * @param   {String} prefix  ancestor keys - ditto
 * @returns {Mixed}  key value, or object of values, or default value(s) if not found in storage,
 *                   or undefined if key does not exist in data object (even if it does exist in storage)
 *                   or validation function if fetching rule
 *                   or array of [item value, validation rule] if fetching both
 */
function get(k, getRule, obj, prefix) {

    var result, bits;

    k = k || '';

    // better make sure we haven't been passed anything off-key
    if (typeof k !== 'string') return;

    prefix = (prefix || StoreName) + (k ? '.' : '');
    obj    = $.extend({}, obj || Model);
    bits   = k.split('.');

    k && $.each(bits, function(i, v) {
        if (v && obj[v] !== undefined) {
            obj = obj[v];
        }
        else {
            obj = undefined;
            return false;
        }
    });

    // if fetching an object, let's do some lovely recursion to find each item
    if ($.isPlainObject(obj)) {
        result = {};
        $.each(obj, function(i, v) {
            result[i] = get(i, getRule, obj, prefix + k);
        });
    }

    // otherwise get item from local storage, if its key exists in data object
    else if ($.isArray(obj)) {

        if (!getRule || getRule === 'both') {

            result = window.localStorage.getItem(prefix + k);
            if (result !== null) {

                // see if we can parse the result, otherwise just return string value
                try {
                    result = JSON.parse(result);
                }
                catch(e) {
                    Debug && window.console && typeof console.error === 'function' &&
                        console.error('storage.js: error parsing value', result, e);
                }

                // ensure the stored data conforms to validation rules
                // if not, return default value
                if (typeof obj[1] === 'function' && !obj[1](result)) {
                    result = obj[0];
                }
            }

            // if not present in local storage, return default value
            // note that this is NOT run through validation filters
            else {
                result = clone(obj[0]);
            }

            if (getRule === 'both') {
                result = [result, obj[1]];
            }
        }
        else {
            result = obj[1];
        }
    }
    
    if ($.isArray(result)) {
        result = $.extend([], result);
    }

    return result;
}

/**
 * Save an item to local storage
 * Item will only be saved if its key exists in the data object.
 * Additionally, if validation rules are present, the item will not be saved if it fails the validation
 * @param   {Mixed}  k       item key, or object to save multiple items
 * @param   {Mixed}  v       item value, or object if item key refers to object within the data object
 * @param   {Object} obj     copy of data object, or portion thereof - only used when function calls itself recursively
 * @param   {String} prefix  ancestor keys - ditto
 * @returns {Boolean} true if successfully saved
 */
function set(k, v, obj, prefix) {

    var dataItem, ret = false;

    prefix = prefix || StoreName;
    obj    = obj || $.extend({}, Model);

    // if key or value is an object, call the function recursively to burrow down to each item
    if ($.isPlainObject(k)) {
        $.each(k, function(i, val) {
            set(i, val, obj, prefix + '.' + i);
        });
    }

    else if (typeof k === 'string' && $.isPlainObject(obj[k]) && $.isPlainObject(v)) {
        $.each(v, function(i, val) {
            set(k + '.' + i, val, obj[k], prefix);
        });
    }

    // otherwise, make sure that the key exists in data object
    else if (k && $.isArray(dataItem = get(k, 'both')) && v !== null && v !== undefined &&

        // and save if the value passes validation rule, or no rule exists
        !(typeof dataItem[1] === 'function' && !dataItem[1](v))) {

        window.localStorage.setItem(StoreName + '.' + k, JSON.stringify(v));
        ret = true;
    }

    return ret;
}

/**
 * Initialise data store
 * Populates settings and makes getter and setter available, killing itself in the process so it can't be called again
 * @param   {String} storeName: the base name of the data store
 * @param   {Object} model: multidimensional object containing 1- or 2-member arrays of [default value, validation function]
 * @param   {Boolean} debug whether to show JSON errors in firebug console
 * @returns {Object} window.storage
 */
function init(storeName, model, debug) {

    if (!storeName || typeof storeName !== 'string' || !(storeName = $.trim(storeName))) {
        throw new SyntaxError('storage.js: Store name should be non-empty string');
    }
    else if (!$.isPlainObject(model) || $.isEmptyObject(model)) {
        throw new SyntaxError('storage.js: No model or non-object model supplied');
    }
    else {
        StoreName = storeName;
        Debug     = !!debug;
        Model     = $.extend({}, model);

        window.storage = {
            get: function(k) {
                return get(k);
            },
            set: function(k, v) {
                return set(k, v);
            }
        };
    }
    return window.storage;
}

// now let's spunk it all over the global namespace!
return {
    init: init
};

}(window.jQuery));