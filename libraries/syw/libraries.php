<?php
/**
 * @copyright	Copyright (C) 2011 Simplify Your Web, Inc. All rights reserved.
 * @license		GNU General Public License version 3 or later; see LICENSE.txt
 */

// no direct access
defined('_JEXEC') or die;

class SYWLibraries
{
	static $purePajinateLoaded = false;
	static $lazysizesLoaded = false; // deprecated
	static $tinySliderLoaded = false;
	static $tingleLoaded = false;

	static $jq_pajinateLoaded = false; // deprecated
	static $jq_owlLoaded = false;

	static $jqcLoaded = false;
	static $jqcMultipackLoaded = false;
	static $jqcthrottleLoaded = false;
	static $jqctouchLoaded = false;
	static $jqcmousewheelLoaded = false;
	static $jqctransitLoaded = false;

	static $highresLoaded = array(); // deprecated
	static $instantiatePureModalLoaded = array();
	static $instantiateBootstrapModalLoaded = array();

	static $compareLoaded = false;

	/**
	 * Load purePajinate (pure javascript)
	 * v1.0.2
	 * https://github.com/obuisard/purePajinate
	 * IE10+ compatible
	 */
	static function loadPurePajinate($remote = false, $defer = false, $async = false)
	{
		if (self::$purePajinateLoaded) {
			return;
		}

		$minified = (JDEBUG) ? '' : '.min';

		$doc = JFactory::getDocument();

		if (version_compare(JVERSION, '3.2.0', 'ge')) {
			$doc->addScriptVersion(JURI::root(true).'/media/syw/js/purepajinate/purePajinate' . $minified . '.js', null, "text/javascript", $defer, $async);
		} else {
			$doc->addScript(JURI::root(true).'/media/syw/js/purepajinate/purePajinate' . $minified . '.js', "text/javascript", $defer, $async);
		}

		self::$purePajinateLoaded = true;
	}

	/*
	 * function that makes it easier to switch between libraries that handle pagination written in pure Javascript
	 */
	static function loadPurePagination($remote = false, $defer = false, $async = false)
	{
		self::loadPurePajinate($remote, $defer, $async);
	}

	/**
	 * Load Tiny Slider (pure javascript)
	 * v2.9.2
	 * https://github.com/ganlanyuan/tiny-slider
	 * IE8+ compatible
	 * the CSS file has been modified to add styling of the dots
	 * the JS file has been modified to add RTL support
	 */
	static function loadTinySlider($remote = false, $defer = false, $async = false)
	{
		if (self::$tinySliderLoaded) {
			return;
		}

		$minified = (JDEBUG) ? '' : '.min';

		$doc = JFactory::getDocument();

		// WARNING loading the library remotely won't have the RTL fix
		$remote = false;

		if ($remote) {

			$doc->addStyleSheet('https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.3/tiny-slider' . $minified . '.css');

			// style additions
			$doc->addStyleDeclaration('.tns-slider{-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;}.tns-nav{text-align:center;margin:10px 0}.tns-nav>[aria-controls]{width:9px;height:9px;padding:0;margin:0 5px;border-radius:50%;background:#ddd;border:0}.tns-nav>.tns-nav-active{background:#999}');

			$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.3/tiny-slider' . $minified . '.js');
		} else {

			if (version_compare(JVERSION, '3.2.0', 'ge')) {
				$doc->addStyleSheetVersion(JURI::root(true).'/media/syw/css/tinyslider/tiny-slider' . $minified . '.css');
				$doc->addScriptVersion(JURI::root(true).'/media/syw/js/tinyslider/tiny-slider' . $minified . '.js', null, "text/javascript", $defer, $async);
			} else {
				$doc->addStyleSheet(JURI::root(true).'/media/syw/css/tinyslider/tiny-slider' . $minified . '.css');
				$doc->addScript(JURI::root(true).'/media/syw/js/tinyslider/tiny-slider' . $minified . '.js', "text/javascript", $defer, $async);
			}
		}

		self::$tinySliderLoaded = true;
	}

