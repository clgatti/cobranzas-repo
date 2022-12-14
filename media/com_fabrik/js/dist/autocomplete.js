<<<<<<< HEAD
/**
 * Auto-Complete
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true */

var FbAutocomplete = new Class({

	Implements: [Options, Events],

	options: {
		menuclass: 'auto-complete-container',
		classes: {
			'ul': 'results',
			'li': 'result'
		},
		url: 'index.php',
		max: 10,
		onSelection: Class.empty,
		autoLoadSingleResult: true,
		minTriggerChars: 1,
		storeMatchedResultsOnly: false // Only store a value if selected from picklist
	},

	initialize: function (element, options) {
		this.matchedResult = false;
		this.setOptions(options);
		element = element.replace('-auto-complete', '');
		this.options.labelelement = typeOf(document.id(element + '-auto-complete')) === "null" ? document.getElement(element + '-auto-complete') : document.id(element + '-auto-complete');
		this.cache = {};
		this.selected = -1;
		this.mouseinsde = false;
		document.addEvent('keydown', function (e) {
			this.doWatchKeys(e);
		}.bind(this));
		this.element = typeOf(document.id(element)) === "null" ? document.getElement(element) : document.id(element);
		this.buildMenu();
		if (!this.getInputElement()) {
			fconsole('autocomplete didn\'t find input element');
			return;
		}
		this.getInputElement().setProperty('autocomplete', 'off');
		this.getInputElement().addEvent('keyup', function (e) {
			this.search(e);
		}.bind(this));

		this.getInputElement().addEvent('blur', function (e) {
			if (this.options.storeMatchedResultsOnly) {
				if (!this.matchedResult) {
					if (typeof(this.data) === 'undefined' || !(this.data.length === 1 && this.options.autoLoadSingleResult)) {
						this.element.value = '';
					}
				}
			}
		}.bind(this));
	},
	
	/**
	 * Should the auto-complete start its ajax search
	 * @param   e  Event
	 * @return  bool
	 */
	canSearch: function (e) {
		if (!this.isMinTriggerlength()) {
			return false;
		}
		if (e.key === 'tab' || e.key === 'enter') {
			e.stop();
			this.closeMenu();
			return false;
		}
		return true;
	},
	
	/**
	 * Get the input text element's value and if empty set this.element.value to empty
	 * 
	 * @return  string  input element text
	 */
	defineSearchValue: function () {
		var v = this.getInputElement().get('value');
		if (v === '') {
			this.element.value = '';
		}
		return v;
	},

	search: function (e) {
		if (!this.canSearch(e)) {
			return;
		}
		this.matchedResult = false;
		var v = this.getInputElement().get('value');
		if (v === '') {
			this.element.value = '';
		}
		if (v !== this.searchText && v !== '') {
			if (this.options.storeMatchedResultsOnly === false) {
				this.element.value = v;
			}
			this.positionMenu();
			if (this.cache[v]) {
				this.populateMenu(this.cache[v]);
				this.openMenu();
			} else {
				if (this.ajax) {
					this.closeMenu();
					this.ajax.cancel();
				}
				
				var data = {value: v};
				this.ajax = this.makeAjax(this.options.url, data);
			}
		}
		this.searchText = v;
	},
	
	/**
	 * Build the ajax Request object and send it.
	 */
	makeAjax: function (url, data) {
		return new Request({
			url: url,
			data: data,
			onRequest: function () {
				Fabrik.loader.start(this.getInputElement());
			}.bind(this),
			onCancel: function () {
				Fabrik.loader.stop(this.getInputElement());
				//this.ajax = null;
			}.bind(this),
			onSuccess: function (e) {
				this.completeAjax(e, data.value);
			}.bind(this),
			onComplete: function () {
				Fabrik.loader.stop(this.getInputElement());
			}.bind(this),
			onFailure: function () {
				Fabrik.loader.stop(this.getInputElement());
			}.bind(this),
			onException: function () {
				Fabrik.loader.stop(this.getInputElement());
			}.bind(this)
		}).send();
	},

	completeAjax: function (r, v) {
		Fabrik.loader.stop(this.getInputElement());
		r = JSON.parse(r);
		this.cache[v] = r;
		this.populateMenu(r);
		this.openMenu();
	},

	buildMenu: function ()
	{
		this.menu = new Element('div', {'class': this.options.menuclass, 'styles': {'position': 'absolute'}}).adopt(new Element('ul', {'class': this.options.classes.ul}));
		this.menu.inject(document.body);
		this.menu.addEvent('mouseenter', function () {
			this.mouseinsde = true;
		}.bind(this));
		this.menu.addEvent('mouseleave', function () {
			this.mouseinsde = false;
		}.bind(this));
	},

	getInputElement: function () {
		return this.options.labelelement ? this.options.labelelement : this.element;
	},

	positionMenu: function () {
		var coords = this.getInputElement().getCoordinates();
		var pos = this.getInputElement().getPosition();
		this.menu.setStyles({ 'left': coords.left, 'top': (coords.top + coords.height) - 1, 'width': coords.width});
	},

	populateMenu: function (data) {
		// $$$ hugh - added decoding of things like &amp; in the text strings
		data.map(function (item, index) {
			item.text = Encoder.htmlDecode(item.text);
			return item;
		});
		this.data = data;
		var max = this.getListMax();
		var ul = this.menu.getElement('ul');
		ul.empty();
		if (data.length === 1 && this.options.autoLoadSingleResult) {
			this.matchedResult = true;
			this.element.value = data[0].value;
			this.fireEvent('selection', [this, this.element.value]);
		}
		for (var i = 0; i < max; i ++) {
			var pair = data[i];
			var li = new Element('li', {'data-value': pair.value, 'class': 'unselected ' + this.options.classes.li}).set('text', pair.text);
			li.inject(ul);
			li.addEvent('click', function (e) {
				e.stop();
				this.makeSelection(e.target);
			}.bind(this));
		}
		if (data.length > this.options.max) {
			new Element('li').set('text', '....').inject(ul);
		}
	},

	makeSelection: function (li) {
		// $$$ tom - make sure an item was selected before operating on it.
		if (typeOf(li) !== 'null') {
			this.getInputElement().value = li.get('text');
			this.element.value = li.getProperty('data-value');

			this.matchedResult = true;
			this.closeMenu();
			this.fireEvent('selection', [this, this.element.value]);
			// $$$ hugh - need to fire change event, in case it's something like a join element
			// with a CDD that watches it.
			this.element.fireEvent('change', new Event.Mock(this.element, 'change'), 700);
			// $$$ hugh - fire a Fabrik event, just for good luck.  :)
			Fabrik.fireEvent('fabrik.autocomplete.selected', [this, this.element.value]);
		} else {
			//  $$$ tom - fire a notselected event to let developer take appropriate actions.
            Fabrik.fireEvent('fabrik.autocomplete.notselected', [this, this.element.value]);
		}
	},

	closeMenu: function () {
		if (this.shown) {
			this.shown = false;
			this.menu.fade('out');
			this.selected = -1;
			document.removeEvent('click', function (e) {
				this.doTestMenuClose(e);
			}.bind(this));
		}
	},

	openMenu: function () {
		if (!this.shown) {
			if (this.isMinTriggerlength()) {
				this.shown = true;
				this.menu.setStyle('visibility', 'visible').fade('in');
				document.addEvent('click', function (e) {
					this.doTestMenuClose(e);
				}.bind(this));
				this.selected = 0;
				this.highlight();
			}
		}
	},

	doTestMenuClose: function () {
		if (!this.mouseinsde) {
			this.closeMenu();
		}
	},

	isMinTriggerlength: function () {
		var v = this.getInputElement().get('value');
		return v.length >= this.options.minTriggerChars;
	},
	
	getListMax: function () {
		if (typeOf(this.data) === 'null') {
			return 0;
		}
		return this.data.length > this.options.max ? this.options.max : this.data.length;
	},

	/**
	 * Observe the keydown event on the input field. Should stop the loader as we have a new search query
	 */
	doWatchKeys: function (e) {
		if (document.activeElement !== this.getInputElement()) {
			return;
		}
		Fabrik.loader.stop(this.getInputElement());
		var max = this.getListMax();
		if (!this.shown) {
			if (e.code.toInt() === 13) {
				e.stop();
			}
			if (e.code.toInt() === 40) {
				this.openMenu();
			}
		} else {
			if (!this.isMinTriggerlength()) {
				e.stop();
				this.closeMenu();
			}
			else {
				if (e.key === 'enter' || e.key === 'tab') {
					window.fireEvent('blur');
				}
				switch (e.code) {
				case 40://down
					if (!this.shown) {
						this.openMenu();
					}
					if (this.selected + 1 < max) {
						this.selected ++;
						this.highlight();
					}
					e.stop();
					break;
				case 38: //up
					if (this.selected - 1 >= -1) {
						this.selected --;
						this.highlight();
					}
					e.stop();
					break;
				case 13://enter
				case 9://tab
					e.stop();
					var selectEvnt = new Event.Mock(this.getSelected(), 'click');
					this.makeSelection(selectEvnt);
					break;
				case 27://escape
					e.stop();
					this.matchedResult = false;
					this.closeMenu();
					break;
				}
			}
		}
	},

	getSelected: function () {
		var a = this.menu.getElements('li').filter(function (li, i) {
			return i === this.selected;
		}.bind(this));
		return a[0];
	},

	highlight: function () {
		this.matchedResult = true;
		this.menu.getElements('li').each(function (li, i) {
			if (i === this.selected) {
				li.addClass('selected');
			} else {
				li.removeClass('selected');
			}
		}.bind(this));
	}

});

