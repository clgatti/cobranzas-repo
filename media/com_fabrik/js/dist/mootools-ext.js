<<<<<<< HEAD
/**
 * Mootools extensions
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

function CloneObject(what, recursive, asreference) {
	if (typeOf(what) !== 'object') {
		return what;
	}
	var h = $H(what);
	h.each(function (v, k) {
		if (typeOf(v) === 'object' && recursive === true && !asreference.contains(k)) {
			this[k] = new CloneObject(v, recursive, asreference);
		} else {
			this[k] = v;
		}
	}.bind(this));
	return this;
}

/**
 * Array.mfrom is needed to work round an issue with FusionCharts Pro, that overrides Array.from, in a way that
 * breaks Mootools.  So we need to deploy a hacked version of Mootools for sites that need FC Pro, and use Array.mfrom()
 * instead of Array.from()
 */
var slice = Array.prototype.slice;

Array.mfrom = function(item){
	if (item == null) return [];
	return (Type.isEnumerable(item) && typeof item != 'string') ? (typeOf(item) == 'array') ? item : slice.call(item) : [item];
};

String.implement({

	toObject: function ()
	{
		var o = {};
		this.split('&').each(function (pair) {
			var b = pair.split('=');
			o[b[0]] = b[1];
		});
		return o;
	}
});

var mHide = Element.prototype.hide;
var mShow = Element.prototype.show;
var mSlide = Element.prototype.slide;

Element.implement({

	findClassUp: function (classname) {
		if (this.hasClass(classname)) {
			return this;
		}
		var el = document.id(this);
		while (el && !el.hasClass(classname)) {
			if (typeOf(el.getParent()) !== 'element') {
				return false;
			}
			el = el.getParent();
		}
		return el;
	},

	up: function (index) {
		index = index ? index : 0;
		var el = this;
		for (var i = 0; i <= index; i ++) {
			el = el.getParent();
		}
		return el;
	},

	within: function (p) {
		var parenttest = this;
		while (parenttest.parentNode !== null) {
			if (parenttest === p) {
				return true;
			}
			parenttest = parenttest.parentNode;
		}
		return false;
	},

	cloneWithIds: function (c) {
		return this.clone(c, true);
	},

	down: function (expression, index) {
		var descendants = this.getChildren();
		if (arguments.length === 0) {
			return descendants[0];
		}
		return descendants[index];
	},

	findUp: function (tag) {
		if (this.get('tag') === tag) {
			return this;
		}
		var el = this;
		while (el && el.get('tag') !== tag) {
			el = el.getParent();
		}
		return el;
	},

	//x, y = mouse location
	mouseInside: function (x, y) {
		var coords = this.getCoordinates();
		var elLeft = coords.left;
		var elRight = coords.left + coords.width;
		var elTop = coords.top;
		var elBottom = coords.bottom;
		if (x >= elLeft && x <= elRight) {
			if (y >= elTop && y <= elBottom) {
				return true;
			}
		}
		return false;
	},

	getValue: function () {
		return this.get('value');
	},

	/*
	 * These are needed to get some of the JQuery bootstrap built in effects working,
	 * like the carousel, and require you to add the 'mootools-noconflict' class to
	 * containers you want to use those effect with, like ...
	 * <div class="carousel slide mootools-noconflict'>
	 */

	hide: function () {
		if (Fabrik.bootstrapVersion('modal') >= 3) {
			return;
		}
		if (this.hasClass('mootools-noconflict')) {
			return this;
		}
		mHide.apply(this, arguments);
	},

	show: function (v) {
		if (this.hasClass('mootools-noconflict')) {
			return this;
		}
		mShow.apply(this, v);
	},

	slide: function (v) {
		if (this.hasClass('mootools-noconflict')) {
			return this;
		}
		mSlide.apply(this, v);
	}
});

/**
 * Misc. functions, nothing to do with Mootools ... we just needed
 * some common js include to put them in!
 */

/*
function fconsole(thing) {
	if (typeof(window.console) !== "undefined") {
		console.log(thing);
	}
}
*/
=======
/*! Fabrik */

function CloneObject(t,n,i){return"object"!==typeOf(t)?t:($H(t).each(function(t,e){"object"!==typeOf(t)||!0!==n||i.contains(e)?this[e]=t:this[e]=new CloneObject(t,n,i)}.bind(this)),this)}var slice=Array.prototype.slice;Array.mfrom=function(t){return null==t?[]:Type.isEnumerable(t)&&"string"!=typeof t?"array"==typeOf(t)?t:slice.call(t):[t]},String.implement({toObject:function(){var n={};return this.split("&").each(function(t){var e=t.split("=");n[e[0]]=e[1]}),n}});var mHide=Element.prototype.hide,mShow=Element.prototype.show,mSlide=Element.prototype.slide;Element.implement({findClassUp:function(t){if(this.hasClass(t))return this;for(var e=document.id(this);e&&!e.hasClass(t);){if("element"!==typeOf(e.getParent()))return!1;e=e.getParent()}return e},up:function(t){t=t||0;for(var e=this,n=0;n<=t;n++)e=e.getParent();return e},within:function(t){for(var e=this;null!==e.parentNode;){if(e===t)return!0;e=e.parentNode}return!1},cloneWithIds:function(t){return this.clone(t,!0)},down:function(t,e){var n=this.getChildren();return 0===arguments.length?n[0]:n[e]},findUp:function(t){if(this.get("tag")===t)return this;for(var e=this;e&&e.get("tag")!==t;)e=e.getParent();return e},mouseInside:function(t,e){var n=this.getCoordinates(),i=n.left,o=n.left+n.width,r=n.top,s=n.bottom;return i<=t&&t<=o&&r<=e&&e<=s},getValue:function(){return this.get("value")},hide:function(){if(!(3<=Fabrik.bootstrapVersion("modal")))return this.hasClass("mootools-noconflict")?this:void mHide.apply(this,arguments)},show:function(t){if(this.hasClass("mootools-noconflict"))return this;mShow.apply(this,t)},slide:function(t){if(this.hasClass("mootools-noconflict"))return this;mSlide.apply(this,t)}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
