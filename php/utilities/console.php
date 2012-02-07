<?php

/**
 * PHP firebug console class for those too lazy to install firephp
 *
 * Enables debugging of php variables using any available console functions
 * Includes profiler class for PHP profiling and timing
 * Requires PHP 5
 *
 * Usage:
 * Enable the console using console::enable(TRUE),
 * and use console::log(), console::dir(), etc, exactly the same as js console functions
 *
 * Additionally:
 * console::set_error_handler(int reporting level) to enable error logging in the console and suppresses regular error display
 * console::set_assertion_handler() to display failed assertions in the console
 * console::option(key, value) sets a few wee options (see below)
 *
 * Last updated 2011-08-21
 */

class console {

    /**
     * Array to hold console function calls
     */
    protected static $store = array();

    /**
     * Store errors captured by error handler separately,
     * so they can be grouped in final output
     */
    protected static $errors = array();

    /**
     * Array to hold timer start times
     */
    protected static $timers = array();

    /**
     * Whether console should display
     */
    protected static $enabled = FALSE;

    /**
     * Instance of profiler class to record profiling information
     */
    protected static $profiler = NULL;

    /**
     * A few sundry options
     */
    protected static $options = array(
        'max_var_size'    => 0,          # Maximum length for encoded function arguments - 0 for no limit
        'max_levels'      => 20,         # Maximum number of levels to recurse into for objects/arrays
        'error_display'   => 'collapse', # Whether to show errors in a collapsed group
        'profile_display' => 'collapse'  # Whether to show profiler in a collapsed group
    );

    /**
     * Template for javascript inserted into the final output,
     * containing the console calls and a listener for picking up custom headers from ajax requests
     *
     * To make sure the listener doesn't execute any evil code that could find its way into the headers,
     * check that the request url is on the same domain, and arguments are well-formed JSON
     */
    protected static $javascript = '
<script>
window.console && window.XMLHttpRequest && window.JSON && typeof JSON.parse === "function" && (function()
{
var xhrOpen = XMLHttpRequest.prototype.open, i, calls = [{CALLS}];
for (i = 0; i < calls.length; i++)
{
    typeof console[calls[i][0]] === "function" && console[calls[i][0]].apply(console, calls[i][1]);
}
XMLHttpRequest.prototype.open = function(a, b)
{
    xhrOpen.apply(this, arguments);
    var h = document.createElement("a"), m;
    h.setAttribute("href", b);

    (m = /:\/\/([^\/]+)/.exec(h.href)) && m[1] === window.location.hostname && this.addEventListener("load", function()
    {
        var headers = (this.getAllResponseHeaders() || "").split("\n"), i, call, args;
        for (i = 0; i < headers.length; i++)
        {
            if ((call = /X-console-([a-zA-Z]+)-[^:]*:\s*(.+)/.exec(headers[i])) && typeof console[call[1]] === "function")
            {
                try
                {
                    args = JSON.parse(call[2]);
                }
                catch(e)
                {
                    console.error("phpconsole: invalid json data received!");
                    continue;
                }
                console[call[1]].apply(console, args);
            }
        }
    }, false);
};
}());
</script>';

/*
 * ---------------------------------------------------------------
 * USER FUNCTIONS:
 * ---------------------------------------------------------------
 */

/*
 * ---------------------------------------------------------------
 * Configuration
 * ---------------------------------------------------------------
 */

    /**
     * Enable/disable console display
     * Console will show if parameter is boolean TRUE or function returning TRUE
     *
     * @param mixed $func boolean or callback function
     * @param array $args function arguments if using callback [optional]
     */
    public static function enable($func, $args = array())
    {
        self::$enabled = (is_callable($func) ? call_user_func_array($func, $args) : $func) === TRUE;

        if (self::$enabled && !in_array(__CLASS__ . '::_output', ob_list_handlers()))
        {
            ob_start(array(__CLASS__, '_output'));
        }
    }

    /**
     * Is the console enabled?
     *
     * @return boolean
     */
    public static function is_enabled()
    {
        return self::$enabled;
    }