	/**
	 * Load Tingle (pure javascript)
	 * v0.15.2
	 * https://github.com/robinparisi/tingle
	 * ? compatible
	 */
	static function loadTingle($remote = false, $defer = false, $async = false)
	{
		if (self::$tingleLoaded) {
			return;
		}

		$minified = (JDEBUG) ? '' : '.min';

		$doc = JFactory::getDocument();

		if ($remote) {
			$doc->addStyleSheet('https://cdnjs.cloudflare.com/ajax/libs/tingle/0.15.2/tingle' . $minified . '.css');
			$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/tingle/0.15.2/tingle' . $minified . '.js');
		} else {
			if (version_compare(JVERSION, '3.2.0', 'ge')) {
				$doc->addStyleSheetVersion(JURI::root(true).'/media/syw/css/tingle/tingle' . $minified . '.css');
				$doc->addScriptVersion(JURI::root(true).'/media/syw/js/tingle/tingle' . $minified . '.js', null, "text/javascript", $defer, $async);
			} else {
				$doc->addStyleSheet(JURI::root(true).'/media/syw/css/tingle/tingle' . $minified . '.css');
				$doc->addScript(JURI::root(true).'/media/syw/js/tingle/tingle' . $minified . '.js', "text/javascript", $defer, $async);
			}
		}

		self::$tingleLoaded = true;
	}

	/*
	 * function that makes it easier to switch between libraries that handle modals written in pure Javascript
	 */
	static function loadPureModal($remote = false, $defer = false, $async = false)
	{
		self::loadTingle($remote, $defer, $async);
	}

	/**
	 * Loads the code that instantiates and sets up the modals written in pure Javascript
	 *
	 * @param string $selector
	 */
	static function instantiatePureModal($selector = 'modal')
	{
		if (in_array($selector, self::$instantiatePureModalLoaded)) {
			return;
		}

		$lang = JFactory::getLanguage();
		$lang->load('lib_syw.sys', JPATH_SITE);

		$close_label = JText::_('LIB_SYW_MODAL_CLOSE');

		$selector_variable = str_replace('-', '_', $selector); // javascript does not like - in the name

		$inline_js = <<< JS
			document.addEventListener("readystatechange", function(event) {
				if (event.target.readyState === "complete") {
	
					var {$selector_variable} = new tingle.modal({
						stickyFooter: true,
						closeLabel: "{$close_label}",
						onOpen: function() { 
							document.querySelector(".tingle-modal .puremodal-close").addEventListener("click", function() { {$selector_variable}.close(); }); 

							document.querySelector("body").classList.add('modal-open');
							var event = document.createEvent('Event');
							event.initEvent('modalopen', true, true);
							document.dispatchEvent(event);
						},
						onClose: function() { 
							this.setContent(""); 
							document.querySelector("#{$selector}Label").textContent = ""; 
							document.querySelector("#{$selector} .iframe").setAttribute("src", "about:blank"); 

							document.querySelector("body").classList.remove('modal-open');
							var event = document.createEvent('Event');
							event.initEvent('modalclose', true, true);
							document.dispatchEvent(event);
						}
					});
	
					var clickable = document.querySelectorAll(".{$selector}");
					for (var i = 0; i < clickable.length; i++) {
						clickable[i].addEventListener("click", function() {
	
							var dataTitle = this.getAttribute("data-modaltitle");
							if (typeof (dataTitle) !== "undefined" && dataTitle !== null) { 
								document.querySelector("#{$selector}Label").textContent = dataTitle; 
							}
	
							var dataURL = this.getAttribute("href");
							document.querySelector("#{$selector} .iframe").setAttribute("src", dataURL);
	
							{$selector_variable}.setContent(document.querySelector("#{$selector}").innerHTML);
							{$selector_variable}.open();
						});
					}
	
				}
			});
JS;

		JFactory::getDocument()->addScriptDeclaration(self::compress($inline_js));

		self::$instantiatePureModalLoaded[] = $selector;
	}

