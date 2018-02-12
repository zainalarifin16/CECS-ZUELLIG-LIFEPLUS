/* globals define */
define([
    'knockout',
    'jquery',
    'scs-components/comp/component-context'
], function(ko, $, compCtx) {
    'use strict';

    // Keep references to SDK and APIs
    var SitesSDK;

    /**
     * Knockout view model for the menu.
     * @param args
     * @constructor
     */
    var ComponentViewModel = function(args) {
        var self = this;
        self.id = args.id;
        SitesSDK = args.SitesSDK;

        // Define observables for Knockout bindings
        self.initialized = ko.observable(false);
        self.isInitialized = ko.pureComputed(function () {
            return self.initialized();
        }, self);

        self.clearSearch = function() {
            var selector = "#" + self.id + " input[name='searchTerm']";
            $(selector).val("");
        }

        self.doSearch = function(formEl, searchTerm) {
            var selector = "#" + self.id + " input[name='searchTerm']";
            //console.log("selector:", selector);
            if(searchTerm && searchTerm.length>0) {
                $(selector).val(searchTerm);
            }
            searchTerm = $.trim($(selector).val());
            if((searchTerm && searchTerm.length>0) || formEl) {
                //console.log("searchTerm:", searchTerm);
                self.triggerSearch(searchTerm);
            }
        }

        // ViewModel properties
        var properties = [
            'baseQuery',
            'typeFilter',
            'autoTriggerList',
            'useUrlParam',
            'urlParam',
            'placeholderText'
        ];

        // Create observables for properties
        $.each(properties, function(i, propName){
            self[propName] = ko.observable();
        });

        // Handle property changes
        self.updateCustomSettingsData = function(data) {

            //console.log("Component got customSettingsData: ", data);

            // Update observable values
            $.each(properties, function(i, propName){
                self[propName](data[propName]);
            });

            self.initialized(true);
        };

        // Get the current customSettingsData values
        SitesSDK.getProperty('customSettingsData', self.updateCustomSettingsData);

        //  Listen for changes to the settings data.
        SitesSDK.subscribe('SETTINGS_UPDATED', function(settings) {
            if (settings.property === 'customSettingsData') {
                self.updateCustomSettingsData(settings.value);
            }
        });

        // Listen for actions
        SitesSDK.subscribe(SitesSDK.MESSAGE_TYPES.EXECUTE_ACTION, $.proxy(self.executeActionListener, self));
    };

    /**
     * Select a menu item
     * @param itemid
     */
    ComponentViewModel.prototype.triggerSearch = function (searchTerm) {
        var self = this;

        // Build a querystring
        var queryString = "q=" + searchTerm;
        var baseQuery = $.trim(self.baseQuery());
        if(baseQuery.length>0) {
            queryString = baseQuery + "&" + queryString;
        }

        //console.log("Query: ", queryString);

        // Build trigger payload
        var trigger = {
            'triggerName': 'dynamicContentSearch',
            'triggerPayload': {
                'query': queryString,
                'typeFilter': self.typeFilter()
            },
            actions: ['dynContentMenuClear']
        };

        if(self.autoTriggerList()) {
            trigger.actions.push('dynContentListUpdate');
        }

        //console.log("Triggering: ", trigger);
        SitesSDK.publish(SitesSDK.MESSAGE_TYPES.TRIGGER_ACTIONS, trigger);

        $('html,body').animate({scrollTop: $("#" + self.id).offset().top}, 250);

        return false;
    };

    /**
     * Execute announce search
     */
    ComponentViewModel.prototype.executeActionListener = function(args) {
        var self = this;

        var payload = args.payload,
            action = args.action,
            actionName = action && action.actionName;

        if ((actionName === 'dynContentSearchAnnounce')) {
            //console.log("Executing action: " + actionName, args);
            self.doSearch();
        }

        if ((actionName === 'dynContentSearchClear')) {
            //console.log("Executing action: " + actionName, args);
            self.clearSearch();
        }
    };

    // Return the view model
    return ComponentViewModel;
});