var FabCddAutocomplete = new Class({

	Extends: FbAutocomplete,

	search: function (e) {
		if (!this.canSearch(e)) {
			return;
		}
		var key,
		v = this.defineSearchValue();
		if (v !== this.searchText && v !== '') {
			var observer = document.id(this.options.observerid);
			if (typeOf(observer) !== 'null') {
				key = observer.get('value') + '.' + v;
			} else {
				this.parent(e);
				return;
			}
			this.positionMenu();
			if (this.cache[key]) {
				this.populateMenu(this.cache[key]);
				this.openMenu();
			} else {
				if (this.ajax) {
					this.closeMenu();
					this.ajax.cancel();
				}

				// If you are observing a radio list then you need to get the Element js plugin value
				var obsValue = document.id(this.options.observerid).get('value');
				if (typeOf(obsValue) === 'null') {
					obsValue = Fabrik.getBlock(this.options.formRef).elements.get(this.options.observerid).get('value');
				}
				var data = {value: v, fabrik_cascade_ajax_update: 1, v: obsValue};
				this.ajax = this.makeAjax(this.options.url, data);
			}
		}
		this.searchText = v;
	}
});
=======
/*! Fabrik */

var FbAutocomplete=new Class({Implements:[Options,Events],options:{menuclass:"auto-complete-container",classes:{ul:"results",li:"result"},url:"index.php",max:10,onSelection:Class.empty,autoLoadSingleResult:!0,minTriggerChars:1,storeMatchedResultsOnly:!1},initialize:function(e,t){this.matchedResult=!1,this.setOptions(t),e=e.replace("-auto-complete",""),this.options.labelelement="null"===typeOf(document.id(e+"-auto-complete"))?document.getElement(e+"-auto-complete"):document.id(e+"-auto-complete"),this.cache={},this.selected=-1,this.mouseinsde=!1,document.addEvent("keydown",function(e){this.doWatchKeys(e)}.bind(this)),this.element="null"===typeOf(document.id(e))?document.getElement(e):document.id(e),this.buildMenu(),this.getInputElement()?(this.getInputElement().setProperty("autocomplete","off"),this.getInputElement().addEvent("keyup",function(e){this.search(e)}.bind(this)),this.getInputElement().addEvent("blur",function(e){this.options.storeMatchedResultsOnly&&(this.matchedResult||void 0!==this.data&&1===this.data.length&&this.options.autoLoadSingleResult||(this.element.value=""))}.bind(this))):fconsole("autocomplete didn't find input element")},canSearch:function(e){return!!this.isMinTriggerlength()&&("tab"!==e.key&&"enter"!==e.key||(e.stop(),this.closeMenu(),!1))},defineSearchValue:function(){var e=this.getInputElement().get("value");return""===e&&(this.element.value=""),e},search:function(e){if(this.canSearch(e)){this.matchedResult=!1;var t=this.getInputElement().get("value");if(""===t&&(this.element.value=""),t!==this.searchText&&""!==t)if(!1===this.options.storeMatchedResultsOnly&&(this.element.value=t),this.positionMenu(),this.cache[t])this.populateMenu(this.cache[t]),this.openMenu();else{this.ajax&&(this.closeMenu(),this.ajax.cancel());var i={value:t};this.ajax=this.makeAjax(this.options.url,i)}this.searchText=t}},makeAjax:function(e,t){return new Request({url:e,data:t,onRequest:function(){Fabrik.loader.start(this.getInputElement())}.bind(this),onCancel:function(){Fabrik.loader.stop(this.getInputElement())}.bind(this),onSuccess:function(e){this.completeAjax(e,t.value)}.bind(this),onComplete:function(){Fabrik.loader.stop(this.getInputElement())}.bind(this),onFailure:function(){Fabrik.loader.stop(this.getInputElement())}.bind(this),onException:function(){Fabrik.loader.stop(this.getInputElement())}.bind(this)}).send()},completeAjax:function(e,t){Fabrik.loader.stop(this.getInputElement()),e=JSON.parse(e),this.cache[t]=e,this.populateMenu(e),this.openMenu()},buildMenu:function(){this.menu=new Element("div",{class:this.options.menuclass,styles:{position:"absolute"}}).adopt(new Element("ul",{class:this.options.classes.ul})),this.menu.inject(document.body),this.menu.addEvent("mouseenter",function(){this.mouseinsde=!0}.bind(this)),this.menu.addEvent("mouseleave",function(){this.mouseinsde=!1}.bind(this))},getInputElement:function(){return this.options.labelelement?this.options.labelelement:this.element},positionMenu:function(){var e=this.getInputElement().getCoordinates();this.getInputElement().getPosition();this.menu.setStyles({left:e.left,top:e.top+e.height-1,width:e.width})},populateMenu:function(e){e.map(function(e,t){return e.text=Encoder.htmlDecode(e.text),e}),this.data=e;var t=this.getListMax(),i=this.menu.getElement("ul");i.empty(),1===e.length&&this.options.autoLoadSingleResult&&(this.matchedResult=!0,this.element.value=e[0].value,this.fireEvent("selection",[this,this.element.value]));for(var s=0;s<t;s++){var n=e[s],o=new Element("li",{"data-value":n.value,class:"unselected "+this.options.classes.li}).set("text",n.text);o.inject(i),o.addEvent("click",function(e){e.stop(),this.makeSelection(e.target)}.bind(this))}e.length>this.options.max&&new Element("li").set("text","....").inject(i)},makeSelection:function(e){"null"!==typeOf(e)?(this.getInputElement().value=e.get("text"),this.element.value=e.getProperty("data-value"),this.matchedResult=!0,this.closeMenu(),this.fireEvent("selection",[this,this.element.value]),this.element.fireEvent("change",new Event.Mock(this.element,"change"),700),Fabrik.fireEvent("fabrik.autocomplete.selected",[this,this.element.value])):Fabrik.fireEvent("fabrik.autocomplete.notselected",[this,this.element.value])},closeMenu:function(){this.shown&&(this.shown=!1,this.menu.fade("out"),this.selected=-1,document.removeEvent("click",function(e){this.doTestMenuClose(e)}.bind(this)))},openMenu:function(){this.shown||this.isMinTriggerlength()&&(this.shown=!0,this.menu.setStyle("visibility","visible").fade("in"),document.addEvent("click",function(e){this.doTestMenuClose(e)}.bind(this)),this.selected=0,this.highlight())},doTestMenuClose:function(){this.mouseinsde||this.closeMenu()},isMinTriggerlength:function(){return this.getInputElement().get("value").length>=this.options.minTriggerChars},getListMax:function(){return"null"===typeOf(this.data)?0:this.data.length>this.options.max?this.options.max:this.data.length},doWatchKeys:function(e){if(document.activeElement===this.getInputElement()){Fabrik.loader.stop(this.getInputElement());var t=this.getListMax();if(this.shown)if(this.isMinTriggerlength())switch("enter"!==e.key&&"tab"!==e.key||window.fireEvent("blur"),e.code){case 40:this.shown||this.openMenu(),this.selected+1<t&&(this.selected++,this.highlight()),e.stop();break;case 38:-1<=this.selected-1&&(this.selected--,this.highlight()),e.stop();break;case 13:case 9:e.stop();var i=new Event.Mock(this.getSelected(),"click");this.makeSelection(i);break;case 27:e.stop(),this.matchedResult=!1,this.closeMenu()}else e.stop(),this.closeMenu();else 13===e.code.toInt()&&e.stop(),40===e.code.toInt()&&this.openMenu()}},getSelected:function(){return this.menu.getElements("li").filter(function(e,t){return t===this.selected}.bind(this))[0]},highlight:function(){this.matchedResult=!0,this.menu.getElements("li").each(function(e,t){t===this.selected?e.addClass("selected"):e.removeClass("selected")}.bind(this))}}),FabCddAutocomplete=new Class({Extends:FbAutocomplete,search:function(e){if(this.canSearch(e)){var t,i=this.defineSearchValue();if(i!==this.searchText&&""!==i){var s=document.id(this.options.observerid);if("null"===typeOf(s))return void this.parent(e);if(t=s.get("value")+"."+i,this.positionMenu(),this.cache[t])this.populateMenu(this.cache[t]),this.openMenu();else{this.ajax&&(this.closeMenu(),this.ajax.cancel());var n=document.id(this.options.observerid).get("value");"null"===typeOf(n)&&(n=Fabrik.getBlock(this.options.formRef).elements.get(this.options.observerid).get("value"));var o={value:i,fabrik_cascade_ajax_update:1,v:n};this.ajax=this.makeAjax(this.options.url,o)}}this.searchText=i}}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
