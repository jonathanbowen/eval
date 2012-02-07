<?php defined('LE_BASE_DIR') or die;
?>
<!doctype html>
<html lang="en-GB">
<head>
    <meta charset="utf-8">

    <title>Snippets and macros | Live-Eval <?php echo LE_VERSION; ?></title>

    <link rel="shortcut icon" type="image/x-icon" href="<?php echo LE_BASE_URI; ?>img/devil.ico">

    <link rel="stylesheet" href="<?php echo LE_BASE_URI; ?>css/style.css">
    <link rel="stylesheet" href="<?php echo LE_BASE_URI; ?>js/libs/jquery.dialogbox/jquery.dialogbox.css">

    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery-1.6.4.min.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery.dialogbox/jquery.dialogbox.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/tooltips.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery.rightClick.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/contextmenu.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery-ui-1.8.16.custom.min.js"></script>
</head>
<body class="snippets">

    <div id="loading"></div>

    <div id="toolbar" class="clearfix"></div>

    <div id="flyouts"></div>

    <div id="main">
        <div id="snippets">
            <div id="snippets-list" class="snippets-list"></div>
            <div class="none-selected">No snippet selected.</div>
            <form id="snippet-content" class="none">
                <div>
                    <label for="snippet-name">Snippet name:</label>
                    <input type="text" name="snippet-name" id="snippet-name">
                </div>
                <div>
                    <label for="before-cursor">Before cursor:</label>
                    <textarea name="before-cursor" id="before-cursor" cols="40" rows="5"></textarea>
                </div>
                <div>
                    <label for="after-cursor">After cursor:</label>
                    <textarea name="after-cursor" id="after-cursor" cols="40" rows="5"></textarea>
                </div>
                <div>
                    <input type="button" value="Insert" class="snippet-insert">
                    <input type="button" value="Save" id="snippet-save">
                </div>
            </form>
        </div>
        <div id="macros" class="none">
            <div id="macros-list" class="snippets-list"></div>
            <div class="none none-selected">No macro selected.</div>
            <form id="macro-content">
                <div>
                    <label for="macro-name">Macro name:</label>
                    <input type="text" id="macro-name">
                </div>
                <div>
                    <label for="macro-code">Macro content:</label>
                    <textarea id="macro-code" cols="40" rows="13"></textarea>
                </div>
                <div>
                    <input type="button" value="Run" class="snippet-insert">
                    <input type="button" value="Save" id="macro-save">
                </div>
            </form>
        </div>
        <div id="help" class="none">
            <div>
                <h1>About snippets &amp; macros</h1>
                <h2>Snippets</h2>
                <p>Snippets wrap selected text in the editor with <strong>before</strong> and <strong>after</strong> tags.</p>
                <h2>Macros</h2>
                Macros are javascript functions; the return value (if not <em>null</em> or <em>undefined</em>)
                will replace selected text in the editor or be inserted at the cursor position.
                The following functions can be used within macros:
                <ul>
                    <li><strong>selectedText([text])</strong> - getter or setter for currently selected text</li>
                    <li><strong>editorContents([text])</strong> - getter or setter for entire editor contents</li>
                    <li><strong>insertTags(opener, closer)</strong> - wraps selected text with opening and closing tags</li>
                </ul>
                <h2>Variables</h2>
                <p>Variables can be used in snippet or macro contents to invoke a dialog box in which you can supply custom text to
                be inserted at that position or used as a variable within the macro. Variables take the following form:</p>
                <blockquote><pre>[%Variable name=default value%]</pre></blockquote>
                <p>The default value is optional, and if supplied will be shown as the initial value in the dialog.
                For macros, the variable value will be inserted into the function as a string. The same variable can be repeated
                multiple times within the snippet or macro.</p>
                <h2>Examples</h2>
                <p>Snippet example - inserting an input tag:</p>
                <blockquote><pre>&lt;input type="[%Input type=text%]" name="[%Input name/id%]"
id="[%Input name/id%]" value="[%Input value%]"&gt;</pre></blockquote>
                <p>Macro example - repeating a string for a given number of iterations:</p>
                <blockquote><pre>var result = '';
for (var i = 0; i &lt; [%iterations%]; i++) {
    result += [%text%];
}
return result;</pre></blockquote>
                <p>Another macro example - convert selected text to uppercase:</p>
                <blockquote><pre>return selectedText().toUpperCase();</pre></blockquote>
                <p>This has the same result as:</p>
                <blockquote><pre>selectedText(selectedText().toUpperCase());</pre></blockquote>
            </div>
        </div>
    </div>

    <script>
    window.log = console.log;
    window.LE = {
        baseURI: <?php echo json_encode(LE_ABS_BASE_URI); ?>
    };
    $(document).ready(function() {
        $.each(LE.snippetsToolbar, function(groupName, buttons) {
            LE.addToolbarGroup(groupName, buttons);
        });
        $('[title]').tooltip();
        $('#loading').hide();
    });
    </script>

    <script src="<?php echo LE_BASE_URI; ?>js/system/utilities.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/system/snippets.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/system/toolbar.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/system/storage.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/system/interface.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/system/actions.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/config/storageitems.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/config/snippets-toolbar.js"></script>

</body>
</html>