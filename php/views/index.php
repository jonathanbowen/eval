<?php defined('LE_BASE_DIR') or die;
?>
<!doctype html>
<html lang="en-GB">
<head>
    <meta charset="utf-8">

    <title>Live-Eval <?php echo LE_VERSION; ?></title>

    <link rel="shortcut icon" type="image/x-icon" href="<?php echo LE_BASE_URI; ?>img/devil.ico">

    <link rel="stylesheet" href="<?php echo LE_BASE_URI; ?>css/style.css">
    <link rel="stylesheet" href="<?php echo LE_BASE_URI; ?>js/libs/jquery.dialogbox/jquery.dialogbox.css">

    <script src="<?php echo LE_BASE_URI; ?>js/libs/editarea_0_8_2/edit_area/edit_area_full.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery-1.6.4.min.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery.dialogbox/jquery.dialogbox.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/tooltips.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery.rightClick.js"></script>
    <script src="<?php echo LE_BASE_URI; ?>js/libs/contextmenu.js"></script>
</head>
<body>

    <div id="loading"></div>

    <div id="toolbar" class="clearfix">
        <div class="toolbar-section">
            <span id="test-mode" title="Testing mode" class="edit-mode"></span>
            <span id="edit-mode" class="edit-mode none" title="Editing mode"></span>
        </div>
    </div>

    <div id="flyouts"></div>

    <div id="main">
        <div id="editor">
            <form action="<?php echo LE_BASE_URI; ?>preview" target="preview-iframe" method="post">
                <textarea name="code" id="code" rows="10" cols="50"></textarea>
                <input type="hidden" id="url" name="url">
            </form>
        </div>
        <div id="preview">
            <iframe src="<?php echo LE_BASE_URI; ?>preview" name="preview-iframe" id="preview-iframe"></iframe>
        </div>
    </div>

    <div class="none">
        <iframe src="<?php echo LE_BASE_URI; ?>file_browser/" name="file-iframe" id="file-iframe"
        data-baseurl="<?php echo LE_BASE_URI; ?>file_browser/" style="height:400px"></iframe>
    </div>

    <form id="options" class="flyout-inner">
        <div>
            <input type="checkbox" id="prefs-autocomplete" class="pref">
            <label for="prefs-autocomplete">Enable auto-complete</label>
        </div>
        <div>
            <label for="newfile">New file contents:</label>
            <textarea id="newfile" name="newfile" rows="9" cols="45" class="pref"></textarea>
        </div>
        <div><input type="submit" value="Save"> <input type="button" value="Cancel"></div>
    </form>

    <form id="searchform" class="flyout-inner">
        <div>
            <div class="clearfix">
                <label for="area_search">Search:</label>
                <input type="text" id="area_search">
            </div>
            <div class="clearfix">
                <label for="area_replace">Replace:</label>
                <input type="text" id="area_replace">
            </div>
        </div>
        <div>
            <input type="checkbox" id="area_search_match_case">
            <label for="area_search_match_case">Match case</label>
            <input type="checkbox" id="area_search_reg_exp" style="margin-left:10px">
            <label for="area_search_reg_exp">Regular expressions </label>
        </div>
        <div>
            <input type="button" value="Find next" id="search-find-next" data-command="area_search">
            <input type="button" value="Replace" id="search-replace" data-command="area_replace">
            <input type="button" value="Replace all" id="search-replace-all" data-command="area_replace_all">
            <div id="search-result" style="text-align:left"></div>
        </div>
    </form>

<?php le_load_js(); ?>

</body>
</html>