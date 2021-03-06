editArea.add_plugin('autocomplete', (function() {

    var currentIndex   = 0,       // keep track of index of currently highlighted suggestion
        enabled        = true,    // whether autocomplete is enabled
        currentSyntax  = 'html',  // current syntax
        numSuggestions = 5,       // number of suggestions to show
        doKeyUp        = false,   // whether keyup event is active
        suggestionHolder;         // div containing suggestions

    /**
     * Fire it all up: load script & stylesheet, append suggestion holder in the document
     */
    function init() {

        var wordScript = loadScript(this.baseURL + 'words.js');

        editArea.load_css(this.baseURL + 'autocomplete.css');

        wordScript.onload = function() {

            sortWordList();
            appendSuggestionHolder();
            parent.editAreaLoader.add_event(document, 'click', hideSuggestionHolder);
            parent.editAreaLoader.add_event(document.getElementById('result'), 'keyup', keyUp);
            parent.editAreaLoader.add_event(document.getElementById('result'), 'scroll', function() {
                suggestionHolder.style.display === 'block' && setHolderPosition();
            });
        };
    }

    /**
     * Executes a specific command
     *
     * @param {string} cmd: the name of the command being executed
     * @param {unknown} param: the parameter of the command
     * @return true - pass to next handler in chain, false - stop chain execution
     */
    function execCommand(cmd, param) {

        switch (cmd) {

            case 'autocomplete_enable':
                enabled = !!param;
                return false;
            case 'autocomplete_add_words':
            case 'autocomplete_delete_words':
                addOrDeleteWords(param, cmd);
                sortWordList();
                appendSuggestionHolder();
                return false;
        }

        return true;
    }

    /**
     * Handles adding/deleting words - convert arguments / iterate if required
     *
     * @param {Object} param: parameter passed to execCommand
     * @param {String} cmd: string passed to execCommand - autocomplete_add_words or autocomplete_delete_words
     */
    function addOrDeleteWords(param, cmd) {

        var i, w,
            syntax = param ? (param[0] || param) : false,
            words  = param ? param[1] : false,
            func   = cmd === 'autocomplete_delete_words' ? deleteWords : addWords;

        if (!syntax) return;

        if (typeof syntax === 'object') {

            for (i in syntax) {
                func(i, syntax[i]);
            }
            return;
        }

        if (typeof words !== 'object') {
            w = words;
            words = [w];
        }

        func(syntax, words);
    }

    /**
     * Add words to syntax list
     *
     * @param {Object|String} syntax: syntax to add to, or object of syntaxes and words eg {php:['foo','bar'],js:'baz'}
     * @param {Object|String} words: array of words, or string if adding single word
     */
    function addWords(syntax, words) {

        if (!autoCompleteWords[syntax]) autoCompleteWords[syntax] = [];

        for (var i = 0, len = words.length; i < len; i++) {

            inArray(words[i], autoCompleteWords[syntax]) === false && autoCompleteWords[syntax].push(words[i]);
        }
    }

    /**
     * Remove words from syntax list
     *
     * @param {Object|String} syntax: syntax to delete from, or object of syntaxes and words
     * @param {Object|String} words: array of words, or string if deleting single word
     */
    function deleteWords(syntax, words) {

        var i, len, index;

        if (autoCompleteWords[syntax]) {

            for (i = 0, len = words.length; i < len; i++) {

                index = inArray(words[i], autoCompleteWords[syntax]);

                index === false || delete autoCompleteWords[syntax][index];
            }
        }
    }

    /**
     * Load a script
     *
     * @return {Object} the inserted DOM element
     */
    function loadScript(url) {

        var script = document.createElement('script');
        script.src  = url;
        document.getElementsByTagName('head')[0].appendChild(script);

        return script;
    }

    /**
     * Append suggestion holder to #result
     */
    function appendSuggestionHolder() {

        var syntax, holder, i, len, span;

        if (suggestionHolder && suggestionHolder.parentNode) {
            suggestionHolder.parentNode.removeChild(suggestionHolder);
        }

        suggestionHolder = document.createElement('div');
        suggestionHolder.id = 'autocomplete';
        document.getElementById('result').appendChild(suggestionHolder);

        for (syntax in autoCompleteWords) {

            holder = document.createElement('div');
            holder.id = 'autocomplete_' + syntax;
            suggestionHolder.appendChild(holder);

            for (i = 0, len = autoCompleteWords[syntax].length; i < len; i++) {

                span = document.createElement('span');
                span.appendChild(document.createTextNode(autoCompleteWords[syntax][i]));
                span.setAttribute('data-index', i);
                holder.appendChild(span);
                span.onmouseover = setSpanAsCurrent;
                span.onclick = function() {
                    setEditorContents(this.firstChild.nodeValue);
                };
            }
        }

        setSyntax(editArea.current_code_lang);
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

        autoCompleteWords = window.autoCompleteWords || {};

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

        var sField     = document.getElementById('selection_field'),
            resultDiv  = document.getElementById('result'),
            cursor     = sField.getElementsByTagName('strong')[0],
            sWidth     = suggestionHolder.offsetWidth,
            sHeight    = suggestionHolder.offsetHeight,
            prop,
            wDiff,
            css        = {
                left: cursor.offsetLeft + document.getElementById('line_number').offsetWidth,
                top: sField.offsetTop + cursor.offsetTop + editArea.lineHeight
            };

        // if vertical space available is less than sum of top position, holder height & scroll position,
        // shift upwards so it shows above the current line
        if (resultDiv.clientHeight < (css.top + sHeight - resultDiv.scrollTop)) {
            css.top = sField.offsetTop + cursor.offsetTop - sHeight;
        }

        // space available minus sum of left position, holder width & left scroll position
        // if this is less than 0, it's going under the right edge of the editor
        wDiff = resultDiv.clientWidth - (css.left + sWidth - resultDiv.scrollLeft);

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
     */
    function getLastWord() {

        var sel = editArea.last_selection,
            l = sel.curr_line,
            p = sel.curr_pos,
            t = l.substr(0, p - 1),
            m = /(\w|-)+$/.exec(t);

        return m ? m[0] : '';
    }

    /**
     * Show container for specified syntax, and hide others
     *
     * @param {String} syntax
     */
    function setSyntax(syntax) {

        var holders = suggestionHolder.getElementsByTagName('div'), i, len;

        for (i = 0, len = holders.length; i < len; i++) {

            if (holders[i].id.replace(/autocomplete_/, '') === syntax) {
                holders[i].style.display = 'block';
                holders[i].className = 'current-syntax';
            }
            else {
                holders[i].style.display = 'none';
                holders[i].className = '';
            }
        }

        currentSyntax = syntax;
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
            maxPos = autoCompleteWords[currentSyntax].length;

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

            cursorPos = parent.editAreaLoader.getSelectionRange(editArea.id).start;
            parent.editAreaLoader.setSelectionRange(editArea.id, cursorPos - len, cursorPos);
            parent.editAreaLoader.setSelectedText(editArea.id, '');

            if (suggestion.substr(-1) === ')') {
                beforeCursor = suggestion.substr(0, suggestion.length - 1);
                afterCursor = ')';
            }
            else {
                beforeCursor = suggestion;
            }

            parent.editAreaLoader.insertTags(editArea.id, beforeCursor, afterCursor);
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

    /**
     * Do various shit on keydown event
     */
    function keyDown(e) { // console.log(e.which);

        var isVisible = suggestionHolder.style.display === 'block';

        switch (e.which) {

            // enter to insert suggestion
            case 13:
                if (isVisible) {
                    setEditorContents(getCurrentSuggestion());
                    return false;
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
                    scrollSuggestions(e.which === 38 || (e.which === 9 && ShiftPressed(e)) ? 'up' : 'down');
                    return false;
                }
                break;

            // for other keys,
            // scroll to matching word on keyup
            default:
                doKeyUp = true;
        }
    }

    /**
     * Keyup event scrolls to matching word
     * (need to use keyup so that last word includes latest keystroke)
     */
    function keyUp() {

        if (doKeyUp && !parent.editAreaLoader.getSelectedText(editArea.id)) {

            if (editArea.current_code_lang !== currentSyntax) {
                setSyntax(editArea.current_code_lang);
            }

            setTimeout(function() { scrollToMatchingWord(getLastWord()); }, 10);
        }

        doKeyUp = false;
    }

    // shit stolen from zencoding.js:

    /**
     * Return true if Shift key is pressed
     *
     * @return {Boolean}
     */
    function ShiftPressed(e) {

        if (window.event) return (window.event.shiftKey);

        return (e.shiftKey || (e.modifiers > 3));
    }

    return {
        onload      : init,
        execCommand : execCommand,
        onkeydown   : function(e) {
            if (enabled) return keyDown(e);
        }
    };

}()));