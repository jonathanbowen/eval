LE.snippetsToolbar = {
    add: {
        snippetNewFolder: {
            title: 'New folder',
            callback: LE.newSnippetFolder
        },
        snippetNew: {
            title: 'New snippet',
            callback: LE.newSnippetOrMacro
        }
    },
    view: {
        viewSnippets: {
            title: 'View snippets',
            callback: function() { LE.setSnippetView('snippets'); }
        },
        viewMacros: {
            title: 'View macros',
            callback: function() { LE.setSnippetView('macros'); }
        }        
    },
    importExport: {
        importExport: {
            title: 'Import / export',
            flyout: function(id) {
                return LE.createScrollMenu(id, {
                    Import: {
                        callback: LE.importSnippets
                    },
                    Export: {
                        callback: LE.exportSnippets
                    }
                });
            }
        }
    },
    help: {
        help: {
            title: 'Help',
            callback: function() { LE.setSnippetView('help'); }
        }
    }
};