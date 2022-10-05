<<<<<<< HEAD
/**
 * Fabrik Window
 *
 * @copyright: Copyright (C) 2005-2014, fabrikar.com - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/**
 * Window factory
 *
 * @param   object  opts  Options
 *
 * @return  Fabrik.Window
 */

define(['jquery', 'fab/fabrik', 'jQueryUI', 'fab/utils'], function (jQuery, Fabrik, draggable) {
    Fabrik.getWindow = function (opts) {
        if (Fabrik.Windows[opts.id]) {
            if (opts.visible !== false) {
                Fabrik.Windows[opts.id].open();
            }
            //Fabrik.Windows[opts.id].setOptions(opts);
            Fabrik.Windows[opts.id] = jQuery.extend(Fabrik.Windows[opts.id], opts);
            // Fabrik.Windows[opts.id].loadContent();
        } else {
            var type = opts.type ? opts.type : '';
            switch (type) {
                case 'redirect':
                    Fabrik.Windows[opts.id] = new Fabrik.RedirectWindow(opts);
                    break;
                case 'modal':
                    Fabrik.Windows[opts.id] = new Fabrik.Modal(opts);
                    jQuery(window).on('resize', function () {
                        if (opts.id in Fabrik.Windows) {
                            Fabrik.Windows[opts.id].fitToContent(false);
                        }
                    });
                    break;
                case '':
                /* falls through */
                default:
                    Fabrik.Windows[opts.id] = new Fabrik.Window(opts);
                    break;
            }
        }
        return Fabrik.Windows[opts.id];
    };


    Fabrik.Window = new Class({

        Implements: [Events, Options],

        options: {
            id               : 'FabrikWindow',
            data             : {},
            title            : '&nbsp;',
            container        : false,
            loadMethod       : 'html',
            contentURL       : '',
            createShowOverLay: false,
            width            : 300,
            height           : 300,
            loadHeight       : 100,
            expandable       : true,
            offset_x         : null,
            offset_y         : null,
            visible          : true,
            modalId          : '',
            onClose          : function () {
            },
            onOpen           : function () {
            },
            onContentLoaded  : function () {
                this.fitToContent(false);
            },
            destroy          : true
        },

        modal: false,

        classSuffix: '',

        expanded: false,

        initialize: function (options) {
            this.options = jQuery.extend(this.options, options);
            this.makeWindow();
        },

        /**
         * Tabs can resize content area
         */
        watchTabs: function () {
            var self = this;
            jQuery('.nav-tabs a').on('mouseup', function () {
                self.fitToWidth();
                self.drawWindow();
            });
        },

        /**
         * Create a close button
         * @returns {DomNode}
         */
        deleteButton: function () {
            return jQuery(Fabrik.jLayouts['modal-close'])[0];
        },

        /**
         * Get the window's content height
         * @returns {number}
         */
        contentHeight: function () {
            if (this.options.loadMethod === 'iframe') {
                return this.contentWrapperEl.find('iframe').height();
            }
            var w = this.window.find('.contentWrapper');
            // Reset height so we calculate it rather than taking the css value
            w.css('height', 'auto');

            // The mootools getDimensions actually works (jQuery height() is incorrect)
            return w[0].getDimensions(true).height;
        },

        /**
         * Center the modal window
         */
        center: function () {
            var source = this.window,
                pxWidth = this.windowDimensionInPx('width'),
                pxHeight = this.windowDimensionInPx('height'),
                w = source.width(),
                h = source.height(),
                d = {}, yy, xx;
            w = (w === null || w === 'auto') ? pxWidth : w;
            h = (h === null || h === 'auto') ? pxHeight : h;
            w = parseInt(w, 10);
            h = parseInt(h, 10);


            yy = jQuery(window).height() / 2 - (h / 2);

            if ( jQuery.inArray(jQuery(source).css('position'),['fixed','static']) === -1) {
                yy += window.getScroll().y;
            }
            //yy = (window.getSize().y / 2) - (h / 2);
            d.top = this.options.offset_y !== null ? window.getScroll().y + this.options.offset_y : yy;
            //d.top = this.options.offset_y !== null ? this.options.offset_y : yy;

            xx = jQuery(window).width() / 2 + window.getScroll().x - w / 2;
            //xx = (window.getSize().x / 2) - (w / 2);
            d.left = this.options.offset_x !== null ? window.getScroll().x + this.options.offset_x : xx;
            //d.left = this.options.offset_x !== null ? this.options.offset_x : xx;

            // Prototype J template css puts margin left on .modals
            d['margin-left'] = 0;
            source.css(d);
        },

        /**
         * Work out the modal/window width or height either from px or % variable
         *
         * @param   string  dir  Width or height.
         *
         * @return  int  Px width of window
         */
        windowDimensionInPx: function (dir) {
            var coord = dir === 'height' ? 'y' : 'x',
                dim = this.options[dir] + '';
            if (dim.indexOf('%') !== -1) {
                // @TODO fix
                if (dir === 'height') {
                    return Math.floor(jQuery(window).height() * (dim.toFloat() / 100));
                }
                else {
                    return Math.floor(jQuery(window).width() * (dim.toFloat() / 100));
                }
            }
            return parseInt(dim, 10);
        },

        /**
         * Build the window HTML, inject it into the document body
         */
        makeWindow: function () {
            var self = this, cw, ch;
            if (Fabrik.jLayouts[this.options.modalId]) {
                this.window = this.buildWinFromLayout();
                this.window.find('*[data-role="title"]').text(this.options.title);
            } else {
                this.window = this.buildWinViaJS();
            }

            // use fabrikHide to prevent the window displaying momentarily as page loads
            if (!this.options.visible) {
                this.window.addClass('fabrikHide');
            }

            jQuery(document.body).append(this.window);
            this.loadContent();

            if (!this.options.visible) {
                this.window.hide();
                this.window.removeClass('fabrikHide');
            }

            jQuery(this.window).find('*[data-role="close"]').on('click', function (e) {
                e.preventDefault();
                self.close();
            });

            this.window.find('*[data-role="expand"]').on('click', function (e) {
                e.preventDefault();
                self.expand();
            });

            cw = this.windowDimensionInPx('width');
            ch = this.contentHeight();

            this.contentWrapperEl.css({'height': ch, 'width': cw + 'px'});
            var handle = this.window.find('*[data-role="title"]');
            // Bauer asks... why?
            // Rob - because modals should not be resizeable or movable - those are Windows (uncommenting)
            if (!this.options.modal) {

                // Needed for UIKIt overrides as window root is actually its mask
                var source = this.window.find('*[data-draggable]').length === 0 ? this.window : this.window.find('*[data-draggable]');
                source.draggable(
                    {
                        'handle': handle,
                        drag    : function () {
                            Fabrik.fireEvent('fabrik.window.resized', self.window);
                            self.drawWindow();
                        }
                    }
                );

                source.resizable({
                    containment: self.options.container ? jQuery('#' + self.options.container) : null,
                    handles    : {
                        'n' : '.ui-resizable-n',
                        'e' : '.ui-resizable-e',
                        's' : '.ui-resizable-s',
                        'w' : '.ui-resizable-w',
                        'ne': '.ui-resizable-ne',
                        'se': '.ui-resizable-se',
                        'sw': '.ui-resizable-sw',
                        'nw': '.ui-resizable-nw'
                    },

                    resize: function () {
                        Fabrik.fireEvent('fabrik.window.resized', self.window);
                        self.drawWindow();
                    }
                });

                Fabrik.fireEvent('fabrik.window.opened', self.window);
            }

            // Rob - removed this caused any form with a file upload in it to be unscrollable - as we load the window
            // in the background.
            /* Prevent browser window from being scrolled */
           /* jQuery('body').css({'height':'100%','overflow':'hidden'});

            /!* Allow browser window to be scrolled again when modal is released from DOM *!/
            jQuery('div.modal').on('remove', function () {
                jQuery('body').css({'height':'initial','overflow':'initial'});
            });*/

            /* Use form title if modal handlelabel is blank
            * $$$ Rob - this is not going to work with UIKit for example - try not to rely on the DOM classes/markup
            * for this type of thing - assign data-foo attributes to the layouts instead */
            if (jQuery('div.modal-header .handlelabel').text().length === 0) {
                if (jQuery('div.itemContentPadder form').context.title.length) {
                    jQuery('div.modal-header .handlelabel').text(jQuery('div.itemContentPadder form').context.title);
                }
            }

            // Set window dimensions before center - needed for fileupload crop
            this.window.css('width', this.options.width);
            this.window.css('height', parseInt(this.options.height) + this.window.find('*[data-role="title"]').height());

            if (this.options.modal) {
                this.fitToContent(false);
            } else {
                this.center();
            }

            if (this.options.visible) {
                this.open();
            }
        },

        /**
         * Build the window from a JLayout file. Note to ensure that content is unique you must create
         * a unique $modalId in your PHP: FabrikHelperHTML::jLayoutJs($modalId, 'fabrik-modal')
         *
         * @return {jQuery}
         */
        buildWinFromLayout: function () {
            var window = jQuery(Fabrik.jLayouts[this.options.modalId]);
            this.contentEl = window.find('.itemContentPadder');
            this.contentWrapperEl = window.find('div.contentWrapper');

            return window;
        },

        /**
         * Create Window via JS.
         * @deprecated
         * @returns {*}
         */
        buildWinViaJS: function () {
            var draggerC, dragger, expandButton, expandIcon, resizeIcon, label, handleParts = [], self = this,
                directions, i;
            this.window = new Element('div', {
                'id'   : this.options.id,
                'class': 'fabrikWindow ' + this.classSuffix + ' modal'
            });
            var del = this.deleteButton();
            jQuery(del).on('click', function () {
                self.close();
            });
            var hclass = 'handlelabel';
            if (!this.options.modal) {
                hclass += ' draggable';
                draggerC = jQuery('<div />').addClass('bottomBar modal-footer');
                dragger = jQuery('<div />').addClass('dragger');
                // not really compatible with using jQuery resizeable()
                //resizeIcon = jQuery(Fabrik.jLayouts['icon-expand']);
                //resizeIcon.prependTo(dragger);
                draggerC.append(dragger);
            }

            expandIcon = jQuery(Fabrik.jLayouts['icon-full-screen']);
            label = jQuery('<h3 />').addClass(hclass).text(this.options.title);
            jQuery(label).data('role', 'title');
            // turns out you can find() data attrs added with data()
            jQuery(label).attr('data-role', 'title');

            handleParts.push(label);
            if (this.options.expandable && this.options.modal === false) {
                expandButton = jQuery('<a />').addClass('expand').attr({
                    'href': '#'
                }).append(expandIcon);
                handleParts.push(expandButton);
            }

            handleParts.push(del);
            this.handle = this.getHandle().append(handleParts);

            var bottomBarHeight = 0;
            var topBarHeight = 15;
            var contentHeight = parseInt(this.options.height) - bottomBarHeight - topBarHeight;
            if (contentHeight < this.options.loadHeight) {
                contentHeight = this.options.loadHeight;
            }
            this.contentWrapperEl = jQuery('<div />').addClass('contentWrapper').css({
                'height': contentHeight + 'px'
            });
            var itemContent = jQuery('<div />').addClass('itemContent');
            this.contentEl = jQuery('<div />').addClass('itemContentPadder');
            itemContent.append(this.contentEl);
            this.contentWrapperEl.append(itemContent);

            this.window = jQuery(this.window);
            if (this.options.modal) {
                this.window.append([this.handle, this.contentWrapperEl]);
            } else {
                this.window.append([this.handle, this.contentWrapperEl, draggerC]);
                directions = ['n', 'e', 's', 'w', 'nw', 'ne', 'se', 'sw'];
                for (i = 0; i < directions.length; i ++) {
                    this.window.append(jQuery('<div class="ui-resizable-' + directions[i] + ' ui-resizable-handle"></div>'));
                }
            }

            return this.window;
        },

        /**
         * Toggle the window full screen
         */
        expand: function () {
            if (!this.expanded) {
                this.expanded = true;
                this.unexpanded = jQuery.extend({}, this.window.position(),
                    {'width': this.window.width(), 'height': this.window.height()});//this.window.getCoordinates();
                var scroll = window.getScroll();
                this.window.css({'left': scroll.x + 'px', 'top': scroll.y + 'px'});
                this.window.css({'width': jQuery(window).width(), 'height': jQuery(window).height()});
            } else {
                this.window.css({
                    'left': this.unexpanded.left + 'px',
                    'top' : this.unexpanded.top + 'px'
                });
                this.window.css({'width': this.unexpanded.width, 'height': this.unexpanded.height});
                this.expanded = false;
            }
            this.drawWindow();
        },

        getHandle: function () {
            var c = this.handleClass();
            return jQuery('<div />').addClass('draggable ' + c);
        },

        handleClass: function () {
            return 'modal-header';
        },

        loadContent: function () {
            var u, self = this;
            window.fireEvent('tips.hideall');
            switch (this.options.loadMethod) {

                case 'html':
                    if (this.options.content === undefined) {
                        fconsole('no content option set for window.html');
                        this.close();
                        return;
                    }
                    if (typeOf(this.options.content) === 'element') {
                        jQuery(this.options.content).appendTo(this.contentEl);
                    } else {
                        this.contentEl.html(this.options.content);
                    }
                    this.options.onContentLoaded.apply(this);
                    this.watchTabs();

                    break;
                case 'xhr':
                    self.window.width(self.options.width);
                    self.window.height(self.options.height);
                    // for some biaarre reason the onCContentLoaded option sometimes disappears
                    self.onContentLoaded = self.options.onContentLoaded;
                    Fabrik.loader.start(self.contentEl);
                    new jQuery.ajax({
                        'url'   : this.options.contentURL,
                        'data'  : jQuery.extend(this.options.data, {'fabrik_window_id': this.options.id}),
                        'method': 'post',
                    }).success(function (r) {
                        Fabrik.loader.stop(self.contentEl);
                        self.contentEl.append(r);
                        self.watchTabs();
                        self.center();
                        self.onContentLoaded.apply(self);
                        Joomla.loadOptions();
                    });
                    break;
                // Deprecated - causes all sorts of issues with window resizing.
                case 'iframe':
                    var h = parseInt(this.options.height, 10) - 40,
                        scrollX = this.contentEl[0].scrollWidth,
                        w = scrollX + 40 < jQuery(window).width() ? scrollX + 40 : jQuery(window).width();
                    u = this.window.find('.itemContent');
                    Fabrik.loader.start(u);

                    if (this.iframeEl) {
                        this.iframeEl.remove();
                    }
                    this.iframeEl = jQuery('<iframe />').addClass('fabrikWindowIframe').attr({
                        'id'          : this.options.id + '_iframe',
                        'name'        : this.options.id + '_iframe',
                        'class'       : 'fabrikWindowIframe',
                        'src'         : this.options.contentURL,
                        'marginwidth' : 0,
                        'marginheight': 0,
                        'frameBorder' : 0,
                        'scrolling'   : 'auto',
                    }).css({
                        'height': h + 'px',
                        'width' : w
                    }).appendTo(u);
                    this.iframeEl.hide();
                    this.iframeEl.on('load', function () {
                        Fabrik.loader.stop(self.window.find('.itemContent'));
                        self.iframeEl.show();
                        jQuery(self).trigger('onContentLoaded', [self]);
                        self.watchTabs();
                    });
                    break;
            }
        },

        /**
         * Calculate the window title height
         * @returns {number}
         */
        titleHeight: function () {
            var titleHeight = this.window.find('.' + this.handleClass());
            titleHeight = titleHeight.length > 0 ? titleHeight.outerHeight() : 25;
            if (isNaN(titleHeight)) {
                titleHeight = 0;
            }

            return titleHeight;
        },

        /**
         * Calculate the window footer height
         * @returns {Number}
         */
        footerHeight: function () {
            var h = parseInt(this.window.find('.bottomBar').outerHeight(), 10);
            if (isNaN(h)) {
                h = 0;
            }
            return h;
        },

        /**
         * Draw the window
         */
        drawWindow: function () {
            var titleHeight = this.titleHeight(),
                footer = this.footerHeight(),
                h = this.contentHeight();

            // Needed for UIKIt overrides as window root is actually its mask
            var source = this.window.find('*[data-draggable]').length === 0 ? this.window : this.window.find('*[data-draggable]');
            var w = source.width();

            // If content larger than window - set it to the window (minus footer/title)
            if (h > this.window.height()) {
                h = this.window.height() - titleHeight - footer;
            }

            this.contentWrapperEl.css('height', h);
            this.contentWrapperEl.css('width', w - 2);

            // Resize iframe when window is resized
            if (this.options.loadMethod === 'iframe') {
                this.iframeEl.css('height', this.contentWrapperEl[0].offsetHeight);
                this.iframeEl.css('width', this.contentWrapperEl[0].offsetWidth - 10);
            }
        },

        fitToContent: function (scroll, center) {
            scroll = scroll === undefined ? true : scroll;
            center = center === undefined ? true : center;

            if (this.options.loadMethod !== 'iframe') {
                // As iframe content may not be on the same domain we CAN'T
                // guarantee access to its body element to work out its dimensions
                this.fitToHeight();
                this.fitToWidth();
            }
            this.drawWindow();
            if (center) {
                this.center();
            }
            if (!this.options.offset_y && scroll) {
                //new Fx.Scroll(window).toElement(this.window);
                jQuery('body').scrollTop(this.window.offset().top);
            }
        },

        /**
         * Fit the window height to the min of either its content height or the window height
         */
        fitToHeight: function () {
            var testH = this.contentHeight() + this.footerHeight() + this.titleHeight(),
                winHeight = jQuery(window).height(),
                h = testH < winHeight ? testH : winHeight;
            this.window.css('height', h);
        },

        /**
         * Fit the window width to the min of either its content width or the window width
         */
        fitToWidth: function () {
            var contentEl = this.window.find('.itemContent'),
                winWidth = jQuery(window).width(),
                x = contentEl[0].scrollWidth;
            var w = x + 25 < winWidth ? x + 25 : winWidth;
            this.window.css('width', w);
        },

        /**
         * Close the window
         * @param {boolean} destroy window.
         */
        close: function (destroy) {
            destroy = destroy ? destroy : false;
            // By default cant destroy as we want to be able to reuse them (see crop in fileupload element)
            if (this.options.destroy || destroy) {

                // However db join add (in repeating group) has a fit if we don't remove its content
                this.window.remove();
                delete(Fabrik.Windows[this.options.id]);
            } else {
                this.window.fadeOut({duration: 0});
            }
            Fabrik.tips.hideAll();
            //this.fireEvent('onClose', [this]);
            this.options.onClose.apply(this);
            Fabrik.fireEvent('fabrik.window.close', [this]);
        },

        /**
         * Open the window
         * @param {event} e
         */
        open: function (e) {
            if (e) {
                e.stopPropagation();
            }
            //this.window.fadeIn({duration: 0});
            this.window.show();
            //this.fireEvent('onOpen', [this]);
            this.options.onOpen.apply(this);
        }
    });

    Fabrik.Modal = new Class({
        Extends: Fabrik.Window,

        modal: true,

        classSuffix: 'fabrikWindow-modal',

        getHandle: function () {
            return jQuery('<div />').addClass(this.handleClass());
        },

        fitToHeight: function () {

            var testH = this.contentHeight() + this.footerHeight() + this.titleHeight(),
                winHeight = jQuery(window).height(),
                h = testH < winHeight ? testH : winHeight;
            this.window.css('height', Math.max(parseInt(this.options.height), h));
        },

        /**
         * Fit the window width to the min of either its content width or the window width
         */
        fitToWidth: function () {
            this.window.css('width', this.options.width);
        },
    });

    Fabrik.RedirectWindow = new Class({
        Extends   : Fabrik.Window,
        initialize: function (opts) {
            var opts2 = {
                'id'         : 'redirect',
                'title'      : opts.title ? opts.title : '',
                loadMethod   : loadMethod,
                'width'      : opts.width ? opts.width : 300,
                'height'     : opts.height ? opts.height : 320,
                'minimizable': false,
                'collapsible': true,
                'contentURL' : opts.contentURL ? opts.contentURL : ''
            };
            opts2.id = 'redirect';
            opts = jQuery.merge(opts2, opts);
            var loadMethod, url = opts.contentURL;
            //if its a site page load via xhr otherwise load as iframe
            opts.loadMethod = 'xhr';
            if (!url.contains(Fabrik.liveSite) && (url.contains('http://') || url.contains('https://'))) {
                opts.loadMethod = 'iframe';
            } else {
                if (!url.contains('tmpl=component')) {
                    opts.contentURL += url.contains('?') ? '&tmpl=component' : '?tmpl=component';
                }
            }
            this.options = jQuery.extend(this.options, opts);
            this.makeWindow();
        }
    });

    return Fabrik.Window;
});

