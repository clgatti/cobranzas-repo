/*! Fabrik */

define(["jquery","fab/element"],function(e,i){return window.FbAttending=new Class({Extends:i,initialize:function(i,n){this.parent(i,n),this.watchJoin(),this.spinner=new Asset.image(Fabrik.liveSite+"media/com_fabrik/images/ajax-loader.gif",{alt:"loading",class:"ajax-loader"}),this.message=e(this.element).find(".msg")},watchJoin:function(){var n=this,i=e(this.getContainer()).find('*[data-action="add"]');i.off("click",function(i){n.join(i)}),i.on("click",function(i){n.join(i)})},join:function(){this.save("join")},leave:function(){this.save("leave")},save:function(i){this.spinner.inject(this.message);var n=this,t={option:"com_fabrik",format:"raw",task:"plugin.pluginAjax",plugin:"attending",method:i,g:"element",element_id:this.options.elid,formid:this.options.formid,row_id:this.options.row_id,elementname:this.options.elid,userid:this.options.userid,rating:this.rating,listid:this.options.listid};e.ajax({url:"",data:t}).done(function(){n.spinner.remove()})}}),window.FbAttending});