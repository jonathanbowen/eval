LE.editor = (function() {

    var instance;

    return {

        init: function(obj) {
            instance = LE.editor[obj];
        },

        getValue: function() {
            return instance.getValue();
        },
        
        setValue: function(str) {
            return instance.setValue(str);
        },
        
        getSelection: function() {
            return instance.getSelection();
        },
        
        replaceSelection: function(str) {
            return instance.replaceSelection(str);
        },
        
        getCursor: function() {
            return instance.getCursor();
        },
        
        setCursor: function(pos) {
            return instance.setCursor(pos);
        },
        
        setSelection: function(start, end) {
            return instance.setSelection(start, end);
        }
        
    };

}());

LE.editor.editArea = (function() {

    var elmId = 'code';
    
    function getValue() {
        return editAreaLoader.getSelectedText(elmId);
    }
    
    function setValue(str) {
        editAreaLoader.setSelectedText(elmId, str);
    }
    
    return {
        getValue: getValue,
        setValue: setValue
    }

}());

LE.init = LE.init || {};

LE.init.editor = function() {
    LE.editor.init('editArea');
}
