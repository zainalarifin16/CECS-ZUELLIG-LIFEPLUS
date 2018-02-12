/* globals define */
define([
    'knockout',
    'jquery',
    './viewmodel',
    'text!../template.html'
], function(ko, $, ComponentViewModel, menuTemplate) {
	'use strict';

    var SitesSDK;

    /**
     * Create a knockout-based component implemention
     * @param args
     * @constructor
     */
    var ComponentImpl = function(args) {
        SitesSDK = args.SitesSDK;
        this.init(args);
    };

    /**
     * Initialize the component with args passed in.
     * @param args
     */
    ComponentImpl.prototype.init = function(args) {

        this.id = args.id;

        // Instantiate VM
        this.viewModel = new ComponentViewModel(args);

        // Setup callbacks.
        this.setupCallbacks();
    };

    /**
     * Setup the callbacks expected by the SDK API
     */
    ComponentImpl.prototype.setupCallbacks = function() {

        /**
         * Callback - render: add the component into the page
         */
        this.render = $.proxy(function(container) {
            var self = this;
            var viewModel = self.viewModel;

            // Append CSS
            SitesSDK.getProperty('assetsURL', function(value) {
                self.assetsURL = value;
                $(container).append("<link type='text/css' rel='stylesheet' href='" + self.assetsURL + "/css/search.css'>")
            });

            // Append template to the container
            $(container).append(menuTemplate);

            // Bind the VM to the template
            //console.log("Binding to: ", $('#' + self.id + " .dynContentSearch"));
            ko.applyBindings(viewModel, $('#' + self.id + " .dynContentSearch")[0]);

            // Look for URL parameter to populate the search term
            try {
                var urlParam = viewModel.urlParam();
                if(viewModel.useUrlParam()==true && urlParam.length>0) {
                    // Get URL params
                    var urlParams = {};
                    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
                        urlParams[key] = value;
                    });

                    var searchTerm = urlParams[urlParam];
                    if (searchTerm && searchTerm.length>0) {
                        viewModel.doSearch(undefined, searchTerm);
                    }
                }
            } catch (err) {
                console.error("Error getting url param:", err);
            }


        }, this);

        /**
         * Callback - update: handle property change event
         */
        this.update = $.proxy(function(args) {
            var self = this;
            // deal with each property changed
            $.each(args.properties, function(index, property) {
                if (property) {
                    if (property.name === 'customSettingsData') {
                        self.viewModel.updateCustomSettingsData(property.value);
                    }
                }
            });
        }, this);
    };

    return ComponentImpl;
});