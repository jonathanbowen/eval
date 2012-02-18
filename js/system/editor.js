LE.editor = (function() {

    var instance,
        funcs = ['getValue', 'setValue', 'getSelection', 'replaceSelection', 'getCursor', 'setSelection',
            'getContainer', 'getKeyElements', 'toggleWordWrap', 'setAutoComplete', 'goToLine', 'wrapSelection',
            'duplicateSelection', 'undo', 'redo', 'clearHistory', 'setSyntax', 'setFontSize', 'setupSearchForm',
            'getInstance'],
        ret = {
            init: function(obj) {
                instance = LE.editor[obj];
                instance.init();
            }
        };

    $.each(funcs, function(i, v) {

        ret[v] = function() {
            return typeof instance[v] === 'function' ? instance[v].apply(instance[v], arguments) : undefined;
        }
    });

    return ret;

}());

LE.editor.codeMirror = (function() {

    var instance;

    function init() {

        // need to load in 2 stages, otherwise the dependency files
        // sometimes come through before the main codemirror.js,
        // which throws an error as codemirror isn't defined yet
        LE.load('js/libs/CodeMirror-2.21/lib/codemirror.js', function() {

            var files = [
                'js/libs/CodeMirror-2.21/lib/codemirror.css',
             //   'js/libs/CodeMirror-2.21/theme/cobalt.css',
                'js/libs/CodeMirror-2.21/lib/util/searchcursor.js',
                'js/libs/CodeMirror-2.21/lib/util/simple-hint.js',
                'js/libs/CodeMirror-2.21/mode/javascript/javascript.js',
                'js/libs/CodeMirror-2.21/mode/xml/xml.js',
                'js/libs/CodeMirror-2.21/mode/css/css.js',
                'js/libs/CodeMirror-2.21/mode/clike/clike.js',
                'js/libs/CodeMirror-2.21/mode/php/php.js',
                'js/libs/CodeMirror-2.21/mode/htmlmixed/htmlmixed.js'
            ];

            LE.load(files, function() {

                instance = CodeMirror.fromTextArea($('#code')[0], {
                    mode: 'application/x-httpd-php',
                //    theme: 'cobalt',
                    lineNumbers: true,
                    lineWrapping: LE.storage('word-wrap'),
                    matchBrackets: true,
                    indentUnit: 4,
                    smartIndent: false,
                    tabIndex: 1,
                    onUpdate: checkUndo,
                    onKeyEvent: function(o, e) {
                        // codemirror wants to use ctrl+d to delete lines! NOOOO!
                        if (e.keyCode === 68 && e.ctrlKey) {
                            return true;
                        }
                    }
                });

                setFontSize(LE.storage('font-size'));

                $(document).bind('LE.setViewMode LE.dragging LE.dragStop', instance.refresh);

                LE.editorReady();
            });
        });
    }

    function getValue() {
        return instance.getValue();
    }

    function setValue(str) {
        return instance.setValue(str);
    }

    function getSelection() {
        return instance.getSelection();
    }

    function replaceSelection(str) {
        instance.replaceSelection(str);
    }

    function getContainer() {
        return $(instance.getScrollerElement()).add($(instance.getWrapperElement()));
    }

    // codemirror doesn't use an iframe, so don't need this...
    function getKeyElements() { return $();
        return getContainer();
    }

    function toggleWordWrap() {
        instance.setOption('lineWrapping', !instance.getOption('lineWrapping'))
    }

    function setAutoComplete(onOrNot) {}

    function goToLine(num) {
        instance.setCursor(num - 1, 0);
    }

    function wrapSelection(before, after) {

        after = after || '';
        instance.replaceSelection(before + instance.getSelection() + after);
    }

    function duplicateSelection() {

        var sel = instance.getSelection(),
            rep,
            selStart = instance.coordsChar(instance.cursorCoords()),
            selEnd = instance.coordsChar(instance.cursorCoords(false));

        if (sel) {

            if (selStart.line === selEnd.line && selStart.ch === selEnd.ch) {
                // if there's a selection, but start and end are the same,
                // something's gone a bit tits-up, so let's do the maths:
                selStart.ch -= sel.length;
            }
            rep = sel + sel;
        }
        else {
            rep = '\n' + instance.getLine(selStart.line);
        }

        instance.replaceSelection(rep);
        instance.setSelection(selStart, selEnd);
    }

    function undo() {
        instance.undo();
        checkUndo();
    }

    function redo() {
        instance.redo();
        checkUndo();
    }

    function clearHistory() {
        instance.clearHistory();
    }

    function checkUndo() {

        // seems to get called from the onUpdate option before everything's set up, so need to check
        if (!instance) return;

        var history = instance.historySize();
        history.undo ? LE.toolbarButton('undo').enable() : LE.toolbarButton('undo').disable();
        history.redo ? LE.toolbarButton('redo').enable() : LE.toolbarButton('redo').disable();
    }

    function setSyntax(syntax) {

        var mimes = {
            php: 'application/x-httpd-php',
            js: 'text/javascript',
            html: 'text/html',
            css: 'text/css'
        };

        mimes[syntax] && instance.setOption('mode', mimes[syntax]);
    }

    function setFontSize(size) {
        $(instance.getWrapperElement()).css('font-size', size + 'px');
        instance.refresh();
        $(document).trigger('LE.fontSizeAdjust');
    }

    // very specific to ea foibles, this hopefully won't last
    function setupSearchForm() {}

    function getInstance() {
        return instance;
    }

    return {
        init: init,
        getValue: getValue,
        setValue: setValue,
        getSelection: getSelection,
        replaceSelection: replaceSelection,
        getContainer: getContainer,
        getKeyElements: getKeyElements,
        toggleWordWrap: toggleWordWrap,
        setAutoComplete: setAutoComplete,
        goToLine: goToLine,
        wrapSelection: wrapSelection,
        duplicateSelection: duplicateSelection,
        undo: undo,
        redo: redo,
        clearHistory: clearHistory,
        setSyntax: setSyntax,
        setFontSize: setFontSize,
        setupSearchForm: setupSearchForm,
        getInstance: getInstance
    };

}());