	/**
	 * Loads the code that instantiates and sets up the modals for Bootstrap
	 *
	 * @param string $selector
	 * @param array $attributes
	 * @param number $bootstrap_version
	 */
	static function instantiateBootstrapModal($selector = 'modal', $attributes = array('default_title' => ''), $bootstrap_version = 2)
	{
		if (in_array($selector, self::$instantiateBootstrapModalLoaded)) {
			return;
		}

		if ($bootstrap_version < 5) {
			$inline_js = <<< JS
				jQuery(document).ready(function($) {
				
					$('.{$selector}').on('click', function () {
						var dataTitle = $(this).attr('data-modaltitle');
						if (typeof (dataTitle) !== 'undefined' && dataTitle !== null) { 
							$('#{$selector}').find('.modal-title').text(dataTitle); 
						}
						var dataURL = $(this).attr('href');
						$('#{$selector}').find('.iframe').attr('src', dataURL);
					});
				
					$('#{$selector}').on('show.bs.modal', function() {
						$('body').addClass('modal-open');
						var event = document.createEvent('Event'); 
						event.initEvent('modalopen', true, true); 
						document.dispatchEvent(event);
JS;
			
			if (isset($attributes['height'])) {
				$inline_js .= <<< JS
					}).on('shown.bs.modal', function() {
						var modal_body = $(this).find('.modal-body');
						modal_body.css({'max-height': {$attributes['height']}});
						var padding = parseInt(modal_body.css('padding-top')) + parseInt(modal_body.css('padding-bottom')); 
						modal_body.find('.iframe').css({'height': ({$attributes['height']} - padding)});
JS;
			}
			
			$inline_js .= <<< JS
				}).on('hide.bs.modal', function () {
					$(this).find('.modal-title').text('{$attributes['default_title']}');
					var modal_body = $(this).find('.modal-body'); 
					modal_body.css({'max-height': 'initial'}); 
					modal_body.find('.iframe').attr('src', 'about:blank'); 
					$('body').removeClass('modal-open');
					var event = document.createEvent('Event'); 
					event.initEvent('modalclose', true, true); 
					document.dispatchEvent(event);
				});
			
			});
JS;
		} else {
			// event.relatedTarget : elt that triggered the call

			$inline_js = <<< JS
				document.addEventListener("readystatechange", function(event) {
					if (event.target.readyState === "complete") {
					
						var modal = document.getElementById("{$selector}");
						
						modal.addEventListener("show.bs.modal", function (event) {
							var link = event.relatedTarget;
							if (typeof (link) !== "undefined" && link !== null) {
								var dataTitle = link.getAttribute("data-modaltitle");
								if (typeof (dataTitle) !== "undefined" && dataTitle !== null) {
									this.querySelector(".modal-title").innerText = dataTitle;
								}
								var dataURL = link.getAttribute("href");
								this.querySelector(".iframe").setAttribute("src", dataURL);
							}
							document.querySelector("body").classList.add("modal-open");
							var event = document.createEvent("Event");
							event.initEvent("modalopen", true, true);
							document.dispatchEvent(event);
						}, this);
						
						modal.addEventListener("shown.bs.modal", function (event) {
							var modal_body = this.querySelector(".modal-body");
						}, this);
						
						modal.addEventListener("hide.bs.modal", function (event) {
							this.querySelector(".modal-title").innerText = "{$attributes['default_title']}";
							var modal_body = this.querySelector(".modal-body");
							modal_body.querySelector(".iframe").setAttribute("src", "about:blank");
							document.querySelector("body").classList.remove("modal-open");
							var event = document.createEvent("Event");
							event.initEvent("modalclose", true, true);
							document.dispatchEvent(event);
						}, this);
					}
				});
JS;
		}

		JFactory::getDocument()->addScriptDeclaration(self::compress($inline_js));

		self::$instantiateBootstrapModalLoaded[] = $selector;
	}

	/**
	 * Load Owl Carousel (jQuery plugin)
	 * v2.3.4
	 * https://github.com/OwlCarousel2/OwlCarousel2
	 */
	static function loadOwlCarousel($remote = false, $defer = false, $async = false)
	{
		if (self::$jq_owlLoaded) {
			return;
		}

		$minified = (JDEBUG) ? '' : '.min';

		$doc = JFactory::getDocument();

		if ($remote) {
			$doc->addStyleSheet('https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel' . $minified . '.css');
			$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel' . $minified . '.js');
		} else {
			if (version_compare(JVERSION, '3.2.0', 'ge')) {
				$doc->addStyleSheetVersion(JURI::root(true).'/media/syw/css/owlcarousel/owl.carousel' . $minified . '.css');
				$doc->addScriptVersion(JURI::root(true).'/media/syw/js/owlcarousel/owl.carousel' . $minified . '.js', null, "text/javascript", $defer, $async);
			} else {
				$doc->addStyleSheet(JURI::root(true).'/media/syw/css/owlcarousel/owl.carousel' . $minified . '.css');
				$doc->addScript(JURI::root(true).'/media/syw/js/owlcarousel/owl.carousel' . $minified . '.js', "text/javascript", $defer, $async);
			}
		}

		self::$jq_owlLoaded = true;
	}

