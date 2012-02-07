<?php defined('LE_BASE_DIR') or die;

class LE_File_browser extends LE_Controller {

    private $allowed_extensions = array('php', 'js', 'htm', 'html', 'css', 'scss', 'txt', 'htaccess', 'log', 'inc');
    
    private $found_files = array();
    
    public function index() 
    {
        $this->browse();
    }

    public function browse($mode = 'open')
    {   
        $dir = isset($_GET['dir']) ? $_GET['dir'] : '';
        $data = array(
            'mode' => $mode === 'save' ? 'save' : 'open',
            'files' => $this->find_files($dir)
        );
        
        $this->load_view('file_browser', $data);
    }
    
    public function open() {
    
        $result   = array('success' => FALSE, 'text' => '');
        $filename = $_SERVER['DOCUMENT_ROOT'] . '/' . ($_GET['file'] ? $_GET['file'] : '');

        if (substr_count($filename, '../'))
        {
            $result['text'] = $filename . ' is not allowed!';
        }
        elseif (is_dir($filename))
        {
            $result['text'] = $filename . ' is a directory! Please specify a file!';
        }
        elseif (!file_exists($filename))
        {
            $result['text'] = $filename . ' was not found on the server!';
        }
        else
        {
            $file_contents = @file_get_contents($filename);
            if ($file_contents === FALSE)
            {
                $result['text'] = 'Error opening file!';
            }
            else
            {
                $result['success'] = TRUE;
                $result['text']    = $file_contents;
            }
        }

        die(json_encode($result));
    }
    
    public function save() {
    
        if (!empty($_POST['save']) && isset($_POST['text']))
        {
            $filename  = $_SERVER['DOCUMENT_ROOT'] . '/' . $_POST['save'];
            $dir       = dirname($filename);
            $result    = array('success' => FALSE, 'message' => '', 'must_confirm' => FALSE);
            $overwrite = isset($_POST['overwrite']) && $_POST['overwrite'] === '1';

            if (!is_dir($dir) || !is_writable($dir))
            {
                $result['message'] = 'Target directory does not exist or is not writable.';
            }
            elseif (is_dir($filename))
            {
                $result['message'] = 'Please type a file name!';
            }
            elseif (file_exists($filename) && !$overwrite)
            {
                $result['must_confirm'] = TRUE;
                $result['message']      = $filename . ' already exists. Overwrite?';
            }
            else
            {
                $save = @file_put_contents($filename, $_POST['text']);

                if ($save === FALSE)
                {
                    $result['message'] = 'Error writing to file.';
                }
                else
                {
                    $result['success'] = TRUE;
                }
            }

            die(json_encode($result));
        }
    }
    
    private function find_files($dir = '')
    {
        $dir   = $_SERVER['DOCUMENT_ROOT'] . ($dir ? '/' . $dir : '');
        $found = glob($dir . '/*');
        $files = $dirs = array();

        foreach ($found as $item)
        {
            $ext = pathinfo($item, PATHINFO_EXTENSION);
            if (is_dir($item))
            {
                $dirs[] = $item;
            }
            elseif (in_array($ext, $this->allowed_extensions) || !$ext)
            {
                $files[] = $item;
            }
        }
        natcasesort($dirs);
        natcasesort($files);

        return array_merge($dirs, $files);
    }
}