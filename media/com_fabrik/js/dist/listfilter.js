<<<<<<< HEAD
/**
 * List Filter
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

define(['jquery', 'fab/fabrik', 'fab/advanced-search'], function (jQuery, Fabrik, AdvancedSearch) {
    var FbListFilter = new Class({

        Implements: [Events],

        Binds: [],

        options: {
            'container'     : '',
            'filters'       : [],
            'type'          : 'list',
            'id'            : '',
            'ref'           : '',
            'advancedSearch': {
                'controller': 'list'
            }
        },

        initialize: function (options) {
            var self = this,
                advancedSearchButton;
            this.filters = {};
            this.options = jQuery.extend(this.options, options);
            this.advancedSearch = false;
            this.container = jQuery('#' + this.options.container);
            this.filterContainer = this.container.find('.fabrikFilterContainer');
            this.filtersInHeadings = this.container.find('.listfilter');
            var b = this.container.find('.toggleFilters');
            b.on('click', function (e) {
                e.preventDefault();
                self.filterContainer.toggle();
                self.filtersInHeadings.toggle();
            });

            if (b.length > 0) {
                this.filterContainer.hide();
                this.filtersInHeadings.toggle();
            }

            if (this.container.length === 0) {
                return;
            }
            this.getList();
            var c = this.container.find('.clearFilters');
            c.off();
            c.on('click', function (e) {
                e.preventDefault();

                // Reset the filter fields that contain previously selected values
                self.container.find('.fabrik_filter').each(function (i, f) {
                    self.clearAFilter(jQuery(f));
                });
                self.clearPlugins();
                self.submitClearForm();
            });

            advancedSearchButton = this.container.find('.advanced-search-link');
            advancedSearchButton.on('click', function (e) {
                e.preventDefault();
                var a = jQuery(e.target), windowopts;
                if (a.prop('tagName') !== 'A') {
                    a = a.closest('a');
                }
                var url = a.prop('href');
                url += '&listref=' + self.options.ref;
                windowopts = {
                    id             : 'advanced-search-win' + self.options.ref,
                    modalId        : 'advanced-filter',
                    title          : Joomla.JText._('COM_FABRIK_ADVANCED_SEARCH'),
                    loadMethod     : 'xhr',
                    evalScripts    : true,
                    contentURL     : url,
                    width          : 710,
                    height         : 340,
                    y              : self.options.popwiny,
                    onContentLoaded: function () {
                        var list = Fabrik.blocks['list_' + self.options.ref];
                        if (list === undefined) {
                            list = Fabrik.blocks[self.options.container];
                            self.options.advancedSearch.parentView = self.options.container;
                        }
                        list.advancedSearch = new AdvancedSearch(self.options.advancedSearch);
                        this.fitToContent(false);
                    }
                };
                Fabrik.getWindow(windowopts);
            });


            jQuery('.fabrik_filter.advancedSelect').on('change', {changeEvent: 'change'}, function (event) {
                this.fireEvent(event.data.changeEvent,
                    new Event.Mock(document.getElementById(this.id), event.data.changeEvent));
            });

            this.watchClearOne();
        },

        getList: function () {
            this.list = Fabrik.blocks[this.options.type + '_' + this.options.ref];
            if (this.list === undefined) {
                this.list = Fabrik.blocks[this.options.container];
            }
            return this.list;
        },

        addFilter: function (plugin, f) {
            if (this.filters.hasOwnProperty(plugin) === false) {
                this.filters[plugin] = [];
            }
            this.filters[plugin].push(f);
        },

        onSubmit: function () {
            if (this.filters.date) {
                jQuery.each(this.filters.date, function (key, f) {
                    f.onSubmit();
                });
            }
            if (this.filters.jdate) {
                jQuery.each(this.filters.jdate, function (key, f) {
                    f.onSubmit();
                });
            }
            this.showFilterState();
        },

        onUpdateData: function () {
            if (this.filters.date) {
                jQuery.each(this.filters.date, function (key, f) {
                    f.onUpdateData();
                });
            }
            if (this.filters.jdate) {
                jQuery.each(this.filters.jdate, function (key, f) {
                    f.onUpdateData();
                });
            }
        },

        // $$$ hugh - added this primarily for CDD element, so it can get an array to
        // emulate submitted form data
        // for use with placeholders in filter queries. Mostly of use if you have
        // daisy chained CDD's.
        getFilterData: function () {
            var h = {};
            this.container.find('.fabrik_filter').each(function () {
                if (typeof jQuery(this).prop('id') !== 'undefined' && jQuery(this).prop('id').test(/value$/)) {
                    var key = jQuery(this).prop('id').match(/(\S+)value$/)[1];
                    // $$$ rob added check that something is select - possibly causes js
                    // error in ie
                    if (jQuery(this).prop('tagName') === 'SELECT' && this.selectedIndex !== -1) {
                        h[key] = jQuery(this.options[this.selectedIndex]).text();
                    } else {
                        h[key] = jQuery(this).val();
                    }
                    h[key + '_raw'] = jQuery(this).val();
                }
            });
            return h;
        },

        /**
         * Ask all filters to update themselves
         */
        update: function () {
            jQuery.each(this.filters, function (plugin, fs) {
                fs.each(function (f) {
                    f.update();
                });
            });
        },

        /**
         * Clear a single filter
         * @param {jQuery} f
         */
        clearAFilter: function (f) {
            var sel;
            if (((f.prop('name').contains('[value]') || f.prop('name').contains('fabrik_list_filter_all'))) ||
                f.hasClass('autocomplete-trigger')) {
                if (f.prop('tagName') === 'SELECT') {
                    sel = f.prop('multiple') ? -1 : 0;
                    f.prop('selectedIndex', sel);
                } else {
                    if (f.prop('type') === 'checkbox') {
                        f.prop('checked', false);
                    } else {
                        f.val('');
                    }
                }
                if (f.hasClass('advancedSelect'))
                {
                    f.trigger('liszt:updated');
                }
            }
        },

        /**
         * Trigger a "clear filter" for any list plugin
         */
        clearPlugins: function () {
            var plugins = this.getList().plugins;
            if (plugins !== null) {
                plugins.each(function (p) {
                    p.clearFilter();
                });
            }
        },

        /**
         * Submit the form as part of clearing filter(s)
         */
        submitClearForm: function () {
            var injectForm = this.container.prop('tagName') === 'FORM' ? this.container :
                this.container.find('form');
            jQuery('<input />').attr({
                'name' : 'resetfilters',
                'value': 1,
                'type' : 'hidden'
            }).appendTo(injectForm);
            if (this.options.type === 'list') {
                this.list.submit('list.clearfilter');
            } else {
                this.container.find('form[name=filter]').submit();
            }
        },

        /**
         * Watch any dom node which have been set up to clear a single filter
         */
        watchClearOne: function () {
            var self = this;
            this.container.find('*[data-filter-clear]').on('click', function (e) {
                e.stopPropagation();
                var currentTarget = e.event ? e.event.currentTarget : e.currentTarget,
                    key = jQuery(currentTarget).data('filter-clear'),
                    filters = jQuery('*[data-filter-name="' + key + '"]');

                filters.each(function (i, filter) {
                    self.clearAFilter(jQuery(filter));
                });

                self.submitClearForm();
                self.showFilterState();
            });
        },

	    /**
         * Used when filters are in a pop up window
         */
        showFilterState: function () {
            var label = jQuery(Fabrik.jLayouts['modal-state-label']),
                self = this, show = false,
                container = this.container.find('*[data-modal-state-display]'),
                clone, v, v2;
            if (container.length === 0) {
                return;
            }
            container.empty();
            jQuery.each(this.options.filters, function (key, filter) {
                var input = self.container.find('*[data-filter-name="' + filter.name + '"]');
                if (input.prop('tagName') === 'SELECT' && input[0].selectedIndex !== -1) {
                    v = jQuery(input[0].options[input[0].selectedIndex]).text();
                    v2 = input.val();
                } else {
                    v = v2 = input.val();
                }
                if (typeof v !== 'undefined' && v !== null && v !== '' && v2 !== '') {
                    show = true;
                    clone = label.clone();
                    clone.find('*[data-filter-clear]').data('filter-clear', filter.name);
                    clone.find('*[data-modal-state-label]').text(filter.label);
                    clone.find('*[data-modal-state-value]').text(v);
                    container.append(clone);
                }
            });
            if (show) {
                this.container.find('*[data-modal-state-container]').show();
            } else {
                this.container.find('*[data-modal-state-container]').hide();
            }
            this.watchClearOne();
        },

        /**
         * Update CSS after an AJAX filter
         */
        updateFilterCSS: function(data) {
            var c = this.container.find('.clearFilters');
            if (c) {
                if (data.hasFilters) {
                    c.addClass('hasFilters');
                }
                else {
                    c.removeClass('hasFilters');
                }
            }
        }

    });

    return FbListFilter;
});
=======
/*! Fabrik */

