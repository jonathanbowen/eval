/**
 * Generates flyout menu for zencoding tag insertion
 */
$(document).ready(function() {

    LE.loadScript('js/libs/editarea_0_8_2/edit_area/plugins/zencoding/core.js').onload = function() {

        LE.zenCoding = function() {

            var ret = {},
                zenMarkers = new RegExp('\\||\\$\\{.*?\\}', 'g'),
                items = [];

            // build our tag list from the combination of abbreviations and block/inline/empty tags
            $.each(zen_settings.html.abbreviations, function(i) {
                items.push(i);
            });

            $.each(zen_settings.html.element_types, function(type, tags) {

                $.each(tags, function(t) {
                    $.inArray(t, items) === -1 && items.push(t);
                });
            });

            items.sort();

            $.each(items, function(i, abbr) {

                var expansion = zen_coding.wrapWithAbbreviation(abbr, '', null, 'html')

                ret[LE.htmlChars(abbr)] = {
                    title: LE.htmlChars(expansion.replace(zenMarkers, '')),
                    callback: function() {

                        var beforeCursor = expansion,
                            afterCursor = '',
                            findEditPoint;

                        // first see if we can find a closing tag
                        // if so, wrap with opening and closing tags
                        if (findEditPoint = /^(.+?)(<.*)$/.exec(expansion)) {

                            beforeCursor = findEditPoint[1];
                            afterCursor = findEditPoint[2];
                        }
                        
                        // otherwise, for single tags,
                        // see if there's an insertion point
                        else if (findEditPoint = /^(.+?)(|.*)$/.exec(expansion)) {

                            beforeCursor = findEditPoint[1];
                            afterCursor = findEditPoint[2];
                        }

                        beforeCursor = beforeCursor.replace(zenMarkers, '');
                        afterCursor = afterCursor.replace(zenMarkers, '');

                        LE.editor.wrapSelection(beforeCursor, afterCursor);
                    }
                };
            });

            return ret;
        };
    };
});