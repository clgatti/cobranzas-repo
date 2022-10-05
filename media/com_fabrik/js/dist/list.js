<<<<<<< HEAD
/**
 * List
 *
 * @copyright: Copyright (C) 2005-2013, fabrikar.com - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

define(['jquery', 'fab/fabrik', 'fab/list-toggle', 'fab/list-grouped-toggler', 'fab/list-keys',
        'fab/list-actions', 'fab/mootools-ext'],
    function (jQuery, Fabrik, FbListToggle, FbGroupedToggler, FbListKeys, FbListActions) {
        var FbList = new Class({
            Binds: [],

            Implements: [Options, Events],

            actionManager: null,

            options: {
                'admin'              : false,
                'filterMethod'       : 'onchange',
                'ajax'               : false,
                'ajax_links'         : false,
                'links'              : {'edit': '', 'detail': '', 'add': ''},
                'form'               : 'listform_' + this.id,
                'hightLight'         : '#ccffff',
                'primaryKey'         : '',
                'headings'           : [],
                'labels'             : {},
                'Itemid'             : 0,
                'formid'             : 0,
                'canEdit'            : true,
                'canView'            : true,
                'page'               : 'index.php',
                'actionMethod'       : 'floating', // deprecated in 3.1
                'formels'            : [], // elements that only appear in the form
                'data'               : [], // [{col:val, col:val},...] (depreciated)
                'itemTemplate'       : '',
                'floatPos'           : 'left', // deprecated in 3.1
                'csvChoose'          : false,
                advancedFilters      : null,
                'csvOpts'            : {
                    excel       : false,
                    incfilters  : false,
                    inctabledata: false,
                    incraw      : false,
                    inccalcs    : false

                },
                'popup_width'        : 300,
                'popup_height'       : 300,
                'popup_offset_x'     : null,
                'popup_offset_y'     : null,
                'groupByOpts'        : {},
                isGrouped            : false,
                'listRef'            : '', // e.g. '1_com_fabrik_1'
                'fabrik_show_in_list': [],
                'singleOrdering'     : false,
                'tmpl'               : '',
                'groupedBy'          : '',
                'toggleCols'         : false
            },

            initialize: function (id, options) {
                var self = this;
                this.id = id;
                this.setOptions(options);
                this.getForm();
                this.result = true; //used with plugins to determine if list actions should be performed
                this.plugins = [];
                this.list = document.id('list_' + this.options.listRef);
                this.rowTemplate = false;

                if (this.options.toggleCols) {
                    this.toggleCols = new FbListToggle(this.form);
                }

                this.groupToggle = new FbGroupedToggler(this.form, this.options.groupByOpts);
                new FbListKeys(this);
                if (this.list) {
                    if (this.list.get('tag') === 'table') {
                        this.tbody = this.list.getElement('tbody');
                    }
                    if (typeOf(this.tbody) === 'null') {
                        this.tbody = this.list.getElement('.fabrik_groupdata');
                    }
                    // $$$ rob mootools 1.2 has bug where we cant set('html') on table
                    // means that there is an issue if table contains no data
                    if (window.ie) {
                        this.options.itemTemplate = this.list.getElement('.fabrik_row');
                    }
                }
                this.watchAll(false);
                Fabrik.addEvent('fabrik.form.submitted', function () {
                    self.updateRows();
                });

                /**
                 * once an ajax form has been submitted lets clear out any loose events and the form object itself
                 *
                 * Commenting out as this causes issues for cdd after ajax form post
                 * http://www.fabrikar.com/forums/index.php?threads/cdd-only-triggers-js-change-code-on-first-change.32793/
                 */
                /*Fabrik.addEvent('fabrik.form.ajax.submit.end', function (form) {
                 form.formElements.each(function (el) {
                 el.removeCustomEvents();
                 });
                 delete Fabrik.blocks['form_' + form.id];
                 });*/

                // Reload state only if reset filters is not on
                if (!this.options.resetFilters && ((window.history && history.pushState) &&
                    history.state && this.options.ajax)) {
                    this._updateRows(history.state);
                }

	            this.mediaScan();

                Fabrik.fireEvent('fabrik.list.loaded', [this]);
            },

            setItemTemplate: function () {
                // $$$ rob mootools 1.2 has bug where we cant setHTML on table
                // means that there is an issue if table contains no data
                if (typeOf(this.options.itemTemplate) === 'string') {
                    var r = this.list.getElement('.fabrik_row');
                    if (window.ie && typeOf(r) !== 'null') {
                        this.options.itemTemplate = r;
                    }
                }
            },

            setRowTemplate: function (parent) {
                if (!this.rowTemplate) {
                    this.rowTemplate = parent.clone().empty();

                    // Hail Mary, probably an empty div template
                    if (this.rowTemplate.length === 0) {
                        this.rowTemplate = jQuery(this.tbody).children().not('.groupDataMsg').first();
                    }
                }

                return this.rowTemplate;
            },

            /**
             * Used for db join select states.
             */
            rowClicks: function () {
                var self = this, rowId, json;
                jQuery(this.list).on('click', '.fabrik_row', function () {
                    rowId = this.id.split('_').pop();
                    json = {
                        errors: {},
                        data  : {
                            rowid: rowId
                        },
                        rowid : rowId,
                        listid: self.id
                    };
                    Fabrik.fireEvent('fabrik.list.row.selected', json);
                });
            },

            watchAll: function (ajaxUpdate) {
                ajaxUpdate = ajaxUpdate ? ajaxUpdate : false;
                this.watchNav();
                this.storeCurrentValue();
                if (!ajaxUpdate) {
                    this.watchRows();
                    this.watchFilters();
                }
                this.watchOrder();
                this.watchEmpty();
                if (!ajaxUpdate) {
                    this.watchGroupByMenu();
                    this.watchButtons();
                }
            },

            /**
             * Watch the group by buttons when list rendering as ajax
             */
            watchGroupByMenu: function () {
                var self = this;
                if (this.options.ajax) {
                    jQuery(this.form).on('click', '*[data-groupBy]', function (e) {
                        self.options.groupedBy = jQuery(this).data('groupby');
                        if (e.rightClick) {
                            return;
                        }
                        e.preventDefault();
                        self.updateRows();
                    });
                }
            },

            watchButtons: function () {
                var self = this;
                this.exportWindowOpts = {
                    modalId    : 'exportcsv',
                    type       : 'modal',
                    id         : 'exportcsv',
                    title      : 'Export CSV',
                    loadMethod : 'html',
                    minimizable: false,
                    width      : 360,
                    height     : 240,
                    content    : '',
                    modal: true,
                    bootstrap  : true,
                    visible: true,
                    onContentLoaded: function () {
                        var win = this;
                        window.setTimeout(function () {
                            win.fitToContent();
                        }, 1000);

                    }
                };
                this.exportWindowOpts.width = parseInt(this.options.csvOpts.popupwidth,10)>0 ? this.options.csvOpts.popupwidth : 360;
                this.exportWindowOpts.optswidth = parseInt(this.options.csvOpts.optswidth,10)>0 ? this.options.csvOpts.optswidth : 240;
                if (this.options.view === 'csv') {

                    // For csv links e.g. index.php?option=com_fabrik&view=csv&listid=10
                    this.openCSVWindow();
                } else {
                    jQuery(this.form).find('.csvExportButton').each(function (x, b) {
                        b = jQuery(b);
                        if (b.hasClass('custom') === false) {
                            b.on('click', function (e) {
                                e.preventDefault();
                                self.openCSVWindow();
                            });
                        }
                    });
                }
            },

            /**
             * Open either the window to choose csv export options or auto-start the CSV
             * download
             */
            openCSVWindow: function () {
                var self = this;
                this.exportWindowOpts.content = this.makeCSVExportForm();
                this.csvWindow = Fabrik.getWindow(this.exportWindowOpts);

                jQuery('.exportCSVButton').on('click', function (e) {
                    e.stopPropagation();
                    this.disabled = true;

                    /* immediately hide the Export button and form options */
                    jQuery(this).hide();
                    jQuery(this).closest('div.modal').find('.contentWrapper').hide();

                    var csvMsg = jQuery('#csvmsg');
                    if (csvMsg.length === 0) {
                        csvMsg = jQuery('<div />').attr({
                            'id': 'csvmsg'
                        }).insertBefore(jQuery(this));
                    }
                    csvMsg.html(Joomla.JText._('COM_FABRIK_LOADING') +
                        ' <p><span id="csvcount">0</span> / <span id="csvtotal"></span> ' +
                        Joomla.JText._('COM_FABRIK_RECORDS') + '</p><p class="saveto">' + Joomla.JText._('COM_FABRIK_SAVING_TO') +
                        ' <span id="csvfile"></span></p>');
                    self.triggerCSVExport(0);
                });
            },

            /**
             * Create the CSV export window content, either
             * export options form our auto-start export
             * @returns {jQuery}
             */
            makeCSVExportForm: function () {
                if (this.options.csvChoose) {
                    this.csvExportForm = this._csvExportForm();
                    return this.csvExportForm;
                } else {
                    return this._csvAutoStart();
                }
            },

            /**
             * Create the content for the CSV export window's auto-start
             * @returns {jQuery}
             * @private
             */
            _csvAutoStart: function () {
                var c = jQuery('<div />').attr({
                    'id': 'csvmsg'
                }).html(Joomla.JText._('COM_FABRIK_LOADING') +
                    ' <br /><span id="csvcount">0</span> / <span id="csvtotal"></span> ' +
                    Joomla.JText._('COM_FABRIK_RECORDS') + '.<br/>' + Joomla.JText._('COM_FABRIK_SAVING_TO') +
                    '<span id="csvfile"></span>');

                this.csvopts = this.options.csvOpts;
                this.csvfields = this.options.csvFields;

                this.triggerCSVExport(-1);
                return c;
            },
            /* Used to create class names for every line in the form options.
             * This will allow for more easilly adding custom css styling to
             * hide options that you don't want the user to be able to change.
             */
            makeSafeForCSS: function(name) {
                return name.replace(/[^a-z0-9]/g, function(s) {
                    var c = s.charCodeAt(0);
                    if (c == 32) return '-';
                    if (c >= 65 && c <= 90) return s.toLowerCase();
                    return ('000' + c.toString(16)).slice(-4);
                });
            },
            /**
             * Create a csv yes/no radio div.
             * @param {string} name
             * @param {boolean} yesValue
             * @param {string} yesLabel
             * @param {string} noLabel
             * @param {string} title
             * @returns {*}
             * @private
             */
            _csvYesNo: function (name, yesValue, yesLabel, noLabel, title) {
                var label = jQuery('<label />').css({'display':'inline-block','margin-left':'15px'});

                var yes = label.clone().append(
                    [jQuery('<input />').attr({
                        'type' : 'radio',
                        'name' : name,
                        'value': '1',
                        checked: yesValue
                    }),
                        jQuery('<span />').text(yesLabel)
                    ]),

                    no = label.clone().append(
                        [jQuery('<input />').attr({
                            'type' : 'radio',
                            'name' : name,
                            'value': '0',
                            checked: !yesValue
                        }),
                            jQuery('<span />').text(noLabel)
                        ]),
                    titleLabel = jQuery('<div>').css({
                        'margin': '3px 0px 1px 8px',
                        'width': this.exportWindowOpts.optswidth + 'px',
                        'float': 'left'
                    }).text(title);

                var thisClass = 'opt__' + this.makeSafeForCSS(title);
                return jQuery('<div class="' + thisClass + '">').css({'border-bottom':'1px solid #dddddd'}).append([titleLabel, yes, no]);
            },

            /**
             * Build the export csv form
             * @returns {jQuery}
             * @private
             */
            _csvExportForm: function () {
                var thisClass,thisText;
                var yes = Joomla.JText._('JYES'),
                    no = Joomla.JText._('JNO'),
                    self = this,
                    url = Fabrik.liveSite + '/index.php?option=com_fabrik&view=list&listid=' +
                        this.id + '&format=csv&Itemid=' + this.options.Itemid,
                    label = jQuery('<label />').css('clear', 'left');

                var c = jQuery('<form />').css('margin-bottom','0px').attr({
                    'action': url,
                    'method': 'post'
                }).append([
                    this._csvYesNo('excel', this.options.csvOpts.excel,
                        'Excel CSV', 'CSV', Joomla.JText._('COM_FABRIK_FILE_TYPE')),
                    this._csvYesNo('incfilters', this.options.csvOpts.incfilters,
                        yes, no, Joomla.JText._('COM_FABRIK_INCLUDE_FILTERS')),
                    this._csvYesNo('inctabledata', this.options.csvOpts.inctabledata,
                        yes, no, Joomla.JText._('COM_FABRIK_INCLUDE_DATA')),
                    this._csvYesNo('incraw', this.options.csvOpts.incraw,
                        yes, no, Joomla.JText._('COM_FABRIK_INCLUDE_RAW_DATA')),
                    this._csvYesNo('inccalcs', this.options.csvOpts.inccalcs,
                        yes, no, Joomla.JText._('COM_FABRIK_INCLUDE_CALCULATIONS')),

                ]);
                thisText = Joomla.JText._('COM_FABRIK_SELECT_COLUMNS_TO_EXPORT');
                thisClass = 'opt__' + self.makeSafeForCSS(thisText);
                jQuery('<div />').prop('class', thisClass)
                    .text(thisText).appendTo(c);
                var g = '';
                var i = 0;
                jQuery.each(this.options.labels, function (k, labelText) {
                    if (k.substr(0, 7) !== 'fabrik_' && k !== '____form_heading') {
                        var newg = k.split('___')[0];
                        if (newg !== g) {
                            g = newg;
                            thisClass = 'opt__' + self.makeSafeForCSS(g);
                            jQuery('<div />').prop('class',thisClass).css({'clear':'left','font-weight':'600'}).text(g).appendTo(c);
                        }

                        labelText = labelText.replace(/<\/?[^>]+(>|jQuery)/g, '');

                        self._csvYesNo('fields[' + k + ']', true,
                            yes, no, labelText).appendTo(c);
                    }
                    i++;
                });

                // elements not shown in table
                if (this.options.formels.length > 0) {
                    thisText = Joomla.JText._('COM_FABRIK_FORM_FIELDS');
                    thisClass = 'opt__' + self.makeSafeForCSS(thisText);
                    jQuery('<div />').prop('class',thisClass)
                        .text(thisText).appendTo(c);
                    this.options.formels.each(function (el) {
                        self._csvYesNo('fields[' + el.name + ']', false,
                            yes, no, el.label).appendTo(c);
                    });
                }

                jQuery('<input />').attr({
                    'type' : 'hidden',
                    'name' : 'view',
                    'value': 'table'
                }).appendTo(c);
                jQuery('<input />').attr({
                    'type' : 'hidden',
                    'name' : 'option',
                    'value': 'com_fabrik'
                }).appendTo(c);
                jQuery('<input />').attr({
                    'type' : 'hidden',
                    'name' : 'listid',
                    'value': self.id
                }).appendTo(c);
                jQuery('<input />').attr({
                    'type' : 'hidden',
                    'name' : 'format',
                    'value': 'csv'
                }).appendTo(c);
                jQuery('<input />').attr({
                    'type' : 'hidden',
                    'name' : 'c',
                    'value': 'table'
                }).appendTo(c);

                return c;
            },

            triggerCSVExport: function (start, opts, fields) {
                var self = this;
                if (start !== 0) {
                    if (start === -1) {
                        // not triggered from front end selections
                        start = 0;
                        opts = self.csvopts;
                        opts.fields = self.csvfields;
                    } else {
                        opts = self.csvopts;
                        fields = self.csvfields;
                    }
                } else {
                    if (!opts) {
                        opts = {};
                        ['incfilters', 'inctabledata', 'incraw', 'inccalcs', 'excel'].each(function (v) {
                            var inputs = self.csvExportForm.find('input[name=' + v + ']');
                            if (inputs.length > 0) {
                                opts[v] = inputs.filter(function () {
                                    return this.checked;
                                })[0].value;
                            }
                        });
                    }
                    // Selected fields
                    if (!fields) {
                        fields = {};
                        self.csvExportForm.find('input[name^=field]').each(function () {
                            if (this.checked) {
                                var k = this.name.replace('fields[', '').replace(']', '');
                                fields[k] = jQuery(this).val();
                            }
                        });
                    }
                    opts.fields = fields;
                    self.csvopts = opts;
                    self.csvfields = fields;
                }

                opts = this.csvExportFilterOpts(opts);

                opts.start = start;
                opts.option = 'com_fabrik';
                opts.view = 'list';
                opts.format = 'csv';
                //opts.Itemid = this.options.Itemid;
                opts.listid = this.id;
                opts.listref = this.options.listRef;
                opts.download = 0;
                opts.setListRefFromRequest = 1;

                var url = '?' + 'Itemid=' + this.options.Itemid;

                this.options.csvOpts.custom_qs.split('&').each(function (qs) {
                    //var key = qs.split('=');
                    //opts[key[0]] = key[1];
                    url += '&' + qs;
                });

                // Append the custom_qs to the URL to enable querystring filtering of the list data
                var myAjax = new Request.JSON({
                    url       : url,
                    method    : 'post',
                    data      : opts,
                    onError   : function (text, error) {
                        fconsole(text, error);
                    },
                    onComplete: function (res) {
                        if (res.err) {
                            window.alert(res.err);
                            Fabrik.Windows.exportcsv.close();
                        } else {
                            jQuery('#csvcount').text(res.count);
                            jQuery('#csvtotal').text(res.total);
                            jQuery('#csvfile').text(res.file);
                            if (res.count < res.total) {
                                self.triggerCSVExport(res.count);
                            } else {
                                var finalurl;
                                if (self.options.admin) {
                                    finalurl = Fabrik.liveSite + 'administrator/index.php' +
                                        '?option=com_fabrik' +
                                        '&task=list.view' +
                                        '&format=csv' +
                                        '&listid=' + self.id +
                                        '&start=' + res.count;
                                }
                                else {
                                    /*
                                    finalurl = Fabrik.liveSite + '/index.php' +
                                        '?option=com_fabrik' +
                                        '&view=list' +
                                        '&format=csv' +
                                        '&listid=' + self.id +
                                        '&start=' + res.count +
                                        '&Itemid=' + self.options.Itemid;
                                        */
                                    finalurl = self.options.csvOpts.exportLink;
                                    finalurl += finalurl.contains('?') ? '&' : '?';
                                    finalurl += 'start=' + res.count;
                                }

                                finalurl += '&' + self.options.csvOpts.custom_qs;

                                var msg = '<div class="alert alert-success" style="padding:10px;margin-bottom:3px"><h3>' + Joomla.JText._('COM_FABRIK_CSV_COMPLETE');
                                msg += '</h3><p><a class="btn btn-success" href="' + finalurl + '">' +
                                    '<i class="icon-download"></i> ' +
                                    Joomla.JText._('COM_FABRIK_CSV_DOWNLOAD_HERE') + '</a></p></div>';
                                jQuery('#csvmsg').html(msg);
                                document.getElements('input.exportCSVButton').removeProperty('disabled');

                                // commenting this out as it seems to hose up the download in IE11/Edge
                                /*
                                jQuery('#csvmsg a.btn-success').mouseup(function () {
                                    jQuery(this).hide();
                                });
                                */

                                jQuery('#csvmsg a.btn-success').focusout(function () {
                                    Fabrik.Windows.exportcsv.close(true);
                                });

                                self.csvWindow.fitToContent();
                            }
                        }
                    }
                });
                myAjax.send();
            },

            /**
             * Add filter options to CSV export info
             *
             * @param {object}  opts
             *
             * @return {object} opts
             */
            csvExportFilterOpts: function (opts) {
                var ii = 0,
                    self = this,
                    aa, bits, aName,
                    advancedPointer = 0,
                    testii,
                    usedAdvancedKeys = [
                        'value',
                        'condition',
                        'join',
                        'key',
                        'search_type',
                        'match',
                        'full_words_only',
                        'eval',
                        'grouped_to_previous',
                        'hidden',
                        'elementid'
                    ];

                this.getFilters().each(function (x, f) {
                    f = jQuery(f);
                    bits = f.prop('name').split('[');
                    if (bits.length > 3) {
                        testii = parseInt(bits[3].replace(']', ''), 10);
                        ii = testii > ii ? testii : ii;

                        if (f.prop('type') === 'checkbox' || f.prop('type') === 'radio') {
                            if (f[0].checked) {
                                opts[f.name] = f.val();
                            }
                        } else {
                            opts[f.name] = f.val();
                        }
                    }
                });

                ii++;

                Object.each(this.options.advancedFilters, function (values, key) {
                    if (usedAdvancedKeys.contains(key)) {
                        advancedPointer = 0;
                        for (aa = 0; aa < values.length; aa++) {
                            advancedPointer = aa + ii;
                            aName = 'fabrik___filter[list_' + self.options.listRef +
                                '][' + key + '][' + advancedPointer + ']';
                            if (key === 'value') {
                                opts[aName] = self.options.advancedFilters.origvalue[aa];
                            }
                            else if (key === 'condition') {
                                opts[aName] = self.options.advancedFilters.orig_condition[aa];
                            }
                            else {
                                opts[aName] = values[aa];
                            }
                        }
                    }
                });

                return opts;
            },

            addPlugins: function (a) {
                var self = this;
                a.each(function (p) {
                    p.list = self;
                });
                this.plugins = a;
            },

            firePlugin: function (method) {
                var args = Array.prototype.slice.call(arguments), self = this;
                args = args.slice(1, args.length);
                this.plugins.each(function (plugin) {
                    Fabrik.fireEvent(method, [self, args]);
                });
                return this.result === false ? false : true;
            },

            /**
             * Watch the empty data button
             */
            watchEmpty: function () {
                var self = this,
                    b = jQuery(this.form).find('.doempty');
                b.on('click', function (e) {
                    e.preventDefault();
                    if (window.confirm(Joomla.JText._('COM_FABRIK_CONFIRM_DROP'))) {
                        self.submit('list.doempty');
                    }
                });
            },

            /**
             * Watch order buttons
             */
            watchOrder: function () {
                var elementId = false, i, icon, otherIcon, src,
                    form = jQuery(this.form), self = this,
                    hs = form.find('.fabrikorder, .fabrikorder-asc, .fabrikorder-desc');
                hs.off('click');
                hs.on('click', function (e) {
                    var img = 'ordernone.png',
                        orderDir = '',
                        newOrderClass = '',
                        bsClassAdd = '',
                        bsClassRemove = '',
                        h = jQuery(this),
                        td = h.closest('.fabrik_ordercell');

                    if (h.prop('tagName') !== 'A') {
                        h = td.find('a');
                    }

                    /**
                     * Figure out what we need to change the icon from / to.  We don't know in advance for
                     * bootstrapped templates what icons will be used, so the fabrik-order-header layout
                     * will have set data-sort-foo properties of each of the three states.  Another wrinkle
                     * is that we can't just set the new icon class blindly, because there
                     * may be other classes
                     * on the icon.  For instancee BS3 using Font Awesome will have "fa fa-sort-foo".
                     * So we have
                     * to specifically remove the current class and add the new one.
                     */

                    switch (h.attr('class')) {
                        case 'fabrikorder-asc':
                            newOrderClass = 'fabrikorder-desc';
                            bsClassAdd = h.data('data-sort-desc-icon');
                            bsClassRemove = h.data('data-sort-asc-icon');
                            orderDir = 'desc';
                            img = 'orderdesc.png';
                            break;
                        case 'fabrikorder-desc':
                            newOrderClass = 'fabrikorder';
                            bsClassAdd = h.data('data-sort-icon');
                            bsClassRemove = h.data('data-sort-desc-icon');
                            orderDir = '-';
                            img = 'ordernone.png';
                            break;
                        case 'fabrikorder':
                            newOrderClass = 'fabrikorder-asc';
                            bsClassAdd = h.data('data-sort-asc-icon');
                            bsClassRemove = h.data('data-sort-icon');
                            orderDir = 'asc';
                            img = 'orderasc.png';
                            break;
                    }
                    td.attr('class').split(' ').each(function (c) {
                        if (c.contains('_order')) {
                            elementId = c.replace('_order', '').replace(/^\s+/g, '').replace(/\s+$/g, '');
                        }
                    });
                    if (!elementId) {
                        fconsole('woops didnt find the element id, cant order');
                        return;
                    }
                    h.attr('class', newOrderClass);
                    if (Fabrik.bootstrapped) {
                        icon = h.find('*[data-isicon]');
                    } else  {
                        i = h.find('img');
                        icon = h.firstElementChild;
                    }

                    // Swap images - if list doing ajax nav then we need to do this
                    if (self.options.singleOrdering) {
                        form.find('.fabrikorder, .fabrikorder-asc, .fabrikorder-desc')
                            .each(function (otherH) {
                                if (Fabrik.bootstrapped) {
                                    otherIcon = otherH.firstElementChild;
                                    switch (otherH.className) {
                                        case 'fabrikorder-asc':
                                            otherIcon.removeClass(otherH.data('sort-asc-icon'));
                                            otherIcon.addClass(otherH.data('sort-icon'));
                                            break;
                                        case 'fabrikorder-desc':
                                            otherIcon.removeClass(otherH.data('sort-desc-icon'));
                                            otherIcon.addClass(otherH.data('sort-icon'));
                                            break;
                                        case 'fabrikorder':
                                            break;
                                    }
                                } else {
                                    i = otherH.find('img');
                                    if (i.length > 0) {
                                        src = i.attr('src');
                                        src = src.replace('ordernone.png', '')
                                            .replace('orderasc.png', '').replace('orderdesc.png', '');
                                        src += 'ordernone.png';
                                        i.attr('src', src);
                                    }
                                }
                            });
                    }

                    if (Fabrik.bootstrapped) {
                        icon.removeClass(bsClassRemove);
                        icon.addClass(bsClassAdd);
                    } else {
                        if (i) {
                            src = i.attr('src');
                            src = src.replace('ordernone.png', '').replace('orderasc.png', '')
                                .replace('orderdesc.png', '');
                            i.attr('src', src);
                        }
                    }

                    self.fabrikNavOrder(elementId, orderDir);
                    e.preventDefault();
                });

            },

            /**
             * Get dom nodes with class fabrik_filter
             * @returns {jQuery}
             */
            getFilters: function () {
                return jQuery(this.form).find('.fabrik_filter');
            },

            /**
             * Store filter current values when the list is set to update on filter change
             * rather than filter form submission
             */
            storeCurrentValue: function () {
                if (this.options.filterMethod !== 'submitform') {
                    this.getFilters().each(function (x, f) {
                        f = jQuery(f);
                        f.data('initialvalue', f.val());
                    });
                }
            },

            /**
             * Watch filters, for changes which may trigger the list to be re-rendered
             */
            watchFilters: function () {
                var e = '',
                    self = this,
                    submit = jQuery(this.form).find('.fabrik_filter_submit');

                this.getFilters().each(function (x, f) {
                    f = jQuery(f);
                    e = f.prop('tagName') === 'SELECT' || f.prop('type') === 'checkbox' ? 'change' : 'blur';
                    if (self.options.filterMethod !== 'submitform') {
                        f.off(e);
                        f.on(e, function (e) {
                            e.preventDefault();
                            if (f.prop('type') === 'checkbox' || f.data('initialvalue') !== f.val()) {
                                self.doFilter();
                            }
                        });
                    }
                });

                // Watch submit if present regardless of this.options.filterMethod
                submit.off();
                submit.on('click', function (e) {
                    e.preventDefault();
                    self.doFilter();
                });
                this.getFilters().on('keydown', function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        self.doFilter();
                    }
                });
            },

            /**
             * Perform list filter
             */
            doFilter: function () {
                var res = Fabrik.fireEvent('list.filter', [this]).eventResults;
                if (res === null) {
                    this.submit('list.filter');
                }
                if (res.length === 0 || !res.contains(false)) {
                    this.submit('list.filter');
                }
            },

            /**
             * Highlight active row, deselect others
             * @param {jQuery} activeTr
             */
            setActive: function (activeTr) {
                this.list.getElements('.fabrik_row').each(function (tr) {
                    tr.removeClass('activeRow');
                });
                activeTr.addClass('activeRow');
            },

            /**
             * Get the active list row for a given mouse event.
             * If none found return the current active row
             *
             * @param {event} e
             * @returns {jQuery}
             */
            getActiveRow: function (e) {
                var row = jQuery(e.target).closest('.fabrik_row');
                if (row.length === 0) {
                    row = Fabrik.activeRow;
                }
                return row;
            },

            watchRows: function () {
                if (!this.list) {
                    return;
                }
                this.rowClicks();
            },

            getForm: function () {
                if (!this.form) {
                    this.form = document.id(this.options.form);
                }
                return this.form;
            },

            /**
             * Un-check all the row's checkboxes
             */
            uncheckAll: function () {
                jQuery(this.form).find('input[name^=ids]').each(function (i, c) {
                    c.checked = '';
                });
            },

            /**
             * Check if there are some selected records to delete and asks the user if they really want to delete
             * those records
             * Returns false to stop the list's form from being submitted
             *
             * @returns {boolean}
             */
            submitDeleteCheck: function () {
                var ok = false,
                    delCount = 0;
                jQuery(this.form).find('input[name^=ids]').each(function (x, c) {
                    if (c.checked) {
                        delCount++;
                        ok = true;
                    }
                });
                if (!ok) {
                    window.alert(Joomla.JText._('COM_FABRIK_SELECT_ROWS_FOR_DELETION'));
                    Fabrik.loader.stop('listform_' + this.options.listRef);
                    return false;
                }
                var delMsg = delCount === 1 ? Joomla.JText._('COM_FABRIK_CONFIRM_DELETE_1')
                    : Joomla.JText._('COM_FABRIK_CONFIRM_DELETE').replace('%s', delCount);
                if (!window.confirm(delMsg)) {
                    Fabrik.loader.stop('listform_' + this.options.listRef);
                    this.uncheckAll();
                    return false;
                }

                return true;
            },

            submit: function (task) {
                this.getForm();
                var doAJAX = this.options.ajax,
                    self = this,
                    form = jQuery(this.form);
                if (task === 'list.doPlugin.noAJAX') {
                    task = 'list.doPlugin';
                    doAJAX = false;
                }
                if (task === 'list.delete' && !this.submitDeleteCheck()) {
                    return false;
                }
                // We may want to set this as an option - if long page loads feedback that list
                // is doing something might be useful
                // Fabrik.loader.start('listform_' + this.options.listRef);
                if (task === 'list.filter') {
                    Fabrik['filter_listform_' + this.options.listRef].onSubmit();
                    this.form.task.value = task;
                    if (this.form['limitstart' + this.id]) {
                        form.find('#limitstart' + this.id).val(0);
                    }
                }
                else if (task === 'list.view') {
                    Fabrik['filter_listform_' + this.options.listRef].onSubmit();
                }
                else {
                    if (task !== '') {
                        this.form.task.value = task;
                    }
                }
                if (doAJAX) {
                    Fabrik.loader.start('listform_' + this.options.listRef);
                    // For module & mambot
                    // $$$ rob with modules only set view/option if ajax on
                    form.find('input[name=option]').val('com_fabrik');
                    form.find('input[name=view]').val('list');
                    form.find('input[name=format]').val('raw');

                    var data = this.form.toQueryString();

                    //if (task === 'list.doPlugin') {
                        data += '&setListRefFromRequest=1';
                        data += '&listref=' + this.options.listRef;
                        data += '&Itemid=' + this.options.Itemid;
                    //}

                    if (task === 'list.filter' && this.advancedSearch !== false) {
                        var advSearchForm = document.getElement('form.advancedSearch_' + this.options.listRef);
                        if (typeOf(advSearchForm) !== 'null') {
                            data += '&' + advSearchForm.toQueryString();
                            data += '&replacefilters=1';
                        }
                    }
                    // Pass the elements that are shown in the list - to ensure they are formatted
                    for (var i = 0; i < this.options.fabrik_show_in_list.length; i++) {
                        data += '&fabrik_show_in_list[]=' + this.options.fabrik_show_in_list[i];
                    }

                    // Add in tmpl for custom nav in admin
                    data += '&tmpl=' + this.options.tmpl;
                    if (!this.request) {
                        this.request = new Request({
                            'url'     : this.form.get('action'),
                            'data'    : data,
                            onComplete: function (json) {
                                json = JSON.parse(json);
                                self._updateRows(json);
                                Fabrik.loader.stop('listform_' + self.options.listRef);
                                Fabrik['filter_listform_' + self.options.listRef].onUpdateData();
                                Fabrik['filter_listform_' + self.options.listRef].updateFilterCSS(json);
                                jQuery('#searchall_' + self.options.listRef).val(json.searchallvalue);
                                Fabrik.fireEvent('fabrik.list.submit.ajax.complete', [self, json]);
                                if (json.msg && json.showmsg) {
                                    window.alert(json.msg);
                                }
                            }
                        });
                    } else {
                        this.request.options.data = data;
                    }
                    this.request.send();

                    if (window.history && window.history.pushState) {
                        history.pushState(data, 'fabrik.list.submit');
                    }
                    Fabrik.fireEvent('fabrik.list.submit', [task, this.form.toQueryString().toObject()]);
                } else {
                    this.form.submit();
                }
                //Fabrik['filter_listform_' + this.options.listRef].onUpdateData();
                return false;
            },

            /**
             *
             * @param limitStart
             * @returns {boolean}
             */
            fabrikNav: function (limitStart) {
                this.options.limitStart = limitStart;
                this.form.getElement('#limitstart' + this.id).value = limitStart;
                // cant do filter as that resets limitstart to 0
                Fabrik.fireEvent('fabrik.list.navigate', [this, limitStart]);
                if (!this.result) {
                    this.result = true;
                    return false;
                }
                this.submit('list.view');
                return false;
            },

            /**
             * Get the primary keys for the visible rows
             *
             * @since   3.0.7
             *
             * @return  array
             */
            getRowIds: function () {
                var keys = [];
                var d = this.options.isGrouped ? $H(this.options.data) : this.options.data;
                d.each(function (group) {
                    group.each(function (row) {
                        keys.push(row.data.__pk_val);
                    });
                });
                return keys;
            },

            /**
             * Get the primary keys for all checked rows
             *
             * @since   3.7
             *
             * @return  array
             */
            getCheckedRowIds: function () {
                var chxs = this.getForm().getElements('input[name^=ids]').filter(function (i) {
                    return i.checked;
                });

                var ids = chxs.map(function (chx) {
                    return chx.get('value');
                });

                return ids;
            },

            /**
             * Get a single row's data
             *
             * @param   string  id  ID
             *
             * @since  3.0.8
             *
             * @return object
             */
            getRow: function (id) {
                var found = {};
                Object.each(this.options.data, function (group) {
                    for (var i = 0; i < group.length; i++) {
                        var row = group[i];
                        if (row && row.data.__pk_val === id) {
                            found = row.data;
                        }
                    }
                });
                return found;
            },

            fabrikNavOrder: function (orderby, orderdir) {
                this.form.orderby.value = orderby;
                this.form.orderdir.value = orderdir;
                Fabrik.fireEvent('fabrik.list.order', [this, orderby, orderdir]);
                if (!this.result) {
                    this.result = true;
                    return false;
                }
                this.submit('list.order');
            },

            removeRows: function (rowids) {
                var i, self = this,
                    end = function () {
                        row.dispose();
                        self.checkEmpty();
                    };
                for (i = 0; i < rowids.length; i++) {
                    var row = document.id('list_' + self.id + '_row_' + rowids[i]);
                    var highlight = new Fx.Morph(row, {
                        duration: 1000
                    });
                    highlight.start({
                        'backgroundColor': this.options.hightLight
                    }).chain(function () {
                        this.start({
                            'opacity': 0
                        });
                    }).chain(end);
                }
            },

            editRow: function () {
            },

            clearRows: function () {
                this.list.getElements('.fabrik_row').each(function (tr) {
                    tr.dispose();
                });
            },

            updateRows: function (extraData) {
                var self = this,
                    url = '',
                    data = {
                        'option'  : 'com_fabrik',
                        'view'    : 'list',
                        'task'    : 'list.view',
                        'format'  : 'raw',
                        'listid'  : this.id,
                        'listref' : this.options.listRef
                    };
                data['limit' + this.id] = this.options.limitLength;

                if (extraData) {
                    Object.append(data, extraData);
                }

                if (this.options.groupedBy !== '')
                {
                    data['group_by'] = this.options.groupedBy;
                }

                new Request({
                    'url'        : url,
                    'data'       : data,
                    'evalScripts': false,
                    onSuccess    : function (json) {
                        json = json.stripScripts();
                        json = JSON.parse(json);
                        self._updateRows(json);
                        // Fabrik.fireEvent('fabrik.list.update', [this, json]);
                    },
                    onError      : function (text, error) {
                        fconsole(text, error);
                    },
                    onFailure    : function (xhr) {
                        fconsole(xhr);
                    }
                }).send();
            },

            /**
             * Update headings after ajax data load
             * @param {object} data
             * @private
             */
            _updateHeadings: function (data) {
                var headers = jQuery('#' + this.options.form).find('.fabrik___heading');

                jQuery.each(data.headings, function (key, data) {
                    key = '.' + key;
                    try {
                        // $$$ rob 28/10/2011 just alter span to allow for maintaining filter toggle links
                        headers.find(key + ' span').html(data);
                    } catch (err) {
                        fconsole(err);
                    }
                });
            },

            /**
             * Grouped data - show all tbodys, then hide empty tbodys (not going to work for none <table> tpls)
             * @private
             */
            _updateGroupByTables: function () {
                var tbodys = jQuery(this.list).find('tbody'), groupTbody;
                tbodys.css('display', '');
                tbodys.each(function (tkey, tbody) {
                    if (!tbody.hasClass('fabrik_groupdata')) {
                        groupTbody = jQuery(tbody).next();
                        if (jQuery(groupTbody).find('.fabrik_row').length === 0) {
                            jQuery(tbody).hide();
                            jQuery(groupTbody).hide();
                        }
                    }
                });
            },

            /**
             * Update list items
             * @param {object} data
             * @private
             */
            _updateRows: function (data) {
                var tbody,
                    itemTemplate,
                    i,
                    groupHeading,
                    columnCount,
                    parent,
                    items = [],
                    item,
                    rowTemplate,
                    cell,
                    cells,
                    form = jQuery(this.form),
                    self = this,
                    tmpl = 'tr',
                    fullRow;

                if (typeOf(data) !== 'object') {
                    return;
                }
                if (window.history && window.history.pushState) {
                    history.pushState(data, 'fabrik.list.rows');
                }
                if (!(data.id === this.id && data.model === 'list')) {
                    return;
                }

                this._updateHeadings(data);
                this.setItemTemplate();

                cell = jQuery(this.list).find('.fabrik_row').first();

                if (cell.length === 0) {
                    cell = jQuery(this.options.itemTemplate);
                }
                if (cell.prop('tagName') === 'TR') {
                    parent = cell;
                    columnCount = 1;
                    tmpl = 'tr';
                } else {
                    parent = cell.parent();
                    columnCount = form.find('.fabrikDataContainer').data('cols');
                    tmpl = 'div';
                }

                columnCount = columnCount === undefined ? 1 : columnCount;
                rowTemplate = this.setRowTemplate(parent);
                itemTemplate = cell.clone();

                this.clearRows();
                this.options.data = this.options.isGrouped ? $H(data.data) : data.data;

                if (data.calculations) {
                    this.updateCals(data.calculations);
                }
                form.find('.fabrikNav').html(data.htmlnav);
                // $$$ rob was $H(data.data) but that wasnt working ????
                // testing with $H back in again for grouped by data? Yeah works for
                // grouped data!!
                var gdata = this.options.isGrouped || this.options.groupedBy !== '' ? $H(data.data) : data.data;
                //var gdata = data.data;
                var gcounter = 0;
                gdata.each(function (groupData, groupKey) {
                    tbody = self.options.isGrouped ? self.list.getElements('.fabrik_groupdata')[gcounter] : self.tbody;
                    tbody = jQuery(tbody);
                    //tbody.empty();
                    tbody.children().not('.groupDataMsg').remove();

                    // Set the group by heading
                    if (self.options.isGrouped) {
                        groupHeading = tbody.prev();
                        groupHeading.find('.groupTitle').html(groupData[0].groupHeading);
                    }
                    items = [];
                    gcounter++;
                    for (i = 0; i < groupData.length; i++) {
                        var row = $H(groupData[i]);
                        item = self.injectItemData(itemTemplate, row, tmpl);
                        items.push(item);
                    }

                    items = Fabrik.Array.chunk(items, columnCount);
                    for (i = 0; i < items.length; i++) {
                        if (tmpl === 'div') {
                            cells = items[i];
                            fullRow = rowTemplate.clone().append(cells);
                        }
                        else {
                            fullRow = items[i];
                        }
                        tbody.append(fullRow);
                    }
                });

                this._updateGroupByTables();
                this._updateEmptyDataMsg(items.length === 0);
                this.watchAll(true);
                Fabrik.fireEvent('fabrik.list.updaterows');
                Fabrik.fireEvent('fabrik.list.update', [this, data]);
                this.stripe();
                this.mediaScan();
                Fabrik.loader.stop('listform_' + this.options.listRef);
            },

            _updateEmptyDataMsg: function (empty) {
                var list = jQuery(this.list);
                var fabrikDataContainer = list.parent('.fabrikDataContainer');
                var emptyDataMessage = list.closest('.fabrikForm').find('.emptyDataMessage');
                if (empty) {
                    /*
                     * if (typeOf(fabrikDataContainer) !== 'null') {
                     * fabrikDataContainer.setStyle('display', 'none'); }
                     */
                    emptyDataMessage.css('display', '');
                    /*
                     * $$$ hugh - when doing JSON updates, the emptyDataMessage can be in a td (with no class or id)
                     * which itself is hidden, and also have a child div with the .emptyDataMessage
                     * class which is also hidden.
                     */
                    if (emptyDataMessage.parent().css('display') === 'none') {
                        emptyDataMessage.parent().css('display', '');
                    }
                    emptyDataMessage.parent('.emptyDataMessage').css('display', '');
                } else {
                    fabrikDataContainer.css('display', '');
                    emptyDataMessage.css('display', 'none');
                }
            },

            /**
             * Inject item data into the item data template
             * @param {jQuery} template
             * @param {object} row
             * @param {string}  div or row template
             * @return {jQuery}
             */
            injectItemData: function (template, row, tmpl) {
                var r, cell, c, j;
                jQuery.each(row.data, function (key, val) {
                    cell = template.find('.' + key);
                    if (cell.prop('tagName') !== 'A') {
                        cell.html(val);
                    } else {
                        var href;
                        try {
                            // handle our view/edit links with data-rowid
                            href = jQuery(val).prop('href');
                            var rowid = jQuery(val).data('rowid');
                            // need to only do this for our links, not custom detail links
                            jQuery.each(cell, function (thisKey, thisCell) {
                                if (jQuery(thisCell).data('iscustom') === 0) {
                                    jQuery(thisCell).prop('href', href);
                                    jQuery(thisCell).data('rowid', rowid);
                                }
                            });
                        }
                        catch (err) {
                            // val wasn't an A tag, so just treat it as an href
                            cell.prop('href', val);
                        }
                    }
                });
                if (typeof(this.options.itemTemplate) === 'string') {
                    c = template.find('.fabrik_row').addBack(template);
                    c.prop('id', row.id);
                    if (tmpl !== 'div') {
	                    c.removeClass();
	                    var newClass = row['class'].split(/\s+/);
	                    for (j = 0; j < newClass.length; j++) {
		                    c.addClass(newClass[j]);
	                    }
                    }
                    else {
	                    c.removeClass('oddRow0');
	                    c.removeClass('oddRow1');
	                    var newClass = row['class'].split(/\s+/);
	                    for (j = 0; j < newClass.length; j++) {
		                    if (!c.hasClass(newClass[j])) {
			                    c.addClass(newClass[j]);
		                    }
	                    }
                    }
                    r = template.clone();
                } else {
                    r = template.find('.fabrik_row').addBack(template);
                }
                return r;
            },

            /**
             * Once a row is added - we need to rescan lightboxes etc to re-attach
             */
            mediaScan: function () {
                if (typeof(Slimbox) !== 'undefined') {
                    Slimbox.scanPage();
                }
                if (typeof(Lightbox) !== 'undefined') {
                    Lightbox.init();
                }
                if (typeof(Mediabox) !== 'undefined') {
                    Mediabox.scanPage();
                }
            },

            addRow: function (obj) {
                var r = new Element('tr', {
                    'class': 'oddRow1'
                });
                for (var i in obj) {
                    if (this.options.headings.indexOf(i) !== -1) {
                        var td = new Element('td', {}).appendText(obj[i]);
                        r.appendChild(td);
                    }
                }
                r.inject(this.tbody);
            },

            addRows: function (aData) {
                var i, j;
                for (i = 0; i < aData.length; i++) {
                    for (j = 0; j < aData[i].length; j++) {
                        this.addRow(aData[i][j]);
                    }
                }
                this.stripe();
            },

            stripe: function () {
                var i;
                var trs = this.list.getElements('.fabrik_row');
                for (i = 0; i < trs.length; i++) {
                    if (!trs[i].hasClass('fabrik___header')) { // ignore heading
                        var row = 'oddRow' + (i % 2);
                        trs[i].addClass(row);
                    }
                }
            },

            /**
             * Check if the list contains no data and if so add a row with 'no records' text
             */
            checkEmpty: function () {
                var trs = this.list.getElements('tr');
                if (trs.length === 2) {
                    this.addRow({
                        'label': Joomla.JText._('COM_FABRIK_NO_RECORDS')
                    });
                }
            },

            /**
             * Watch the check all checkbox
             */
            watchCheckAll: function () {
                var form = jQuery(this.form),
                    checkAll = form.find('input[name=checkAll]'), c, i,
                    self = this, list = jQuery(this.list), p, chkBoxes;
                // IE wont fire an event on change until the checkbox is blurred!
                checkAll.on('click', function (e) {
                    p = list.closest('.fabrikList').length > 0 ? list.closest('.fabrikList') : list;
                    chkBoxes = p.find('input[name^=ids]');
                    c = !e.target.checked ? '' : 'checked';
                    for (i = 0; i < chkBoxes.length; i++) {
                        chkBoxes[i].checked = c;
                        self.toggleJoinKeysChx(chkBoxes[i]);
                    }
                });
                form.find('input[name^=ids]').each(function (x, i) {
                    jQuery(i).on('change', function () {
                        self.toggleJoinKeysChx(i);
                    });
                });
            },

            toggleJoinKeysChx: function (i) {
                i.getParent().getElements('input[class=fabrik_joinedkey]').each(function (c) {
                    c.checked = i.checked;
                });
            },

            watchNav: function (e) {
                var form = jQuery(this.form),
                    limitBox = form.find('select[name*=limit]'),
                    addRecord = form.find('.addRecord'),
                    self = this, loadMethod, href;

                limitBox.on('change', function () {
                    Fabrik.fireEvent('fabrik.list.limit', [self]);
                    if (self.result === false) {
                        self.result = true;
                        return false;
                    }
                    self.doFilter();
                });
                if (this.options.ajax_links) {
                    if (addRecord.size() > 0) {
                        addRecord.off();
                        href = addRecord.prop('href');
                        loadMethod = (this.options.links.add === '' ||
                        href.contains(Fabrik.liveSite)) ? 'xhr' : 'iframe';
                        var url = href;
                        url += url.contains('?') ? '&' : '?';
                        url += 'tmpl=component&ajax=1';
                        url += '&format=partial';
                        addRecord.on('click', function (e) {
                            e.preventDefault();

                            var winOpts = {
                                'id'        : 'add.' + self.id,
                                'title'     : self.options.popup_add_label,
                                'loadMethod': loadMethod,
                                'contentURL': url,
                                'width'     : self.options.popup_width,
                                'height'    : self.options.popup_height
                            };
                            if (self.options.popup_offset_x !== null) {
                                winOpts.offset_x = self.options.popup_offset_x;
                            }
                            if (self.options.popup_offset_y !== null) {
                                winOpts.offset_y = self.options.popup_offset_y;
                            }
                            Fabrik.getWindow(winOpts);
                        });
                    }
                }
                jQuery('#fabrik__swaptable').on('change', function () {
                    window.location = 'index.php?option=com_fabrik&task=list.view&cid=' + this.value;
                });
                // All nav links should submit the form, if we dont then filters are not taken into account when
                // building the list cache id
                // Can result in 2nd pages of cached data being shown, but without filters applied
                var as = form.find('.pagination .pagenav');
                if (as.length === 0) {
                    as = form.find('.pagination a');
                }
                jQuery(as).on('click', function (e) {
                    e.preventDefault();
                    if (this.tagName === 'A') {
                        var o = this.href.toObject();
                        self.fabrikNav(o['limitstart' + self.id]);
                    }
                });

                this.watchCheckAll();
            },

            /**
             * currently only called from element raw view when using inline edit plugin
             * might need to use for ajax nav as well?
             */
            updateCals: function (json) {
                var types = ['sums', 'avgs', 'count', 'medians'];
                this.form.getElements('.fabrik_calculations').each(function (c) {
                    types.each(function (type) {
                        $H(json[type]).each(function (val, key) {
                            var target = c.getElement('.' + key);
                            if (typeOf(target) !== 'null') {
                                target.set('html', val);
                            }
                        });
                    });
                });
            }
        });
        return FbList;
    });
