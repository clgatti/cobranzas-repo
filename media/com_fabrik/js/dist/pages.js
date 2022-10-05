<<<<<<< HEAD
/**
 * Pages
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

var Pages = new Class({
	initialize: function (container, editable) {
		this.editable = editable;
		document.addEvent('mousedown', function (e) {
			this.clearActive(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.page.add', function (e) {
			this.makeActive(e);
		}.bind(this));
		this.pages = $H({});
		this.activePage = null;
		this.container = document.id(container);
		Fabrik.addEvent('fabrik.tab.add', function (e) {
			this.add(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.tab.click', function (e) {
			this.show(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.tab.remove', function (e) {
			this.remove(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.keynav', function (e) {
			this.moveItem(e);
		}.bind(this));
		Fabrik.addEvent('fabrik.inline.save', function (e) {
			this.updateTabKey(e);
		}.bind(this));
	},
	
	/* todo perhaps makeActive and clearActive should be a mixin? */
	makeActive: function (c) {
		this.clearActive();
		c.addClass('active');
		this.active = c;
		var zindexes = document.getElements('.itemPlaceHolder').getStyle('z-index').sort();
		var max = zindexes.getLast().toInt() + 1;
		document.getElements('.itemPlaceHolder').each(function (i) {
			i.setStyle('zindex', i.getStyle('z-index').toInt() - 1); 
		});
		c.setStyle('z-index', max);
	},
	
	clearActive: function () {
		delete this.active;
		document.getElements('.itemPlaceHolder').removeClass('active');
	},
	
	moveItem: function (k, shift) {
		if (this.active && this.editable) {
			shift = shift ? 10 : 0;
			var p = this.active.getCoordinates(this.getActivePage().page);
			switch (k) {
			case 37: //left
				this.active.setStyle('left', p.left - 2 - shift);
				break;
			case 38: //up
				this.active.setStyle('top', p.top - 2 - shift);
				break;
			case 39: //right
				this.active.setStyle('left', p.left + 1 + shift);
				break;
			case 40: //down
				this.active.setStyle('top', p.top + 1 + shift);
				break;
			}
		}
	},
	
	add: function (tabs, t) {
		var page = new Page(t, this.editable);
		this.container.adopt(page.page);
		page.show();
		this.pages[t] = page;
		this.show();
	},
	
	remove: function (tabs, t) {
		t = t.retrieve('ref');
		//this.pages[t].remove();
		delete this.pages.t;
		this.pages.erase(t);
	},
	
	show: function (tab) {
		this.pages.each(function (page) {
			page.hide();
		});
		try {
			this.pages[tab].show();
			this.activePage = tab;
		} catch (err) {
			var k = this.pages.getKeys();
			if (k.length > 0) {
				tab = k[0];
				this.pages[tab].show();
				this.activePage = tab;
			}
		}
	},
	
	getHTMLPages: function () {
		var r = [];
		this.pages.each(function (p) {
			r.push(p.page);
		});
		return r;
	},
	
	getActivePage: function () {
		if (!this.activePage) {
			this.activePage = 0;
		}
		return this.pages[this.activePage];
	},
	
	fromJSON: function (layout) {
		$H(layout).each(function (items, page) {
			if (this.pages[page]) {
				$H(items).each(function (item, id) {
					this.pages[page].insert(item.id, item.label, item.type, item.dimensions);
				}.bind(this));
			}
		}.bind(this));
	},
	
	toJSON: function () {
		var r = {};
		this.pages.each(function (p, k) {
			var o = {};
			p.page.getElements('.itemPlaceHolder').each(function (e) {
				p.page.show(); //needed to get coords
				var type = e.id.split('_')[0];
				var label = e.getElement('.handlelabel').get('text');
				o[e.id] = {'dimensions': e.getCoordinates(p.page), 'label': label, 'type': type, 'id': e.id};
			});
			r[k.trim()] = o;
		});
		return r;
	},
	
	/**
	 * called when tab label is changed
	 */
	updateTabKey: function (editor) {
		var origKey = editor.retrieve('origValue').trim();
		var orig = this.pages[origKey];
		this.pages[editor.get('text').trim()] = orig;
		delete this.pages[origKey];
		this.pages.erase(origKey);
	}
});

