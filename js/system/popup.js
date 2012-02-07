LE.popup = (function() {

    var popups = {};

    function checkPopup() {

        $.each(popups, function(i, popup) {

            popup.win && popup.win.closed && popup.close();
        });

        setTimeout(checkPopup, 500);
    }

    function addPopupToHash(id) {

        var openPopups = getPopupsFromHash();
        if (!LE.inArray(id, openPopups)) {
            openPopups.push(id);
            LE.hashVar('popups', openPopups.join());
        }
    }

    function removePopupFromHash(id) {

        var openPopups = getPopupsFromHash(),
            newOpenPopups = [];

        if (LE.inArray(id, openPopups)) {
            $.each(openPopups, function(i, v) {
                if (id !== v) newOpenPopups.push(v);
            });
            LE.hashVar('popups', newOpenPopups.join());
        }
    }

    function getPopupsFromHash() {

        var popupHash = LE.hashVar('popups');

        return popupHash ? popupHash.split(',') : [];
    }

    function Popup(id) {

        this.id = id;
    }

    Popup.prototype.init = function(obj) {

        var thiz = this;

        $.each(['onOpen', 'onLoad', 'onClose'], function(i, v) {

            typeof obj[v] === 'function' || (obj[v] = $.noop);
        });

        $.each(['url', 'params'], function(i, v) {
            obj[v] = (obj[v] || '').toString();
        });

        $.each(obj, function(i, v) {
            thiz[i] = v;
        });

        if (!this.url.match(/^https?:/)) {
            this.url = LE.baseURI + this.url;
        }

        this.win         = false;
        this.initialised = true;
    }

    Popup.prototype.open = function() {

        if (this.initialised && (!this.win || !this.win.document)) {
            var thiz = this;
            this.win = open('', this.id, this.params);
            if (this.win.location.href === 'about:blank') this.win.location = this.url;
            this.win.onload = function() {
                thiz.onLoad();
                addPopupToHash(thiz.id);
            };
            this.onOpen();
        }
        this.win && this.win.document && this.win.focus();
    };

    Popup.prototype.isOpen = function() {

        return this.win && !this.win.closed;
    };

    Popup.prototype.close = function() {

        if (this.win) {
            this.win.close();
            this.onClose();
        }
        removePopupFromHash(this.id);
        this.win = false;
    };

    return function(id, obj) {

        id = (id || '').toString();

        if (id) {

            if (!popups[id]) {
                $.isEmptyObject(popups) && checkPopup();
                popups[id] = new Popup(id);
            }

            obj && popups[id].init(obj);
        }

        return popups[id];
    }

}());