// jQuery dialog boxes
// Jonathan Bowen 2008-2010

(function($) {

    var
    /**
     * Box configuration settings
     */
        Config = {
            afterClose: $.noop,                    // function triggered after box has been closed
            afterOpen: $.noop,                     // function triggered after box has been opened
            beforeClose: $.noop,                   // function triggered before box has been closed
            beforeOpen: $.noop,                    // function triggered before box has been opened
            cancel: $.noop,                        // function triggered when cancel button clicked
            cancelText: 'Cancel',                  // text of cancel button
            className: '',                         // class name added to box and background mask
            closeOnBlur: false,                    // whether the box can be closed by clicking/focussing away
            confirm: $.noop,                       // function triggered when confirm button is clicked
            draggable: true,                       // whether the box can be dragged around the viewport
            dragStart: $.noop,                     // function triggered when box is dragged
            dragStop: $.noop,                      // function triggered when box is dropped
            easing: 'swing',                       // easing type
            fading: $.browser.msie ? 0 : 'fast',   // fade duration when box is faded in and out
            focus: false,                          // form element to be initially focussed (css selector)
            loadbar: false,                        // whether to add a loading indicator
            maskOpacity: 0.3,                      // opacity of background mask
            message: '',                           // box contents - string, jQuery object or DOM element
            morphing: 'fast',                      // animation duration when box moves or changes size
            okText: 'Ok',                          // text of confirm button
            position: 'center',                    // position of box in the page (string or 2-element array)
            preventDefault: true,                  // whether to prevent default action of box-triggering event
            promptText: '',                        // for prompt boxes, initial text of prompt input
            promptType: 'text',                    // for prompt boxes, input type (only text or password)
            restore: true,                         // whether to restore message to the page when box is closed
            shakes: true,                          // whether to shake box if user clicks away
            stopPropagation: true,                 // whether to prevent box-triggering event from bubbling
            title: '',                             // text of title bar
            type: 'alert',                         // box type - alert, confirm or prompt
            width: 270                             // box width
        },
    /**
     * Variables for storing current box state - only accessed internally
     */
        Current = {
            dragging: false,
            focussed: false,
            id: 0,
            left: 0,
            msgHeight: 0,
            options: {},
            outerHeight: 0,
            restoreTo: {},
            srcEvent: false,
            top: 0,
            width: 0
        },

        $window = $(window),
        $document = $(document),
        IE6 = $.browser.msie && $.browser.version.substr(0, 1) < 7 ? true : false;

    /**
     * Attach box-triggering event
     *
     * @param  {Object|String}  options config options or function to generate same
     * @param  {String} evt     event to attach box to
     * @return {Object} jQuery
     */
    $.fn.dialogbox = function(options, evt) {

        evt = (evt || 'click').replace(/(\S+)/g, '$1.dialogbox');
        $(this).unbind(evt).bind(evt, function(e, extraParams) { // extra params can be passed when trigger()ing
            Current.srcEvent = e;
            $.fn.dialogbox.open(typeof options === 'function' ? options(e, extraParams) : options);
            handleEvent(e);
        });
        return this;
    };

    /**
     * Open a new box
     *
     * @param  {Object} options config options
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.open = function(options) {

        // close any existing boxes
        storeDimensions();
        if ($('#dialogbox_outer').length) {
            $.fn.dialogbox.close(false, true);
        }

        // store parameters in a variable that can be accessed by other functions
        options = options && typeof options === 'object' ? options : { message: options };
        var pos = options.position;
        options = $.extend({}, Config, options);

        // attach user-defined events
        bindUserEvents(options);

        $document.trigger('dialogbox.beforeOpen');

        // very hackish fix that prevents box from being moved to default position when
        // replacing an existing box, unless position explicitly set
        options.position = pos;
        var callbackRan = false,
            fadeDuration = Current.outerHeight ? 0 : options.fading,
            callback = function() {

                // don't let the callback run more than once
                if (!callbackRan) {
                    // doesn't fade in if box is taller than the viewport (don't know why), so need to set explicitly
                    // only run this if opacity is not 1, as ie messes up transparent pngs when opacity is set
                    var outer = $('#dialogbox_outer');
                    if (fadeDuration && outer.css('opacity') !== '1') {
                        $('#dialogbox_outer').css('opacity', 1);
                    }
                    if (IE6) {
                        $('body').children('*[id!=dialogbox_outer]').find('select').css({display: 'none'});
                    }
                    callbackRan = true;
                }
            },
            elms = $('<div/>', {
                    id: 'dialogbox_mask',
                    css: { height: $document.height() + 'px', opacity: options.maskOpacity }
                }).add(
                $('<form/>', {
                    action: '',
                    onsubmit: 'return false',
                    id: 'dialogbox_outer',
                    html: '<div id="dialogbox_top_left"></div><div id="dialogbox_top_right"></div><div id="dialogbox_handle"><div id="dialogbox_handle_inner"></div></div><div id="dialogbox_inner"><div id="dialogbox_message"><div id="dialogbox_bottom_left"></div><div id="dialogbox_bottom_right"></div><div id="dialogbox_message_inner"></div><div id="dialogbox_buttons"></div></div></div>'
                })
                ).appendTo($('body')).hide();
        // for 0 fade duration, simply set display:block rather than fade with 0 duration,
        // as ie will mess up transparent pngs and text smoothing when opacity is set
        if (fadeDuration) {
            elms.fadeIn(fadeDuration, callback);
        } else {
            elms.show();
            callback();
        }

        $.fn.dialogbox.set(options);

        $document.trigger('dialogbox.afterOpen');

        return this;
    };

    /**
     * Alter properties of existing box
     *
     * @param  {Object} options config options or config key
     * @param  {Mixed}  v       config value, if key used for first argument
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.set = function(options, v) {

        var outer = $('#dialogbox_outer'),
            inner = $('#dialogbox_inner'),
            mask = $('#dialogbox_mask'),
            msgholder = $('#dialogbox_message'),
            msgdiv = $('#dialogbox_message_inner'),
            buttons = $('#dialogbox_buttons'),
            promptVal = $.fn.dialogbox.prompt();

        if (!outer.length) {
            return this;
        }

        if (v !== undefined) {
            var k = options;
            options = {};
            options[k] = v;
        }
        else if (typeof options !== 'object') {
            options = { message: options };
        }

        // apply parameters to box
        if (options.message !== undefined) {

            var formVals = $.fn.dialogbox.form();
            if (typeof options.message !== 'object') {
                msgdiv.html(options.message);
            }
            else {
                options.message = options.message instanceof jQuery ? options.message : $(options.message);

                // if the message is DOM element(s), save location in the DOM so it/they can be restored on box close
                // if we've already got saved elements, restore before saving the new ones
                restore();
                options.message.each(function(i, elm) {
                    var $elm = $(elm);
                    Current.restoreTo[i] = {
                        parent: $elm.parent(),
                        next: $elm.next(),
                        previous: $elm.prev()
                	}
                });
                msgdiv.append(options.message);
            }
            // repopulate the form
            // so entered input does not disappear if fields have been added in an html string
            if (formVals.length) {
                $.fn.dialogbox.form(formVals);
            }
        }

        if (options.title !== undefined) {
            $('#dialogbox_handle_inner').text(options.title);
        }

        // merge parameters with existing box parameters
        $.extend(Current.options, options);

        // see if there's an existing box
        // if so, get its dimensions for transition animation
        // and bind new user events
        // (this will not be true if called straight from open())
        if ($('#dialogbox_ok').length) {
            bindUserEvents(Current.options);
            storeDimensions();
            $('#dialogbox_loadbar').remove();
            options.maskOpacity !== undefined && $('#dialogbox_mask').stop().fadeTo(Current.options.fading, options.maskOpacity);
        }

        buttons.empty();
        $('<input id="dialogbox_ok" type="submit" value="' + Current.options.okText + '" />').appendTo(buttons);
        if (Current.options.type !== 'alert') {
            $('<input id="dialogbox_cancel" type="button" value="' + Current.options.cancelText + '" />').appendTo(buttons);
        }
        $('#dialogbox_input').remove();
        if (Current.options.type === 'prompt') {
            ($('<input id="dialogbox_input" name="dialogbox_input" maxlength="30" type="' +
                (Current.options.promptType === 'password' ? 'password' : 'text') +
                '" value="' +
                // using options rather than Current.options here,
                // because we don't want an inherited option to overwrite any user-entered data
                (options.promptText !== undefined ? options.promptText : promptVal) + '" />')).appendTo(msgdiv);
        }

        typeof Current.options.className === 'string' && outer.add(mask).attr('class', Current.options.className);
        outer.addClass('dialogbox_' + Current.options.type + ($.browser.msie ? ' dialogbox_ie' : ''));

        // sort out box dimensions and perform transitions if necessary
        outer.css('width', Current.options.width + 'px');

        var newHeight = msgdiv.css('height', 'auto').css('overflow', 'visible').height(),
            oldHeight = Current.msgHeight || newHeight,
            hDiff = newHeight - oldHeight,
            wDiff = Current.width ? Current.options.width - parseFloat(Current.width.replace('px', '')) : 0;

        Current.width && outer.css('width', Current.width);

        if (!Current.outerHeight || options.position !== undefined) {

            options.position = options.position === undefined || options.position === null ?
                Config.position : options.position;
            var css = {},
                horizontals = ['left', 'right'],
                verticals = ['top', 'bottom'],
                strings = horizontals.concat(verticals),
                yAdjust = outer.css('position') === 'absolute' ? $document.scrollTop() : 0,
                coords = typeof options.position === 'object' ?
                    options.position : options.position.toString().replace(/^\s+|\s+$/, '').split(/\s+/);
            coords = $.extend(['center', 'center'], coords.slice(0, 2));
            if ($.inArray(coords[0], verticals) > -1 || $.inArray(coords[1], horizontals) > -1) {
                coords.reverse();
            }

            $.each(coords, function(k, coord) {

                var d = k ? 'top' : 'left';
                coord = coord ? coord.toString() : '0';
                if ($.inArray(coord, strings.slice(k * 2, (k * 2) + 2)) > -1) {

                    switch (coord) {
                        case 'top':
                        case 'left':
                            css[d] = 0;
                            break;
                        case 'bottom':
                            css[d] = $window.height() - outer.outerHeight();
                            break;
                        case 'right':
                            css[d] = $window.width() - Current.options.width;
                    }
                }
                else if (!coord.match(/^[\d\.-]+(px)?$/)) {

                    css[d] = (k ? (yAdjust + ($window.height() / 2) - (outer.outerHeight() / 2))
                                : (($window.width() / 2) - (Current.options.width / 2)));
                }
                else {
                    css[d] = coord.replace(/[^\d\.-]+/g, '');
                    var num = parseFloat(css[d].replace(/[^\d\.]+/g, ''));
                    css[d] = css[d].substr(0, 1) === '-' ?
                        ((k ? $window.height() - outer.outerHeight() + yAdjust
                            : ($document.width() - Current.options.width)
                          ) - num)
                        : num + (k ? yAdjust : 0);
                }
            });
            css.left = parseFloat(css.left) > 0 ? css.left : 0;
            css.width = Current.options.width;
            if (Current.outerHeight) {

                morph(outer, {
                    top: Current.top,
                    left: Current.left,
                    width: Current.width
                }, css, 'adjustPosition');
            }
            else {
                outer.css(css);
                $.fn.dialogbox.adjustPosition();
            }
        }
        else {
            morph(outer, {
                top: Current.top,
                left: Current.left,
                width: Current.width
            }, {
                top: (hDiff > 0 ? '-' : '+') + '=' + Math.abs(hDiff / 2),
                width: Current.options.width,
                left: parseFloat(Current.left.replace('px', '')) - (wDiff / 2)
            }, 'adjustPosition');
        }

        morph(msgdiv, {overflow: 'hidden', height: oldHeight + 'px'}, {
            height: (hDiff > 0 ? '+' : '-') + '=' + Math.abs(hDiff)
        }, 'focus');

        addEvents();
        setDrag(Current.options.draggable);

        if (Current.options.loadbar) {
            $.fn.dialogbox.addLoadbar();
            Current.options.loadbar = false;
        }

        return this;
    };

    /**
     * Close box
     *
     * @param  {Function} callback Function to be called after box has been faded and removed
     * @param  {Boolean}  nofade   Whether to set fade duration to 0
     * @param  {Number}   boxId    Id of current box
     * @return {Object}   $.fn.dialogbox
     */
    $.fn.dialogbox.close = function(callback, nofade, boxId) {

        var elms = $('#dialogbox_outer, #dialogbox_mask'),
            fadeDuration = nofade ? 0 : Current.options.fading,
            cb = function() {
                // don't let the callback run more than once
                if (!$('#dialogbox_outer').length) {
                    return;
                }
                // if message has been grabbed from the DOM, try to put it back in its original location
                // so original function can be reused
                restore();
                elms.remove();
                IE6 && $('select').css({display: ''});
                $document.trigger('dialogbox.afterClose');
                Current.focussed = false;
            };

        // prevent from closing newly created/altered boxes
        if (!boxId || boxId === Current.id) {

            $document.trigger('dialogbox.beforeClose');
            callback && bindUserEvents({afterClose:callback});

            // if close() is called within confirm or cancel functions,
            // set id prevents the former from running again after the latter have completed
            setId();
            if (fadeDuration) {
                elms.stop().fadeOut(fadeDuration, cb);
            }
            else {
                cb();
            }
        }
        return this;
    };

    /**
     * Add loading indicator and disable confirm/cancel functions
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.addLoadbar = function() {

        if (!$('#dialogbox_outer').length) {
            $.fn.dialogbox.open();
        }
        if (!$('#dialogbox_loadbar').length) {

            // reset box id: so this function can be included within confirm or cancel functions
            // without the box being immediately closed after those functions have completed
            setId();
            var buttonholder = $('#dialogbox_buttons');
            $('#dialogbox_ok').unbind().focus();
            buttonholder.find('input').css('visibility', 'hidden');
            $('<div id="dialogbox_loadbar" />').css({
                height: buttonholder.outerHeight(), width: buttonholder.outerWidth()
            }).appendTo(buttonholder);
        }
        return this;
    };

    /**
     * Remove loading indicator if present and reattach events
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.removeLoadbar = function() {

        $('#dialogbox_buttons').find('input').css('visibility', 'visible');
        $('#dialogbox_loadbar').remove();
        addEvents();
        return this;
    };

    /**
     * Getter and setter for prompt input value
     *
     * @param {String}         val  value for input
     * @return {Object|String} $.fn.dialogbox if setting, input value if getting
     */
    $.fn.dialogbox.prompt = function(val) {

        var result;
        if (val !== undefined) {
            $('#dialogbox_input').val(val);
            result = this;
        }
        else {
            result = $('#dialogbox_input').val();
        }
        return result;
    };

    /**
     * Getter and setter for default parameters for new boxes
     *
     * @param {Object|String} k Key/value object of parameters / name of single parameter / empty to get all parameters
     * @param {Mixed}         v Value of selected parameter
     * @return {Mixed}        value of selected parameter / key/value object of all parameters / $.fn.dialogbox if setting
     */
    $.fn.dialogbox.config = function(k, v) {

        var result;
        if (v !== undefined) {
            if (Config[k] !== undefined) {
                Config[k] = v;
            }
            result = this;
        }
        else if ($.isPlainObject(k)) {
            $.each(k, function(key, value) {
                $.fn.dialogbox.config(key, value);
            });
            result = this;
        }
        else if (k !== undefined) {
            result = Config[k];
        }
        else {
            result = $.extend({}, Config);
        }
        return result;
    };

    /**
     * Getter and setter for any and all form fields within the box
     *
     * @param {Object|String}  k  Key/value object of fields to set /
     *                         array of name/value objects (ie object returned from jQuery serializeArray() function /
     *                         id of field to get value of /
     *                         empty to get all fields
     * @param {String|Boolean} v  Value of selected field; if field is checkbox/radio, use a boolean to check/uncheck
     * @return {Object|String} Value of selected field or key/value object of all fields
     */
    $.fn.dialogbox.form = function(n, v) {

        var result;
        if (n === undefined) {
            result = $('#dialogbox_outer').serializeArray();
        }
        else if (n && typeof n === 'object') {
            $.each(n, function(index, value) {
                var args = value.name !== undefined ? [value.name, value.value] : [index, value];
                result = $.fn.dialogbox.form(args[0], args[1]);
            });
        }
        else if (typeof n === 'string') {
            var $fields = $('*[name=' + n + ']'),
                type = $fields.attr('type'),
                setting = v !== undefined;
            if (type === 'radio' || type === 'checkbox') {
                if (setting) {
                    v = $.map(v && typeof v === 'object' ? v : [v], function(a){ return a + ''; });
                }
                $fields.each(function() {
                    var $field = $(this), val = $field.val();
                    if (setting) {
                        $field[0].checked = $.inArray(val, v) > -1;
                    }
                    else if ($field[0].checked) {
                        result = result && typeof result !== 'object' ? [result] : result;
                        typeof result === 'object' ? result[result.length] = val : result = val;
                    }
                });
            }
            else {
                setting ? $fields.val(v) : result = $fields.val();
            }
            result = setting ? this : result;
        }
        return result;
    };

    /**
     * Reset all form fields
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.reset = function() {

        var form = $('#dialogbox_outer');
        if (form.length) {
            form[0].reset();
        }
        return this;
    };

    /**
     * Is there a box on the page?
     *
     * @return {Boolean}
     */
    $.fn.dialogbox.isOpen = function() {

        return $('#dialogbox_outer').length > 0;
    };

    /**
     * Just passes the box form to jquery serialize() function
     *
     * @return {String} serialised form data
     */
    $.fn.dialogbox.serialize = function() {

        return $('#dialogbox_outer').serialize();
    };

    /**
     * Shake the box and refocus if user clicks away
     *
     * @param  {Number} max  number of shakes
     * @param  {Number} i    current iteration
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.shake = function(max, i) {

        max = typeof max === 'number' ? max : 2;
        i = i || 0;
        var outer = $('#dialogbox_outer');
        if (i < max && Current.options.shakes) {
            if (!i) {
                outer.stop().css('margin-top', 0);
            }
            outer.animate({
                marginTop: '-=9'
            }, 50, 'swing', function() {
                outer.animate({
                    marginTop: '+=9'
                }, 50, 'swing', function() {
                    $.fn.dialogbox.shake(max, ++i);
                });
            });
        }
        else {
            $.fn.dialogbox.focus();
        }
        return this;
    };

    /**
     * Check box's position; if any part of it's moved out of the viewport,
     * then animate back in if there's enough space
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.adjustPosition = function() {

        var outer = $('#dialogbox_outer');

        // don't whip it away while dragging
        if (!Current.dragging && outer.length) {

            var css = {},
                offset = outer.offset(),
                scrollTop = $document.scrollTop(),
                top = offset.top - scrollTop,
                left = offset.left;

            if (top < 0) {
                css.top = IE6 ? scrollTop : 0;
            }
            else {
                var boxHeight = outer.outerHeight(), winHeight = $window.height();
                if (top > 0 && (offset.top + boxHeight) > (scrollTop + winHeight)) {
                    css.top = ((IE6 ? scrollTop : 0) + winHeight - boxHeight) + 'px';
                }
            }
            if (left < 0) {
                css.left = 0;
            }
            else {
                var boxWidth = outer.outerWidth(), winWidth = $window.width();
                if (left > 0 && ((offset.left + boxWidth) > winWidth)) {
                    css.left = (winWidth - boxWidth) + 'px';
                }
            }
            if (!$.isEmptyObject(css)) {
                outer.stop().animate(css, Current.options.morphing, Current.options.easing, function() {
                    storeDimensions();
                    $.fn.dialogbox.focus();
                });
            }
            else {
                $.fn.dialogbox.focus();
            }
        }

        return this;
    };

    /**
     * Focus on a field within the box and add focus/blur/hover/mouseout events to all fields
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.focus = function() {

        var fields = $('#dialogbox_outer').find('input:visible, select:visible, textarea:visible, button:visible');
        if (fields.length) {
            Current.focussed = Current.focussed && Current.focussed.is(':visible') ?
                Current.focussed :
                (typeof Current.options.focus === 'string' && $(Current.options.focus).length &&
                    $(Current.options.focus).parents('#dialogbox_inner').length ?
                    $(Current.options.focus) :
                    $(fields[0])
                );
            // set focus option to false, so the field is only focussed when box is first created
            Current.options.focus = false;
            Current.focussed.focus();
            // blinking ie moves cursor to beginning of input, so move it to last character
            if (document.selection) {
                var range = Current.focussed[0].createTextRange();
                range.move('character', Current.focussed.val().length);
                range.select();
            }
        }
        return this;
    };

    /**
     * To prevent momentary flash of 'naked box' while its background images are loading,
     * open and then close an empty box - this should make browsers fetch all required background images
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.preload = function() {

        $.fn.dialogbox.open();
        $('#dialogbox_outer, #dialogbox_mask').css('visibility', 'hidden');
        return $.fn.dialogbox.addLoadbar().close();
    };

    /**
     * Unbind original event target
     *
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.unbind = function() {

        Current.srcEvent.target && $(Current.srcEvent.target).unbind(Current.srcEvent.originalEvent.type + '.dialogbox');
        return this;
    };

    /**
     * Set box id for use in close()
     *
     * @return {Number} the new id
     */
    function setId() {

        return Current.id = (new Date()).getTime() + '' + Math.floor(Math.random() * 1000000);
    }

    /**
     * Bind user-defined events
     *
     * @param {Object} options supplied to dialogbox.open() or dialogbox.set()
     */
    function bindUserEvents(options) {

        var events = ['confirm', 'cancel', 'beforeOpen', 'afterOpen', 'beforeClose', 'afterClose', 'dragStart', 'dragStop'];
        $document.unbind('dialogbox');
        $.each(events, function(i, v) {
            if (typeof options[v] === 'function') {
                $document.bind('dialogbox.' + v, function() {
                    options[v]($.fn.dialogbox, Current.srcEvent);
                });
            }
        });
    }

    /**
     * Add confirm, cancel, keydown and other events
     */
    function addEvents() {

        var outer = $('#dialogbox_outer'),
            id = setId(),
            fields = outer.find('input:visible, select:visible, textarea:visible, button:visible'),

            // ok and cancel functions
            func = function(evt) {

                // don't allow user to close box if loadbar is present
                if (!$('#dialogbox_loadbar').length) {
                    $('#dialogbox_' + (evt === 'confirm' ? 'ok' : 'cancel')).addClass('dialogbox_active');
                    $document.trigger('dialogbox.' + evt);
                    $.fn.dialogbox.close(false, false, id);
                }
                return false;
            },
            confirm = function() {
                 return func('confirm');
            },
            // don't allow separate cancel function for alert boxes
            cancel = function() {
                return func(Current.options.type === 'alert' ? 'confirm' : 'cancel');
            },
            unfocus = Current.options.closeOnBlur ? cancel : $.fn.dialogbox.shake;

        outer.unbind('submit.dialogboxEvt keydown.dialogboxEvt')
            .bind('submit.dialogboxEvt', confirm)
            .bind('keydown.dialogboxEvt', keydown);

        fields.unbind('focus.dialogboxEvt blur.dialogboxEvt mouseenter.dialogboxEvt mouseleave.dialogboxEvt')
            .bind('focus.dialogboxEvt', function() {
                Current.focussed = $(this).addClass('dialogbox_focus');
            })
            .bind('blur.dialogboxEvt', function() {
                $(this).removeClass('dialogbox_focus');
            })
            .bind('mouseenter.dialogboxEvt', function() {
                $(this).addClass('dialogbox_hover');
            })
            .bind('mouseleave.dialogboxEvt', function() {
                $(this).removeClass('dialogbox_hover');
            });

        $('#dialogbox_cancel').unbind('click.dialogboxEvt')
            .bind('click.dialogboxEvt', cancel);
        $('#dialogbox_mask').unbind('mousedown.dialogboxEvt')
            .bind('mousedown.dialogboxEvt', unfocus);
        $('body').children('*[id!=dialogbox_outer]').unbind('focusin.dialogboxEvt')
            .bind('focusin.dialogboxEvt', unfocus);
        $document.unbind('keydown.dialogboxEvt')
            .bind('keydown.dialogboxEvt', $.fn.dialogbox.focus);

        $window.unbind('resize.dialogboxEvt focus.dialogboxEvt')
            // make sure mask fills entire page on resize
            .bind('resize.dialogboxEvt', function() {
                $('#dialogbox_mask').css({
                    height: $document.height() + 'px',
                    width: IE6 ? $('body').outerWidth(true) + 'px' : '100%' // ie6 won't do width:100%
                });
                $.fn.dialogbox.adjustPosition();
            })
            // focus in box when window regains focus (ignored by opera)
            .bind('focus.dialogboxEvt', function() {

                // using try/catch as ie can throw errors if the box is quickly closed
                try { fields[0].focus(); } catch(e) {}
                // shake() gets triggered in webkit, so abort it
                outer.stop();
            });

        if (outer.css('position') !== 'fixed') { // ie, IE6
            $window.unbind('scroll.dialogboxEvt')
                .bind('scroll.dialogboxEvt', $.fn.dialogbox.adjustPosition);
        }
    }

    /**
     * Restore box message to its original location in the DOM
     */
    function restore() {

        if (Current.restoreTo.length && Current.options.message instanceof jQuery) {
            Current.options.message.each(function(i) {
                var $elm = $(this), r = Current.restoreTo[i];
                $.each({next:'before', previous:'after', parent:'append'}, function(k, v) {
                    if (r && r[k] && r[k].length) {
                        r[k][v]($elm);
                        return false;
                    }
                });
            });
        }
        Current.restoreTo = [];
    }

    /**
     * Keydown function - enable arrow keys and Escape for cancelling
     *
     * @param {Object} evt
     */
    function keydown(evt) {

        var ok = $('#dialogbox_ok'),
            cancel = $('#dialogbox_cancel'),
            entered = evt.which,
            focussed = Current.focussed instanceof jQuery ? Current.focussed.attr('id') : false,
            isAlert = Current.options.type === 'alert';

        if (!ok.length) return;

        if (entered === 27) { // (escape)

            if (!isAlert) {
                cancel.click();
            } else {
                $('#dialogbox_outer').submit();
            }
            evt.preventDefault();
        }

        // use arrow keys to move focus between buttons like regular dialogs
        // 37:left, 38:up, 39:right, 40:down (using preventDefault to prevent scrolling (opera ignores this))
        else if (entered === 39 || entered === 40) {
            if (focussed === 'dialogbox_ok' && !isAlert) {
               cancel.focus();
               ok.blur();
            }
            if (focussed === 'dialogbox_cancel' || focussed === 'dialogbox_ok') {
                evt.preventDefault();
            }
        }
        else if (entered === 37 || entered === 38) {
            if (focussed === 'dialogbox_cancel' && !isAlert) {
                ok.focus();
                cancel.blur();
            }
            if (focussed === 'dialogbox_cancel' || focussed === 'dialogbox_ok') {
                evt.preventDefault();
            }
        }
        evt.stopPropagation();
    }

    /**
     * Store box dimensions and position for use in animations
     */
    function storeDimensions() {

        var outer = $('#dialogbox_outer');
        Current.msgHeight = $('#dialogbox_message_inner').height();
        Current.outerHeight = outer.outerHeight();
        Current.width = outer.css('width');
        Current.top = outer.css('top');
        Current.left = outer.css('left');
    }

    /**
     * Prevent default action and stop propagation of initial box-triggering event
     */
    function handleEvent(e) {

        Current.options.preventDefault && e.preventDefault();
        Current.options.stopPropagation && e.stopPropagation();
    }

    /**
     * Set box draggability
     *
     * @param {Boolean} drag whether to make the box draggable
     */
    function setDrag(drag) {

        var x = 0,
            y = 0,
            box = $('#dialogbox_outer'),
            handle = $('#dialogbox_handle').unbind('mousedown.dialogboxEvt');

        $document.unbind('mousedown.dialogboxEvt selectstart.dialogboxEvt mouseup.dialogboxEvt mousemove.dialogboxEvt');

        if (!drag) return;

        handle.bind('mousedown.dialogboxEvt', function(e) {
            x = e.pageX;
            y = e.pageY;
            Current.dragging = true;
            $document.trigger('dialogbox.dragStart');
        });

        // mousedown for regular browsers, selectstart for ie
        $document.bind('mousedown.dialogboxEvt selectstart.dialogboxEvt', function() {
            if (Current.dragging) return false;
        })
        .bind('mouseup.dialogboxEvt', function() {

            if (!Current.dragging) return;
            $document.trigger('dialogbox.dragStop');
            Current.dragging = false;
            $.fn.dialogbox.adjustPosition(); // should only be needed for ie6
            storeDimensions();
        })
        .bind('mousemove.dialogboxEvt', function(e) {

            if (!Current.dragging) return;

            var pos = [e.pageX, e.pageY],
                max = [$window.width() - box.outerWidth(),
                    (box.css('position') === 'fixed' ? $window.height() : $document.height()) - box.outerHeight()],
                css = [parseInt(box.css('left'), 10) + pos[0] - x, parseInt(box.css('top'), 10) + pos[1] - y];

            for (var i = 0; i < 2; i++) {
                if (css[i] > max[i]) {
                    pos[i] -= css[i] - max[i];
                    css[i] = max[i];
                } else if (css[i] < 0) {
                    pos[i] -= css[i];
                    css[i] = 0;
                }
            }
            x = pos[0];
            y = pos[1];
            box.css({left: css[0], top: css[1]});
        });
    }

    /**
     * IE6-compatible morphing
     * IE6 throws diverse layout wobblies on dimension animations, so just set new properties using css() with no transition
     *
     * @param {Object} $elm     element to animate
     * @param {Object} from     initial css properties
     * @param {Object} to       final css properties
     * @param {String} callback callback triggered when transition is complete
     */
    function morph($elm, from, to, callback) {

        if (!IE6) {
            $elm.stop().css(from || {}).animate(to, Current.options.morphing, Current.options.easing, $.fn.dialogbox[callback]);
        }
        else {
            var css = {}, diff;
            $.each(to, function(i, v) {
                // if using +=/-=number for animations, add/subtract the difference from the starting property
                if (v.toString().match(/^[-+]=/)) {
                    diff = parseFloat(v.replace(/^[-+]=/, ''));
                    css[i] = parseFloat(from[i] || 0) + (v.substr(0, 1) === '-' ? (0 - diff) : diff);
                }
                else {
                    css[i] = v;
                }
            });
            $elm.css(css);
            $.fn.dialogbox[callback]();
        }
    }

})(jQuery);