Page = new Class({
	initialize: function (t, editable) {
		this.editable = editable;
		this.page = new Element('div', {'class': 'page', 'styles': {'display': 'none'}});
		if (this.editable) {
			Fabrik.addEvent('fabrik.item.resized', function (e) {
				this.saveCoords(e);
			}.bind(this));
			Fabrik.addEvent('fabrik.item.moved', function (e) {
				this.saveCoords(e);
			}.bind(this));
		}
	},
	
	show: function () {
		this.page.show();
	},
	
	hide: function () {
		this.page.hide();
	},
	
	remove: function () {
		this.page.destroy();
	},
	
	removeItem: function (e, id) {
		e.stop();
		if (confirm('Do you really want to delete')) {
			document.id(id).destroy();
			Fabrik.fireEvent('fabrik.page.block.delete', [id]);
		}
	},
	
	insert: function (id, label, type, dimensions) {
		Fabrik.fireEvent('fabrik.page.insert', [this, id, label, type, dimensions]);
	},
	
	saveCoords: function (e) {
	}

});
=======
/*! Fabrik */

var Pages=new Class({initialize:function(e,t){this.editable=t,document.addEvent("mousedown",function(e){this.clearActive(e)}.bind(this)),Fabrik.addEvent("fabrik.page.add",function(e){this.makeActive(e)}.bind(this)),this.pages=$H({}),this.activePage=null,this.container=document.id(e),Fabrik.addEvent("fabrik.tab.add",function(e){this.add(e)}.bind(this)),Fabrik.addEvent("fabrik.tab.click",function(e){this.show(e)}.bind(this)),Fabrik.addEvent("fabrik.tab.remove",function(e){this.remove(e)}.bind(this)),Fabrik.addEvent("fabrik.keynav",function(e){this.moveItem(e)}.bind(this)),Fabrik.addEvent("fabrik.inline.save",function(e){this.updateTabKey(e)}.bind(this))},makeActive:function(e){this.clearActive(),e.addClass("active"),this.active=e;var t=document.getElements(".itemPlaceHolder").getStyle("z-index").sort().getLast().toInt()+1;document.getElements(".itemPlaceHolder").each(function(e){e.setStyle("zindex",e.getStyle("z-index").toInt()-1)}),e.setStyle("z-index",t)},clearActive:function(){delete this.active,document.getElements(".itemPlaceHolder").removeClass("active")},moveItem:function(e,t){if(this.active&&this.editable){t=t?10:0;var i=this.active.getCoordinates(this.getActivePage().page);switch(e){case 37:this.active.setStyle("left",i.left-2-t);break;case 38:this.active.setStyle("top",i.top-2-t);break;case 39:this.active.setStyle("left",i.left+1+t);break;case 40:this.active.setStyle("top",i.top+1+t)}}},add:function(e,t){var i=new Page(t,this.editable);this.container.adopt(i.page),i.show(),this.pages[t]=i,this.show()},remove:function(e,t){t=t.retrieve("ref"),delete this.pages.t,this.pages.erase(t)},show:function(t){this.pages.each(function(e){e.hide()});try{this.pages[t].show(),this.activePage=t}catch(e){var i=this.pages.getKeys();0<i.length&&(t=i[0],this.pages[t].show(),this.activePage=t)}},getHTMLPages:function(){var t=[];return this.pages.each(function(e){t.push(e.page)}),t},getActivePage:function(){return this.activePage||(this.activePage=0),this.pages[this.activePage]},fromJSON:function(e){$H(e).each(function(e,i){this.pages[i]&&$H(e).each(function(e,t){this.pages[i].insert(e.id,e.label,e.type,e.dimensions)}.bind(this))}.bind(this))},toJSON:function(){var t={};return this.pages.each(function(a,e){var s={};a.page.getElements(".itemPlaceHolder").each(function(e){a.page.show();var t=e.id.split("_")[0],i=e.getElement(".handlelabel").get("text");s[e.id]={dimensions:e.getCoordinates(a.page),label:i,type:t,id:e.id}}),t[e.trim()]=s}),t},updateTabKey:function(e){var t=e.retrieve("origValue").trim(),i=this.pages[t];this.pages[e.get("text").trim()]=i,delete this.pages[t],this.pages.erase(t)}});Page=new Class({initialize:function(e,t){this.editable=t,this.page=new Element("div",{class:"page",styles:{display:"none"}}),this.editable&&(Fabrik.addEvent("fabrik.item.resized",function(e){this.saveCoords(e)}.bind(this)),Fabrik.addEvent("fabrik.item.moved",function(e){this.saveCoords(e)}.bind(this)))},show:function(){this.page.show()},hide:function(){this.page.hide()},remove:function(){this.page.destroy()},removeItem:function(e,t){e.stop(),confirm("Do you really want to delete")&&(document.id(t).destroy(),Fabrik.fireEvent("fabrik.page.block.delete",[t]))},insert:function(e,t,i,a){Fabrik.fireEvent("fabrik.page.insert",[this,e,t,i,a])},saveCoords:function(e){}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
