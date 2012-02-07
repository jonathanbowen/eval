LE.popups = {
    'preview-popup': {
        url: 'preview', 
        params: 'width=900,height=600,scrollbars=yes',
        onLoad: LE.reload,
        onClose: function() {
            LE.viewMode === 'popup' && LE.setViewMode('code');
            LE.reload();
        }
    },
    snippets: {
        url: 'snippets',
        params: 'width=600,height=450,location=no,status=no',
        onOpen: function() {
            LE.toolbarButton('snippets').on();
        },
        onClose: function() {
            LE.toolbarButton('snippets').off();
        }
    }
};