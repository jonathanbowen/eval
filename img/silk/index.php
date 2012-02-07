<?php

$files = glob('*.png');
foreach ($files as $file) {
    echo '<img src="' . $file . '" width="16" height="16" style="margin:8px" title="' . $file . '">';
}