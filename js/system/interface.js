$.extend(LE, {

    getPreviewUrl: function() {

        return LE.currentFile ? '/' + (LE.currentUrl || LE.currentFile) + '?' + $.now() : LE.baseURI + 'preview'
    },

    resetUndo: function() {

    },

    setAutoComplete: function() {
    
        frames.frame_code.editArea.execCommand('autocomplete_enable', LE.storage('prefs.autocomplete'));
    },

    // set page title - prepend name of active file if any
    setDocTitle: function() {

        var docTitle = document.title.replace(/^.*\| /, '');

        if (LE.currentFile) {
            docTitle = LE.currentFile.replace(/^.*\//, '') + ' [' + LE.currentFile + '] | ' + docTitle;
        }

        document.title = docTitle;
    },

    createScrollMenu: function(id, obj) {

        var spans = $();

        obj && $.each(obj, function(text, item) {

            var span = $('<span class="' + (item.className || '') + '" title="' +
                (item.title || '') + '">' + text + '</span>').click(function() {

                item.callback(this) === false || LE.toolbarButton(id).off();
            });

            spans = spans.add(span);
        });

        return spans.length ? $('<div class="scroll-menu" />').append(spans) : false;
    },

    showFileBrowser: function(mode, saveAs) {

        var iframe = $('#file-iframe'),
            loc = iframe[0].src,
            height = $(window).height() - 200;

        mode = mode === 'open' ? mode : 'save';

        // if existing file and not saving as,
        // go ahead and save without dialog
        if (mode === 'save' && LE.currentFile && !saveAs) {
            LE.doSaveFile(LE.currentFile, true);
            return;
        }

        height = height > 100 ? height: 100;
        iframe.css('height', height);

        if (iframe.data('mode') !== mode) {
            iframe[0].src = iframe.data('baseurl') + 'browse/' + mode;
            iframe.data('mode', mode);
        }

        $.fn.dialogbox.open({
            message: iframe,
            title: mode === 'save' ? 'Save file' : 'Open file',
            confirm: function(box) {
             //
                if (!LE.fileBrowserValue) {
                    return;
                }
                if (mode === 'open') {
                    LE.doOpenFile(LE.fileBrowserValue);
                }
                else {
                    LE.doSaveFile(LE.fileBrowserValue);
                }
            },
            okText: mode === 'save' ? 'Save' : 'Open',
            width: 550,
            type: 'confirm'
        });
    },

    fileBrowserValue: '',

    fileBrowserInit: function(mode, jQ, win) { //log(typeof LE.fileBrowserGetSyntax());

        var currentSyntax = LE.getCurrentSyntax();

        mode = mode === 'open' ? mode : 'save';

        if (mode === 'save') {
            jQ('#filename').val('untitled.' + currentSyntax);
            LE.fileBrowserValue = jQ('#filename').val();
        }

        jQ('#filename').bind('keyup', function() {
            LE.fileBrowserValue = this.value;
        });

        jQ('#file-list a').live('click', function(e) {
            var filename = jQ(this).data('filename');
            if (mode === 'save' && jQ(this).hasClass('dir')) {
                filename += '/untitled.' + currentSyntax;
            }
            jQ('#filename').val(filename);
            LE.fileBrowserValue = jQ('#filename').val();
            return false;
        });

        jQ('#file-list .dir').live('click', function() {

            var thiz = jQ(this),
                parentLi = thiz.parent(),
                subFolderList = parentLi.find('ul');

            if (subFolderList.length) {
                subFolderList.remove();
            }
            else {
                jQ.get(win.location.href, {dir:thiz.data('filename')}, function(response) {
                    parentLi.html(parentLi.html() + response);
                    parentLi.find('a:eq(0)').focus();
                });
            }
        });

        jQ('#file-list .file').live('dblclick', function() {
            $(document).trigger('dialogbox.confirm');
            return false;
        });

        jQ('form').submit(function() {
            $(document).trigger('dialogbox.confirm');
            return false;
        });

        (function () {
            var spaceAvailable = jQ(win).height() - jQ('form').outerHeight(true) - 10;
            jQ('#file-list').css('height', spaceAvailable);
        }());

    },

 /*    resizeFileBrowser: function() {

        var jQ = $('#file-iframe')[0].contentWindow.jQuery,
            spaceAvailable = jQ(window).height() - jQ('form').outerHeight(true) - 10;

        jQ('#file-list').css('height', spaceAvailable);
    },
     */
    fileBrowserOpen: function() {

    },

    fileBrowserSave: function() {

    },

    getAvailableSyntaxes: function() {

        var syntaxes = [];
        $.each(LE.syntaxes, function(i) {
            syntaxes.push(i.toLowerCase());
        });
        return syntaxes;
    },

    isAllowedSyntax: function(syntax) {

        syntax = (syntax || '').toLowerCase();
        return LE.inArray(syntax, LE.getAvailableSyntaxes()) ? syntax : false;
    },

    getDefaultSyntax: function() {

        $.each(LE.syntaxes, function(i) {
            syntax = i.toLowerCase();
            return false;
        });
        return syntax;
    },

    getCurrentSyntax: function() {

        return LE.isAllowedSyntax(LE.hashVar('syntax')) || LE.getDefaultSyntax();
    },

    populatePrefsForm: function() {

        $('#options .pref').each(function(i, v) {

            var thiz = $(v),
                type = thiz.attr('type'),
                pref = v.id.replace('prefs-', ''),
                r;

            if (type === 'checkbox' || type === 'radio') {
                v.checked = !!LE.storage('prefs.' + pref);
                if (!v.checked) {
                    r = $('#' + v.id + '-off');
                    r[0] && (r[0].checked = true);
                }
            }
            else {
                v.value = LE.storage('prefs.' + pref);
            }
        });
    },

    searchFormInit: function() {

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
    },

    clipboardButtonInit: function(button) {

        var zClip = new ZeroClipboard.Client();

        zClip.setHandCursor(true);
        zClip.addEventListener('mouseOver', function() {
            button.elm.trigger('mouseenter');
            zClip.setText(editAreaLoader.getSelectedText('code'));
        });
        zClip.addEventListener('mouseout', function() {
            button.elm.trigger('mouseleave');
        });
        zClip.addEventListener('complete', function() {
            LE.clipboard = editAreaLoader.getSelectedText('code') || editAreaLoader.getValue('code');
            button.id === 'copy' || editAreaLoader.setSelectedText('code', '');
            button.elm.click();
        });
        zClip.glue(button.elm[0].id);
    }
});