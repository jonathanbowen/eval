<?php

/*
|--------------------------------------------------------------------------
| php debugging functions
|--------------------------------------------------------------------------
*/

// print the contents of this file
function showhelpers() {
    pre(file_get_contents(__FILE__));
}

// alternative htmlspecialchars
// specifies utf-8 (pointlessly), single-quote encoding and enables no double-encoding (if not already available)
// this is lifted from kohana's html helper (system/helpers/html.php)
function htmlchars($str, $double_encode = TRUE) {

		// Force the string to be a string
		$str = (string) $str;

		// Do encode existing HTML entities (default)
		if ($double_encode)
		{
			$str = htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
		}
		else
		{
			// Do not encode existing HTML entities
			// From PHP 5.2.3 this functionality is built-in, otherwise use a regex
			if (version_compare(PHP_VERSION, '5.2.3', '>='))
			{
				$str = htmlspecialchars($str, ENT_QUOTES, 'UTF-8', FALSE);
			}
			else
			{
				$str = preg_replace('/&(?!(?:#\d++|[a-z]++);)/ui', '&amp;', $str);
				$str = str_replace(array('<', '>', '\'', '"'), array('&lt;', '&gt;', '&#39;', '&quot;'), $str);
			}
		}

		return $str;
}

// apply htmlspecialchars() to an array, recursing if necessary
function htmlchars_deep($v) {

    return is_array($v) ? array_map('htmlchars_deep', $v) : htmlspecialchars($v);
}

// print linebreaks
function br($num = 1, $print = TRUE) {

    $result = str_repeat('<br>', ($num = (int) $num) > 0 ? $num : 1);
    $print && print($result);
    return $result;
}

// get break(s) - shortcut to br() without printing result, for ease of use within echo statements
function gbr($num = 1) {

    return br($num, FALSE);
}

// print horizontal rules
function hr($num = 1, $print = TRUE) {

    $result = str_repeat('<hr>', ($num = (int) $num) > 0 ? $num : 1);
    $print && print($result);
    return $result;
}

// get rule(s) - shortcut to hr() without printing result, for ease of use within echo statements
function ghr($num = 1) {

    return hr($num, FALSE);
}

// output a string wrapped in a <pre>
function pre($str, $escape = TRUE) {

    $str = (string) $str;
    echo '<pre>' . ($escape ? htmlspecialchars($str) : $str) . '</pre>';
}

// var_dump, <pre>-wrapped
function debug() {

    ob_start();
    $args = func_get_args();
    
    foreach ($args as $arg) {
    
        var_dump($arg); echo "-----------------------------------------------\n";
    }
    $dump = ob_get_clean();
    echo '<pre>' . htmlspecialchars($dump) . '</pre>';
}

// regex validator, from friedl's regex book (p474)
// returns error message if pattern's invalid, or FALSE if okey-dokey
function preg_pattern_error($pattern) {

    if ($old_track = ini_get('track_errors')) {
        $old_message = isset($php_errormsg) ? $php_errormsg : FALSE;
    }
    else {
        ini_set('track_errors', 1);
    }

    unset($php_errormsg);
    @preg_match($pattern, '');
    $ret = isset($php_errormsg) ? $php_errormsg : FALSE;

    if ($old_track) {
        $php_errormsg = isset($old_message) ? $old_message : FALSE;
    }
    else {
        ini_set('track_errors', 0);
    }

    return $ret;
}

// simple benchmarking class
class benchmark {

    private static $benchmarks = array();

    public static function start($name = 0) {

        self::$benchmarks[$name] = array('start' => microtime(TRUE));
    }

    public static function stop($name = 0) {

        if (isset(self::$benchmarks[$name])) {
            self::$benchmarks[$name]['stop'] = microtime(TRUE);
        }
    }

    public static function time($name = 0, $precision = 2) {

        $elapsed = NULL;
        if (isset(self::$benchmarks[$name])) {

            $elapsed = (isset(self::$benchmarks[$name]['stop'])
                ? self::$benchmarks[$name]['stop']
                : microtime(TRUE)
                ) - self::$benchmarks[$name]['start'];
            $elapsed = round($elapsed * 1000, $precision);
        }
        return $elapsed;
    }

    public static function dump($precision = 2) {

        echo '<pre>';
        foreach (self::$benchmarks as $name => $times) {
            echo $name . ' : ' . self::time($name, $precision) . " ms\n";
        }
        echo '</pre>';
    }
}

// helper for testing function execution time or simply repeating a function
// executes the function multiple times and returns average execution time
// for php >= 5.3 an anonymous function can be used
function loop($function, $iterations = 1) {

    $name = is_string($function) ? $function : 'anonymous';
    benchmark::start($name);
    for ($i = 0; $i < $iterations; $i++) {
        $function();
    }
    benchmark::stop($name);
    return benchmark::time($name, 4) / $iterations;
}

// alternative to benchmark class above,
// this just returns time elapsed since the last time it was called
function script_time() {

    static $SCRIPT_TIME = 0;
    $mtime = microtime(TRUE);
    $total = $mtime - $SCRIPT_TIME;
    $SCRIPT_TIME = $mtime;
    return $total;
}
// run once to get starting script time
script_time();

// end of file