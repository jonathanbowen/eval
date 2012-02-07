<?php

error_reporting(E_ALL);

version_compare(PHP_VERSION, '5.3', '>=')
    or die('This shit requires PHP >= 5.3, currently running ' . PHP_VERSION);

/**
 * define some shit
 */
define('LE_VERSION', '3.1a');

# server path eg C:\xampp\htdocs\eval3
define('LE_BASE_DIR', dirname(__FILE__));

# root-relative uri eg /eval3/
define('LE_BASE_URI', str_replace('\\', '/', substr(LE_BASE_DIR, strlen($_SERVER['DOCUMENT_ROOT']))) . '/');

# full uri of server document root (protocol+domain) eg http://localhost
define('LE_SERVER_URI',
    'http' . (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 's' : '') . '://' .
    $_SERVER['SERVER_NAME']);

# uri of current dir eg http://localhost/eval3/
define('LE_ABS_BASE_URI', LE_SERVER_URI . LE_BASE_URI);

# is ajax?
define('LE_IS_AJAX', isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest');

/**
 * load up some shit
 */
require LE_BASE_DIR . '/php/utilities/nukemagicquotes.php';
require LE_BASE_DIR . '/php/utilities/le_corefuncs.php';
require LE_BASE_DIR . '/php/utilities/console.php';

/**
 * enable console for php debugging
 */
console::enable(TRUE);
console::set_error_handler();

le_route_request();

// end of file