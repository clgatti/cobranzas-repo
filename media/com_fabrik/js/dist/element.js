<<<<<<< HEAD
/**
 * Element
 *
 * @copyright: Copyright (C) 2005-2013, fabrikar.com - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, CloneObject:true, $H:true,unescape:true,Asset:true */

define(['jquery'], function (jQuery) {
    window.FbElement = new Class({

        Implements: [Events, Options],

        options: {
	        element    : null,
	        defaultVal : '',
	        value      : '',
	        label      : '',
	        editable   : false,
	        isJoin     : false,
	        joinId     : 0,
	        changeEvent: 'change',
            hasAjaxValidation: false
        },

        /**
         * Ini the element
         *
         * @return  bool  false if document.id(this.options.element) not found
         */

        initialize: function (element, options) {
            var self = this;
            this.setPlugin('');
            options.element = element;
            this.strElement = element;
            this.loadEvents = []; // need to store these for use if the form is reset
            this.events = $H({}); // was changeEvents
            this.setOptions(options);
            // If this element is a 'chosen' select, we need to relay the jQuery change event to Moo
            if (this.options.advanced) {
                var changeEvent = this.getChangeEvent();
                jQuery('#' + this.options.element).on('change', {changeEvent: changeEvent}, function (event) {
                    document.id(this.id).fireEvent(event.data.changeEvent, new Event.Mock(document.id(this.id),
                        event.data.changeEvent));
                });
            }

            // In ajax pop up form. Close the validation tip message when we focus in the element
            Fabrik.on('fabrik.form.element.added', function (form, elId, el) {
                if (el === self) {
                    self.addNewEvent(self.getFocusEvent(), function () {
                        self.removeTipMsg();
                    });
                }
            });

            return this.setElement();
        },

        /**
         * Called when form closed in ajax window
         * Should remove any events added to Window or Fabrik
         */
        destroy: function () {

        },

        setPlugin: function (plugin) {
            if (typeOf(this.plugin) === 'null' || this.plugin === '') {
                this.plugin = plugin;
            }
        },

        getPlugin: function () {
            return this.plugin;
        },

        setElement: function () {
            if (document.id(this.options.element)) {
                this.element = document.id(this.options.element);
                this.setorigId();
                return true;
            }
            return false;
        },

        get: function (v) {
            if (v === 'value') {
                return this.getValue();
            }
        },

        /**
         * Sets the element key used in Fabrik.blocks.form_X.formElements
         * Overwritten by any element which performs a n-n join (multi ajax fileuploads, dbjoins as checkboxes)
         *
         * @since   3.0.7
         *
         * @return  string
         */
        getFormElementsKey: function (elId) {
            this.baseElementId = elId;
            return elId;
        },

        attachedToForm: function () {
            this.setElement();
            if (Fabrik.bootstrapped) {
                this.alertImage = new Element('i.' + this.form.options.images.alert);
                this.successImage = new Element('i.icon-checkmark', {'styles': {'color': 'green'}});
            } else {
                this.alertImage = new Asset.image(this.form.options.images.alert);
                this.alertImage.setStyle('cursor', 'pointer');
                this.successImage = new Asset.image(this.form.options.images.action_check);
            }

            if (jQuery(this.form.options.images.ajax_loader).data('isicon')) {
                this.loadingImage = new Element('span').set('html', this.form.options.images.ajax_loader);
            } else {
                this.loadingImage = new Asset.image(this.form.options.images.ajax_loader);
            }

            this.form.addMustValidate(this);
            //put ini code in here that can't be put in initialize()
            // generally any code that needs to refer to  this.form, which
            //is only set when the element is assigned to the form.
        },

        /**
         * Allows you to fire an array of events to element /  sub elements, used in calendar
         * to trigger js events when the calendar closes
         * @param {array} evnts
         */
        fireEvents: function (evnts) {
            if (this.hasSubElements()) {
                this._getSubElements().each(function (el) {
                    Array.mfrom(evnts).each(function (e) {
                        el.fireEvent(e);
                    }.bind(this));
                }.bind(this));
            } else {
                Array.mfrom(evnts).each(function (e) {
                    if (this.element) {
                        this.element.fireEvent(e);
                    }
                }.bind(this));
            }
        },

        getElement: function () {
            //use this in mocha forms whose elements (such as database joins) aren't loaded
            //when the class is ini'd
            if (typeOf(this.element) === 'null') {
                this.element = document.id(this.options.element);
            }
            return this.element;
        },

        /**
         * Used for elements like checkboxes or radio buttons
         * @returns [DomNodes]
         * @private
         */
        _getSubElements: function () {
            var element = this.getElement();
            if (typeOf(element) === 'null') {
                return false;
            }
            this.subElements = element.getElements('.fabrikinput');
            return this.subElements;
        },

        hasSubElements: function () {
            this._getSubElements();
            if (typeOf(this.subElements) === 'array' || typeOf(this.subElements) === 'elements') {
                return this.subElements.length > 0 ? true : false;
            }
            return false;
        },

        unclonableProperties: function () {
            return ['form'];
        },

        /**
         * Set names/ids/elements etc. when the elements group is cloned
         *
         * @param   int  id  element id
         * @since   3.0.7
         */

        cloneUpdateIds: function (id) {
            this.element = document.id(id);
            this.options.element = id;
        },

        runLoadEvent: function (js, delay) {
            delay = delay ? delay : 0;
            //should use eval and not Browser.exec to maintain reference to 'this'
            if (typeOf(js) === 'function') {
                js.delay(delay);
            } else {
                if (delay === 0) {
                    eval(js);
                } else {
                    (function () {
                        console.log('delayed calling runLoadEvent for ' + delay);
                        eval(js);
                    }.bind(this)).delay(delay);
                }
            }
        },

        /**
         * called from list when ajax form closed
         * fileupload needs to remove its onSubmit event
         * otherwise 2nd form submission will use first forms event
         */
        removeCustomEvents: function () {
        },

        /**
         * Was renewChangeEvents() but don't see why change events should be treated
         * differently to other events?
         *
         * @since 3.0.7
         */
        renewEvents: function () {
            this.events.each(function (fns, type) {
                this.element.removeEvents(type);
                fns.each(function (js) {
                    this.addNewEventAux(type, js);
                }.bind(this));
            }.bind(this));
        },

        addNewEventAux: function (action, js) {
            this.element.addEvent(action, function (e) {
                // Don't stop event - means fx's onchange events wouldn't fire.
                typeOf(js) === 'function' ? js.delay(0, this, this) : eval(js);
            }.bind(this));
        },

        /**
         * Add a JS event to the element
         * @param {string} action
         * @param {string|function} js
         */
        addNewEvent: function (action, js) {
            if (action === 'load') {
                this.loadEvents.push(js);
                this.runLoadEvent(js);
            } else {
                if (!this.element) {
                    this.element = document.id(this.strElement);
                }
                if (this.element) {
                    if (!Object.keys(this.events).contains(action)) {
                        this.events[action] = [];
                    }
                    this.events[action].push(js);
                    this.addNewEventAux(action, js);
                }
            }
        },

        // Alias to addNewEvent.
        addEvent: function (action, js) {
            this.addNewEvent(action, js);
        },

        validate: function () {
        },

        /**
         * Add AJAX validation trigger, called from form model setup or when cloned
         */
        addAjaxValidationAux: function () {
            var self = this;
            // the hasAjaxValidation flag is only set during setup
            if (this.element && this.options.hasAjaxValidation) {
                var $el = jQuery(this.element);
                if ($el.hasClass('fabrikSubElementContainer')) {
                    // check for things like radio buttons & checkboxes
                    $el.find('.fabrikinput').on(this.getChangeEvent(), function (e) {
                        self.form.doElementValidation(e, true);
                    });
                    return;
                }
                $el.on(this.getChangeEvent(), function (e) {
                    self.form.doElementValidation(e, false);
                });
            }
        },

        /**
         * Add AJAX validation trigger, called from form model
         */
        addAjaxValidation: function () {
            var self = this;
            if (!this.element) {
                this.element = document.id(this.strElement);
            }
            if (this.element) {
                // set our hasAjaxValidation flag and do the actual event add
                this.options.hasAjaxValidation = true;
                this.addAjaxValidationAux();
            }
        },

        //store new options created by user in hidden field
        addNewOption: function (val, label) {
            var a;
            var added = document.id(this.options.element + '_additions').value;
            var json = {'val': val, 'label': label};
            if (added !== '') {
                a = JSON.parse(added);
            } else {
                a = [];
            }
            a.push(json);
            var s = '[';
            for (var i = 0; i < a.length; i++) {
                s += JSON.stringify(a[i]) + ',';
            }
            s = s.substring(0, s.length - 1) + ']';
            document.id(this.options.element + '_additions').value = s;
        },

        getLabel: function () {
            return this.options.label;
        },

        /**
         * Set the label (uses textContent attribute, prolly won't work on IE < 9)
         *
         * @param {string} label
         */
        setLabel: function (label) {
            this.options.label = label;
            var c = this.getLabelElement();
            if (c) {
                c[0].textContent = label;
            }
        },

        //below functions can override in plugin element classes

        update: function (val) {
            //have to call getElement() - otherwise inline editor doesn't work when editing 2nd row of data.
            if (this.getElement()) {
                if (this.options.editable) {
                    this.element.value = val;
                } else {
                    this.element.innerHTML = val;
                }
            }
        },

        /**
         * $$$ hugh - testing something for join elements, where in some corner cases,
         * like reverse Geocoding in the map element, we need to update elements that might be
         * joins, and all we have is the label (like "Austria" for country).  So am overriding this
         * new function in the join element, with code that finds the first occurrence of the label,
         * and sets the value accordingly.  But all we need to do here is make it a wrapper for update().
         */
        updateByLabel: function (label) {
            this.update(label);
        },

        // Alias to update()
        set: function (val) {
            this.update(val);
        },

        getValue: function () {
            if (this.element) {
                if (this.options.editable) {
                    return this.element.value;
                } else {
                    return this.options.value;
                }
            }
            return false;
        },

        reset: function () {
            if (this.options.editable === true) {
                this.update(this.options.defaultVal);
            }
            this.resetEvents();
        },

        resetEvents: function () {
            this.loadEvents.each(function (js) {
                this.runLoadEvent(js, 100);
            }.bind(this));
        },

        clear: function () {
            this.update('');
        },

        /**
         * Called from FbFormSubmit
         *
         * @params   function  cb  Callback function to run when the element is in an
         *                         acceptable state for the form processing to continue
         *                         Should use cb(true) to allow for the form submission,
         *                         cb(false) stops the form submission.
         *
         * @return  void
         */
        onsubmit: function (cb) {
            if (cb) {
                cb(true);
            }
        },

        /**
         * As ajax validations call onsubmit to get the correct date, we need to
         * reset the date back to the display date when the validation is complete
         */
        afterAjaxValidation: function () {

        },

        /**
         * Called before an AJAX validation is triggered, in case an element wants to abort it,
         * for example date element with time picker
         */
        shouldAjaxValidate: function () {
            return true;
        },

        /**
         * Run when the element is cloned in a repeat group
         */
        cloned: function (c) {
            this.renewEvents();
            this.resetEvents();
            this.addAjaxValidationAux();
            var changeEvent = this.getChangeEvent();
            if (this.element.hasClass('chzn-done')) {
                this.element.removeClass('chzn-done');
                this.element.addClass('chzn-select');
                this.element.getParent().getElement('.chzn-container').destroy();
                jQuery('#' + this.element.id).chosen();
                jQuery(this.element).addClass('chzn-done');

                jQuery('#' + this.options.element).on('change', {changeEvent: changeEvent}, function (event) {
                    document.id(this.id).fireEvent(event.data.changeEvent, new Event.Mock(event.data.changeEvent,
                        document.id(this.id)));
                });
            }
        },

        /**
         * Run when the element is de-cloned from the form as part of a deleted repeat group
         */
        decloned: function (groupid) {
            this.form.removeMustValidate(this);
        },

        /**
         * get the wrapper dom element that contains all of the elements dom objects
         */
        getContainer: function () {
            var c = jQuery(this.element).closest('.fabrikElementContainer');
            if (c.length === 0) {
                c = false;
            } else {
                c = c[0];
            }
            return typeOf(this.element) === 'null' ? false : c;
        },

        /**
         * get the dom element which shows the error messages
         */
        getErrorElement: function () {
            return this.getContainer().getElements('.fabrikErrorMessage');
        },

        /**
         * get the dom element which contains the label
         */
        getLabelElement: function () {
            return this.getContainer().getElements('.fabrikLabel');
        },

        /**
         * Get the fx to fade up/down element validation feedback text
         */
        getValidationFx: function () {
            if (!this.validationFX) {
                this.validationFX = new Fx.Morph(this.getErrorElement()[0], {duration: 500, wait: true});
            }
            return this.validationFX;
        },

        /**
         * Get all tips attached to the element
         *
         * @return array of tips
         */
        tips: function () {
            var self = this;
            return jQuery(Fabrik.tips.elements).filter(function (index, t) {
                if (t === self.getContainer() || t.getParent() === self.getContainer()) {
                    return true;
                }
            });
        },

        /**
         * In 3.1 show error messages in tips - avoids jumpy pages with ajax validations
         */
        addTipMsg: function (msg, klass) {
            // Append notice to tip
            klass = klass ? klass : 'error';
            var ul, a, d, li, html, t = this.tips();
            if (t.length === 0) {
                return;
            }
            t = jQuery(t[0]);

            if (t.attr(klass) === undefined) {
                t.attr(klass, msg);
                a = this._tipContent(t, false);

                d = jQuery('<div>');
                d.html(a.html());
                li = jQuery('<li>').addClass(klass);
                li.html(msg);
                jQuery('<i>').addClass(this.form.options.images.alert).prependTo(li);

                // Only append the message once (was duplicating on multi-page forms)
                if (d.find('li:contains("' + jQuery(msg).text() + '")').length === 0) {
                    d.find('ul').append(li);
                }
                html = unescape(d.html());

                if (t.data('fabrik-tip-orig') === undefined) {
                    t.data('fabrik-tip-orig', a.html());
                }

                this._recreateTip(t, html);
            }
            try {
                t.data('popover').show();
            } catch (e) {
                t.popover('show');
            }
        },

        /**
         * Recreate the popover tip with html
         * @param {jQuery} t
         * @param {string} html
         * @private
         */
        _recreateTip: function (t, html) {
            try {
                t.data('content', html);
                t.data('popover').setContent();
                t.data('popover').options.content = html;
            } catch (e) {
                // Try Bootstrap 3
                //t.popover('destroy');
                t.attr('data-content', html);
                t.popover('show');
            }
        },

        /**
         * Get tip content
         * @param {jQuery} t
         * @param {bool} get original tip message (true) or computed tip message (false)
         * @returns {*}
         * @private
         */
        _tipContent: function (t, getOrig) {
            var a;
            try {
                t.data('popover').show();
                a = t.data('popover').tip().find('.popover-content');
            } catch (err) {
                // Try Bootstrap 3
                if (t.data('fabrik-tip-orig') === undefined || !getOrig) {
                    a = jQuery('<div>').append(jQuery(t.data('content')));
                } else {
                    a = jQuery('<div>').append(jQuery(t.data('fabrik-tip-orig')));
                }
            }
            return a;
        },

        /**
         * In 3.1 show/hide error messages in tips - avoids jumpy pages with ajax validations
         */
        removeTipMsg: function () {
            var a, klass = klass ? klass : 'error',
                t = this.tips();
            t = jQuery(t[0]);
            if (t.attr(klass) !== undefined) {
                a = this._tipContent(t, true);
                this._recreateTip(t, a.html());
                t.removeAttr(klass);
                try {
                    t.data('popover').hide();
                } catch (e) {
                    t.popover('hide');
                }
            }
        },

        /**
         * Move the tip using its position top property. Used when inside a modal form that
         * scrolls vertically or modal is moved, and ensures the tip stays attached to the triggering element
         * @param {number} top
         * @param {number} left
         */
        moveTip: function (top, left) {
            var t = this.tips(), tip, origPos, popover;
            if (t.length > 0) {
                t = jQuery(t[0]);
                popover = t.data('popover');
                if (popover) {
                    tip = popover.$tip;
                    if (tip) {
                        origPos = tip.data('origPos');
                        if (origPos === undefined) {
                            origPos = {
                                'top': parseInt(t.data('popover').$tip.css('top'), 10) + top,
                                'left': parseInt(t.data('popover').$tip.css('left'), 10) + left
                            };
                            tip.data('origPos', origPos);
                        }
                        tip.css({
                            'top': origPos.top - top,
                            'left': origPos.left - left
                        });
                    }
                }
            }
        },

        /**
         * Set the failed validation message
         * @param {string} msg
         * @param {string} classname
         */
        setErrorMessage: function (msg, classname) {
            var a, i;
            var classes = ['fabrikValidating', 'fabrikError', 'fabrikSuccess'];
            var container = this.getContainer();
            if (container === false) {
                console.log('Notice: couldn not set error msg for ' + msg + ' no container class found');
                return;
            }
            classes.each(function (c) {
                var r = classname === c ? container.addClass(c) : container.removeClass(c);
            });
            var errorElements = this.getErrorElement();
            errorElements.each(function (e) {
                e.empty();
            });
            switch (classname) {
                case 'fabrikError':
                    Fabrik.loader.stop(this.element);
                    // repeat groups in table format don't have anything to attach a tip msg to!
                    var t = this.tips();
                    if (Fabrik.bootstrapped && t.length !== 0) {
                        this.addTipMsg(msg);
                    } else {
                        a = new Element('a', {
                            'href': '#', 'title': msg, 'events': {
                                'click': function (e) {
                                    e.stop();
                                }
                            }
                        }).adopt(this.alertImage);

                        Fabrik.tips.attach(a);
                    }
                    errorElements[0].adopt(a);

                    container.removeClass('success').removeClass('info').addClass('error');
                    // bs3
                    container.addClass('has-error').removeClass('has-success');

                    // If tmpl has additional error message divs (e.g labels above) then set html msg there
                    if (errorElements.length > 1) {
                        for (i = 1; i < errorElements.length; i++) {
                            errorElements[i].set('html', msg);
                        }
                    }

                    var tabDiv = this.getTabDiv();
                    if (tabDiv) {
                        var tab = this.getTab(tabDiv);
                        if (tab) {
                            tab.addClass('fabrikErrorGroup');
                        }
                    }

                    break;
                case 'fabrikSuccess':
                    container.addClass('success').removeClass('info').removeClass('error');
                    container.addClass('has-success').removeClass('has-error');
                    if (Fabrik.bootstrapped) {
                        Fabrik.loader.stop(this.element);
                        this.removeTipMsg();
                    } else {

                        errorElements[0].adopt(this.successImage);
                        var delFn = function () {
                            errorElements[0].addClass('fabrikHide');
                            container.removeClass('success');
                        };
                        delFn.delay(700);
                    }
                    break;
                case 'fabrikValidating':
                    container.removeClass('success').addClass('info').removeClass('error');
                    //errorElements[0].adopt(this.loadingImage);
                    Fabrik.loader.start(this.element, msg);
                    break;
            }

            this.getErrorElement().removeClass('fabrikHide');
            var parent = this.form;
            if (classname === 'fabrikError' || classname === 'fabrikSuccess') {
                parent.updateMainError();
            }

            var fx = this.getValidationFx();
            switch (classname) {
                case 'fabrikValidating':
                case 'fabrikError':
                    fx.start({
                        'opacity': 1
                    });
                    break;
                case 'fabrikSuccess':
                    fx.start({
                        'opacity': 1
                    }).chain(function () {
                        // Only fade out if its still the success message
                        if (container.hasClass('fabrikSuccess')) {
                            container.removeClass('fabrikSuccess');
                            this.start.delay(700, this, {
                                'opacity'   : 0,
                                'onComplete': function () {
                                    container.addClass('success').removeClass('error');
                                    parent.updateMainError();
                                    classes.each(function (c) {
                                        container.removeClass(c);
                                    });
                                }
                            });
                        }
                    });
                    break;
            }
        },

        setorigId: function () {
            // $$$ added inRepeatGroup option, as repeatCounter > 0 doesn't help
            // if element is in first repeat of a group
            //if (this.options.repeatCounter > 0) {
            if (this.options.inRepeatGroup) {
                var e = this.options.element;
                this.origId = e.substring(0, e.length - 1 - this.options.repeatCounter.toString().length);
            }
        },

        decreaseName: function (delIndex) {
            var element = this.getElement();
            if (typeOf(element) === 'null') {
                return false;
            }
            if (this.hasSubElements()) {
                this._getSubElements().each(function (e) {
                    e.name = this._decreaseName(e.name, delIndex);
                    e.id = this._decreaseId(e.id, delIndex);
                }.bind(this));
            } else {
                if (typeOf(this.element.name) !== 'null') {
                    this.element.name = this._decreaseName(this.element.name, delIndex);
                }
            }
            if (typeOf(this.element.id) !== 'null') {
                this.element.id = this._decreaseId(this.element.id, delIndex);
            }
            if (this.options.repeatCounter > delIndex) {
                this.options.repeatCounter--;
            }
            return this.element.id;
        },

        /**
         * @param    string    name to decrease
         * @param    int        delete index
         * @param    string    name suffix to keep (used for db join autocomplete element)
         */

        _decreaseId: function (n, delIndex, suffix) {
            var suffixFound = false;
            suffix = suffix ? suffix : false;
            if (suffix !== false) {
                if (n.contains(suffix)) {
                    n = n.replace(suffix, '');
                    suffixFound = true;
                }
            }
            var bits = Array.mfrom(n.split('_'));
            var i = bits.getLast();
            if (typeOf(i.toInt()) === 'null') {
                return bits.join('_');
            }
            if (i >= 1 && i > delIndex) {
                i--;
            }
            bits.splice(bits.length - 1, 1, i);
            var r = bits.join('_');
            if (suffixFound) {
                r += suffix;
            }
            this.options.element = r;
            return r;
        },

        /**
         * @param    string    name to decrease
         * @param    int        delete index
         * @param    string    name suffix to keep (used for db join autocomplete element)
         */

        _decreaseName: function (n, delIndex, suffix) {

            var suffixFound = false;
            suffix = suffix ? suffix : false;
            if (suffix !== false) {
                if (n.contains(suffix)) {
                    n = n.replace(suffix, '');
                    suffixFound = true;
                }
            }
            var namebits = n.split('[');
            var i = namebits[1].replace(']', '').toInt();
            if (i >= 1 && i > delIndex) {
                i--;
            }
            i = i + ']';

            namebits[1] = i;
            var r = namebits.join('[');
            if (suffixFound) {
                r += suffix;
            }
            return r;
        },

        setContainerRepeatNum: function(oldRepeatCount, newRepeatCount)
        {
            var container = this.getContainer();
            jQuery(container).removeClass('fb_el_' + this.origId + '_' + oldRepeatCount);
            jQuery(container).addClass('fb_el_' + this.origId + '_' + newRepeatCount);
        },

        setName: function (repeatCount) {
            var element = this.getElement();
            if (typeOf(element) === 'null') {
                return false;
            }
            if (this.hasSubElements()) {
                this._getSubElements().each(function (e) {
                    e.name = this._setName(e.name, repeatCount);
                    e.id = this._setId(e.id, repeatCount);
                }.bind(this));
            } else {
                if (typeOf(this.element.name) !== 'null') {
                    this.element.name = this._setName(this.element.name, repeatCount);
                }
            }
            if (typeOf(this.element.id) !== 'null') {
                this.element.id = this._setId(this.element.id, repeatCount);
            }
            this.setContainerRepeatNum(this.options.repeatCounter, repeatCount);
            this.options.repeatCounter = repeatCount;
            return this.element.id;
        },

        /**
         * @param    string    name to decrease
         * @param    int        delete index
         * @param    string    name suffix to keep (used for db join autocomplete element)
         */

        _setId: function (n, repeatCount, suffix) {
            var suffixFound = false;
            suffix = suffix ? suffix : false;
            var match = '';
            if (suffix !== false) {
                var re = new RegExp(suffix);
                if (n.test(re)) {
                    match = n.match(re)[0];
                    n = n.replace(re, '');
                    suffixFound = true;
                }
            }
            var bits = Array.mfrom(n.split('_'));
            var i = bits.getLast();
            if (typeOf(i.toInt()) === 'null') {
                return n + match;
            }
            if (i.toInt() === repeatCount) {
                return n + match;
            }
            i = repeatCount;
            bits.splice(bits.length - 1, 1, i);
            var r = bits.join('_');
            if (suffixFound) {
                r += match;
            }
            this.options.element = r;
            return r;
        },

        /**
         * @param    string    name to decrease
         * @param    int        delete index
         * @param    string    name suffix to keep (used for db join autocomplete element)
         */

        _setName: function (n, repeatCount, suffix) {

            var suffixFound = false;
            suffix = suffix ? suffix : false;
            var match = '';
            if (suffix !== false) {
                var re = new RegExp(suffix);
                if (n.test(re)) {
                    match = n.match(re)[0];
                    n = n.replace(re, '');
                    suffixFound = true;
                }
            }
            var namebits = n.split('[');
            var i = namebits[1].replace(']', '').toInt();

            if (i.toInt() === repeatCount) {
                return n + match;
            }

            i = repeatCount;
            i = i + ']';

            namebits[1] = i;
            var r = namebits.join('[');
            if (suffixFound) {
                r += match;
            }
            return r;
        },

        /**
         * determine which duplicated instance of the repeat group the
         * element belongs to, returns false if not in a repeat group
         * other wise an integer
         */
        getRepeatNum: function () {
            if (this.options.inRepeatGroup === false) {
                return false;
            }
            return this.element.id.split('_').getLast();
        },

        getBlurEvent: function () {
            return this.element.get('tag') === 'select' ? 'change' : 'blur';
        },

        /**
         * Get focus event
         * @returns {string}
         */
        getFocusEvent: function () {
            return this.element.get('tag') === 'select' ? 'click' : 'focus';
        },

	    getChangeEvent: function () {
		    return this.options.changeEvent;
	    },

        select: function () {
        },
        focus : function () {
            this.removeTipMsg();
        },

        hide: function () {
            var c = this.getContainer();
            if (c) {
                jQuery(c).hide();
                jQuery(c).addClass('fabrikHide');

            }
        },

        show: function () {
            var c = this.getContainer();
            if (c) {
                jQuery(c).show();
                jQuery(c).removeClass('fabrikHide');
            }
        },

        toggle: function () {
            var c = this.getContainer();
            if (c) {
                c.toggle();
            }
        },

        /**
         * Used to find element when form clones a group
         * WYSIWYG text editor needs to return something specific as options.element has to use name
         * and not id.
         */
        getCloneName: function () {
            return this.options.element;
        },

        /**
         * Testing some stuff to try and get maps to display properly when they are in the
         * tab template.  If a map is in a tab which isn't selected on page load, the map
         * will not render properly, and needs to be refreshed when the tab it is in is selected.
         * NOTE that this stuff is very specific to the Fabrik tabs template, using J!'s tabs.
         */

        doTab: function (event) {
            (function () {
                this.redraw();
                if (!Fabrik.bootstrapped) {
                    this.options.tab_dt.removeEvent('click', function (e) {
                        this.doTab(e);
                    }.bind(this));
                }
            }.bind(this)).delay(500);
        },

        getTab: function(tab_div) {
            var tab_dl;
	        if (Fabrik.bootstrapped) {
		        var a = jQuery('a[href$=#' + tab_div.id + ']');
		        tab_dl = a.closest('[data-role=fabrik_tab]');
	        } else {
		        tab_dl = tab_div.getPrevious('.tabs');
	        }
	        if (tab_dl) {
	            return tab_dl;
            }
            return false;
        },

        getTabDiv: function() {
	        var c = Fabrik.bootstrapped ? '.tab-pane' : '.current';
	        var tab_div = this.element.getParent(c);
	        if (tab_div) {
	            return tab_div;
            }
            return false;
        },

        /**
         * Tabs mess with element positioning - some element (googlemaps, file upload) need to redraw themselves
         * when the tab is clicked
         */
        watchTab      : function () {
            var c = Fabrik.bootstrapped ? '.tab-pane' : '.current',
                a, tab_dl;
            var tab_div = this.element.getParent(c);
            if (tab_div) {
                if (Fabrik.bootstrapped) {
                    a = document.getElement('a[href$=#' + tab_div.id + ']');
                    tab_dl = a.getParent('ul.nav');
                    tab_dl.addEvent('click:relay(a)', function (event, target) {
                        this.doTab(event);
                    }.bind(this));
                } else {
                    tab_dl = tab_div.getPrevious('.tabs');
                    if (tab_dl) {
                        this.options.tab_dd = this.element.getParent('.fabrikGroup');
                        if (this.options.tab_dd.style.getPropertyValue('display') === 'none') {
                            this.options.tab_dt = tab_dl.getElementById('group' + this.groupid + '_tab');
                            if (this.options.tab_dt) {
                                this.options.tab_dt.addEvent('click', function (e) {
                                    this.doTab(e);
                                }.bind(this));
                            }
                        }
                    }
                }
            }
        },
        /**
         * When a form/details view is updating its own data, then should we use the raw data or the html?
         * Raw is used for cdd/db join elements
         *
         * @returns {boolean}
         */
        updateUsingRaw: function () {
            return false;
        }
    });

    return window.FbElement;
});
=======
/*! Fabrik */

