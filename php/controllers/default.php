<?php defined('LE_BASE_DIR') or die;

class LE_Default extends LE_Controller {

    public function index() 
    {
        $this->load_view('index');
    }
}