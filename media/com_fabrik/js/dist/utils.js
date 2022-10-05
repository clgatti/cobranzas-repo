<<<<<<< HEAD
/*jshint mootools: true */
/*global Fabrik:true, fconsole:true, Joomla:true, $H:true, FbForm:true , define:true */

/**
 * Console.log wrapper
 */
function fconsole() {
    if (typeof (window.console) !== 'undefined') {
        var str = '', i;
        for (i = 0; i < arguments.length; i++) {
            str += arguments[i] + ' ';
        }
        console.log(str);
    }
}


Request.HTML = new Class({

    Extends: Request,

    options: {
        update     : false,
        append     : false,
        evalScripts: true,
        filter     : false,
        headers    : {
            Accept: 'text/html, application/xml, text/xml, */*'
        }
    },

    success: function (text) {
        var options = this.options, response = this.response;

        response.html = text.stripScripts(function (script) {
            response.javascript = script;
        });

        var match = response.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (match) {
            response.html = match[1];
        }
        var temp = new Element('div').set('html', response.html);

        response.tree = temp.childNodes;
        response.elements = temp.getElements(options.filter || '*');

        if (options.filter) {
            response.tree = response.elements;
        }
        if (options.update) {
            var update = document.id(options.update).empty();
            if (options.filter) {
                update.adopt(response.elements);
            } else {

                update.set('html', response.html);
            }
        } else if (options.append) {
            var append = document.id(options.append);
            if (options.filter) {
                response.elements.reverse().inject(append);
            } else {
                append.adopt(temp.getChildren());
            }
        }
        if (options.evalScripts) {
            Browser.exec(response.javascript);
        }

        this.onSuccess(response.tree, response.elements, response.html, response.javascript);
    }
});

/**
 * Keeps the element position in the centre even when scroll/resizing
 */

Element.implement({
    keepCenter: function () {
        this.makeCenter();
        window.addEvent('scroll', function () {
            this.makeCenter();
        }.bind(this));
        window.addEvent('resize', function () {
            this.makeCenter();
        }.bind(this));
    },
    makeCenter: function () {
        var l = jQuery(window).width() / 2 - this.getWidth() / 2;
        var t = window.getScrollTop() + (jQuery(window).height() / 2 - this.getHeight() / 2);
        this.setStyles({
            left: l,
            top : t
        });
    }
});

/**
 * Extend the Array object
 *
 * @param candid
 *            The string to search for
 * @returns Returns the index of the first match or -1 if not found
 */
Array.prototype.searchFor = function (candid) {
    var i;
    for (i = 0; i < this.length; i++) {
        if (this[i].indexOf(candid) === 0) {
            return i;
        }
    }
    return -1;
};

/**
 * Object.keys polyfill for IE8
 */
if (!Object.keys) {
    Object.keys = function (obj) {
        return jQuery.map(obj, function (v, k) {
            return k;
        });
    };
}
=======
/*! Fabrik */

function fconsole(){if(void 0!==window.console){var e,t="";for(e=0;e<arguments.length;e++)t+=arguments[e]+" ";console.log(t)}}Request.HTML=new Class({Extends:Request,options:{update:!1,append:!1,evalScripts:!0,filter:!1,headers:{Accept:"text/html, application/xml, text/xml, */*"}},success:function(e){var t=this.options,n=this.response;n.html=e.stripScripts(function(e){n.javascript=e});var i=n.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);i&&(n.html=i[1]);var s=new Element("div").set("html",n.html);if(n.tree=s.childNodes,n.elements=s.getElements(t.filter||"*"),t.filter&&(n.tree=n.elements),t.update){var r=document.id(t.update).empty();t.filter?r.adopt(n.elements):r.set("html",n.html)}else if(t.append){var o=document.id(t.append);t.filter?n.elements.reverse().inject(o):o.adopt(s.getChildren())}t.evalScripts&&Browser.exec(n.javascript),this.onSuccess(n.tree,n.elements,n.html,n.javascript)}}),Element.implement({keepCenter:function(){this.makeCenter(),window.addEvent("scroll",function(){this.makeCenter()}.bind(this)),window.addEvent("resize",function(){this.makeCenter()}.bind(this))},makeCenter:function(){var e=jQuery(window).width()/2-this.getWidth()/2,t=window.getScrollTop()+(jQuery(window).height()/2-this.getHeight()/2);this.setStyles({left:e,top:t})}}),Array.prototype.searchFor=function(e){var t;for(t=0;t<this.length;t++)if(0===this[t].indexOf(e))return t;return-1},Object.keys||(Object.keys=function(e){return jQuery.map(e,function(e,t){return t})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
