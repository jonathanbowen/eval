LE.toggleComment = (function() {

    var ret;

    function toggleSingle(text, comment) {

        var lines = text.split('\n'),
            regex = new RegExp('^(\\s*)' + LE.pregQuote(comment));

        $.each(lines, function(i, v) {
            lines[i] = v.match(regex) ? v.replace(regex, '$1') : comment + v;
        });

        text = lines.join('\n');
        return text;
    }

    function toggleWrap(text, before, after) {

        var regex = new RegExp('^(\\s*)' + LE.pregQuote(before) +
            ' ?([\\s\\S]*?) ?' + LE.pregQuote(after) + '(\\s*)$');

        if (text.match(regex)) {
            text = text.replace(regex, '$1$2$3');
        }
        else {
            text = before + ' ' + text + ' ' + after;
        }

        return text;
    }

    function toggleComment(before, after) {

        var text = LE.editor.getSelection(),
            toggled = after ? toggleWrap(text, before, after) : toggleSingle(text, before);

        LE.editor.replaceSelection(toggled);
    }

    ret = toggleComment;

    ret.single = function() {
        toggleComment('//');
    };

    ret.block = function() {
        toggleComment('/*', '*/');
    };

    ret.html = function() {
        toggleComment('<!--', '-->');
    };

    return ret;

}());