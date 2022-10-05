<<<<<<< HEAD
/**
 * Keynav
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true */

var KeyNav = new Class({
	initialize : function () {
		window.addEvent('keypress', function (e) {
			switch (e.code) {
			case 37: //left
			case 38: //up
			case 39: //right
			case 40: //down
				Fabrik.fireEvent('fabrik.keynav', [e.code, e.shift]);
				e.stop();
				break;
			}
		});
	}
});

var FabrikKeyNav = new KeyNav();
=======
/*! Fabrik */

var KeyNav=new Class({initialize:function(){window.addEvent("keypress",function(e){switch(e.code){case 37:case 38:case 39:case 40:Fabrik.fireEvent("fabrik.keynav",[e.code,e.shift]),e.stop()}})}}),FabrikKeyNav=new KeyNav;
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