	/**
	 * DEPRECATED
	 * Load Lazysizes (pure javascript)
	 * v5.2.0
	 * https://github.com/aFarkas/lazysizes
	 */
	static function loadLazysizes($remote = false, $defer = false, $async = false)
	{
		if (self::$lazysizesLoaded) {
			return;
		}

		$minified = (JDEBUG) ? '' : '.min';

		$doc = JFactory::getDocument();

		if ($remote) {
			$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.2.0/lazysizes.min.js'); // only minified version
		} else {
		    if (version_compare(JVERSION, '3.2.0', 'ge')) {
		        $doc->addScriptVersion(JURI::root(true).'/media/syw/js/lazysizes/lazysizes' . $minified . '.js', null, "text/javascript", $defer, $async);
		    } else {
		        $doc->addScript(JURI::root(true).'/media/syw/js/lazysizes/lazysizes' . $minified . '.js', "text/javascript", $defer, $async);
		    }
		}

		self::$lazysizesLoaded = true;
	}

	/**
	 * DEPRECATED
	 * Load Pajinate (jQuery plugin)
	 * v0.4 modified
	 * https://github.com/wesnolte/Pajinate
	 */
	static function loadPagination($defer = false, $async = false, $remote = false)
	{
		if (self::$jq_pajinateLoaded) {
			return;
		}

		$minified = (JDEBUG) ? '' : '.min';

		$doc = JFactory::getDocument();

	    if (version_compare(JVERSION, '3.2.0', 'ge')) {
	        $doc->addScriptVersion(JURI::root(true).'/media/syw/js/pagination/jquery.pajinate' . $minified . '.js', null, "text/javascript", $defer, $async);
	    } else {
	        $doc->addScript(JURI::root(true).'/media/syw/js/pagination/jquery.pajinate' . $minified . '.js', "text/javascript", $defer, $async);
	    }

		self::$jq_pajinateLoaded = true;
	}

	/**
	 * Load the carousel carouFredSel library (jQuery plugins)
	 * v6.2.1
	 */
	static function loadCarousel($throttle = true, $touch = true, $mousewheel = false, $transit = false, $defer = false, $async = false, $remote = false)
	{
		if (self::$jqcMultipackLoaded && !$mousewheel && !$transit) {
			return;
		}

		$will_use_multipack = false;
		if (!self::$jqcLoaded && $throttle && $touch && !$mousewheel && !$transit && !JDEBUG && !$remote) {
			$will_use_multipack = true;
		}

		if ($throttle && !self::$jqcMultipackLoaded && !$will_use_multipack) {
			self::loadCarousel_throttle($defer, $async, $remote);
		}

		if ($touch && !self::$jqcMultipackLoaded && !$will_use_multipack) {
			self::loadCarousel_touch($defer, $async, $remote);
		}

		if ($mousewheel) {
			self::loadCarousel_mousewheel($defer, $async, $remote);
		}

		if ($transit) {
			self::loadCarousel_transit($defer, $async, $remote);
		}

		$doc = JFactory::getDocument();

		if (!self::$jqcMultipackLoaded && $will_use_multipack) { // multi-pack is not used when debug or when remote

		    if (version_compare(JVERSION, '3.2.0', 'ge')) {
		        $doc->addScriptVersion(JURI::root(true).'/media/syw/js/carousel/jquery.carouFredSel.min.js', null, "text/javascript", $defer, $async);
		    } else {
		        $doc->addScript(JURI::root(true).'/media/syw/js/carousel/jquery.carouFredSel.min.js', "text/javascript", $defer, $async);
		    }

			self::$jqcMultipackLoaded = true;
		} else {

			if (self::$jqcLoaded) {
				return;
			}

			if ($remote) {
				$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/jquery.caroufredsel/6.2.1/jquery.carouFredSel.packed.js'); // only minified version
			} else {
			    if (version_compare(JVERSION, '3.2.0', 'ge')) {
			    	$doc->addScriptVersion(JURI::root(true).'/media/syw/js/carousel/jquery.carouFredSel-6.2.1' . ((JDEBUG) ? '' : '-packed') . '.js', null, "text/javascript", $defer, $async);
			    } else {
			    	$doc->addScript(JURI::root(true).'/media/syw/js/carousel/jquery.carouFredSel-6.2.1' . ((JDEBUG) ? '' : '-packed') . '.js', "text/javascript", $defer, $async);
			    }
			}

			self::$jqcLoaded = true;
		}
	}

