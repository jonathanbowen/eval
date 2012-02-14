/**
 * Attach page load event to fire everything up
 */

/**
 * initialise editarea when page is fully loaded
 */
$(window).bind('load', function() {
    // opera fix: prevents this function firing before storage script is loaded
    setTimeout(function() {
        LE.editor.init(LE.editorPlugin);
    }, 0);
});

/*
 * Once ea's loaded, fire up all other initialisation functions,
 * and remove loading animation once we're all ready
 */
LE.editorReady = function() {

    $(document).trigger('LE.editorReady');
    $.each(LE.init, function(i, func) {
        func();
    });
    $(document).trigger('LE.init');
    
    $('#loading').remove();
    
};

