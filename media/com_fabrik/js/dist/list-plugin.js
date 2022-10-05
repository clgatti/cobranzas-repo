<<<<<<< HEAD
/**
 * List Plugin
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

define(['jquery'], function (jQuery) {

    var FbListPlugin = new Class({
        Implements: [Events, Options],
        options   : {
            requireChecked: true,
            canAJAX       : true
        },

        initialize: function (options) {
            this.setOptions(options);
            this.result = true; // set this to false in window.fireEvents to stop
            // current action (e.g. stop ordering when
            // fabrik.list.order run)
            if (typeOf(this.getList()) === 'null') {
                return;
            } else {
                // Viz doesn't have getForm method;
                if (typeof this.getList().getForm === 'function') {
                    this.listform = this.getList().getForm();
                    var l = this.listform.getElement('input[name=listid]');
                    // in case its in a viz
                    if (typeOf(l) === 'null') {
                        return;
                    }
                    this.listid = l.value;
                } else {
                    this.listform = this.getList().container.getElement('form');
                }
            }

            this.watchButton();
        },

        /**
         * get the list object that the plugin is assigned to
         */

        getList: function () {
            var b = Fabrik.blocks['list_' + this.options.ref];
            if (typeOf(b) === 'null') {
                b = Fabrik.blocks['visualization_' + this.options.ref];
            }
            return b;
        },

        /**
         * get a html nodes row id - so you can pass in td or tr for example
         * presumes each row has a fabrik_row class and its id is in a string 'list_listref_rowid'
         */

        getRowId: function (node) {
            if (!node.hasClass('fabrik_row')) {
                node = node.getParent('.fabrik_row');
            }
            return node.id.split('_').getLast();
        },

        clearFilter: Function.from(),

        watchButton: function () {
            // Do relay for floating menus
            if (typeOf(this.options.name) === 'null') {
                return;
            }
            // Might need to be this.listform and not document
            document.addEvent('click:relay(.' + this.options.name + ')', function (e, element) {
                if (e.rightClick) {
                    return;
                }
                e.stop();

                // Check that the button clicked belongs to this this.list
                if (element.get('data-list') !== this.list.options.listRef) {
                    return;
                }
                e.preventDefault();
                var row, chx;
                // if the row button is clicked check its associated checkbox
                if (e.target.getParent('.fabrik_row')) {
                    row = e.target.getParent('.fabrik_row');
                    if (row.getElement('input[name^=ids]')) {
                        chx = row.getElement('input[name^=ids]');
                        this.listform.getElements('input[name^=ids]').set('checked', false);
                        chx.set('checked', true);
                    }
                }

                // check that at least one checkbox is checked
                var ok = false;
                this.listform.getElements('input[name^=ids]').each(function (c) {
                    if (c.checked) {
                        ok = true;
                    }
                });
                if (!ok && this.options.requireChecked) {
                    alert(Joomla.JText._('COM_FABRIK_PLEASE_SELECT_A_ROW'));
                    return;
                }
                var n = this.options.name.split('-');
                this.listform.getElement('input[name=fabrik_listplugin_name]').value = n[0];
                this.listform.getElement('input[name=fabrik_listplugin_renderOrder]').value = n.getLast();
                this.buttonAction();
            }.bind(this));
        },

        buttonAction: function () {
            var task = this.options.canAJAX ? 'list.doPlugin' : 'list.doPlugin.noAJAX';
            this.list.submit(task);
        }
    });

    return FbListPlugin;
});
=======
/*! Fabrik */

define(["jquery"],function(t){return new Class({Implements:[Events,Options],options:{requireChecked:!0,canAJAX:!0},initialize:function(t){if(this.setOptions(t),this.result=!0,"null"!==typeOf(this.getList())){if("function"==typeof this.getList().getForm){this.listform=this.getList().getForm();var i=this.listform.getElement("input[name=listid]");if("null"===typeOf(i))return;this.listid=i.value}else this.listform=this.getList().container.getElement("form");this.watchButton()}},getList:function(){var t=Fabrik.blocks["list_"+this.options.ref];return"null"===typeOf(t)&&(t=Fabrik.blocks["visualization_"+this.options.ref]),t},getRowId:function(t){return t.hasClass("fabrik_row")||(t=t.getParent(".fabrik_row")),t.id.split("_").getLast()},clearFilter:Function.from(),watchButton:function(){"null"!==typeOf(this.options.name)&&document.addEvent("click:relay(."+this.options.name+")",function(t,i){if(!t.rightClick&&(t.stop(),i.get("data-list")===this.list.options.listRef)){var e,n;t.preventDefault(),t.target.getParent(".fabrik_row")&&(e=t.target.getParent(".fabrik_row")).getElement("input[name^=ids]")&&(n=e.getElement("input[name^=ids]"),this.listform.getElements("input[name^=ids]").set("checked",!1),n.set("checked",!0));var s=!1;if(this.listform.getElements("input[name^=ids]").each(function(t){t.checked&&(s=!0)}),s||!this.options.requireChecked){var o=this.options.name.split("-");this.listform.getElement("input[name=fabrik_listplugin_name]").value=o[0],this.listform.getElement("input[name=fabrik_listplugin_renderOrder]").value=o.getLast(),this.buttonAction()}else alert(Joomla.JText._("COM_FABRIK_PLEASE_SELECT_A_ROW"))}}.bind(this))},buttonAction:function(){var t=this.options.canAJAX?"list.doPlugin":"list.doPlugin.noAJAX";this.list.submit(t)}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
