<<<<<<< HEAD
/**
 * Created by rob on 18/03/2016.
 */
define(['jquery', 'fab/autocomplete-bootstrap', 'fab/fabrik'],

    function (jQuery, AutoComplete, Fabrik) {
        var FabCddAutocomplete = new Class({

            Binds: [],

            Extends: AutoComplete,

            search: function (e) {
                var key, msg;
                var v = this.getInputElement().get('value');
                if (v === '') {
                    this.element.value = '';
                }
                if (v !== this.searchText && v !== '') {
                    var observer = document.id(this.options.observerid);
                    if (typeOf(observer) !== 'null') {
                        if (this.options.formRef) {
                            observer = Fabrik.getBlock(this.options.formRef)
                                .formElements[this.options.observerid];
                        }
                        key = observer.get('value') + '.' + v;
                    } else {
                        this.parent(e);
                        return;
                    }
                    this.positionMenu();
                    if (this.cache[key]) {
                        if (this.populateMenu(this.cache[key])) {
                            this.openMenu();
                        }
                    } else {
                        if (this.ajax) {
                            this.closeMenu();
                            this.ajax.cancel();
                        }
                        this.ajax = new Request({
                            url      : this.options.url,
                            data     : {
                                value                     : v,
                                fabrik_cascade_ajax_update: 1,
                                v                         : observer.get('value')
                            },
                            onRequest: function () {
                                Fabrik.loader.start(this.getInputElement());
                            }.bind(this),
                            onCancel : function () {
                                Fabrik.loader.stop(this.getInputElement());
                            }.bind(this),
                            onSuccess: function (e) {
                                Fabrik.loader.stop(this.getInputElement());
                                this.ajax = null;
                                this.completeAjax(e);
                            }.bind(this),
                            onFailure: function (xhr) {
                                Fabrik.loader.stop(this.getInputElement());
                                this.ajax = null;
                                fconsole('Fabrik autocomplete: Ajax failure: Code ' + xhr.status + ': ' + xhr.statusText);
                                var elModel = Fabrik.getBlock(this.options.formRef)
                                    .formElements.get(this.element.id);
                                msg = Joomla.JText._('COM_FABRIK_AUTOCOMPLETE_AJAX_ERROR');
                                elModel.setErrorMessage(msg, 'fabrikError', true);
                            }.bind(this)
                        }).send();
                    }
                }
                this.searchText = v;
            }
        });
        return FabCddAutocomplete;
    });
=======
/*! Fabrik */

define(["jquery","fab/autocomplete-bootstrap","fab/fabrik"],function(t,e,o){return new Class({Binds:[],Extends:e,search:function(t){var e,s,i=this.getInputElement().get("value");if(""===i&&(this.element.value=""),i!==this.searchText&&""!==i){var n=document.id(this.options.observerid);if("null"===typeOf(n))return void this.parent(t);this.options.formRef&&(n=o.getBlock(this.options.formRef).formElements[this.options.observerid]),e=n.get("value")+"."+i,this.positionMenu(),this.cache[e]?this.populateMenu(this.cache[e])&&this.openMenu():(this.ajax&&(this.closeMenu(),this.ajax.cancel()),this.ajax=new Request({url:this.options.url,data:{value:i,fabrik_cascade_ajax_update:1,v:n.get("value")},onRequest:function(){o.loader.start(this.getInputElement())}.bind(this),onCancel:function(){o.loader.stop(this.getInputElement())}.bind(this),onSuccess:function(t){o.loader.stop(this.getInputElement()),this.ajax=null,this.completeAjax(t)}.bind(this),onFailure:function(t){o.loader.stop(this.getInputElement()),this.ajax=null,fconsole("Fabrik autocomplete: Ajax failure: Code "+t.status+": "+t.statusText);var e=o.getBlock(this.options.formRef).formElements.get(this.element.id);s=Joomla.JText._("COM_FABRIK_AUTOCOMPLETE_AJAX_ERROR"),e.setErrorMessage(s,"fabrikError",!0)}.bind(this)}).send())}this.searchText=i}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
