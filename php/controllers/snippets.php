<?php defined('LE_BASE_DIR') or die;

class LE_Snippets extends LE_Controller {

    public function index() {
    
        $this->load_view('snippets');
    }
}

// end of file