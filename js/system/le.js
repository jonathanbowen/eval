/**
 * Attach page load event to fire everything up
 */

/**
 * initialise editarea when page is fully loaded
 */
$(window).bind('load', function() {
    // opera fix: prevents this function firing before storage script is loaded
    setTimeout(function() {
        var eaConfig = $.extend(LE.editAreaConfig, {
            id: 'code',
            allow_resize: 'no',
            allow_toggle: false,
            font_size: LE.storage('font-size'),
            syntax: LE.getCurrentSyntax(),
            syntax_selection_allow: LE.getAvailableSyntaxes().join(),
            toolbar: 'select_font, reset_highlight, word_wrap, syntax_selection',
            word_wrap: LE.storage('word-wrap'),
            EA_load_callback: 'LE.eaReady'
        });
        
        editAreaLoader.init(eaConfig);
        
    }, 0);
});

/*
 * Once ea's loaded, fire up all other initialisation functions,
 * and remove loading animation once we're all ready
 */
LE.eaReady = function() {

    $(document).trigger('LE.eaReady');
    $.each(LE.init, function(i, func) {
        func();
    });
    $(document).trigger('LE.init');
    
    $('#loading').remove();
    
};

