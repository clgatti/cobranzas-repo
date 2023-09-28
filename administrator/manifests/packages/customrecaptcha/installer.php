<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// No direct access to this file
defined('_JEXEC') or die;

jimport('joomla.filesystem.file');
jimport('joomla.filesystem.folder');

/**
 * Script file of the Custom reCaptcha package
 */
class pkg_customrecaptchaInstallerScript
{
	static $version = '2.2.0';
	static $minimum_needed_library_version = '1.4.21';
	static $available_languages = array('da-DK', 'de-DE', 'en-GB', 'es-ES', 'fr-FR', 'it-IT', 'nl-NL', 'pt-BR', 'ru-RU', 'sv-SE', 'tr-TR');
	static $download_link = 'http://www.simplifyyourweb.com/downloads/syw-extension-library';
	static $changelog_link = 'https://simplifyyourweb.com/free-products/custom-recaptcha/file/294-custom-recaptcha';
	static $translation_link = 'https://simplifyyourweb.com/translators';

	/**
	 * Called before an install/update method
	 *
	 * @return  boolean  True on success
	 */
	public function preflight($type, $parent)
	{
		// check if syw library is present

		if (!JFolder::exists(JPATH_ROOT.'/libraries/syw')) {

			if (!$this->installOrUpdatePackage($parent, 'lib_syw')) {
				$message = JText::_('SYWLIBRARY_INSTALLFAILED').'<br /><a href="'.self::$download_link.'" target="_blank">'.JText::_('SYWLIBRARY_DOWNLOAD').'</a>';
				JFactory::getApplication()->enqueueMessage($message, 'error');
				return false;
			}

			JFactory::getApplication()->enqueueMessage(JText::sprintf('SYWLIBRARY_INSTALLED', self::$minimum_needed_library_version), 'message');

		} else {
			jimport('syw.version');

			if (SYWVersion::isCompatible(self::$minimum_needed_library_version)) {

				JFactory::getApplication()->enqueueMessage(JText::_('SYWLIBRARY_COMPATIBLE'), 'message');

			} else {

				if (!$this->installOrUpdatePackage($parent, 'lib_syw')) {
					$message = JText::_('SYWLIBRARY_UPDATEFAILED').'<br />'.JText::_('SYWLIBRARY_UPDATE');
					JFactory::getApplication()->enqueueMessage($message, 'error');
					return false;
				}

				JFactory::getApplication()->enqueueMessage(JText::sprintf('SYWLIBRARY_UPDATED', self::$minimum_needed_library_version), 'message');
			}
		}

		return true;
	}

	/**
	 * Called after an install/update method
	 *
	 * @return  boolean  True on success
	 */
	public function postflight($type, $parent)
	{
 		echo '<p style="margin: 20px 0">';
		echo '<img src="../plugins/captcha/customrecaptcha/images/logo.png" />';
		echo '<br /><br /><span class="label">'.JText::sprintf('PKG_CUSTOMRECAPTCHA_VERSION', self::$version).'</span>';
		echo '<br /><br />Olivier Buisard @ <a href="http://www.simplifyyourweb.com" target="_blank">Simplify Your Web</a>';
 		echo '</p>';

 		// language test

 		$current_language = JFactory::getLanguage()->getTag();
 		if (!in_array($current_language, self::$available_languages)) {
 			JFactory::getApplication()->enqueueMessage('The ' . JFactory::getLanguage()->getName() . ' language is missing for this extension.<br /><a href="' . self::$translation_link . '" target="_blank">Please consider contributing to its translation</a>', 'notice');
 		}

 		// the install may be a fresh install or an update of the old plugin
 		if ($type == 'install') {

 			// delete unnecessary files from old 1.x version

 			$files = array();

 			$files[] = '/plugins/captcha/customrecaptcha/fields/extensionlink.php';
 			$files[] = '/plugins/captcha/customrecaptcha/fields/message.php';
 			$files[] = '/plugins/captcha/customrecaptcha/fields/title.php';
 			$files[] = '/plugins/captcha/customrecaptcha/images/donate.png';
 			$files[] = '/plugins/captcha/customrecaptcha/images/jed.png';
 			$files[] = '/plugins/captcha/customrecaptcha/images/recaptcha_framework.png';
 			$files[] = '/plugins/captcha/customrecaptcha/recaptcha_base.css';
 			$files[] = '/plugins/captcha/customrecaptcha/recaptcha_base.css';
 			$files[] = '/plugins/captcha/customrecaptcha/recaptchav2.js';
 			$files[] = '/plugins/captcha/customrecaptcha/recaptchav2.min.js';
 			$files[] = '/plugins/captcha/customrecaptcha/recaptchav2responsive.js';
 			$files[] = '/plugins/captcha/customrecaptcha/recaptchav2responsive.min.js';

 			foreach ($files as $file) {
 				if (JFile::exists(JPATH_ROOT.$file) && !JFile::delete(JPATH_ROOT.$file)) {
 					JFactory::getApplication()->enqueueMessage(JText::sprintf('PKG_CUSTOMRECAPTCHA_ERROR_DELETINGFILEFOLDER', $file), 'warning');
 				}
 			}

 			// remove the old plugin update site for when it was not packaged

 			$this->removeUpdateSite('plugin', 'customrecaptcha', 'captcha');

 			// if site and secret keys are empty in the plugin (to avoid deleting keys from the old version), get potential keys from the Joomla reCaptcha plugin

 			$custom_recaptcha = JPluginHelper::getPlugin('captcha', 'customrecaptcha');
 			$params = json_decode($custom_recaptcha->params);

 			if (!isset($params->public_key) || (isset($params->public_key) && empty($params->public_key))) {

 				$recaptcha = JPluginHelper::getPlugin('captcha', 'recaptcha');
 				$params = json_decode($recaptcha->params);

 				$public_key = isset($params->public_key) ? trim($params->public_key) : '';
 				$private_key = isset($params->private_key) ? trim($params->private_key) : '';

 				if ($public_key) {

	 				$db = JFactory::getDBO();
	 				$query = $db->getQuery(true);

	 				$query->select('*');
	 				$query->from($db->quoteName('#__extensions'));
	 				$query->where('name=\'plg_captcha_customrecaptcha\'');

	 				$db->setQuery($query);

	 				$custom_recaptcha_plugins = array();
	 				try {
	 					$custom_recaptcha_plugins = $db->loadObjectList();
	 				} catch (RuntimeException $e) {
	 					JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
	 				}

	 				foreach ($custom_recaptcha_plugins as $custom_recaptcha_plugin) { // hopefully we only get one occurence

	 					$query->clear();

	 					$plugin_custom_params = new JRegistry();
	 					$plugin_custom_params->loadString($custom_recaptcha_plugin->params);

 						$plugin_custom_params->set('public_key', $public_key);
 						$plugin_custom_params->set('private_key', $private_key);

 						$query->update($db->quoteName('#__extensions'));
 						$query->set('params=\''.$plugin_custom_params->toString().'\'');
 						$query->where('extension_id='.$custom_recaptcha_plugin->extension_id);

 						$db->setQuery($query);

 						try {
 							$db->query();
 							JFactory::getApplication()->enqueueMessage(JText::_('PKG_CUSTOMRECAPTCHA_MESSAGE_LOADINGKEYSSUCCESSFUL'), 'message');
 						} catch (RuntimeException $e) {
 							JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
 						}
	 				}
 				}
 			}
 		}

 		// won't be an update on package first install, when moving from plugin to package
		if ($type == 'update') {

			// update warning

			JFactory::getApplication()->enqueueMessage(JText::sprintf('PKG_CUSTOMRECAPTCHA_WARNING_RELEASENOTES', self::$changelog_link), 'warning');

			// delete unnecessary files

// 			$files = array();

// 			foreach ($files as $file) {
// 				if (JFile::exists(JPATH_ROOT.$file) && !JFile::delete(JPATH_ROOT.$file)) {
// 					JFactory::getApplication()->enqueueMessage(JText::sprintf('PKG_CUSTOMRECAPTCHA_ERROR_DELETINGFILEFOLDER', $file), 'warning');
// 				}
// 			}
		}

		return true;
	}

