$.extend(LE, {

    setDividerPosition: function() {

    },

    dialog: $.fn.dialogbox.open,

    setViewMode: function(mode) {

        var editor    = $('#editor'),
            eaFrame   = $('#frame_code'),
            preview   = $('#preview, #preview-iframe'),
            win       = $(window),
            winWidth  = win.width(),
            winHeight = win.height() - $('#toolbar').outerHeight(true),
            different = LE.viewMode !== mode;

        LE.viewMode = mode;

        function eaFix() {
            editAreaLoader.execCommand('code', 'toggle_word_wrap', 1);
            editAreaLoader.execCommand('code', 'toggle_word_wrap', 1);
        }

      //  if (LE.previewPopup)

        $('#preview').css('margin-top', 0)//.css('padding', 0);

        switch (mode) {
            case 'split-y':
                editor.add(eaFrame).add(preview).width(winWidth).height(winHeight / 2).show();
                // stupid hack to compensate for 2px gap coming from fuck knows where
                $('#preview').height((winHeight / 2) + 2).css('margin-top', -2);
                eaFix();
                break;
            case 'preview':
                preview.width(winWidth).height(winHeight).show();
                // can't hide editarea or it fucks when page loaded in preview mode
                editor.add(eaFrame).css('height', 0);
                break;
            case 'popup':
             //   LE.viewMode = mode;


                LE.popup('preview-popup').open();

                /*
                if (false && !LE.previewPopup) {

                    LE.popupPossiblyTakingAgesToLoad = true;
                    LE.previewPopup = window.open(LE.baseURI + 'preview' , 'preview-popup', 'width=900,height=600,scrollbars=yes');
                    LE.previewPopup.onload = function() {
                        LE.popupPossiblyTakingAgesToLoad = false;
                        LE.reload();
                    };
                } */
            // fall through to fill main window with editor:
            case 'code':
                editor.add(eaFrame).width(winWidth).height(winHeight + 3).show();
                eaFix();
                preview.hide();
                break;
            case 'split-x':
            default:
                if (mode !== 'split-x') {
                    mode = LE.viewMode = 'split-x';
                    LE.hashVar('viewmode', 'split-x');
                }
                editor.add(eaFrame).add(preview).width(winWidth / 2).height(winHeight).show();
                editor.add(eaFrame).height(winHeight + 3);
                eaFix();
        }

        $('#editor form').attr('target', mode === 'popup' ? 'preview-popup' : 'preview-iframe');



        $.each(['split-y', 'split-x', 'code', 'preview', 'popup'], function(i, v) {
            LE.toolbarButton(v + '-view')[mode === v ? 'on' : 'off']();
        });


        // discovery! retrieving the value of the location hash during resize event
        // causes the whole fucking screen to flash black. marvellous.

     //   log(LE.viewMode, mode);

        if (different) LE.hashVar('viewmode', mode)

        if (mode !== 'popup') {
            LE.popup('preview-popup').close();
        }

        $(document).trigger('LE.setViewMode');
    },

    newFile: function() {
        editAreaLoader.setValue('code', LE.storage('prefs.newfile'));
        LE.setFile(false);
        LE.setSyntax(LE.getDefaultSyntax());
    },

    openFile: function() {
        LE.showFileBrowser('open');
    },

    doOpenFile: function(filename) {

        $.get($('#file-iframe').data('baseurl') + 'open', {file: filename}, function(json) {

            if (json.success) {

                $.fn.dialogbox.close();

                editAreaLoader.setValue('code', json.text);

                editAreaLoader.execCommand('toggle_word_wrap');
                editAreaLoader.execCommand('toggle_word_wrap');

                LE.setFile(filename);

               /*  window.setFile(filename);

                $('#set-url-input').val('')
                $('#set-url').removeClass('active'); */
            }
            else {
                LE.setFile(false);
                alert(json.text);
            }
        }, 'json');
    },

    saveFile: function(saveAs) {

        if (LE.currentFile && !saveAs) {
            LE.doSaveFile(LE.currentFile, true);
        }
        else {
            LE.showFileBrowser('save', saveAs);
        }
    },

    doSaveFile: function(filename, confirmOverwrite, callback) {

        var editorContents = editAreaLoader.getValue('code');

        $.post($('#file-iframe').data('baseurl') + 'save', {
            save: filename,
            overwrite: confirmOverwrite ? '1' : '0',
            text: editorContents
        }, function(json) {
            if (!json.success) {
                if (json.must_confirm) {
                    if (confirm(json.message)) {
                        LE.doSaveFile(filename, true);
                    }
                }
                else {
                    alert(json.message);
                }
            }
            else {
                $.fn.dialogbox.close();
                LE.setFile(filename);
                typeof callback === 'function' && callback();
            }
        }, 'json');
    },

    setFile: function(filename) { //log('setfile');

        var docTitle, ext;

        docTitle = document.title;
        docTitle = docTitle.replace(/^.*\| /, '');

        // update syntax if file is different
        if (filename && filename !== LE.currentFile) {

            docTitle = filename.replace(/^.*\//, '') + ' [' + filename + '] | ' + docTitle;

            if (ext = /\.(\w+)$/.exec(filename)) {
                LE.setSyntax(ext[1]);
            }

            if (!LE.currentUrl) {
                $('#url').val(filename);
            }
        }

        // go to line 1 for new or newly opened file
        if (!filename || filename !== LE.currentFile) {
            editAreaLoader.execCommand('code', 'go_to_line', '1');
        }

        document.title = docTitle;

    //    LE.storage('latest-file', filename);


        if (filename) {
            LE.toolbarButton('setUrl').enable();
        }
        else {
            LE.toolbarButton('setUrl').disable();
            LE.updateUrl(false);
        }

        LE.currentFile = filename;
        LE.setEditMode(!!filename);
      setTimeout(function(){  LE.hashVar('file', filename);},0);
        LE.resetSaveStatus();
    },

    setEditMode: function(isFile) {

        if (isFile) {
            $('#test-mode').hide();
            $('#edit-mode').show();
        }
        else {
            $('#test-mode').show();
            $('#edit-mode').hide();
        }
    },

    resetSaveStatus: function() {
        LE.currentContents = editAreaLoader.getValue('code');
        document.title = document.title.replace(/^\* /, '');
        window.onbeforeunload = null;
    },

    reload: (function() {

        var firstReload = true;

        return function() {

            var code = editAreaLoader.getValue('code'),
                reloadResult = function() {

                    var form = $('#code').parents('form'),
                        action = form.attr('action');

                    action = action.replace(/\?.*$/, '') + '?' + $.now();
                    form.attr('action', action);

                 //   log(action);
                    $('#code').val(code);
                    form.submit();

                   /*  if (firstReload) { log('reloading...');
                   //     $('#preview-iframe')[0].contentDocument.location.reload(true);
                        firstReload = false;
                    } */

                    $(document).trigger('LE.reload');
                };

            if (LE.currentFile && code !== LE.currentContents) {
                LE.doSaveFile(LE.currentFile, true, reloadResult);
            }
            else {
                reloadResult();
            }
        }

        return;


        var code = editAreaLoader.getValue('code'),
            reloadPreview = function() {
                var frameOrPopup = LE.previewPopup || frames['preview-iframe'];
                frameOrPopup.location = LE.getPreviewUrl();
                $(document).trigger('LE.reload');
            };

        LE.storage('code', code);

        if (LE.currentFile) {

            if (code !== LE.currentContents) {

                LE.doSaveFile(LE.currentFile, true, reloadPreview);
            }
            else {
                reloadPreview();
            }
        }
        else {
            $('#code').val(code).parents('form').submit();
            $(document).trigger('LE.reload');
        }
    }()),

    currentUrl: false,

    setUrl: function() {
        $.fn.dialogbox.open({
            type: 'prompt',
            title: 'Set url',
            message: 'Type a url relative to site root:',
            promptText: LE.currentUrl || '',
            confirm: function(b) {
                LE.updateUrl($.trim(b.prompt()));
            }
        });
    },

    updateUrl: function(url) {

    //    if (!LE.currentFile) url = false;
        url = $.trim((url || '').toString());
    //    url = url || false;
        LE.currentUrl = url;
        $('#url').val(url);
        LE.hashVar('url', url);
        if (url) {
            LE.toolbarButton('setUrl').elm.addClass('set');
        }
        else {
            LE.toolbarButton('setUrl').elm.removeClass('set');
        }
    },

    showShortcuts: (function() {

        var shortcuts = '';
        $.get(LE.baseURI + 'js/config/shortcuts.html', function(r) {
            shortcuts = r;
        });

        return function() {
            LE.dialog({
                title: 'Keyboard shortcuts',
                width: 450,
                closeOnBlur: true,
                message: '<div style="max-height:' + ($(window).height() - 100) + 'px;overflow:auto">' + shortcuts + '</div>',
                okText: 'Close'
            });
        };
    }()),

    cut: function() {

    },

    copy: function() {

    },

    paste: function() {
        editAreaLoader.setSelectedText('code','');
        editAreaLoader.insertTags('code', LE.clipboard, '');
    },

    undo: function() {

    },

    redo: function() {

    },

    findText: function() {

    },

    replaceText: function() {

    },

    zoomIn: function() {

    },

    zoomOut: function() {

    },

    /**
     * duplicates the current selection, or current line if nothing selected
     */
    duplicateSelectedText: function() {

        var sel      = frames.frame_code.editArea.last_selection,
            selStart = sel.selectionStart,
            selEnd   = sel.selectionEnd,
            selected = editAreaLoader.getSelectedText('code'),
            copied   = selected.length ? selected : "\n" + sel.curr_line,
            lineNum  = sel.line_start;

        // go to end of line if nothing selected
        if (!selected.length) {

            editAreaLoader.execCommand('code', 'go_to_line', (lineNum + 1).toString());

            if (lineNum < sel.nb_line) {
                sel = frames.frame_code.editArea.last_selection;
                editAreaLoader.setSelectionRange('code', sel.selectionEnd - 1, sel.selectionEnd - 1);
            }
        }
        // otherwise go to end of selection
        else {
            editAreaLoader.setSelectionRange('code', selEnd, selEnd);
        }

        // insert duplicate of line/selection then revert to previous selection
        editAreaLoader.insertTags('code', copied, '');
        editAreaLoader.setSelectionRange('code', selStart, selEnd);
    },

    openSnippets: function() {

        var popup = LE.popup('snippets');

        popup.isOpen() || popup.open();

        LE.toolbarButton('snippets').on();
    },

    textSizeAdjust: (function() {

        var textSize, min = 8, max = 16;

        return function(increment) {

            textSize = textSize || LE.storage('font-size');

            textSize += parseInt(increment || 0, 10);

            textSize = textSize < min ? min : textSize;
            textSize = textSize > max ? max : textSize;

            LE.storage('font-size', textSize);
            frames.frame_code.editArea.set_font(null, textSize);

            LE.toolbarButton('zoomIn').enable();
            LE.toolbarButton('zoomOut').enable();

            if (textSize === max) LE.toolbarButton('zoomIn').disable();
            if (textSize === min) LE.toolbarButton('zoomOut').disable();
        };

    }()),

    toggleWordWrap: function() {

        LE.toolbarButton('wordWrap').toggle();
        LE.storage('word-wrap', !LE.storage('word-wrap'));
        editAreaLoader.execCommand('code', 'toggle_word_wrap', 1);
    },

    insertTag: function() {

    },

    insertEntity: function() {

    },

    toggleComment: function() {

    },

    showFlyout: function() {

    },

    hideFlyout: function() {

    },

    prefsFormSubmit: function() {

        var prefs = {};

        $('#options .pref').each(function(i, v) {
            var thiz = $(v),
                type = thiz.attr('type');

            prefs[v.id.replace('prefs-', '')] = type === 'checkbox' || type === 'radio' ? v.checked : v.value;
        });

     //   log(prefs);

        LE.toolbarButton('prefs').off();

        LE.savePrefs(prefs);
        return false;
    },

    savePrefs: function(obj) {

        $.each(obj, function(i, v) {
            LE.storage('prefs.' + i, v);
        });
    },

    resizeWindows: function() {

    },

    popupOpen: function() {

    },

    popupClose: function() {

    },

    setSyntax: function(syntax) {

     //   var sel = $(frames.frame_code.document).find('#syntax_selection');

        // if we're loading a file, the passed argument will be the file extension
        // so find out what syntax the extension is associated with (config/syntaxes.js)
        $.each(LE.syntaxes, function(i, v) {
            if (LE.inArray(syntax, v)) {
                syntax = i;
                return false;
            }
        });

        if (!(syntax = LE.isAllowedSyntax(syntax))) {
            LE.dialog('Unrecognised syntax ' + syntax);
            syntax = LE.getDefaultSyntax();
        }

     //   sel.val(syntax);
        editAreaLoader.execCommand('code', 'change_syntax', syntax);
        LE.hashVar('syntax', syntax);
        $(document).trigger('LE.setSyntax');
    },

    cycleSyntax: function() {

        var currentSyntax = LE.hashVar('syntax'),
            nextSyntax,
            getNextItem;

        $.each(LE.syntaxes, function(syntax, exts) {
            if (syntax === currentSyntax) {
                getNextItem = true;
            }
            else if (getNextItem) {
                nextSyntax = syntax;
                return false;
            }
        });

        if (!nextSyntax) {
            nextSyntax = LE.getDefaultSyntax();
        }

        LE.setSyntax(nextSyntax);
    },

    addShortcut: function(key, callback) {

        if (key === '' || typeof key !== 'string' || typeof callback !== 'function') {
            throw new SyntaxError('LE.addShortcut expects string and function, saw ' + key + ', ' + callback);
        }

        LE.shortcuts[key] = callback;
        LE.init.shortcuts();
    }

});