<<<<<<< HEAD
/**
 * List Toggle
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

define(['jquery'], function (jQuery) {

    var FbListToggle = new Class({

        initialize: function (form) {

            // Stop dropdown closing on click
            jQuery('#' + form.id + ' .togglecols .dropdown-menu a, #' + form.id
                + ' .togglecols .dropdown-menu li').click(function (e) {
                e.stopPropagation();
            });

            // Set up toggle events for elements
            form.addEvent('mouseup:relay(a[data-toggle-col])', function (e, btn) {
                var state = jQuery(btn).data('toggle-state');
                var col = jQuery(btn).data('toggle-col');
                this.toggleColumn(col, state, btn);
            }.bind(this));

            // Toggle events for groups (toggles all elements in group)
            var groups = form.getElements('a[data-toggle-group]');
            form.addEvent('mouseup:relay(a[data-toggle-group])', function (e, group) {
                var state = jQuery(group).data('toggle-state'), muted,
                    groupName = jQuery(group).data('toggle-group'),
                    links = document.getElements('a[data-toggle-parent-group=' + groupName + ']');

                links.each(function (btn) {
                    var col = jQuery(btn).data('toggle-col');
                    this.toggleColumn(col, state, btn);
                }.bind(this));

                state = state === 'open' ? 'close' : 'open';
                muted = state === 'open' ? '' : ' muted';
                jQuery(group).find('*[data-isicon]')
                    .removeClass()
                    .addClass('icon-eye-' + state + muted);
                jQuery(group).data('toggle-state', state);

            }.bind(this));
        },

        /**
         * Toggle column
         *
         * @param col   Element name
         * @param state Open/closed
         * @param btn   Button/link which initiated the toggle
         */
        toggleColumn: function (col, state, btn) {
            var muted;
            state = state === 'open' ? 'close' : 'open';

            if (state === 'open') {
                jQuery('.fabrik___heading .' + col).show();
                jQuery('.fabrikFilterContainer .' + col).show();
                jQuery('.fabrik_row  .' + col).show();
                jQuery('.fabrik_calculations  .' + col).show();
                muted = '';
            } else {
                jQuery('.fabrik___heading .' + col).hide();
                jQuery('.fabrikFilterContainer .' + col).hide();
                jQuery('.fabrik_row  .' + col).hide();
                jQuery('.fabrik_calculations  .' + col).hide();
                muted = ' muted';
            }

            jQuery(btn).find('*[data-isicon]')
                .removeClass()
                .addClass('icon-eye-' + state + muted);
            jQuery(btn).data('toggle-state', state);
        }
    });

    return FbListToggle;
});
=======
/*! Fabrik */

define(["jquery"],function(i){return new Class({initialize:function(a){i("#"+a.id+" .togglecols .dropdown-menu a, #"+a.id+" .togglecols .dropdown-menu li").click(function(a){a.stopPropagation()}),a.addEvent("mouseup:relay(a[data-toggle-col])",function(a,e){var o=i(e).data("toggle-state"),t=i(e).data("toggle-col");this.toggleColumn(t,o,e)}.bind(this));a.getElements("a[data-toggle-group]");a.addEvent("mouseup:relay(a[data-toggle-group])",function(a,e){var o,t=i(e).data("toggle-state"),n=i(e).data("toggle-group");document.getElements("a[data-toggle-parent-group="+n+"]").each(function(a){var e=i(a).data("toggle-col");this.toggleColumn(e,t,a)}.bind(this)),o="open"===(t="open"===t?"close":"open")?"":" muted",i(e).find("*[data-isicon]").removeClass().addClass("icon-eye-"+t+o),i(e).data("toggle-state",t)}.bind(this))},toggleColumn:function(a,e,o){var t;t="open"===(e="open"===e?"close":"open")?(i(".fabrik___heading ."+a).show(),i(".fabrikFilterContainer ."+a).show(),i(".fabrik_row  ."+a).show(),i(".fabrik_calculations  ."+a).show(),""):(i(".fabrik___heading ."+a).hide(),i(".fabrikFilterContainer ."+a).hide(),i(".fabrik_row  ."+a).hide(),i(".fabrik_calculations  ."+a).hide()," muted"),i(o).find("*[data-isicon]").removeClass().addClass("icon-eye-"+e+t),i(o).data("toggle-state",e)}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
