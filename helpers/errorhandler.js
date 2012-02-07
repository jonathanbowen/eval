(function() {

var errorCount = 0,
    maxErrors = 100,
    opener = '<div style="font:.85em monospace;background:white;color:#e00;padding:5px;margin:10px;border:1px solid #e00">';

window.onerror = function(msg, url, line) {
    ++errorCount;
    if (errorCount === maxErrors) {
        document.body.innerHTML += opener + maxErrors + ' errors reached, logging discontinued</div>';
    }
    else if (errorCount < maxErrors) {
        msg = (msg || '').toString();
        document.body.innerHTML += opener + 'javascript error:<br><b>' + msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</b><br>' + url + ' on line ' + line + '</div>';
    }
    return true;
}

}());