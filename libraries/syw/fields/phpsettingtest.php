<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// no direct access
defined('_JEXEC') or die ;

jimport('joomla.form.formfield');
jimport('joomla.plugin.helper');

class JFormFieldPhpSettingTest extends JFormField
{
	public $type = 'PhpSettingTest';

	protected $setting;
	protected $message;

	protected function getLabel()
	{
		return '';
	}

	protected function getInput()
	{
		$lang = JFactory::getLanguage();
		$lang->load('lib_syw.sys', JPATH_SITE);

		$html = '';

		if (!ini_get($this->setting)) {
			$html .= '<div style="margin-bottom:0" class="alert alert-error">';
				if ($this->message) {
					$html .= '<span style="display: inline-block; padding-bottom: 10px">'. $this->message .'</span><br />';
				}
				$html .= '<span>'.JText::sprintf('LIB_SYW_PHPSETTING_DISABLED', $this->setting).'</span>';
			$html .= '</div>';
		} else {
			$html .= '<div style="margin-bottom:0" class="alert alert-success">';
				if ($this->message) {
					$html .= '<span style="display: inline-block; padding-bottom: 10px">'. $this->message .'</span><br />';
				}
				$html .= '<span>'.JText::sprintf('LIB_SYW_PHPSETTING_ENABLED', $this->setting).'</span>';
			$html .= '</div>';
		}

		return $html;
	}

	public function setup(SimpleXMLElement $element, $value, $group = null)
	{
		$return = parent::setup($element, $value, $group);

		if ($return) {
			$this->setting = isset($this->element['setting']) ? trim((string)$this->element['setting']) : '';
			$this->message = isset($this->element['message']) ? trim(JText::_((string)$this->element['message'])) : '';
		}

		return $return;
	}

}
?>
