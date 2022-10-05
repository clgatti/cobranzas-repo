<<<<<<< HEAD
/**
 * FrontPackage
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true,Canvas:true */

var FrontPackage = new Class({
	Extends: Canvas,
	
	initialize: function (opts) {
		opts.editabe = false;
		this.parent(opts);
		this.setup();
		Fabrik.addEvent('fabrik.list.add', function (e) {
			this.loadForm(e);
		}.bind(this));
	},
	
	loadForm: function (list, e) {
		Fabrik.loader.start();
		var pages = this.pages;
		var page = pages.pages[pages.activePage];
		var style = {'width': 100, height: 100};
		//onSuccess = Fabrik.loader.stop();
		this.insertPage(page, 'forms_' + list.options.formid, '', 'forms', style);
	},
	
	insertPage : function (page, id, label, type, style, onSuccess) {
		var key;
		onSuccess = typeOf(onSuccess) !== 'function' ? Function.from() : onSuccess;
		if (style.width === 0) {
			style.width = 50;
		}
		if (style.height === 0) {
			style.height = 50;
		}
		id = id.replace(type + '_', '');
		//style.overflow = 'hidden';
		//style['z-index'] = 100;
		key = 'id';
		switch (type) {
		case 'list':
			key = 'listid';
			break;
		case 'form':
			key = 'formid';
			break;
		case 'vizualizations':
			type = 'visualization';
			break;
		}
		var plugin = "{fabrik view=" + type + " id=" + id + "}";
		var c = new Element('div', {'id': id, 'class': 'itemPlaceHolder'}).setStyles(style);
		c.inject(page.page);
		data = {
			'option': 'com_fabrik',
			'view': type,
			'tmpl': 'component',
			'packageId': this.options.packageId,
			'ajax': 1,
			'ajaxlinks': 1
		};
		data[key] = id;
		var url = 'index.php';
		var myAjax = new Request.HTML({url: url,
			'data': data,
			method: 'post', 
			update: c,
			onSuccess: onSuccess
		}).send();
		//iframe loader
		//var url = 'index.php?option=com_fabrik&view=' + type + '&' + key + '=' + id + '&tmpl=component&package=' + this.options['package'];
		
		/*var url = 'index.php?option=com_fabrik&task=' + type + '.view&' + key + '=' + id + '&tmpl=component&iframe=1&package=' + this.options['package'];
		
		var c = new Element('iframe', {'id': id, src: url, 'class': 'itemPlaceHolderIFrame'}).setStyles(style);
		c.inject(page.page);*/
	}
});
=======
/*! Fabrik */

var FrontPackage=new Class({Extends:Canvas,initialize:function(a){a.editabe=!1,this.parent(a),this.setup(),Fabrik.addEvent("fabrik.list.add",function(a){this.loadForm(a)}.bind(this))},loadForm:function(a,i){Fabrik.loader.start();var t=this.pages,e=t.pages[t.activePage];this.insertPage(e,"forms_"+a.options.formid,"","forms",{width:100,height:100})},insertPage:function(a,i,t,e,s,n){var o;switch(n="function"!==typeOf(n)?Function.from():n,0===s.width&&(s.width=50),0===s.height&&(s.height=50),i=i.replace(e+"_",""),o="id",e){case"list":o="listid";break;case"form":o="formid";break;case"vizualizations":e="visualization"}var d=new Element("div",{id:i,class:"itemPlaceHolder"}).setStyles(s);d.inject(a.page),data={option:"com_fabrik",view:e,tmpl:"component",packageId:this.options.packageId,ajax:1,ajaxlinks:1},data[o]=i;new Request.HTML({url:"index.php",data:data,method:"post",update:d,onSuccess:n}).send()}});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
