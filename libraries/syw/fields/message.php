<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// no direct access
defined('_JEXEC') or die ;

jimport('joomla.form.formfield');

class JFormFieldMessage extends JFormField
{
	public $type = 'Message';

    protected $message_type;
    protected $message;
    protected $badge_type;
    protected $badge;

	protected function getLabel()
	{
		$html = '';

		$lang = JFactory::getLanguage();
		$lang->load('lib_syw.sys', JPATH_SITE);

		if ($this->message_type == 'example') {
			$html .= '<label style="visibility: hidden; margin: 0">'.JText::_('LIB_SYW_MESSAGE_EXAMPLE').'</label>';
		} else if ($this->message_type == 'fieldneutral' || $this->message_type == 'fieldwarning' || $this->message_type == 'fielderror' || $this->message_type == 'fieldinfo') {
		    if ($this->badge) {
		        return '<span class="label label-' . $this->badge_type . '">' . $this->badge . '</span><br />' . parent::getLabel();
		    } else {
		        return parent::getLabel();
		    }
		} else {
			$html .= '<div style="clear: both;"></div>';
		}

		return $html;
	}

	protected function getInput()
	{
		$html = '';

		$lang = JFactory::getLanguage();
		$lang->load('lib_syw.sys', JPATH_SITE);

		$message_label = '';
		if ($this->element['label']) {
			$message_label = $this->translateLabel ? JText::_(trim($this->element['label'])) : trim($this->element['label']);
		}

		if ($this->message_type == 'example') {

			if ($message_label) {
				$html .= '<span class="label">'.$message_label.'</span>&nbsp;';
			} else {
				$html .= '<span class="label">'.JText::_('LIB_SYW_MESSAGE_EXAMPLE').'</span>&nbsp;';
			}

			if ($this->message) {
			    $html .= '<span class="muted" style="font-size: 0.8em;">' . JText::_($this->message) . '</span>';
			}

		} else {
			$style = '';
			$style_label = '';
			switch ($this->message_type) {
			    case 'warning': case 'fieldwarning': $style = 'warning'; $style_label = 'warning'; break;
			    case 'error': case 'fielderror': $style = 'error'; $style_label = 'important'; break;
			    case 'info': case 'fieldinfo': $style = 'info'; $style_label = 'info'; break;
			    case 'neutral': break;
			    case 'fieldneutral': $style = 'neutral'; break;
			    default: $style = 'success'; $style_label = 'success'; /* message, success */
			}

			$class_attribute = '';
			if ($style) {
			    $class_attribute = ' class="alert alert-' . $style . '"';
			}

			$html .= '<div style="margin-bottom: 0"' . $class_attribute . '>';
			if ($message_label && $this->message_type != 'fieldneutral' && $this->message_type != 'fieldwarning' && $this->message_type != 'fielderror' && $this->message_type != 'fieldinfo') {

			    if ($message_label == 'Pro') {
			        $style_label = 'important';
			    }

			    if ($style_label) {
			        $style_label = ' label-'.$style_label;
			    }

			    $html .= '<span class="label'.$style_label.'">'.$message_label.'</span>&nbsp;';
			}

			if ($this->message) {
			    $style_attribute = '';
			    if ((isset($message_label) && $message_label == 'Pro') || $this->badge == 'Pro') {
			        $style_attribute = ' style="font-style: italic"';
			    }
			    $html .= '<span' . $style_attribute . '>' . JText::_($this->message) . '</span>';
			}

			$html .= '</div>';
		}

		return $html;
	}

	public function setup(SimpleXMLElement $element, $value, $group = null)
	{
		$return = parent::setup($element, $value, $group);

		if ($return) {
			$this->message_type = isset($this->element['style']) ? trim((string)$this->element['style']) : 'info';
			$this->message = isset($this->element['text']) ? trim((string)$this->element['text']) : '';
			$this->badge_type = isset($this->element['badgetype']) ? trim((string)$this->element['badgetype']) : 'important';
			$this->badge = isset($this->element['badge']) ? trim((string)$this->element['badge']) : '';
			$this->badge = JText::_($this->badge);
		}

		return $return;
	}

}
?>