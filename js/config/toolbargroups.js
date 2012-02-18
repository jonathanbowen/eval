LE.toolbarGroups = {

    reload: {
        reload: {
            title: 'Reload',
            callback: LE.reload
        },
        setUrl: {
            title: 'Set url',
            callback: LE.setUrl
        }
    },
    file: {
        'new': {
            title: 'New file',
            callback: LE.newFile,
            contextMenu: {
                'New file': LE.newFile,
                'New file (in new tab)': function() {
                    window.open(LE.baseURI);
                },
                'Clear contents': function() {
                    LE.editor.setValue('');
                }
            }
        },
        open: {
            title: 'Open file',
            callback: LE.openFile
        },
        save: {
            title: 'Save file',
            callback: function() { LE.saveFile(); },
            contextMenu: {
                'Save file': function() { LE.saveFile(); },
                'Save as...': function() { LE.saveFile(true); }
            }
        }
    },
    clipboard: {
        cut: {
            title: 'Cut'
        },
        copy: {
            title: 'Copy'
        },
        paste: {
            title: 'Paste',
            callback: LE.paste
        },
    },
    undo: {
        undo: {
            title: 'Undo',
            callback: LE.editor.undo
        },
        redo: {
            title: 'Redo',
            callback: LE.editor.redo
        }
    },
    find: {
        find: {
            title: 'Find / replace',
            flyout: $('#searchform'),
            init: LE.searchFormInit
        }
    },
    editorText: {
        zoomIn: {
            title: 'Increase text size',
            callback: function() { LE.textSizeAdjust(1); }
        },
        zoomOut: {
            title: 'Decrease text size',
            callback: function() { LE.textSizeAdjust(-1); }
        },
        wordWrap: {
            title: 'Toggle word wrap',
            callback: LE.toggleWordWrap,
            init: function(button) {
                LE.storage('word-wrap') && button.on();
            }
        }
    },
    insert: {
        insertTag: {
            title: 'Insert tag',
            flyout: function(id) {
                return LE.createScrollMenu(id, LE.zenCoding());
            }
        },
        insertEntity: {
            title: 'Insert entity',
            flyout: function(id) {
                var ret = {};
                $.each(LE.htmlEntities, function(i, v) {
                    ret['&' + v + ';&nbsp; &amp;' + v + ';'] = {
                        callback: function() {
                            LE.editor.wrapSelection('&' + v + ';', '');
                        }
                    };
                });
                return LE.createScrollMenu(id, ret);
            }
        },
        toggleComment: {
            title: 'Toggle comment',
            flyout: function(id) {
                return LE.createScrollMenu(id, {
                    'Single line comment <b>//</b>': { callback: LE.toggleComment.single },
                    'Block comment <b>/* */</b>': { callback: LE.toggleComment.block },
                    'HTML comment <b>&lt;!-- --&gt;</b>': { callback: LE.toggleComment.html }
                });
            }
        },
        colour: {
            title: 'Colour picker',
            flyout: '<form action="" id="picker-holder" class="flyout-inner"><div><input type="text" id="picker-colour" value="#123456"></div><div id="picker"></div><div><div><input type="button" value="Insert"> <input type="button" value="Close"></div></div></form>',
            init: function() {
            
                LE.load(['js/libs/farbtastic/farbtastic.css', 'js/libs/farbtastic/farbtastic.js'], function() {
                
                    $('#picker').farbtastic($('#picker-colour'));
                    $('#picker-holder input[value=Insert]').click(function() {
                        LE.editor.replaceSelection($('#picker-colour').val());
                        LE.toolbarButton('colour').off();
                    });
                    $('#picker-holder input[value=Close]').click(function() {
                        LE.toolbarButton('colour').off();
                    });
                });
            }
        }
    },
    snippets: {
        snippets: {
            title: 'Snippets and macros',
            callback: LE.openSnippets,
            init: function(button) {
                var win = LE.popup('snippets').win;
                win && button.on();
                button.elm.click(function() {
                    var win = LE.popup('snippets').win;
                    win && win.focus();
                });
            }
        }
    },
    view: {
        'code-view': {
            title: 'Code view',
            callback: function() {
                LE.setViewMode('code');
            }
        },
        'split-x-view': {
            title: 'Split horizontal',
            callback: function() {
                LE.setViewMode('split-x');
            }
        },
        'split-y-view': {
            title: 'Split vertical',
            callback: function() {
                LE.setViewMode('split-y');
            }
        },
        'preview-view': {
            title: 'Preview',
            callback: function() {
                LE.setViewMode('preview');
            }
        },
        'popup-view': {
            title: 'Open preview in popup',
            callback: function() {
                LE.setViewMode('popup');
            }
        }
    },
    prefs: {
        prefs: {
            title: 'Preferences',
            flyout: $('#options'),
            callback: LE.populatePrefsForm,
            init: function(button) {
                $('#options').submit(LE.prefsFormSubmit);
                $('#options input[type=button]').click( function() { button.off(); });
            }
        },
        shortcuts: {
            title: 'View keyboard shortcuts',
            callback: LE.showShortcuts
        }
    },
    syntax: {
        syntax: {
            title: 'Set syntax',
            init: function(button) {
                button.elm.text(LE.getCurrentSyntax());
                $(document).bind('LE.setSyntax', function() {
                    button.elm.text(LE.getCurrentSyntax());
                });
            },
            flyout: function(id) {
                var obj = {};
                $.each(LE.syntaxes, function(syntax, exts) {
                    obj[syntax] = {
                        callback: function() {
                            LE.setSyntax(syntax);
                        }
                    };
                });
                return LE.createScrollMenu(id, obj);
            }
        }
    }
};