LE.editor.editArea = (function() {

    var elmId = 'code';

    function init() {

        var eaConfig = $.extend(LE.eaConfig, {
            id: 'code',
            allow_resize: 'no',
            allow_toggle: false,
            font_size: LE.storage('font-size'),
            syntax: LE.getCurrentSyntax(),
            syntax_selection_allow: LE.getAvailableSyntaxes().join(),
            toolbar: 'select_font, reset_highlight, word_wrap, syntax_selection',
            word_wrap: LE.storage('word-wrap'),
            EA_load_callback: 'LE.editorReady'
        });

        editAreaLoader.init(eaConfig);

        $(document).bind('LE.init', function() {

            var eaDoc = $(frames.frame_code.document);

            eaDoc.find('#toolbar_1').hide();
            eaDoc.find('#result').css('overflow', 'auto');

            setupAutoComplete();
            setupSoftParens();

            (function checkundo() {
                var f = window.frames.frame_code;
                if (f) {
                    var undo = LE.toolbarButton('undo'), redo = LE.toolbarButton('redo'), ea = f.editArea;
                    if (undo.elm.hasClass('disabled')) {
                        if (ea.previous.length > 1) {
                            undo.enable();
                        }
                    } else if (ea.previous.length < 2) {
                        undo.disable();
                    }
                    if (redo.elm.hasClass('disabled')) {
                        if (ea.next.length > 0) {
                            redo.enable();
                        }
                    } else if (ea.next.length < 1) {
                        redo.disable();
                    }
                }
                setTimeout(checkundo, 300);
            })();
        });

        function wordWrapFix() {
            LE.editor.toggleWordWrap();
            LE.editor.toggleWordWrap();
        }

        $(document).bind('LE.setViewMode', wordWrapFix);
        $(document).bind('LE.openFile', wordWrapFix);
    }

    function getValue() {
        return editAreaLoader.getValue(elmId);
    }

    function setValue(str) {
        editAreaLoader.setValue(elmId, str);
    }

    function getSelection() {
        return editAreaLoader.getSelectedText(elmId);
    }

    function replaceSelection(str) {
        editAreaLoader.setSelectedText(elmId, str);
    }

    function getContainer() {
        return $('#editor').add($('#frame_' + elmId));
    }

    // elements needed to be caught for keydown/press events
    function getKeyElements() {
        var eaElms = $(frames.frame_code.document);
        eaElms = eaElms.add(eaElms.find('#textarea'));
        return eaElms;
    }

    function toggleWordWrap() {
        editAreaLoader.execCommand(elmId, 'toggle_word_wrap', 1);
    }

    function setAutoComplete(onOrNot) {
        frames.frame_code.editArea.execCommand('autocomplete_enable', onOrNot);
    }

    function goToLine(lineNum) {
        editAreaLoader.execCommand(elmId, 'go_to_line', (lineNum || 1).toString());
    }

    function wrapSelection(before, after) {
        editAreaLoader.insertTags(elmId, before, after || '');
    }

    function undo(steps) {
        steps = steps || 1;
        editAreaLoader.execCommand(elmId, 'undo', steps);
    }

    function redo(steps) {
        steps = steps || 1;
        editAreaLoader.execCommand(elmId, 'redo', steps);
    }

    function duplicateSelection() {

        var sel      = frames.frame_code.editArea.last_selection,
            selStart = sel.selectionStart,
            selEnd   = sel.selectionEnd,
            selected = editAreaLoader.getSelectedText(elmId),
            copied   = selected.length ? selected : "\n" + sel.curr_line,
            lineNum  = sel.line_start;

        // go to end of line if nothing selected
        if (!selected.length) {

            editAreaLoader.execCommand(elmId, 'go_to_line', (lineNum + 1).toString());

            if (lineNum < sel.nb_line) {
                sel = frames.frame_code.editArea.last_selection;
                editAreaLoader.setSelectionRange(elmId, sel.selectionEnd - 1, sel.selectionEnd - 1);
            }
        }
        // otherwise go to end of selection
        else {
            editAreaLoader.setSelectionRange(elmId, selEnd, selEnd);
        }

        // insert duplicate of line/selection then revert to previous selection
        editAreaLoader.insertTags(elmId, copied, '');
        editAreaLoader.setSelectionRange(elmId, selStart, selEnd);
    }

    function setSyntax(syntax) {
        editAreaLoader.execCommand(elmId, 'change_syntax', syntax);
    }

    function setFontSize(size) {
        frames.frame_code.editArea.set_font(null, size);
    }

    function setupSearchForm() {

        var form = $('#searchform'), eaFrame = $(frames.frame_code.document),
            lastMsg = eaFrame.find('#area_search_msg').html(),
            firstRun = true;

        (function checkMessage() {

            var msg = eaFrame.find('#area_search_msg').html(), eaForm = eaFrame.find('#area_search_replace');

            if (msg !== lastMsg && !($('#area_search').val() && msg === 'Search field empty')) {
                lastMsg = msg;
                msg = msg ? '<div style="padding-top:10px">' + msg + '</div>' : '';
                $('#search-result').html(msg);
            }

            eaForm.find('input:not([type=button])').each(function(i, v) { //log(v.id);

                if (v.type === 'checkbox') {
                    v.checked = $('#' + v.id)[0].checked;
                }
                else {
                    v.value = $('#' + v.id).val(); //log(v.value);
                }
            });

            setTimeout(checkMessage, 500);
        }());

        var eaForm = eaFrame.find('#area_search_replace');
        eaForm.css('margin-left', -99999);

        $('#searchform input[type=button]').click(function() {
            var func = $(this).data('command');

            eaForm.show();
            eaForm.find('input:not([type=button])').each(function(i, v) { // log(v.id);

             //   if (v.type === 'button') return;

                if (v.type === 'checkbox') {
                    v.checked = $('#' + v.id)[0].checked;
                }
                else {
                    v.value = $('#' + v.id).val(); //log(v.value);
                }
            });

            function goBackAndDoItProperly(func) {

                editAreaLoader.execCommand('code', func, 1);
                setTimeout(function() {
                    if ($('#area_search').val() && eaFrame.find('#area_search_msg').html() === 'Search field empty') {
                        goBackAndDoItProperly(func);
                    }
                }, 100);
            }

            editAreaLoader.execCommand('code', $(this).data('command'), 1);

            if (firstRun) {
                goBackAndDoItProperly($(this).data('command'))
            }

            firstRun = false;
        });
    }

    function setupSoftParens() {

        $(frames.frame_code.document).find('#result').bind('keydown', function(e) {

            var sel = frames.frame_code.editArea.last_selection;

            if (e.which === 48 && e.shiftKey &&
                !editAreaLoader.getSelectedText('code') &&
                sel.curr_line.substr(sel.curr_pos -1, 1) === ')'
            ) {
                var pos = editAreaLoader.getSelectionRange('code').start + 1;
                editAreaLoader.setSelectionRange('code', pos, pos);
                return false;
            }
        });
    }

    function setupAutoComplete() {

        // looks lke ea onready fires before plugins have loaded, so we need this shit
        if (frames.frame_code.autoCompleteWords) {

            var helpers = ['debug()', 'pre()', 'br()', 'gbr()', 'hr()', 'ghr()'];

                frames.frame_code.editArea.execCommand('autocomplete_add_words', {
                    php: helpers,
                    js: helpers
                });
        }
        else {
            setTimeout(setupAutoComplete, 500);
            return;
        }

        setAutoComplete(LE.storage('prefs.autocomplete'));

        $(document).bind('LE.savePrefs', function() {
            setAutoComplete(LE.storage('prefs.autocomplete'));
        });
    }

    return {
        init: init,
        getValue: getValue,
        setValue: setValue,
        getSelection: getSelection,
        replaceSelection: replaceSelection,
        getContainer: getContainer,
        getKeyElements: getKeyElements,
        toggleWordWrap: toggleWordWrap,
        setAutoComplete: setAutoComplete,
        goToLine: goToLine,
        wrapSelection: wrapSelection,
        undo: undo,
        redo: redo,
        duplicateSelection: duplicateSelection,
        setSyntax: setSyntax,
        setFontSize: setFontSize,
        setupSearchForm: setupSearchForm
    };

}());
