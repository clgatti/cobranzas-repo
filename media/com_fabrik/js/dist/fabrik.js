<<<<<<< HEAD
/**
 * Various Fabrik JS classes
 *
 * @copyright: Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/**
 * Create the Fabrik name space
 */
define(['jquery', 'fab/loader', 'fab/requestqueue'], function (jQuery, Loader, RequestQueue) {

    var doc = jQuery(document);

    document.addEvent('click:relay(.popover button.close)', function (event, target) {
        var popover = '#' + target.get('data-popover'),
            pEl = document.getElement(popover);
        jQuery(popover).popover('hide');

        if (typeOf(pEl) !== 'null' && pEl.get('tag') === 'input') {
            pEl.checked = false;
        }
    });
    var Fabrik = {
        events: {}
    };

    /**
     * Get the bootstrap version. Returns either 2.x of 3.x
     * @param {string} pluginName Optional plugin name to search fof VERSION property
     * @returns {*}
     */
    Fabrik.bootstrapVersion = function (pluginName) {
        // try the function provided first, punt to 'tooltip' if it doesn't exist (some plugins override 'modal')
        var i, pluginNames = [pluginName || 'modal', 'tooltip'], len = pluginNames.length;
        for (i=0; i<len; ++i) {
            var pluginFn = jQuery.fn[pluginNames[i]];
            if (pluginFn) {
                if (pluginFn.VERSION) {
                    return pluginFn.VERSION.match(/(\d+)\./)[0].toInt();
                }
                else if (pluginFn.Constructor && pluginFn.Constructor.VERSION)
                {
                    return pluginFn.Constructor.VERSION.match(/(\d+)\./)[0].toInt();
                }
            }
        }

        // if we got this far, it's not 3 or 4, so either 2, or not Bootstrap!
        return 2;
    };

    Fabrik.Windows = {};
    Fabrik.loader = new Loader();
    Fabrik.blocks = {};
    Fabrik.periodicals = {};
    Fabrik.addBlock = function (blockid, block) {
        Fabrik.blocks[blockid] = block;
        Fabrik.fireEvent('fabrik.block.added', [block, blockid]);
    };

    /**
     * Search for a block
     *
     * @param {string}  blockid Block id
     * @param {boolean} exact Exact match - default false. When false, form_8 will
     *            match form_8 & form_8_1
     * @param {function} cb Call back function - if supplied a periodical check is set
     *            to find the block and once found then the cb() is run, passing
     *            the block back as an parameter
     *
     * @return mixed false if not found | Fabrik block
     */
    Fabrik.getBlock = function (blockid, exact, cb) {
        cb = cb ? cb : false;
        if (cb) {
            Fabrik.periodicals[blockid] = Fabrik._getBlock.periodical(500, this, [blockid, exact, cb]);
        }
        return Fabrik._getBlock(blockid, exact, cb);
    };

    /**
     * Private Search for a block
     *
     * @param {string} blockid Block id
     * @param {boolean} exact Exact match - default false. When false, form_8 will
     *            match form_8 & form_8_1
     * @param {function} cb Call back function - if supplied a periodical check is set
     *            to find the block and once found then the cb() is run, passing
     *            the block back as an parameter
     *
     * @return {boolean|object} false if not found | Fabrik block
     */
    Fabrik._getBlock = function (blockid, exact, cb) {
        var foundBlockId;
        exact = exact ? exact : false;
        if (Fabrik.blocks[blockid] !== undefined) {

            // Exact match
            foundBlockId = blockid;
        } else {
            if (exact) {
                return false;
            }
            // Say we're editing a form (blockid = form_1_2) - but have simply
            // asked for form_1
            var keys = Object.keys(Fabrik.blocks), i = keys.searchFor(blockid);
            if (i === -1) {
                return false;
            }
            foundBlockId = keys[i];
        }
        if (cb) {
            clearInterval(Fabrik.periodicals[blockid]);
            cb(Fabrik.blocks[foundBlockId]);
        }
        return Fabrik.blocks[foundBlockId];
    };

    doc.on('click', '.fabrik_delete a, .fabrik_action a.delete, .btn.delete', function (e) {
        if (e.rightClick) {
            return;
        }
        Fabrik.watchDelete(e, this);
    });
    doc.on('click', '.fabrik_edit a, a.fabrik_edit', function (e) {
        if (e.rightClick) {
            return;
        }
        Fabrik.watchEdit(e, this);
    });
    doc.on('click', '.fabrik_view a, a.fabrik_view', function (e) {
        if (e.rightClick) {
            return;
        }
        Fabrik.watchView(e, this);
    });

    // Related data links
    document.addEvent('click:relay(*[data-fabrik-view])', function (e, target) {
        if (e.rightClick) {
            return;
        }
        var url, a, title;
        e.preventDefault();
        if (e.target.get('tag') === 'a') {
            a = e.target;
        } else {
            a = typeOf(e.target.getElement('a')) !== 'null' ? e.target.getElement('a') : e.target.getParent('a');
        }

        url = a.get('href');
        url += url.contains('?') ? '&tmpl=component&ajax=1' : '?tmpl=component&ajax=1';
        url += '&format=partial';
        
        // Only one edit window open at the same time.
        $H(Fabrik.Windows).each(function (win, key) {
            win.close();
        });
        title = a.get('title');
        if (!title) {
            title = Joomla.JText._('COM_FABRIK_VIEW');
        }

        var winOpts = {
            'id'        : 'view.' + url,
            'title'     : title,
            'loadMethod': 'xhr',
            'contentURL': url
        };
        Fabrik.getWindow(winOpts);
    });

    Fabrik.removeEvent = function (type, fn) {
        if (Fabrik.events[type]) {
            var index = Fabrik.events[type].indexOf(fn);
            if (index !== -1) {
                delete Fabrik.events[type][index];
            }
        }
    };

    // Events test: replacing window.addEvents as they are reset when you reload
    // mootools in ajax window.
    // need to load mootools in ajax window otherwise Fabrik classes don't
    // correctly load
    Fabrik.addEvent = Fabrik.on = function (type, fn) {
        if (!Fabrik.events[type]) {
            Fabrik.events[type] = [];
        }
        if (!Fabrik.events[type].contains(fn)) {
            Fabrik.events[type].push(fn);
        }
    };

    Fabrik.addEvents = function (events) {
        var event;
        for (event in events) {
            if (events.hasOwnProperty(event)) {
                Fabrik.addEvent(event, events[event]);
            }
        }
        return this;
    };

    Fabrik.fireEvent = Fabrik.trigger = function (type, args, delay) {
        var events = Fabrik.events;

        // An array of returned values from all events.
        this.eventResults = [];
        if (!events || !events[type]) {
            return this;
        }
        args = Array.mfrom(args);
        events[type].each(function (fn) {
            if (delay) {
                this.eventResults.push(fn.delay(delay, this, args));
            } else {
                this.eventResults.push(fn.apply(this, args));
            }
        }, this);
        return this;
    };

    Fabrik.requestQueue = new RequestQueue();

    Fabrik.cbQueue = {
        'google': []
    };

    /**
     * Load the google maps API once
     *
     * @param {boolean|string} k API key
     * @param {function|string} cb Callback method function or function name (assigned to window)
     * @param {string} language optional two letter language code
     */
    Fabrik.loadGoogleMap = function (k, cb, language) {

        var prefix = document.location.protocol === 'https:' ? 'https:' : 'http:';
        var src = prefix + '//maps.googleapis.com/maps/api/js?libraries=places,visualization&callback=Fabrik.mapCb';
        
        if (k !== false) {
            src += '&key=' + k;
        }

        if (language !== '') {
            src += '&language=' + language;
        }

        // Have we previously started to load the Googlemaps script?
        var gmapScripts = Array.mfrom(document.scripts).filter(function (f) {
            return f.src === src;
        });

        if (gmapScripts.length === 0) {
            // Not yet loaded so create a script dom node and inject it into the
            // page.
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            document.body.appendChild(script);

            // Store the callback into the cbQueue, which will be processed
            // after gmaps is loaded.
            Fabrik.cbQueue.google.push(cb);
        } else {
            // We've already added the Google maps js script to the document
            if (Fabrik.googleMap) {
                window[cb]();

                // $$$ hugh - need to fire these by hand, otherwise when
                // re-using a map object, like
                // opening a popup edit for the second time, the map JS will
                // never get these events.

                // window.fireEvent('google.map.loaded');
                // window.fireEvent('google.radius.loaded');

            } else {
                // We've started to load the Google Map code but the callback
                // has not been fired.
                // Cache the call back (it will be fired when Fabrik.mapCb is
                // run.
                Fabrik.cbQueue.google.push(cb);

            }
        }
    };

    /**
     * Called once the google maps script has loaded, will run through any
     * queued callback methods and fire them.
     */
    Fabrik.mapCb = function () {
        Fabrik.googleMap = true;
        var fn, i;
        for (i = 0; i < Fabrik.cbQueue.google.length; i++) {
            fn = Fabrik.cbQueue.google[i];
            if (typeOf(fn) === 'function') {
                fn();
            } else {
                window[fn]();
            }
        }
        Fabrik.cbQueue.google = [];
    };

    /**
     * Globally observe delete links
     * @param {event} e
     * @param {Dom} target
     */
    Fabrik.watchDelete = function (e, target) {
        var l, ref, r;
        r = e.target.getParent('.fabrik_row');
        if (!r) {
            r = Fabrik.activeRow;
        }
        if (r) {
            var chx = r.getElement('input[type=checkbox][name*=id]');
            if (typeOf(chx) !== 'null') {
                chx.checked = true;
            }
            ref = r.id.split('_');
            ref = ref.splice(0, ref.length - 2).join('_');
            l = Fabrik.blocks[ref];
        } else {
            // CheckAll
            ref = e.target.getParent('.fabrikList');
            if (typeOf(ref) !== 'null') {
                // Embedded in list
                ref = ref.id;
                l = Fabrik.blocks[ref];
            } else {
                // Floating
                var wrapper = target.getParent('.floating-tip-wrapper');
                if (wrapper) {
                    var refList = wrapper.retrieve('list');
                    ref = refList.id;
                } else {
                    ref = target.get('data-listRef');
                }

                l = Fabrik.blocks[ref];
                // Deprecated in 3.1 // should only check all for floating tips
                if (l !== undefined && l.options.actionMethod === 'floating' && !this.bootstrapped) {
                    l.form.getElements('input[type=checkbox][name*=id], input[type=checkbox][name=checkAll]')
                        .each(function (c) {
                            c.checked = true;
                        });
                }
            }
        }
        // Get correct list block
        if (!l.submit('list.delete')) {
            e.preventDefault();
        }
    };

    /**
     * Globally watch list edit links
     *
     * @param {event}  e relayed click event
     * @param {Node} target <a> link
     *
     * @since 3.0.7
     */
    Fabrik.watchEdit = function (e, target) {
        Fabrik.openSingleView('form', e, target);
    };

    /**
     * Globally watch list view links
     *
     * @param {event} e relayed click event
     * @param {Node} target <a> link
     *
     * @since 3.0.7
     */
    Fabrik.watchView = function (e, target) {
        Fabrik.openSingleView('details', e, target);
    };

    /**
     * Open a single details/form view
     * @param {string} view - details or form
     * @param {event} e relayed click event
     * @param {Node} target <a> link
     */
    Fabrik.openSingleView = function (view, e, target) {
        var url, loadMethod, a, title, rowId, row, winOpts,
            listRef = jQuery(target).data('list'),
            list = Fabrik.blocks[listRef];

        if (jQuery(target).data('isajax') !== 1) {
            return;
        }

        if (list) {
            if (!list.options.ajax_links) {
                return;
            }

            row = list.getActiveRow(e);
            if (!row || row.length === 0) {
                return;
            }
            list.setActive(row);
            rowId = row.prop('id').split('_').pop();
        }
        else {
            rowId = jQuery(target).data('rowid');
        }

        e.preventDefault();

        if (jQuery(e.target).prop('tagName') === 'A') {
            a = jQuery(e.target);
        } else {
            a = jQuery(e.target).find('a').length > 0 ? jQuery(e.target).find('a') : jQuery(e.target).closest('a');
        }
        url = a.prop('href');

        // if it's a custom link, don't add our junk 'n' stuff
        if (jQuery(target).data('iscustom') !== 1) {
            url += url.contains('?') ? '&tmpl=component&ajax=1' : '?tmpl=component&ajax=1';
            url += '&format=partial';
        }

        title = a.prop('title');
        loadMethod = a.data('loadmethod');
        if (loadMethod === undefined) {
            loadMethod = 'xhr';
        }

        // Only one edit window open at the same time.
        jQuery.each(Fabrik.Windows, function (key, win) {
            win.close();
        });

        winOpts = {
            modalId   : 'ajax_links',
            id        : listRef + '.' + rowId,
            title     : title,
            loadMethod: loadMethod,
            contentURL: url,
            onClose   : function () {
                var k = view + '_' + list.options.formid + '_' + rowId;
                try {
                    Fabrik.blocks[k].destroyElements();
                    Fabrik.blocks[k].formElements = null;
                    Fabrik.blocks[k] = null;
                    delete (Fabrik.blocks[k]);
                    var evnt = (view === 'details') ? 'fabrik.list.row.view.close' : 'fabrik.list.row.edit.close';
                    Fabrik.fireEvent(evnt, [listRef, rowId, k]);
                } catch (e) {
                    console.log(e);
                }
            }
        };

        if (list) {
            // Only set width/height if specified, otherwise default to window defaults
            if (list.options.popup_width !== '') {
                winOpts.width = list.options.popup_width;
            }
            if (list.options.popup_height !== '') {
                winOpts.height = list.options.popup_height;
            }
            winOpts.id = view === 'details' ? 'view.' + winOpts.id : 'add.' + winOpts.id;
            if (list.options.popup_offset_x !== null) {
                winOpts.offset_x = list.options.popup_offset_x;
            }
            if (list.options.popup_offset_y !== null) {
                winOpts.offset_y = list.options.popup_offset_y;
            }
        }
        Fabrik.getWindow(winOpts);
    };

    /**
     * Needed for the wickedpicker time picker, to figure out which element the picker is attached to when closing
     *
     * @param  element  the DOM element the time picker is attached to
     * @param  picker  the picker DOM element
     */
    Fabrik.timePickerClose = function (element, picker) {
        if (element) {
            // find the form
            var form = jQuery(element).closest('form');

            if (form.length > 0) {
                // get our block
                form = Fabrik.getBlock(form[0].id);

                if (form) {
                    // find element container
                    var container = jQuery(element).closest('.fabrikSubElementContainer');

                    if (container.length > 0) {
                        // get the element object
                        var el = form.formElements.get(container[0].id);

                        if (el) {
                            // fire the hideTime method
                            el.hideTime(element, picker);
                        }
                    }
                }
            }
        }
    };

    Fabrik.Array = {
        chunk: function (array, chunk) {
            var i, j, result = [];
            for (i = 0, j = array.length; i < j; i += chunk) {
                result.push(array.slice(i, i + chunk));
                // do whatever
            }
            return result;
        }
    };

    window.fireEvent('fabrik.loaded');
    window.Fabrik = Fabrik;
    return Fabrik;
});
=======
/*! Fabrik */

