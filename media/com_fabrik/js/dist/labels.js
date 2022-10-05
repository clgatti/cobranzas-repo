<<<<<<< HEAD
/**
 * Labels
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true,head:true */

var Labels = new Class({

	Implements: [Events],

	initialize: function () {
		$$('.fabrikElementContainer').each(function (c) {
			var label = c.getElement('label');
			if (typeOf(label) !== 'null') {
				var input = c.getElement('input');
				if (typeOf(input) === 'null') {
					input = c.getElement('textarea');
				}
				if (typeOf(input) !== 'null') {
					input.value = label.innerHTML;

					input.addEvent('click', function (e) {
						this.toogleLabel(e, input, label.innerHTML);
					}.bind(this));

					input.addEvent('blur', function (e) {
						this.toogleLabel(e, input, label.innerHTML);
					}.bind(this));
					label.set('html', '');
					c.getElement('.fabrikLabel').dispose();
				}
			}
		}.bind(this));
	},

	toogleLabel: function (e, input, label) {
		new Event(e).stop();
		if (e.type === 'click') {
			if (input.get('value') === label) {
				input.value = '';
			}
		} else {
			if (input.get('value') === '') {
				input.value = label;
			}
		}
	}

});

window.addEvent('fabrik.loaded', function () {
	new Labels();
});
=======
/*! Fabrik */

var Labels=new Class({Implements:[Events],initialize:function(){$$(".fabrikElementContainer").each(function(e){var n=e.getElement("label");if("null"!==typeOf(n)){var t=e.getElement("input");"null"===typeOf(t)&&(t=e.getElement("textarea")),"null"!==typeOf(t)&&(t.value=n.innerHTML,t.addEvent("click",function(e){this.toogleLabel(e,t,n.innerHTML)}.bind(this)),t.addEvent("blur",function(e){this.toogleLabel(e,t,n.innerHTML)}.bind(this)),n.set("html",""),e.getElement(".fabrikLabel").dispose())}}.bind(this))},toogleLabel:function(e,n,t){new Event(e).stop(),"click"===e.type?n.get("value")===t&&(n.value=""):""===n.get("value")&&(n.value=t)}});window.addEvent("fabrik.loaded",function(){new Labels});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
