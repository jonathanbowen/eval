$('#foo').keyup(function() {
    var val = $(this).val().toLowerCase(), len = val.length;
    if (!len) return;
    $('.h').removeClass('h');
    $('#test li').each(function(i, v) {
        var li = $(v),
            text = $.trim(li.text()).toLowerCase();
        if (text.substr(0, len) === val) {
            $('#bar').text(text + li.position().top);
            $('#test').animate({
                scrollTop: 0
            }, 0).animate({
                scrollTop: li.position().top
            }, 0);
            li.addClass('h');
            return false;
        }
    });
});