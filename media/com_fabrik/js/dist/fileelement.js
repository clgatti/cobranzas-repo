<<<<<<< HEAD
/**
 * Created by rob on 18/03/2016.
 */
define(['jquery', 'fab/element'], function (jQuery, FbElement) {
    /**
     * @author Rob
     * contains methods that are used by any element which manipulates files/folders
     */
    window.FbFileElement = new Class({

        Extends   : FbElement,
        ajaxFolder: function () {
            var self = this;
            this.folderlist = [];
            if (this.element === null) {
                return;
            }
            var el = jQuery(this.element.getParent('.fabrikElement'));
            this.breadcrumbs = el.find('.breadcrumbs');
            this.folderdiv = el.find('.folderselect');

            jQuery(this.folderdiv).slideUp({duration: 0});
            this.hiddenField = el.find('.folderpath')[0];
            el.find('.toggle').on('click', function (e) {
                e.preventDefault();
                jQuery(self.folderdiv).slideToggle();
            });
            this.watchAjaxFolderLinks();
        },

        /**
         * Watch our file element links
         */
        watchAjaxFolderLinks: function () {
            var self = this;
            this.folderdiv.find('a').on('click', function (e) {
                e.preventDefault();
                self.browseFolders(jQuery(this));
            });
            this.breadcrumbs.find('a').on('click', function (e) {
                e.preventDefault();
                self.useBreadcrumbs(jQuery(this));
            });
        },

        /**
         * A folder in the folder list has been clicked - add to the breadcrumbs
         * and fire an ajax request to update the folder list
         *
         * @param {jQuery} e
         */
        browseFolders: function (e) {
            this.folderlist.push(e.text());
            var dir = this.options.dir + this.folderlist.join(this.options.ds);
            this.addCrumb(e.text());
            this.doAjaxBrowse(dir);
        },

        /**
         * Update the breadcrumb list
         * @param {jQuery} e Crumb to update to
         */
        useBreadcrumbs: function (e) {
            var self = this, dir,
                c = e[0].className, depth, i, link, home;
            this.folderlist = [];

            // Check we haven't clicked on the home link
            if (c !== '') {
                depth = parseInt(c.replace('crumb', ''), 10);

                // Truncate the folder list to the selected crumb's depth
                for (i = 1; i <= depth; i ++) {
                    link = jQuery(this.breadcrumbs.find('a')[i]);
                    self.folderlist.push(jQuery(link).html());
                }
            }

            home = [this.breadcrumbs.find('a')[0].clone(),
                this.breadcrumbs.find('span')[0].clone()];
            delete this.breadcrumbs.find('a')[0];
            delete this.breadcrumbs.find('span')[0];
            this.breadcrumbs.empty();
            this.breadcrumbs.append(home);
            this.folderlist.each(function (txt) {
                self.addCrumb(txt);
            });
            dir = this.options.dir + this.folderlist.join(this.options.ds);
            this.doAjaxBrowse(dir);
        },

        /**
         * Send an ajax request to get an array of folders. If found append to the
         * folder list
         *
         * @param {string} dir Directory to search in
         */
        doAjaxBrowse: function (dir) {
            var self = this;
            jQuery.ajax({
                url       : '',
                data      : {
                    'dir'       : dir,
                    'option'    : 'com_fabrik',
                    'format'    : 'raw',
                    'task'      : 'plugin.pluginAjax',
                    'plugin'    : 'fileupload',
                    'method'    : 'ajax_getFolders',
                    'element_id': this.options.id
                },
            }).done(function(r) {
                r = JSON.parse(r);
                self.folderdiv.empty();

                r.each(function (folder) {
                    var li = jQuery('<li class="fileupload_folder"><a href="#">' + folder + '</a>');
                    self.folderdiv.append(li);
                });
                if (r.length === 0) {
                    jQuery(self.folderdiv).slideUp({duration: 0});
                } else {
                    jQuery(self.folderdiv).slideUp();
                }
                self.watchAjaxFolderLinks();
                jQuery(self.hiddenField).val('/' + self.folderlist.join('/') + '/');
                self.fireEvent('onBrowse');
            });
        },

        /**
         * Add crumb
         * @param {string} txt
         */
        addCrumb: function (txt) {
            this.breadcrumbs.append(
                jQuery('<a href="#" class="crumb' + this.folderlist.length + '">' + txt + '</a>'),
                jQuery('<span> / </span>')
            );
        }
    });

    return  window.FbFileElement;
});
=======
/*! Fabrik */

define(["jquery","fab/element"],function(a,e){return window.FbFileElement=new Class({Extends:e,ajaxFolder:function(){var i=this;if(this.folderlist=[],null!==this.element){var e=a(this.element.getParent(".fabrikElement"));this.breadcrumbs=e.find(".breadcrumbs"),this.folderdiv=e.find(".folderselect"),a(this.folderdiv).slideUp({duration:0}),this.hiddenField=e.find(".folderpath")[0],e.find(".toggle").on("click",function(e){e.preventDefault(),a(i.folderdiv).slideToggle()}),this.watchAjaxFolderLinks()}},watchAjaxFolderLinks:function(){var i=this;this.folderdiv.find("a").on("click",function(e){e.preventDefault(),i.browseFolders(a(this))}),this.breadcrumbs.find("a").on("click",function(e){e.preventDefault(),i.useBreadcrumbs(a(this))})},browseFolders:function(e){this.folderlist.push(e.text());var i=this.options.dir+this.folderlist.join(this.options.ds);this.addCrumb(e.text()),this.doAjaxBrowse(i)},useBreadcrumbs:function(e){var i,t,s,d,r,n=this,l=e[0].className;if(this.folderlist=[],""!==l)for(t=parseInt(l.replace("crumb",""),10),s=1;s<=t;s++)d=a(this.breadcrumbs.find("a")[s]),n.folderlist.push(a(d).html());r=[this.breadcrumbs.find("a")[0].clone(),this.breadcrumbs.find("span")[0].clone()],delete this.breadcrumbs.find("a")[0],delete this.breadcrumbs.find("span")[0],this.breadcrumbs.empty(),this.breadcrumbs.append(r),this.folderlist.each(function(e){n.addCrumb(e)}),i=this.options.dir+this.folderlist.join(this.options.ds),this.doAjaxBrowse(i)},doAjaxBrowse:function(e){var t=this;a.ajax({url:"",data:{dir:e,option:"com_fabrik",format:"raw",task:"plugin.pluginAjax",plugin:"fileupload",method:"ajax_getFolders",element_id:this.options.id}}).done(function(e){e=JSON.parse(e),t.folderdiv.empty(),e.each(function(e){var i=a('<li class="fileupload_folder"><a href="#">'+e+"</a>");t.folderdiv.append(i)}),0===e.length?a(t.folderdiv).slideUp({duration:0}):a(t.folderdiv).slideUp(),t.watchAjaxFolderLinks(),a(t.hiddenField).val("/"+t.folderlist.join("/")+"/"),t.fireEvent("onBrowse")})},addCrumb:function(e){this.breadcrumbs.append(a('<a href="#" class="crumb'+this.folderlist.length+'">'+e+"</a>"),a("<span> / </span>"))}}),window.FbFileElement});
>>>>>>> 7113086ee2899ae2d54f93ae821f41b16ee26cf3
