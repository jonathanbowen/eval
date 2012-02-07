<?php defined('LE_BASE_DIR') or die;

/**
 * 404 called if controller or method not found, prints trace to firebug console
 */
function le_show_404()
{
    header('HTTP/1.1 404 Not Found');
    console::trace();
    die(htmlspecialchars($_SERVER['REQUEST_URI']) . ' was not found!');
}

/**
 * router called on startup - works out controller & method from uri and fires it up if exists,
 * otherwise shows 404
 */
function le_route_request()
{
    $uri        = substr($_SERVER['REQUEST_URI'], strlen(LE_BASE_URI));
    $uri        = preg_replace('/\?.*$/', '', $uri);
    $segments   = explode('/', $uri);
    $segments   = array_filter($segments);
    $controller = isset($segments[0]) ? $segments[0] : 'default';
    $method     = isset($segments[1]) ? $segments[1] : 'index';
    $args       = array_slice($segments, 2);
    $file       = LE_BASE_DIR . '/php/controllers/' . $controller . '.php';

    if (file_exists($file))
    {
        include $file;
    }

    $controller = 'LE_' . ucfirst($controller);

    if (class_exists($controller))
    {
        $c = new $controller;
        call_user_func_array(array($c, $method), $args);
    }
    else
    {
        le_show_404();
    }
}

/**
 * load up javascripts
 * first call (in controller constructor) sets current class, then call without argument to print scripts
 * @param {string} $classname: name of current controller
 */
function le_load_js($classname = '') {

    static $current_class;

    if ($classname)
    {
        $current_class = strtolower(substr($classname, 3));
    }
    else
    {
        ?>
        <script>
        window.log = console.log;
        window.LE = {
            baseURI: <?php echo json_encode(LE_ABS_BASE_URI); ?>,
            init: {}
        };
        </script>
        <?php

        $scripts = array_merge(
            glob(LE_BASE_DIR . '/js/system/*.js'),
            glob(LE_BASE_DIR . '/js/config/*.js'),
            glob(LE_BASE_DIR . '/js/views/' . $current_class . '/*.js'),
            glob(LE_BASE_DIR . '/js/plugins/*.js')
        );

        foreach ($scripts as $script)
        {
            $src = substr($script, strlen($_SERVER['DOCUMENT_ROOT']) + 1);
            ?>
            <script src="/<?php echo $src; ?>"></script>
            <?php
        }
    }
}

/**
 * all controllers inherit from this wee skelington
 */
class LE_Controller
{
    public function __construct()
    {
        le_load_js(get_called_class());
    }

    public function __call($a, $b)
    {
        le_show_404();
    }

    protected function load_view($file, $data = array())
    {
        foreach ($data as $k => $v)
        {
            ${$k} = $v;
        }

        if (!pathinfo($file, PATHINFO_EXTENSION))
        {
            $file .= '.php';
        }
        require LE_BASE_DIR . '/php/views/' . $file;
    }
}

// end of file