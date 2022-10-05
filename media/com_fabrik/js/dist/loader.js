<<<<<<< HEAD
/**
 * Created by rob on 21/03/2016.
 */
define(['jquery'], function (jQuery) {

    /**
     * Loading animation class, either inline next to an element or full screen
     * Paul 20130809 Adding functionality to handle multiple simultaneous spinners
     * on same field.
     */
    var Loader = new Class({

        Binds: [],

        initialize: function () {
            this.spinners = {};
            this.spinnerCount = {};
            this.watchResize();
        },

        sanitizeInline: function (inline) {

            inline = inline ? inline : document.body;

            if (inline instanceof jQuery) {
                if (inline.length === 0) {
                    inline = false;
                } else {
                    inline = inline[0];
                }
            } else {
                if (typeOf(document.id(inline)) === 'null') {
                    inline = false;
                }
            }
            return inline;
        },

        start: function (inline, msg) {
            inline = this.sanitizeInline(inline);

            msg = msg ? msg : Joomla.JText._('COM_FABRIK_LOADING');
            if (!this.spinners[inline]) {
                this.spinners[inline] = new Spinner(inline, {
                    'message': msg
                });
            }
            if (!this.spinnerCount[inline]) {
                this.spinnerCount[inline] = 1;
            } else {
                this.spinnerCount[inline]++;
            }
            // If field is hidden we will get a TypeError
            if (this.spinnerCount[inline] === 1) {
                try {
                    this.spinners[inline].position().show();
                } catch (err) {
                    // Do nothing
                }
            }
        },

        stop: function (inline) {
            inline = this.sanitizeInline(inline);
            if (!this.spinners[inline] || !this.spinnerCount[inline]) {
                return;
            }
            if (this.spinnerCount[inline] > 1) {
                this.spinnerCount[inline]--;
                return;
            }

            var s = this.spinners[inline];

            // Don't keep the spinner once stop is called - causes issue when loading
            // ajax form for 2nd time
            if (Browser.ie && Browser.version < 9) {

                // Well ok we have to in ie8 ;( otherwise it give a js error
                // somewhere in FX
                s.hide();
            } else {
                s.destroy();
                delete this.spinnerCount[inline];
                delete this.spinners[inline];
            }
        },

        watchResize: function () {
            var self = this;
            setInterval(function () {
                jQuery.each(self.spinners, function (index, spinner) {
                    try {

                        var h = Math.max(40, jQuery(spinner.target).height()),
                            w = jQuery(spinner.target).width();
                        jQuery(spinner.element).height(h);
                        if (w !== 0) {
                            jQuery(spinner.element).width(w);
                            jQuery(spinner.element).find('.spinner-content').css('left', w / 2);
                        }

                        spinner.position();
                    } catch (err) {
                        // Do nothing
                    }
                });
            }, 300);
        }
    });

    return Loader;
});
=======
/*! Fabrik */

define(["jquery"],function(s){return new Class({Binds:[],initialize:function(){this.spinners={},this.spinnerCount={},this.watchResize()},sanitizeInline:function(n){return(n=n||document.body)instanceof s?n=0!==n.length&&n[0]:"null"===typeOf(document.id(n))&&(n=!1),n},start:function(n,i){if(n=this.sanitizeInline(n),i=i||Joomla.JText._("COM_FABRIK_LOADING"),this.spinners[n]||(this.spinners[n]=new Spinner(n,{message:i})),this.spinnerCount[n]?this.spinnerCount[n]++:this.spinnerCount[n]=1,1===this.spinnerCount[n])try{this.spinners[n].position().show()}catch(n){}},stop:function(n){if(n=this.sanitizeInline(n),this.spinners[n]&&this.spinnerCount[n])if(1<this.spinnerCount[n])this.spinnerCount[n]--;else{var i=this.spinners[n];Browser.ie&&Browser.version<9?i.hide():(i.destroy(),delete this.spinnerCount[n],delete this.spinners[n])}},watchResize:function(){var n=this;setInterval(function(){s.each(n.spinners,function(n,i){try{var t=Math.max(40,s(i.target).height()),e=s(i.target).width();s(i.element).height(t),0!==e&&(s(i.element).width(e),s(i.element).find(".spinner-content").css("left",e/2)),i.position()}catch(n){}})},300)}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
