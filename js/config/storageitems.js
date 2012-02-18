LE.storageItems = {
    'font-size': [9, function(v) {
        return v && v.toString().match(/^\d+$/);
    }],
    'word-wrap': [true, function(v) {
        return typeof v === 'boolean';
    }],
    syntax: ['html', function(v) {
        return typeof v === 'string';
    }],
    prefs: {
        newfile: ["<?php \nerror_reporting(E_ALL | E_STRICT);\nrequire 'helpers\/helpers.php';\n?>\n<!doctype html>\n<html lang=\"en-GB\">\n<head>\n    <meta charset=\"utf-8\">\n    <title><\/title>\n<\/head>\n<body>\n    <?php\n    \n    ?>\n    <script src=\"helpers\/errorhandler.js\"><\/script>\n    <script src=\"helpers\/jquery-1.6.4.min.js\"><\/script>\n    <script src=\"helpers\/helpers.js\"><\/script>\n    <script>\n    \n    <\/script>\n<\/body>\n<\/html>", function(v) {
            return typeof v === 'string';
        }],
        autocomplete: [false, function(v) {
            return typeof v === 'boolean';
        }]
    },
    Snippets: [{
        html: {
            forms: {
                input: ['<input>', '']
            },
            misc: {
                h1: ['<h1>', '</h1>']
            }
        },
        'My shite': ['blah, blah', ' and more blah']
    }, function(v) { return $.isPlainObject(v); }],
    Macros: [{
        misc: {
            now: 'return (new Date()).getTime()'
        }
    }, function(v) { return $.isPlainObject(v); }]
};