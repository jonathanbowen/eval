CodeMirror.autoComplete = (function() {

    var editor,                  // instance of CodeMirror
        autoCompleteWords,       // list of words
        suggestionHolder,        // DOM element containing words
        numSuggestions = 5,      // number of suggestions to show
        currentMode,             // current syntax
        ret;                     // what gets spat out down the bottom. as it were.

    /**
     * Initialise
     *
     * @param {Object} instance: instance of CodeMirror
     * @param {Object} words: object literal containing words for available syntaxes
     * @param {Number} num: number of suggestions to show
     */
    function init(instance, words, num) {

        editor = instance;
        autoCompleteWords = words;
        numSuggestions = num || numSuggestions;

        createSuggestionHolder();
        document.body.addEventListener('click', hideSuggestionHolder);

        var currentKeyEvent = editor.getOption('onKeyEvent');
        if (typeof currentKeyEvent !== 'function') currentKeyEvent = function(){};

        editor.setOption('onKeyEvent', function(o, e) {

            var ret = currentKeyEvent(o, e);
            if (ret !== true) ret = keyEvent(e);
            return ret;
        });
    }

    /**
     * Append suggestion holder to body
     */
    function createSuggestionHolder() {

        var syntax, holder, i, len, span;

        if (suggestionHolder && suggestionHolder.parentNode) {
            suggestionHolder.parentNode.removeChild(suggestionHolder);
        }

        sortWordList();
        suggestionHolder = document.createElement('div');
        suggestionHolder.className = 'CodeMirror-autocomplete';
        document.body.appendChild(suggestionHolder);

        for (syntax in autoCompleteWords) {

            holder = document.createElement('div');
            holder.className = 'autocomplete_' + syntax;
            suggestionHolder.appendChild(holder);

            for (i = 0, len = autoCompleteWords[syntax].length; i < len; i++) {

                span = document.createElement('span');
                span.appendChild(document.createTextNode(autoCompleteWords[syntax][i]));
                span.setAttribute('data-index', i);
                holder.appendChild(span);
                span.onmouseover = setSpanAsCurrent;
                span.onclick = function() {
                    setEditorContents(this.firstChild.nodeValue);
                    editor.focus();
                };
            }
        }
    }

    function keyEvent(e) {

        // don't bother if there's something selected
        // also keypress is not needed, and its keycodes are different, which would cause havoc below
        if (editor.somethingSelected() || e.type === 'keypress') return;

        var key = e.which,
            state = getState(),
            mode = state.state.mode,
            isVisible = suggestionHolder.style.display === 'block';

        // looks like mode key is returned for html & php files that can have mixed syntax
        // for js/css, grab the option value
        if (!mode) {
            mode = editor.getOption('mode').replace(/^.*\W/, '');
        }

        mode === currentMode || setSyntax(mode);

        switch (key) {

            // enter to insert suggestion
            case 13:
                if (isVisible) {
                    setEditorContents(getCurrentSuggestion());
                    e.stop();
                    return true;
                }
                break;

            // nothing doing on shift
            case 16:
                break;

            // esc/left/right hide suggestion holder
            case 27:
            case 37:
            case 39:
                isVisible && hideSuggestionHolder();
                break;

            // tab/up/down keys scroll through suggestions
            case 9:
            case 38:
            case 40:
                if (isVisible) {
                    e.type === 'keydown' && scrollSuggestions(key === 38 || (key === 9 && e.shiftKey) ? 'up' : 'down');
                    e.stop();
                    return true;
                }
                break;

            // for other keys,
            // scroll to matching word on keyup
            default:
                e.type === 'keyup' && scrollToMatchingWord(getLastWord());
        }
    }

    /**
     * Get state at current cursor position
     */
    function getState() {

        var pos = editor.getCursor(),
            line = pos.line,
            ch = pos.ch;

        return editor.getTokenAt({line:line,ch:ch});
    }

    /**
     * Add words to syntax list
     *
     * @param {String} syntax: syntax to add to
     * @param {Object} words: array of words
     */
    function addWords(syntax, words) {

        if (!autoCompleteWords[syntax]) autoCompleteWords[syntax] = [];

        for (var i = 0, len = words.length; i < len; i++) {

            inArray(words[i], autoCompleteWords[syntax]) === false && autoCompleteWords[syntax].push(words[i]);
        }

        createSuggestionHolder();
    }

    /**
     * Remove words from syntax list
     *
     * @param {String} syntax: syntax to delete from
     * @param {Object} words: array of words
     */
    function deleteWords(syntax, words) {

        var i, len, index;

        if (autoCompleteWords[syntax]) {

            for (i = 0, len = words.length; i < len; i++) {

                index = inArray(words[i], autoCompleteWords[syntax]);

                index === false || delete autoCompleteWords[syntax][index];
            }
        }

        createSuggestionHolder();
    }

    /**
     * is needle in array?
     *
     * @param {unknown} needle
     * @param {Object} haystack
     * @return {Number|Boolean} index if found, or false if not found
     */
    function inArray(needle, haystack) {

        for (var i in haystack) {
            if (haystack[i] === needle) return i;
        }
        return false;
    }

    /**
     * callback to sort array case-insensitive
     */
    function caseInsensitiveSort(a, b) {

        var x = a.toLowerCase(),
            y = b.toLowerCase();

        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
    }

    /**
     * Sort each syntax list in autoCompleteWords
     */
    function sortWordList() {

        autoCompleteWords = autoCompleteWords || {};

        for (var i in autoCompleteWords) {
            autoCompleteWords[i].sort(caseInsensitiveSort);
        }
    }

    /**
     * Set target span as current
     */
    function setSpanAsCurrent() {

        var current = this.parentNode.getElementsByClassName('current'),
            i, len = current.length;

        for (i = 0; i < len; i++) {
            current[i].className = '';
        }

        currentIndex = parseInt(this.getAttribute('data-index'), 10);

        this.className = 'current';
    }

    /**
     * Show and line up suggestion holder
     */
    function setHolderPosition() {

        showSuggestionHolder();

        var cursorCoords = editor.cursorCoords(),
            wrapper = editor.getWrapperElement(),
            prop,
            wDiff,
            sWidth     = suggestionHolder.offsetWidth,
            sHeight    = suggestionHolder.offsetHeight,
            lineHeight = wrapper.getElementsByTagName('pre')[0].offsetHeight,
            css = {
                left: cursorCoords.x,
                top: cursorCoords.y + lineHeight
            };

        // if vertical space available is less than sum of top position, holder height & scroll position,
        // shift upwards so it shows above the current line
        if (wrapper.clientHeight < (css.top + sHeight - wrapper.scrollTop)) {
            css.top = cursorCoords.y - sHeight;
        }

        // space available minus sum of left position, holder width & left scroll position
        // if this is less than 0, it's going under the right edge of the editor
        wDiff = wrapper.clientWidth - (css.left + sWidth - wrapper.scrollLeft);

        if (wDiff < 0) {
            // shift to the left by overlap width if less than holder width, so it sticks to the right edge
            // otherwise shift left by holder width, so it won't follow if cursor is scrolled out of view
            css.left += wDiff < -sWidth ? -sWidth : wDiff;
        }

        for (prop in css) {
            suggestionHolder.style[prop] = (css[prop] > 0 ? css[prop] : 0) + 'px';
        }
    }

    /**
     * Get last typed whole word (including hyphens for css properties)
     * Return nothing if we're in a string or attribute value
     */
    function getLastWord() {

        var state = getState(),
            str = state.string,
            word  = /(\w|-)+$/.exec(str);

        return word && state.className !== 'string' ? word[0] : '';
    }

    /**
     * Show container for specified syntax, and hide others
     *
     * @param {String} syntax
     */
    function setSyntax(syntax) {

        var holders = suggestionHolder.getElementsByTagName('div'), i, len;

        for (i = 0, len = holders.length; i < len; i++) {

            if (holders[i].className.match('autocomplete_' + syntax)) {
                holders[i].style.display = 'block';
                holders[i].className += ' current-syntax';
            }
            else {
                holders[i].style.display = 'none';
                holders[i].className = holders[i].className.replace(/ current-syntax/g, '');
            }
        }

        currentMode = syntax;
    }

    /**
     * Show suggestions
     */
    function showSuggestionHolder() {
        suggestionHolder.style.display = 'block';
    }

    /**
     * Hide suggestions
     */
    function hideSuggestionHolder() {
        suggestionHolder.style.display = 'none';
    }

    /**
     * Scroll through suggestions
     *
     * @param {String} direction 'up' or 'down'
     */
    function scrollSuggestions(direction) {

        var pos = currentIndex + (direction === 'up' ? -1 : 1),
            maxPos = autoCompleteWords[currentMode].length;

        if (pos < 0)      pos = 0;
        if (pos > maxPos) pos = maxPos - 1;

        scrollToIndex(pos, 2);
    }

    /**
     * Scroll to matching word
     *
     * @param {String} word
     */
    function scrollToMatchingWord(word) {

        var holder = suggestionHolder.getElementsByClassName('current-syntax')[0],
            spans  = holder ? holder.getElementsByTagName('span') : null,
            len    = spans ? spans.length : 0,
            i, spanText;

        if (word && len) {

            for (i = 0; i < len; i++) {

                spanText = spans[i].firstChild.nodeValue;
                if (spanText.toLowerCase().substr(0, word.length) === word.toLowerCase() &&
                    spanText.length > word.length) {

                    return scrollToIndex(i);
                }
            }
        }

        hideSuggestionHolder();
    }

    /**
     * Scroll to span specified by index
     *
     * @param {Number} spanIndex
     * @param {Number} offset
     */
    function scrollToIndex(spanIndex, offset) {

        var holder = suggestionHolder.getElementsByClassName('current-syntax')[0],
            spans = holder ? holder.getElementsByTagName('span') : null,
            len = spans.length,
            suggestionsFound = false,
            i, min,
            visibleSpans = (function() {
                var arr = [];
                for (i = 0; i < len; i++) {
                    spans[i].style.display === 'block' && arr.push(spans[i]);
                }
                return arr;
            }());

        offset = offset || 0;

        if (offset && visibleSpans[0] && visibleSpans[0].className === 'current') {
            offset = 1;
        }

        min = spanIndex - offset;
        if (min + numSuggestions > len) {
            min = len - numSuggestions;
        }
        min = min > 0 ? min : 0;

        if (holder && spans && spans[spanIndex]) {

            for (i = 0; i < len; i++) {

                spans[i].className = '';

                if (i >= min && i < min + numSuggestions) {

                    suggestionsFound = true;

                    spans[i].style.display = 'block';

                    if (i === spanIndex) {
                        spans[i].className = 'current';
                        currentIndex = i;
                    }
                }
                else {
                    spans[i].style.display = 'none';
                }
            }

            suggestionsFound && setHolderPosition();
        }
    }

    /**
     * Insert text into editor, replacing last whole word before cursor, then hide suggestion holder
     *
     * @param {String} suggestion: text to be inserted
     */
    function setEditorContents(suggestion) {

        var lastWord     = getLastWord(),
            len          = lastWord.length,
            beforeCursor = '',
            afterCursor  = '',
            cursorPos;

        if (suggestion && len) {

            cursorPos = editor.coordsChar(editor.cursorCoords());

            editor.setSelection({line: cursorPos.line, ch: cursorPos.ch - len}, cursorPos);

            if (suggestion.substr(-1) === ')') {
                beforeCursor = suggestion.substr(0, suggestion.length - 1);
                afterCursor = ')';
            }
            else {
                beforeCursor = suggestion;
            }

            editor.replaceSelection(beforeCursor + afterCursor);
            cursorPos = {line: cursorPos.line, ch: cursorPos.ch - len + beforeCursor.length};
            editor.setSelection(cursorPos, cursorPos);
        }

        hideSuggestionHolder();
    }

    /**
     * Get currently highlighted suggestion
     *
     * @return {String|Boolean} suggestion text or false
     */
    function getCurrentSuggestion() {

        var holder = suggestionHolder.getElementsByClassName('current-syntax')[0];

        return holder ? holder.getElementsByClassName('current')[0].firstChild.nodeValue : false;
    }

    ret = init;
    ret.addWords = addWords;
    ret.deleteWords = deleteWords;

    return ret;

}());