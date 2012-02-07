
LE.init = LE.init || {};

/**
 * Initialise keyboard shortcuts
 */
LE.init.shortcuts = function() {

    var eaElms = $(frames.frame_code.document);

    eaElms = eaElms.add(eaElms.find('#textarea'));

    // bind keydown, keypress and keyup events to main document, editare document
    // and editarea textarea so shortcuts will work wherever the focus is,
    // and existing events can be neutralised if necessary
    // need to use all three events to prevent default editarea/browser actions,
    // but only fire the callback on keydown event
    $(document).add(eaElms)
    .bind('keydown.LEshortcut keypress.LEshortcut keyup.LEshortcut', function(e) {

        var keyCodes = e.type === 'keypress' ? LE.keypressCodes : LE.keyCodes,
            key = keyCodes[e.which],
            regex,
            ret,
            matched = false;

        if (typeof key !== 'string') return;

        $.each(LE.shortcuts, function(text, callback) { //log(text, key);

            regex = new RegExp('(\\+|^)' + LE.pregQuote(key) + '$', 'i');
            
            if (text.match(regex)) {

                matched = true;

                $.each(['ctrl', 'alt', 'shift'], function(i, v) {

                    regex = new RegExp(v + '\\+', 'i');

                    // if shortcut includes ctrl/shift/alt key,
                    // then only fire callback if key is pressed
                    if (text.match(regex)) {
                        matched = e[v + 'Key'] ? matched : false;
                    }
                    // if it doesn't include ctrl/shift/alt key,
                    // then only fire callback if key is not pressed
                    else {
                        matched = e[v + 'Key'] ? false : matched;
                    }

                    if (!matched) return false; // break out of each()
                });

                if (matched) {

                    ret = false;

                    e.type === 'keydown' && callback(e);

                    return false; // break out of each()
                }
            }
        });

        return ret;
    });
};


LE.init.popups = function() {

    $.each(LE.popups, function(i, v) {
        LE.popup(i, v);
    });
    
    var popupHash = LE.hashVar('popups'), popups;
    
    if (popupHash) {
        popups = popupHash.split(',');
        $.each(popups, function(i, v) {
            LE.popup(v).open();
        });
    }
};

LE.init.toolbars = function() {

    $.each(LE.toolbarGroups, function(groupName, buttons) {

        LE.addToolbarGroup(groupName, buttons);
    });
};

