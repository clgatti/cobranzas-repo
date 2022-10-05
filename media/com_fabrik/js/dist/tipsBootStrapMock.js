<<<<<<< HEAD
/**
 * Bootstrap Tooltips
 *
 * @copyright: Copyright (C) 2005-2013, fabrikar.com - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/**
 * Enable us to use the same class interface for tips.js but use Bootstrap popovers (Joomla 3)
 */
define(['jquery', 'fab/fabrik'], function (jQuery, Fabrik) {
    var FloatingTips = new Class({
        Implements: [Events],

        Binds: [],

        options: {
            fxProperties: {transition: Fx.Transitions.linear, duration: 500},
            'position'  : 'top',
            'trigger'   : 'hover',
            'content'   : 'title',
            'distance'  : 50,
            'tipfx'     : 'Fx.Transitions.linear',
            'heading'   : '',
            'duration'  : 500,
            'fadein'    : false,
            'notice'    : false,
            'html'      : true,
            showFn      : function (e) {
                e.stop();
                return true;
            },
            hideFn      : function (e) {
                e.stop();
                return true;
            },
            placement   : function (tip, ele) {
                // Custom functions should return top, left, right, bottom to set the tip location
                // Return false to use the default location
                Fabrik.fireEvent('bootstrap.tips.place', [tip, ele]);
                var pos = Fabrik.eventResults.length === 0 ? false : Fabrik.eventResults[0];
                if (pos === false) {
                    var opts = JSON.parse(ele.get('opts', '{}').opts);
                    return opts && opts.position ? opts.position : 'top';
                } else {
                    return pos;
                }
            }
        },

        initialize: function (elements, options) {
            if (Fabrik.bootstrapVersion('modal') >= 3 || typeof(Materialize) === 'object') {
                // We should override any Fabrik3 custom tip settings with bootstrap3 data-foo attributes in JLayouts
                return;
            }
            this.options = jQuery.extend(this.options, options);
            this.options.fxProperties = {transition: eval(this.options.tipfx), duration: this.options.duration};

            // Any tip (not necessarily in this instance has asked for all other tips to be hidden.
            window.addEvent('tips.hideall', function (e, trigger) {
                this.hideOthers(trigger);
            }.bind(this));
            if (elements) {
                this.attach(elements);
            }
        },

        attach: function (elements) {
            if (Fabrik.bootstrapVersion('modal') >= 3 || typeof(Materialize) === 'object') {
                // We should override any Fabrik3 custom tip settings with bootstrap3 data-foo attributes in JLayouts
                this.elements = document.getElements(elements);
                this.elements.each(function (trigger) {
                    jQuery(trigger).popover({html: true});
                });
                return;
            }
            var thisOpts;
            this.elements = jQuery(elements);
            var self = this;
            this.elements.each(function () {
                try {
                    var o = JSON.parse(jQuery(this).attr('opts'));
                    thisOpts = jQuery.type(o) === 'object' ? o : {};
                } catch (e) {
                    thisOpts = {};
                }
                if (thisOpts.position) {
                    thisOpts.defaultPos = thisOpts.position;
                    delete(thisOpts.position);
                }
                var opts = jQuery.extend({}, self.options, thisOpts);
                if (opts.content === 'title') {
                    opts.content = jQuery(this).prop('title');
                    jQuery(this).removeAttr('title');
                } else if (jQuery.type(opts.content) === 'function') {
                    var c = opts.content(this);
                    opts.content = c === null ? '' : c.innerHTML;
                }
                // Should always use the default placement function which can then via the
                // Fabrik event allow for custom tip placement
                opts.placement = self.options.placement;
                opts.title = opts.heading;

                if (jQuery(this).hasClass('tip-small')) {
                    opts.title = opts.content;
                    jQuery(this).tooltip(opts);
                } else {
                    if (!opts.notice) {
                        opts.title += '<button class="close" data-popover="' + this.id + '">&times;</button>';
                    }
                    try {
                        jQuery(this).popoverex(opts);
                    } catch (err) {
                        // Issues loading tips in pop up wins
                        console.log('failed to apply popoverex tips');
                    }
                }
            });
        },

        addStartEvent: function (trigger, evnt) {

        },

        addEndEvent: function (trigger, evnt) {

        },

        getTipContent: function (trigger, evnt) {

        },

        show: function (trigger, evnt) {

        },

        hide: function (trigger, evnt) {

        },

        hideOthers: function (except) {

        },

        hideAll: function () {
            jQuery('.popover').remove();
        }

    });

    /**
     * Extend Bootstrap tip class to allow for additional tip positioning
     */
    (function ($) {
        var PopoverEx = function (element, options) {
            this.init('popover', element, options);
        };

        if ($.fn.popover === undefined) {
            console.log('Fabrik: cant load PopoverEx as jQuery popover not found ' +
                '- could be the J template has overwritten jQuery (and yes Im looking at your Warp themes!)');
            return;
        }
        PopoverEx.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

            constructor: PopoverEx,
            tip        : function () {
                if (!this.$tip) {
                    this.$tip = $(this.options.template);
                    if (this.options.modifier) {
                        this.$tip.addClass(this.options.modifier);
                    }
                }
                return this.$tip;
            },

            show: function () {
                var $tip, inside, pos, actualWidth, actualHeight, placement, tp;
                if (this.hasContent() && this.enabled) {
                    $tip = this.tip();
                    this.setContent();

                    if (this.options.animation) {
                        $tip.addClass('fade');
                    }
                    var p = this.options.placement;
                    placement = typeof p === 'function' ? p.call(this, $tip[0], this.$element[0]) : p;
                    inside = /in/.test(placement);

                    $tip
                        .remove()
                        .css({top: 0, left: 0, display: 'block'})
                        .appendTo(inside ? this.$element : document.body);

                    pos = this.getPosition(inside);

                    actualWidth = $tip[0].offsetWidth;
                    actualHeight = $tip[0].offsetHeight;

                    switch (inside ? placement.split(' ')[1] : placement) {
                        case 'bottom':
                            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2};
                            break;
                        case 'bottom-left':
                            tp = {top: pos.top + pos.height, left: pos.left};
                            placement = 'bottom';
                            break;
                        case 'bottom-right':
                            tp = {top: pos.top + pos.height, left: pos.left + pos.width - actualWidth};
                            placement = 'bottom';
                            break;
                        case 'top':
                            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2};
                            break;
                        case 'top-left':
                            tp = {top: pos.top - actualHeight, left: pos.left};
                            placement = 'top';
                            break;
                        case 'top-right':
                            tp = {top: pos.top - actualHeight, left: pos.left + pos.width - actualWidth};
                            placement = 'top';
                            break;
                        case 'left':
                            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth};
                            break;
                        case 'right':
                            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width};
                            break;
                    }

                    $tip
                        .css(tp)
                        .addClass(placement)
                        .addClass('in');
                }
            }
        });

        $.fn.popoverex = function (option) {
            return this.each(function () {
                var $this = $(this),
                    data = $this.data('popover'),
                    options = typeof option === 'object' && option;
                if (!data) {
                    $this.data('popover', (data = new PopoverEx(this, options)));
                }
                if (typeof option === 'string') {
                    data[option]();
                }
            });
        };
    })(jQuery);

    return FloatingTips;
});
=======
/*! Fabrik */

