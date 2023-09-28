<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// no direct access
defined( '_JEXEC' ) or die;

JFormHelper::loadFieldClass('list');

class JFormFieldImageTypeSelect extends JFormFieldList
{
	protected $type = 'ImageTypeSelect';
	
	protected $include_avif;

	protected function getOptions() {

		$options = array();
		
		if (extension_loaded('gd')) {
		    
		    if (function_exists('imagewebp')) {
		        $options[] = JHTML::_('select.option', 'image/webp', 'image/webp', 'value', 'text', $disable = false);
		    }
		    
		    if ($this->include_avif && function_exists('imageavif')) {
 		        $options[] = JHTML::_('select.option', 'image/avif', 'image/avif', 'value', 'text', $disable = true );
 		    }
		}

		// Merge any additional options in the XML definition.
		$options = array_merge(parent::getOptions(), $options);

		return $options;
	}
	
	
	public function setup(SimpleXMLElement $element, $value, $group = null)
	{
	    $return = parent::setup($element, $value, $group);
	    
	    if ($return) {
	        $this->include_avif = isset($this->element['supportavif']) ? filter_var($this->element['supportavif'], FILTER_VALIDATE_BOOLEAN) : false;
	    }
	    
	    return $return;
	}
}
?>