define(["jquery","fab/fabrik","fab/advanced-search"],function(d,h,r){return new Class({Implements:[Events],Binds:[],options:{container:"",filters:[],type:"list",id:"",ref:"",advancedSearch:{controller:"list"}},initialize:function(t){var a=this;this.filters={},this.options=d.extend(this.options,t),this.advancedSearch=!1,this.container=d("#"+this.options.container),this.filterContainer=this.container.find(".fabrikFilterContainer"),this.filtersInHeadings=this.container.find(".listfilter");var e=this.container.find(".toggleFilters");if(e.on("click",function(t){t.preventDefault(),a.filterContainer.toggle(),a.filtersInHeadings.toggle()}),0<e.length&&(this.filterContainer.hide(),this.filtersInHeadings.toggle()),0!==this.container.length){this.getList();var i=this.container.find(".clearFilters");i.off(),i.on("click",function(t){t.preventDefault(),a.container.find(".fabrik_filter").each(function(t,e){a.clearAFilter(d(e))}),a.clearPlugins(),a.submitClearForm()}),this.container.find(".advanced-search-link").on("click",function(t){t.preventDefault();var e,i=d(t.target);"A"!==i.prop("tagName")&&(i=i.closest("a"));var n=i.prop("href");n+="&listref="+a.options.ref,e={id:"advanced-search-win"+a.options.ref,modalId:"advanced-filter",title:Joomla.JText._("COM_FABRIK_ADVANCED_SEARCH"),loadMethod:"xhr",evalScripts:!0,contentURL:n,width:710,height:340,y:a.options.popwiny,onContentLoaded:function(){var t=h.blocks["list_"+a.options.ref];void 0===t&&(t=h.blocks[a.options.container],a.options.advancedSearch.parentView=a.options.container),t.advancedSearch=new r(a.options.advancedSearch),this.fitToContent(!1)}},h.getWindow(e)}),d(".fabrik_filter.advancedSelect").on("change",{changeEvent:"change"},function(t){this.fireEvent(t.data.changeEvent,new Event.Mock(document.getElementById(this.id),t.data.changeEvent))}),this.watchClearOne()}},getList:function(){return this.list=h.blocks[this.options.type+"_"+this.options.ref],void 0===this.list&&(this.list=h.blocks[this.options.container]),this.list},addFilter:function(t,e){!1===this.filters.hasOwnProperty(t)&&(this.filters[t]=[]),this.filters[t].push(e)},onSubmit:function(){this.filters.date&&d.each(this.filters.date,function(t,e){e.onSubmit()}),this.filters.jdate&&d.each(this.filters.jdate,function(t,e){e.onSubmit()}),this.showFilterState()},onUpdateData:function(){this.filters.date&&d.each(this.filters.date,function(t,e){e.onUpdateData()}),this.filters.jdate&&d.each(this.filters.jdate,function(t,e){e.onUpdateData()})},getFilterData:function(){var e={};return this.container.find(".fabrik_filter").each(function(){if(void 0!==d(this).prop("id")&&d(this).prop("id").test(/value$/)){var t=d(this).prop("id").match(/(\S+)value$/)[1];"SELECT"===d(this).prop("tagName")&&-1!==this.selectedIndex?e[t]=d(this.options[this.selectedIndex]).text():e[t]=d(this).val(),e[t+"_raw"]=d(this).val()}}),e},update:function(){d.each(this.filters,function(t,e){e.each(function(t){t.update()})})},clearAFilter:function(t){var e;(t.prop("name").contains("[value]")||t.prop("name").contains("fabrik_list_filter_all")||t.hasClass("autocomplete-trigger"))&&("SELECT"===t.prop("tagName")?(e=t.prop("multiple")?-1:0,t.prop("selectedIndex",e)):"checkbox"===t.prop("type")?t.prop("checked",!1):t.val(""),t.hasClass("advancedSelect")&&t.trigger("liszt:updated"))},clearPlugins:function(){var t=this.getList().plugins;null!==t&&t.each(function(t){t.clearFilter()})},submitClearForm:function(){var t="FORM"===this.container.prop("tagName")?this.container:this.container.find("form");d("<input />").attr({name:"resetfilters",value:1,type:"hidden"}).appendTo(t),"list"===this.options.type?this.list.submit("list.clearfilter"):this.container.find("form[name=filter]").submit()},watchClearOne:function(){var n=this;this.container.find("*[data-filter-clear]").on("click",function(t){t.stopPropagation();var e=t.event?t.event.currentTarget:t.currentTarget,i=d(e).data("filter-clear");d('*[data-filter-name="'+i+'"]').each(function(t,e){n.clearAFilter(d(e))}),n.submitClearForm(),n.showFilterState()})},showFilterState:function(){var n,a,r,s=d(h.jLayouts["modal-state-label"]),o=this,l=!1,c=this.container.find("*[data-modal-state-display]");0!==c.length&&(c.empty(),d.each(this.options.filters,function(t,e){var i=o.container.find('*[data-filter-name="'+e.name+'"]');"SELECT"===i.prop("tagName")&&-1!==i[0].selectedIndex?(a=d(i[0].options[i[0].selectedIndex]).text(),r=i.val()):a=r=i.val(),null!=a&&""!==a&&""!==r&&(l=!0,(n=s.clone()).find("*[data-filter-clear]").data("filter-clear",e.name),n.find("*[data-modal-state-label]").text(e.label),n.find("*[data-modal-state-value]").text(a),c.append(n))}),l?this.container.find("*[data-modal-state-container]").show():this.container.find("*[data-modal-state-container]").hide(),this.watchClearOne())},updateFilterCSS:function(t){var e=this.container.find(".clearFilters");e&&(t.hasFilters?e.addClass("hasFilters"):e.removeClass("hasFilters"))}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