	private function removeUpdateSite($type, $element, $folder = '', $location = '')
	{
	    $db = JFactory::getDBO();

	    $query = $db->getQuery(true);

	    $query->select('extension_id');
	    $query->from('#__extensions');
	    $query->where($db->quoteName('type').'='.$db->quote($type));
	    $query->where($db->quoteName('element').'='.$db->quote($element));
	    if ($folder) {
	        $query->where($db->quoteName('folder').'='.$db->quote($folder));
	    }

	    $db->setQuery($query);

	    $extension_id = '';
	    try {
	        $extension_id = $db->loadResult();
	    } catch (RuntimeException $e) {
	        JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
	        return false;
	    }

	    if ($extension_id) {

	        $query->clear();

	        $query->select('update_site_id');
	        $query->from('#__update_sites_extensions');
	        $query->where($db->quoteName('extension_id').'='.$db->quote($extension_id));

	        $db->setQuery($query);

	        $updatesite_id = array(); // can have several results
	        try {
	            $updatesite_id = $db->loadColumn();
	        } catch (RuntimeException $e) {
	            JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
	            return false;
	        }

	        if (empty($updatesite_id)) {
	            return false;
	        } else if (count($updatesite_id) == 1) {

	            $query->clear();

	            $query->delete($db->quoteName('#__update_sites'));
	            $query->where($db->quoteName('update_site_id').' = '.$db->quote($updatesite_id[0]));

	            $db->setQuery($query);

	            try {
	                $db->execute();
	            } catch (RuntimeException $e) {
	                JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
	                return false;
	            }
	        } else { // several update sites exist for the same extension therefore we need to specify which to delete

	            if ($location) {
	                $query->clear();

	                $query->delete($db->quoteName('#__update_sites'));
	                $query->where($db->quoteName('update_site_id').' IN ('.implode(',', $updatesite_id).')');
	                $query->where($db->quoteName('location').' = '.$db->quote($location));

	                $db->setQuery($query);

	                try {
	                    $db->execute();
	                } catch (RuntimeException $e) {
	                    JFactory::getApplication()->enqueueMessage(JText::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');
	                    return false;
	                }
	            } else {
	                return false;
	            }
	        }
	    } else {
	        return false;
	    }

	    return true;
	}

	private function installOrUpdatePackage($parent, $package_name, $installation_type = 'install')
	{
		// Get the path to the package

		$sourcePath = $parent->getParent()->getPath('source');
		$sourcePackage = $sourcePath . '/packages/'.$package_name.'.zip';

		// Extract and install the package

		$package = JInstallerHelper::unpack($sourcePackage);
		$tmpInstaller = new JInstaller;

		try {
			if ($installation_type == 'install') {
				$installResult = $tmpInstaller->install($package['dir']);
			} else {
				$installResult = $tmpInstaller->update($package['dir']);
			}
		} catch (\Exception $e) {
			return false;
		}

		return true;
	}

	/**
	 * Called on installation
	 *
	 * @return  boolean  True on success
	 */
	public function install($parent) {}

	/**
	 * Called on update
	 *
	 * @return  boolean  True on success
	 */
	public function update($parent) {}

	/**
	 * Called on uninstallation
	 */
	public function uninstall($parent) {}

}
?>