define(["jquery","fab/loader","fab/requestqueue"],function(f,e,t){var o=f(document);document.addEvent("click:relay(.popover button.close)",function(e,t){var o="#"+t.get("data-popover"),i=document.getElement(o);f(o).popover("hide"),"null"!==typeOf(i)&&"input"===i.get("tag")&&(i.checked=!1)});var u={events:{},bootstrapVersion:function(e){var t,o=[e||"modal","tooltip"],i=o.length;for(t=0;t<i;++t){var n=f.fn[o[t]];if(n){if(n.VERSION)return n.VERSION.match(/(\d+)\./)[0].toInt();if(n.Constructor&&n.Constructor.VERSION)return n.Constructor.VERSION.match(/(\d+)\./)[0].toInt()}}return 2},Windows:{}};return u.loader=new e,u.blocks={},u.periodicals={},u.addBlock=function(e,t){u.blocks[e]=t,u.fireEvent("fabrik.block.added",[t,e])},u.getBlock=function(e,t,o){return(o=o||!1)&&(u.periodicals[e]=u._getBlock.periodical(500,this,[e,t,o])),u._getBlock(e,t,o)},u._getBlock=function(e,t,o){var i;if(t=t||!1,void 0!==u.blocks[e])i=e;else{if(t)return!1;var n=Object.keys(u.blocks),a=n.searchFor(e);if(-1===a)return!1;i=n[a]}return o&&(clearInterval(u.periodicals[e]),o(u.blocks[i])),u.blocks[i]},o.on("click",".fabrik_delete a, .fabrik_action a.delete, .btn.delete",function(e){e.rightClick||u.watchDelete(e,this)}),o.on("click",".fabrik_edit a, a.fabrik_edit",function(e){e.rightClick||u.watchEdit(e,this)}),o.on("click",".fabrik_view a, a.fabrik_view",function(e){e.rightClick||u.watchView(e,this)}),document.addEvent("click:relay(*[data-fabrik-view])",function(e,t){if(!e.rightClick){var o,i,n;e.preventDefault(),o=(i="a"===e.target.get("tag")?e.target:"null"!==typeOf(e.target.getElement("a"))?e.target.getElement("a"):e.target.getParent("a")).get("href"),o+=o.contains("?")?"&tmpl=component&ajax=1":"?tmpl=component&ajax=1",o+="&format=partial",$H(u.Windows).each(function(e,t){e.close()}),(n=i.get("title"))||(n=Joomla.JText._("COM_FABRIK_VIEW"));var a={id:"view."+o,title:n,loadMethod:"xhr",contentURL:o};u.getWindow(a)}}),u.removeEvent=function(e,t){if(u.events[e]){var o=u.events[e].indexOf(t);-1!==o&&delete u.events[e][o]}},u.addEvent=u.on=function(e,t){u.events[e]||(u.events[e]=[]),u.events[e].contains(t)||u.events[e].push(t)},u.addEvents=function(e){var t;for(t in e)e.hasOwnProperty(t)&&u.addEvent(t,e[t]);return this},u.fireEvent=u.trigger=function(e,t,o){var i=u.events;return this.eventResults=[],i&&i[e]&&(t=Array.mfrom(t),i[e].each(function(e){o?this.eventResults.push(e.delay(o,this,t)):this.eventResults.push(e.apply(this,t))},this)),this},u.requestQueue=new t,u.cbQueue={google:[]},u.loadGoogleMap=function(e,t,o){var i=("https:"===document.location.protocol?"https:":"http:")+"//maps.googleapis.com/maps/api/js?libraries=places,visualization&callback=Fabrik.mapCb";if(!1!==e&&(i+="&key="+e),""!==o&&(i+="&language="+o),0===Array.mfrom(document.scripts).filter(function(e){return e.src===i}).length){var n=document.createElement("script");n.type="text/javascript",n.src=i,document.body.appendChild(n),u.cbQueue.google.push(t)}else u.googleMap?window[t]():u.cbQueue.google.push(t)},u.mapCb=function(){var e,t;for(u.googleMap=!0,t=0;t<u.cbQueue.google.length;t++)e=u.cbQueue.google[t],"function"===typeOf(e)?e():window[e]();u.cbQueue.google=[]},u.watchDelete=function(e,t){var o,i,n;if((n=e.target.getParent(".fabrik_row"))||(n=u.activeRow),n){var a=n.getElement("input[type=checkbox][name*=id]");"null"!==typeOf(a)&&(a.checked=!0),i=(i=n.id.split("_")).splice(0,i.length-2).join("_"),o=u.blocks[i]}else if(i=e.target.getParent(".fabrikList"),"null"!==typeOf(i))i=i.id,o=u.blocks[i];else{var r=t.getParent(".floating-tip-wrapper");if(r)i=r.retrieve("list").id;else i=t.get("data-listRef");void 0===(o=u.blocks[i])||"floating"!==o.options.actionMethod||this.bootstrapped||o.form.getElements("input[type=checkbox][name*=id], input[type=checkbox][name=checkAll]").each(function(e){e.checked=!0})}o.submit("list.delete")||e.preventDefault()},u.watchEdit=function(e,t){u.openSingleView("form",e,t)},u.watchView=function(e,t){u.openSingleView("details",e,t)},u.openSingleView=function(o,e,t){var i,n,a,r,l,c,s,p=f(t).data("list"),d=u.blocks[p];if(1===f(t).data("isajax")){if(d){if(!d.options.ajax_links)return;if(!(c=d.getActiveRow(e))||0===c.length)return;d.setActive(c),l=c.prop("id").split("_").pop()}else l=f(t).data("rowid");e.preventDefault(),i=(a="A"===f(e.target).prop("tagName")?f(e.target):0<f(e.target).find("a").length?f(e.target).find("a"):f(e.target).closest("a")).prop("href"),1!==f(t).data("iscustom")&&(i+=i.contains("?")?"&tmpl=component&ajax=1":"?tmpl=component&ajax=1",i+="&format=partial"),r=a.prop("title"),void 0===(n=a.data("loadmethod"))&&(n="xhr"),f.each(u.Windows,function(e,t){t.close()}),s={modalId:"ajax_links",id:p+"."+l,title:r,loadMethod:n,contentURL:i,onClose:function(){var e=o+"_"+d.options.formid+"_"+l;try{u.blocks[e].destroyElements(),u.blocks[e].formElements=null,u.blocks[e]=null,delete u.blocks[e];var t="details"===o?"fabrik.list.row.view.close":"fabrik.list.row.edit.close";u.fireEvent(t,[p,l,e])}catch(e){console.log(e)}}},d&&(""!==d.options.popup_width&&(s.width=d.options.popup_width),""!==d.options.popup_height&&(s.height=d.options.popup_height),s.id="details"===o?"view."+s.id:"add."+s.id,null!==d.options.popup_offset_x&&(s.offset_x=d.options.popup_offset_x),null!==d.options.popup_offset_y&&(s.offset_y=d.options.popup_offset_y)),u.getWindow(s)}},u.timePickerClose=function(e,t){if(e){var o=f(e).closest("form");if(0<o.length&&(o=u.getBlock(o[0].id))){var i=f(e).closest(".fabrikSubElementContainer");if(0<i.length){var n=o.formElements.get(i[0].id);n&&n.hideTime(e,t)}}}},u.Array={chunk:function(e,t){var o,i,n=[];for(o=0,i=e.length;o<i;o+=t)n.push(e.slice(o,o+t));return n}},window.fireEvent("fabrik.loaded"),window.Fabrik=u});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
