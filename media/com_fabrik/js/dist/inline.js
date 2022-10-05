<<<<<<< HEAD
/**
 * Simple Inline Editor
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/**
 * simple inline editor, double click nodes which match the selector to toggle to a field
 * esc to revert
 * enter to save
 *
 */
var inline = new Class({

	Implements: Options,

	options: {

	},

	initialize: function (selector, options)
	{
		this.setOptions(options);
		document.addEvent('dblclick:relay(' + selector + ')', function (e, target) {
			var editor;
			target.hide();
			target.store('origValue', target.get('text'));
			if (!target.retrieve('inline')) {
				editor = new Element('input');
				editor.addEvent('keydown', function (e) {
					this.checkKey(e, target);
				}.bind(this));
				editor.inject(target, 'after').focus();
				editor.hide();
				target.store('inline', editor);
			} else {
				editor = target.retrieve('inline');
			}
			editor.set('value', target.get('text')).toggle().focus();
			editor.select();
		}.bind(this));
	},

	checkKey: function (e, target) {
		if (e.key === 'enter' || e.key === 'esc' || e.key === 'tab') {
			target.retrieve('inline').hide();
			target.show();
		}
		if (e.key === 'enter' || e.key === 'tab') {
			target.set('text', e.target.get('value'));
			Fabrik.fireEvent('fabrik.inline.save', [target, e]);
		}
	}
});
=======
/*! Fabrik */

var inline=new Class({Implements:Options,options:{},initialize:function(e,t){this.setOptions(t),document.addEvent("dblclick:relay("+e+")",function(e,t){var i;t.hide(),t.store("origValue",t.get("text")),t.retrieve("inline")?i=t.retrieve("inline"):((i=new Element("input")).addEvent("keydown",function(e){this.checkKey(e,t)}.bind(this)),i.inject(t,"after").focus(),i.hide(),t.store("inline",i)),i.set("value",t.get("text")).toggle().focus(),i.select()}.bind(this))},checkKey:function(e,t){"enter"!==e.key&&"esc"!==e.key&&"tab"!==e.key||(t.retrieve("inline").hide(),t.show()),"enter"!==e.key&&"tab"!==e.key||(t.set("text",e.target.get("value")),Fabrik.fireEvent("fabrik.inline.save",[t,e]))}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
