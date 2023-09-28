<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

defined('JPATH_PLATFORM') or die;

JFormHelper::loadFieldClass('list');

class JFormFieldViews extends JFormFieldList
{
	public $type = 'Views';

	protected $extension_option;
	protected $extension_view;

	protected function getOptions()
	{
		$options = array();

		$db = JFactory::getDBO();

		$additional_tag = '';
		if (JLanguageMultilang::isEnabled()) {
			$additional_tag = ', " (", a.language, ")"';
		}

		$extension_views = explode(",", $this->extension_view);

		if (count($extension_views) > 1) {

			foreach ($extension_views as $extension_view) {

				$query = $db->getQuery(true);

				$query->select('DISTINCT a.id AS value, CONCAT(a.title, " (", a.alias, ")"'.$additional_tag.') AS text, a.alias, a.level, a.menutype, a.type, a.template_style_id, a.checked_out');
				$query->from('#__menu AS a');
				$query->join('LEFT', $db->quoteName('#__menu') . ' AS b ON a.lft > b.lft AND a.rgt < b.rgt');
				$query->where('a.link LIKE '.$db->quote('%option='.$this->extension_option.'&view='.$extension_view.'%'));
				$query->where('a.published = 1');

				$db->setQuery($query);

				try {
					$results = $db->loadObjectList();

					if (count($results) > 0) {
						$options[] = JHtml::_('select.optgroup', '[' . $extension_view . ']');
						foreach ($results as $result) {
							$options[] = JHtml::_('select.option', $extension_view . ':' . $result->value, $result->text, 'value', 'text', $disable = false);
						}
						$options[] = JHtml::_('select.optgroup', '[' . $extension_view . ']');
					}
				} catch (RuntimeException $e) {
					//return false;
				}
			}
		} else {

			$query = $db->getQuery(true);

			$query->select('DISTINCT a.id AS value, CONCAT(a.title, " (", a.alias, ")"'.$additional_tag.') AS text, a.alias, a.level, a.menutype, a.type, a.template_style_id, a.checked_out');
			$query->from('#__menu AS a');
			$query->join('LEFT', $db->quoteName('#__menu') . ' AS b ON a.lft > b.lft AND a.rgt < b.rgt');
			$query->where('a.link LIKE '.$db->quote('%option='.$this->extension_option.'&view='.$extension_views[0].'%'));
			$query->where('a.published = 1');

			$db->setQuery($query);

			try {
				$options = $db->loadObjectList();
			} catch (RuntimeException $e) {
				//return false;
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
			$this->extension_option = isset($this->element['option']) ? trim((string)$this->element['option']) : '';
			$this->extension_view = isset($this->element['view']) ? (string)$this->element['view'] : '';
		}

		return $return;
	}

}
