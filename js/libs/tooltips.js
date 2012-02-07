(function($) {
    
    var $win = $(window), $doc = $(document);
    
    $.fn.tooltip = function() {
    
        $(this).each(function() {
        
            $(this)
                .unbind('mouseenter.tooltip mouseleave.tooltip click.tooltip mousemove.tooltip')
                .data('title', false)
                .bind('mouseenter.tooltip', function(e) {
                    var $elm = $(e.target);               
                    $elm.data('title', $elm.data('title') || $elm.attr('title')).attr('title', '')
                        .data('title') && createTip($elm);
                })
                .bind('mouseleave.tooltip click.tooltip', function() {
                    $('.tip').animate({
                        top:'+=10',
                        opacity: 0
                    }, 'normal', 'swing', function() {
                        var t = $('.tip');
                        t.css('opacity') === '0' && t.css('display', 'none');
                    });
                })
                .bind('mousemove.tooltip', function(e) {
                    var $elm = $(e.target);
                    !$('.tip').length && createTip($elm);
                    var t = $('.tip'),
                        h = t.outerHeight(),
                        w = t.outerWidth(),
                        // if event has been triggered manually, e.pageX and pageY will be undefined,
                        // so take x and y coords from the centre of the target element
                        x = e.pageX || ($elm.offset().left + ($elm.outerWidth() / 2)),
                        y = e.pageY || ($elm.offset().top + ($elm.outerHeight() / 2)),
                        winWidth = $win.width(),
                        winHeight = $win.height() + $doc.scrollTop(),
                        rightSpace = winWidth - x - 10,      // space to the right of mouse position (with offset correction)
                        underSpace = winHeight - y - 30,     // space underneath mouse position,
                        left = rightSpace < w && x > rightSpace ? x - w - 10 : x + 10,
                        top = underSpace < h && y > underSpace ? y - h - 10 : y + 30;
                    t.css({
                        display: 'block',
                        left: (left < 0 ? 0 : left) + 'px',
                        top: (top < 0 ? 0 : top) + 'px'
                    });
                });
        });
        return this;
    };
    
    function createTip($elm) {
        
        $('.tip').remove();
        var title = $elm.data('title');
        title && $('<div/>')
            .addClass('tip')
            .text(title)
            .css('opacity', 0)
            .css('display', 'block')
            .appendTo($('body'))
            .animate({opacity: 1}, 'fast') &&
        $elm.trigger('mousemove.tooltip');
    }
    
})(window.jQuery);