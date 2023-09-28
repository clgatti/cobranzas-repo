<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// no direct access
defined('_JEXEC') or die ;

JFormHelper::loadFieldClass('list');

class JFormFieldDynamicMultipleSelect extends JFormFieldList
{
	public $type = 'DynamicMultipleSelect';

	protected $use_global;
	protected $noelement;
	protected $width;
	protected $maxwidth;
	protected $height;
	protected $selectedcolor;
	protected $disabledtitle;
	protected $imagebgcolor;

	protected $values = array();
	protected $selection_max;

	protected $forceMultiple = true;

	/**
	 * Method to get the field input markup.
	 *
	 * @return	string	The field input markup.
	 */
	protected function getInput()
	{
		$lang = JFactory::getLanguage();
		$lang->load('lib_syw.sys', JPATH_SITE);

		JHtml::_('bootstrap.tooltip');

		for ($i = 0; $i < $this->selection_max; $i++) {
			$this->values[] = '';
		}

		$this->values[0] = $this->default;

		// 		if ($this->default) {
		// 			$defaults = explode(",", $this->default);
		// 			foreach ($defaults as $i => $default) {
		// 				$this->values[$i] = $default;
		// 			}
		// 		}

		if (is_array($this->value)) {
			foreach ($this->value as $i => $value) {
				if ($value) {
					$this->values[$i] = $value;
				}
			}
		} else {
			if ($this->value) {
				$this->values[0] = $this->value; // for backward compatibility with single select
			}
		}

		// build the script

		$script = 'jQuery(document).ready(function () {';
		$script .= 'jQuery("#'.$this->id.'_elements .element.enabled").each(function() {';

		foreach ($this->values as $value) {
			$script .= 'if (jQuery(this).attr("data-option") == "'.$value.'") {';
			$script .= 'jQuery(this).addClass("selected");';
			$script .= '}';
		}

		$script .= '});';

		$script .= 'jQuery("#'.$this->id.'_elements .element.enabled").click(function() {';

		$script .= 'var has_changes = false; ';
		$script .= 'if (jQuery(this).hasClass("selected")) { ';
		$script .= 'jQuery(this).removeClass("selected"); has_changes = true;';
		$script .= '} else {';
		$script .= 'var number_selected_items = jQuery("#'.$this->id.'_elements .element.enabled.selected").length;';
		$script .= 'if (number_selected_items < '.$this->selection_max.') { ';
		$script .= 'jQuery(this).addClass("selected"); has_changes = true;';
		$script .= '}';
		$script .= '}';

		$script .= 'if (has_changes) { ';
		$script .= 'for (var i = 0; i < '.$this->selection_max.'; i++) { ';
		$script .= 'jQuery("#'.$this->id.'_id_" + i).val("");';
		$script .= '}';

		$script .= 'var i = 0;';
		$script .= 'jQuery("#'.$this->id.'_elements .element.enabled.selected").each(function() {';
		$script .= 'jQuery("#'.$this->id.'_id_" + i++).val(jQuery(this).attr("data-option"));';
		$script .= '});';
		$script .= '}';
		$script .= '});';
		$script .= '});';

		JFactory::getDocument()->addScriptDeclaration($script);

		// add the styles

		JFactory::getDocument()->addStyleDeclaration("
			#".$this->id."_elements { display: -webkit-box; display: -ms-flexbox; display: -webkit-flex; display: flex; overflow-x: auto; -ms-flex-wrap: wrap; flex-wrap: wrap; }
			#".$this->id."_elements .element { display: inline-block; position: relative; vertical-align: top; relative; margin: 0 5px 5px 5px; padding: 15px;".(!empty($this->maxwidth) ? " max-width: ".$this->maxwidth."px;" : "")." text-align: center; cursor: pointer; }
			#".$this->id."_elements .element.enabled:hover { -webkit-transform: scale(0.8); -ms-transform: scale(0.8); transform: scale(0.8); }
			#".$this->id."_elements .element.selected.global { background-color: #2384d3; color: #fff }
			#".$this->id."_elements .element.selected.none { background-color: #bd362f; color: #fff }
			#".$this->id."_elements .element.selected { background-color: ".$this->selectedcolor."; color: #fff }
			#".$this->id."_elements .element.disabled { opacity: 0.65; filter: alpha(opacity=65); cursor: default; }
			#".$this->id."_elements .images-container { display: inline-block; position: relative; width: ".$this->width."px; height: ".$this->height."px; margin-bottom: 5px;" . ($this->imagebgcolor ? " background-color: " . $this->imagebgcolor : "") . " }
			#".$this->id."_elements .images-container .imagelabel { position: absolute; top: 5px; left: 5px; z-index: 100 }
			#".$this->id."_elements .title { width: ".$this->width."px; }
			#".$this->id."_elements .description { width: ".$this->width."px; font-size: .8em }
			#".$this->id."_elements .element img { display: block; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); -webkit-transition: opacity .4s ease; transition: opacity .4s ease; max-width: ".$this->width."px; max-height: ".$this->height."px; }
			#".$this->id."_elements .element img.original { opacity: 1; filter: alpha(opacity=100); }
			#".$this->id."_elements .element img.hover { opacity: 0; filter: alpha(opacity=0); z-index: 2; }
			#".$this->id."_elements .element:hover img.hover { opacity: 1; filter: alpha(opacity=100); }
			#".$this->id."_elements .element:hover img.original { opacity: 0; filter: alpha(opacity=0); }
		");

		$options = array();

		if ($this->noelement) {
			$options[] = array('', JText::_('JNONE'), '');
		}

		$options = array_merge($options, $this->getOptions());

		$html = '<ul id="'.$this->id.'_elements" class="elements thumbnails">';

		foreach ($options as $option) {

			$class_global = '';
			$class_disabled = '';
			$class_hastooltip = '';
			$title_attribute = '';

			if (isset($option[5]) && ($option[5] == 'disabled' || $option[5] == true)) {
				$class_disabled = ' disabled';
				if (!empty($this->disabledtitle)) {
					$title_attribute = ' title="'.JText::_($this->disabledtitle).'"';
					$class_hastooltip = ' hasTooltip';
				}
			} else {
				$class_disabled = ' enabled';
				$title_attribute = ' title="'.JText::_('JSELECT').'"';
				$class_hastooltip = ' hasTooltip';
			}

			if ($option[0] == '') {
				if ($this->use_global) {
					$class_global = ' global';
				} else {
					$class_global = ' none';
				}
			} else if ($option[0] == 'no' || $option[0] == 'none') {
				$class_global = ' none';
			}

			$html .= '<li class="element thumbnail'.$class_global.$class_hastooltip.$class_disabled.'" data-option="'.$option[0].'"'.$title_attribute.'>';
			$html .= '<div class="images-container">';
			if (isset($option[3]) && !empty($option[3])) {

				$originalclass = '';
				if (isset($option[4]) && !empty($option[4])) {
					$originalclass = ' class="original"';
					$html .= '<img class="hover" alt="'.$option[1].'" src="'.$option[4].'" />';
				}

				$html .= '<img'.$originalclass.' alt="'.$option[1].'" src="'.$option[3].'" />';
			}

			if (isset($option[6])) {
				$html .= '<div class="label label-warning imagelabel">' . $option[6] . '</div>';
			}

			$html .= '</div>';

			$html .= '<div class="title">'.$option[1].'</div>';
			if (!empty($option[2])) {
				$html .= '<div class="description">'.$option[2].'</div>';
			}
			$html .= '</li>';
		}

		$html .= '</ul>';

		for ($i = 0; $i < $this->selection_max; $i++) {
			$html .= '<input type="hidden" id="'.$this->id.'_id_'.$i.'" name="'.$this->name.'" value="'.$this->values[$i].'" />';
		}

		return $html;
}

protected function getOptions()
{
	$xml_options = parent::getOptions();
	$options = array();

	foreach ($xml_options as $option) {
		$options[] = array($option->value, $option->text, '', '', '', $option->disable);
	}

	// TODO problem 'none' has no value, like global value

	// 		$options[] = array('option1', 'Option 1', 'Description 1', 'option1/option1.png', 'option1/option1_hover.png');
	// 		$options[] = array('option2', 'Option 2', 'Description 2', 'option2/option2.png', 'option2/option2_hover.png');
	// 		$options[] = array('option3', 'Option 3', 'Description 3', 'option3/option3.png', 'option3/option3_hover.png', 'disabled');

	return $options;
}

public function setup(SimpleXMLElement $element, $value, $group = null)
{
	$return = parent::setup($element, $value, $group);

	if ($return) {
		$this->use_global = ((string)$this->element['global'] == "true" || (string)$this->element['useglobal'] == "true") ? true : false;
		$this->noelement = isset($this->element['noelement']) ? filter_var($this->element['noelement'], FILTER_VALIDATE_BOOLEAN) : false;
		$this->width = 100;
		$this->maxwidth = '';
		$this->height = 100;
		$this->selectedcolor = '#46a546';//isset($this->element['selectedcolor']) ? (string)$this->element['selectedcolor'] : '#6f6f6f';
		$this->disabledtitle = isset($this->element['disabledtitle']) ? (string)$this->element['disabledtitle'] : '';
		$this->imagebgcolor = isset($this->element['imagebgcolor']) ? (string)$this->element['imagebgcolor'] : '';
		$this->selection_max = isset($this->element['selectionmax']) ? (int)$this->element['selectionmax'] : 2;
	}

	return $return;
}
}
?>