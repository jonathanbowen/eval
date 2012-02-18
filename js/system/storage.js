$(document).ready(function() {

    LE.load('js/libs/storage.js', function() {

        window.storage.init('eval', LE.storageItems);

        LE.storage = function(key, val) {

            return arguments.length < 2 ? storage.get(key) : storage.set(key, val);
        };
    });

});