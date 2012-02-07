/**
 * Define keyboard shortcuts here
 *
 * Default actions of these key combos will be prevented
 * If this is updated, make sure and update the reference at shortcuts.html
 */

LE.shortcuts = {

    'ctrl+j'       : LE.reload,
    'ctrl+r'       : LE.reload,
    'ctrl+n'       : LE.newFile,
    'ctrl+o'       : LE.openFile,
    'ctrl+s'       : function() { LE.saveFile() },
    'ctrl+shift+s' : function() { LE.saveFile(true); },
    'ctrl+f'       : function() { LE.toolbarButton('find').toggle(); },
    'ctrl++'       : function() { LE.textSizeAdjust(1); },
    'ctrl+-'       : function() { LE.textSizeAdjust(-1); },
    'ctrl+l'       : LE.cycleSyntax,
    'ctrl+d'       : LE.duplicateSelectedText,
    'ctrl+m'       : LE.openSnippets,
    'ctrl+q'       : LE.toggleComment.single,
    'ctrl+shift+q' : LE.toggleComment.block,
    'ctrl+alt+q'   : LE.toggleComment.html
};