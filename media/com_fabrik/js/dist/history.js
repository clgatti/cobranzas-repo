<<<<<<< HEAD
/**
 * History
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true */

var History = new Class({
	initialize: function (undobutton, redobutton) {
		this.recording = true;
		this.pointer = -1;
		if (document.id(undobutton)) {
			document.id(undobutton).addEvent('click', function (e) {
				this.undo(e);
			}.bind(this));
		}
		if (document.id(redobutton)) {
			document.id(redobutton).addEvent('click', function (e) {
				this.redo(e);
			}.bind(this));
		}
		Fabrik.addEvent('fabrik.history.on', function (e) {
			this.on(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.history.off', function (e) {
			this.off(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.history.add', function (e) {
			this.add(e);
		}.bind(this));
		this.history = [];
	},

	undo : function () {
		if (this.pointer > -1) {
			this.off();
			var h = this.history[this.pointer];
			var f = h.undofunc;
			var p = h.undoparams;
			var res = f.attempt(p, h.object);
			this.on();
			this.pointer --;
		}

	},

	redo : function () {
		if (this.pointer < this.history.length - 1) {
			this.pointer ++;
			this.off();
			var h = this.history[this.pointer];
			var f = h.redofunc;
			var p = h.redoparams;
			var res = f.attempt(p, h.object);
			this.on();
		}
	},

	add : function (obj, undofunc, undoparams, redofunc, redoparams) {
		if (this.recording) {
			// remove history which is newer than current pointer location
			var newh = this.history.filter(function (h, x) {
				return x <= this.pointer;
			}.bind(this));
			this.history = newh;
			this.history.push({
				'object' : obj,
				'undofunc' : undofunc,
				'undoparams' : undoparams,
				'redofunc' : redofunc,
				'redoparams' : redoparams
			});
			this.pointer++;
		}
	},

	on : function () {
		this.recording = true;
	},

	off : function () {
		this.recording = false;
	}
});
=======
/*! Fabrik */

var History=new Class({initialize:function(i,t){this.recording=!0,this.pointer=-1,document.id(i)&&document.id(i).addEvent("click",function(i){this.undo(i)}.bind(this)),document.id(t)&&document.id(t).addEvent("click",function(i){this.redo(i)}.bind(this)),Fabrik.addEvent("fabrik.history.on",function(i){this.on(i)}.bind(this)),Fabrik.addEvent("fabrik.history.off",function(i){this.off(i)}.bind(this)),Fabrik.addEvent("fabrik.history.add",function(i){this.add(i)}.bind(this)),this.history=[]},undo:function(){if(-1<this.pointer){this.off();var i=this.history[this.pointer],t=i.undofunc,n=i.undoparams;t.attempt(n,i.object);this.on(),this.pointer--}},redo:function(){if(this.pointer<this.history.length-1){this.pointer++,this.off();var i=this.history[this.pointer],t=i.redofunc,n=i.redoparams;t.attempt(n,i.object);this.on()}},add:function(i,t,n,o,s){if(this.recording){var r=this.history.filter(function(i,t){return t<=this.pointer}.bind(this));this.history=r,this.history.push({object:i,undofunc:t,undoparams:n,redofunc:o,redoparams:s}),this.pointer++}},on:function(){this.recording=!0},off:function(){this.recording=!1}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
