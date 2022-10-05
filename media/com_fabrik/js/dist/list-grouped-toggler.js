<<<<<<< HEAD
/**
 * Created by rob on 21/03/2016.
 */


define(['jquery'], function (jQuery) {
    /**
     * Toggle grouped data by click on the grouped headings icon
     */

    var FbGroupedToggler = new Class({
        Binds: [],

        Implements: [Options],

        options: {
            collapseOthers: false,
            startCollapsed: false,
            bootstrap     : false
        },

        initialize: function (container, options) {
            var rows, h, img, state;
            if (typeOf(container) === 'null') {
                return;
            }
            this.setOptions(options);
            this.container = container;
            this.toggleState = 'shown';
            if (this.options.startCollapsed && this.options.isGrouped) {
                this.collapse();
            }
            container.addEvent('click:relay(.fabrik_groupheading a.toggle)', function (e) {
                if (e.rightClick) {
                    return;
                }
                e.stop();
                e.preventDefault(); //should work according to http://mootools.net/blog/2011/09/10/mootools-1-4-0/

                if (this.options.collapseOthers) {
                    this.collapse();
                }
                h = e.target.getParent('.fabrik_groupheading');
                img = this.options.bootstrap ? h.getElement('*[data-role="toggle"]') : h.getElement('img');
                state = img.retrieve('showgroup', true);

                if (h.getNext() && h.getNext().hasClass('fabrik_groupdata')) {
                    // For div tmpl
                    rows = h.getNext();
                } else {
                    rows = h.getParent().getNext();
                }
                state ? jQuery(rows).hide() : jQuery(rows).show();
                state ? jQuery(h).find('.groupExtra').hide() : jQuery(h).find('.groupExtra').show();
                this.setIcon(img, state);
                state = state ? false : true;
                img.store('showgroup', state);
                return false;
            }.bind(this));
        },

        setIcon: function (img, state) {
            if (this.options.bootstrap) {
                var expandIcon = img.get('data-expand-icon'),
                    collapsedIcon = img.get('data-collapse-icon');
                if (state) {
                    img.removeClass(expandIcon);
                    img.addClass(collapsedIcon);
                } else {
                    img.addClass(expandIcon);
                    img.removeClass(collapsedIcon);
                }
            } else {
                if (state) {
                    img.src = img.src.replace('orderasc', 'orderneutral');
                } else {
                    img.src = img.src.replace('orderneutral', 'orderasc');
                }
            }
        },

        collapse: function () {
            jQuery(this.container.getElements('.fabrik_groupdata')).hide();
            jQuery(this.container.getElements('.groupExtra')).hide();
            var selector = this.options.bootstrap ? '*[data-role="toggle"]' : 'img';
            var i = this.container.getElements('.fabrik_groupheading a ' + selector);
            if (i.length === 0) {
                i = this.container.getElements('.fabrik_groupheading ' + selector);
            }
            i.each(function (img) {
                img.store('showgroup', false);
                this.setIcon(img, true);
            }.bind(this));
        },

        expand: function () {
            jQuery(this.container.getElements('.fabrik_groupdata')).show();
            jQuery(this.container.getElements('.groupExtra')).show();
            var selector = this.options.bootstrap ? '*[data-role="toggle"]' : 'img';
            var i = this.container.getElements('.fabrik_groupheading a ' + selector);
            if (i.length === 0) {
                i = this.container.getElements('.fabrik_groupheading ' + selector);
            }
            i.each(function (img) {
                img.store('showgroup', true);
                this.setIcon(img, false);
            }.bind(this));
        },

        toggle: function () {
            this.toggleState === 'shown' ? this.collapse() : this.expand();
            this.toggleState = this.toggleState === 'shown' ? 'hidden' : 'shown';
        }
    });

    return FbGroupedToggler;
});
=======
/*! Fabrik */

define(["jquery"],function(n){return new Class({Binds:[],Implements:[Options],options:{collapseOthers:!1,startCollapsed:!1,bootstrap:!1},initialize:function(t,e){var o,s,i,a;"null"!==typeOf(t)&&(this.setOptions(e),this.container=t,this.toggleState="shown",this.options.startCollapsed&&this.options.isGrouped&&this.collapse(),t.addEvent("click:relay(.fabrik_groupheading a.toggle)",function(t){if(!t.rightClick)return t.stop(),t.preventDefault(),this.options.collapseOthers&&this.collapse(),s=t.target.getParent(".fabrik_groupheading"),i=this.options.bootstrap?s.getElement('*[data-role="toggle"]'):s.getElement("img"),a=i.retrieve("showgroup",!0),o=s.getNext()&&s.getNext().hasClass("fabrik_groupdata")?s.getNext():s.getParent().getNext(),a?n(o).hide():n(o).show(),a?n(s).find(".groupExtra").hide():n(s).find(".groupExtra").show(),this.setIcon(i,a),a=!a,i.store("showgroup",a),!1}.bind(this)))},setIcon:function(t,e){if(this.options.bootstrap){var o=t.get("data-expand-icon"),s=t.get("data-collapse-icon");e?(t.removeClass(o),t.addClass(s)):(t.addClass(o),t.removeClass(s))}else t.src=e?t.src.replace("orderasc","orderneutral"):t.src.replace("orderneutral","orderasc")},collapse:function(){n(this.container.getElements(".fabrik_groupdata")).hide(),n(this.container.getElements(".groupExtra")).hide();var t=this.options.bootstrap?'*[data-role="toggle"]':"img",e=this.container.getElements(".fabrik_groupheading a "+t);0===e.length&&(e=this.container.getElements(".fabrik_groupheading "+t)),e.each(function(t){t.store("showgroup",!1),this.setIcon(t,!0)}.bind(this))},expand:function(){n(this.container.getElements(".fabrik_groupdata")).show(),n(this.container.getElements(".groupExtra")).show();var t=this.options.bootstrap?'*[data-role="toggle"]':"img",e=this.container.getElements(".fabrik_groupheading a "+t);0===e.length&&(e=this.container.getElements(".fabrik_groupheading "+t)),e.each(function(t){t.store("showgroup",!0),this.setIcon(t,!1)}.bind(this))},toggle:function(){"shown"===this.toggleState?this.collapse():this.expand(),this.toggleState="shown"===this.toggleState?"hidden":"shown"}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
