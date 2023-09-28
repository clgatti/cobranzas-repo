<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

defined( '_JEXEC' ) or die;

JFormHelper::loadFieldClass('dynamicsingleselect');

class JFormFieldSYWLayoutSelect extends JFormFieldDynamicSingleSelect
{
    public $type = 'SYWLayoutSelect';

    protected $direction;
    protected $items;

    protected function getOptions()
    {
        $options = array();

        $lang = JFactory::getLanguage();
        $lang->load('lib_syw.sys', JPATH_SITE);

        $imagefolder = JURI::root(true) . '/media/syw/images/alignment/';

        if ($this->use_global) {

        	$component  = JFactory::getApplication()->input->getCmd('option');
        	if ($component == 'com_menus') { // we are in the context of a menu item
        		$uri = new JUri($this->form->getData()->get('link'));
        		$component = $uri->getVar('option', 'com_menus');

        		$config_params = JComponentHelper::getParams($component);

        		$config_value = $config_params->get($this->fieldname);

        		if (!is_null($config_value)) {
        			$options[] = array('', JText::sprintf('JGLOBAL_USE_GLOBAL_VALUE', $this->items[$config_value]['label']), '', $imagefolder . $this->items[$config_value]['image'] . '.png', '');
        		} else {
        			$options[] = array('', JText::_('JGLOBAL_USE_GLOBAL'), '('.JText::_('LIB_SYW_GLOBAL_UNKNOWN').')', '', '');
        		}
        	} else {
        		$options[] = array('', JText::_('JGLOBAL_USE_GLOBAL'), '('.JText::_('LIB_SYW_GLOBAL_UNKNOWN').')', '', '');
        	}
        }

        foreach ($this->items as $key => $value) {
        	$options[] = array($key, $value['label'], '', $imagefolder . $value['image'] . '.png');
        }

        return $options;
    }

    public function setup(SimpleXMLElement $element, $value, $group = null)
    {
        $return = parent::setup($element, $value, $group);

        if ($return) {

        	$lang = JFactory::getLanguage();
        	$lang->load('lib_syw.sys', JPATH_SITE);

            $this->width = 50;
            $this->height = 50;
            
            $v_value = isset($this->element['v_value']) ? (string)$this->element['v_value'] : 'v';
            $h_value = isset($this->element['h_value']) ? (string)$this->element['h_value'] : 'h';
            
            $v_label = isset($this->element['v_label']) ? (string)$this->element['v_label'] : 'LIB_SYW_CONFIGURATION_VALUE_COLUMN';
            $h_label = isset($this->element['h_label']) ? (string)$this->element['h_label'] : 'LIB_SYW_CONFIGURATION_VALUE_ROW';

            $this->items = array();
            $this->items[$v_value] = array('label' => JText::_($v_label), 'image' => 'layout_vertical');
            $this->items[$h_value] = array('label' => JText::_($h_label), 'image' => 'layout_horizontal');
        }

        return $return;
    }
}
?>