<<<<<<< HEAD
/**
 * Icon Generator
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true,ART:true */

var IconGenerator = new Class({
	
	Implements: [Options],
	
	options: {
		size: {width: 32, height: 32},
		rotate: 0,
		scale: 1,
		fill: {
			color: ['#C92804', '#9E1E04']
		},
		translate: {x: 0, y: 0}
	},
	
	/*
	 * can add:
	 * 
		shadow: {
			color: '#fff',
			translate: {x: 0, y: 1}
		},
	 */

	initialize: function (options) {
		this.setOptions(options);
	},
	
	create: function (icon, options) {
		var iconShadow;
		if (typeOf(options) !== 'object') {
			options = {};
		}
		var opts = Object.clone(this.options);
		Object.append(opts, options);

		var art = new ART(opts.size.width * opts.scale, opts.size.height * opts.scale);
		var group = new ART.Group();

		// Cache the path
		var iconPath = new ART.Path(icon);

		// Create the white shadow
		if (opts.shadow) {
			iconShadow = new ART.Shape(iconPath);
			iconShadow.scale(opts.scale, opts.scale);
			iconShadow.fill(opts.shadow.color);
			iconShadow.translate(opts.shadow.translate.x, opts.shadow.translate.y);
		}
		// Create an icon with the gradient
		icon = new ART.Shape(iconPath);
		
		icon.scale(opts.scale, opts.scale);
	 
		icon.fill(opts.fill.color[0], opts.fill.color[1]);
		
		// Test stroke (border)
		if (options.stroke) {
			icon.stroke(options.stroke.color, options.stroke.width);
		}
		icon.translate(opts.translate.x, opts.translate.y);
		if (opts.shadow) {
			group.grab(iconShadow, icon);
		} else {
			group.grab(icon);
		}
		
		group.rotate(opts.rotate, 16 * opts.scale, 16 * opts.scale);
		
		group.inject(art);
		return art;
	}
});
=======
/*! Fabrik */

var IconGenerator=new Class({Implements:[Options],options:{size:{width:32,height:32},rotate:0,scale:1,fill:{color:["#C92804","#9E1E04"]},translate:{x:0,y:0}},initialize:function(e){this.setOptions(e)},create:function(e,t){var a;"object"!==typeOf(t)&&(t={});var s=Object.clone(this.options);Object.append(s,t);var l=new ART(s.size.width*s.scale,s.size.height*s.scale),o=new ART.Group,r=new ART.Path(e);return s.shadow&&((a=new ART.Shape(r)).scale(s.scale,s.scale),a.fill(s.shadow.color),a.translate(s.shadow.translate.x,s.shadow.translate.y)),(e=new ART.Shape(r)).scale(s.scale,s.scale),e.fill(s.fill.color[0],s.fill.color[1]),t.stroke&&e.stroke(t.stroke.color,t.stroke.width),e.translate(s.translate.x,s.translate.y),s.shadow?o.grab(a,e):o.grab(e),o.rotate(s.rotate,16*s.scale,16*s.scale),o.inject(l),l}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
