$.extend(LE, {

    setDividerPosition: function() {

    },

    dialog: $.fn.dialogbox.open,

    setViewMode: function(mode) {

        var editor    = LE.editor.getContainer().add($('#editor')),
         //   eaFrame   = $('#frame_code'),
            preview   = $('#preview, #preview-iframe'),
            win       = $(window),
            winWidth  = win.width(),
            winHeight = win.height() - $('#toolbar').outerHeight(true),
            different = LE.viewMode !== mode;

        LE.viewMode = mode;

        $('#preview').css('margin-top', 0)//.css('padding', 0);

        switch (mode) {
            case 'split-y':
                editor.add(preview).width(winWidth).height(winHeight / 2).show();
                // stupid hack to compensate for 2px gap coming from fuck knows where
                $('#preview').height((winHeight / 2) + 2).css('margin-top', -2);
                break;
            case 'preview':
                preview.width(winWidth).height(winHeight).show();
                // can't hide editarea or it fucks when page loaded in preview mode
                editor.css('height', 0);
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
                editor.width(winWidth).height(winHeight + 0).show(); // NB: editarea needs winHeight + 3
                preview.hide();
                break;
            case 'split-x':
            default:
                if (mode !== 'split-x') {
                    mode = LE.viewMode = 'split-x';
                    LE.hashVar('viewmode', 'split-x');
                }
                editor.add(preview).width(winWidth / 2).height(winHeight).show();
                editor.height(winHeight + 0); // see NB above
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
        LE.editor.setValue(LE.storage('prefs.newfile'));
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

                LE.editor.setValue(json.text);

                LE.setFile(filename);
                
                $(document).trigger('LE.openFile');
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

        var editorContents = LE.editor.getValue();

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

        var ext;

        // update syntax if file is different
        if (filename && filename !== LE.currentFile) {

            if (ext = /\.(\w+)$/.exec(filename)) {
                LE.setSyntax(ext[1]);
            }

            if (!LE.currentUrl) {
                $('#url').val(filename);
            }
        }

        // go to line 1 for new or newly opened file
        if (!filename || filename !== LE.currentFile) {
            LE.editor.goToLine(1);
        }

    //    LE.storage('latest-file', filename);

        if (filename) {
            LE.toolbarButton('setUrl').enable();
        }
        else {
            LE.toolbarButton('setUrl').disable();
            LE.updateUrl(false);
        }
        
        if (filename !== LE.currentFile) {
            LE.editor.clearHistory();
        }

        LE.currentFile = filename;
        LE.setEditMode(!!filename);
        LE.setDocTitle();
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
        LE.currentContents = LE.editor.getValue();
        document.title = document.title.replace(/^\* /, '');
        window.onbeforeunload = null;
    },

    reload: (function() {

        var firstReload = true;

        return function() {

            var code = LE.editor.getValue(),
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


        var code = LE.editor.getValue(),
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
        LE.editor.replaceSelection('');
        LE.editor.wrapSelection(LE.clipboard, '');
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

        LE.editor.duplicateSelection();
    },

    openSnippets: function() {

        var popup = LE.popup('snippets');

        popup.isOpen() || popup.open();

        LE.toolbarButton('snippets').on();
    },

    textSizeAdjust: (function() {

        var textSize, min = 8, max = 20;
        
        function enableOrDisableButtons() {

            var size = parseInt(LE.storage('font-size'), 10);
        
            LE.toolbarButton('zoomIn').enable();
            LE.toolbarButton('zoomOut').enable();

            if (size === max) LE.toolbarButton('zoomIn').disable();
            if (size === min) LE.toolbarButton('zoomOut').disable();
        }
        
        $(document).bind('LE.fontSizeAdjust', enableOrDisableButtons);

        return function(increment) {

            textSize = textSize || LE.storage('font-size');

            textSize += parseInt(increment || 0, 10);

            textSize = textSize < min ? min : textSize;
            textSize = textSize > max ? max : textSize;

            LE.storage('font-size', textSize);
            LE.editor.setFontSize(textSize);
        };

    }()),

    toggleWordWrap: function() {

        LE.toolbarButton('wordWrap').toggle();
        LE.storage('word-wrap', !LE.storage('word-wrap'));
        LE.editor.toggleWordWrap();
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
        
        $(document).trigger('LE.savePrefs');
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
        LE.editor.setSyntax(syntax);
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