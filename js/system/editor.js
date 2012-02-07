LE.editor = (function() {

    var instance;

    return {

        init: function(obj) {
            instance = obj;
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