define(["jquery"],function(jQuery){return window.FbElement=new Class({Implements:[Events,Options],options:{element:null,defaultVal:"",value:"",label:"",editable:!1,isJoin:!1,joinId:0,changeEvent:"change",hasAjaxValidation:!1},initialize:function(e,t){var i=this;if(this.setPlugin(""),t.element=e,this.strElement=e,this.loadEvents=[],this.events=$H({}),this.setOptions(t),this.options.advanced){var n=this.getChangeEvent();jQuery("#"+this.options.element).on("change",{changeEvent:n},function(e){document.id(this.id).fireEvent(e.data.changeEvent,new Event.Mock(document.id(this.id),e.data.changeEvent))})}return Fabrik.on("fabrik.form.element.added",function(e,t,n){n===i&&i.addNewEvent(i.getFocusEvent(),function(){i.removeTipMsg()})}),this.setElement()},destroy:function(){},setPlugin:function(e){"null"!==typeOf(this.plugin)&&""!==this.plugin||(this.plugin=e)},getPlugin:function(){return this.plugin},setElement:function(){return!!document.id(this.options.element)&&(this.element=document.id(this.options.element),this.setorigId(),!0)},get:function(e){if("value"===e)return this.getValue()},getFormElementsKey:function(e){return this.baseElementId=e},attachedToForm:function(){this.setElement(),Fabrik.bootstrapped?(this.alertImage=new Element("i."+this.form.options.images.alert),this.successImage=new Element("i.icon-checkmark",{styles:{color:"green"}})):(this.alertImage=new Asset.image(this.form.options.images.alert),this.alertImage.setStyle("cursor","pointer"),this.successImage=new Asset.image(this.form.options.images.action_check)),jQuery(this.form.options.images.ajax_loader).data("isicon")?this.loadingImage=new Element("span").set("html",this.form.options.images.ajax_loader):this.loadingImage=new Asset.image(this.form.options.images.ajax_loader),this.form.addMustValidate(this)},fireEvents:function(e){this.hasSubElements()?this._getSubElements().each(function(t){Array.mfrom(e).each(function(e){t.fireEvent(e)}.bind(this))}.bind(this)):Array.mfrom(e).each(function(e){this.element&&this.element.fireEvent(e)}.bind(this))},getElement:function(){return"null"===typeOf(this.element)&&(this.element=document.id(this.options.element)),this.element},_getSubElements:function(){var e=this.getElement();return"null"!==typeOf(e)&&(this.subElements=e.getElements(".fabrikinput"),this.subElements)},hasSubElements:function(){return this._getSubElements(),("array"===typeOf(this.subElements)||"elements"===typeOf(this.subElements))&&0<this.subElements.length},unclonableProperties:function(){return["form"]},cloneUpdateIds:function(e){this.element=document.id(e),this.options.element=e},runLoadEvent:function(js,delay){delay=delay||0,"function"===typeOf(js)?js.delay(delay):0===delay?eval(js):function(){console.log("delayed calling runLoadEvent for "+delay),eval(js)}.bind(this).delay(delay)},removeCustomEvents:function(){},renewEvents:function(){this.events.each(function(e,t){this.element.removeEvents(t),e.each(function(e){this.addNewEventAux(t,e)}.bind(this))}.bind(this))},addNewEventAux:function(action,js){this.element.addEvent(action,function(e){"function"===typeOf(js)?js.delay(0,this,this):eval(js)}.bind(this))},addNewEvent:function(e,t){"load"===e?(this.loadEvents.push(t),this.runLoadEvent(t)):(this.element||(this.element=document.id(this.strElement)),this.element&&(Object.keys(this.events).contains(e)||(this.events[e]=[]),this.events[e].push(t),this.addNewEventAux(e,t)))},addEvent:function(e,t){this.addNewEvent(e,t)},validate:function(){},addAjaxValidationAux:function(){var t=this;if(this.element&&this.options.hasAjaxValidation){var e=jQuery(this.element);if(e.hasClass("fabrikSubElementContainer"))return void e.find(".fabrikinput").on(this.getChangeEvent(),function(e){t.form.doElementValidation(e,!0)});e.on(this.getChangeEvent(),function(e){t.form.doElementValidation(e,!1)})}},addAjaxValidation:function(){this.element||(this.element=document.id(this.strElement)),this.element&&(this.options.hasAjaxValidation=!0,this.addAjaxValidationAux())},addNewOption:function(e,t){var n,i=document.id(this.options.element+"_additions").value,s={val:e,label:t};(n=""!==i?JSON.parse(i):[]).push(s);for(var a="[",o=0;o<n.length;o++)a+=JSON.stringify(n[o])+",";a=a.substring(0,a.length-1)+"]",document.id(this.options.element+"_additions").value=a},getLabel:function(){return this.options.label},setLabel:function(e){this.options.label=e;var t=this.getLabelElement();t&&(t[0].textContent=e)},update:function(e){this.getElement()&&(this.options.editable?this.element.value=e:this.element.innerHTML=e)},updateByLabel:function(e){this.update(e)},set:function(e){this.update(e)},getValue:function(){return!!this.element&&(this.options.editable?this.element.value:this.options.value)},reset:function(){!0===this.options.editable&&this.update(this.options.defaultVal),this.resetEvents()},resetEvents:function(){this.loadEvents.each(function(e){this.runLoadEvent(e,100)}.bind(this))},clear:function(){this.update("")},onsubmit:function(e){e&&e(!0)},afterAjaxValidation:function(){},shouldAjaxValidate:function(){return!0},cloned:function(e){this.renewEvents(),this.resetEvents(),this.addAjaxValidationAux();var t=this.getChangeEvent();this.element.hasClass("chzn-done")&&(this.element.removeClass("chzn-done"),this.element.addClass("chzn-select"),this.element.getParent().getElement(".chzn-container").destroy(),jQuery("#"+this.element.id).chosen(),jQuery(this.element).addClass("chzn-done"),jQuery("#"+this.options.element).on("change",{changeEvent:t},function(e){document.id(this.id).fireEvent(e.data.changeEvent,new Event.Mock(e.data.changeEvent,document.id(this.id)))}))},decloned:function(e){this.form.removeMustValidate(this)},getContainer:function(){var e=jQuery(this.element).closest(".fabrikElementContainer");return e=0!==e.length&&e[0],"null"!==typeOf(this.element)&&e},getErrorElement:function(){return this.getContainer().getElements(".fabrikErrorMessage")},getLabelElement:function(){return this.getContainer().getElements(".fabrikLabel")},getValidationFx:function(){return this.validationFX||(this.validationFX=new Fx.Morph(this.getErrorElement()[0],{duration:500,wait:!0})),this.validationFX},tips:function(){var n=this;return jQuery(Fabrik.tips.elements).filter(function(e,t){if(t===n.getContainer()||t.getParent()===n.getContainer())return!0})},addTipMsg:function(e,t){t=t||"error";var n,i,s,a,o=this.tips();if(0!==o.length){void 0===(o=jQuery(o[0])).attr(t)&&(o.attr(t,e),n=this._tipContent(o,!1),(i=jQuery("<div>")).html(n.html()),(s=jQuery("<li>").addClass(t)).html(e),jQuery("<i>").addClass(this.form.options.images.alert).prependTo(s),0===i.find('li:contains("'+jQuery(e).text()+'")').length&&i.find("ul").append(s),a=unescape(i.html()),void 0===o.data("fabrik-tip-orig")&&o.data("fabrik-tip-orig",n.html()),this._recreateTip(o,a));try{o.data("popover").show()}catch(e){o.popover("show")}}},_recreateTip:function(t,n){try{t.data("content",n),t.data("popover").setContent(),t.data("popover").options.content=n}catch(e){t.attr("data-content",n),t.popover("show")}},_tipContent:function(t,n){var i;try{t.data("popover").show(),i=t.data("popover").tip().find(".popover-content")}catch(e){i=void 0!==t.data("fabrik-tip-orig")&&n?jQuery("<div>").append(jQuery(t.data("fabrik-tip-orig"))):jQuery("<div>").append(jQuery(t.data("content")))}return i},removeTipMsg:function(){var e,t=t||"error",n=this.tips();if(void 0!==(n=jQuery(n[0])).attr(t)){e=this._tipContent(n,!0),this._recreateTip(n,e.html()),n.removeAttr(t);try{n.data("popover").hide()}catch(e){n.popover("hide")}}},moveTip:function(e,t){var n,i,s,a=this.tips();0<a.length&&(s=(a=jQuery(a[0])).data("popover"))&&(n=s.$tip)&&(void 0===(i=n.data("origPos"))&&(i={top:parseInt(a.data("popover").$tip.css("top"),10)+e,left:parseInt(a.data("popover").$tip.css("left"),10)+t},n.data("origPos",i)),n.css({top:i.top-e,left:i.left-t}))},setErrorMessage:function(e,t){var n,i,s=["fabrikValidating","fabrikError","fabrikSuccess"],a=this.getContainer();if(!1!==a){s.each(function(e){t===e?a.addClass(e):a.removeClass(e)});var o=this.getErrorElement();switch(o.each(function(e){e.empty()}),t){case"fabrikError":Fabrik.loader.stop(this.element);var r=this.tips();if(Fabrik.bootstrapped&&0!==r.length?this.addTipMsg(e):(n=new Element("a",{href:"#",title:e,events:{click:function(e){e.stop()}}}).adopt(this.alertImage),Fabrik.tips.attach(n)),o[0].adopt(n),a.removeClass("success").removeClass("info").addClass("error"),a.addClass("has-error").removeClass("has-success"),1<o.length)for(i=1;i<o.length;i++)o[i].set("html",e);var l=this.getTabDiv();if(l){var h=this.getTab(l);h&&h.addClass("fabrikErrorGroup")}break;case"fabrikSuccess":if(a.addClass("success").removeClass("info").removeClass("error"),a.addClass("has-success").removeClass("has-error"),Fabrik.bootstrapped)Fabrik.loader.stop(this.element),this.removeTipMsg();else{o[0].adopt(this.successImage);(function(){o[0].addClass("fabrikHide"),a.removeClass("success")}).delay(700)}break;case"fabrikValidating":a.removeClass("success").addClass("info").removeClass("error"),Fabrik.loader.start(this.element,e)}this.getErrorElement().removeClass("fabrikHide");var d=this.form;"fabrikError"!==t&&"fabrikSuccess"!==t||d.updateMainError();var u=this.getValidationFx();switch(t){case"fabrikValidating":case"fabrikError":u.start({opacity:1});break;case"fabrikSuccess":u.start({opacity:1}).chain(function(){a.hasClass("fabrikSuccess")&&(a.removeClass("fabrikSuccess"),this.start.delay(700,this,{opacity:0,onComplete:function(){a.addClass("success").removeClass("error"),d.updateMainError(),s.each(function(e){a.removeClass(e)})}}))})}}else console.log("Notice: couldn not set error msg for "+e+" no container class found")},setorigId:function(){if(this.options.inRepeatGroup){var e=this.options.element;this.origId=e.substring(0,e.length-1-this.options.repeatCounter.toString().length)}},decreaseName:function(t){var e=this.getElement();return"null"!==typeOf(e)&&(this.hasSubElements()?this._getSubElements().each(function(e){e.name=this._decreaseName(e.name,t),e.id=this._decreaseId(e.id,t)}.bind(this)):"null"!==typeOf(this.element.name)&&(this.element.name=this._decreaseName(this.element.name,t)),"null"!==typeOf(this.element.id)&&(this.element.id=this._decreaseId(this.element.id,t)),this.options.repeatCounter>t&&this.options.repeatCounter--,this.element.id)},_decreaseId:function(e,t,n){var i=!1;!1!==(n=n||!1)&&e.contains(n)&&(e=e.replace(n,""),i=!0);var s=Array.mfrom(e.split("_")),a=s.getLast();if("null"===typeOf(a.toInt()))return s.join("_");1<=a&&t<a&&a--,s.splice(s.length-1,1,a);var o=s.join("_");return i&&(o+=n),this.options.element=o},_decreaseName:function(e,t,n){var i=!1;!1!==(n=n||!1)&&e.contains(n)&&(e=e.replace(n,""),i=!0);var s=e.split("["),a=s[1].replace("]","").toInt();1<=a&&t<a&&a--,a+="]",s[1]=a;var o=s.join("[");return i&&(o+=n),o},setContainerRepeatNum:function(e,t){var n=this.getContainer();jQuery(n).removeClass("fb_el_"+this.origId+"_"+e),jQuery(n).addClass("fb_el_"+this.origId+"_"+t)},setName:function(t){var e=this.getElement();return"null"!==typeOf(e)&&(this.hasSubElements()?this._getSubElements().each(function(e){e.name=this._setName(e.name,t),e.id=this._setId(e.id,t)}.bind(this)):"null"!==typeOf(this.element.name)&&(this.element.name=this._setName(this.element.name,t)),"null"!==typeOf(this.element.id)&&(this.element.id=this._setId(this.element.id,t)),this.setContainerRepeatNum(this.options.repeatCounter,t),this.options.repeatCounter=t,this.element.id)},_setId:function(e,t,n){var i=!1,s="";if(!1!==(n=n||!1)){var a=new RegExp(n);e.test(a)&&(s=e.match(a)[0],e=e.replace(a,""),i=!0)}var o=Array.mfrom(e.split("_")),r=o.getLast();if("null"===typeOf(r.toInt()))return e+s;if(r.toInt()===t)return e+s;r=t,o.splice(o.length-1,1,r);var l=o.join("_");return i&&(l+=s),this.options.element=l},_setName:function(e,t,n){var i=!1,s="";if(!1!==(n=n||!1)){var a=new RegExp(n);e.test(a)&&(s=e.match(a)[0],e=e.replace(a,""),i=!0)}var o=e.split("["),r=o[1].replace("]","").toInt();if(r.toInt()===t)return e+s;r=t,r+="]",o[1]=r;var l=o.join("[");return i&&(l+=s),l},getRepeatNum:function(){return!1!==this.options.inRepeatGroup&&this.element.id.split("_").getLast()},getBlurEvent:function(){return"select"===this.element.get("tag")?"change":"blur"},getFocusEvent:function(){return"select"===this.element.get("tag")?"click":"focus"},getChangeEvent:function(){return this.options.changeEvent},select:function(){},focus:function(){this.removeTipMsg()},hide:function(){var e=this.getContainer();e&&(jQuery(e).hide(),jQuery(e).addClass("fabrikHide"))},show:function(){var e=this.getContainer();e&&(jQuery(e).show(),jQuery(e).removeClass("fabrikHide"))},toggle:function(){var e=this.getContainer();e&&e.toggle()},getCloneName:function(){return this.options.element},doTab:function(e){(function(){this.redraw(),Fabrik.bootstrapped||this.options.tab_dt.removeEvent("click",function(e){this.doTab(e)}.bind(this))}).bind(this).delay(500)},getTab:function(e){var t;Fabrik.bootstrapped?t=jQuery("a[href$=#"+e.id+"]").closest("[data-role=fabrik_tab]"):t=e.getPrevious(".tabs");return t||!1},getTabDiv:function(){var e=Fabrik.bootstrapped?".tab-pane":".current",t=this.element.getParent(e);return t||!1},watchTab:function(){var e,t=Fabrik.bootstrapped?".tab-pane":".current",n=this.element.getParent(t);n&&(Fabrik.bootstrapped?(e=document.getElement("a[href$=#"+n.id+"]").getParent("ul.nav")).addEvent("click:relay(a)",function(e,t){this.doTab(e)}.bind(this)):(e=n.getPrevious(".tabs"))&&(this.options.tab_dd=this.element.getParent(".fabrikGroup"),"none"===this.options.tab_dd.style.getPropertyValue("display")&&(this.options.tab_dt=e.getElementById("group"+this.groupid+"_tab"),this.options.tab_dt&&this.options.tab_dt.addEvent("click",function(e){this.doTab(e)}.bind(this)))))},updateUsingRaw:function(){return!1}}),window.FbElement});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
