$.extend(LE, {

    clearsnippets: function() { localStorage.setItem('eval.Snippets', null); },

    snippetsInit: function() {

        $.each(LE.snippetsToolbar, function(groupName, buttons) {
            LE.addToolbarGroup(groupName, buttons);
        });
        $('[title]').tooltip();
        $('#loading').hide();
        LE.buildSnippetLists();
        LE.setSnippetView('snippets');
    },

    buildSnippetLists: function() {

        $.each(['snippets', 'macros'], function(i, v) {
            LE.populateSnippets(v);
        });
        $('.snippets-list').children('ul').sortList();
        LE.bindSnippetEvents();
    },

    getSnippetsOrMacros: function() {

        var item = LE.snippetView === 'macros' ? 'Macros' : 'Snippets';
        return LE.storage(item);
    },

    checkSnippetName: function(baseName, canOverwrite) {

        var error = false,
            fullName = LE.currentSnippetFolder ? LE.currentSnippetFolder + '.' + baseName : baseName,
            dupe;

        if (!$.trim(baseName).length) {
            error = 'Please type a name!';
        }
        else if (!baseName.match(/^[\d\w -]+$/)) {
            error = 'Name can only contain letters, numbers, spaces, underscores and hyphens.';
        }
        else if (!canOverwrite) {
            dupe = $('.snippets-list:visible')
                .find('span[data-foldername="' + fullName + '"], span[data-snippetname="' + fullName + '"]');
            if (dupe.length) {
                error = 'An item named <strong>' + baseName + '</strong> already exists at this location.';
            }
        }

        return error ? {title:'That name is not allowed!', message: error} : false;
    },

    populateSnippets: function(type, obj, objName) {

        var outer = !obj,
            ret = '';

        type = type.toLowerCase();
        type = type === 'snippets' ? 'Snippets' : 'Macros';
        obj = obj || LE.storage(type);

        objName = objName ? objName + '.' : ''; //

        if ($.isEmptyObject(obj)) {//log(objName);
            ret += '<li class="empty">(empty)</li>';
        }

        $.each(obj, function(i, v) {

            if ($.isPlainObject(v)) {
                ret += '<li><span><span class="folder" data-foldername="' + objName + i + '">' + i +
                    '</span></span><ul class="none">' +
                    LE.populateSnippets(type, v, objName + i) + '</ul></li>';
            }
            else {
                ret += '<li><span><span class="' + type + ' snippet" data-snippetname="' + objName + i + '">' + i + '</span></span></li>';
            }
        });

        if (outer) {
            ret = '<ul>' + ret + '</ul>';
            $('#' + type.toLowerCase() + '-list').html(ret);
        }

        return ret;
    },

    currentSnippetFolder: false,

    setCurrentSnippetFolder: function(elm) {

        if (elm.hasClass('folder')) {
            LE.currentSnippetFolder = elm.attr('data-foldername');
        }
        else {
            LE.currentSnippetFolder = elm.closest('ul').prev().find('span').attr('data-foldername');
        }
    },

    bindSnippetContextMenus: function() {
    
        function focusElm(elm) {

            elm.parents('.snippets-list').find('.focus').removeClass('focus');
            elm.parent('span').addClass('focus');
        }
        
        $('.snippet').each(function(i, v) {

            var thiz = $(this),
                itemType,
                cMenu;

            if (!thiz.data('contextMenu')) {

                itemType = thiz.hasClass('Macros') ? 'macro' : 'snippet';
                cMenu = {};

                cMenu[itemType === 'snippet' ? 'Insert snippet' : 'Run macro'] = LE.insertSnippet;
                cMenu['Delete ' + itemType] = function(){
                    LE.confirmSnippetDelete(thiz.attr('data-snippetname'));
                };
                thiz.contextMenu(cMenu);
                thiz.rightClick(function() {
                    focusElm(thiz);
                    LE.setCurrentSnippetFolder(thiz);
                });
            }
        });

        $('.folder').each(function(i, v) {

            var thiz = $(this),
                itemType,
                cMenu;

            if (!thiz.data('contextMenu')) {

                itemType = thiz.parents('#macros-list').length ? 'macro' : 'snippet';
                cMenu = {};

                cMenu['New ' + itemType + ' here'] = LE.newSnippetOrMacro;
                cMenu['New folder here'] = LE.newSnippetFolder;
                cMenu['Rename folder'] = LE.renameSnippetFolder;
                cMenu['Delete folder'] = function(){
                    LE.confirmSnippetFolderDelete(thiz.attr('data-foldername'));
                };

                thiz.contextMenu(cMenu);
                thiz.rightClick(function() { 
                    focusElm(thiz);
                    LE.setCurrentSnippetFolder(thiz);
                });
            }

        });
    },

    setSnippetSort: function() {
    
        $('.snippets-list li:not(.ui-draggable)').draggable(/*  */{
            revert: 'invalid',
            start: function() {
                $(this).children('ul').hide();
            },
            stop: function(e, ui) {
                $(this).draggable('option', 'revert', 'invalid');
            }
            
        });
        
        $('.snippets-list:not(.ui-droppable), .folder:not(.ui-droppable)').droppable({
            greedy: true,
            hoverClass: 'drop-hover',
           /*  over: function(e, ui) {
                var parentList = $(this).closest('li').children('ul');
                if (!parentList.is(':visible')) {
                    parentList.show().find('ul').hide();
                } 
            },*/
            drop: function(e, ui) { 
            
                var dupe          = false,
                    dropped       = $(this),
                    dragged       = ui.draggable,
                    draggedSpan   = dragged.children('span').children('span'),
                    draggedType   = draggedSpan.hasClass('folder') ? 'folder' : 'snippet',
                    draggedText   = draggedSpan.text(),
                    draggedName   = draggedSpan.attr('data-' + draggedType + 'name'),
                    newFolderName = dropped.attr('data-foldername') || '',
                    oldFolderName = draggedName.replace(/(^|\.)[^.]*$/, ''),
                    targetList    = dropped.hasClass('snippets-list') ? 
                                    dropped.children('ul') : dropped.closest('li').children('ul');

                if (newFolderName === oldFolderName) {
                    dragged.draggable('option', 'revert', true);
                    return;
                }
                    
                targetList.children('li').each(function(i, v) {
                    if (draggedText === $(v).children('span').children('span').text()) {
                        dupe = true;
                        return false;
                    }
                });
                
                if (dupe) {
                    LE.dialog({
                        title:"Can't put it there!", 
                        message: 'An item named ' + draggedText + ' already exists at this location.'
                    });
                    dragged.draggable('option', 'revert', true);
                }
                else {
                    dragged.css({left:0,top:0}).appendTo(targetList);
                    targetList.sortList();
                    if (!targetList.is(':visible')) {
                        targetList.show().find('ul').hide();
                    } 
                    LE.rebuildSnippetsFromDom();
                }
            }
        });

    },

    rebuildSnippetsFromDom: function(list, nameSpace) {

        var outer = false, 
            obj   = {},
            type  = LE.ucFirst(LE.snippetView);

        if (!list) {
            outer     = true;
            nameSpace = '';
            list      = $('.snippets-list:visible > ul');
        }
        
        if (nameSpace) nameSpace += '.';
        
        children = list.children('li');

        list.children('li').each(function(i, v) {

            var li       = $(v),
                sublist  = li.children('ul'),
                span     = li.children('span').children('span'),
                spanText = span.text(),
                newName  = nameSpace + spanText;

            if (!span.length) return;
                
            if (span.hasClass('folder')) {
                obj[spanText] = sublist.length ? LE.rebuildSnippetsFromDom(sublist, newName) : {};
                span.attr('data-foldername', newName);
            }
            else {
                obj[spanText] = LE.getSnippetFromName(span.attr('data-snippetname'), type);
                span.attr('data-snippetname', newName);                 
            }
        });
        
        if (outer) {
            LE.emptySnippetPlaceholders();
          //  log(obj);
            LE.storage(type, obj); 
        }
        
        return obj;
    },
    
    emptySnippetPlaceholders: function() {
    
        $('.snippets-list ul').each(function(i, v) {
            
            var ul = $(v);
            if (!ul.children('li').length) {
                $('<li class="empty">(empty)</span>').appendTo(ul);
            }
            else {
                ul.find('.empty').remove();
            }
        });
    },

    setDefaultSnippetView: function() {
        if (!LE.inArray(LE.snippetView, ['snippets', 'macros'])) LE.setSnippetView('snippets');
    },

    confirmSnippetDelete: function(snippetName) {

        LE.setDefaultSnippetView();

        if (!snippetName || typeof snippetName !== 'string') {
            snippetName = $('#' + LE.snippetView + '-list').find('.focus .snippet').attr('data-snippetname');
        }
        if (!snippetName) {
            return $.fn.dialogbox.open('No snippet or macro selected!');
        }

        $.fn.dialogbox.open({
            title: 'Confirm deletion',
            message: 'Really delete ' + snippetName.replace(/.*\./, '') + '?',
            type: 'confirm',
            confirm: function() {
                LE.deleteSnippetOrMacro(snippetName);
            }
        });
    },

    confirmSnippetFolderDelete: function(folderName) {

        LE.setDefaultSnippetView();

        $.fn.dialogbox.open({
            title: 'Confirm deletion',
            message: 'Really delete ' + folderName.replace(/.*\./, '') + ' and its contents?',
            type: 'confirm',
            confirm: function() {
                LE.deleteSnippetOrMacro(folderName, true);
            }
        });
    },

    deleteSnippetFolder: function(folderName) {


    },

    bindSnippetEvents: function() {

        $('form').submit(false);
        
        $('<div class="trash" />').appendTo($('.snippets-list')).droppable({
            greedy: true,
            hoverClass: 'trash-hover',
            tolerance: 'touch',
            drop: function(e, ui) {
                ui.draggable.remove();
                LE.rebuildSnippetsFromDom();
            }
        });

        function focusElm(elm) {

            elm.parents('.snippets-list').find('.focus').removeClass('focus');
            elm.parent('span').addClass('focus');
        }
        
        $('.snippets-list').click(function() {
            $(this).find('.focus').removeClass('focus');
            LE.currentSnippetFolder = false;
        });

        LE.bindSnippetContextMenus();

        LE.setSnippetFormVisibility();

        $('.snippet').live('click.togglesnippet', function(e) {
            if (e.button === 1) return true;
            var thiz = $(this);
            focusElm(thiz);
            LE.setCurrentSnippetFolder(thiz);
            LE[thiz.hasClass('Macros') ? 'showMacroInForm' : 'showSnippetInForm'](thiz);
            return false;
        });

        $('.snippets-list').bind('click.togglesnippet', function(e) {
            if (e.target.className === 'snippets-list') {
                $(e.target).find('.focus').removeClass('focus');
            }
        });

        $('.folder').live('click.togglesnippet', function(e) {
            if (e.button === 1) return true;
            var thiz = $(this);
            focusElm(thiz);
            LE.setCurrentSnippetFolder(thiz);
            !e.button && thiz.closest('li').children('ul').toggle().find('ul').hide();
            return false;
        });
        $('.snippets-list li').live('hover', function() { //log('mouseenter');
            if (LE.snippetDragging) { log('dragging');
                var ul = $(this).children('ul');
                if (ul.length && !ul.is(':visible') && LE.snippetDragging) {
                    ul.show().find('ul').hide();
                }
            }
        });

        $(window).resize(function() {
            var space = $(window).height() - $('#toolbar').outerHeight();
            $('.snippets-list').height(space - 6);
            $('#main').height(space);
        }).trigger('resize');

        $('#snippet-save').click(function() {

            var focussed = $('.focus .snippet');

            focussed.length && LE.saveSnippet(focussed.attr('data-snippetname'), $('#snippet-name').val(),
                $('#before-cursor').val(), $('#after-cursor').val());
            return false;
        });

        $('#macro-save').click(function() {

            var focussed = $('.focus .snippet');

            focussed.length && LE.saveSnippet(focussed.attr('data-snippetname'), $('#macro-name').val(),
                $('#macro-code').val());
            return false;
        });

        $('#snippets-list .snippet').live('dblclick', LE.insertSnippet);
        $('#snippet-content .snippet-insert').click(LE.insertSnippet);

        $('#macros-list .snippet').live('dblclick', LE.insertMacro);
        $('#macro-content .snippet-insert').click(LE.insertMacro);

        LE.setSnippetSort();
    },
    
    importSnippets: function() {
    
        LE.dialog({
            title: 'Import snippets / macros',
            message: $("<div>Paste yer json here.<br><strong>Warning:</strong> existing snippets and macros will be overwritten!</div><div id='import-msg'></div><textarea id='snippet-import' rows=10></textarea>"),
            width: $(window).width() - 30,
            type: 'confirm',
            confirm: function(b) {
                var val = $.trim($('#snippet-import').val()),
                    obj;
                try {
                    obj = JSON.parse(val);
                }
                catch(e) {
                    $('#import-msg').text('Invalid json!');
                    b.set();
                    return;
                }
                
                if ($.isPlainObject(obj) && $.isPlainObject(obj.snippets) && !$.isEmptyObject(obj.snippets) &&
                    $.isPlainObject(obj.macros) && !$.isEmptyObject(obj.macros)) {
                    b.open('looks okay...');
                    if (LE.storage('Snippets', obj.snippets) && LE.storage('Macros', obj.macros)) {
                        b.open({
                            message: 'Import successful!',
                            title: 'Success!',
                            confirm: function() {
                                window.location = window.location.href;
                            }
                        });
                    }
                    else { // should be impossible...
                        b.open('Bollocks! Couldn\'t import!');
                    }
                }
                else {
                    $('#import-msg').text('Invalid data!');
                    b.set();
                }
            }
        });
    },
    
    exportSnippets: function() {
        
        var str = JSON.stringify({
                snippets: LE.storage('Snippets'),
                macros: LE.storage('Macros')
            }),
            tA = $('<textarea rows=10 />').val(str);

        LE.dialog({
            title: 'Export snippets / macros',
            message: $("<div>Here's some json for you:</div>").add(tA),
            width: $(window).width() - 30,
            afterOpen: function() {
                tA.focus()[0].select();
            }
        });
    },

    insertSnippet: function() {
    
        var textBits = [$('#before-cursor').val(), $('#after-cursor').val()],
            regex = new RegExp('\\[%(.+?)%\\]', 'g'),
            actualMatches = [];

        $.each(textBits, function(i, v) {
            var matches;
            while (matches = regex.exec(v)) {
                $.inArray(matches[1], actualMatches) === -1 && actualMatches.push(matches[1]);
            }
        });

        LE.replaceSnippetKeys(actualMatches, textBits);
    
    //    opener.editAreaLoader.insertTags('code', $('#before-cursor').val(), $('#after-cursor').val());
    },

    replaceSnippetKeys: function(keys, textBits) {
    
        if (keys.length) {
            var msg = keys[0].replace(/=.*$/, '');
            $.fn.dialogbox.open({
                message: msg + ':',
                type: 'prompt',
                promptText: msg === keys[0] ? '' : keys[0].substr(msg.length + 1),
                title: 'Enter a value',
                confirm: function(b) {
                    var reg = new RegExp('\\[%' + LE.pregQuote(keys[0]) + '%\\]', 'g');
                    $.each([0,1], function(i) {
                        while (textBits[i].match(reg)) {
                            textBits[i] = textBits[i].replace(reg, b.prompt());
                        }
                    });
                    keys = keys.slice(1);
                    LE.replaceSnippetKeys(keys, textBits);
                }
            });
        } 
        else {
            opener.editAreaLoader.insertTags('code', textBits[0], textBits[1]);
        }
    },
    
    insertMacro: function() {

        var macroContent = $('#macro-code').val(),
            regex = new RegExp('\\[%(.+?)%\\]', 'g'),
            matches,
            flags = [];

        while (matches = regex.exec(macroContent)) {
            $.inArray(matches[1], flags) === -1 && flags.push(matches[1]);
        }

        opener.focus();
        LE.replaceFlags(flags, macroContent);
    },

    evalMacro: function(code) {

        try {
            func = '(function(){function selectedText(str) { var ea = editAreaLoader; if (str !== undefined) { ea.setSelectedText("code", str); } else { return ea.getSelectedText("code"); } } function editorContents(str) { var ea = editAreaLoader; if (str !== undefined) { ea.setValue("code", str); } else { return ea.getValue("code"); } } function insertTags(opener, closer) { editAreaLoader.insertTags("code", opener, closer); }' + code + '})();';
            result = opener.eval(func);
            if (result !== undefined && result !== null) {
                opener.editAreaLoader.setSelectedText('code', result.toString());
            }
        }
        catch(e) {
            opener.console.warn(e + '\n----------------------\nGenerated code:\n\n' + code);
            opener.jQuery.fn.dialogbox.open({
                title: 'Oh dear, an error...',
                message: '<img src="' + LE.baseURI + 'img/silk/emoticon_unhappy.png" width="16" height="16" alt="" style="float:left;margin-right:10px">Check the console for details.'
            });
        }
    },

    replaceFlags:function(flags, code) {

        if (flags.length) {
            var msg = flags[0].replace(/=.*$/, '');
            $.fn.dialogbox.open({
                message: msg + ':',
                type: 'prompt',
                promptText: msg === flags[0] ? '' : flags[0].substr(msg.length + 1),
                title: 'Enter a value',
                confirm: function(b) {
                    // http://simonwillison.net/2006/jan/20/escape/
                    var reg = new RegExp('\\[%' + flags[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + '%\\]', 'g');

                    code = code.replace(reg, "'" + b.prompt().replace(/'/g, "\\'") + "'");
                    flags = flags.slice(1);
                    LE.replaceFlags(flags, code);
                }
            });
        }
        else {
            LE.evalMacro(code);
        }
    },

    newSnippet: function() {

    },

    newMacro: function() {

    },

    newSnippetFolder: function() {

        LE.newOrRenameSnippetFolder();
    },

    newOrRenameSnippetFolder: function(rename) {

        LE.setDefaultSnippetView();

        $.fn.dialogbox.open({
            title: (rename ? 'Rename' : 'New') + ' folder',
            message: 'Type a folder name:',
            type: 'prompt',
            confirm: function(b) {
                var folderName = $.trim(b.prompt()),
                    error = LE.checkSnippetName(folderName),
                    func = rename ? 'doRenameSnippetFolder' : 'createNewSnippetFolder';
                if (error) {
                    b.set(error);
                }
                else {
                    LE[func](folderName);
                }
            }
        });
    },

    createNewSnippetFolder: function(folderName) {

        var store         = LE.storage(LE.ucFirst(LE.snippetView)),
            obj           = store,
            listContainer = $('#' + LE.snippetView + '-list'),
            bits          = (LE.currentSnippetFolder || '').split('.'),
            fullName,
            target,
            newElm;

        if (LE.currentSnippetFolder) {
            target = listContainer
                .find('span[data-foldername="' + LE.currentSnippetFolder + '"]')
                .closest('li')
                .children('ul');
        }

        if (!target) {
            target = listContainer.children('ul');
        }

        fullName = LE.currentSnippetFolder ? LE.currentSnippetFolder + '.' + folderName : folderName;

        newElm = $('<li/>').append('<span><span class="folder" data-foldername="' + fullName + '">' + folderName +
            '</span></span><ul class="none"><li class="empty">(empty)</li></ul>');

        target.children('.empty').remove();

        target.append(newElm).show().sortList();

        LE.bindSnippetContextMenus();
        
        LE.setSnippetSort();

        LE.currentSnippetFolder && $.each(bits, function(i, v) {
            obj = obj[v];
            if (!obj) {
                $.fn.dialogbox.open('Folder not found!');
                return false;
            }
        });

        obj[folderName] = {};

        LE.storage(LE.ucFirst(LE.snippetView), store);
    },
    
    renameSnippetFolder: function() {
        LE.newOrRenameSnippetFolder(true);
    },
    
    doRenameSnippetFolder: function(newName) {
    
        typeof LE.currentSnippetFolder === 'string' && 
            $('span[data-foldername="' + LE.currentSnippetFolder + '"]').text(newName);
            
        LE.rebuildSnippetsFromDom();
    },

    newSnippetOrMacro: function() {

        if (!LE.inArray(LE.snippetView, ['snippets', 'macros'])) LE.setSnippetView('snippets');

        var container = $('#' + LE.snippetView + '-list'),
            target = container.find('span[data-foldername="' + (LE.currentSnippetFolder || '') + '"]').parent().next('ul'),
            existingNames = [],
            baseName = 'Untitled',
            num = 1,
            fullName,
            newElm;

        if (!target.length) target = container.children('ul');

        if (!target.is(':visible')) target.show();

        target.children('li').children('span').children('span').each(function(i, v) {

            existingNames.push($(v).text());
        });

        while (LE.inArray(baseName + ' ' + num, existingNames)) {

            num++;
        }

        baseName = baseName + ' ' + num;

        fullName = (LE.currentSnippetFolder ? LE.currentSnippetFolder + '.' : '') + baseName;

        newElm = $('<li/>').append('<span><span class="' + LE.ucFirst(LE.snippetView) +
            ' snippet" data-snippetname="' +
            fullName + '">' + baseName + '</span></span>');

        target.append(newElm);

        target.children('.empty').remove();

        target.sortList();

        LE.saveSnippet(fullName, baseName, 'something awesome', '');

        container.find('span[data-snippetname="' + fullName + '"]').trigger('click.togglesnippet');

       /*  $(document).bind('mouseup.snippetfocus', function() {
            var input = $('#' + (LE.snippetView === 'snippets' ? 'snippet' : 'macro') + '-name')[0];
            input.focus();
            input.select();
            $(document).unbind('mouseup.snippetfocus');
        }); */

        LE.bindSnippetContextMenus();
        
        LE.setSnippetSort();
    },

    deleteSnippetOrMacro: function(snippetName, isFolder) {

        if (!LE.inArray(LE.snippetView, ['snippets', 'macros'])) LE.setSnippetView('snippets');

        var mode      = LE.snippetView,
            container = $('#' + mode + '-list'),
            store     = LE.storage(LE.ucFirst(mode)),
            obj       = store,
            bits      = snippetName.split('.'),
            baseName  = bits.pop(),
            li        = container.find('span[data-' + (isFolder ? 'folder' : 'snippet') + 'name="' + snippetName + '"]').closest('li');

        $.each(bits, function(i, v) {
            obj = obj[v];
            if (!obj) {
                $.fn.dialogbox.open('Snippet / macro not found!');
                return false;
            }
        });

        delete obj[baseName];

        LE.storage(LE.ucFirst(mode), store);

        if (!li.siblings().length) {
            $('<li class="empty">(empty)</li>').insertBefore(li);
        }

        li.remove();
    },

    setSnippetFormVisibility: function() {

        if (LE.inArray(LE.snippetView, ['snippets', 'macros'])) {

            var listContainer = $('#' + LE.snippetView + '-list');

            if (listContainer.find('.focus .snippet').length) {
                $('#' + LE.snippetView).find('form').show().siblings('.none-selected').hide();
            }
            else {
                if (!listContainer.find('.focus').length) {
                    LE.currentSnippetFolder = false;
                }
                $('#' + LE.snippetView).find('form').hide().siblings('.none-selected').show();
            }
            LE.toolbarButton('snippetNewFolder').enable();
            LE.toolbarButton('snippetNew').enable();
            LE.toolbarButton('snippetDelete').enable();
        }
        else {
            LE.currentSnippetFolder = false;
            LE.toolbarButton('snippetNewFolder').disable();
            LE.toolbarButton('snippetNew').disable();
            LE.toolbarButton('snippetDelete').disable();
        }
        setTimeout(LE.setSnippetFormVisibility, 100);
    },

    saveSnippet: function(snippetName, newName, beforeCursor, afterCursor) {

        if (!LE.inArray(LE.snippetView, ['snippets', 'macros'])) LE.setSnippetView('snippets');

        newName = $.trim(newName);

        var mode      = LE.snippetView,
            container = $('#' + mode + '-list'),
            snippets  = mode === 'macros' ? LE.storage('Macros') : LE.storage('Snippets'),
            bits      = snippetName.split('.'),
            baseName  = bits.pop(),
            ret       = snippets,
            error     = LE.checkSnippetName(newName, newName === baseName);

        if (error) {
            $.fn.dialogbox.open(error);
            return;
        }

        $.each(bits, function(i, v) {
            ret = ret[v] ;//: snippets[v]; log(ret);
            if (!ret) {log('o no'); return false;}
        });

        if (ret === undefined) { // no it isn't
           
            log('duuh undefined, duuuuh duuuh');
            return;
        }
        
        if (baseName !== newName) { //log('deleting');
            delete ret[baseName];
            container.find('.focus .snippet')
                .attr('data-snippetname', bits.join('.') + (bits.length ? '.' : '') + newName)
                .text(newName)
                .closest('ul').sortList();
        }
        ret[newName] = mode === 'snippets' ? [beforeCursor, afterCursor] : beforeCursor;

        // log(ret);
        // ret[0] = beforeCursor;
        // ret[1] = afterCursor;

        LE.storage(LE.ucFirst(mode), snippets);

      //  log(ret);

    //    log(snippets);
    //    console.info(LE.getSnippetFromName(bits.join('.') + (bits.length ? '.' : '') + newName, 'Snippets'));
    },

    getSnippetFromName: function(name, type) {// log(name, type);
    
        var bits = name.split('.'), ret = LE.storage(type);

        $.each(bits, function(i, v) {
            ret = ret[v];
            if (!ret) return false;
        });

        return ret;
    },

    showSnippetInForm: function(elm) {

        var snippetName = elm.attr('data-snippetname'),
            snippetContent = LE.getSnippetFromName(snippetName, 'Snippets');
/* 
        if (!snippetContent) { log(snippetName);
            log('neeeuuuh won\'t do it i won\'t do it'); return;
        } */
            
        $('#snippet-name').val(elm.text());
        $('#before-cursor').val(snippetContent[0]);
        $('#after-cursor').val(snippetContent[1]);

    },

    showMacroInForm: function(elm) {

        var macroName = elm.attr('data-snippetname'),
            macroContent = LE.getSnippetFromName(macroName, 'Macros');

        $('#macro-name').val(elm.text());
        $('#macro-code').val(macroContent);
    },

    setSnippetView: function(mode) {

        LE.snippetView = mode;

        $.each(['snippets', 'macros', 'help'], function(i, v) {

            if (mode === v) {
                $('#' + v).show();


                LE.setCurrentSnippetFolder($('#' + mode + '-list').find('.focus span'));
            }
            else {
                $('#' + v).hide();
            }
        });

        $.each(['viewSnippets', 'viewMacros', 'help'], function(i, v) {

            if (v.match(new RegExp(mode, 'i'))) {
                LE.toolbarButton(v).on();
            }
            else {
                LE.toolbarButton(v).off();
            }
        });
    }
});

$(window).load(function() {

    $('body').hasClass('snippets') && LE.snippetsInit();

});