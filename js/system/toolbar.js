/**
 * Functions for creating and manipulating toolbar buttons and sections
 * Create a new one with
 * LE.toolbarButton('button-name').insert('button-group-name', {title: 'My button', callback: function(){}})
 * Manipulate with LE.toolbarButton('button-name').on(), .off() etc...
 */

(function() {

    var toolbarButtons = {},                 // keep track of all created buttons
        toolbar        = $('#toolbar'),      // element that'll contain all toolbar buttons
        flyoutHolder   = $('#flyouts');      // element that'll contain all flyout menus

    /**
     * Retrieve toolbar group element if exists, otherwise create it and return created element
     *
     * @param {string} groupName
     * @param {string} before name of group to insert before [optional]
     * @return {object} the created element
     */
    function createOrGetToolbarSection(groupName, before) {

        var sectionId = 'toolbar-section-' + groupName,
            section = $('#' + sectionId);

        if (!section.length) {

            section = $('<div class="toolbar-section" id="' + sectionId + '" />');

            if (before) {
                before = $('#toolbar-section-' + before);
            }

            if (before && before.length) {
                section.insertBefore(before);
            }
            else {
                section.appendTo(toolbar);
            }
        }

        return section;
    }

    /**
     * Create a flyout menu for a toolbar button
     *
     * @param {mixed} obj: a jquery collection, html string, or function returning same
     * @param {string} id: the button's id
     */
    function createFlyout(obj, id) {

        var flyout;

        obj = typeof obj === 'function' ? obj(id) : obj;

        if (obj) {

            flyout = $('<div class="flyout" rel="' + id + '" />').appendTo(flyoutHolder).hide();

            if (obj instanceof jQuery && obj.length) {
                flyout.append(obj);
            }
            else if (typeof obj === 'string') {
                flyout.html(obj);
            }
            else {
                log('No content supplied for %s flyout', id);
            }
        }
    }

    /**
     * Show a button's flyout
     *
     * @param {string} id: the button's id
     */
    function showFlyout(id) {
        $('.flyout[rel=' + id + ']').addClass('on').show('fast');
    }

    /**
     * Hide a button's flyout
     *
     * @param {string} id: the button's id
     */
    function hideFlyout(id) {
        $('.flyout[rel=' + id + ']').removeClass('on').hide('fast');
    }

    /**
     * Hide all flyouts except the one owned by specified button
     *
     * @param {string} id: id of the button whose flyout we're not hiding
     */
    function hideOtherFlyouts(id) {

        $('.flyout:not([rel=' + id + '])').each(function(i, v) {

            var flyout = $(v),
                buttonId = flyout.attr('rel');

            LE.toolbarButton(buttonId).off();
            flyout.removeClass('on').hide('fast');
        });
    }

    /**
     * Line up each flyout to its corresponding button and set height to fit in window
     */
    function adjustFlyoutPositions() {

        var winWidth = $(window).width(),
            toolbarHeight = toolbar.outerHeight(),
            availableHeight = $(window).height() - toolbarHeight - 10;

        $('.flyout').each(function(i, v) {

            var flyout           = $(v),
                isVisible        = flyout.hasClass('on'),
                flyoutWidth      = flyout.show().outerWidth(),
                button           = LE.toolbarButton(flyout.attr('rel')).elm,
                buttonOffsetLeft = button.offset().left,
                css              = (buttonOffsetLeft + flyoutWidth) > winWidth ?
                    { left: 'auto',           right: winWidth - buttonOffsetLeft - button.outerWidth() } :
                    { left: buttonOffsetLeft, right: 'auto' };

            css.top       = toolbarHeight - 1;
            css.maxHeight = availableHeight;

            flyout.css(css);

            isVisible || flyout.hide();
        });
    }

    $(window).bind('resize', adjustFlyoutPositions);

    /**
     * Click event for toolbar buttons
     */
    function toolbarButtonClick(e) {

        var id = this.id.replace('toolbar-button-', '');

        hideOtherFlyouts(id);
        
        if (e.which !== undefined && e.which !== 1) return true;

        if (!$(this).hasClass('disabled')) {

            if ($('.flyout[rel=' + id + ']').length) {
                LE.toolbarButton(id).toggle();
            }
            LE.toolbarButton(id).callback(LE.toolbarButton(id));
        }
    }

    /**
     * Create a new toolbar button
     *
     * @param {string} id the button's id
     */
    function toolbarButton(id) {
        this.id = id;
    }

    toolbarButton.prototype = {

        /**
         * Insert the button into the DOM and attach click event
         *
         * @param {string} sectionName name of the toolbar group being added to
         *                             this'll be created if it doesn't already exist
         * @param {object} object containing button title and callback when clicked
         * @param {string} name of button to be inserted before (must already exist) [optional]
         */
        insert: function(groupName, button, before) {

            var section = createOrGetToolbarSection(groupName);

            if (!this.elm) {

                this.elm = $('<span class="toolbar-button" id="toolbar-button-' + this.id +
                    '" title="' + (button.title || '') + '">' + (button.text || '') + '</span>')
                    .bind('mousedown.toolbar', toolbarButtonClick);

                createFlyout(button.flyout, this.id);

                typeof button.init === 'function' && button.init(this);
            }

            this.callback = typeof button.callback === 'function' ? button.callback : $.noop;

            if (before) {
                before = section.find('#toolbar-button-' + before);
            }

            if (before && before.length) {
                this.elm.insertBefore(before);
            }
            else {
                this.elm.appendTo(section);
            }

            if (button.contextMenu) {
                this.elm.contextMenu(button.contextMenu);
                this.elm.attr('title', (button.title || '') + '\n(right-click for more options)');
            }
            else {
                this.elm.noContext();
            }

            adjustFlyoutPositions();
        },
        /**
         * Set button to active state
         */
        on: function() {
            this.elm && this.elm.addClass('on');
            showFlyout(this.id);
        },
        /**
         * Set button to inactive state
         */
        off: function() {
            this.elm && this.elm.removeClass('on');
            hideFlyout(this.id);
        },
        /**
         * Toggle button state
         */
        toggle: function() {
            if (this.elm) {
                var func = this.elm.hasClass('on') ? 'off' : 'on';
                this[func]();
            }
        },
        /**
         * Disable button - prevent callback from firing
         */
        disable: function() {
            this.elm && this.elm.addClass('disabled');
        },
        /**
         * Enable button
         */
        enable: function() {
            this.elm && this.elm.removeClass('disabled');
        }
    };

    /**
     * Public functions:
     */

    /**
     * Create or get existing toolbar button
     *
     * @param {string} id
     * @return {object} instance of toolbarButton
     */
    LE.toolbarButton = function(id) {

        if (!toolbarButtons[id]) toolbarButtons[id] = new toolbarButton(id);

        return toolbarButtons[id];
    };

    /**
     * Create a new toolbar group or add buttons to existing group
     *
     * @param {string} groupName
     * @param {object} buttons to add to the group
     * @param {string} name of group to be inserted before [optional]
     */
    LE.addToolbarGroup = function(groupName, buttons, before) {

        createOrGetToolbarSection(groupName, before);

        $.each(buttons, function(id, button) {

            LE.toolbarButton(id).insert(groupName, button);
        });
    };

}());