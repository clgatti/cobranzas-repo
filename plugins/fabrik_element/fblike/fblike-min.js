/*! Fabrik */

define(["jquery","fab/element"],function(i,e){return window.FbLike=new Class({Extends:e,initialize:function(i,e){this.setPlugin("fblike"),this.parent(i,e),FB.Event.subscribe("edge.create",function(i){this.like("+")}.bind(this)),FB.Event.subscribe("edge.remove",function(i){this.like("-")}.bind(this))},like:function(i){var e={option:"com_fabrik",format:"raw",task:"plugin.pluginAjax",plugin:"fblike",method:"ajax_rate",g:"element",element_id:this.options.elid,row_id:this.options.row_id,elementname:this.options.elid,listid:this.options.listid,direction:i};new Request({url:"",data:e,onComplete:function(i){(i=JSON.parse(i)).error&&console.log(i.error)}.bind(this)}).send()}}),window.FbLike});