// soft parens, or whatever it's called
// that is, typing a paren in front of a paren skips past it instead of adding a new one
LE.init.softParens = function() {

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

LE.init.dragDivider = function() {

    var dragging,
        editor        = $('#editor'),
        preview       = $('#preview'),
        previewIframe = $('#preview-iframe'),
        toolbarHeight = $('#toolbar').outerHeight(),
        eaFrame       = $('#frame_code'),//.width(editor.width()),
        viewButtons   = $('#code-view').parent(),
        doc           = $(document),
        x             = 0,
        y             = 0,
        mask          = $('<div id="mask" />').css({
                            width: doc.width(),
                            height: doc.height()
                        }).appendTo($('body')).hide(),
        dragbar       = $('<div id="dragbar" />').appendTo($('body'))
                        .bind('mousedown', function(e) {
                            mask.show();
                            dragging = true;
                            x = e.pageX;
                            y = e.pageY;
                        });

        function orientbar() {

            switch (LE.viewMode) {
                case 'split-x':
                    dragbar.css({
                        top: toolbarHeight,
                        left: editor.width(),
                        width: 6,
                        height: $(window).height() - toolbarHeight,
                    }).removeClass('active').show();
                    mask.removeClass('active');
                    preview.width(preview.width() - 7).css('padding', '0 0 0 7px');
                    break;
                case 'split-y':
                    dragbar.css({
                        top: toolbarHeight + editor.height() - 2,
                        left: 0,
                        width: doc.width(),
                        height: 6
                    }).addClass('active').show();
                    mask.addClass('active');
                    preview.height(preview.height() - 7).css('padding', '7px 0 0 0');
                    break;
                default:
                    preview.css('padding', 0);
                    dragbar.hide();
            }
        };

    orientbar();

    doc.bind('LE.setViewMode', orientbar);

    doc.bind('mousemove', function(e) {

        if (!dragging) return;

        if ($('#dragbar').hasClass('active')) {

            if (e.pageY < toolbarHeight + 50 || e.pageY > $(window).height() - 50) return;

            var diff = e.pageY - y,
                eHeight = editor.height() + diff,
                pHeight = preview.height() - diff;

            if (diff) {
                editor.height(eHeight);
                eaFrame.height(eHeight);
                preview.height(pHeight);
                previewIframe.height(pHeight);
                dragbar.css('top', toolbarHeight + eHeight - 2);
            }
        }
        else {

            if (e.pageX < 100 || e.pageX > $(window).width() - 100) return;

            var diff = e.pageX - x,
                eWidth = editor.width() + diff,
                pWidth = preview.width() - diff;

            if (diff) {
                editor.width(eWidth);
                eaFrame.width(eWidth);
                preview.width(pWidth);
                previewIframe.width(pWidth);
                dragbar.css('left', eWidth);
            }
        }

        x = e.pageX;
        y = e.pageY;
    })
    .bind('mousedown', function() {
        if (dragging) return false;
    })
    .bind('mouseup', function() {
        dragging = false;
        mask.hide();
    });

};

LE.init.resizeFileBrowser = function() {

    $(window).bind('resize', function() {

     //   LE.resizeFileBrowser();
    });
};

LE.init.checkUndo = function() {

};

LE.init.editArea = function() {

    var eaDoc = $(frames.frame_code.document)/* ,
        syntaxPicker = eaDoc.find('#syntax_selection') */;

    eaDoc.find('#toolbar_1').hide();
   /*  syntaxPicker.insertBefore(eaDoc.find('#resize_area')).find('option:eq(0)').remove();
    syntaxPicker.bind('change', function() {
        LE.hashVar('syntax', this.value);
    }); */
    eaDoc.find('#result').css('overflow', 'auto');
};

LE.init.zeroClipboard = function() {

    LE.loadScript('js/libs/zeroclipboard/ZeroClipboard.js').onload = function() {
        ZeroClipboard.setMoviePath(LE.baseURI + 'js/libs/zeroclipboard/ZeroClipboard.swf');
		
		$.each(['cut', 'copy'], function(i, v) {

			var id = 'toolbar-button-' + v,
				button = $('#' + id),
				zClip = new ZeroClipboard.Client();
			zClip.setHandCursor(false);
			zClip.addEventListener('mouseOver', function() {
				button.trigger('mouseenter');
				zClip.setText(editAreaLoader.getSelectedText('code'));
			});
			zClip.addEventListener('mouseout', function() {
				button.trigger('mouseleave');
			});
			zClip.addEventListener('complete', function() {
				LE.clipboard = editAreaLoader.getSelectedText('code') || editAreaLoader.getValue('code');
				i || editAreaLoader.setSelectedText('code', '');
				button.click();
			}); 
			zClip.glue(id);
		});
		
    };
};

LE.init.previewPopup = function() { return;

    LE.popup('preview-popup', {
        url: 'preview', 
        params: 'width=900,height=600,scrollbars=yes',
        openTest: function() { return true;
            return LE.viewMode === 'popup';
        },
        onLoad: LE.reload,
        onClose: function() {
            LE.viewMode === 'popup' && LE.setViewMode('code');
            LE.reload();
        }
    });
};

LE.init.saveStatus = function() {

    LE.currentContents = editAreaLoader.getValue('code');

    (function checkModifications() {

        if (!document.title.match(/^\* /) && LE.currentFile && editAreaLoader.getValue('code') !== LE.currentContents) {
            document.title = '* ' + document.title;
            window.onbeforeunload = function(){ return 'Are you sure?'; };
        }

        setTimeout(checkModifications, 500);
    }());
}

LE.init.hashListeners = function() {

    function fileInit() {

        var file = LE.hashVar('file');

        if (file) {
            LE.doOpenFile(file);
        }
        else {
            if (!$('#code').val()) {
                LE.newFile();
            }
            else {
                LE.setFile(false);
            }
        }
    }
    // LE.hashVar('file') || 
    fileInit();

    LE.attachHashListener('file', fileInit);

    LE.attachHashListener('url', function(url) { //log(url);
        url = $.trim(url);
        LE.updateUrl(url);
    });
};

LE.init.setView = function() {

    function adjustPanels() {
        LE.setViewMode(LE.hashVar('viewmode'));
    }
    $(window).resize(adjustPanels);
    
    //LE.hashVar('viewmode') || 
    adjustPanels(); 
    LE.attachHashListener('viewmode', adjustPanels);
};

LE.init.parseHash = function() {
    $(window).trigger('hashchange');
};

LE.init.toolTips = function() {
    $('[title]').tooltip();
};

LE.init.checkUndo = function() {

 //   var eaFrame = window.frames.frame_code, ea = eaFrame.editArea;

/*     $('#toolbar').click(function() {
    
        log(ea.previous.length ? 'undo enabled' : 'undo disabled');
        log(ea.next.length ? 'redo enabled' : 'redo disabled');
    
 //       window.arse = true;
 //       log('prev'); console.dir(ea.previous); log('next'); console.dir(ea.next); log('----------');
    }); */
    
//


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



return;    
    var disabled;
    (function checkundooo() {
        
        if (window.arse) {
            log('prev'); console.dir(ea.previous); log('next'); console.dir(ea.next); log('----------');
            window.arse = false;
        }
    return;
        if (ea.previous.length) { 
        
        
        if (disabled || disabled === undefined) {
            log('enabling undo:');console.dir(ea.previous); disabled = false;
        }
        
        
       //     LE.toolbarButton('undo').enable();
        }
        else { 
            if (!disabled || disabled === undefined) {
                log('disabling undo:');console.dir(ea.previous); disabled = true;
            }
      //      LE.toolbarButton('undo').disable();
        }

        if (ea.next.length) {
    //        LE.toolbarButton('redo').enable();
        }
        else {
     //       LE.toolbarButton('redo').disable();
        }

        setTimeout(checkundooo, 1000);
    })();
};

/* LE.init.clipboardButtons = function() { //return;

    $.each(['cut', 'copy'], function(i, v) {

        var id = 'toolbar-button-' + v,
            button = $('#' + id),
            zClip = new ZeroClipboard.Client();
        zClip.setHandCursor(false);
        zClip.addEventListener('mouseOver', function() {
            button.trigger('mouseenter');
            zClip.setText(editAreaLoader.getSelectedText('code'));
        });
        zClip.addEventListener('mouseout', function() {
            button.trigger('mouseleave');
        });
        zClip.addEventListener('complete', function() {
            LE.clipboard = editAreaLoader.getSelectedText('code') || editAreaLoader.getValue('code');
            i || editAreaLoader.setSelectedText('code', '');
            button.click();
        }); 
        zClip.glue(id);
    });

}; */

LE.init.autoCompleteAddWords = function() { 
	// looks lke ea onready fires before plugins have loaded, so we need this shit
	if (frames.frame_code.autoCompleteWords) {

        var helpers = ['debug()', 'pre()', 'br()', 'gbr()', 'hr()', 'ghr()'];

            frames.frame_code.editArea.execCommand('autocomplete_add_words', {
                php: helpers,
                js: helpers
            });
	}
	else {
		setTimeout(function() { LE.init.autoCompleteAddWords(); }, 500);
	}
};

// stop the browser remembering last location of iframe
$(document).ready(function() {
    var iframe = $('#preview-iframe')[0];
    iframe.src = iframe.src;
});