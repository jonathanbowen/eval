<?php defined('LE_BASE_DIR') or die;

class LE_Preview extends LE_Controller {

    public function index()
    {
        console::set_error_handler(FALSE);

        if (!empty($_POST['url']))
        {
            header('Location: ' . LE_SERVER_URI . '/' . $_POST['url']);
        }
        elseif (isset($_POST['code']))
        {
            eval('?>' . $_POST['code']);
        }
        else
        {
            ?><!doctype html>
            <meta charset=utf-8>
            <title>Preview</title>
            <pre>Type some awesome code.<br>Ctrl+J to watch the carnage.</pre>
            <?php
        }
    }
}

// end of file