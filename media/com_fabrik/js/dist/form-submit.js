<<<<<<< HEAD
/**
 * Form Submitter: delays form submission until all elements report that they
 * are ready for submission
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true */

var FbFormSubmit = new Class({

	/**
	 * Hash of elements js objects
	 */
	elements: $H({}),

	running: false,

	/**
	 * Object of key = this.elements key, value = null|true|false.
	 * Null - no result from onsubmit callback (in a waiting state)
	 * False - callback has returned false - should prevent the form from submitting
	 * True - callback has returned true, once all element callbacks return true the main callback is fired
	 */
	results: {},

	/**
	 * Add form element to the broker
	 *
	 * @param   string   key     Element key
	 * @param   element  Object  Element object
	 *
	 * @return  void
	 */
	addElement: function (key, element) {
		this.elements[key] = element;
	},

	/**
	 * Is the broker already running
	 *
	 * @return  bool
	 */
	enabled: function () {
		return this.running;
	},

	/**
	 * Called from form.js.
	 *
	 * @param   function  cb  Callback - fired once all elements have completed
	 *                        their own onsubmit callbacks and return true
	 *
	 * @return  void
	 */
	submit: function (cb) {
		this.running = true;
		this.elements.each(function (element, key) {
			this.results[key] = null;
			element.onsubmit(function (res) {
				this.results[key] = res;
			}.bind(this));
		}.bind(this));
		this.checker = this.check.periodical(500, this, [cb]);
	},

	/**
	 * Periodical checker on the element callback state (stored in this.results)
	 *
	 * @param   function  cb  Main submit() callback
	 *
	 * @return  void
	 */
	check: function (cb) {
		var values = Object.values(this.results);
		var allPassed = values.every(function (res) {
			return res === true;
		});
		if (allPassed) {
			clearInterval(this.checker);
			this.running = false;
			cb();
		}
		if (values.contains(false)) {
			this.running = false;
			clearInterval(this.checker);
		}

	}
});
=======
/*! Fabrik */

var FbFormSubmit=new Class({elements:$H({}),running:!1,results:{},addElement:function(n,t){this.elements[n]=t},enabled:function(){return this.running},submit:function(n){this.running=!0,this.elements.each(function(n,t){this.results[t]=null,n.onsubmit(function(n){this.results[t]=n}.bind(this))}.bind(this)),this.checker=this.check.periodical(500,this,[n])},check:function(n){var t=Object.values(this.results);t.every(function(n){return!0===n})&&(clearInterval(this.checker),this.running=!1,n()),t.contains(!1)&&(this.running=!1,clearInterval(this.checker))}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