	/**
	 * jquery.ba-throttle-debounce
	 * v1.1
	 */
	static function loadCarousel_throttle($defer = false, $async = false, $remote = false)
	{
		if (self::$jqcthrottleLoaded) {
			return;
		}

		$doc = JFactory::getDocument();

		if ($remote) {
			$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-throttle-debounce/1.1/jquery.ba-throttle-debounce' . ((JDEBUG) ? '' : '.min') . '.js');
		} else {
			if (version_compare(JVERSION, '3.2.0', 'ge')) {
			    $doc->addScriptVersion(JURI::root(true).'/media/syw/js/carousel/jquery.ba-throttle-debounce.min.js', null, "text/javascript", $defer, $async);
			} else {
			    $doc->addScript(JURI::root(true).'/media/syw/js/carousel/jquery.ba-throttle-debounce.min.js', "text/javascript", $defer, $async);
			}
		}

		self::$jqcthrottleLoaded = true;
	}

	/**
	 * jquery.touchSwipe
	 * v1.6.18
	 */
	static function loadCarousel_touch($defer = false, $async = false, $remote = false)
	{
		if (self::$jqctouchLoaded) {
			return;
		}

		$doc = JFactory::getDocument();

		if ($remote) {
			$doc->addScript('https://cdnjs.cloudflare.com/ajax/libs/jquery.touchswipe/1.6.18/jquery.touchSwipe' . ((JDEBUG) ? '' : '.min') . '.js');
		} else {
			if (version_compare(JVERSION, '3.2.0', 'ge')) {
			    $doc->addScriptVersion(JURI::root(true).'/media/syw/js/carousel/jquery.touchSwipe.min.js', null, "text/javascript", $defer, $async);
			} else {
			    $doc->addScript(JURI::root(true).'/media/syw/js/carousel/jquery.touchSwipe.min.js', "text/javascript", $defer, $async);
			}
		}

		self::$jqctouchLoaded = true;
	}

	/**
	 * jquery.mousewheel
	 * v3.0.6
	 */
	static function loadCarousel_mousewheel($defer = false, $async = false, $remote = false)
	{
		if (self::$jqcmousewheelLoaded) {
			return;
		}

		$doc = JFactory::getDocument();

		if (version_compare(JVERSION, '3.2.0', 'ge')) {
		    $doc->addScriptVersion(JURI::root(true).'/media/syw/js/carousel/jquery.mousewheel.min.js', null, "text/javascript", $defer, $async);
		} else {
		    $doc->addScript(JURI::root(true).'/media/syw/js/carousel/jquery.mousewheel.min.js', "text/javascript", $defer, $async);
		}

		self::$jqcmousewheelLoaded = true;
	}

	/**
	 * jquery.transit
	 * v?
	 */
	static function loadCarousel_transit($defer = false, $async = false, $remote = false)
	{
		if (self::$jqctransitLoaded) {
			return;
		}

		$doc = JFactory::getDocument();

		if (version_compare(JVERSION, '3.2.0', 'ge')) {
		    $doc->addScriptVersion(JURI::root(true).'/media/syw/js/carousel/jquery.transit.min.js', null, "text/javascript", $defer, $async);
		} else {
		    $doc->addScript(JURI::root(true).'/media/syw/js/carousel/jquery.transit.min.js', "text/javascript", $defer, $async);
		}

		self::$jqctransitLoaded = true;
	}

