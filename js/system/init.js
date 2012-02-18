
LE.init = LE.init || {};

/**
 * Initialise keyboard shortcuts
 */
LE.init.shortcuts = function() {

    var eaElms = LE.editor.getKeyElements();

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

LE.init.dragDivider = function() {

    var dragging,
        editor        = $('#editor'),
        preview       = $('#preview'),
        previewIframe = $('#preview-iframe'),
        toolbarHeight = $('#toolbar').outerHeight(),
        eaFrame       = LE.editor.getContainer(),
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
        
        $(document).trigger('LE.dragging');
    })
    .bind('mousedown', function() {
        if (dragging) return false;
    })
    .bind('mouseup', function() {
        if (dragging) $(document).trigger('LE.dragStop');
        dragging = false;
        mask.hide();
    });

};

LE.init.resizeFileBrowser = function() {

    $(window).bind('resize', function() {

     //   LE.resizeFileBrowser();
    });
};

LE.init.zeroClipboard = function() {

    LE.load('js/libs/zeroclipboard/ZeroClipboard.js', function() {

        ZeroClipboard.setMoviePath(LE.baseURI + 'js/libs/zeroclipboard/ZeroClipboard.swf');

		$.each(['cut', 'copy'], function(i, v) {

			var id = 'toolbar-button-' + v,
				button = $('#' + id),
				zClip = new ZeroClipboard.Client();
			zClip.setHandCursor(false);
			zClip.addEventListener('mouseOver', function() {
				button.trigger('mouseenter');
				zClip.setText(LE.editor.getSelection());
			});
			zClip.addEventListener('mouseout', function() {
				button.trigger('mouseleave');
			});
			zClip.addEventListener('complete', function() {
				LE.clipboard = LE.editor.getSelection() || LE.editor.getValue();
				i || LE.editor.replaceSelection('');
				button.click();
			});
			zClip.glue(id);
		});
    });
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

    LE.currentContents = LE.editor.getValue();

    (function checkModifications() {

        if (!document.title.match(/^\* /) && LE.currentFile && LE.editor.getValue() !== LE.currentContents) {
            document.title = '* ' + document.title;
            window.onbeforeunload = function(){ return 'This file contains unsaved changes!'; };
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

// stop the browser remembering last location of iframe
$(document).ready(function() {
    var iframe = $('#preview-iframe')[0];
    iframe.src = iframe.src;
});