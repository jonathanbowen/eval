(function($) {

    function createMenu(items, id) {

        var menuSpans = $();

        $.each(items, function(i, v) {
            menuSpans = menuSpans
                .add($('<span>' + i + '</span>')
                .click(function(e) {
                   var ret = typeof v === 'function' ? !!v(e) : false;
                   ret || $('.context-menu').hide('fast');
            }));
        });

        return $('<div class="context-menu" id="' + id +
            '" />').append(menuSpans).appendTo($('body')).hide();
    }

    $.fn.contextMenu = function(items, openTest) {

        var id   = 'context-menu-' + (new Date()).getTime() + Math.floor(Math.random() * 1000000),
            menu = createMenu(items, id),
            docs = $(document);

        $(this).data('contextMenu', true).rightClick(function(e) {

            if (typeof openTest === 'function' && !openTest(e)) return false;
        
            $('.context-menu').hide();
            menu.css({
                top: e.pageY + 10,
                left: e.pageX
            }).show('fast');

            return false;
        });

        $.each(window.frames, function(i, v) {
            docs = docs.add($(v.document));
        });

        docs.unbind('mousedown.contextMenu').bind('mousedown.contextMenu', function(e) {

            var elm = $(e.target);
            
            if ((!elm.data('contextMenu') || e.button !== 2) && !elm.parents('.context-menu').length) {
                $('.context-menu').hide('fast');
            }
            return;
            (elm.data('contextMenu') && e.button !== 2) || elm.parents('.context-menu').length ||
                $('.context-menu').hide('fast');
        });
    };

}(window.jQuery));