	/**
	 * DEPRECATED
	 * add lazyload class when on high resolution devices only
	 * @param string $selector
	 * @param boolean $lazyload
	 * @param string $lazyload_image
	 */
    static function triggerLazysizes($selector = 'img', $lazyload = false, $lazyload_image = '')
	{
		if (in_array($selector, self::$highresLoaded)) {
			return;
		}

		$javascript = array();

		//$javascript[] = 'jQuery(document).ready(function() { ';
		//$javascript[] = 'document.addEventListener("DOMContentLoaded", function() { ';

		$javascript[] = 'document.addEventListener("readystatechange", function(event) { ';
			$javascript[] = 'if (event.target.readyState == "complete") { ';

				$javascript[] = 'var elements = document.querySelectorAll("' . $selector . '[data-src]"); ';

				$javascript[] = 'if (window.devicePixelRatio > 1) { '; // undefined > 1 results in false (IE < 11 do not support the property)

					//$javascript[] = 'elements.forEach(function (el) { ';
					$javascript[] = 'for (var i = 0; i < elements.length; i++) { ';
						$javascript[] = 'el = elements[i]; ';
						$javascript[] = 'if (el.classList) { el.classList.add("lazyload"); } else { el.className += " lazyload" } ';
						if ($lazyload && $lazyload_image) {
							$javascript[] = 'el.setAttribute("src", "' . $lazyload_image . '"); ';
						}
					$javascript[] = '} ';

// 	                $javascript[] = 'jQuery("'.$selector.'[data-src]").each(function() { ';
// 	                    $javascript[] = 'jQuery(this).addClass("lazyload"); ';
// 	                    if ($lazyload && $lazyload_image) {
// 	                		$javascript[] = 'jQuery(this).attr("src", "'.$lazyload_image.'"); ';
// 	            		}
// 	                $javascript[] = '});';
	            $javascript[] = '}';

				if ($lazyload && $lazyload_image) {
					$javascript[] = ' else {';

						//$javascript[] = 'elements.forEach(function (el) { ';
						$javascript[] = 'for (var i = 0; i < elements.length; i++) { ';
							$javascript[] = 'el = elements[i]; ';
							$javascript[] = 'if (el.classList) { el.classList.add("lazyload"); } else { el.className += " lazyload" } ';
							$javascript[] = 'el.setAttribute("data-src", el.getAttribute("src")); ';
							$javascript[] = 'el.setAttribute("src", "' . $lazyload_image . '"); ';
						$javascript[] = '} ';

// 		            	$javascript[] = 'jQuery("'.$selector.'[data-src]").each(function() { ';
// 		                	$javascript[] = 'jQuery(this).addClass("lazyload"); ';
// 		                	$javascript[] = 'jQuery(this).attr("data-src", jQuery(this).attr("src")); ';
// 		                	$javascript[] = 'jQuery(this).attr("src", "'.$lazyload_image.'"); ';
// 		            	$javascript[] = '});';

					$javascript[] = '}';
				}

			$javascript[] = '} ';
		$javascript[] = '}); ';

		JFactory::getDocument()->addScriptDeclaration(implode($javascript));

		self::$highresLoaded[] = $selector;
	}

	/**
	 * Load the comparison version function if needed
	 */
	static function loadCompareVersions()
	{
		if (self::$compareLoaded) {
			return;
		}

		$doc = JFactory::getDocument();

		// returns false if version e > t (version is 1.3.2 for example)
		$compareScript = 'function SYWCompareVersions(e,t){var r=!1;if(e==t)return!0;"object"!=typeof e&&(e=e.toString().split(".")),"object"!=typeof t&&(t=t.toString().split("."));for(var o=0;o<Math.max(e.length,t.length);o++){if(void 0==e[o]&&(e[o]=0),void 0==t[o]&&(t[o]=0),Number(e[o])<Number(t[o])){r=!0;break}if(e[o]!=t[o])break}return r};';

		$doc->addScriptDeclaration($compareScript);

		self::$compareLoaded = true;
	}

	/**
	 * Compress inline JS
	 * @param string $inlineJS
	 * @return string
	 */
	static function compress($inlineJS = '', $remove_comments = false)
	{
		if ($remove_comments) {
			$inlineJS = preg_replace('!\/\*[\s\S]*?\*\/|\/\/.*!', '', $inlineJS);
		}

		return str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $inlineJS);
	}

}
?>
