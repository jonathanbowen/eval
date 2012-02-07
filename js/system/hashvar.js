/**
 * Retrieve / manipulate the url hash, like a pseudo-querystring
 * Lets us store information there that's accessible when page is reloaded
 * Get values with LE.hashVar('somekey') or LE.hashVar() to get all vars
 * Set with LE.hashVar('somekey', 'someval') or ({somekey:'someval',...})
 * Delete with LE.hashVar('somekey', false) or ('*', false) to delete everything
 */

(function() {

    var vars = {},
        currentVars = {},
        currentHash = window.location.hash,
        suppressHashEvt = false,
        baseURI = LE.baseURI,
        regex   = new RegExp('([^&=]+)=([^&=]*)(&|$)', 'g'),
        listeners = {};

/**
 * Stuff for attaching/detaching hash change listeners
 */

    function onHashChange(e) {

        getVarsFromHash();

        suppressHashEvt || $.each(listeners, function(k, callbacks) { //log('hash change '+k);

            if (vars[k] !== currentVars[k]) {

                $.each(callbacks, function(i, callback) {

                    typeof callback === 'function' && callback(vars[k]);
                });
            }
        });

        suppressHashEvt = false;

        currentVars = $.extend({}, vars);
    }

    LE.attachHashListener = function(key, callback) {

        listeners[key] = listeners[key] || [];
        listeners[key].push(callback);
    };

    LE.detachHashListener = function(key, callback) {

        if (!callback) {
            delete listeners[key];
        }
        else {
            listeners[key] && $.each(listeners[key], function(i, v) {
                v === callback && delete listeners[key][i];
            });
        }
    };

    $(window).bind('hashchange', onHashChange);

/**
 * Stuff for getting/setting hash values
 */

    function getVarsFromHash() {

        var hash = window.location.hash.substr(1),
            match;

        if (hash !== currentHash) {
            
            vars = {};

            while (match = regex.exec(hash)) {
                vars[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
            }
            
            currentHash = hash;
        }
    }

    function getVar(k) {

        getVarsFromHash();

        return k !== undefined ? vars[k.toString()] : vars;
    }

    function setVar(k, v, isRecursing) { //log(k);

        isRecursing || getVarsFromHash();

        if ($.isPlainObject(k)) {

            $.each(k, function(i, val) {
                setVar(i, val, true);
            });
        }
        else if (typeof k === 'string') {

            if (k === '*') {
                $.each(vars, function(i) {
                    setVar(i, v, true);
                });
            }
            else if (v === false) {
                delete vars[k];
            }
            else {
                vars[k] = (v || '').toString();
            }
        }
        else {
            throw new SyntaxError('LE.hashVar expects string or plain object, saw ' + k);
        }

        isRecursing || updateHash();
    }

    function updateHash() {

        var hash = '';

        $.each(vars, function(i, v) {

            if (v.length) {
                hash += (hash ? '&' : '') + encodeURIComponent(i) + '=' + encodeURIComponent(v);
            }
        });

        suppressHashEvt = true;

        location.hash = hash;
        
        setTimeout(function() { suppressHashEvt = false }, 0);
    }

    /**
     * Get/set hash values
     *
     * @param {Mixed} k: key to set or object literal of keys & values, or * to set/delete everything
     * @param {String} v: the value to set
     * @return {Mixed} the key's value if found, or undefined if not found or setting
     */
    LE.hashVar = function(k, v) {

        return  arguments.length < 2 && !$.isPlainObject(k) ? getVar(k) : setVar(k, v);
    };
}());