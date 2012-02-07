<?php defined('LE_BASE_DIR') or die;

function list_files($items)
{
    $result = '';
    if ($items)
    {
        foreach ($items as $item)
        {
            $file_info = '';
            $filesize  = '';
            
            if (!is_dir($item))
            {
                $filesize      = filesize($item);
                $kb            = number_format($filesize / 1024);
                $filesize      = $kb === '0' ? $filesize . ' B' : $kb . ' KB';
                $filesize     .= ' | ';
            }
            
            $modified_date = date('Y/m/d H:i', filemtime($item));
            $file_info     = ' <span class="file-info">' . $filesize . $modified_date . '</span>';
            $file_path     = substr($item, strlen($_SERVER['DOCUMENT_ROOT']) + 1);

            $result .= '<li>
                <a href="' . $file_path . '"
                class="' . (is_dir($item) ? 'dir' : 'file') . '"
                data-filename="' . $file_path . '"><span>' .
                basename($item) . $file_info . '</span></a>' . '</li>';
        }
    }
    else
    {
        $result = '<li>(empty)</li>';
    }
    $result = '<ul>' . $result . '</ul>';
    return $result;
}

$file_list = list_files($files);

LE_IS_AJAX and die($file_list);

?>
<!doctype html>
<html lang="en-GB">
<head>
    <meta charset="utf-8">
    <title><?php echo $mode; ?> file</title>
    <link rel="stylesheet" href="<?php echo LE_BASE_URI; ?>css/style.css">
    <script src="<?php echo LE_BASE_URI; ?>js/libs/jquery-1.6.4.min.js"></script>
</head>
<body>
    <div id="file-list">
    <?php echo $file_list; ?>
    </div>
    
    <form>
        <input id="filename" placeholder="File name" type="text">
    </form>

    <script>
(function() {

    var mode = '<?php echo $mode; ?>';

    try {
        window.parent.LE.fileBrowserInit(mode, jQuery, window);
    }
    catch(e){}

}());
    </script>
</body>
</html>