    /**
     * Set option(s) or get option value(s)
     *
     * @param  mixed $key_or_array option name or key => value array of options, or nothing to get all options [optional]
     * @param  mixed $value the option value [optional]
     * @return mixed option value if single option specified, otherwise array of all option values
     */
    public static function options($key_or_array = NULL, $value = NULL)
    {
        $ret = NULL;

        if (!$key_or_array)
        {
            $ret = self::$options;
        }
        elseif (is_string($key_or_array) && isset(self::$options[$key_or_array]))
        {
            $value !== NULL && (self::$options[$key_or_array] = $value);
            $ret = self::$options[$key_or_array];
        }
        elseif (is_array($key_or_array))
        {
            foreach ($key_or_array as $k => $v)
            {
                self::options($k, $v);
            }
            $ret = self::$options;
        }

        return $ret;
    }

    /**
     * Set handler to display assertion failures in the console
     */
    public static function set_assertion_handler()
    {
        assert_options(ASSERT_ACTIVE, 1);
        assert_options(ASSERT_WARNING, 0);
        assert_options(ASSERT_BAIL, 0);
        assert_options(ASSERT_QUIET_EVAL, 1);
        assert_options(ASSERT_CALLBACK, array(__CLASS__, '_assertion_handler'));
    }

    /**
     * Set error handler to log PHP error to console and suppress normal error handler for non-fatal errors
     *
     * @param int $level error reporting level - defaults to E_ALL | E_STRICT [optional]
     */
    public static function set_error_handler($level = 32767)
    {
        set_error_handler(array(__CLASS__, '_error_handler'), $level);
    }

/*
 * ---------------------------------------------------------------
 * Modified firebug functions
 *
 * Stuff that needs processing on the server to be any use
 * eg time, profiling, backtrace, assertions...
 * ---------------------------------------------------------------
 */

    /**
     * Start timer
     *
     * @param string $name
     */
    public static function time($name)
    {
        self::$timers[$name] = microtime(TRUE);
    }

    /**
     * Stop timer and log elapsed time in ms
     *
     * @param string $name      marker name set in time()
     * @param int    $precision number of decimal places to return - defaults to 3 [optional]
     */
    public static function timeEnd($name, $precision = 3)
    {
        isset(self::$timers[$name]) &&
            self::info('%s: %dms', $name, round((microtime(TRUE) - self::$timers[$name]) * 1000, $precision));
    }

    /**
     * Start profiler
     *
     * @param string $name
     */
    public static function profile($name)
    {
        self::$profiler || (self::$profiler = new Console_profiler);
        self::$profiler->start($name);
    }

    /**
     * Stop the most recently started profiler
     */
    public static function profileEnd()
    {
        self::$profiler && self::$profiler->stop();
    }

    /**
     * Generate a backtrace and stick it in a table
     */
    public static function trace()
    {
        $backtrace = debug_backtrace();

        # shift the console::trace call off the beginning of the array
        array_shift($backtrace);
        self::table($backtrace, array('function', 'line', 'file', 'class', 'object', 'type', 'args'));
    }

    /**
     * Clear any previous console calls
     */
    public static function clear()
    {
        self::$store = self::$errors = array();
        self::$profiler = NULL;
    }

    /**
     * Check if assertion is FALSE
     *
     * Everything in the assertion has to be available in the scope of this function to work as expected!
     * Alternatively (and better) use console::set_assertion_handler(), then use regular assert() function
     *
     * @param $expression the assertion to be checked - can be supplied as a string to be evaluated
     */
    public static function assert($expression)
    {
        $assert_options = array(ASSERT_ACTIVE, ASSERT_WARNING, ASSERT_BAIL, ASSERT_QUIET_EVAL, ASSERT_CALLBACK);
        $stored_options = array();

        foreach ($assert_options as $option)
        {
            $stored_options[$option] = assert_options($option);
        }

        self::set_assertion_handler();

        assert($expression);

        # done, now let's leave everything as we found it
        foreach ($assert_options as $option)
        {
            assert_options($option, $stored_options[$option]);
        }
    }

/*
 * ---------------------------------------------------------------
 * Unmodified firebug functions
 *
 * For everything else, the arguments are simply json-encoded
 * and thrown straight to the relevant firebug function
 * ---------------------------------------------------------------
 */

