<<<<<<< HEAD
/**
 * Form
 *
 * @copyright: Copyright (C) 2005-2013, fabrikar.com - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

define(['jquery', 'fab/encoder', 'fab/fabrik', 'lib/debounce/jquery.ba-throttle-debounce'],
    function (jQuery, Encoder, Fabrik, Debounce) {
    var FbForm = new Class({

        Implements: [Options, Events],

        options: {
            'rowid'         : '',
            'admin'         : false,
            'ajax'          : false,
            'primaryKey'    : null,
            'error'         : '',
            'submitOnEnter' : false,
            'updatedMsg'    : 'Form saved',
            'pages'         : [],
            'start_page'    : 0,
            'multipage_save': 0,
            'ajaxValidation': false,
            'showLoader'    : false,
            'customJsAction': '',
            'plugins'       : {},
            'ajaxmethod'    : 'post',
            'inlineMessage' : true,
            'print'         : false,
            'toggleSubmit'  : false,
            'toggleSubmitTip': 'must validate',
            'mustValidate'  : false,
            'lang'          : false,
            'debounceDelay' : 500,
            'images'        : {
                'alert'       : '',
                'action_check': '',
                'ajax_loader' : ''
            }
        },

        initialize: function (id, options) {
            // $$$ hugh - seems options.rowid can be null in certain corner cases, so defend against that
            if (typeOf(options.rowid) === 'null') {
                options.rowid = '';
            }
            this.id = id;
            //set this to false in window.fireEvents to stop current action (e.g. stop form submission)
            this.result = true;
            this.setOptions(options);
            this.options.pages = $H(this.options.pages);
            this.subGroups = $H({});
            this.currentPage = this.options.start_page;
            this.formElements = $H({});
            this.hasErrors = $H({});
            this.mustValidateEls = $H({});
            this.toggleSubmitTipAdded = false;
            this.elements = this.formElements;
            this.duplicatedGroups = $H({});
            this.addingOrDeletingGroup = false;
            this.addedGroups = [];
	        this.watchRepeatNumsDone = false;
            this.fx = {};
            this.fx.elements = [];
            this.fx.hidden = [];
            this.fx.validations = {};
            this.setUpAll();
            this._setMozBoxWidths();

            if (this.options.editable) {
                (function () {
                    this.duplicateGroupsToMin();
                }.bind(this)).delay(1000);
            }

            // Delegated element events
            this.events = {};

            this.submitBroker = new FbFormSubmit();
            this.scrollTips();
            Fabrik.fireEvent('fabrik.form.loaded', [this]);
        },

        _setMozBoxWidths: function () {
            if (Browser.firefox && this.getForm()) {
                //as firefox treats display:-moz-box as display:-moz-box-inline we have to programatically set their widths
                this.getForm().getElements('.fabrikElementContainer > .displayBox').each(function (b) {
                    var computed = b.getParent().getComputedSize();
                    //remove margins/paddings from width
                    var x = b.getParent().getSize().x - (computed.computedLeft + computed.computedRight);
                    var w = b.getParent().getSize().x === 0 ? 400 : x;
                    b.setStyle('width', w + 'px');
                    var e = b.getElement('.fabrikElement');
                    if (typeOf(e) !== 'null') {
                        x = 0;
                        b.getChildren().each(function (c) {
                            if (c !== e) {
                                x += c.getSize().x;
                            }
                        });
                        e.setStyle('width', w - x - 10 + 'px');
                    }

                });
            }
        },

        setUpAll: function () {
            this.setUp();

	        // add a wrapper if we're going to be using the tooltip, as can't do tooltip on disabled elements
	        if (this.options.ajaxValidation && this.options.toggleSubmit && this.options.toggleSubmitTip !== '') {
		        var submit = this._getButton('Submit');
		        if (typeOf(submit) !== 'null') {
			        jQuery(submit).wrap('<div data-toggle="tooltip" title="' + Joomla.JText._('COM_FABRIK_MUST_VALIDATE') +
                        '" class="fabrikSubmitWrapper" style="display: inline-block"></div>div>');
		        }
	        }

            this.winScroller = new Fx.Scroll(window);
            if (this.form) {
                if (this.options.ajax || this.options.submitOnEnter === false) {
                    this.stopEnterSubmitting();
                }
                this.watchAddOptions();
            }

            if (this.options.editable) {
                $H(this.options.hiddenGroup).each(function (v, k) {
                    if (v === true && typeOf(document.id('group' + k)) !== 'null') {
                        var subGroup = document.id('group' + k).getElement('.fabrikSubGroup');
                        this.subGroups.set(k, subGroup.cloneWithIds());
                        this.hideLastGroup(k, subGroup);
                    }
                }.bind(this));

                this.setupSortable();
            }

            // get an int from which to start incrementing for each repeated group id
            // don't ever decrease this value when deleting a group as it will cause all sorts of
            // reference chaos with cascading dropdowns etc.
            this.repeatGroupMarkers = $H({});
            if (this.form) {
                this.form.getElements('.fabrikGroup').each(function (group) {
                    var id = group.id.replace('group', '');
                    var c = group.getElements('.fabrikSubGroup').length;
                    //if no joined repeating data then c should be 0 and not 1
                    if (c === 1) {
                        if (group.getElement('.fabrikSubGroupElements').getStyle('display') === 'none') {
                            c = 0;
                        }
                    }
                    this.repeatGroupMarkers.set(id, c);
                }.bind(this));
                this.watchGoBackButton();
            }


            this.watchPrintButton();
            this.watchPdfButton();
            this.watchTabs();
            this.watchRepeatNums();
        },

        watchRepeatNums: function () {
	        Fabrik.addEvent('fabrik.form.elements.added', function (form) {
	            if (form.id === this.id && !this.watchRepeatNumsDone) {
		            Object.each(this.options.numRepeatEls, function (name, key) {
			            if (name !== '') {
				            var el = this.formElements.get(name);
				            if (el) {
                                el.addNewEventAux(el.getChangeEvent(), function(event) {
                                    var v = el.getValue();
                                    this.options.minRepeat[key] = v.toInt();
	                                this.options.maxRepeat[key] = v.toInt();
	                                this.duplicateGroupsToMin();
                                }.bind(this, el, key));
				            }
			            }
		            }.bind(form));
		            this.watchRepeatNumsDone = true;
	            }
	        }.bind(this));
        },

        /**
         * Print button action - either open up the print preview window - or print if already opened
         */
        watchPrintButton: function () {
            this.form.getElements('a[data-fabrik-print]').addEvent('click', function (e) {
                e.stop();
                if (this.options.print) {
                    window.print();
                } else {
                    // Build URL as we could have changed the rowid via ajax pagination
                    var url = jQuery(e.target).prop('href');
                    url = url.replace(/&rowid=\d+/, '&rowid=' + this.options.rowid);
                    if (this.options.lang !== false) {
                        if (url.test(/\?/)) {
	                        url += '&lang=' + this.options.lang;
                        }
                        else {
	                        url += '?lang=' + this.options.lang;
                        }
                    }
                    window.open(
                        url,
                        'win2',
                        'status=no,toolbar=no,scrollbars=yes,titlebar=no,menubar=no,resizable=yes,width=400,height=350,directories=no,location=no;'
                    );
                }
            }.bind(this));
        },

        /**
         * PDF button action.
         */
        watchPdfButton: function () {
            this.form.getElements('*[data-role="open-form-pdf"]').addEvent('click', function (e) {
                e.stop();
                // Build URL as we could have changed the rowid via ajax pagination.
                // @FIXME for SEF
                var url = e.event.currentTarget.href.replace(/(rowid=\d*)/, 'rowid=' + this.options.rowid);
                if (this.options.lang !== false) {
	                if (url.test(/\?/)) {
		                url += '&lang=' + this.options.lang;
	                }
	                else {
		                url += '?lang=' + this.options.lang;
	                }                }
                window.location = url;
            }.bind(this));
        },

        /**
         * Go back button in ajax pop up window should close the window
         */
        watchGoBackButton: function () {
            if (this.options.ajax) {
                var goback = this._getButton('Goback');
                if (typeOf(goback) === 'null') {
                    return;
                }
                goback.addEvent('click', function (e) {
                    e.stop();
                    if (Fabrik.Windows[this.options.fabrik_window_id]) {
                        Fabrik.Windows[this.options.fabrik_window_id].close();
                    }
                    else {
                        // $$$ hugh - http://fabrikar.com/forums/showthread.php?p=166140#post166140
                        window.history.back();
                    }
                }.bind(this));
            }
        },

        watchAddOptions: function () {
            this.fx.addOptions = [];
            this.getForm().getElements('.addoption').each(function (d) {
                var a = d.getParent('.fabrikElementContainer').getElement('.toggle-addoption');
                var mySlider = new Fx.Slide(d, {
                    duration: 500
                });
                mySlider.hide();
                a.addEvent('click', function (e) {
                    e.stop();
                    mySlider.toggle();
                });
            });
        },

        setUp: function () {
            this.form = this.getForm();
            this.watchGroupButtons();
            // Submit can appear in confirmation plugin even when readonly
            this.watchSubmit();
            this.createPages();
            this.watchClearSession();
        },

        getForm: function () {
            if (typeOf(this.form) === 'null') {
                this.form = document.id(this.getBlock());
            }

            return this.form;
        },

        getBlock: function () {
            if (typeOf(this.block) === 'null') {
                this.block = this.options.editable === true ? 'form_' + this.id : 'details_' + this.id;
                if (this.options.rowid !== '') {
                    this.block += '_' + this.options.rowid;
                }
            }

            return this.block;
        },

        /**
         * Attach an effect to an elements
         *
         * @param {string}  id      Element or group to apply the fx TO, triggered from another element
         * @param {string}  method  JS event which triggers the effect (click,change etc.)
         *
         * @return {*} false if no element found or element fx
         */
        addElementFX: function (id, method) {
            var c, k, fxdiv;
            id = id.replace('fabrik_trigger_', '');
            // Paul - add sanity checking and error reporting
            if (id.slice(0, 6) === 'group_') {
                id = id.slice(6, id.length);
                k = id;
                c = document.id(id);

                if (!c) {
                    fconsole('Fabrik form::addElementFX: Group "' + id + '" does not exist.');
                    return false;
                }
            } else if (id.slice(0, 8) === 'element_') {
                id = id.slice(8, id.length);
                k = 'element' + id;
                c = document.id(id);
                if (!c) {
                    fconsole('Fabrik form::addElementFX: Element "' + id + '" does not exist.');
                    return false;
                }
                c = c.getParent('.fabrikElementContainer');
                if (!c) {
                    fconsole('Fabrik form::addElementFX: Element "' + id + '.fabrikElementContainer" does not exist.');
                    return false;
                }
            } else {
                fconsole('Fabrik form::addElementFX: Not an element or group: ' + id);
                return false;
            }
            if (c) {
                // c will be the <li> element - you can't apply fx's to this as it makes the
                // DOM squiffy with multi column rows, so get the li's content and put it
                // inside a div which is injected into c
                // apply fx to div rather than li - damn I'm good
                var tag = (c).get('tag');
                if (tag === 'li' || tag === 'td') {
                    fxdiv = new Element('div', {'style': 'width:100%'}).adopt(c.getChildren());
                    c.empty();
                    fxdiv.inject(c);
                } else {
                    fxdiv = c;
                }

                var opts = {
                    duration  : 800,
                    transition: Fx.Transitions.Sine.easeInOut
                };
                if (typeOf(this.fx.elements[k]) === 'null') {
                    this.fx.elements[k] = {};
                }

                this.fx.elements[k].css = new Fx.Morph(fxdiv, opts);

                if (typeOf(fxdiv) !== 'null' && (method === 'slide in' || method === 'slide out' || method === 'slide toggle')) {
                    this.fx.elements[k].slide = new Fx.Slide(fxdiv, opts);
                }

                return this.fx.elements[k];
            }
            return false;
        },

        /**
         * An element state has changed, so lets run any associated effects
         *
         * @param   {string}  id            Element id to run the effect on
         * @param   {string}  method        Method to run
         * @param   {object}  elementModel  The element JS object which is calling the fx, this is used to work ok which
         *                                  repeat group the fx is applied on
         */

        doElementFX: function (id, method, elementModel) {
            var k, groupfx, fx, fxElement;

            // Could be the source element is in a repeat group but the target is not.
            var target = this.formElements.get(id.replace('fabrik_trigger_element_', '')),
                targetInRepeat = true;
            if (target) {
                targetInRepeat = target.options.inRepeatGroup;
            }

            if (id.slice(0, 21) === 'fabrik_trigger_group_') {
                groupfx = true;
            }
            else {
                groupfx = false;
            }

            // Update the element id that we will apply the fx to to be that of the calling elementModels group
            // (if in a repeat group)
            if (elementModel && targetInRepeat && !groupfx) {
                if (elementModel.options.inRepeatGroup) {
                    var bits = id.split('_');
                    bits[bits.length - 1] = elementModel.options.repeatCounter;
                    id = bits.join('_');
                }
            }

            // Create the fx key
            id = id.replace('fabrik_trigger_', '');
            if (id.slice(0, 6) === 'group_') {
                id = id.slice(6, id.length);
                // weird fix?
                if (id.slice(0, 6) === 'group_') {
                    id = id.slice(6, id.length);
                }
                k = id;
            } else {
                id = id.slice(8, id.length);
                k = 'element' + id;
            }

            // Get the stored fx
            fx = this.fx.elements[k];
            if (!fx) {
                // A group was duplicated but no element FX added, lets try to add it now
                fx = this.addElementFX('element_' + id, method);

                // If it wasn't added then lets get out of here
                if (!fx) {
                    return;
                }
            }
            // Seems dropdown element fx.css.element is already the container
            if (groupfx || fx.css.element.hasClass('fabrikElementContainer')) {
                fxElement = fx.css.element;
            } else {
                fxElement = fx.css.element.getParent('.fabrikElementContainer');
            }

            // For repeat groups rendered as tables we cant apply fx on td so get child
            if (fxElement.get('tag') === 'td') {
                fxElement = fxElement.getChildren()[0];
            }
            switch (method) {
                case 'show':
                    fxElement.fade('show').removeClass('fabrikHide');
                    if (groupfx) {
                        // strange fix for ie8
                        // http://fabrik.unfuddle.com/projects/17220/tickets/by_number/703?cycle=true
                        document.id(id).getElements('.fabrikinput').setStyle('opacity', '1');
                        this.showGroupTab(id);
                        // if it was hidden by group's "Show Group" setting ("Yes, but hidden"), need to show()
                        fxElement.show();
                    }
                    break;
                case 'hide':
                    fxElement.fade('hide').addClass('fabrikHide');
                    if (groupfx) {
                        this.hideGroupTab(id);
                    }
                    break;
                case 'fadein':
                    fxElement.removeClass('fabrikHide');
                    if (fx.css.lastMethod !== 'fadein') {
                        fx.css.element.show();
                        fx.css.start({'opacity': [0, 1]});
                    }
	                if (groupfx) {
		                this.showGroupTab(id);
                        fxElement.show();
	                }
                    break;
                case 'fadeout':
                    if (fx.css.lastMethod !== 'fadeout') {
                        fx.css.start({'opacity': [1, 0]}).chain(function () {
                            fx.css.element.hide();
                            fxElement.addClass('fabrikHide');
                        });
                    }
	                if (groupfx) {
		                this.hideGroupTab(id);
	                }
                    break;
                case 'slide in':
                    fx.slide.slideIn();
                    break;
                case 'slide out':
                    fx.slide.slideOut();
                    fxElement.removeClass('fabrikHide');
                    break;
                case 'slide toggle':
                    fx.slide.toggle();
                    break;
                case 'clear':
                    this.formElements.get(id).clear();
                    break;
                case 'disable':
                    if (!groupfx) {
                        jQuery('#' + id).prop('disabled', true);
                    }
                    break;
                case 'enable':
                    if (!groupfx) {
                        jQuery('#' + id).prop('disabled', false);
                    }
                    break;
                case 'readonly':
                    if (!groupfx) {
                        // can't "readonly" a select, so disable all but selected option instead
                        if (jQuery('#' + id).prop('tagName') === 'SELECT') {
                            jQuery('#' + id + ' option:not(:selected)').attr('disabled', true);
                        }
                        else {
                            jQuery('#' + id).prop('readonly', true);
                        }
                    }
                    break;
                case 'notreadonly':
                    if (!groupfx) {
                        if (jQuery('#' + id).prop('tagName') === 'SELECT') {
                            jQuery('#' + id + ' option').attr('disabled', false);
                        }
                        else {
                            jQuery('#' + id).prop('readonly', false);
                        }
                    }
                    break;
            }
            fx.lastMethod = method;
            Fabrik.fireEvent('fabrik.form.doelementfx', [this, method, id, groupfx]);
        },

        /**
         * Get a group's tab, if it exists
         *
         * These tab functions are currently just helpers for user scripts
         *
         * @param  {string}  groupId  group ID
         *
         * @return tab | false
         */
        getGroupTab: function (groupId) {
            if (!groupId.test(/^group/)) {
                groupId = 'group' + groupId;
            }
            if (document.id(groupId).getParent().hasClass('tab-pane')) {
                var tabid = document.id(groupId).getParent().id;
                var tab_anchor = this.form.getElement('a[href=#' + tabid + ']');
                return tab_anchor.getParent();
            }
            return false;
        },

        /**
         * Hide a group's tab, if it exists
         *
         * @param  {string}  groupId
         */
        hideGroupTab: function (groupId) {
            var tab = this.getGroupTab(groupId);
            if (tab !== false) {
                jQuery(tab).hide();
                if (tab.hasClass('active')) {
                    if (tab.getPrevious()) {
                        jQuery(tab.getPrevious().getFirst()).tab('show');
                    }
                    else if (tab.getNext()) {
                        jQuery(tab.getNext().getFirst()).tab('show');
                    }
                }
            }
        },

        /**
         * Hide a group's tab, if it exists
         *
         * @param  {string}  groupId
         */
        selectGroupTab: function (groupId) {
            var tab = this.getGroupTab(groupId);
            if (tab !== false) {
                if (!tab.hasClass('active')) {
                    jQuery(tab.getFirst()).tab('show');
                }
            }
        },

        /**
         * Hide a group's tab, if it exists
         *
         * @param  {string}  groupId
         */
        showGroupTab: function (groupId) {
            var tab = this.getGroupTab(groupId);
            if (tab !== false) {
                jQuery(tab).show();
            }
        },

        /**
         * Convenience for custom code that needs to fire when a tab is changed
         */
        watchTabs: function () {
            var self = this;

            jQuery(this.form).on('click', '*[data-role=fabrik_tab]', function (event) {
                var groupId = event.target.id.match(/group(\d+)_tab/);
                if (groupId.length > 1) {
                    groupId = groupId[1];
                }
                Fabrik.fireEvent('fabrik.form.tab.click', [self, groupId, event], 500);
            });
        },

        /**
         * If a user has previously started a multi-page form, then we will have a .clearSession
         * button which resets the form and submits it using the removeSession task.
         */
        watchClearSession: function () {
	        if (this.options.multipage_save === 0) {
		        return;
	        }

            var self = this,
                form = jQuery(this.form);

            form.find('.clearSession').on('click', function (e) {
                e.preventDefault();
                form.find('input[name=task]').val('removeSession');
                self.clearForm();
                self.form.submit();
            });
        },

        createPages: function () {
            var submit, p, firstGroup, tabDiv;
            if (this.isMultiPage()) {

                // Wrap each page in its own div
                this.options.pages.each(function (page, i) {
                    p = jQuery(document.createElement('div'));
                    p.attr({
                        'class': 'page',
                        'id'   : 'page_' + i
                    });
                    firstGroup = jQuery('#group' + page[0]);

                    // Paul - Don't use pages if this is a bootstrap_tab form
                    tabDiv = firstGroup.closest('div');
                    if (tabDiv.hasClass('tab-pane')) {
                        return;
                    }
                    p.insertBefore(firstGroup);
                    page.each(function (group) {
                        p.append(jQuery('#group' + group));
                    });
                });
                submit = this._getButton('Submit');
                if (submit && this.options.rowid === '') {
                    submit.disabled = 'disabled';
                    submit.setStyle('opacity', 0.5);
                }
                var self = this;
                jQuery(this.form).on('click', '.fabrikPagePrevious', function (e) {
                    self._doPageNav(e, -1);
                });
                jQuery(this.form).on('click', '.fabrikPageNext', function (e) {
                    self._doPageNav(e, 1);
                });
                this.setPageButtons();
                this.hideOtherPages();
            }
        },

        isMultiPage: function () {
            return this.options.pages.getKeys().length > 1;
        },

        /**
         * Move forward/backwards in multi-page form
         *
         * @param   {event}  e
         * @param   {int}    dir  1/-1
         */
        _doPageNav: function (e, dir) {
            var self = this, url, d;
            if (this.options.editable) {
                if (typeOf(this.form.getElement('.fabrikMainError')) !== 'null') {
                    this.form.getElement('.fabrikMainError').addClass('fabrikHide');
                }

                // If tip shown at bottom of long page and next page shorter we need to move the tip to
                // the top of the page to avoid large space appearing at the bottom of the page.
                jQuery('.tool-tip').css('top', 0);

                // Don't prepend with Fabrik.liveSite, as it can create cross origin browser errors if
                // you are on www and livesite is not on www.
                url = 'index.php?option=com_fabrik&format=raw&task=form.ajax_validate&form_id=' + this.id;
                if (this.options.lang !== false) {
                    url += '&lang=' + this.options.lang;
                }

                Fabrik.loader.start(this.getBlock(), Joomla.JText._('COM_FABRIK_VALIDATING'));
                this.clearErrors();

                d = jQuery.extend({}, this.getFormData(), {
                    task: 'form.ajax_validate',
                    fabrik_ajax: '1',
                    format : 'raw'
                });

                d = this._prepareRepeatsForAjax(d);

                jQuery.ajax({
                    'url' : url,
                    method: this.options.ajaxmethod,
                    data  : d,

                }).done(function (r) {
                    Fabrik.loader.stop(self.getBlock());
                    r = JSON.parse(r);

                    // Don't show validation errors if we are going back a page
                    if (dir === -1 || self._showGroupError(r, d) === false) {
                        self.changePage(dir);
                        self.saveGroupsToDb();
                    }
                    jQuery('html, body').animate({
                        scrollTop: jQuery(self.form).offset().top
                    }, 300);
                });
            } else {
                this.changePage(dir);
            }
            e.preventDefault();
        },

        /**
         * On a multi-page form save the group data
         */
        saveGroupsToDb: function () {
            var self = this, orig, origProcess, url, data,
                format = this.form.querySelector('input[name=format]'),
                task = this.form.querySelector('input[name=task]'),
                block = this.getBlock();
            if (this.options.multipage_save === 0) {
                return;
            }
            Fabrik.fireEvent('fabrik.form.groups.save.start', [this]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            orig = format.value;
            origProcess = task.value;
            this.form.querySelector('input[name=format]').value = 'raw';
            this.form.querySelector('input[name=task]').value = 'form.savepage';

            url = 'index.php?option=com_fabrik&format=raw&page=' + this.currentPage;
            if (this.options.lang !== false) {
                url += '&lang=' + this.options.lang;
            }
            Fabrik.loader.start(block, 'saving page');
            data = this.getFormData();
            data.fabrik_ajax = 1;
            jQuery.ajax({
                url       : url,
                method    : this.options.ajaxmethod,
                data      : data,

            }).done(function (r) {
                Fabrik.fireEvent('fabrik.form.groups.save.completed', [self]);
                if (self.result === false) {
                    self.result = true;
                    return;
                }
                format.value = orig;
                task.value = origProcess;
                if (self.options.ajax) {
                    Fabrik.fireEvent('fabrik.form.groups.save.end', [self, r]);
                }
                Fabrik.loader.stop(block);
            });
        },

        changePage: function (dir) {
            this.changePageDir = dir;
            Fabrik.fireEvent('fabrik.form.page.change', [this, dir]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            this.currentPage = this.currentPage.toInt();
            if (this.currentPage + dir >= 0 && this.currentPage + dir < this.options.pages.getKeys().length) {
                this.currentPage = this.currentPage + dir;
                if (!this.pageGroupsVisible()) {
                    this.changePage(dir);
                }
            }

            this.setPageButtons();
            jQuery('#page_' + this.currentPage).css('display', '');
            this._setMozBoxWidths();
            this.hideOtherPages();
            Fabrik.fireEvent('fabrik.form.page.chage.end', [this, dir]);
            Fabrik.fireEvent('fabrik.form.page.change.end', [this, dir]);
            if (this.result === false) {
                this.result = true;
                return;
            }
        },

        pageGroupsVisible: function () {
            var visible = false;
            this.options.pages.get(this.currentPage).each(function (gid) {
                var group = jQuery('#group' + gid);
                if (group.length > 0) {
                    if (group.css('display') !== 'none') {
                        visible = true;
                    }
                }
            });
            return visible;
        },

        /**
         * Hide all groups except those in the active page
         */
        hideOtherPages: function () {
            var page, currentPage = parseInt(this.currentPage, 10);
            this.options.pages.each(function (gids, i) {
                if (parseInt(i, 10) !== currentPage) {
                    page = jQuery('#page_' + i);
                    page.hide();
                }
            });
        },

        setPageButtons: function () {
            var submit = this._getButton('Submit');
            var prevs = this.form.getElements('.fabrikPagePrevious');
            var nexts = this.form.getElements('.fabrikPageNext');
            nexts.each(function (next) {
                if (this.currentPage === this.options.pages.getKeys().length - 1) {
                    if (typeOf(submit) !== 'null') {
                        submit.disabled = '';
                        submit.setStyle('opacity', 1);
                    }
                    next.disabled = 'disabled';
                    next.setStyle('opacity', 0.5);
                } else {
                    if (typeOf(submit) !== 'null' && (this.options.rowid === '' ||
                        this.options.rowid.toString() === '0')) {
                        submit.disabled = 'disabled';
                        submit.setStyle('opacity', 0.5);
                    }
                    next.disabled = '';
                    next.setStyle('opacity', 1);
                }
            }.bind(this));
            prevs.each(function (prev) {
                if (this.currentPage === 0) {
                    prev.disabled = 'disabled';
                    prev.setStyle('opacity', 0.5);
                } else {
                    prev.disabled = '';
                    prev.setStyle('opacity', 1);
                }
            }.bind(this));
        },

        destroyElements: function () {
            this.formElements.each(function (el) {
                el.destroy();
            });
        },

        /**
         * Add elements into the form
         *
         * @param  Hash  a  Elements to add.
         */
        addElements: function (a) {
            /*
             * Store the newly added elements so we can call attachedToForm only on new elements.
             * Avoids issue with cdd in repeat groups resetting themselves when you add a new group
             */
            var added = [], i = 0;
            a = $H(a);
            a.each(function (elements, gid) {
                elements.each(function (el) {
                    if (typeOf(el) === 'array') {
                        if (typeOf(document.id(el[1])) === 'null') {
                            fconsole('Fabrik form::addElements: Cannot add element "' + el[1] +
                                '" because it does not exist in HTML.');
                            return;
                        }
                        try {
                            var oEl = new window[el[0]](el[1], el[2]);
                        }
                        catch (err) {
                            fconsole('Fabrik form::addElements: Cannot add element "' + el[1] +
                                '" of type "' + el[0] + '" because: ' + err.message);
                            return;
                        }
                        added.push(this.addElement(oEl, el[1], gid));
                    }
                    else if (typeOf(el) === 'object') {
                        if (typeOf(document.id(el.options.element)) === 'null') {
                            fconsole('Fabrik form::addElements: Cannot add element "' +
                                el.options.element + '" because it does not exist in HTML.');
                            return;
                        }
                        added.push(this.addElement(el, el.options.element, gid));
                    }
                    else if (typeOf(el) !== 'null') {
                        fconsole('Fabrik form::addElements: Cannot add unknown element: ' + el);
                    }
                    else {
                        fconsole('Fabrik form::addElements: Cannot add null element.');
                    }
                }.bind(this));
            }.bind(this));
            // $$$ hugh - moved attachedToForm calls out of addElement to separate loop, to fix forward reference issue,
            // i.e. calc element adding events to other elements which come after itself, which won't be in formElements
            // yet if we do it in the previous loop ('cos the previous loop is where elements get added to formElements)
            for (i = 0; i < added.length; i++) {
                if (typeOf(added[i]) !== 'null') {
                    try {
                        added[i].attachedToForm();
                    } catch (err) {
                        fconsole(added[i].options.element + ' attach to form:' + err);
                    }
                }
            }
            Fabrik.fireEvent('fabrik.form.elements.added', [this]);
        },

        addElement: function (oEl, elId, gid) {
            elId = oEl.getFormElementsKey(elId);
            elId = elId.replace('[]', '');

            var ro = elId.substring(elId.length - 3, elId.length) === '_ro';
            oEl.form = this;
            oEl.groupid = gid;
            this.formElements.set(elId, oEl);
            Fabrik.fireEvent('fabrik.form.element.added', [this, elId, oEl]);
            if (ro) {
                elId = elId.substr(0, elId.length - 3);
                this.formElements.set(elId, oEl);
            }
            this.submitBroker.addElement(elId, oEl);
            return oEl;
        },

        /**
         * Dispatch an event to an element
         *
         * @param   string  elementType  Deprecated
         * @param   string  elementId    Element key to look up in this.formElements
         * @param   string  action       Event change/click etc.
         * @param   mixed   js           String or function
         */

        dispatchEvent: function (elementType, elementId, action, js) {
            if (typeOf(js) === 'string') {
                js = Encoder.htmlDecode(js);
            }
            var el = this.formElements.get(elementId);
            if (!el) {
                // E.g. db join rendered as chx
                var els = Object.each(this.formElements, function (e) {
                    if (elementId === e.baseElementId) {
                        el = e;
                    }
                });
            }
            if (!el) {
                fconsole('Fabrik form::dispatchEvent: Cannot find element to add ' + action + ' event to: ' + elementId);
            }
            else if (js !== '') {
                el.addNewEvent(action, js);
            }
            else if (Fabrik.debug) {
                fconsole('Fabrik form::dispatchEvent: Javascript empty for ' + action + ' event on: ' + elementId);
            }
        },

        action: function (task, el) {
            var oEl = this.formElements.get(el);
            Browser.exec('oEl.' + task + '()');
        },

        triggerEvents: function (el) {
            this.formElements.get(el).fireEvents(arguments[1]);
        },

        /**
         * If Ajax validations are turned on the watch the elements and their sub-elements
         *
         * @param {string}  id            Element id to observe
         * @param {string}  triggerEvent  Event type to add
         */
        watchValidation: function (id, triggerEvent) {
            var self = this,
                el = jQuery('#' + id);
            if (this.options.ajaxValidation === false) {
                return;
            }
            if (el.length === 0) {
                fconsole('Fabrik form::watchValidation: Could not add ' + triggerEvent + ' event because element "' +
                    id + '" does not exist.');
                return;
            }
            el = this.formElements.get(id);
            el.addAjaxValidation();
        },

        /**
         * as well as being called from watchValidation can be called from other
         * element js actions, e.g. date picker closing
         *
         * @param  {event}   e           the event
         * @param  {bool}    subEl       has sub elements
         * @param  {string}  replacetxt  additional text on the value field, like _time
         */
        doElementValidation: function (e, subEl, replacetxt) {
            var id;
            if (this.options.ajaxValidation === false) {
                return;
            }
            replacetxt = typeOf(replacetxt) === 'null' ? '_time' : replacetxt;
            if (typeOf(e) === 'event' || typeOf(e) === 'object' || typeOf(e) === 'domevent') { // type object in
                id = e.target.id;
                // for elements with subelements e.g. checkboxes radiobuttons
                if (subEl === true) {
                    id = document.id(e.target).getParent('.fabrikSubElementContainer').id;
                }
            } else {
                // hack for closing date picker where it seems the event object isn't
                // available
                id = e;
            }

            if (typeOf(document.id(id)) === 'null') {
                return;
            }
            if (document.id(id).getProperty('readonly') === true ||
                document.id(id).getProperty('readonly') === 'readonly') {
                // stops date element being validated
                // return;
            }
            var el = this.formElements.get(id);
            if (!el) {
                //silly catch for date elements you cant do the usual method of setting the id in the
                //fabrikSubElementContainer as its required to be on the date element for the calendar to work
                id = id.replace(replacetxt, '');
                el = this.formElements.get(id);
                if (!el) {
                    return;
                }
            }

            if (!el.shouldAjaxValidate())
            {
                return;
            }

            Fabrik.fireEvent('fabrik.form.element.validation.start', [this, el, e]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            el.setErrorMessage(Joomla.JText._('COM_FABRIK_VALIDATING'), 'fabrikValidating');

            var d = $H(this.getFormData());
            d.set('task', 'form.ajax_validate');
            d.set('fabrik_ajax', '1');
            d.set('format', 'raw');
            if (this.options.lang !== false) {
                d.set('lang', this.options.lang);
            }
            d = this._prepareRepeatsForAjax(d);

            // $$$ hugh - nasty hack, because validate() in form model will always use _0 for
            // repeated id's
            var origid = id;
            if (el.origId) {
                origid = el.origId + '_0';
            }
            el.options.repeatCounter = el.options.repeatCounter ? el.options.repeatCounter : 0;

            var myAjax = new Request({
                url       : '',
                method    : this.options.ajaxmethod,
                data      : d,
                onComplete: function (e) {
                    this._completeValidaton(e, id, origid);
                }.bind(this)
            }).send();
        },

        /**
         * Run once a validation is completed
         * @param {string} r
         * @param {string} id
         * @param {string} origid
         * @private
         */
        _completeValidaton: function (r, id, origid) {
            r = JSON.parse(r);
            if (typeOf(r) === 'null') {
                this._showElementError(['Oups'], id);
                this.result = true;
                return;
            }
            this.formElements.each(function (el, key) {
                el.afterAjaxValidation();
            });
            Fabrik.fireEvent('fabrik.form.element.validation.complete', [this, r, id, origid]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            var el = this.formElements.get(id);
            if ((typeOf(r.modified[origid]) !== 'null')) {
                if (el.options.inRepeatGroup) {
                    el.update(r.modified[origid][el.options.repeatCounter]);
                }
                else {
                    el.update(r.modified[origid]);
                }
            }
            if (typeOf(r.errors[origid]) !== 'null') {
                this._showElementError(r.errors[origid][el.options.repeatCounter], id);
            } else {
                this._showElementError([], id);
            }

            if (this.options.toggleSubmit) {
                if (this.options.mustValidate) {
                    if (!this.hasErrors.has(id) || !this.hasErrors.get(id)) {
                        this.mustValidateEls[id] = false;
                    }
                    if (!this.mustValidateEls.hasValue(true)) {
                        this.toggleSubmit(true);
                    }
                }
                else {
                    this.toggleSubmit(this.hasErrors.getKeys().length === 0);
                }
            }
        },

        _prepareRepeatsForAjax: function (d) {
            this.getForm();
            //ensure we are dealing with a simple object
            if (typeOf(d) === 'hash') {
                d = d.getClean();
            }
            //data should be keyed on the data stored in the elements name between []'s which is the group id
            this.form.getElements('input[name^=fabrik_repeat_group]').each(
                function (e) {
                    // $$$ hugh - had a client with a table called fabrik_repeat_group, which was hosing up here,
                    // so added a test to narrow the element name down a bit!
                    if (e.id.test(/fabrik_repeat_group_\d+_counter/)) {
                        var c = e.name.match(/\[(.*)\]/)[1];
                        d['fabrik_repeat_group[' + c + ']'] = e.get('value');
                    }
                }
            );
            return d;
        },

        _showGroupError: function (r, d) {
            var tmperr;
            var gids = Array.mfrom(this.options.pages.get(this.currentPage.toInt()));
            var err = false;
            $H(d).each(function (v, k) {
                k = k.replace(/\[(.*)\]/, '').replace(/%5B(.*)%5D/, '');// for dropdown validations
                if (this.formElements.has(k)) {
                    var el = this.formElements.get(k);
                    if (gids.contains(el.groupid.toInt())) {

                        if (r.errors[k]) {
                            if (el.options.inRepeatGroup) {
                                r.errors[k].each(function (v2, k2) {
                                    var k3 = k.replace(/_(\d+)$/, '_' + k2);
                                    var rEl = this.formElements.get(k3);


                                    var msg = '';
                                    if (typeOf(v2) !== 'null') {
                                        msg = v2.flatten().join('<br />');
                                    }
                                    if (msg !== '') {
                                        tmperr = this._showElementError(v2, k3);
                                        if (err === false) {
                                            err = tmperr;
                                        }
                                    } else {
                                        rEl.setErrorMessage('', '');
                                    }
                                }.bind(this));
                            }
                            else {
                                // prepare error so that it only triggers for real errors and not success
                                // msgs

                                var msg = '';
                                if (typeOf(r.errors[k]) !== 'null') {
                                    msg = r.errors[k].flatten().join('<br />');
                                }
                                if (msg !== '') {
                                    tmperr = this._showElementError(r.errors[k], k);
                                    if (err === false) {
                                        err = tmperr;
                                    }
                                } else {
                                    el.setErrorMessage('', '');
                                }
                            }
                        }
                        if (r.modified[k]) {
                            if (el) {
                                el.update(r.modified[k]);
                            }
                        }
                    }
                }
            }.bind(this));

            return err;
        },

        /**
         * Show element error
         * @param {array} r
         * @param {string} id
         * @returns {boolean}
         * @private
         */
        _showElementError: function (r, id) {
            // r should be the errors for the specific element, down to its repeat group
            // id.
            var msg = '';
            if (typeOf(r) !== 'null') {
                msg = r.flatten().join('<br />');
            }
            var classname = (msg === '') ? 'fabrikSuccess' : 'fabrikError';
            if (msg === '') {
                delete this.hasErrors[id];
                msg = Joomla.JText._('COM_FABRIK_SUCCESS');
            }
            else {
                this.hasErrors.set(id, true);
            }
            msg = '<span> ' + msg + '</span>';
            this.formElements.get(id).setErrorMessage(msg, classname);
            return (classname === 'fabrikSuccess') ? false : true;
        },

        updateMainError: function () {
            var myfx, activeValidations;
            if (typeOf(this.form.getElement('.fabrikMainError')) !== 'null') {
                this.form.getElement('.fabrikMainError').set('html', this.options.error);
            }
            activeValidations = this.form.getElements('.fabrikError').filter(
                function (e, index) {
                    return !e.hasClass('fabrikMainError');
                });
            if (activeValidations.length > 0 && this.form.getElement('.fabrikMainError').hasClass('fabrikHide')) {
                this.showMainError(this.options.error);
            }
            if (activeValidations.length === 0) {
                this.hideMainError();
            }
        },

        hideMainError: function () {
            if (typeOf(this.form.getElement('.fabrikMainError')) !== 'null') {
                var mainEr = this.form.getElement('.fabrikMainError');
                myfx = new Fx.Tween(mainEr, {
                    property  : 'opacity',
                    duration  : 500,
                    onComplete: function () {
                        mainEr.addClass('fabrikHide');
                    }
                }).start(1, 0);
            }
        },

        showMainError: function (msg) {
            // If we are in j3 and ajax validations are on - don't show main error as it makes the form 'jumpy'
            if (Fabrik.bootstrapped && this.options.ajaxValidation) {
                return;
            }
            if (typeOf(this.form.getElement('.fabrikMainError')) !== 'null') {
                var mainEr = this.form.getElement('.fabrikMainError');
                mainEr.set('html', msg);
                mainEr.removeClass('fabrikHide');
                myfx = new Fx.Tween(mainEr, {
                    property: 'opacity',
                    duration: 500
                }).start(0, 1);
            }
        },

        /** @since 3.0 get a form button name */
        _getButton: function (name) {
            if (!this.getForm()) {
                return;
            }
            var b = this.form.getElement('input[type=button][name=' + name + ']');
            if (!b) {
                b = this.form.getElement('input[type=submit][name=' + name + ']');
            }
            if (!b) {
                b = this.form.getElement('button[type=button][name=' + name + ']');
            }
            if (!b) {
                b = this.form.getElement('button[type=submit][name=' + name + ']');
            }
            return b;
        },

        watchSubmit: function () {
            var submit = this._getButton('Submit');
            var apply = this._getButton('apply');

            if (!submit && !apply) {
                // look for a button element set to submit
                if (this.form.getElement('button[type=submit]'))
                {
                    submit = this.form.getElement('button[type=submit]');
                }
                else {
                    return;
                }
            }
            var del = this._getButton('delete'),
                copy = this._getButton('Copy');
            if (del) {
                del.addEvent('click', function (e) {
                    if (window.confirm(Joomla.JText._('COM_FABRIK_CONFIRM_DELETE_1'))) {
                        var res = Fabrik.fireEvent('fabrik.form.delete', [this, this.options.rowid]).eventResults;
                        if (typeOf(res) === 'null' || res.length === 0 || !res.contains(false)) {
                            // Task value is the same for front and admin
                            this.form.getElement('input[name=task]').value = 'form.delete';
                            this.doSubmit(e, del);
                        } else {
                            e.stop();
                            return false;
                        }

                    } else {
                        return false;
                    }
                }.bind(this));
            }
            var submits = this.form.getElements('button[type=submit]').combine([apply, submit, copy]);
            submits.each(function (btn) {
                if (typeOf(btn) !== 'null') {
                    btn.addEvent('click', function (e) {
                        this.doSubmit(e, btn);
                    }.bind(this));
                }
            }.bind(this));

            this.form.addEvent('submit', function (e) {
                this.doSubmit(e);
            }.bind(this));
        },

        mockSubmit: function (btnName) {
            btnName = typeof btnName !== 'undefined' ? btnName : 'Submit';
            var btn = this._getButton(btnName);
            if (!btn) {
                btn = new Element('button', {'name': btnName, 'type': 'submit'});
            }
            this.doSubmit(new Event.Mock(btn, 'click'), btn);
        },

        doSubmit: function (e, btn) {
            if (this.submitBroker.enabled()) {
                e.stop();
                return false;
            }
            this.toggleSubmit(false);
            this.submitBroker.submit(function () {
                if (this.options.showLoader) {
                    Fabrik.loader.start(this.getBlock(), Joomla.JText._('COM_FABRIK_LOADING'));
                }
                Fabrik.fireEvent('fabrik.form.submit.start', [this, e, btn]);
                if (this.result === false) {
                    this.result = true;
                    e.stop();
                    Fabrik.loader.stop(this.getBlock());
                    // Update global status error
                    this.updateMainError();
                    this.toggleSubmit(true);

                    // Return otherwise ajax upload may still occur.
                    return;
                }
                // Insert a hidden element so we can reload the last page if validation fails
                if (this.options.pages.getKeys().length > 1) {
                    this.form.adopt(new Element('input', {
                        'name' : 'currentPage',
                        'value': this.currentPage.toInt(),
                        'type' : 'hidden'
                    }));
                }
                hiddenElements = [];
                // insert hidden element of hidden elements (!) used by validation code for "skip if hidden" option
                jQuery.each(this.formElements, function (id, el) {
                   if (el.element && jQuery(el.element).closest('.fabrikHide').length !== 0) {
                       hiddenElements.push(id);
                   }
                });
                this.form.adopt(new Element('input', {
                    'name' : 'hiddenElements',
                    'value': JSON.stringify(hiddenElements),
                    'type' : 'hidden'
                }));
                if (this.options.ajax) {
                    // Do ajax val only if onSubmit val ok
                    if (this.form) {
                        // if showLoader is enabled (for non AJAX submits) the loader will already have been shown up there ^^
                        if (!this.options.showLoader) {
                            Fabrik.loader.start(this.getBlock(), Joomla.JText._('COM_FABRIK_LOADING'));
                        }

                        // Get all values from the form
                        var data = $H(this.getFormData());
                        data = this._prepareRepeatsForAjax(data);
                        data[btn.name] = btn.value;
                        if (btn.name === 'Copy') {
                            data.Copy = 1;
                            e.stop();
                        }
                        data.fabrik_ajax = '1';
                        data.format = 'raw';

                        // if HTML 5, use FormData so we can do uploads from popups via AJAX
                        // poop, doesn't work in Edge or Safari, punt till they implement FormData correctly
                        if (false && window.FormData) {
                            fd = new FormData(this.form);

                            jQuery.each(data, function(k, v) {
                                if (fd.has(k)) {
                                    if (typeOf(fd.get(k)) !== 'object') {
                                        fd.set(k, v);
                                    }
                                }
                                else {
                                    fd.set(k, v);
                                }
                            });

                            data = fd;
                            var self = this;

                            jQuery.ajax({
                                'url': this.form.action,
                                'data': data,
                                'method': this.options.ajaxmethod,
                                'processData': false,
                                'contentType': false
                            })
                                .fail(function (text, error) {
                                    fconsole(text + ': ' + error);
                                    self.showMainError(error);
                                    Fabrik.loader.stop(self.getBlock(), 'Error in returned JSON');
                                    self.toggleSubmit(true);
                                })
                                .done(function (json, txt) {
                                    json = JSON.parse(json);
                                    self.toggleSubmit(true);
                                    if (typeOf(json) === 'null') {
                                        // Stop spinner
                                        Fabrik.loader.stop(self.getBlock(), 'Error in returned JSON');
                                        fconsole('error in returned json', json, txt);
                                        return;
                                    }
                                    // Process errors if there are some
                                    jQuery(self.form.getElements('[data-role=fabrik_tab]')).removeClass('fabrikErrorGroup')
                                    var errfound = false;
                                    if (json.errors !== undefined) {

                                        // For every element of the form update error message
                                        $H(json.errors).each(function (errors, key) {
                                            if (self.formElements.has(key) && errors.flatten().length > 0) {
                                                errfound = true;
                                                if (self.formElements[key].options.inRepeatGroup) {
                                                    for (e = 0; e < errors.length; e++) {
                                                        if (errors[e].flatten().length > 0) {
                                                            var this_key = key.replace(/(_\d+)$/, '_' + e);
                                                            self._showElementError(errors[e], this_key);
                                                        }
                                                    }
                                                }
                                                else {
                                                    self._showElementError(errors, key);
                                                }
                                            }
                                        });
                                    }
                                    // Update global status error
                                    self.updateMainError();

                                    if (errfound === false) {
                                        var clear_form = false;
                                        if (self.options.rowid === '' && btn.name !== 'apply') {
                                            // We're submitting a new form - so always clear
                                            clear_form = true;
                                        }
                                        Fabrik.loader.stop(self.getBlock());
                                        var savedMsg = (typeOf(json.msg) !== 'null' && json.msg !== undefined && json.msg !== '') ? json.msg : Joomla.JText._('COM_FABRIK_FORM_SAVED');
                                        if (json.baseRedirect !== true) {
                                            clear_form = json.reset_form;
                                            if (json.url !== undefined) {
                                                if (json.redirect_how === 'popup') {
                                                    var width = json.width ? json.width : 400;
                                                    var height = json.height ? json.height : 400;
                                                    var x_offset = json.x_offset ? json.x_offset : 0;
                                                    var y_offset = json.y_offset ? json.y_offset : 0;
                                                    var title = json.title ? json.title : '';
                                                    Fabrik.getWindow({
                                                        'id'      : 'redirect',
                                                        'type'    : 'redirect',
                                                        contentURL: json.url,
                                                        caller    : self.getBlock(),
                                                        'height'  : height,
                                                        'width'   : width,
                                                        'offset_x': x_offset,
                                                        'offset_y': y_offset,
                                                        'title'   : title
                                                    });
                                                }
                                                else {
                                                    if (json.redirect_how === 'samepage') {
                                                        window.open(json.url, '_self');
                                                    }
                                                    else if (json.redirect_how === 'newpage') {
                                                        window.open(json.url, '_blank');
                                                    }
                                                }
                                            } else {
                                                if (!json.suppressMsg) {
                                                    alert(savedMsg);
                                                }
                                            }
                                        } else {
                                            clear_form = json.reset_form !== undefined ? json.reset_form : clear_form;
                                            if (!json.suppressMsg) {
                                                alert(savedMsg);
                                            }
                                        }
                                        // Query the list to get the updated data
                                        Fabrik.fireEvent('fabrik.form.submitted', [self, json]);
                                        if (btn.name !== 'apply') {
                                            if (clear_form) {
                                                self.clearForm();
                                            }
                                            // If the form was loaded in a Fabrik.Window close the window.
                                            if (Fabrik.Windows[self.options.fabrik_window_id]) {
                                                Fabrik.Windows[self.options.fabrik_window_id].close();
                                            }
                                        }
                                    } else {
                                        Fabrik.fireEvent('fabrik.form.submit.failed', [self, json]);
                                        // Stop spinner
                                        Fabrik.loader.stop(self.getBlock(), Joomla.JText._('COM_FABRIK_VALIDATION_ERROR'));
                                    }
                                });
                        }
                        else {
                            var myajax = new Request.JSON({
                                'url': this.form.action,
                                'data': data,
                                'method': this.options.ajaxmethod,
                                onError: function (text, error) {
                                    fconsole(text + ': ' + error);
                                    this.showMainError(error);
                                    Fabrik.loader.stop(this.getBlock(), 'Error in returned JSON');
                                    this.toggleSubmit(true);
                                }.bind(this),

                                onFailure: function (xhr) {
                                    fconsole(xhr);
                                    Fabrik.loader.stop(this.getBlock(), 'Ajax failure');
                                    this.toggleSubmit(true);
                                }.bind(this),
                                onComplete: function (json, txt) {
                                    this.toggleSubmit(true);
                                    if (typeOf(json) === 'null') {
                                        // Stop spinner
                                        Fabrik.loader.stop(this.getBlock(), 'Error in returned JSON');
                                        fconsole('error in returned json', json, txt);
                                        return;
                                    }
                                    // Process errors if there are some
                                    jQuery(this.form.getElements('[data-role=fabrik_tab]')).removeClass('fabrikErrorGroup')
                                    var errfound = false;

                                    if (json.errors !== undefined) {
                                        // For every element of the form update error message
                                        $H(json.errors).each(function (errors, key) {
                                            if (errors.flatten().length > 0) {
                                                /*
                                                 * might not be an element error - could be a custom plugin error - so
                                                 * flag an error found, even if we don't match it to an element.
                                                 */
                                                errfound = true;
                                                if (this.formElements.has(key)) {
                                                    if (this.formElements[key].options.inRepeatGroup) {
                                                        for (e = 0; e < errors.length; e++) {
                                                            if (errors[e].flatten().length > 0) {
                                                                var this_key = key.replace(/(_\d+)$/, '_' + e);
                                                                this._showElementError(errors[e], this_key);
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        this._showElementError(errors, key);
                                                    }
                                                }
                                            }
                                        }.bind(this));
                                    }
                                    // Update global status error
                                    this.updateMainError();

                                    if (errfound === false) {
                                        var clear_form = false;
                                        if (this.options.rowid === '' && btn.name !== 'apply') {
                                            // We're submitting a new form - so always clear
                                            clear_form = true;
                                        }
                                        Fabrik.loader.stop(this.getBlock());
                                        var savedMsg = (typeOf(json.msg) !== 'null' && json.msg !== undefined && json.msg !== '') ? json.msg : Joomla.JText._('COM_FABRIK_FORM_SAVED');
                                        if (json.baseRedirect !== true) {
                                            clear_form = json.reset_form;
                                            if (json.url !== undefined) {
                                                if (json.redirect_how === 'popup') {
                                                    var width = json.width ? json.width : 400;
                                                    var height = json.height ? json.height : 400;
                                                    var x_offset = json.x_offset ? json.x_offset : 0;
                                                    var y_offset = json.y_offset ? json.y_offset : 0;
                                                    var title = json.title ? json.title : '';
                                                    Fabrik.getWindow({
                                                        'id': 'redirect',
                                                        'type': 'redirect',
                                                        contentURL: json.url,
                                                        caller: this.getBlock(),
                                                        'height': height,
                                                        'width': width,
                                                        'offset_x': x_offset,
                                                        'offset_y': y_offset,
                                                        'title': title
                                                    });
                                                }
                                                else {
                                                    if (json.redirect_how === 'samepage') {
                                                        window.open(json.url, '_self');
                                                    }
                                                    else if (json.redirect_how === 'newpage') {
                                                        window.open(json.url, '_blank');
                                                    }
                                                }
                                            } else {
                                                if (!json.suppressMsg) {
                                                    alert(savedMsg);
                                                }
                                            }
                                        } else {
                                            clear_form = json.reset_form !== undefined ? json.reset_form : clear_form;
                                            if (!json.suppressMsg) {
                                                alert(savedMsg);
                                            }
                                        }
                                        // Query the list to get the updated data
                                        Fabrik.fireEvent('fabrik.form.submitted', [this, json]);

                                        if (btn.name !== 'apply') {
                                            if (clear_form) {
                                                this.clearForm();
                                            }
                                            // If the form was loaded in a Fabrik.Window close the window.
                                            if (Fabrik.Windows[this.options.fabrik_window_id]) {
                                                Fabrik.Windows[this.options.fabrik_window_id].close();
                                            }
                                        }

                                        Fabrik.fireEvent('fabrik.form.submitted.end', [this, json]);
                                    } else {
                                        Fabrik.fireEvent('fabrik.form.submit.failed', [this, json]);
                                        // Stop spinner
                                        Fabrik.loader.stop(this.getBlock(), Joomla.JText._('COM_FABRIK_VALIDATION_ERROR'));
                                    }
                                }.bind(this)
                            }).send();
                        }
                    }
                }
                Fabrik.fireEvent('fabrik.form.submit.end', [this]);
                if (this.result === false) {
                    this.result = true;
                    e.stop();
                    // Update global status error
                    this.updateMainError();
                } else {
                    // Enables the list to clean up the form and custom events
                    if (this.options.ajax) {
                        e.stop();
                        Fabrik.fireEvent('fabrik.form.ajax.submit.end', [this]);
                    } else {
                        // Inject submit button name/value.
                        if (typeOf(btn) !== 'null') {
                            new Element('input', {type: 'hidden', name: btn.name, value: btn.value}).inject(this.form);
                            this.form.submit();
                        } else {
                            // Regular button pressed which seems to be triggering form.submit() method.
                            e.stop();
                        }
                    }
                }
            }.bind(this));
            e.stop();
        },

        /**
         * Used to get the querystring data and
         * for any element overwrite with its own data definition
         * required for empty select lists which return undefined as their value if no
         * items available
         *
         * @param  {bool}  submit  Should we run the element onsubmit() methods - set to false in calc element
         */
        getFormData: function (submit) {
            submit = typeOf(submit) !== 'null' ? submit : true;
            if (submit) {
                this.formElements.each(function (el, key) {
                    el.onsubmit();
                });
            }
            this.getForm();
            var s = this.form.toQueryString();
            var h = {};
            s = s.split('&');
            var arrayCounters = $H({});
            s.each(function (p) {
                p = p.split('=');
                var k = p[0];
                // $$$ rob deal with checkboxes
                // Ensure [] is not encoded
                k = decodeURI(k);
                if (k.substring(k.length - 2) === '[]') {
                    k = k.substring(0, k.length - 2);
                    if (!arrayCounters.has(k)) {
                        // rob for ajax validation on repeat element this is required to be set to 0
                        arrayCounters.set(k, 0);
                    } else {
                        arrayCounters.set(k, arrayCounters.get(k) + 1);
                    }
                    k = k + '[' + arrayCounters.get(k) + ']';
                }
                h[k] = p[1];
            });

            // toQueryString() doesn't add in empty data - we need to know that for the
            // validation on multipages
            var elKeys = this.formElements.getKeys();
            this.formElements.each(function (el, key) {
                //fileupload data not included in querystring
                if (el.plugin === 'fabrikfileupload') {
                    h[key] = el.get('value');
                }
                if (typeOf(h[key]) === 'null') {
                    // search for elementname[*] in existing data (search for * as datetime
                    // elements aren't keyed numerically)
                    var found = false;
                    $H(h).each(function (val, dataKey) {
                        dataKey = unescape(dataKey); // 3.0 ajax submission [] are escaped
                        dataKey = dataKey.replace(/\[(.*)\]/, '');
                        if (dataKey === key) {
                            found = true;
                        }
                    }.bind(this));
                    if (!found) {
                        h[key] = '';
                    }
                }
            }.bind(this));
            return h;
        },

        /*
         * Used by things like CDD to populate 'data' for the AJAX update, so custom 'where' clauses
         * can use {placeholders}. Initially tried to use getFormData for this, but because
         * it adds ALL the query string args from the page, the AJAX call from cascade ended
         * up trying to submit the form. So, this func only fetches actual form element data.
         */
        getFormElementData: function () {
            var h = {};
            this.formElements.each(function (el, key) {
                if (el.element) {
                    h[key] = el.getValue();
                    h[key + '_raw'] = h[key];
                }
            }.bind(this));
            return h;
        },

        watchGroupButtons: function () {

            var self = this;

            jQuery(this.form).on('click', '.deleteGroup', Debounce(this.options.debounceDelay, true, function (e, target) {
                e.preventDefault();
                if (!self.addingOrDeletingGroup) {
                    self.addingOrDeletingGroup = true;
                    var group = e.target.getParent('.fabrikGroup'),
                        subGroup = e.target.getParent('.fabrikSubGroup');
                    self.deleteGroup(e, group, subGroup);
                    self.addingOrDeletingGroup = false;
                }
            }));

            jQuery(this.form).on('click', '.addGroup', Debounce(this.options.debounceDelay, true, function (e, target) {
                e.preventDefault();
                if (!self.addingOrDeletingGroup) {
                    self.addingOrDeletingGroup = true;
                    self.duplicateGroup(e, true);
                    self.addingOrDeletingGroup = false;
                }
            }));

            this.form.addEvent('click:relay(.fabrikSubGroup)', function (e, subGroup) {
                var r = subGroup.getElement('.fabrikGroupRepeater');
                if (r) {
                    subGroup.addEvent('mouseenter', function (e) {
                        r.fade(1);
                    });
                    subGroup.addEvent('mouseleave', function (e) {
                        r.fade(0.2);
                    });
                }
            }.bind(this));
        },

        /**
         * not currently used in our code, provided as a helper function for custom JS
         *
         * @param groupId
         * @returns {boolean}
         */
        mockDuplicateGroup: function(groupId) {
            var add_btn = this.form.getElement('#group' + groupId + ' .addGroup');

            if (typeOf(add_btn) !== 'null') {
                var add_e = new Event.Mock(add_btn, 'click');
                this.duplicateGroup(add_e, false);
                return true;
            }

            return false;
        },

        renumberRepeatGroup: function(el, groupId, newRepeatNum, doDelete) {
            var input = jQuery(el).find('.fabrikinput');
            if (input) {
                var nameMap = {};
                var newMap = {};
                var elId = input[0].id;
                var element = this.formElements.get(elId);
                if (element) {
                    var repeatNum = elId.split('_').getLast();
                    console.log('renumbering: ' + repeatNum + ' => ' + newRepeatNum);
                    element.update(newRepeatNum + 1);
                    this.formElements.each(function (e, k) {
                        if (e.groupid === groupId && k.split('_').getLast() === repeatNum) {
                            nameMap[k] = e.setName(newRepeatNum);
                        }
                    }.bind(this));

                    $H(nameMap).each(function (newKey, oldKey) {
                        if (oldKey !== newKey) {
                            newMap[newKey] = this.formElements[oldKey];

                            if (doDelete === true) {
                                delete this.formElements[oldKey];
                            }
                        }
                    }.bind(this));

                    $H(newMap).each(function (data, newKey) {
                        this.formElements[newKey] = data;
                    }.bind(this));
                }
            }
        },

        renumberSortable: function (groupId) {
            if (typeOf(this.options.group_repeat_sortable[groupId]) === 'null' || !this.options.group_repeat_sortable[groupId]) {
                return;
            }

            var orderElName = this.options.group_repeat_order_element[groupId];
            var group = this.form.getElement('#group' + groupId);
            var tbody = jQuery(group).find('tbody');
            var tdEls = jQuery(tbody).find('.fabrikRepeatGroup___' + orderElName);
            var i = 1;

            tdEls.each(function (k, el) {
                var input = jQuery(el).find('.fabrikinput');

                if (input) {
                    var elId = input[0].id;
                    var element = this.formElements.get(elId);

                    if (element) {
                        element.update(i);
                    }
                }

                i++;
            }.bind(this));
        },

        reorderSortable: function (groupId) {
            if (typeOf(this.options.group_repeat_sortable[groupId]) === 'null' || !this.options.group_repeat_sortable[groupId]) {
                return;
            }

            var orderElName = this.options.group_repeat_order_element[groupId];

            var nameMap = {};
            var newMap = {};
            var group = this.form.getElement('#group' + groupId);
            var tbody = jQuery(group).find('tbody');
            var tdEls = jQuery(tbody).find('.fabrikRepeatGroup___' + orderElName);

            var to = 0;
            var save = false;
            var dir = false;
            var started = false;
            var ended = false;
            var start = false;
            var end = false;
            var lastFrom = -1;

            tdEls.each(function (k, el) {
                if (!ended) {
                    var input = jQuery(el).find('.fabrikinput');
                    if (input) {
                        var elId = input[0].id;
                        var element = this.formElements.get(elId);
                        if (element) {
                            var from = elId.split('_').getLast().toInt();

                            if (!started) {
                                var gap = (from - lastFrom);

                                if (gap === 2) {
                                    started = true;
                                    dir = 'down';
                                    start = to;
                                } else if (gap > 2) {
                                    started = true;
                                    dir = 'up';
                                    start = to;
                                    end = from;
                                    save = from;
                                    ended = true;
                                }
                            } else {
                                if (dir === 'down') {
                                    if (from === start) {
                                        end = to;
                                        save = to;
                                        ended = true;
                                    }
                                }
                            }

                            lastFrom = from;
                            to++;
                        }
                    }
                }
            }.bind(this))

            if (dir === 'up') {
                var el;

                el = tdEls[end];
                this.renumberRepeatGroup(el, groupId, 9999, false);

                for (var i = end - 1; i >= start; i--) {
                    el = tdEls[i];
                    this.renumberRepeatGroup(el, groupId, i, false);
                }

                el = tdEls[end];
                this.renumberRepeatGroup(el, groupId, end, true);
            }
            else {
                var el;

                el = tdEls[end];
                this.renumberRepeatGroup(el, groupId, 9999, false);

                for (var i = start; i < end; i++) {
                    el = tdEls[i];
                    this.renumberRepeatGroup(el, groupId, i, false);
                }

                el = tdEls[end];
                this.renumberRepeatGroup(el, groupId, end, true);
            }

            $H(nameMap).each(function (newKey, oldKey) {
                if (oldKey !== newKey) {
                    newMap[newKey] = this.formElements[oldKey];
                }
            }.bind(this));

            $H(newMap).each(function (newKey, data) {
                this.formElements[newKey] = data;
            }.bind(this));
        },

        setupSortable: function () {
            if (!this.form) {
                return;
            }

            Object.each(this.options.group_repeats, function (canRepeat, groupId) {
                if (canRepeat.toInt() !== 1) {
                    return;
                }

                if (typeOf(this.options.group_repeat_sortable[groupId]) !== 'null' && this.options.group_repeat_tablesort[groupId]) {
                    var group = this.form.getElement('#group' + groupId);

                    if (group) {
                        var cellFilters = [];
                        group.getElements('th.fabrikElementContainer').each(function (e, x) {
                            if (e.hasClass('fabrikHide')) {
                                cellFilters.push('fabrikHide');
                            } else {
                                cellFilters.push('');
                            }
                        });
                        jQuery('#group' + groupId + ' table').tablesorter({
                            theme: 'blue',
                            widthFixed: true,
                            widgets: ["filter"],
                            cssInfoBlock: "tablesorter-no-sort",
                            ignoreCase: true,
                            widgetOptions: {
                                filter_ignoreCase: true,
                                filter_matchType: {'input': 'match', 'select': 'match'},
                                filter_saveFilters: true,
                                filter_liveSearch: true,
                                filter_cellFilter: cellFilters
                            }
                        });
                    }
                }

                if (typeOf(this.options.group_repeat_sortable[groupId]) !== 'null' && this.options.group_repeat_sortable[groupId]) {
                    Fabrik.addEvent('fabrik.form.elements.added', function (form) {
                        this.renumberSortable(groupId);
                    }.bind(this));

                    jQuery('#group' + groupId + ' table tbody').sortable({
                        scroll: true,
                        scrollSensitivity: 100,
                        stop: function (event, ui) {
                            var group = ui.item[0].closest('.fabrikGroup');
                            var groupId = group.id.replace('group', '');
                            this.reorderSortable(groupId);
                        }.bind(this)
                    });
                }
            }.bind(this));
        },

        /**
         * When editing a new form and when min groups set we need to duplicate each group
         * by the min repeat value.
         */
        duplicateGroupsToMin: function () {
            if (!this.form) {
                return;
            }

            Fabrik.fireEvent('fabrik.form.group.duplicate.min', [this]);

            Object.each(this.options.group_repeats, function (canRepeat, groupId) {

                if (typeOf(this.options.minRepeat[groupId]) === 'null') {
                    return;
                }

                if (canRepeat.toInt() !== 1) {
                    return;
                }

                var repeat_counter = this.form.getElement('#fabrik_repeat_group_' + groupId + '_counter'),
                    repeat_added = this.form.getElement('#fabrik_repeat_group_' + groupId + '_added').value,
                    repeat_rows, repeat_real, add_btn, deleteButton, i, repeat_id_0, deleteEvent;

                if (typeOf(repeat_counter) === 'null') {
                    return;
                }

                repeat_rows = repeat_real = repeat_counter.value.toInt();

                // figure out if the first group should be hidden (min repeat is 0)
                if (repeat_rows === 1) {
                    repeat_id_0 = this.form.getElement('#' + this.options.group_pk_ids[groupId] + '_0');

                    // repeat_added means they added a first group, and we've failed validation, so show it
                    if (repeat_added !== '1' && typeOf(repeat_id_0) !== 'null' && repeat_id_0.value === '') {
                        repeat_real = 0;
                    }
                }

                var min = this.options.minRepeat[groupId].toInt();
                var max = this.options.maxRepeat[groupId].toInt();
                var group = this.form.getElement('#group' + groupId);
                var subGroup;

                /**
                 * $$$ hugh - added ability to override min count
                 * http://fabrikar.com/forums/index.php?threads/how-to-initially-show-repeat-group.32911/#post-170147
                 * $$$ hugh - trying out min of 0 for Troester
                 * http://fabrikar.com/forums/index.php?threads/how-to-start-a-new-record-with-empty-repeat-group.34666/#post-175408
                 * $$$ paul - fixing min of 0 for Jaanus
                 * http://fabrikar.com/forums/index.php?threads/couple-issues-with-protostar-template.35917/
                 **/
                if (min === 0 && repeat_real === 0) {

                    // Create mock event
                    deleteButton = this.form.getElement('#group' + groupId + ' .deleteGroup');
                    deleteEvent = typeOf(deleteButton) !== 'null' ? new Event.Mock(deleteButton, 'click') : false;
                    subGroup = group.getElement('.fabrikSubGroup');
                    // Remove only group
                    this.deleteGroup(deleteEvent, group, subGroup);

                }
                else if (repeat_rows < min) {
                    // Create mock event
                    add_btn = this.form.getElement('#group' + groupId + ' .addGroup');
                    if (typeOf(add_btn) !== 'null') {
                        var add_e = new Event.Mock(add_btn, 'click');

                        // Duplicate group
                        for (i = repeat_rows; i < min; i++) {
                            this.duplicateGroup(add_e, false);
                        }
                    }
                }
                else if (max > 0 && repeat_rows > max) {
	                // Delete groups
	                for (i = repeat_rows; i > max; i--) {
		                var b = jQuery(this.form.getElements('#group' + groupId + ' .deleteGroup')).last()[0];
		                var del_btn = jQuery(b).find('[data-role=fabrik_delete_group]')[0];
		                subGroup = jQuery(group.getElements('.fabrikSubGroup')).last()[0];
		                if (typeOf(del_btn) !== 'null') {
		                    var del_e = new Event.Mock(del_btn, 'click');
			                this.deleteGroup(del_e, group, subGroup);
		                }
	                }
                }

                this.setRepeatGroupIntro(group, groupId);
            }.bind(this));
        },

        /**
         * Delete an repeating group
         *
         * @param e
         * @param group
         */
        deleteGroup: function (e, group, subGroup) {
            Fabrik.fireEvent('fabrik.form.group.delete', [this, e, group]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            if (e) {
                e.preventDefault();
            }

            // Find which repeat group was deleted
            var delIndex = 0;

            // if clicked exactly on icon, e.target will be icon, not surrounding link, so need find with addBack
            var target = jQuery(e.target).find('[data-role=fabrik_delete_group]').addBack('[data-role=fabrik_delete_group]')[0];

            group.getElements('.deleteGroup').each(function (b, x) {
                if (jQuery(b).find('[data-role=fabrik_delete_group]')[0] === target) {
                    delIndex = x;
                }
            }.bind(this));
            var i = group.id.replace('group', '');

            var repeats = document.id('fabrik_repeat_group_' + i + '_counter').get('value').toInt();
            if (repeats <= this.options.minRepeat[i] && this.options.minRepeat[i] !== 0) {
                if (this.options.minMaxErrMsg[i] !== '') {
                    var errorMessage = this.options.minMaxErrMsg[i];
                    errorMessage = errorMessage.replace(/\{min\}/, this.options.minRepeat[i]);
                    errorMessage = errorMessage.replace(/\{max\}/, this.options.maxRepeat[i]);
                    alert(errorMessage);
                }
                return;
            }

            delete this.duplicatedGroups.i;
            if (document.id('fabrik_repeat_group_' + i + '_counter').value === '0') {
                return;
            }
            var subgroups = group.getElements('.fabrikSubGroup');

            this.subGroups.set(i, subGroup.clone());
            if (subgroups.length <= 1) {
                this.hideLastGroup(i, subGroup);
                this.formElements.each(function (e, k) {
                    if (e.groupid === i && typeOf(e.element) !== 'null') {
                        this.removeMustValidate(e);
                    }
                }.bind(this));
                document.id('fabrik_repeat_group_' + i + '_added').value = '0';
                Fabrik.fireEvent('fabrik.form.group.delete.end', [this, e, i, delIndex]);
            } else {
                var toel = subGroup.getPrevious();
                /*
                var myFx = new Fx.Tween(subGroup, {
                    'property': 'opacity',
                    duration  : 300,
                    onComplete: function () {
                    */
                        if (subgroups.length > 1) {
                            subGroup.dispose();
                        }

                        this.formElements.each(function (e, k) {
                            if (typeOf(e.element) !== 'null') {
                                if (typeOf(document.id(e.element.id)) === 'null') {
                                    e.decloned(i);
                                    delete this.formElements[k];
                                }
                            }
                        }.bind(this));

                        // Minus the removed group
                        subgroups = group.getElements('.fabrikSubGroup');
                        var nameMap = {};
                        this.formElements.each(function (e, k) {
                            if (e.groupid === i) {
                                nameMap[k] = e.decreaseName(delIndex);
                            }
                        }.bind(this));
                        // ensure that formElements' keys are the same as their object's ids
                        // otherwise delete first group, add 2 groups - ids/names in last
                        // added group are not updated
                        $H(nameMap).each(function (newKey, oldKey) {
                            if (oldKey !== newKey) {
                                this.formElements[newKey] = this.formElements[oldKey];
                                delete this.formElements[oldKey];
                            }
                        }.bind(this));
                        Fabrik.fireEvent('fabrik.form.group.delete.end', [this, e, i, delIndex]);
                        /*
                    }.bind(this)
                }).start(1, 0);
                */
                if (toel) {
                    // Only scroll the window if the previous element is not visible
                    var win_scroll = document.id(window).getScroll().y;
                    var obj = toel.getCoordinates();
                    // If the top of the previous repeat goes above the top of the visible
                    // window,
                    // scroll down just enough to show it.
                    if (obj.top < win_scroll) {
                        var new_win_scroll = obj.top;
                        this.winScroller.start(0, new_win_scroll);
                    }
                }
            }
            // Update the hidden field containing number of repeat groups
            document.id('fabrik_repeat_group_' + i + '_counter').value =
                document.id('fabrik_repeat_group_' + i + '_counter').get('value').toInt() - 1;
            // $$$ hugh - no, mustn't decrement this!  See comment in setupAll
            this.repeatGroupMarkers.set(i, this.repeatGroupMarkers.get(i) - 1);
            this.renumberSortable(i);
            this.setRepeatGroupIntro(group, i);
        },

        hideLastGroup: function (groupId, subGroup) {
            var msg = this.options.noDataMsg[groupId];

            if (msg === '') {
                msg = Joomla.JText._('COM_FABRIK_NO_REPEAT_GROUP_DATA');
            }

            var sge = subGroup.getElement('.fabrikSubGroupElements');
            var notice = new Element(
                'div', {'class': 'fabrikNotice alert'}
            ).appendText(msg);
            if (typeOf(sge) === 'null') {
                sge = subGroup;
                var add = sge.getElement('.addGroup');
                if (typeOf(add) !== 'null') {
                    var lastth = sge.getParent('table').getElements('*[data-role="fabrik-group-repeaters"]').getLast();
                    if (!lastth) {
                        // for old custom templates that don't have the data-role, fall back to just grabbing last th
                        lastth = sge.getParent('table').getElements('thead th').getLast();
                    }
                    add.inject(lastth);
                }
            }
            sge.setStyle('display', 'none');
            notice.inject(sge, 'after');
        },

        isFirstRepeatSubGroup: function (group) {
            var subgroups = group.getElements('.fabrikSubGroup');
            return subgroups.length === 1 && group.getElement('.fabrikNotice');
        },

        getSubGroupToClone: function (groupId) {
            var group = document.id('group' + groupId);
            var subgroup = group.getElement('.fabrikSubGroup');
            if (!subgroup) {
                subgroup = this.subGroups.get(groupId);
            }

            var clone = null;
            var found = false;
            if (this.duplicatedGroups.has(groupId)) {
                found = true;
            }
            if (!found) {
                clone = subgroup.cloneNode(true);
                this.duplicatedGroups.set(groupId, clone);
            } else {
                if (!subgroup) {
                    clone = this.duplicatedGroups.get(groupId);
                } else {
                    clone = subgroup.cloneNode(true);
                }
            }
            return clone;
        },

        repeatGetChecked: function (group) {
            // /stupid fix for radio buttons loosing their checked value
            var tocheck = [];
            group.getElements('.fabrikinput').each(function (i) {
                if (i.type === 'radio' && i.getProperty('checked')) {
                    tocheck.push(i);
                }
            });
            return tocheck;
        },

        /**
         * Duplicates the groups sub group and places it at the end of the group
         *
         * @param   event  e       Click event
         * @param   bool   scroll  Scroll to group if offscreen
         */
        duplicateGroup: function (e, scroll) {
            scroll = typeof scroll !== 'undefined' ? scroll : true;
            var subElementContainer, container;
            Fabrik.fireEvent('fabrik.form.group.duplicate', [this, e]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            if (e) {
                e.preventDefault();
            }
            var i = e.target.getParent('.fabrikGroup').id.replace('group', '');
            var group_id = i.toInt();
            var group = document.id('group' + i);
            var c = this.repeatGroupMarkers.get(i);
            var repeats = document.id('fabrik_repeat_group_' + i + '_counter').get('value').toInt();
            if (repeats >= this.options.maxRepeat[i] && this.options.maxRepeat[i] !== 0) {
                if (this.options.minMaxErrMsg[i] !== '') {
                    var errorMessage = this.options.minMaxErrMsg[i];
                    errorMessage = errorMessage.replace(/\{min\}/, this.options.minRepeat[i]);
                    errorMessage = errorMessage.replace(/\{max\}/, this.options.maxRepeat[i]);
                    window.alert(errorMessage);
                }
                return;
            }
            document.id('fabrik_repeat_group_' + i + '_counter').value = repeats + 1;

            if (this.isFirstRepeatSubGroup(group)) {
                var subgroups = group.getElements('.fabrikSubGroup');
                // user has removed all repeat groups and now wants to add it back in
                // remove the 'no groups' notice

                var sub = subgroups[0].getElement('.fabrikSubGroupElements');
                if (typeOf(sub) === 'null') {
                    group.getElement('.fabrikNotice').dispose();
                    sub = subgroups[0];

                    // Table group
                    var add = group.getElement('.addGroup');
                    add.inject(sub.getElement('td.fabrikGroupRepeater'));
                    sub.setStyle('display', '');
                } else {
                    subgroups[0].getElement('.fabrikNotice').dispose();
                    subgroups[0].getElement('.fabrikSubGroupElements').show();
                }

                this.repeatGroupMarkers.set(i, this.repeatGroupMarkers.get(i) + 1);
                document.id('fabrik_repeat_group_' + i + '_added').value = '1';

                this.formElements.each(function (e, k) {
                    if (e.groupid === i && typeOf(e.element) !== 'null') {
                        this.addMustValidate(e);
                    }
                }.bind(this));

                Fabrik.fireEvent('fabrik.form.group.duplicate.end', [this, e, i, c]);

                return;
            }

            var clone = this.getSubGroupToClone(i);
            var tocheck = this.repeatGetChecked(group);

            // Check for table style group, which may or may not have a tbody in it
            var groupTable = group.getElement('table.repeatGroupTable');
            if (groupTable) {
                if (groupTable.getElement('tbody')) {
                    groupTable = groupTable.getElement('tbody');
                }
                groupTable.appendChild(clone);
            } else {
                group.appendChild(clone);
            }

            tocheck.each(function (i) {
                i.setProperty('checked', true);
            });

            this.subelementCounter = 0;
            // Remove values and increment ids
            var newElementControllers = [],
                hasSubElements = false,
                inputs = clone.getElements('.fabrikinput'),
                lastinput = null;
            this.formElements.each(function (el) {
                var formElementFound = false;
                subElementContainer = null;
                var subElementCounter = -1;
                inputs.each(function (input) {

                    hasSubElements = el.hasSubElements();

                    container = input.getParent('.fabrikSubElementContainer');
                    var testid = (hasSubElements && container) ? container.id : input.id;
                    var cloneName = el.getCloneName();

                    // Test ===, plus special case for join rendered as auto-complete
                    if (testid === cloneName || testid === cloneName + '-auto-complete') {
                        lastinput = input;
                        formElementFound = true;

                        if (hasSubElements) {
                            subElementCounter++;
                            subElementContainer = input.getParent('.fabrikSubElementContainer');

                            // Clone the first inputs event to all subelements
                            // $$$ hugh - sanity check in case we have an element which has no input
                            if (document.id(testid).getElement('input')) {
                                input.cloneEvents(document.id(testid).getElement('input'));
                            }
                            // Note: Radio's etc. now have their events delegated from the form - so no need to duplicate them

                        } else {
                            input.cloneEvents(el.element);

                            // Update the element id use el.element.id rather than input.id as
                            // that may contain _1 at end of id
                            var bits = Array.mfrom(el.element.id.split('_'));
                            bits.splice(bits.length - 1, 1, c);
                            input.id = bits.join('_');

                            // Update labels for non sub elements
                            var l = input.getParent('.fabrikElementContainer').getElement('label');
                            if (l) {
                                l.setProperty('for', input.id);
                            }
                        }
                        if (typeOf(input.name) !== 'null') {
                            input.name = input.name.replace('[0]', '[' + c + ']');
                        }
                    }
                }.bind(this));

                if (formElementFound) {
                    if (hasSubElements && typeOf(subElementContainer) !== 'null') {
                        // if we are checking subelements set the container id after they have all
                        // been processed
                        // otherwise if check only works for first subelement and no further
                        // events are cloned

                        // $$$ rob fix for date element
                        var bits = Array.mfrom(el.options.element.split('_'));
                        bits.splice(bits.length - 1, 1, c);
                        subElementContainer.id = bits.join('_');
                    }
                    var origelid = el.options.element;
                    // clone js element controller, set form to be passed by reference and
                    // not cloned
                    var ignore = el.unclonableProperties();
                    var newEl = new CloneObject(el, true, ignore);

                    newEl.container = null;
                    newEl.options.repeatCounter = c;

                    // This seems to be wrong, as it'll set origId to the repeat ID with the _X appended.
                    //newEl.origId = origelid;

                    if (hasSubElements && typeOf(subElementContainer) !== 'null') {
                        newEl.element = document.id(subElementContainer);
                        newEl.cloneUpdateIds(subElementContainer.id);
                        newEl.options.element = subElementContainer.id;
                        newEl._getSubElements();
                    } else {
                        newEl.cloneUpdateIds(lastinput.id);
                    }
                    //newEl.reset();
                    newElementControllers.push(newEl);
                }
            }.bind(this));

            newElementControllers.each(function (newEl) {
                newEl.cloned(c);
                // $$$ hugh - moved reset() from end of loop above, otherwise elements with un-cloneable object
                // like maps end up resetting the wrong map to default values.  Needs to run after element has done
                // whatever it needs to do with un-cloneable object before resetting.
                // $$$ hugh - adding new option to allow copying of the existing element values when copying
                // a group, instead of resetting to default value.  This means knowing what the group PK element
                // is, do we don't copy that value.  hence new group_pk_ids[] array, which gives us the PK element
                // name in regular full format, which we need to test against the join string name.
                //var pk_re = new RegExp('\\[' + this.options.group_pk_ids[group_id] + '\\]');
                var pk_re = new RegExp(this.options.group_pk_ids[group_id]);
                if (!this.options.group_copy_element_values[group_id] ||
                    (this.options.group_copy_element_values[group_id] &&
                    newEl.element.name && newEl.element.name.test(pk_re))) {
                    // Call reset method that resets both events and value back to default.
                    newEl.reset();
                }
                else {
                    // Call reset method that only resets the events, not the value
                    newEl.resetEvents();
                }
            }.bind(this));
            var o = {};
            o[i] = newElementControllers;
            this.addElements(o);

	        /**
             * Only scroll the window if the new element is not visible and 'scroll' arg true
             * (so for example, we won't scroll if called from duplicateGroupsToMin)
             */

            if (scroll) {
                var win_size = jQuery(window).height(),
                    win_scroll = document.id(window).getScroll().y,
                    obj = clone.getCoordinates();

	            /**
                 * If the bottom of the new repeat goes below the bottom of the visible window,
                 * scroll up just enough to show it.
                 */

                if (obj.bottom > (win_scroll + win_size)) {
                    var new_win_scroll = obj.bottom - win_size;
                    this.winScroller.start(0, new_win_scroll);
                }
            }

            var myFx = new Fx.Tween(clone, {
                'property': 'opacity',
                duration  : 500
            }).set(0);

            clone.fade(1);
            Fabrik.fireEvent('fabrik.form.group.duplicate.end', [this, e, i, c]);
            this.setRepeatGroupIntro(group, i);
            this.renumberSortable(i);
            this.repeatGroupMarkers.set(i, this.repeatGroupMarkers.get(i) + 1);
            this.addedGroups.push('group' + i);
        },

        /**
         * Set the repeat group intro text
         * @param  {string}  group  group container
         * @param  {string}  groupId  group ID
         */
        setRepeatGroupIntro: function (group, groupId) {
            var intro = this.options.group_repeat_intro[groupId],
                tmpIntro = '',
                targets = group.getElements('*[data-role="group-repeat-intro"]');

            targets.each(function (target, i) {
                tmpIntro = intro.replace('{i}', i + 1);
                // poor man's parseMsgForPlaceholder ... ignore elements in joined groups.
                this.formElements.each(function (el) {
                    if (!el.options.inRepeatGroup) {
                        var re = new RegExp('\{' + el.element.id + '\}');
                        // might should do a match first, to avoid always calling getValue(), just not sure which is more overhead!
                        tmpIntro = tmpIntro.replace(re, el.getValue());
                    }
                });
                target.set('html', tmpIntro);
            }.bind(this));
        },

        update: function (o) {
            Fabrik.fireEvent('fabrik.form.update', [this, o.data]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            var leaveEmpties = arguments[1] || false;
            var data = o.data;
            this.getForm();
            if (this.form) { // test for detailed view in module???
                var rowidel = this.form.getElement('input[name=rowid]');
                if (rowidel && data.rowid) {
                    rowidel.value = data.rowid;
                }
            }
            this.formElements.each(function (el, key) {
                // if updating from a detailed view with prev/next then data's key is in
                // _ro format
                if (typeOf(data[key]) === 'null') {
                    if (key.substring(key.length - 3, key.length) === '_ro') {
                        key = key.substring(0, key.length - 3);
                    }
                }
                // this if stopped the form updating empty fields. Element update()
                // methods
                // should test for null
                // variables and convert to their correct values
                // if (data[key]) {
                if (typeOf(data[key]) === 'null') {
                    // only update blanks if the form is updating itself
                    // leaveEmpties set to true when this form is called from updateRows
                    if (o.id === this.id && !leaveEmpties) {
                        el.update('');
                    }
                } else {
                    el.update(data[key]);
                }
            }.bind(this));
        },

        reset: function () {
            this.addedGroups.each(function (subgroup) {
                var group = document.id(subgroup).findClassUp('fabrikGroup');
                var i = group.id.replace('group', '');
                document.id('fabrik_repeat_group_' + i + '_counter').value =
                    document.id('fabrik_repeat_group_' + i + '_counter').get('value').toInt() - 1;
                subgroup.remove();
            });
            this.addedGroups = [];
            Fabrik.fireEvent('fabrik.form.reset', [this]);
            if (this.result === false) {
                this.result = true;
                return;
            }
            this.formElements.each(function (el, key) {
                el.reset();
            }.bind(this));
        },

        showErrors: function (data) {
            var d = null;
            if (data.id === this.id) {
                // show errors
                var errors = new Hash(data.errors);
                if (errors.getKeys().length > 0) {
                    if (typeOf(this.form.getElement('.fabrikMainError')) !== 'null') {
                        this.form.getElement('.fabrikMainError').set('html', this.options.error);
                        this.form.getElement('.fabrikMainError').removeClass('fabrikHide');
                    }
                    errors.each(function (a, key) {
                        if (typeOf(document.id(key + '_error')) !== 'null') {
                            var e = document.id(key + '_error');
                            var msg = new Element('span');
                            for (var x = 0; x < a.length; x++) {
                                for (var y = 0; y < a[x].length; y++) {
                                    d = new Element('div').appendText(a[x][y]).inject(e);
                                }
                            }
                        } else {
                            fconsole(key + '_error' + ' not found (form show errors)');
                        }
                    });
                }
            }
        },

        /** add additional data to an element - e.g database join elements */
        appendInfo: function (data) {
            this.formElements.each(function (el, key) {
                if (el.appendInfo) {
                    el.appendInfo(data, key);
                }
            }.bind(this));
        },

        clearForm: function () {
            this.getForm();
            if (!this.form) {
                return;
            }
            this.formElements.each(function (el, key) {
                if (key === this.options.primaryKey) {
                    this.form.getElement('input[name=rowid]').value = '';
                }
                el.update('');
            }.bind(this));
            this.form.getElements('.fabrikError').empty();
            this.form.getElements('.fabrikError').addClass('fabrikHide');
        },

	    /**
	     * Reset errors
         */
        clearErrors: function () {
            jQuery(this.form).find('.fabrikError').removeClass('fabrikError')
                .removeClass('error').removeClass('has-error');
            this.hideTips();
        },

        /**
         * Hide tips
         */
        hideTips: function () {
          this.elements.each(function(element) {
              element.removeTipMsg();
          });
        },

        /**
         * If the form is in a modal and the modal scrolls we should update the
         * elements tips to keep the tip attached to the element.
         */
        scrollTips: function () {
            var self = this, top, left,
                match = jQuery(self.form).closest('.fabrikWindow'),
                modal = match.find('.itemContent'),
                currentPos;

            var pos = function () {
                var origPos = match.data('origPosition');
                if (origPos === undefined) {
                    origPos = match.position();
                    match.data('origPosition', origPos);
                }

                currentPos = match.position();
                top = origPos.top - currentPos.top + modal.scrollTop();
                left = origPos.left - currentPos.left + modal.scrollLeft();
                self.elements.each(function(element) {
                    element.moveTip(top, left);
                });
            };

            modal.on('scroll', function () {
                pos();
            });

            Fabrik.on('fabrik.window.resized', function (window) {
                if (match.length > 0 && window === match[0]) {
                    pos();
                }
            });
        },

        stopEnterSubmitting: function () {
            var inputs = this.form.getElements('input.fabrikinput');
            inputs.each(function (el, i) {
                el.addEvent('keypress', function (e) {
                    if (e.key === 'enter') {
                        e.stop();
                        if (inputs[i + 1]) {
                            inputs[i + 1].focus();
                        }
                        //last one?
                        if (i === inputs.length - 1) {
                            this._getButton('Submit').focus();
                        }
                    }
                }.bind(this));
            }.bind(this));
        },

        getSubGroupCounter: function (group_id) {

        },

        addMustValidate: function (el) {
            if (this.options.ajaxValidation && this.options.toggleSubmit) {
	            this.mustValidateEls.set(el.element.id, el.options.mustValidate);
                if (el.options.mustValidate) {
                    this.options.mustValidate = true;
                    this.toggleSubmit(false);
                }
            }
        },

        removeMustValidate: function (el) {
            if (this.options.ajaxValidation && this.options.toggleSubmit) {
                delete this.mustValidateEls[el.element.id];
                if (el.options.mustValidate) {
                    if (!this.mustValidateEls.hasValue(true)) {
                        this.toggleSubmit(true);
                    }
                }
            }
        },

        toggleSubmit: function (on) {
            var submit = this._getButton('Submit');
            if (typeOf(submit) !== 'null') {
                if (on === true) {
                    submit.disabled = '';
                    submit.setStyle('opacity', 1);
	                if (this.options.toggleSubmitTip !== '') {
		                jQuery(this.form).find('.fabrikSubmitWrapper').tooltip('destroy');
		                this.toggleSubmitTipAdded = false;
	                }
                }
                else {
                    submit.disabled = 'disabled';
                    submit.setStyle('opacity', 0.5);
	                if (this.options.toggleSubmitTip !== '') {
	                    if (!this.toggleSubmitTipAdded) {
		                    //jQuery(this.form).find('.fabrikSubmitWrapper').data('toggle', 'tooltip');
		                    //jQuery(this.form).find('.fabrikSubmitWrapper').attr('title', 'Your form cannot be saved until all inputs have been validated');
		                    jQuery(this.form).find('.fabrikSubmitWrapper').tooltip();
		                    this.toggleSubmitTipAdded = true;
	                    }
	                }
                }
                Fabrik.fireEvent('fabrik.form.togglesubmit', [this, on]);
            }
        },

        addPlugins: function (a) {
            var self = this;
            jQuery.each(a, function (k, p) {
                p.form = self;
            });
            this.plugins = a;
        }
    });

        // Deprecated - think its no longer used.
    Fabrik.form = function (ref, id, opts) {
        var form = new FbForm(id, opts);
        Fabrik.addBlock(ref, form);
        return form;
    };
    return FbForm;
});
=======
/*! Fabrik */

define(["jquery","fab/encoder","fab/fabrik","lib/debounce/jquery.ba-throttle-debounce"],function(G,n,S,t){var r=new Class({Implements:[Options,Events],options:{rowid:"",admin:!1,ajax:!1,primaryKey:null,error:"",submitOnEnter:!1,updatedMsg:"Form saved",pages:[],start_page:0,multipage_save:0,ajaxValidation:!1,showLoader:!1,customJsAction:"",plugins:{},ajaxmethod:"post",inlineMessage:!0,print:!1,toggleSubmit:!1,toggleSubmitTip:"must validate",mustValidate:!1,lang:!1,debounceDelay:500,images:{alert:"",action_check:"",ajax_loader:""}},initialize:function(t,e){"null"===typeOf(e.rowid)&&(e.rowid=""),this.id=t,this.result=!0,this.setOptions(e),this.options.pages=$H(this.options.pages),this.subGroups=$H({}),this.currentPage=this.options.start_page,this.formElements=$H({}),this.hasErrors=$H({}),this.mustValidateEls=$H({}),this.toggleSubmitTipAdded=!1,this.elements=this.formElements,this.duplicatedGroups=$H({}),this.addingOrDeletingGroup=!1,this.addedGroups=[],this.watchRepeatNumsDone=!1,this.fx={},this.fx.elements=[],this.fx.hidden=[],this.fx.validations={},this.setUpAll(),this._setMozBoxWidths(),this.options.editable&&function(){this.duplicateGroupsToMin()}.bind(this).delay(1e3),this.events={},this.submitBroker=new FbFormSubmit,this.scrollTips(),S.fireEvent("fabrik.form.loaded",[this])},_setMozBoxWidths:function(){Browser.firefox&&this.getForm()&&this.getForm().getElements(".fabrikElementContainer > .displayBox").each(function(t){var e=t.getParent().getComputedSize(),i=t.getParent().getSize().x-(e.computedLeft+e.computedRight),o=0===t.getParent().getSize().x?400:i;t.setStyle("width",o+"px");var r=t.getElement(".fabrikElement");"null"!==typeOf(r)&&(i=0,t.getChildren().each(function(t){t!==r&&(i+=t.getSize().x)}),r.setStyle("width",o-i-10+"px"))})},setUpAll:function(){if(this.setUp(),this.options.ajaxValidation&&this.options.toggleSubmit&&""!==this.options.toggleSubmitTip){var t=this._getButton("Submit");"null"!==typeOf(t)&&G(t).wrap('<div data-toggle="tooltip" title="'+Joomla.JText._("COM_FABRIK_MUST_VALIDATE")+'" class="fabrikSubmitWrapper" style="display: inline-block"></div>div>')}this.winScroller=new Fx.Scroll(window),this.form&&((this.options.ajax||!1===this.options.submitOnEnter)&&this.stopEnterSubmitting(),this.watchAddOptions()),this.options.editable&&($H(this.options.hiddenGroup).each(function(t,e){if(!0===t&&"null"!==typeOf(document.id("group"+e))){var i=document.id("group"+e).getElement(".fabrikSubGroup");this.subGroups.set(e,i.cloneWithIds()),this.hideLastGroup(e,i)}}.bind(this)),this.setupSortable()),this.repeatGroupMarkers=$H({}),this.form&&(this.form.getElements(".fabrikGroup").each(function(t){var e=t.id.replace("group",""),i=t.getElements(".fabrikSubGroup").length;1===i&&"none"===t.getElement(".fabrikSubGroupElements").getStyle("display")&&(i=0),this.repeatGroupMarkers.set(e,i)}.bind(this)),this.watchGoBackButton()),this.watchPrintButton(),this.watchPdfButton(),this.watchTabs(),this.watchRepeatNums()},watchRepeatNums:function(){S.addEvent("fabrik.form.elements.added",function(t){t.id!==this.id||this.watchRepeatNumsDone||(Object.each(this.options.numRepeatEls,function(t,i){if(""!==t){var o=this.formElements.get(t);o&&o.addNewEventAux(o.getChangeEvent(),function(t){var e=o.getValue();this.options.minRepeat[i]=e.toInt(),this.options.maxRepeat[i]=e.toInt(),this.duplicateGroupsToMin()}.bind(this,o,i))}}.bind(t)),this.watchRepeatNumsDone=!0)}.bind(this))},watchPrintButton:function(){this.form.getElements("a[data-fabrik-print]").addEvent("click",function(t){if(t.stop(),this.options.print)window.print();else{var e=G(t.target).prop("href");e=e.replace(/&rowid=\d+/,"&rowid="+this.options.rowid),!1!==this.options.lang&&(e.test(/\?/)?e+="&lang="+this.options.lang:e+="?lang="+this.options.lang),window.open(e,"win2","status=no,toolbar=no,scrollbars=yes,titlebar=no,menubar=no,resizable=yes,width=400,height=350,directories=no,location=no;")}}.bind(this))},watchPdfButton:function(){this.form.getElements('*[data-role="open-form-pdf"]').addEvent("click",function(t){t.stop();var e=t.event.currentTarget.href.replace(/(rowid=\d*)/,"rowid="+this.options.rowid);!1!==this.options.lang&&(e.test(/\?/)?e+="&lang="+this.options.lang:e+="?lang="+this.options.lang),window.location=e}.bind(this))},watchGoBackButton:function(){if(this.options.ajax){var t=this._getButton("Goback");if("null"===typeOf(t))return;t.addEvent("click",function(t){t.stop(),S.Windows[this.options.fabrik_window_id]?S.Windows[this.options.fabrik_window_id].close():window.history.back()}.bind(this))}},watchAddOptions:function(){this.fx.addOptions=[],this.getForm().getElements(".addoption").each(function(t){var e=t.getParent(".fabrikElementContainer").getElement(".toggle-addoption"),i=new Fx.Slide(t,{duration:500});i.hide(),e.addEvent("click",function(t){t.stop(),i.toggle()})})},setUp:function(){this.form=this.getForm(),this.watchGroupButtons(),this.watchSubmit(),this.createPages(),this.watchClearSession()},getForm:function(){return"null"===typeOf(this.form)&&(this.form=document.id(this.getBlock())),this.form},getBlock:function(){return"null"===typeOf(this.block)&&(this.block=!0===this.options.editable?"form_"+this.id:"details_"+this.id,""!==this.options.rowid&&(this.block+="_"+this.options.rowid)),this.block},addElementFX:function(t,e){var i,o,r;if("group_"===(t=t.replace("fabrik_trigger_","")).slice(0,6)){if(o=t=t.slice(6,t.length),!(i=document.id(t)))return fconsole('Fabrik form::addElementFX: Group "'+t+'" does not exist.'),!1}else{if("element_"!==t.slice(0,8))return fconsole("Fabrik form::addElementFX: Not an element or group: "+t),!1;if(o="element"+(t=t.slice(8,t.length)),!(i=document.id(t)))return fconsole('Fabrik form::addElementFX: Element "'+t+'" does not exist.'),!1;if(!(i=i.getParent(".fabrikElementContainer")))return fconsole('Fabrik form::addElementFX: Element "'+t+'.fabrikElementContainer" does not exist.'),!1}if(i){var n=i.get("tag");"li"===n||"td"===n?(r=new Element("div",{style:"width:100%"}).adopt(i.getChildren()),i.empty(),r.inject(i)):r=i;var s={duration:800,transition:Fx.Transitions.Sine.easeInOut};return"null"===typeOf(this.fx.elements[o])&&(this.fx.elements[o]={}),this.fx.elements[o].css=new Fx.Morph(r,s),"null"===typeOf(r)||"slide in"!==e&&"slide out"!==e&&"slide toggle"!==e||(this.fx.elements[o].slide=new Fx.Slide(r,s)),this.fx.elements[o]}return!1},doElementFX:function(t,e,i){var o,r,n,s,a=this.formElements.get(t.replace("fabrik_trigger_element_","")),l=!0;if(a&&(l=a.options.inRepeatGroup),r="fabrik_trigger_group_"===t.slice(0,21),i&&l&&!r&&i.options.inRepeatGroup){var u=t.split("_");u[u.length-1]=i.options.repeatCounter,t=u.join("_")}if(o="group_"===(t=t.replace("fabrik_trigger_","")).slice(0,6)?("group_"===(t=t.slice(6,t.length)).slice(0,6)&&(t=t.slice(6,t.length)),t):"element"+(t=t.slice(8,t.length)),(n=this.fx.elements[o])||(n=this.addElementFX("element_"+t,e))){switch("td"===(s=r||n.css.element.hasClass("fabrikElementContainer")?n.css.element:n.css.element.getParent(".fabrikElementContainer")).get("tag")&&(s=s.getChildren()[0]),e){case"show":s.fade("show").removeClass("fabrikHide"),r&&(document.id(t).getElements(".fabrikinput").setStyle("opacity","1"),this.showGroupTab(t),s.show());break;case"hide":s.fade("hide").addClass("fabrikHide"),r&&this.hideGroupTab(t);break;case"fadein":s.removeClass("fabrikHide"),"fadein"!==n.css.lastMethod&&(n.css.element.show(),n.css.start({opacity:[0,1]})),r&&(this.showGroupTab(t),s.show());break;case"fadeout":"fadeout"!==n.css.lastMethod&&n.css.start({opacity:[1,0]}).chain(function(){n.css.element.hide(),s.addClass("fabrikHide")}),r&&this.hideGroupTab(t);break;case"slide in":n.slide.slideIn();break;case"slide out":n.slide.slideOut(),s.removeClass("fabrikHide");break;case"slide toggle":n.slide.toggle();break;case"clear":this.formElements.get(t).clear();break;case"disable":r||G("#"+t).prop("disabled",!0);break;case"enable":r||G("#"+t).prop("disabled",!1);break;case"readonly":r||("SELECT"===G("#"+t).prop("tagName")?G("#"+t+" option:not(:selected)").attr("disabled",!0):G("#"+t).prop("readonly",!0));break;case"notreadonly":r||("SELECT"===G("#"+t).prop("tagName")?G("#"+t+" option").attr("disabled",!1):G("#"+t).prop("readonly",!1))}n.lastMethod=e,S.fireEvent("fabrik.form.doelementfx",[this,e,t,r])}},getGroupTab:function(t){if(t.test(/^group/)||(t="group"+t),document.id(t).getParent().hasClass("tab-pane")){var e=document.id(t).getParent().id;return this.form.getElement("a[href=#"+e+"]").getParent()}return!1},hideGroupTab:function(t){var e=this.getGroupTab(t);!1!==e&&(G(e).hide(),e.hasClass("active")&&(e.getPrevious()?G(e.getPrevious().getFirst()).tab("show"):e.getNext()&&G(e.getNext().getFirst()).tab("show")))},selectGroupTab:function(t){var e=this.getGroupTab(t);!1!==e&&(e.hasClass("active")||G(e.getFirst()).tab("show"))},showGroupTab:function(t){var e=this.getGroupTab(t);!1!==e&&G(e).show()},watchTabs:function(){var i=this;G(this.form).on("click","*[data-role=fabrik_tab]",function(t){var e=t.target.id.match(/group(\d+)_tab/);1<e.length&&(e=e[1]),S.fireEvent("fabrik.form.tab.click",[i,e,t],500)})},watchClearSession:function(){if(0!==this.options.multipage_save){var e=this,i=G(this.form);i.find(".clearSession").on("click",function(t){t.preventDefault(),i.find("input[name=task]").val("removeSession"),e.clearForm(),e.form.submit()})}},createPages:function(){var t,i,o;if(this.isMultiPage()){this.options.pages.each(function(t,e){(i=G(document.createElement("div"))).attr({class:"page",id:"page_"+e}),o=G("#group"+t[0]),o.closest("div").hasClass("tab-pane")||(i.insertBefore(o),t.each(function(t){i.append(G("#group"+t))}))}),(t=this._getButton("Submit"))&&""===this.options.rowid&&(t.disabled="disabled",t.setStyle("opacity",.5));var e=this;G(this.form).on("click",".fabrikPagePrevious",function(t){e._doPageNav(t,-1)}),G(this.form).on("click",".fabrikPageNext",function(t){e._doPageNav(t,1)}),this.setPageButtons(),this.hideOtherPages()}},isMultiPage:function(){return 1<this.options.pages.getKeys().length},_doPageNav:function(t,e){var i,o,r=this;this.options.editable?("null"!==typeOf(this.form.getElement(".fabrikMainError"))&&this.form.getElement(".fabrikMainError").addClass("fabrikHide"),G(".tool-tip").css("top",0),i="index.php?option=com_fabrik&format=raw&task=form.ajax_validate&form_id="+this.id,!1!==this.options.lang&&(i+="&lang="+this.options.lang),S.loader.start(this.getBlock(),Joomla.JText._("COM_FABRIK_VALIDATING")),this.clearErrors(),o=G.extend({},this.getFormData(),{task:"form.ajax_validate",fabrik_ajax:"1",format:"raw"}),o=this._prepareRepeatsForAjax(o),G.ajax({url:i,method:this.options.ajaxmethod,data:o}).done(function(t){S.loader.stop(r.getBlock()),t=JSON.parse(t),-1!==e&&!1!==r._showGroupError(t,o)||(r.changePage(e),r.saveGroupsToDb()),G("html, body").animate({scrollTop:G(r.form).offset().top},300)})):this.changePage(e),t.preventDefault()},saveGroupsToDb:function(){var e,i,t,o,r=this,n=this.form.querySelector("input[name=format]"),s=this.form.querySelector("input[name=task]"),a=this.getBlock();0!==this.options.multipage_save&&(S.fireEvent("fabrik.form.groups.save.start",[this]),!1!==this.result?(e=n.value,i=s.value,this.form.querySelector("input[name=format]").value="raw",this.form.querySelector("input[name=task]").value="form.savepage",t="index.php?option=com_fabrik&format=raw&page="+this.currentPage,!1!==this.options.lang&&(t+="&lang="+this.options.lang),S.loader.start(a,"saving page"),(o=this.getFormData()).fabrik_ajax=1,G.ajax({url:t,method:this.options.ajaxmethod,data:o}).done(function(t){S.fireEvent("fabrik.form.groups.save.completed",[r]),!1!==r.result?(n.value=e,s.value=i,r.options.ajax&&S.fireEvent("fabrik.form.groups.save.end",[r,t]),S.loader.stop(a)):r.result=!0})):this.result=!0)},changePage:function(t){this.changePageDir=t,S.fireEvent("fabrik.form.page.change",[this,t]),!1!==this.result?(this.currentPage=this.currentPage.toInt(),0<=this.currentPage+t&&this.currentPage+t<this.options.pages.getKeys().length&&(this.currentPage=this.currentPage+t,this.pageGroupsVisible()||this.changePage(t)),this.setPageButtons(),G("#page_"+this.currentPage).css("display",""),this._setMozBoxWidths(),this.hideOtherPages(),S.fireEvent("fabrik.form.page.chage.end",[this,t]),S.fireEvent("fabrik.form.page.change.end",[this,t]),!1!==this.result||(this.result=!0)):this.result=!0},pageGroupsVisible:function(){var i=!1;return this.options.pages.get(this.currentPage).each(function(t){var e=G("#group"+t);0<e.length&&"none"!==e.css("display")&&(i=!0)}),i},hideOtherPages:function(){var i=parseInt(this.currentPage,10);this.options.pages.each(function(t,e){parseInt(e,10)!==i&&G("#page_"+e).hide()})},setPageButtons:function(){var e=this._getButton("Submit"),t=this.form.getElements(".fabrikPagePrevious");this.form.getElements(".fabrikPageNext").each(function(t){this.currentPage===this.options.pages.getKeys().length-1?("null"!==typeOf(e)&&(e.disabled="",e.setStyle("opacity",1)),t.disabled="disabled",t.setStyle("opacity",.5)):("null"===typeOf(e)||""!==this.options.rowid&&"0"!==this.options.rowid.toString()||(e.disabled="disabled",e.setStyle("opacity",.5)),t.disabled="",t.setStyle("opacity",1))}.bind(this)),t.each(function(t){0===this.currentPage?(t.disabled="disabled",t.setStyle("opacity",.5)):(t.disabled="",t.setStyle("opacity",1))}.bind(this))},destroyElements:function(){this.formElements.each(function(t){t.destroy()})},addElements:function(t){var o=[],e=0;for((t=$H(t)).each(function(t,i){t.each(function(e){if("array"===typeOf(e)){if("null"===typeOf(document.id(e[1])))return void fconsole('Fabrik form::addElements: Cannot add element "'+e[1]+'" because it does not exist in HTML.');try{var t=new window[e[0]](e[1],e[2])}catch(t){return void fconsole('Fabrik form::addElements: Cannot add element "'+e[1]+'" of type "'+e[0]+'" because: '+t.message)}o.push(this.addElement(t,e[1],i))}else if("object"===typeOf(e)){if("null"===typeOf(document.id(e.options.element)))return void fconsole('Fabrik form::addElements: Cannot add element "'+e.options.element+'" because it does not exist in HTML.');o.push(this.addElement(e,e.options.element,i))}else"null"!==typeOf(e)?fconsole("Fabrik form::addElements: Cannot add unknown element: "+e):fconsole("Fabrik form::addElements: Cannot add null element.")}.bind(this))}.bind(this)),e=0;e<o.length;e++)if("null"!==typeOf(o[e]))try{o[e].attachedToForm()}catch(t){fconsole(o[e].options.element+" attach to form:"+t)}S.fireEvent("fabrik.form.elements.added",[this])},addElement:function(t,e,i){var o="_ro"===(e=(e=t.getFormElementsKey(e)).replace("[]","")).substring(e.length-3,e.length);return t.form=this,t.groupid=i,this.formElements.set(e,t),S.fireEvent("fabrik.form.element.added",[this,e,t]),o&&(e=e.substr(0,e.length-3),this.formElements.set(e,t)),this.submitBroker.addElement(e,t),t},dispatchEvent:function(t,e,i,o){"string"===typeOf(o)&&(o=n.htmlDecode(o));var r=this.formElements.get(e);if(!r)Object.each(this.formElements,function(t){e===t.baseElementId&&(r=t)});r?""!==o?r.addNewEvent(i,o):S.debug&&fconsole("Fabrik form::dispatchEvent: Javascript empty for "+i+" event on: "+e):fconsole("Fabrik form::dispatchEvent: Cannot find element to add "+i+" event to: "+e)},action:function(t,e){this.formElements.get(e);Browser.exec("oEl."+t+"()")},triggerEvents:function(t){this.formElements.get(t).fireEvents(arguments[1])},watchValidation:function(t,e){var i=G("#"+t);!1!==this.options.ajaxValidation&&(0!==i.length?(i=this.formElements.get(t)).addAjaxValidation():fconsole("Fabrik form::watchValidation: Could not add "+e+' event because element "'+t+'" does not exist.'))},doElementValidation:function(t,e,i){var o;if(!1!==this.options.ajaxValidation&&(i="null"===typeOf(i)?"_time":i,"event"===typeOf(t)||"object"===typeOf(t)||"domevent"===typeOf(t)?(o=t.target.id,!0===e&&(o=document.id(t.target).getParent(".fabrikSubElementContainer").id)):o=t,"null"!==typeOf(document.id(o)))){!0===document.id(o).getProperty("readonly")||document.id(o).getProperty("readonly");var r=this.formElements.get(o);if((r||(o=o.replace(i,""),r=this.formElements.get(o)))&&r.shouldAjaxValidate())if(S.fireEvent("fabrik.form.element.validation.start",[this,r,t]),!1!==this.result){r.setErrorMessage(Joomla.JText._("COM_FABRIK_VALIDATING"),"fabrikValidating");var n=$H(this.getFormData());n.set("task","form.ajax_validate"),n.set("fabrik_ajax","1"),n.set("format","raw"),!1!==this.options.lang&&n.set("lang",this.options.lang),n=this._prepareRepeatsForAjax(n);var s=o;r.origId&&(s=r.origId+"_0"),r.options.repeatCounter=r.options.repeatCounter?r.options.repeatCounter:0;new Request({url:"",method:this.options.ajaxmethod,data:n,onComplete:function(t){this._completeValidaton(t,o,s)}.bind(this)}).send()}else this.result=!0}},_completeValidaton:function(t,e,i){if(t=JSON.parse(t),"null"===typeOf(t))return this._showElementError(["Oups"],e),void(this.result=!0);if(this.formElements.each(function(t,e){t.afterAjaxValidation()}),S.fireEvent("fabrik.form.element.validation.complete",[this,t,e,i]),!1!==this.result){var o=this.formElements.get(e);"null"!==typeOf(t.modified[i])&&(o.options.inRepeatGroup?o.update(t.modified[i][o.options.repeatCounter]):o.update(t.modified[i])),"null"!==typeOf(t.errors[i])?this._showElementError(t.errors[i][o.options.repeatCounter],e):this._showElementError([],e),this.options.toggleSubmit&&(this.options.mustValidate?(this.hasErrors.has(e)&&this.hasErrors.get(e)||(this.mustValidateEls[e]=!1),this.mustValidateEls.hasValue(!0)||this.toggleSubmit(!0)):this.toggleSubmit(0===this.hasErrors.getKeys().length))}else this.result=!0},_prepareRepeatsForAjax:function(i){return this.getForm(),"hash"===typeOf(i)&&(i=i.getClean()),this.form.getElements("input[name^=fabrik_repeat_group]").each(function(t){if(t.id.test(/fabrik_repeat_group_\d+_counter/)){var e=t.name.match(/\[(.*)\]/)[1];i["fabrik_repeat_group["+e+"]"]=t.get("value")}}),i},_showGroupError:function(o,t){var s,r=Array.mfrom(this.options.pages.get(this.currentPage.toInt())),a=!1;return $H(t).each(function(t,n){if(n=n.replace(/\[(.*)\]/,"").replace(/%5B(.*)%5D/,""),this.formElements.has(n)){var e=this.formElements.get(n);if(r.contains(e.groupid.toInt())){if(o.errors[n])if(e.options.inRepeatGroup)o.errors[n].each(function(t,e){var i=n.replace(/_(\d+)$/,"_"+e),o=this.formElements.get(i),r="";"null"!==typeOf(t)&&(r=t.flatten().join("<br />")),""!==r?(s=this._showElementError(t,i),!1===a&&(a=s)):o.setErrorMessage("","")}.bind(this));else{var i="";"null"!==typeOf(o.errors[n])&&(i=o.errors[n].flatten().join("<br />")),""!==i?(s=this._showElementError(o.errors[n],n),!1===a&&(a=s)):e.setErrorMessage("","")}o.modified[n]&&e&&e.update(o.modified[n])}}}.bind(this)),a},_showElementError:function(t,e){var i="";"null"!==typeOf(t)&&(i=t.flatten().join("<br />"));var o=""===i?"fabrikSuccess":"fabrikError";return""===i?(delete this.hasErrors[e],i=Joomla.JText._("COM_FABRIK_SUCCESS")):this.hasErrors.set(e,!0),i="<span> "+i+"</span>",this.formElements.get(e).setErrorMessage(i,o),"fabrikSuccess"!==o},updateMainError:function(){var t;"null"!==typeOf(this.form.getElement(".fabrikMainError"))&&this.form.getElement(".fabrikMainError").set("html",this.options.error),0<(t=this.form.getElements(".fabrikError").filter(function(t,e){return!t.hasClass("fabrikMainError")})).length&&this.form.getElement(".fabrikMainError").hasClass("fabrikHide")&&this.showMainError(this.options.error),0===t.length&&this.hideMainError()},hideMainError:function(){if("null"!==typeOf(this.form.getElement(".fabrikMainError"))){var t=this.form.getElement(".fabrikMainError");myfx=new Fx.Tween(t,{property:"opacity",duration:500,onComplete:function(){t.addClass("fabrikHide")}}).start(1,0)}},showMainError:function(t){if(!(S.bootstrapped&&this.options.ajaxValidation||"null"===typeOf(this.form.getElement(".fabrikMainError")))){var e=this.form.getElement(".fabrikMainError");e.set("html",t),e.removeClass("fabrikHide"),myfx=new Fx.Tween(e,{property:"opacity",duration:500}).start(0,1)}},_getButton:function(t){if(this.getForm()){var e=this.form.getElement("input[type=button][name="+t+"]");return e||(e=this.form.getElement("input[type=submit][name="+t+"]")),e||(e=this.form.getElement("button[type=button][name="+t+"]")),e||(e=this.form.getElement("button[type=submit][name="+t+"]")),e}},watchSubmit:function(){var t=this._getButton("Submit"),e=this._getButton("apply");if(!t&&!e){if(!this.form.getElement("button[type=submit]"))return;t=this.form.getElement("button[type=submit]")}var i=this._getButton("delete"),o=this._getButton("Copy");i&&i.addEvent("click",function(t){if(!window.confirm(Joomla.JText._("COM_FABRIK_CONFIRM_DELETE_1")))return!1;var e=S.fireEvent("fabrik.form.delete",[this,this.options.rowid]).eventResults;if("null"!==typeOf(e)&&0!==e.length&&e.contains(!1))return t.stop(),!1;this.form.getElement("input[name=task]").value="form.delete",this.doSubmit(t,i)}.bind(this)),this.form.getElements("button[type=submit]").combine([e,t,o]).each(function(e){"null"!==typeOf(e)&&e.addEvent("click",function(t){this.doSubmit(t,e)}.bind(this))}.bind(this)),this.form.addEvent("submit",function(t){this.doSubmit(t)}.bind(this))},mockSubmit:function(t){t=void 0!==t?t:"Submit";var e=this._getButton(t);e||(e=new Element("button",{name:t,type:"submit"})),this.doSubmit(new Event.Mock(e,"click"),e)},doSubmit:function(d,p){if(this.submitBroker.enabled())return d.stop(),!1;this.toggleSubmit(!1),this.submitBroker.submit(function(){if(this.options.showLoader&&S.loader.start(this.getBlock(),Joomla.JText._("COM_FABRIK_LOADING")),S.fireEvent("fabrik.form.submit.start",[this,d,p]),!1===this.result)return this.result=!0,d.stop(),S.loader.stop(this.getBlock()),this.updateMainError(),void this.toggleSubmit(!0);if(1<this.options.pages.getKeys().length&&this.form.adopt(new Element("input",{name:"currentPage",value:this.currentPage.toInt(),type:"hidden"})),hiddenElements=[],G.each(this.formElements,function(t,e){e.element&&0!==G(e.element).closest(".fabrikHide").length&&hiddenElements.push(t)}),this.form.adopt(new Element("input",{name:"hiddenElements",value:JSON.stringify(hiddenElements),type:"hidden"})),this.options.ajax&&this.form){this.options.showLoader||S.loader.start(this.getBlock(),Joomla.JText._("COM_FABRIK_LOADING"));var t=$H(this.getFormData());(t=this._prepareRepeatsForAjax(t))[p.name]=p.value,"Copy"===p.name&&(t.Copy=1,d.stop()),t.fabrik_ajax="1",t.format="raw";new Request.JSON({url:this.form.action,data:t,method:this.options.ajaxmethod,onError:function(t,e){fconsole(t+": "+e),this.showMainError(e),S.loader.stop(this.getBlock(),"Error in returned JSON"),this.toggleSubmit(!0)}.bind(this),onFailure:function(t){fconsole(t),S.loader.stop(this.getBlock(),"Ajax failure"),this.toggleSubmit(!0)}.bind(this),onComplete:function(t,e){if(this.toggleSubmit(!0),"null"===typeOf(t))return S.loader.stop(this.getBlock(),"Error in returned JSON"),void fconsole("error in returned json",t,e);G(this.form.getElements("[data-role=fabrik_tab]")).removeClass("fabrikErrorGroup");var o=!1;if(void 0!==t.errors&&$H(t.errors).each(function(t,e){if(0<t.flatten().length&&(o=!0,this.formElements.has(e)))if(this.formElements[e].options.inRepeatGroup){for(d=0;d<t.length;d++)if(0<t[d].flatten().length){var i=e.replace(/(_\d+)$/,"_"+d);this._showElementError(t[d],i)}}else this._showElementError(t,e)}.bind(this)),this.updateMainError(),!1===o){var i=!1;""===this.options.rowid&&"apply"!==p.name&&(i=!0),S.loader.stop(this.getBlock());var r="null"!==typeOf(t.msg)&&void 0!==t.msg&&""!==t.msg?t.msg:Joomla.JText._("COM_FABRIK_FORM_SAVED");if(!0!==t.baseRedirect)if(i=t.reset_form,void 0!==t.url)if("popup"===t.redirect_how){var n=t.width?t.width:400,s=t.height?t.height:400,a=t.x_offset?t.x_offset:0,l=t.y_offset?t.y_offset:0,u=t.title?t.title:"";S.getWindow({id:"redirect",type:"redirect",contentURL:t.url,caller:this.getBlock(),height:s,width:n,offset_x:a,offset_y:l,title:u})}else"samepage"===t.redirect_how?window.open(t.url,"_self"):"newpage"===t.redirect_how&&window.open(t.url,"_blank");else t.suppressMsg||alert(r);else i=void 0!==t.reset_form?t.reset_form:i,t.suppressMsg||alert(r);S.fireEvent("fabrik.form.submitted",[this,t]),"apply"!==p.name&&(i&&this.clearForm(),S.Windows[this.options.fabrik_window_id]&&S.Windows[this.options.fabrik_window_id].close()),S.fireEvent("fabrik.form.submitted.end",[this,t])}else S.fireEvent("fabrik.form.submit.failed",[this,t]),S.loader.stop(this.getBlock(),Joomla.JText._("COM_FABRIK_VALIDATION_ERROR"))}.bind(this)}).send()}S.fireEvent("fabrik.form.submit.end",[this]),!1===this.result?(this.result=!0,d.stop(),this.updateMainError()):this.options.ajax?(d.stop(),S.fireEvent("fabrik.form.ajax.submit.end",[this])):"null"!==typeOf(p)?(new Element("input",{type:"hidden",name:p.name,value:p.value}).inject(this.form),this.form.submit()):d.stop()}.bind(this)),d.stop()},getFormData:function(t){(t="null"===typeOf(t)||t)&&this.formElements.each(function(t,e){t.onsubmit()}),this.getForm();var e=this.form.toQueryString(),r={};e=e.split("&");var i=$H({});e.each(function(t){var e=(t=t.split("="))[0];"[]"===(e=decodeURI(e)).substring(e.length-2)&&(e=e.substring(0,e.length-2),i.has(e)?i.set(e,i.get(e)+1):i.set(e,0),e=e+"["+i.get(e)+"]"),r[e]=t[1]});this.formElements.getKeys();return this.formElements.each(function(t,i){if("fabrikfileupload"===t.plugin&&(r[i]=t.get("value")),"null"===typeOf(r[i])){var o=!1;$H(r).each(function(t,e){(e=(e=unescape(e)).replace(/\[(.*)\]/,""))===i&&(o=!0)}.bind(this)),o||(r[i]="")}}.bind(this)),r},getFormElementData:function(){var i={};return this.formElements.each(function(t,e){t.element&&(i[e]=t.getValue(),i[e+"_raw"]=i[e])}.bind(this)),i},watchGroupButtons:function(){var r=this;G(this.form).on("click",".deleteGroup",t(this.options.debounceDelay,!0,function(t,e){if(t.preventDefault(),!r.addingOrDeletingGroup){r.addingOrDeletingGroup=!0;var i=t.target.getParent(".fabrikGroup"),o=t.target.getParent(".fabrikSubGroup");r.deleteGroup(t,i,o),r.addingOrDeletingGroup=!1}})),G(this.form).on("click",".addGroup",t(this.options.debounceDelay,!0,function(t,e){t.preventDefault(),r.addingOrDeletingGroup||(r.addingOrDeletingGroup=!0,r.duplicateGroup(t,!0),r.addingOrDeletingGroup=!1)})),this.form.addEvent("click:relay(.fabrikSubGroup)",function(t,e){var i=e.getElement(".fabrikGroupRepeater");i&&(e.addEvent("mouseenter",function(t){i.fade(1)}),e.addEvent("mouseleave",function(t){i.fade(.2)}))}.bind(this))},mockDuplicateGroup:function(t){var e=this.form.getElement("#group"+t+" .addGroup");if("null"===typeOf(e))return!1;var i=new Event.Mock(e,"click");return this.duplicateGroup(i,!1),!0},renumberRepeatGroup:function(t,i,o,r){var e=G(t).find(".fabrikinput");if(e){var n={},s={},a=e[0].id,l=this.formElements.get(a);if(l){var u=a.split("_").getLast();console.log("renumbering: "+u+" => "+o),l.update(o+1),this.formElements.each(function(t,e){t.groupid===i&&e.split("_").getLast()===u&&(n[e]=t.setName(o))}.bind(this)),$H(n).each(function(t,e){e!==t&&(s[t]=this.formElements[e],!0===r&&delete this.formElements[e])}.bind(this)),$H(s).each(function(t,e){this.formElements[e]=t}.bind(this))}}},renumberSortable:function(t){if("null"!==typeOf(this.options.group_repeat_sortable[t])&&this.options.group_repeat_sortable[t]){var e=this.options.group_repeat_order_element[t],i=this.form.getElement("#group"+t),o=G(i).find("tbody"),r=G(o).find(".fabrikRepeatGroup___"+e),n=1;r.each(function(t,e){var i=G(e).find(".fabrikinput");if(i){var o=i[0].id,r=this.formElements.get(o);r&&r.update(n)}n++}.bind(this))}},reorderSortable:function(t){if("null"!==typeOf(this.options.group_repeat_sortable[t])&&this.options.group_repeat_sortable[t]){var e=this.options.group_repeat_order_element[t],i={},o=this.form.getElement("#group"+t),r=G(o).find("tbody"),n=G(r).find(".fabrikRepeatGroup___"+e),s=0,a=!1,l=!1,u=!1,d=!1,p=!1,h=-1;if(n.each(function(t,e){if(!u){var i=G(e).find(".fabrikinput");if(i){var o=i[0].id;if(this.formElements.get(o)){var r=o.split("_").getLast().toInt();if(l)"down"===a&&r===d&&(p=s,u=!0);else{var n=r-h;2===n?(l=!0,a="down",d=s):2<n&&(a="up",d=s,p=r,u=l=!0)}h=r,s++}}}}.bind(this)),"up"===a){m=n[p],this.renumberRepeatGroup(m,t,9999,!1);for(var f=p-1;d<=f;f--)m=n[f],this.renumberRepeatGroup(m,t,f,!1);m=n[p],this.renumberRepeatGroup(m,t,p,!0)}else{var m;m=n[p],this.renumberRepeatGroup(m,t,9999,!1);for(f=d;f<p;f++)m=n[f],this.renumberRepeatGroup(m,t,f,!1);m=n[p],this.renumberRepeatGroup(m,t,p,!0)}$H({}).each(function(t,e){e!==t&&(i[t]=this.formElements[e])}.bind(this)),$H(i).each(function(t,e){this.formElements[t]=e}.bind(this))}},setupSortable:function(){this.form&&Object.each(this.options.group_repeats,function(t,e){if(1===t.toInt()){if("null"!==typeOf(this.options.group_repeat_sortable[e])&&this.options.group_repeat_tablesort[e]){var i=this.form.getElement("#group"+e);if(i){var o=[];i.getElements("th.fabrikElementContainer").each(function(t,e){t.hasClass("fabrikHide")?o.push("fabrikHide"):o.push("")}),G("#group"+e+" table").tablesorter({theme:"blue",widthFixed:!0,widgets:["filter"],cssInfoBlock:"tablesorter-no-sort",ignoreCase:!0,widgetOptions:{filter_ignoreCase:!0,filter_matchType:{input:"match",select:"match"},filter_saveFilters:!0,filter_liveSearch:!0,filter_cellFilter:o}})}}"null"!==typeOf(this.options.group_repeat_sortable[e])&&this.options.group_repeat_sortable[e]&&(S.addEvent("fabrik.form.elements.added",function(t){this.renumberSortable(e)}.bind(this)),G("#group"+e+" table tbody").sortable({scroll:!0,scrollSensitivity:100,stop:function(t,e){var i=e.item[0].closest(".fabrikGroup").id.replace("group","");this.reorderSortable(i)}.bind(this)}))}}.bind(this))},duplicateGroupsToMin:function(){this.form&&(S.fireEvent("fabrik.form.group.duplicate.min",[this]),Object.each(this.options.group_repeats,function(t,e){if("null"!==typeOf(this.options.minRepeat[e])&&1===t.toInt()){var i,o,r,n,s,a,l,u=this.form.getElement("#fabrik_repeat_group_"+e+"_counter"),d=this.form.getElement("#fabrik_repeat_group_"+e+"_added").value;if("null"!==typeOf(u)){1===(i=o=u.value.toInt())&&(a=this.form.getElement("#"+this.options.group_pk_ids[e]+"_0"),"1"!==d&&"null"!==typeOf(a)&&""===a.value&&(o=0));var p,h=this.options.minRepeat[e].toInt(),f=this.options.maxRepeat[e].toInt(),m=this.form.getElement("#group"+e);if(0===h&&0===o)n=this.form.getElement("#group"+e+" .deleteGroup"),l="null"!==typeOf(n)&&new Event.Mock(n,"click"),p=m.getElement(".fabrikSubGroup"),this.deleteGroup(l,m,p);else if(i<h){if(r=this.form.getElement("#group"+e+" .addGroup"),"null"!==typeOf(r)){var c=new Event.Mock(r,"click");for(s=i;s<h;s++)this.duplicateGroup(c,!1)}}else if(0<f&&f<i)for(s=i;f<s;s--){var g=G(this.form.getElements("#group"+e+" .deleteGroup")).last()[0],b=G(g).find("[data-role=fabrik_delete_group]")[0];if(p=G(m.getElements(".fabrikSubGroup")).last()[0],"null"!==typeOf(b)){var E=new Event.Mock(b,"click");this.deleteGroup(E,m,p)}}this.setRepeatGroupIntro(m,e)}}}.bind(this)))},deleteGroup:function(t,e,i){if(S.fireEvent("fabrik.form.group.delete",[this,t,e]),!1!==this.result){t&&t.preventDefault();var o=0,r=G(t.target).find("[data-role=fabrik_delete_group]").addBack("[data-role=fabrik_delete_group]")[0];e.getElements(".deleteGroup").each(function(t,e){G(t).find("[data-role=fabrik_delete_group]")[0]===r&&(o=e)}.bind(this));var n=e.id.replace("group","");if(document.id("fabrik_repeat_group_"+n+"_counter").get("value").toInt()<=this.options.minRepeat[n]&&0!==this.options.minRepeat[n]){if(""!==this.options.minMaxErrMsg[n]){var s=this.options.minMaxErrMsg[n];s=(s=s.replace(/\{min\}/,this.options.minRepeat[n])).replace(/\{max\}/,this.options.maxRepeat[n]),alert(s)}}else if(delete this.duplicatedGroups.i,"0"!==document.id("fabrik_repeat_group_"+n+"_counter").value){var a=e.getElements(".fabrikSubGroup");if(this.subGroups.set(n,i.clone()),a.length<=1)this.hideLastGroup(n,i),this.formElements.each(function(t,e){t.groupid===n&&"null"!==typeOf(t.element)&&this.removeMustValidate(t)}.bind(this)),document.id("fabrik_repeat_group_"+n+"_added").value="0",S.fireEvent("fabrik.form.group.delete.end",[this,t,n,o]);else{var l=i.getPrevious();1<a.length&&i.dispose(),this.formElements.each(function(t,e){"null"!==typeOf(t.element)&&"null"===typeOf(document.id(t.element.id))&&(t.decloned(n),delete this.formElements[e])}.bind(this)),a=e.getElements(".fabrikSubGroup");var u={};if(this.formElements.each(function(t,e){t.groupid===n&&(u[e]=t.decreaseName(o))}.bind(this)),$H(u).each(function(t,e){e!==t&&(this.formElements[t]=this.formElements[e],delete this.formElements[e])}.bind(this)),S.fireEvent("fabrik.form.group.delete.end",[this,t,n,o]),l){var d=document.id(window).getScroll().y,p=l.getCoordinates();if(p.top<d){var h=p.top;this.winScroller.start(0,h)}}}document.id("fabrik_repeat_group_"+n+"_counter").value=document.id("fabrik_repeat_group_"+n+"_counter").get("value").toInt()-1,this.repeatGroupMarkers.set(n,this.repeatGroupMarkers.get(n)-1),this.renumberSortable(n),this.setRepeatGroupIntro(e,n)}}else this.result=!0},hideLastGroup:function(t,e){var i=this.options.noDataMsg[t];""===i&&(i=Joomla.JText._("COM_FABRIK_NO_REPEAT_GROUP_DATA"));var o=e.getElement(".fabrikSubGroupElements"),r=new Element("div",{class:"fabrikNotice alert"}).appendText(i);if("null"===typeOf(o)){var n=(o=e).getElement(".addGroup");if("null"!==typeOf(n)){var s=o.getParent("table").getElements('*[data-role="fabrik-group-repeaters"]').getLast();s||(s=o.getParent("table").getElements("thead th").getLast()),n.inject(s)}}o.setStyle("display","none"),r.inject(o,"after")},isFirstRepeatSubGroup:function(t){return 1===t.getElements(".fabrikSubGroup").length&&t.getElement(".fabrikNotice")},getSubGroupToClone:function(t){var e=document.id("group"+t).getElement(".fabrikSubGroup");e||(e=this.subGroups.get(t));var i=null,o=!1;return this.duplicatedGroups.has(t)&&(o=!0),o?i=e?e.cloneNode(!0):this.duplicatedGroups.get(t):(i=e.cloneNode(!0),this.duplicatedGroups.set(t,i)),i},repeatGetChecked:function(t){var e=[];return t.getElements(".fabrikinput").each(function(t){"radio"===t.type&&t.getProperty("checked")&&e.push(t)}),e},duplicateGroup:function(t,e){var a,l;if(e=void 0===e||e,S.fireEvent("fabrik.form.group.duplicate",[this,t]),!1!==this.result){t&&t.preventDefault();var i=t.target.getParent(".fabrikGroup").id.replace("group",""),o=i.toInt(),r=document.id("group"+i),u=this.repeatGroupMarkers.get(i),n=document.id("fabrik_repeat_group_"+i+"_counter").get("value").toInt();if(n>=this.options.maxRepeat[i]&&0!==this.options.maxRepeat[i]){if(""!==this.options.minMaxErrMsg[i]){var s=this.options.minMaxErrMsg[i];s=(s=s.replace(/\{min\}/,this.options.minRepeat[i])).replace(/\{max\}/,this.options.maxRepeat[i]),window.alert(s)}}else{if(document.id("fabrik_repeat_group_"+i+"_counter").value=n+1,this.isFirstRepeatSubGroup(r)){var d=r.getElements(".fabrikSubGroup"),p=d[0].getElement(".fabrikSubGroupElements");if("null"===typeOf(p))r.getElement(".fabrikNotice").dispose(),p=d[0],r.getElement(".addGroup").inject(p.getElement("td.fabrikGroupRepeater")),p.setStyle("display","");else d[0].getElement(".fabrikNotice").dispose(),d[0].getElement(".fabrikSubGroupElements").show();return this.repeatGroupMarkers.set(i,this.repeatGroupMarkers.get(i)+1),document.id("fabrik_repeat_group_"+i+"_added").value="1",this.formElements.each(function(t,e){t.groupid===i&&"null"!==typeOf(t.element)&&this.addMustValidate(t)}.bind(this)),void S.fireEvent("fabrik.form.group.duplicate.end",[this,t,i,u])}var h=this.getSubGroupToClone(i),f=this.repeatGetChecked(r),m=r.getElement("table.repeatGroupTable");m?(m.getElement("tbody")&&(m=m.getElement("tbody")),m.appendChild(h)):r.appendChild(h),f.each(function(t){t.setProperty("checked",!0)}),this.subelementCounter=0;var c=[],g=!1,b=h.getElements(".fabrikinput"),E=null;this.formElements.each(function(n){var s=!1;a=null;if(b.each(function(t){g=n.hasSubElements(),l=t.getParent(".fabrikSubElementContainer");var e=g&&l?l.id:t.id,i=n.getCloneName();if(e===i||e===i+"-auto-complete"){if(E=t,s=!0,g)0,a=t.getParent(".fabrikSubElementContainer"),document.id(e).getElement("input")&&t.cloneEvents(document.id(e).getElement("input"));else{t.cloneEvents(n.element);var o=Array.mfrom(n.element.id.split("_"));o.splice(o.length-1,1,u),t.id=o.join("_");var r=t.getParent(".fabrikElementContainer").getElement("label");r&&r.setProperty("for",t.id)}"null"!==typeOf(t.name)&&(t.name=t.name.replace("[0]","["+u+"]"))}}.bind(this)),s){if(g&&"null"!==typeOf(a)){var t=Array.mfrom(n.options.element.split("_"));t.splice(t.length-1,1,u),a.id=t.join("_")}n.options.element;var e=n.unclonableProperties(),i=new CloneObject(n,!0,e);i.container=null,i.options.repeatCounter=u,g&&"null"!==typeOf(a)?(i.element=document.id(a),i.cloneUpdateIds(a.id),i.options.element=a.id,i._getSubElements()):i.cloneUpdateIds(E.id),c.push(i)}}.bind(this)),c.each(function(t){t.cloned(u);var e=new RegExp(this.options.group_pk_ids[o]);!this.options.group_copy_element_values[o]||this.options.group_copy_element_values[o]&&t.element.name&&t.element.name.test(e)?t.reset():t.resetEvents()}.bind(this));var v={};if(v[i]=c,this.addElements(v),e){var k=G(window).height(),_=document.id(window).getScroll().y,y=h.getCoordinates();if(y.bottom>_+k){var w=y.bottom-k;this.winScroller.start(0,w)}}new Fx.Tween(h,{property:"opacity",duration:500}).set(0);h.fade(1),S.fireEvent("fabrik.form.group.duplicate.end",[this,t,i,u]),this.setRepeatGroupIntro(r,i),this.renumberSortable(i),this.repeatGroupMarkers.set(i,this.repeatGroupMarkers.get(i)+1),this.addedGroups.push("group"+i)}}else this.result=!0},setRepeatGroupIntro:function(t,e){var i=this.options.group_repeat_intro[e],o="";t.getElements('*[data-role="group-repeat-intro"]').each(function(t,e){o=i.replace("{i}",e+1),this.formElements.each(function(t){if(!t.options.inRepeatGroup){var e=new RegExp("{"+t.element.id+"}");o=o.replace(e,t.getValue())}}),t.set("html",o)}.bind(this))},update:function(i){if(S.fireEvent("fabrik.form.update",[this,i.data]),!1!==this.result){var o=arguments[1]||!1,r=i.data;if(this.getForm(),this.form){var t=this.form.getElement("input[name=rowid]");t&&r.rowid&&(t.value=r.rowid)}this.formElements.each(function(t,e){"null"===typeOf(r[e])&&"_ro"===e.substring(e.length-3,e.length)&&(e=e.substring(0,e.length-3)),"null"===typeOf(r[e])?i.id!==this.id||o||t.update(""):t.update(r[e])}.bind(this))}else this.result=!0},reset:function(){this.addedGroups.each(function(t){var e=document.id(t).findClassUp("fabrikGroup").id.replace("group","");document.id("fabrik_repeat_group_"+e+"_counter").value=document.id("fabrik_repeat_group_"+e+"_counter").get("value").toInt()-1,t.remove()}),this.addedGroups=[],S.fireEvent("fabrik.form.reset",[this]),!1!==this.result?this.formElements.each(function(t,e){t.reset()}.bind(this)):this.result=!0},showErrors:function(t){if(t.id===this.id){var e=new Hash(t.errors);0<e.getKeys().length&&("null"!==typeOf(this.form.getElement(".fabrikMainError"))&&(this.form.getElement(".fabrikMainError").set("html",this.options.error),this.form.getElement(".fabrikMainError").removeClass("fabrikHide")),e.each(function(t,e){if("null"!==typeOf(document.id(e+"_error")))for(var i=document.id(e+"_error"),o=(new Element("span"),0);o<t.length;o++)for(var r=0;r<t[o].length;r++)new Element("div").appendText(t[o][r]).inject(i);else fconsole(e+"_error not found (form show errors)")}))}},appendInfo:function(i){this.formElements.each(function(t,e){t.appendInfo&&t.appendInfo(i,e)}.bind(this))},clearForm:function(){this.getForm(),this.form&&(this.formElements.each(function(t,e){e===this.options.primaryKey&&(this.form.getElement("input[name=rowid]").value=""),t.update("")}.bind(this)),this.form.getElements(".fabrikError").empty(),this.form.getElements(".fabrikError").addClass("fabrikHide"))},clearErrors:function(){G(this.form).find(".fabrikError").removeClass("fabrikError").removeClass("error").removeClass("has-error"),this.hideTips()},hideTips:function(){this.elements.each(function(t){t.removeTipMsg()})},scrollTips:function(){var e,i,o,r=this,n=G(r.form).closest(".fabrikWindow"),s=n.find(".itemContent"),a=function(){var t=n.data("origPosition");void 0===t&&(t=n.position(),n.data("origPosition",t)),o=n.position(),e=t.top-o.top+s.scrollTop(),i=t.left-o.left+s.scrollLeft(),r.elements.each(function(t){t.moveTip(e,i)})};s.on("scroll",function(){a()}),S.on("fabrik.window.resized",function(t){0<n.length&&t===n[0]&&a()})},stopEnterSubmitting:function(){var i=this.form.getElements("input.fabrikinput");i.each(function(t,e){t.addEvent("keypress",function(t){"enter"===t.key&&(t.stop(),i[e+1]&&i[e+1].focus(),e===i.length-1&&this._getButton("Submit").focus())}.bind(this))}.bind(this))},getSubGroupCounter:function(t){},addMustValidate:function(t){this.options.ajaxValidation&&this.options.toggleSubmit&&(this.mustValidateEls.set(t.element.id,t.options.mustValidate),t.options.mustValidate&&(this.options.mustValidate=!0,this.toggleSubmit(!1)))},removeMustValidate:function(t){this.options.ajaxValidation&&this.options.toggleSubmit&&(delete this.mustValidateEls[t.element.id],t.options.mustValidate&&(this.mustValidateEls.hasValue(!0)||this.toggleSubmit(!0)))},toggleSubmit:function(t){var e=this._getButton("Submit");"null"!==typeOf(e)&&(!0===t?(e.disabled="",e.setStyle("opacity",1),""!==this.options.toggleSubmitTip&&(G(this.form).find(".fabrikSubmitWrapper").tooltip("destroy"),this.toggleSubmitTipAdded=!1)):(e.disabled="disabled",e.setStyle("opacity",.5),""!==this.options.toggleSubmitTip&&(this.toggleSubmitTipAdded||(G(this.form).find(".fabrikSubmitWrapper").tooltip(),this.toggleSubmitTipAdded=!0))),S.fireEvent("fabrik.form.togglesubmit",[this,t]))},addPlugins:function(t){var i=this;G.each(t,function(t,e){e.form=i}),this.plugins=t}});return S.form=function(t,e,i){var o=new r(e,i);return S.addBlock(t,o),o},r});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
