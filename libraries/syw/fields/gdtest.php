<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// no direct access
defined('_JEXEC') or die ;

jimport('joomla.form.formfield');
jimport('joomla.plugin.helper');

class JFormFieldGdtest extends JFormField
{
	public $type = 'Gdtest';

	protected $show_gif;
	protected $supported_types; // can be gif jpg png webp avif
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

		if (!extension_loaded('gd')) {
			$html .= '<div style="margin-bottom:0" class="alert alert-warning">';
				if ($this->message) {
					$html .= '<span style="display: inline-block; padding-bottom: 10px">'. $this->message .'</span><br />';
				}
				$html .= '<span>'.JText::sprintf('LIB_SYW_PHPEXTENSION_NOTINSTALLED', 'gd').'</span>';
			$html .= '</div>';

			return $html;
		} else {
			$html .= '<div style="margin-bottom:0" class="alert alert-success">';
				if ($this->message) {
					$html .= '<span style="display: inline-block; padding-bottom: 10px">'. $this->message .'</span><br />';
				}
				$html .= '<span>'.JText::sprintf('LIB_SYW_PHPEXTENSION_INSTALLED', 'gd').' ('.GD_VERSION.')'.'</span><br />';

			if (in_array('gif', $this->supported_types)) {
				if (imagetypes() & IMG_GIF) {
					$html .= '<span class="label label-success">GIF '.lcfirst(JText::_('JENABLED')).'</span> ';
				} else {
					$html .= '<span class="label label-warning">GIF '.lcfirst(JText::_('JDISABLED')).'</span> ';
				}
			}

			if (in_array('jpg', $this->supported_types)) {
				if (imagetypes() & IMG_JPG) {
					$html .= '<span class="label label-success">JPG '.lcfirst(JText::_('JENABLED')).'</span> ';
				} else {
					$html .= '<span class="label label-warning">JPG '.lcfirst(JText::_('JDISABLED')).'</span> ';
				}
			}

			if (in_array('png', $this->supported_types)) {
				if (imagetypes() & IMG_PNG) {
					$html .= '<span class="label label-success">PNG '.lcfirst(JText::_('JENABLED')).'</span> ';
				} else {
					$html .= '<span class="label label-warning">PNG '.lcfirst(JText::_('JDISABLED')).'</span> ';
				}
			}

			if (in_array('webp', $this->supported_types)) {
				if (imagetypes() & IMG_WEBP) {
					$html .= '<span class="label label-success">WEBP '.lcfirst(JText::_('JENABLED')).'</span> ';
				} else {
					$html .= '<span class="label label-warning">WEBP '.lcfirst(JText::_('JDISABLED')).'</span> ';
				}
			}
			
			if (in_array('avif', $this->supported_types)) {
			    if (function_exists('imageavif')) {
			        $html .= ' <span class="label label-success">AVIF '.lcfirst(JText::_('JENABLED')).'</span> ';
			    } else {
			        $html .= ' <span class="label label-warning">AVIF '.lcfirst(JText::_('JDISABLED')).'</span> ';
			    }
			}

			$html .= '</div>';
		}

		return $html;
	}

	public function setup(SimpleXMLElement $element, $value, $group = null)
	{
		$return = parent::setup($element, $value, $group);

		if ($return) {
			$this->show_gif = isset($this->element['showgif']) ? filter_var($this->element['showgif'], FILTER_VALIDATE_BOOLEAN) : true; // deprecated
			$supportedtypes = isset($this->element['supportedtypes']) ? strtolower(str_replace(' ', '', (string)$this->element['supportedtypes'])) : 'gif,jpg,png';
			$this->supported_types = explode(',', $supportedtypes);
			if (!$this->show_gif) {
				if (($key = array_search('gif', $this->supportedtypes)) !== false) {
					unset($this->supportedtypes[$key]);
				}
			}
			$this->message = isset($this->element['message']) ? trim(JText::_((string)$this->element['message'])) : '';
		}

		return $return;
	}

}
?>