=======
/*! Fabrik */

define(["jquery","fab/fabrik","fab/list-toggle","fab/list-grouped-toggler","fab/list-keys","fab/list-actions","fab/mootools-ext"],function(_,g,s,o,n,t){return new Class({Binds:[],Implements:[Options,Events],actionManager:null,options:{admin:!1,filterMethod:"onchange",ajax:!1,ajax_links:!1,links:{edit:"",detail:"",add:""},form:"listform_"+this.id,hightLight:"#ccffff",primaryKey:"",headings:[],labels:{},Itemid:0,formid:0,canEdit:!0,canView:!0,page:"index.php",actionMethod:"floating",formels:[],data:[],itemTemplate:"",floatPos:"left",csvChoose:!1,advancedFilters:null,csvOpts:{excel:!1,incfilters:!1,inctabledata:!1,incraw:!1,inccalcs:!1},popup_width:300,popup_height:300,popup_offset_x:null,popup_offset_y:null,groupByOpts:{},isGrouped:!1,listRef:"",fabrik_show_in_list:[],singleOrdering:!1,tmpl:"",groupedBy:"",toggleCols:!1},initialize:function(t,i){var e=this;this.id=t,this.setOptions(i),this.getForm(),this.result=!0,this.plugins=[],this.list=document.id("list_"+this.options.listRef),this.rowTemplate=!1,this.options.toggleCols&&(this.toggleCols=new s(this.form)),this.groupToggle=new o(this.form,this.options.groupByOpts),new n(this),this.list&&("table"===this.list.get("tag")&&(this.tbody=this.list.getElement("tbody")),"null"===typeOf(this.tbody)&&(this.tbody=this.list.getElement(".fabrik_groupdata")),window.ie&&(this.options.itemTemplate=this.list.getElement(".fabrik_row"))),this.watchAll(!1),g.addEvent("fabrik.form.submitted",function(){e.updateRows()}),!this.options.resetFilters&&window.history&&history.pushState&&history.state&&this.options.ajax&&this._updateRows(history.state),this.mediaScan(),g.fireEvent("fabrik.list.loaded",[this])},setItemTemplate:function(){if("string"===typeOf(this.options.itemTemplate)){var t=this.list.getElement(".fabrik_row");window.ie&&"null"!==typeOf(t)&&(this.options.itemTemplate=t)}},setRowTemplate:function(t){return this.rowTemplate||(this.rowTemplate=t.clone().empty(),0===this.rowTemplate.length&&(this.rowTemplate=_(this.tbody).children().not(".groupDataMsg").first())),this.rowTemplate},rowClicks:function(){var t,i,e=this;_(this.list).on("click",".fabrik_row",function(){t=this.id.split("_").pop(),i={errors:{},data:{rowid:t},rowid:t,listid:e.id},g.fireEvent("fabrik.list.row.selected",i)})},watchAll:function(t){t=t||!1,this.watchNav(),this.storeCurrentValue(),t||(this.watchRows(),this.watchFilters()),this.watchOrder(),this.watchEmpty(),t||(this.watchGroupByMenu(),this.watchButtons())},watchGroupByMenu:function(){var i=this;this.options.ajax&&_(this.form).on("click","*[data-groupBy]",function(t){i.options.groupedBy=_(this).data("groupby"),t.rightClick||(t.preventDefault(),i.updateRows())})},watchButtons:function(){var e=this;this.exportWindowOpts={modalId:"exportcsv",type:"modal",id:"exportcsv",title:"Export CSV",loadMethod:"html",minimizable:!1,width:360,height:240,content:"",modal:!0,bootstrap:!0,visible:!0,onContentLoaded:function(){var t=this;window.setTimeout(function(){t.fitToContent()},1e3)}},this.exportWindowOpts.width=0<parseInt(this.options.csvOpts.popupwidth,10)?this.options.csvOpts.popupwidth:360,this.exportWindowOpts.optswidth=0<parseInt(this.options.csvOpts.optswidth,10)?this.options.csvOpts.optswidth:240,"csv"===this.options.view?this.openCSVWindow():_(this.form).find(".csvExportButton").each(function(t,i){!1===(i=_(i)).hasClass("custom")&&i.on("click",function(t){t.preventDefault(),e.openCSVWindow()})})},openCSVWindow:function(){var e=this;this.exportWindowOpts.content=this.makeCSVExportForm(),this.csvWindow=g.getWindow(this.exportWindowOpts),_(".exportCSVButton").on("click",function(t){t.stopPropagation(),this.disabled=!0,_(this).hide(),_(this).closest("div.modal").find(".contentWrapper").hide();var i=_("#csvmsg");0===i.length&&(i=_("<div />").attr({id:"csvmsg"}).insertBefore(_(this))),i.html(Joomla.JText._("COM_FABRIK_LOADING")+' <p><span id="csvcount">0</span> / <span id="csvtotal"></span> '+Joomla.JText._("COM_FABRIK_RECORDS")+'</p><p class="saveto">'+Joomla.JText._("COM_FABRIK_SAVING_TO")+' <span id="csvfile"></span></p>'),e.triggerCSVExport(0)})},makeCSVExportForm:function(){return this.options.csvChoose?(this.csvExportForm=this._csvExportForm(),this.csvExportForm):this._csvAutoStart()},_csvAutoStart:function(){var t=_("<div />").attr({id:"csvmsg"}).html(Joomla.JText._("COM_FABRIK_LOADING")+' <br /><span id="csvcount">0</span> / <span id="csvtotal"></span> '+Joomla.JText._("COM_FABRIK_RECORDS")+".<br/>"+Joomla.JText._("COM_FABRIK_SAVING_TO")+'<span id="csvfile"></span>');return this.csvopts=this.options.csvOpts,this.csvfields=this.options.csvFields,this.triggerCSVExport(-1),t},makeSafeForCSS:function(t){return t.replace(/[^a-z0-9]/g,function(t){var i=t.charCodeAt(0);return 32==i?"-":65<=i&&i<=90?t.toLowerCase():("000"+i.toString(16)).slice(-4)})},_csvYesNo:function(t,i,e,s,o){var n=_("<label />").css({display:"inline-block","margin-left":"15px"}),a=n.clone().append([_("<input />").attr({type:"radio",name:t,value:"1",checked:i}),_("<span />").text(e)]),r=n.clone().append([_("<input />").attr({type:"radio",name:t,value:"0",checked:!i}),_("<span />").text(s)]),l=_("<div>").css({margin:"3px 0px 1px 8px",width:this.exportWindowOpts.optswidth+"px",float:"left"}).text(o),c="opt__"+this.makeSafeForCSS(o);return _('<div class="'+c+'">').css({"border-bottom":"1px solid #dddddd"}).append([l,a,r])},_csvExportForm:function(){var s,t,o=Joomla.JText._("JYES"),n=Joomla.JText._("JNO"),a=this,i=g.liveSite+"/index.php?option=com_fabrik&view=list&listid="+this.id+"&format=csv&Itemid="+this.options.Itemid,r=(_("<label />").css("clear","left"),_("<form />").css("margin-bottom","0px").attr({action:i,method:"post"}).append([this._csvYesNo("excel",this.options.csvOpts.excel,"Excel CSV","CSV",Joomla.JText._("COM_FABRIK_FILE_TYPE")),this._csvYesNo("incfilters",this.options.csvOpts.incfilters,o,n,Joomla.JText._("COM_FABRIK_INCLUDE_FILTERS")),this._csvYesNo("inctabledata",this.options.csvOpts.inctabledata,o,n,Joomla.JText._("COM_FABRIK_INCLUDE_DATA")),this._csvYesNo("incraw",this.options.csvOpts.incraw,o,n,Joomla.JText._("COM_FABRIK_INCLUDE_RAW_DATA")),this._csvYesNo("inccalcs",this.options.csvOpts.inccalcs,o,n,Joomla.JText._("COM_FABRIK_INCLUDE_CALCULATIONS"))]));t=Joomla.JText._("COM_FABRIK_SELECT_COLUMNS_TO_EXPORT"),s="opt__"+a.makeSafeForCSS(t),_("<div />").prop("class",s).text(t).appendTo(r);var l="";return _.each(this.options.labels,function(t,i){if("fabrik_"!==t.substr(0,7)&&"____form_heading"!==t){var e=t.split("___")[0];e!==l&&(l=e,s="opt__"+a.makeSafeForCSS(l),_("<div />").prop("class",s).css({clear:"left","font-weight":"600"}).text(l).appendTo(r)),i=i.replace(/<\/?[^>]+(>|jQuery)/g,""),a._csvYesNo("fields["+t+"]",!0,o,n,i).appendTo(r)}0}),0<this.options.formels.length&&(t=Joomla.JText._("COM_FABRIK_FORM_FIELDS"),s="opt__"+a.makeSafeForCSS(t),_("<div />").prop("class",s).text(t).appendTo(r),this.options.formels.each(function(t){a._csvYesNo("fields["+t.name+"]",!1,o,n,t.label).appendTo(r)})),_("<input />").attr({type:"hidden",name:"view",value:"table"}).appendTo(r),_("<input />").attr({type:"hidden",name:"option",value:"com_fabrik"}).appendTo(r),_("<input />").attr({type:"hidden",name:"listid",value:a.id}).appendTo(r),_("<input />").attr({type:"hidden",name:"format",value:"csv"}).appendTo(r),_("<input />").attr({type:"hidden",name:"c",value:"table"}).appendTo(r),r},triggerCSVExport:function(t,e,i){var s=this;0!==t?-1===t?(t=0,(e=s.csvopts).fields=s.csvfields):(e=s.csvopts,i=s.csvfields):(e||(e={},["incfilters","inctabledata","incraw","inccalcs","excel"].each(function(t){var i=s.csvExportForm.find("input[name="+t+"]");0<i.length&&(e[t]=i.filter(function(){return this.checked})[0].value)})),i||(i={},s.csvExportForm.find("input[name^=field]").each(function(){if(this.checked){var t=this.name.replace("fields[","").replace("]","");i[t]=_(this).val()}})),e.fields=i,s.csvopts=e,s.csvfields=i),(e=this.csvExportFilterOpts(e)).start=t,e.option="com_fabrik",e.view="list",e.format="csv",e.listid=this.id,e.listref=this.options.listRef,e.download=0,e.setListRefFromRequest=1;var o="?Itemid="+this.options.Itemid;this.options.csvOpts.custom_qs.split("&").each(function(t){o+="&"+t}),new Request.JSON({url:o,method:"post",data:e,onError:function(t,i){fconsole(t,i)},onComplete:function(t){if(t.err)window.alert(t.err),g.Windows.exportcsv.close();else if(_("#csvcount").text(t.count),_("#csvtotal").text(t.total),_("#csvfile").text(t.file),t.count<t.total)s.triggerCSVExport(t.count);else{var i;s.options.admin?i=g.liveSite+"administrator/index.php?option=com_fabrik&task=list.view&format=csv&listid="+s.id+"&start="+t.count:(i=s.options.csvOpts.exportLink,i+=i.contains("?")?"&":"?",i+="start="+t.count),i+="&"+s.options.csvOpts.custom_qs;var e='<div class="alert alert-success" style="padding:10px;margin-bottom:3px"><h3>'+Joomla.JText._("COM_FABRIK_CSV_COMPLETE");e+='</h3><p><a class="btn btn-success" href="'+i+'"><i class="icon-download"></i> '+Joomla.JText._("COM_FABRIK_CSV_DOWNLOAD_HERE")+"</a></p></div>",_("#csvmsg").html(e),document.getElements("input.exportCSVButton").removeProperty("disabled"),_("#csvmsg a.btn-success").focusout(function(){g.Windows.exportcsv.close(!0)}),s.csvWindow.fitToContent()}}}).send()},csvExportFilterOpts:function(e){var s,o,n,a,r=0,l=this,c=0,p=["value","condition","join","key","search_type","match","full_words_only","eval","grouped_to_previous","hidden","elementid"];return this.getFilters().each(function(t,i){i=_(i),3<(o=i.prop("name").split("[")).length&&(a=parseInt(o[3].replace("]",""),10),r=r<a?a:r,"checkbox"===i.prop("type")||"radio"===i.prop("type")?i[0].checked&&(e[i.name]=i.val()):e[i.name]=i.val())}),r++,Object.each(this.options.advancedFilters,function(t,i){if(p.contains(i))for(s=c=0;s<t.length;s++)c=s+r,n="fabrik___filter[list_"+l.options.listRef+"]["+i+"]["+c+"]",e[n]="value"===i?l.options.advancedFilters.origvalue[s]:"condition"===i?l.options.advancedFilters.orig_condition[s]:t[s]}),e},addPlugins:function(t){var i=this;t.each(function(t){t.list=i}),this.plugins=t},firePlugin:function(i){var e=Array.prototype.slice.call(arguments),s=this;return e=e.slice(1,e.length),this.plugins.each(function(t){g.fireEvent(i,[s,e])}),!1!==this.result},watchEmpty:function(){var i=this;_(this.form).find(".doempty").on("click",function(t){t.preventDefault(),window.confirm(Joomla.JText._("COM_FABRIK_CONFIRM_DROP"))&&i.submit("list.doempty")})},watchOrder:function(){var r,l,c,p,d=!1,h=_(this.form),f=this,t=h.find(".fabrikorder, .fabrikorder-asc, .fabrikorder-desc");t.off("click"),t.on("click",function(t){var i="",e="",s="",o="",n=_(this),a=n.closest(".fabrik_ordercell");switch("A"!==n.prop("tagName")&&(n=a.find("a")),n.attr("class")){case"fabrikorder-asc":e="fabrikorder-desc",s=n.data("data-sort-desc-icon"),o=n.data("data-sort-asc-icon"),i="desc","orderdesc.png";break;case"fabrikorder-desc":e="fabrikorder",s=n.data("data-sort-icon"),o=n.data("data-sort-desc-icon"),i="-","ordernone.png";break;case"fabrikorder":e="fabrikorder-asc",s=n.data("data-sort-asc-icon"),o=n.data("data-sort-icon"),i="asc","orderasc.png"}a.attr("class").split(" ").each(function(t){t.contains("_order")&&(d=t.replace("_order","").replace(/^\s+/g,"").replace(/\s+$/g,""))}),d?(n.attr("class",e),l=g.bootstrapped?n.find("*[data-isicon]"):(r=n.find("img"),n.firstElementChild),f.options.singleOrdering&&h.find(".fabrikorder, .fabrikorder-asc, .fabrikorder-desc").each(function(t){if(g.bootstrapped)switch(c=t.firstElementChild,t.className){case"fabrikorder-asc":c.removeClass(t.data("sort-asc-icon")),c.addClass(t.data("sort-icon"));break;case"fabrikorder-desc":c.removeClass(t.data("sort-desc-icon")),c.addClass(t.data("sort-icon"))}else 0<(r=t.find("img")).length&&(p=(p=r.attr("src")).replace("ordernone.png","").replace("orderasc.png","").replace("orderdesc.png",""),p+="ordernone.png",r.attr("src",p))}),g.bootstrapped?(l.removeClass(o),l.addClass(s)):r&&(p=(p=r.attr("src")).replace("ordernone.png","").replace("orderasc.png","").replace("orderdesc.png",""),r.attr("src",p)),f.fabrikNavOrder(d,i),t.preventDefault()):fconsole("woops didnt find the element id, cant order")})},getFilters:function(){return _(this.form).find(".fabrik_filter")},storeCurrentValue:function(){"submitform"!==this.options.filterMethod&&this.getFilters().each(function(t,i){(i=_(i)).data("initialvalue",i.val())})},watchFilters:function(){var e="",s=this,t=_(this.form).find(".fabrik_filter_submit");this.getFilters().each(function(t,i){i=_(i),e="SELECT"===i.prop("tagName")||"checkbox"===i.prop("type")?"change":"blur","submitform"!==s.options.filterMethod&&(i.off(e),i.on(e,function(t){t.preventDefault(),"checkbox"!==i.prop("type")&&i.data("initialvalue")===i.val()||s.doFilter()}))}),t.off(),t.on("click",function(t){t.preventDefault(),s.doFilter()}),this.getFilters().on("keydown",function(t){13===t.keyCode&&(t.preventDefault(),s.doFilter())})},doFilter:function(){var t=g.fireEvent("list.filter",[this]).eventResults;null===t&&this.submit("list.filter"),0!==t.length&&t.contains(!1)||this.submit("list.filter")},setActive:function(t){this.list.getElements(".fabrik_row").each(function(t){t.removeClass("activeRow")}),t.addClass("activeRow")},getActiveRow:function(t){var i=_(t.target).closest(".fabrik_row");return 0===i.length&&(i=g.activeRow),i},watchRows:function(){this.list&&this.rowClicks()},getForm:function(){return this.form||(this.form=document.id(this.options.form)),this.form},uncheckAll:function(){_(this.form).find("input[name^=ids]").each(function(t,i){i.checked=""})},submitDeleteCheck:function(){var e=!1,s=0;if(_(this.form).find("input[name^=ids]").each(function(t,i){i.checked&&(s++,e=!0)}),!e)return window.alert(Joomla.JText._("COM_FABRIK_SELECT_ROWS_FOR_DELETION")),g.loader.stop("listform_"+this.options.listRef),!1;var t=1===s?Joomla.JText._("COM_FABRIK_CONFIRM_DELETE_1"):Joomla.JText._("COM_FABRIK_CONFIRM_DELETE").replace("%s",s);return!!window.confirm(t)||(g.loader.stop("listform_"+this.options.listRef),this.uncheckAll(),!1)},submit:function(t){this.getForm();var i=this.options.ajax,e=this,s=_(this.form);if("list.doPlugin.noAJAX"===t&&(i=!(t="list.doPlugin")),"list.delete"===t&&!this.submitDeleteCheck())return!1;if("list.filter"===t?(g["filter_listform_"+this.options.listRef].onSubmit(),this.form.task.value=t,this.form["limitstart"+this.id]&&s.find("#limitstart"+this.id).val(0)):"list.view"===t?g["filter_listform_"+this.options.listRef].onSubmit():""!==t&&(this.form.task.value=t),i){g.loader.start("listform_"+this.options.listRef),s.find("input[name=option]").val("com_fabrik"),s.find("input[name=view]").val("list"),s.find("input[name=format]").val("raw");var o=this.form.toQueryString();if(o+="&setListRefFromRequest=1",o+="&listref="+this.options.listRef,o+="&Itemid="+this.options.Itemid,"list.filter"===t&&!1!==this.advancedSearch){var n=document.getElement("form.advancedSearch_"+this.options.listRef);"null"!==typeOf(n)&&(o+="&"+n.toQueryString(),o+="&replacefilters=1")}for(var a=0;a<this.options.fabrik_show_in_list.length;a++)o+="&fabrik_show_in_list[]="+this.options.fabrik_show_in_list[a];o+="&tmpl="+this.options.tmpl,this.request?this.request.options.data=o:this.request=new Request({url:this.form.get("action"),data:o,onComplete:function(t){t=JSON.parse(t),e._updateRows(t),g.loader.stop("listform_"+e.options.listRef),g["filter_listform_"+e.options.listRef].onUpdateData(),g["filter_listform_"+e.options.listRef].updateFilterCSS(t),_("#searchall_"+e.options.listRef).val(t.searchallvalue),g.fireEvent("fabrik.list.submit.ajax.complete",[e,t]),t.msg&&t.showmsg&&window.alert(t.msg)}}),this.request.send(),window.history&&window.history.pushState&&history.pushState(o,"fabrik.list.submit"),g.fireEvent("fabrik.list.submit",[t,this.form.toQueryString().toObject()])}else this.form.submit();return!1},fabrikNav:function(t){return this.options.limitStart=t,this.form.getElement("#limitstart"+this.id).value=t,g.fireEvent("fabrik.list.navigate",[this,t]),this.result?(this.submit("list.view"),!1):!(this.result=!0)},getRowIds:function(){var i=[];return(this.options.isGrouped?$H(this.options.data):this.options.data).each(function(t){t.each(function(t){i.push(t.data.__pk_val)})}),i},getCheckedRowIds:function(){return this.getForm().getElements("input[name^=ids]").filter(function(t){return t.checked}).map(function(t){return t.get("value")})},getRow:function(s){var o={};return Object.each(this.options.data,function(t){for(var i=0;i<t.length;i++){var e=t[i];e&&e.data.__pk_val===s&&(o=e.data)}}),o},fabrikNavOrder:function(t,i){if(this.form.orderby.value=t,this.form.orderdir.value=i,g.fireEvent("fabrik.list.order",[this,t,i]),!this.result)return!(this.result=!0);this.submit("list.order")},removeRows:function(t){var i,e=this,s=function(){o.dispose(),e.checkEmpty()};for(i=0;i<t.length;i++){var o=document.id("list_"+e.id+"_row_"+t[i]);new Fx.Morph(o,{duration:1e3}).start({backgroundColor:this.options.hightLight}).chain(function(){this.start({opacity:0})}).chain(s)}},editRow:function(){},clearRows:function(){this.list.getElements(".fabrik_row").each(function(t){t.dispose()})},updateRows:function(t){var i=this,e={option:"com_fabrik",view:"list",task:"list.view",format:"raw",listid:this.id,listref:this.options.listRef};e["limit"+this.id]=this.options.limitLength,t&&Object.append(e,t),""!==this.options.groupedBy&&(e.group_by=this.options.groupedBy),new Request({url:"",data:e,evalScripts:!1,onSuccess:function(t){t=t.stripScripts(),t=JSON.parse(t),i._updateRows(t)},onError:function(t,i){fconsole(t,i)},onFailure:function(t){fconsole(t)}}).send()},_updateHeadings:function(t){var e=_("#"+this.options.form).find(".fabrik___heading");_.each(t.headings,function(t,i){t="."+t;try{e.find(t+" span").html(i)}catch(t){fconsole(t)}})},_updateGroupByTables:function(){var e,t=_(this.list).find("tbody");t.css("display",""),t.each(function(t,i){i.hasClass("fabrik_groupdata")||(e=_(i).next(),0===_(e).find(".fabrik_row").length&&(_(i).hide(),_(e).hide()))})},_updateRows:function(t){var s,o,n,a,i,r,l,e,c,p,d=[],h=_(this.form),f=this,u="tr";if("object"===typeOf(t)&&(window.history&&window.history.pushState&&history.pushState(t,"fabrik.list.rows"),t.id===this.id&&"list"===t.model)){this._updateHeadings(t),this.setItemTemplate(),0===(e=_(this.list).find(".fabrik_row").first()).length&&(e=_(this.options.itemTemplate)),u="TR"===e.prop("tagName")?(i=e,a=1,"tr"):(i=e.parent(),a=h.find(".fabrikDataContainer").data("cols"),"div"),a=void 0===a?1:a,l=this.setRowTemplate(i),o=e.clone(),this.clearRows(),this.options.data=this.options.isGrouped?$H(t.data):t.data,t.calculations&&this.updateCals(t.calculations),h.find(".fabrikNav").html(t.htmlnav);var m=this.options.isGrouped||""!==this.options.groupedBy?$H(t.data):t.data,v=0;m.each(function(t,i){for(s=f.options.isGrouped?f.list.getElements(".fabrik_groupdata")[v]:f.tbody,(s=_(s)).children().not(".groupDataMsg").remove(),f.options.isGrouped&&s.prev().find(".groupTitle").html(t[0].groupHeading),d=[],v++,n=0;n<t.length;n++){var e=$H(t[n]);r=f.injectItemData(o,e,u),d.push(r)}for(d=g.Array.chunk(d,a),n=0;n<d.length;n++)p="div"===u?(c=d[n],l.clone().append(c)):d[n],s.append(p)}),this._updateGroupByTables(),this._updateEmptyDataMsg(0===d.length),this.watchAll(!0),g.fireEvent("fabrik.list.updaterows"),g.fireEvent("fabrik.list.update",[this,t]),this.stripe(),this.mediaScan(),g.loader.stop("listform_"+this.options.listRef)}},_updateEmptyDataMsg:function(t){var i=_(this.list),e=i.parent(".fabrikDataContainer"),s=i.closest(".fabrikForm").find(".emptyDataMessage");t?(s.css("display",""),"none"===s.parent().css("display")&&s.parent().css("display",""),s.parent(".emptyDataMessage").css("display","")):(e.css("display",""),s.css("display","none"))},injectItemData:function(o,t,i){var e,n,s,a;if(_.each(t.data,function(t,i){var e;if("A"!==(n=o.find("."+t)).prop("tagName"))n.html(i);else try{e=_(i).prop("href");var s=_(i).data("rowid");_.each(n,function(t,i){0===_(i).data("iscustom")&&(_(i).prop("href",e),_(i).data("rowid",s))})}catch(t){n.prop("href",i)}}),"string"==typeof this.options.itemTemplate){if((s=o.find(".fabrik_row").addBack(o)).prop("id",t.id),"div"!==i){s.removeClass();var r=t.class.split(/\s+/);for(a=0;a<r.length;a++)s.addClass(r[a])}else{s.removeClass("oddRow0"),s.removeClass("oddRow1");r=t.class.split(/\s+/);for(a=0;a<r.length;a++)s.hasClass(r[a])||s.addClass(r[a])}e=o.clone()}else e=o.find(".fabrik_row").addBack(o);return e},mediaScan:function(){"undefined"!=typeof Slimbox&&Slimbox.scanPage(),"undefined"!=typeof Lightbox&&Lightbox.init(),"undefined"!=typeof Mediabox&&Mediabox.scanPage()},addRow:function(t){var i=new Element("tr",{class:"oddRow1"});for(var e in t)if(-1!==this.options.headings.indexOf(e)){var s=new Element("td",{}).appendText(t[e]);i.appendChild(s)}i.inject(this.tbody)},addRows:function(t){var i,e;for(i=0;i<t.length;i++)for(e=0;e<t[i].length;e++)this.addRow(t[i][e]);this.stripe()},stripe:function(){var t,i=this.list.getElements(".fabrik_row");for(t=0;t<i.length;t++)if(!i[t].hasClass("fabrik___header")){var e="oddRow"+t%2;i[t].addClass(e)}},checkEmpty:function(){2===this.list.getElements("tr").length&&this.addRow({label:Joomla.JText._("COM_FABRIK_NO_RECORDS")})},watchCheckAll:function(){var i,e,s,o,t=_(this.form),n=t.find("input[name=checkAll]"),a=this,r=_(this.list);n.on("click",function(t){for(s=0<r.closest(".fabrikList").length?r.closest(".fabrikList"):r,o=s.find("input[name^=ids]"),i=t.target.checked?"checked":"",e=0;e<o.length;e++)o[e].checked=i,a.toggleJoinKeysChx(o[e])}),t.find("input[name^=ids]").each(function(t,i){_(i).on("change",function(){a.toggleJoinKeysChx(i)})})},toggleJoinKeysChx:function(i){i.getParent().getElements("input[class=fabrik_joinedkey]").each(function(t){t.checked=i.checked})},watchNav:function(t){var e,i,s=_(this.form),o=s.find("select[name*=limit]"),n=s.find(".addRecord"),a=this;if(o.on("change",function(){if(g.fireEvent("fabrik.list.limit",[a]),!1===a.result)return!(a.result=!0);a.doFilter()}),this.options.ajax_links&&0<n.size()){n.off(),i=n.prop("href"),e=""===this.options.links.add||i.contains(g.liveSite)?"xhr":"iframe";var r=i;r+=r.contains("?")?"&":"?",r+="tmpl=component&ajax=1",r+="&format=partial",n.on("click",function(t){t.preventDefault();var i={id:"add."+a.id,title:a.options.popup_add_label,loadMethod:e,contentURL:r,width:a.options.popup_width,height:a.options.popup_height};null!==a.options.popup_offset_x&&(i.offset_x=a.options.popup_offset_x),null!==a.options.popup_offset_y&&(i.offset_y=a.options.popup_offset_y),g.getWindow(i)})}_("#fabrik__swaptable").on("change",function(){window.location="index.php?option=com_fabrik&task=list.view&cid="+this.value});var l=s.find(".pagination .pagenav");0===l.length&&(l=s.find(".pagination a")),_(l).on("click",function(t){if(t.preventDefault(),"A"===this.tagName){var i=this.href.toObject();a.fabrikNav(i["limitstart"+a.id])}}),this.watchCheckAll()},updateCals:function(i){var t=["sums","avgs","count","medians"];this.form.getElements(".fabrik_calculations").each(function(s){t.each(function(t){$H(i[t]).each(function(t,i){var e=s.getElement("."+i);"null"!==typeOf(e)&&e.set("html",t)})})})}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
