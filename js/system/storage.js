$(document).ready(function() {

    LE.loadScript('js/libs/storage.js').onload = function() {

        window.storage.init('eval', LE.storageItems);

        LE.storage = function(key, val) {

            return arguments.length < 2 ? storage.get(key) : storage.set(key, val);
        };
    };

});