define(["jquery","fab/fabrik"],function(jQuery,Fabrik){var FloatingTips=new Class({Implements:[Events],Binds:[],options:{fxProperties:{transition:Fx.Transitions.linear,duration:500},position:"top",trigger:"hover",content:"title",distance:50,tipfx:"Fx.Transitions.linear",heading:"",duration:500,fadein:!1,notice:!1,html:!0,showFn:function(t){return t.stop(),!0},hideFn:function(t){return t.stop(),!0},placement:function(t,e){Fabrik.fireEvent("bootstrap.tips.place",[t,e]);var o=0!==Fabrik.eventResults.length&&Fabrik.eventResults[0];if(!1!==o)return o;var i=JSON.parse(e.get("opts","{}").opts);return i&&i.position?i.position:"top"}},initialize:function(elements,options){3<=Fabrik.bootstrapVersion("modal")||"object"==typeof Materialize||(this.options=jQuery.extend(this.options,options),this.options.fxProperties={transition:eval(this.options.tipfx),duration:this.options.duration},window.addEvent("tips.hideall",function(t,e){this.hideOthers(e)}.bind(this)),elements&&this.attach(elements))},attach:function(t){if(3<=Fabrik.bootstrapVersion("modal")||"object"==typeof Materialize)return this.elements=document.getElements(t),void this.elements.each(function(t){jQuery(t).popover({html:!0})});var i;this.elements=jQuery(t);var n=this;this.elements.each(function(){try{var t=JSON.parse(jQuery(this).attr("opts"));i="object"===jQuery.type(t)?t:{}}catch(t){i={}}i.position&&(i.defaultPos=i.position,delete i.position);var e=jQuery.extend({},n.options,i);if("title"===e.content)e.content=jQuery(this).prop("title"),jQuery(this).removeAttr("title");else if("function"===jQuery.type(e.content)){var o=e.content(this);e.content=null===o?"":o.innerHTML}if(e.placement=n.options.placement,e.title=e.heading,jQuery(this).hasClass("tip-small"))e.title=e.content,jQuery(this).tooltip(e);else{e.notice||(e.title+='<button class="close" data-popover="'+this.id+'">&times;</button>');try{jQuery(this).popoverex(e)}catch(t){console.log("failed to apply popoverex tips")}}})},addStartEvent:function(t,e){},addEndEvent:function(t,e){},getTipContent:function(t,e){},show:function(t,e){},hide:function(t,e){},hideOthers:function(t){},hideAll:function(){jQuery(".popover").remove()}}),C,D;return C=jQuery,D=function(t,e){this.init("popover",t,e)},void 0!==C.fn.popover?(D.prototype=C.extend({},C.fn.popover.Constructor.prototype,{constructor:D,tip:function(){return this.$tip||(this.$tip=C(this.options.template),this.options.modifier&&this.$tip.addClass(this.options.modifier)),this.$tip},show:function(){var t,e,o,i,n,s,r;if(this.hasContent()&&this.enabled){t=this.tip(),this.setContent(),this.options.animation&&t.addClass("fade");var p=this.options.placement;switch(s="function"==typeof p?p.call(this,t[0],this.$element[0]):p,e=/in/.test(s),t.remove().css({top:0,left:0,display:"block"}).appendTo(e?this.$element:document.body),o=this.getPosition(e),i=t[0].offsetWidth,n=t[0].offsetHeight,e?s.split(" ")[1]:s){case"bottom":r={top:o.top+o.height,left:o.left+o.width/2-i/2};break;case"bottom-left":r={top:o.top+o.height,left:o.left},s="bottom";break;case"bottom-right":r={top:o.top+o.height,left:o.left+o.width-i},s="bottom";break;case"top":r={top:o.top-n,left:o.left+o.width/2-i/2};break;case"top-left":r={top:o.top-n,left:o.left},s="top";break;case"top-right":r={top:o.top-n,left:o.left+o.width-i},s="top";break;case"left":r={top:o.top+o.height/2-n/2,left:o.left-i};break;case"right":r={top:o.top+o.height/2-n/2,left:o.left+o.width}}t.css(r).addClass(s).addClass("in")}}}),C.fn.popoverex=function(i){return this.each(function(){var t=C(this),e=t.data("popover"),o="object"==typeof i&&i;e||t.data("popover",e=new D(this,o)),"string"==typeof i&&e[i]()})}):console.log("Fabrik: cant load PopoverEx as jQuery popover not found - could be the J template has overwritten jQuery (and yes Im looking at your Warp themes!)"),FloatingTips});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