    /**
     * Magic function to invoke any available console function for php >= 5.3
     *
     * @param string $func console function name eg log, info, warn
     * @param array  $args argument array
     */
    public static function __callStatic($func, $args)
    {
        self::func($func, $args);
    }

/*
 * Stodge required for php < 5.3 with unmagical __callStatic
 * this here's all the remaining console functions as of 1.6,
 * slightly verbose because php < 5.3 doesn't allow func_get_args() as a function argument
 */

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.log.28object.5B.2C_object.2C_....5D.29
     */
    public static function log($expression)
    {
        $args = func_get_args(); self::func('log', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.debug.28object.5B.2C_object.2C_....5D.29
     */
    public static function debug($expression)
    {
        $args = func_get_args(); self::func('debug', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.info.28object.5B.2C_object.2C_....5D.29
     */
    public static function info($expression)
    {
        $args = func_get_args(); self::func('info', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.warn.28object.5B.2C_object.2C_....5D.29
     */
    public static function warn($expression)
    {
        $args = func_get_args(); self::func('warn', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.error.28object.5B.2C_object.2C_....5D.29
     */
    public static function error($expression)
    {
        $args = func_get_args(); self::func('error', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.dir.28object.29
     */
    public static function dir($expression)
    {
        $args = func_get_args(); self::func('dir', $args);
    }

    /**
     * (included for completeness but effectively useless in this context)
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.dirxml.28node.29
     */
    public static function dirxml($expression)
    {
        $args = func_get_args(); self::func('dirxml', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.group.28object.5B.2C_object.2C_....5D.29
     */
    public static function group($expression)
    {
        $args = func_get_args(); self::func('group', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.groupCollapsed.28object.5B.2C_object.2C_....5D.29
     */
    public static function groupCollapsed($expression)
    {
        $args = func_get_args(); self::func('groupCollapsed', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.groupEnd.28.29
     */
    public static function groupEnd()
    {
        $args = func_get_args(); self::func('groupEnd', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.count.28.5Btitle.5D.29
     */
    public static function count($expression)
    {
        $args = func_get_args(); self::func('count', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.exception.28error-object.5B.2C_object.2C_....5D.29
     */
    public static function exception($expression)
    {
        $args = func_get_args(); self::func('exception', $args);
    }

    /**
     * @link http://getfirebug.com/wiki/index.php/Console_API#console.table.28data.5B.2C_columns.5D.29
     */
    public static function table($expression)
    {
        $args = func_get_args(); self::func('table', $args);
    }

/*
 * -------------------------------------------------------------------
 * INTERNAL FUNCTIONS:
 * -------------------------------------------------------------------
 */

/*
 * -------------------------------------------------------------------
 * The innards
 * -------------------------------------------------------------------
 */

    /**
     * Save console function name and arguments in array
     *
     * This is the workhorse for all firebug console functions
     * Shouldn't need to call this directly, but left public
     * so any new firebug functions can be got at without __callStatic()
     *
     * @param string $func console function name eg log, info, warn
     * @param array  $args argument array
     */
    public static function func($func, $args)
    {
        if (!self::$enabled || !is_string($func) || !preg_match('/^\w+\z/', $func))
        {
            return;
        }

        $encoded  = self::_json_encode((array)$args);
        $max_size = (int)self::$options['max_var_size'];

        if ($max_size && strlen($encoded) > $max_size)
        {
            $origin  = self::_trace_call();
            $func    = 'warn';
            $encoded = self::_json_encode(array('Maximum variable size exceeded for %s::%s() in %s on line %d',
                $origin['class'], $origin['function'], $origin['file'], $origin['line']));
        }

        self::$store[] = array($func, $encoded);
    }

    /**
     * Find where the console function was originally called
     *
     * @return array
     */
    protected static function _trace_call()
    {
        $backtrace  = debug_backtrace();
        $origin     = array();
        $trace_vals = array(
            'class'    => '(NULL)',
            'function' => '(NULL)',
            'file'     => '(NULL)',
            'line'     => '(NULL)'
        );

        # find the last element (ie first called) which references this class
        for ($i = count($backtrace) - 1; $i >= 0; $i--)
        {
            $origin = $backtrace[$i];
            if (isset($origin['class']) && $origin['class'] === __CLASS__)
            {
                break;
            }
        }

        $origin = array_merge($trace_vals, $origin);

        return $origin;
    }

    /**
     * json_encode variable, first passing through _convert_for_json()
     * to tidy up anything potentially problematic
     *
     * @param  mixed  $v variable to be encoded
     * @return string the encoded string
     */
    protected static function _json_encode($v)
    {
        return json_encode(self::_convert_for_json($v));
    }

    /**
     * Tidy up variable for json_encode
     *
     * json_encode don't do resources, so recurse through and convert any resources to strings,
     * and replace stupid null bytes with balanced braces in private/protected class variable names
     *
     * @param  mixed $v variable to be converted
     * @param  int   $level number of levels in - to limit recursion if max levels set
     * @param  array $classes_found store found classes when recursing, to prevent infinite recursion
     * @return mixed the converted variable
     */
    protected static function _convert_for_json($v, $level = 0, $classes_found = array())
    {
        ++$level;

        if (is_object($v))
        {
            $class_name = get_class($v);

            if (in_array($class_name, $classes_found))
            {
                $v = '* RECURSION DETECTED ( ' . $class_name . ' ) *';
            }
            else
            {
                $class_name !== 'stdClass' && ($classes_found[] = $class_name);
                $v = (array)$v;
            }
        }

        if (is_array($v))
        {
            $converted = array();
            $max_levels = (int)self::$options['max_levels'];

            foreach ($v as $k => $val)
            {
                if (is_string($k))
                {
                    $k = preg_replace('/\0\*\0/', '{protected}', $k);
                    $k = preg_replace('/\0[^\0]*\0/', '{private}', $k);
                }
                $converted[$k] = $max_levels && ($level > $max_levels)
                    ? '* MAXIMUM NESTED LEVELS *'
                    : self::_convert_for_json($val, $level, $classes_found);
            }
        }
        else
        {
            $converted = is_resource($v) ? (string)$v : $v;
        }

        return $converted;
    }

    /**
     * Check that output is html
     * so we don't screw with any php-generated javascript/css/attachments etc
     *
     * @return boolean FALSE if content-type set to anything other than text/html
     */
    protected static function _is_html_output()
    {
        $headers = headers_list();

        foreach ($headers as $header)
        {
            if (preg_match('%^content-type:\s+(?!text/html)%i', $header))
            {
                return FALSE;
            }
        }

        return TRUE;
    }

/*
 * -------------------------------------------------------------------
 * Callbacks
 * These need to be public, but should never be called directly
 * -------------------------------------------------------------------
 */

    /**
     * Assertion handler
     *
     * Set temporarily by console::assert() or can be set permanently by console::set_assertion_handler()
     */
    public static function _assertion_handler($file, $line, $code)
    {
        # if we're here from console::assert(), find where this was called from
        if ($file === __FILE__)
        {
            $origin = self::_trace_call();
            $file   = $origin['file'];
            $line   = $origin['line'];
        }

        self::error("Assertion failed:\nFile: %s\nLine: %d\nCode: %s", $file, $line, $code);
    }

    /**
     * Error handler set by console::set_error_handler()
     *
     * Parameters are the standard set_error_handler() callback parameters
     * @link http://php.net/manual/en/function.set-error-handler.php#refsect1-function.set-error-handler-parameters
     */
    public static function _error_handler($num, $message, $file, $line)
    {
        switch ($num)
        {
            case E_USER_ERROR:
                $error_type = 'USER ERROR';
                break;
            case E_USER_WARNING:
                $error_type = 'USER WARNING';
                break;
            case E_USER_NOTICE:
                $error_type = 'USER NOTICE';
                break;
            case E_NOTICE:
                $error_type = 'NOTICE';
                break;
            case E_WARNING:
                $error_type = 'WARNING';
                break;
            case E_STRICT:
                $error_type = 'STRICT';
                break;
            case 4096:
                $error_type = 'CATCHABLE FATAL ERROR';
                break;
            case 8192:
                $error_type = 'DEPRECATED';
                break;
            case 16384:
                $error_type = 'USER DEPRECATED';
                break;
            default:
                $error_type = 'UNKNOWN ERROR (' . $num . ')';
        }

        self::$errors[] = array('%s: %s in %s on line %d', $error_type, strip_tags($message), $file, $line);

        # if it's a fatal error, return false to continue normal error handler and stop the script
        return $num !== 4096;
    }

    /**
     * Send final output
     *
     * This is the callback function for ob_start
     * Send headers if ajax, otherwise cram a <script> before closing </body>
     *
     * @param  string $buffer buffer contents
     * @return string new output
     */
    public static function _output($buffer)
    {
        if (!self::$enabled)
        {
            return $buffer;
        }

        $new_output = $buffer;

        # Add any profiling info in a table
        if (self::$profiler && ($report = self::$profiler->report()) && $report['calls'])
        {
            $func = self::$options['profile_display'] === 'collapse' ? 'groupCollapsed' : 'group';
            self::$func('Profile (%dms, %d calls)', $report['time'], $report['calls']);
            self::table($report['report']);
            self::groupEnd();
        }

        # If we have any script errors, add them in a group following other console calls
        if (self::$errors)
        {
            $func = self::$options['error_display'] === 'collapse' ? 'groupCollapsed' : 'group';
            self::$func('PHP errors (%d)', count(self::$errors));
            foreach (self::$errors as $error)
            {
                self::func('log', $error);
            }
            self::groupEnd();
        }

        # If this is an ajax request, send the console calls in custom headers, and return output unchanged
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
        {
            if (!headers_sent())
            {
                foreach (self::$store as $k => $item)
                {
                    list($func, $args) = $item;
                    $key = uniqid('X-console-' . $func . '-' . $k);
                    header($key . ': ' . $args);
                }
            }
        }

        # Otherwise - if output is html - squeeze in a <script> containing the goodies
        elseif (self::_is_html_output())
        {
            # Insert script before last </body>, or at the end of the buffer
            ($insertion_point = strripos($buffer, '</body>')) || ($insertion_point = strlen($buffer));

            $calls = '';

            foreach (self::$store as $item)
            {
                list($func, $args) = $item;
                $calls .= ($calls ? ',' : '') . '["' . $func . '",' . $args . ']';
            }

            $new_output = substr($buffer, 0, $insertion_point) .
                str_replace('{CALLS}', $calls, self::$javascript) .
                substr($buffer, $insertion_point);
        }

        return $new_output;
    }
}

/**
 * Simple profiler class for use by console profile functions
 */
class Console_profiler {

    /**
     * array to hold marker start and end times, and pauses:
     * takes the form of: array(start, array(pause, resume), array(pause2, resume2),... stop)
     */
    protected $sessions = array();

    /**
     * Array to store (name, timerindex) sub-array of started timers
     * ensures the appropriate timer is automagically paused/stopped/resumed with minimal overhead
     */
    protected $running = array();

    /**
     * Start a timer
     *
     * @param string $name marker name
     */
    public function start($name)
    {
        $mtime = microtime(TRUE);

        # if there's a currently running timer, pause it
        if ($this->running)
        {
            list($last_name, $last_timer) = $this->running[count($this->running) - 1];
            $this->sessions[$last_name][$last_timer][] = array($mtime);
        }

        $this->sessions[$name][] = array('start' => $mtime);
        $this->running[] = array($name, count($this->sessions[$name]) -1);
    }

    /**
     * Stop the most recently started timer
     * If current timer is nested, its parent will be resumed
     */
    public function stop()
    {
        $mtime = microtime(TRUE);

        if ($this->running)
        {
            list($name, $index) = array_pop($this->running);
            $this->sessions[$name][$index]['stop'] = $mtime;

            # if there's a previous timer, resume it
            if ($this->running)
            {
                list($name, $index) = $this->running[count($this->running) - 1];
                $this->sessions[$name][$index][count($this->sessions[$name][$index]) - 2][] = $mtime;
            }
        }
    }

    /**
     * Get tabulable array of info about each recorded timer
     *
     * @param int $precision number of decimal places to return in times [optional]
     * @return array total times, total calls, array report on each timer set
     */
    public function report($precision = 3)
    {
        $report = array();
        $total_calls = $total_time = 0;
        $sessions = $this->sessions;
        $mtime = microtime(TRUE);

        foreach ($sessions as $name => $timers)
        {
            $cumulative_time = $time = $own_time = 0;
            $min = $max = NULL;

            foreach ($timers as $k => $timer)
            {
                isset($timer['stop']) || ($timer['stop'] = $timers[$k]['stop'] = $mtime);
                $elapsed = ($timer['stop'] - $timer['start']) * 1000;
                $cumulative_time += $elapsed;
                $own_time += $elapsed;

                $min = $min === NULL || $elapsed < $min ? $elapsed : $min;
                $max = $max === NULL || $elapsed > $max ? $elapsed : $max;

                # only add to 'total time' column if not nested
                if (!($k && $timers[$k - 1]['stop'] > $timer['start']))
                {
                    $time += $elapsed;
                }

                # subtract any pauses from 'own time'
                foreach ($timer as $i => $v)
                {
                    if (is_array($v))
                    {
                        $pause = $v[0];
                        $resume = isset($v[1]) ? $v[1] : $mtime;
                        $own_time -= ($resume - $pause) * 1000;
                    }
                }
            }

            $calls = count($timers);
            $total_time += $own_time;
            $total_calls += $calls;
            $report[$name] = array(
                'Name'              => $name,
                'Calls'             => $calls,
                'Percent'           => 0,
                'Total time (ms)'   => round($time, $precision),
                'Own time (ms)'     => round($own_time, $precision),
                'Average time (ms)' => round($cumulative_time / $calls, $precision),
                'Min (ms)'          => round($min, $precision),
                'Max (ms)'          => round($max, $precision),
            );
        }

        foreach ($report as $k => $row)
        {
            $report[$k]['Percent'] = round(($row['Own time (ms)'] / $total_time) * 100, 1);
        }

        return array(
            'time'   => round($total_time, $precision),
            'calls'  => $total_calls,
            'report' => $report
        );
    }
}

/**
 * json_encode if not already available
 * (slightly adapted because we can't use var_export in ob callback function)
 *
 * @link http://uk2.php.net/manual/en/function.json-encode.php#100835
 */
if (!function_exists('json_encode'))
{
    function json_encode($data)
    {
        if (is_array($data) || is_object($data))
        {
            $islist = is_array($data) && (empty($data) || array_keys($data) === range(0, count($data) - 1));
            if ($islist)
            {
                $json = '[' . implode(',', array_map('json_encode', $data)) . ']';
            }
            else
            {
                $items = array();
                foreach ($data as $key => $value)
                {
                    $items[] = json_encode($key) . ':' . json_encode($value);
                }
                $json = '{' . implode(',', $items) . '}';
            }
        }
        elseif (is_string($data))
        {
            # Escape non-printable or Non-ASCII characters.
            # I also put the \\ character first, as suggested in comments on the 'addclashes' page.
            $string = '"' . addcslashes($data, "\\\"\n\r\t/" . chr(8) . chr(12)) . '"';
            $json   = '';
            $len    = strlen($string);
            # Convert UTF-8 to Hexadecimal Codepoints.
            for ($i = 0; $i < $len; $i++)
            {
                $char = $string[$i];
                $c1 = ord($char);

                # Single byte;
                if ($c1 <128)
                {
                    $json .= ($c1 > 31) ? $char : sprintf("\\u%04x", $c1);
                    continue;
                }

                # Double byte
                $c2 = ord($string[++$i]);
                if  (($c1 & 32) === 0)
                {
                    $json .= sprintf("\\u%04x", ($c1 - 192) * 64 + $c2 - 128);
                    continue;
                }

                # Triple
                $c3 = ord($string[++$i]);
                if (($c1 & 16) === 0)
                {
                    $json .= sprintf("\\u%04x", (($c1 - 224) << 12) + (($c2 - 128) << 6) + ($c3 - 128));
                    continue;
                }

                # Quadruple
                $c4 = ord($string[++$i]);
                if (($c1 & 8) === 0)
                {
                    $u = (($c1 & 15) << 2) + (($c2>>4) & 3) - 1;

                    $w1 = (54<<10) + ($u<<6) + (($c2 & 15) << 2) + (($c3>>4) & 3);
                    $w2 = (55<<10) + (($c3 & 15)<<6) + ($c4-128);
                    $json .= sprintf("\\u%04x\\u%04x", $w1, $w2);
                }
            }
        }
        elseif (is_float($data) || is_int($data))
        {
            $json = (string)$data;
        }
        elseif (is_bool($data))
        {
            $json = $data ? 'true' : 'false';
        }
        else
        {
            $json = 'null';
        }
        return $json;
    }
}

# end of file