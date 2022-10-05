<<<<<<< HEAD
/**
 * Canvas
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

var Canvas = new Class({

	Implements : [ Options ],

	options : {
		tabs : [ 'page1' ],
		tabelement : '',
		pagecontainer : 'packagepages',
		editable: false
	},

	initialize: function (opts) {
		this.setOptions(opts);
		Fabrik.addEvent('fabrik.page.insert', function (e) {
			this.insertPage(e);
		}.bind(this));
		this.iconGen = new IconGenerator({scale: 0.5});
		this.pages = new Pages(this.options.pagecontainer, this.options.editable);
		this.tabs = new Tabs(this.options.tabelement, this.options.tabs, this.options.editable);
	},
	
	setup: function () {
		this.pages.fromJSON(this.options.layout);
	},
	
	setDrags: function () {
		document.id('typeList').getElements('li').each(function (li) {
			li.addEvent('mousedown', function (e) {
				var clone = li.clone().setStyles(li.getCoordinates()) // this returns an
				// object with
				// left/top/bottom/right, so its perfect

				.store('type', li.retrieve('type')).setStyles({
					'opacity' : 0.7,
					'position' : 'absolute'
				}).addEvent('emptydrop', function () {
					li.dispose();
				}).inject(document.body);

				var drag = clone.makeDraggable({
					droppables : this.drops,

					onComplete : function () {
						this.detach();
					},
					onEnter : function (el, over) {
						over.tween('background-color', '#98B5C1');
					},
					onLeave : function (el, over) {
						over.tween('background-color', '#fff');
					},
					onDrop : function (el, over) {

						if (over) {
							
							// do something ...
							this.insertLocation = el.getCoordinates(over);
							this.openListWindow(el.retrieve('type'));
							over.tween('background-color', '#fff');
						}
						clone.dispose();
					}.bind(this)

				}); // this returns the dragged element

				drag.start(e); // start the event manual
			}.bind(this));
		}.bind(this));
	},
	
	setDrops: function (e) {
		this.options.tabs = this.tabs.tabs.getKeys();
		this.drops = this.pages.getHTMLPages();
	}
});
=======
/*! Fabrik */

var Canvas=new Class({Implements:[Options],options:{tabs:["page1"],tabelement:"",pagecontainer:"packagepages",editable:!1},initialize:function(t){this.setOptions(t),Fabrik.addEvent("fabrik.page.insert",function(t){this.insertPage(t)}.bind(this)),this.iconGen=new IconGenerator({scale:.5}),this.pages=new Pages(this.options.pagecontainer,this.options.editable),this.tabs=new Tabs(this.options.tabelement,this.options.tabs,this.options.editable)},setup:function(){this.pages.fromJSON(this.options.layout)},setDrags:function(){document.id("typeList").getElements("li").each(function(e){e.addEvent("mousedown",function(t){var n=e.clone().setStyles(e.getCoordinates()).store("type",e.retrieve("type")).setStyles({opacity:.7,position:"absolute"}).addEvent("emptydrop",function(){e.dispose()}).inject(document.body);n.makeDraggable({droppables:this.drops,onComplete:function(){this.detach()},onEnter:function(t,e){e.tween("background-color","#98B5C1")},onLeave:function(t,e){e.tween("background-color","#fff")},onDrop:function(t,e){e&&(this.insertLocation=t.getCoordinates(e),this.openListWindow(t.retrieve("type")),e.tween("background-color","#fff")),n.dispose()}.bind(this)}).start(t)}.bind(this))}.bind(this))},setDrops:function(t){this.options.tabs=this.tabs.tabs.getKeys(),this.drops=this.pages.getHTMLPages()}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
