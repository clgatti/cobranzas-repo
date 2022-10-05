<<<<<<< HEAD
/**
 * Created by rob on 21/03/2016.
 */

define(['jquery'], function (jQuery) {
    /**
     * This class is temporarily required until this patch makes it into the CMS
     * code: https://github.com/joomla/joomla-platform/pull/1209/files Its purpose
     * is to queue ajax requests so they are not all fired at the same time - which
     * result in db session errors.
     *
     * Currently this is called from: fabriktables.js
     *
     */
    var RequestQueue = new Class({

        Binds: [],

        queue: {}, // object of xhr objects

        initialize: function () {
            this.periodical = this.processQueue.periodical(500, this);
        },

        add: function (xhr) {
            var k = xhr.options.url + Object.toQueryString(xhr.options.data) + Math.random();
            if (!this.queue[k]) {
                this.queue[k] = xhr;
            }
        },

        processQueue: function () {
            if (Object.keys(this.queue).length === 0) {
                return;
            }
            var running = false;

            // Remove successfully completed xhr
            $H(this.queue).each(function (xhr, k) {
                if (xhr.isSuccess()) {
                    delete (this.queue[k]);
                    running = false;
                } else {
                    if (xhr.status === 500) {
                        console.log('Fabrik Request Queue: 500 ' + xhr.xhr.statusText);
                        delete (this.queue[k]);
                        running = false;
                    }
                }
            }.bind(this));

            // Find first xhr not run and completed to run
            $H(this.queue).each(function (xhr, k) {
                if (!xhr.isRunning() && !xhr.isSuccess() && !running) {
                    xhr.send();
                    running = true;
                }
            });
        },

        empty: function () {
            return Object.keys(this.queue).length === 0;
        }
    });
    return RequestQueue;
});
=======
/*! Fabrik */

define(["jquery"],function(e){return new Class({Binds:[],queue:{},initialize:function(){this.periodical=this.processQueue.periodical(500,this)},add:function(e){var t=e.options.url+Object.toQueryString(e.options.data)+Math.random();this.queue[t]||(this.queue[t]=e)},processQueue:function(){if(0!==Object.keys(this.queue).length){var u=!1;$H(this.queue).each(function(e,t){e.isSuccess()?(delete this.queue[t],u=!1):500===e.status&&(console.log("Fabrik Request Queue: 500 "+e.xhr.statusText),delete this.queue[t],u=!1)}.bind(this)),$H(this.queue).each(function(e,t){e.isRunning()||e.isSuccess()||u||(e.send(),u=!0)})}},empty:function(){return 0===Object.keys(this.queue).length}})});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