=======
/*! Fabrik */

define(["jquery","fab/fabrik","jQueryUI","fab/utils"],function(c,f,t){return f.getWindow=function(t){if(f.Windows[t.id])!1!==t.visible&&f.Windows[t.id].open(),f.Windows[t.id]=c.extend(f.Windows[t.id],t);else switch(t.type?t.type:""){case"redirect":f.Windows[t.id]=new f.RedirectWindow(t);break;case"modal":f.Windows[t.id]=new f.Modal(t),c(window).on("resize",function(){t.id in f.Windows&&f.Windows[t.id].fitToContent(!1)});break;case"":default:f.Windows[t.id]=new f.Window(t)}return f.Windows[t.id]},f.Window=new Class({Implements:[Events,Options],options:{id:"FabrikWindow",data:{},title:"&nbsp;",container:!1,loadMethod:"html",contentURL:"",createShowOverLay:!1,width:300,height:300,loadHeight:100,expandable:!0,offset_x:null,offset_y:null,visible:!0,modalId:"",onClose:function(){},onOpen:function(){},onContentLoaded:function(){this.fitToContent(!1)},destroy:!0},modal:!1,classSuffix:"",expanded:!1,initialize:function(t){this.options=c.extend(this.options,t),this.makeWindow()},watchTabs:function(){var t=this;c(".nav-tabs a").on("mouseup",function(){t.fitToWidth(),t.drawWindow()})},deleteButton:function(){return c(f.jLayouts["modal-close"])[0]},contentHeight:function(){if("iframe"===this.options.loadMethod)return this.contentWrapperEl.find("iframe").height();var t=this.window.find(".contentWrapper");return t.css("height","auto"),t[0].getDimensions(!0).height},center:function(){var t,i,n=this.window,o=this.windowDimensionInPx("width"),e=this.windowDimensionInPx("height"),s=n.width(),d=n.height(),h={};s=null===s||"auto"===s?o:s,d=null===d||"auto"===d?e:d,s=parseInt(s,10),d=parseInt(d,10),t=c(window).height()/2-d/2,-1===c.inArray(c(n).css("position"),["fixed","static"])&&(t+=window.getScroll().y),h.top=null!==this.options.offset_y?window.getScroll().y+this.options.offset_y:t,i=c(window).width()/2+window.getScroll().x-s/2,h.left=null!==this.options.offset_x?window.getScroll().x+this.options.offset_x:i,h["margin-left"]=0,n.css(h)},windowDimensionInPx:function(t){var i=this.options[t]+"";return-1!==i.indexOf("%")?"height"===t?Math.floor(c(window).height()*(i.toFloat()/100)):Math.floor(c(window).width()*(i.toFloat()/100)):parseInt(i,10)},makeWindow:function(){var t,i,n=this;f.jLayouts[this.options.modalId]?(this.window=this.buildWinFromLayout(),this.window.find('*[data-role="title"]').text(this.options.title)):this.window=this.buildWinViaJS(),this.options.visible||this.window.addClass("fabrikHide"),c(document.body).append(this.window),this.loadContent(),this.options.visible||(this.window.hide(),this.window.removeClass("fabrikHide")),c(this.window).find('*[data-role="close"]').on("click",function(t){t.preventDefault(),n.close()}),this.window.find('*[data-role="expand"]').on("click",function(t){t.preventDefault(),n.expand()}),t=this.windowDimensionInPx("width"),i=this.contentHeight(),this.contentWrapperEl.css({height:i,width:t+"px"});var o=this.window.find('*[data-role="title"]');if(!this.options.modal){var e=0===this.window.find("*[data-draggable]").length?this.window:this.window.find("*[data-draggable]");e.draggable({handle:o,drag:function(){f.fireEvent("fabrik.window.resized",n.window),n.drawWindow()}}),e.resizable({containment:n.options.container?c("#"+n.options.container):null,handles:{n:".ui-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",ne:".ui-resizable-ne",se:".ui-resizable-se",sw:".ui-resizable-sw",nw:".ui-resizable-nw"},resize:function(){f.fireEvent("fabrik.window.resized",n.window),n.drawWindow()}}),f.fireEvent("fabrik.window.opened",n.window)}0===c("div.modal-header .handlelabel").text().length&&c("div.itemContentPadder form").context.title.length&&c("div.modal-header .handlelabel").text(c("div.itemContentPadder form").context.title),this.window.css("width",this.options.width),this.window.css("height",parseInt(this.options.height)+this.window.find('*[data-role="title"]').height()),this.options.modal?this.fitToContent(!1):this.center(),this.options.visible&&this.open()},buildWinFromLayout:function(){var t=c(f.jLayouts[this.options.modalId]);return this.contentEl=t.find(".itemContentPadder"),this.contentWrapperEl=t.find("div.contentWrapper"),t},buildWinViaJS:function(){var t,i,n,o,e,s,d,h=[],a=this;this.window=new Element("div",{id:this.options.id,class:"fabrikWindow "+this.classSuffix+" modal"});var l=this.deleteButton();c(l).on("click",function(){a.close()});var w="handlelabel";this.options.modal||(w+=" draggable",t=c("<div />").addClass("bottomBar modal-footer"),i=c("<div />").addClass("dragger"),t.append(i)),o=c(f.jLayouts["icon-full-screen"]),e=c("<h3 />").addClass(w).text(this.options.title),c(e).data("role","title"),c(e).attr("data-role","title"),h.push(e),this.options.expandable&&!1===this.options.modal&&(n=c("<a />").addClass("expand").attr({href:"#"}).append(o),h.push(n)),h.push(l),this.handle=this.getHandle().append(h);var r=parseInt(this.options.height)-0-15;r<this.options.loadHeight&&(r=this.options.loadHeight),this.contentWrapperEl=c("<div />").addClass("contentWrapper").css({height:r+"px"});var p=c("<div />").addClass("itemContent");if(this.contentEl=c("<div />").addClass("itemContentPadder"),p.append(this.contentEl),this.contentWrapperEl.append(p),this.window=c(this.window),this.options.modal)this.window.append([this.handle,this.contentWrapperEl]);else for(this.window.append([this.handle,this.contentWrapperEl,t]),s=["n","e","s","w","nw","ne","se","sw"],d=0;d<s.length;d++)this.window.append(c('<div class="ui-resizable-'+s[d]+' ui-resizable-handle"></div>'));return this.window},expand:function(){if(this.expanded)this.window.css({left:this.unexpanded.left+"px",top:this.unexpanded.top+"px"}),this.window.css({width:this.unexpanded.width,height:this.unexpanded.height}),this.expanded=!1;else{this.expanded=!0,this.unexpanded=c.extend({},this.window.position(),{width:this.window.width(),height:this.window.height()});var t=window.getScroll();this.window.css({left:t.x+"px",top:t.y+"px"}),this.window.css({width:c(window).width(),height:c(window).height()})}this.drawWindow()},getHandle:function(){var t=this.handleClass();return c("<div />").addClass("draggable "+t)},handleClass:function(){return"modal-header"},loadContent:function(){var t,i=this;switch(window.fireEvent("tips.hideall"),this.options.loadMethod){case"html":if(void 0===this.options.content)return fconsole("no content option set for window.html"),void this.close();"element"===typeOf(this.options.content)?c(this.options.content).appendTo(this.contentEl):this.contentEl.html(this.options.content),this.options.onContentLoaded.apply(this),this.watchTabs();break;case"xhr":i.window.width(i.options.width),i.window.height(i.options.height),i.onContentLoaded=i.options.onContentLoaded,f.loader.start(i.contentEl),new c.ajax({url:this.options.contentURL,data:c.extend(this.options.data,{fabrik_window_id:this.options.id}),method:"post"}).success(function(t){f.loader.stop(i.contentEl),i.contentEl.append(t),i.watchTabs(),i.center(),i.onContentLoaded.apply(i),Joomla.loadOptions()});break;case"iframe":var n=parseInt(this.options.height,10)-40,o=this.contentEl[0].scrollWidth,e=o+40<c(window).width()?o+40:c(window).width();t=this.window.find(".itemContent"),f.loader.start(t),this.iframeEl&&this.iframeEl.remove(),this.iframeEl=c("<iframe />").addClass("fabrikWindowIframe").attr({id:this.options.id+"_iframe",name:this.options.id+"_iframe",class:"fabrikWindowIframe",src:this.options.contentURL,marginwidth:0,marginheight:0,frameBorder:0,scrolling:"auto"}).css({height:n+"px",width:e}).appendTo(t),this.iframeEl.hide(),this.iframeEl.on("load",function(){f.loader.stop(i.window.find(".itemContent")),i.iframeEl.show(),c(i).trigger("onContentLoaded",[i]),i.watchTabs()})}},titleHeight:function(){var t=this.window.find("."+this.handleClass());return t=0<t.length?t.outerHeight():25,isNaN(t)&&(t=0),t},footerHeight:function(){var t=parseInt(this.window.find(".bottomBar").outerHeight(),10);return isNaN(t)&&(t=0),t},drawWindow:function(){var t=this.titleHeight(),i=this.footerHeight(),n=this.contentHeight(),o=(0===this.window.find("*[data-draggable]").length?this.window:this.window.find("*[data-draggable]")).width();n>this.window.height()&&(n=this.window.height()-t-i),this.contentWrapperEl.css("height",n),this.contentWrapperEl.css("width",o-2),"iframe"===this.options.loadMethod&&(this.iframeEl.css("height",this.contentWrapperEl[0].offsetHeight),this.iframeEl.css("width",this.contentWrapperEl[0].offsetWidth-10))},fitToContent:function(t,i){t=void 0===t||t,i=void 0===i||i,"iframe"!==this.options.loadMethod&&(this.fitToHeight(),this.fitToWidth()),this.drawWindow(),i&&this.center(),!this.options.offset_y&&t&&c("body").scrollTop(this.window.offset().top)},fitToHeight:function(){var t=this.contentHeight()+this.footerHeight()+this.titleHeight(),i=c(window).height(),n=t<i?t:i;this.window.css("height",n)},fitToWidth:function(){var t=this.window.find(".itemContent"),i=c(window).width(),n=t[0].scrollWidth,o=n+25<i?n+25:i;this.window.css("width",o)},close:function(t){t=t||!1,this.options.destroy||t?(this.window.remove(),delete f.Windows[this.options.id]):this.window.fadeOut({duration:0}),f.tips.hideAll(),this.options.onClose.apply(this),f.fireEvent("fabrik.window.close",[this])},open:function(t){t&&t.stopPropagation(),this.window.show(),this.options.onOpen.apply(this)}}),f.Modal=new Class({Extends:f.Window,modal:!0,classSuffix:"fabrikWindow-modal",getHandle:function(){return c("<div />").addClass(this.handleClass())},fitToHeight:function(){var t=this.contentHeight()+this.footerHeight()+this.titleHeight(),i=c(window).height(),n=t<i?t:i;this.window.css("height",Math.max(parseInt(this.options.height),n))},fitToWidth:function(){this.window.css("width",this.options.width)}}),f.RedirectWindow=new Class({Extends:f.Window,initialize:function(t){var i={id:"redirect",title:t.title?t.title:"",loadMethod:void 0,width:t.width?t.width:300,height:t.height?t.height:320,minimizable:!1,collapsible:!0,contentURL:t.contentURL?t.contentURL:"",id:"redirect"},n=(t=c.merge(i,t)).contentURL;t.loadMethod="xhr",n.contains(f.liveSite)||!n.contains("http://")&&!n.contains("https://")?n.contains("tmpl=component")||(t.contentURL+=n.contains("?")?"&tmpl=component":"?tmpl=component"):t.loadMethod="iframe",this.options=c.extend(this.options,t),this.makeWindow()}}),f.Window});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
