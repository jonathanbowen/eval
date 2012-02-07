(function() {

    var SCRIPT_TIME = 0;
    window.script_time = function() {
        var now = (new Date()).getTime(),
            elapsed = now - SCRIPT_TIME;
        SCRIPT_TIME = now;
        return elapsed;
    }
})();

function Profiler() {

    var points = {},
        getTime = function() {

            return (new Date()).getTime();
        }, 
        context = this;
    this.start = function(markName) {

        points[markName || 0] = {start: getTime()};
    };
    this.stop = function(markName) {

        markName = markName || 0;
        if (points[markName] && !points[markName].stop) {
            points[markName].stop = getTime();
        }
    };
    this.time = function(markName) {

        markName = markName || 0;
        var elapsed;
        if (points[markName]) {
            elapsed = (
                points[markName].stop ?  points[markName].stop : getTime()
                ) - points[markName].start;
        }
        return elapsed;
    };
    this.dump = function() {
    
        var result = '<pre>';
        for (var i in points) {
            result += (i + ' : ' + context.time(i) + ' ms\n');
        }
        result += '</pre>';
        echo(result);
    };
}
var profiler = new Profiler();

// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
// Returns true if it is a DOM element    
function isElement(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
        typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string"
    );
}

// spit shit out onto the page
// takes dom nodes, jquery objects or strings
function echo(obj) {

    if (isElement(obj)) {
        document.body.appendChild(obj);
    }
    else if (window.jQuery && obj instanceof jQuery) {
        jQuery('body').append(obj);
    }
    // if no html use a text node so as not to mess up any events
    else if (!(obj || '').toString().match(/<|>/)) {
        var t = document.createTextNode(obj);
        document.body.appendChild(t);
    }
    else {
        document.body.innerHTML += obj;
    }
}

// redeclare document.write to echo - just to make copy/pasting code easier
document.write = echo;

// linebreaks
function br(num) {

	if (!num || num != parseInt(num, 10) || num < 1) { num = 1; }
	for (var i = 1; i <= num; i++) {
		echo(document.createElement('br'));
	}
}

// return linebreaks
function gbr(num) {
    
    var ret = '';
	if (!num || num != parseInt(num) || num < 1) { num = 1; }
	for (var i = 1; i <= num; i++) {
		ret += '<br>';
	}
    return ret;
}

// horizontal rules
function hr(num) {

	if (!num || num != parseInt(num, 10) || num < 1) { num = 1; }
	for (var i = 1; i <= num; i++) {
		echo(document.createElement('hr'));
	}
}

// return horizontal rules
function ghr(num) {
    
    var ret = '';
	if (!num || num != parseInt(num) || num < 1) { num = 1; }
	for (var i = 1; i <= num; i++) {
		ret += '<hr>';
	}
    return ret;
}

// htmlspecialchars-ish - without escaping &s.
function htmlchars(x) {
   return (x || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Concatenates the values of a variable into an easily readable string
 * by Matt Hackett [scriptnode.com]
 * @param {Object} x The variable to debug
 * @param {Number} max The maximum number of recursions allowed (keep low, around 5 for HTML elements to prevent errors) [default: 10]
 * @param {String} sep The separator to use between [default: a single space ' ']
 * @param {Number} l The current level deep (amount of recursion). Do not use this parameter: it's for the function's own use
 */

function print_r(x, max, sep, l) {

   l = l || 0;
   max = max || 10;
   sep = sep || ' ';
   if (l > max) {
      return "[WARNING: Too much recursion]\n";
   }
   var
      i,
      r = '',
      t = typeof x,
      tab = '';
   if (x === null) {
      r += "(null)\n";
   } else if (t == 'object') {
      l++;
      for (i = 0; i < l; i++) {
         tab += sep;
      }
      if (x && x.length) {
         t = 'array';
      }
      r += '(' + t + ") :\n";
      for (i in x) {
         try {
            r += tab + '[' + i + '] : ' + print_r(x[i], max, sep, (l + 1));
         } catch(e) {
            return "[ERROR: " + e + "]\n";
         }
      }
   } else {

      if (t == 'string') {
         if (x == '') {
            x = '(empty)';
         }
      }
      r += '(' + t + ') ' + x + "\n";
   }
   return r;
}

function debug() {
    var result = '', i;
    for (i = 0; i < arguments.length; i++) {
        result += htmlchars(print_r(arguments[i]));
    }
    echo($('<pre>' + result + '</pre>'));
}

function pre(x) {
    echo($('<pre>' + htmlchars(x) + '</pre>'));
}

function loadcss(filename) {
    var tag = document.createElement('link');
    tag.setAttribute('rel', 'stylesheet');
    tag.setAttribute('href', filename);
    document.getElementsByTagName("head")[0].appendChild(tag);
    echo('Loaded ' + filename); br();
}

function unloadcss(filename) {
    filename = filename.replace(/\.css$/i, '');
    var regex = new RegExp('(\\b|^)' + filename + '\\.css$', 'i');
    var links = document.getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (href && href.match(regex)) {
            links[i].parentNode.removeChild(links[i]);
            echo(filename + ' removed<br>');
            return true;
        }
    }
    echo('<span class="error">' + filename + ' not found!</span><br>');
    return false;
}
